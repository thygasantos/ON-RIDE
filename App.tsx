import "react-native-gesture-handler";
import { AuthProvider, AuthContext } from '@/context/AuthContext';
import React, { useContext, useState, useEffect } from "react";
import { View, ActivityIndicator, Platform } from 'react-native';
import * as Updates from "expo-updates";
import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Toast from 'react-native-toast-message';
import AuthStack from '@/navigation/AuthStack';
import AppStack from '@/navigation/AppStack';
import * as Notifications from 'expo-notifications';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";



// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 10,  // Tenta refetch 2 vezes em caso de erro
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function App() {
  const { token, authState } = useContext(AuthContext);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [userData, setUserData] = useState('');


  async function getData() {
    const token = await AsyncStorage.getItem('token');
    console.log(token);
    axios
      .post('https://on-host-api.vercel.app/userdata', { token: token })
      .then(res => {
        console.log(res.data);
        setUserData(res.data.data);
      });
  }

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    async function updateApp() {
      const { isAvailable } = await Updates.checkForUpdateAsync();
      if (isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync(); // depende da sua estratégia
      }
      setIsCheckingUpdates(false);
    }
    updateApp();
  }, []);


  // Register for push notifications
  useEffect(() => {
    async function registerForPushNotifications() {
      try {
        // Set Android notification channel
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }

        // Request permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          Toast.show({
            type: "error",
            text1: "Permissões Negadas",
            text2: "Não foi possível obter permissões para notificações.",
          });
          return;
        }

        // Get the Expo push token
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;
        if (!projectId) {
          Toast.show({
            type: "error",
            text1: "Notification project ID not found.",
          });
          return false;
        }

        // Get Expo push token
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        setExpoPushToken(tokenData.data);
        console.log('Expo Push Token:', tokenData.data);

        // Send token to backend
        if (tokenData.data && userData._id) { // Ensure userId exists
          try {
            const response = await fetch('https://on-host-api.vercel.app/api/register-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: tokenData.data, userId: userData._id }),
            });
            if (!response.ok) {
              throw new Error('Failed to register token with backend');
            }
            console.log('Token registered with backend');
          } catch (error) {
            console.error('Failed to send push token to backend:', error);
            Toast.show({
              type: "error",
              text1: "Erro de Registro",
              text2: "Não foi possível registrar o token de notificação.",
            });
          }
        }
      } catch (error) {
        console.error("Push notification registration failed:", error);
        Toast.show({
          type: "error",
          text1: "Erro de Notificação",
          text2: "Falha ao registrar notificações push.",
        });
      }
    }

    registerForPushNotifications();
  }, [userData]); // Re-run if userId changes

  // Loading state for updates
  if (isCheckingUpdates) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Main app rendering
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <AuthProvider>
          {authState?.isLoading ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          ) : authState?.authenticated ? (
            <AppStack route={undefined} props={{ userId: userData?._id }} />
          ) : (
            <AuthStack props={undefined} />
          )}
          <Toast config={{
            topOffset: Platform.OS === 'ios' ? 60 : 40,
          }} />
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </NavigationContainer>
    </QueryClientProvider>
  );
}

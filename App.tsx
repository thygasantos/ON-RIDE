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
import { OneSignal, LogLevel } from 'react-native-onesignal';
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
      retry: 10,
      staleTime: 1000 * 60 * 5,
    },
  },
});

interface UserData {
  _id?: string;
  [key: string]: any;
}

export default function App() {
  const { token, authState } = useContext(AuthContext);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);

  async function getData() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No token found');
        return;
      }
      
      const response = await axios.post('https://on-host-api.vercel.app/userdata', { token });
      setUserData(response.data.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    async function updateApp() {
      try {
        const { isAvailable } = await Updates.checkForUpdateAsync();
        if (isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.error('Error checking updates:', error);
      } finally {
        setIsCheckingUpdates(false);
      }
    }
    updateApp();
  }, []);

  useEffect(() => {
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    OneSignal.initialize('3fb4d651-5574-4962-aeec-87a7e792db3b');
    OneSignal.Notifications.requestPermission(true);

    const subscriptionListener = OneSignal.User.addEventListener('change', (user) => {
      const playerId = user.pushSubscription.id;
      if (playerId && userData?._id) {
        sendPlayerIdToBackend(playerId, userData._id);
      }
    });

    return () => OneSignal.User.removeEventListener('change', subscriptionListener);
  }, [userData]);

  const sendPlayerIdToBackend = async (playerId: string, userId: string) => {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        await axios.post('https://on-host-api.vercel.app/api/store-player-id', {
          userId,
          playerId,
        }, {
          timeout: 5000, // 5 second timeout
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });
        
        console.log('Player ID successfully sent to backend');
        return;
      } catch (error) {
        retryCount++;
        console.error(`Attempt ${retryCount} failed to send player ID:`, error);
        
        if (retryCount === maxRetries) {
          Toast.show({
            type: 'error',
            text1: 'Notification Setup Failed',
            text2: 'Failed to register for notifications. Please try again later.',
          });
          return;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      }
    }
  };

  if (isCheckingUpdates) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

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

import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

interface AuthProps {
  authState?: { token: string | null; authenticated: boolean | null };

}

export const AuthContext = createContext<AuthProps>({});

export const AuthProvider = ({ children }: any) => {
  const [isLoading, setIsLoading] = useState(true);
  const [globalisLoading, setGlobalIsLoading] = useState(true);
  const [token, setUserToken] = useState({});
  const [userInfo, setUserInfo] = useState({});
  const [error, setError] = useState('');
  const [userData, setUserData] = useState('');
  const [authState, setAuthState] = useState({ authenticated: false, token: null });

  const navigation = useNavigation();


  useEffect(() => {
    async function loadAuth() {
      try {
        const token = await AsyncStorage.getItem("token");
        axios
          .post('https://on-host-api.vercel.app/userdata', { token: token })
          .then(res => {
            if (res.data.status == 'Ok') {
              navigation.navigate({ name: 'home' });
            }
            console.log(res.data);
            setUserData(res.data.data);
          });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: (JSON.stringify(error)),
        })
        console.error("Auth load error:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadAuth();
  }, []);


  const login = (email: string, password: string) => {
    setIsLoading(true);
    console.log(email, password);
    axios
      .post('https://on-host-api.vercel.app/login-user', { email, password })
      .then(res => {
        console.log(res.data);
        console.log(res.data.data, 'usertoken');
        if (res.data.status == 'ok') {
          let userInfo = res.data;
          setAuthState({
            token: res.data.data,
            authenticated: true
          });
          setUserToken(userInfo.data);
          console.log(userInfo, 'userinfo');
          AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
          AsyncStorage.setItem('token', res.data.data);
          AsyncStorage.setItem('isLoggedIn', JSON.stringify(true));
          navigation.navigate({ name: 'home' });
        } else {
          Toast.show({
            type: 'error',
            text1: (JSON.stringify(res.data.data)),
          })
        }
      });
    setIsLoading(false);
  }

  const logout = () => {
    setIsLoading(true);
    setUserToken('null');
    AsyncStorage.removeItem('token');
    setIsLoading(false);
  }
  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let userInfo = await AsyncStorage.getItem('userInfo');
      let userToken = await AsyncStorage.getItem('token');
      userInfo = JSON.parse(userInfo);

      if (userInfo) {
        setUserToken(token);
        setUserInfo(userInfo);
      }
      setIsLoading(false);
      setUserToken(token);
      setIsLoading(false);
    } catch (e) {
      console.log('isLogged in error ${e}');
    }
  }
  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, token, userInfo, authState }} >
      {children}
    </AuthContext.Provider>
  );
};

import { DrawerContent, DrawerContentScrollView, DrawerItem, DrawerItemList } from "@react-navigation/drawer";
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Image, View, Text } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useEffect, useState } from "react";
import { AuthProvider, AuthContext } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import AuthStack from "@/navigation/AuthStack";

export default function CustomDrawerContent(props) {
  const { top, bottom } = useSafeAreaInsets();
  const logout = useContext(AuthContext);
  const navigation = useNavigation();
  console.log(props);
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

  function handleNavigate() {
    navigation.navigate("auth");
  }

  function signOut() {
    AsyncStorage.removeItem('token');
    AsyncStorage.removeItem('isLoggedIn');
    AsyncStorage.removeItem('userType');
    AsyncStorage.removeItem('userInfo');
    AsyncStorage.removeItem('requestId');
    AsyncStorage.removeItem('requestStatus');
    AsyncStorage.removeItem('driverId');
    AsyncStorage.removeItem('driverName');
    AsyncStorage.removeItem('driverPhone');
    AsyncStorage.removeItem('driverPhoto');
    AsyncStorage.removeItem('dlatitude');
    AsyncStorage.removeItem('dlongitude');
    AsyncStorage.removeItem('olatitude');
    AsyncStorage.removeItem('olongitude');
    AsyncStorage.removeItem('pickUpAddress');
    AsyncStorage.removeItem('dropOffAddress');
    navigation.dispatch(DrawerActions.closeDrawer());
    navigation.push('auth');
  }

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView  {...props} scrollEnabled={false} >
        <View style={{ padding: 10, justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
          <Image source={{ uri: userData?.image || 'https://on-host-api.vercel.app/static/default-blue.png' }} style={{ paddingTop: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 100, width: 80, height: 80, }} />
          <Text style={{ padding: 0, alignSelf: 'center', fontWeight: 'bold', fontSize: 25, paddingTop: 0, color: 'black' }}>
            {userData.name}
          </Text>
        </View>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      <View style={{ borderTopColor: '#dde3fe', borderTopWidth: 1, padding: 20, paddingBottom: 20 + bottom }}>
        <Text onPress={() => signOut()} style={{ fontSize: 25, fontWeight: "bold" }}><Ionicons name="power" size={25} /> Logout </Text>
      </View>
    </View>
  );
}

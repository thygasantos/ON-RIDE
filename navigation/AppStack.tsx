import React, { useEffect, useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import CustomDrawer from '@/components/CustomDrawerContent';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

import Dashboard from '@/screens/dashboard/dashboard';
import Profile from '@/screens/dashboard/Profile';
import Messages from '@/screens/dashboard/[userIds]';
import Arrows from '@/screens/dashboard/[userCreated]';
import Settings from '@/screens/dashboard/settings';
import Notifications from '@/screens/dashboard/[userId]';
import Help from '@/screens/dashboard/Help';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import notifications from '@/screens/dashboard/[userId]';
import { useRoute } from '@react-navigation/native';



const Drawer = createDrawerNavigator();

const AppStack = ({ route, props }) => {
  const [id, setId] = useState('');
  const [userData, setUserData] = useState('');
  console.log('params', route.params)

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
    const userData = { _id: id };
    setId(userData._id);

  }, []);



  return (
    <GestureHandlerRootView>
      <Drawer.Navigator
        drawerContent={props => <CustomDrawer {...props} />}
        screenOptions={{
          headerShown: true,
          drawerActiveBackgroundColor: 'blue',
          drawerActiveTintColor: 'white',
          drawerInactiveTintColor: 'black',
          headerStyle: { backgroundColor: 'black' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          drawerStyle: {
            backgroundColor: 'white',
            width: 230
          },
        }}>
        <Drawer.Screen
          name="Dashboard"
          component={Dashboard}
          options={{
            headerShown: false,
            drawerIcon: ({ color }) => (
              <MaterialIcons name="dashboard" size={22} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Requests"
          component={Arrows}
          initialParams={{ userCreated: userData._id }}
          options={{
            drawerIcon: ({ color }) => (
              <Ionicons name="car" size={22} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Messages"
          component={Messages}
          initialParams={{ userIds: userData._id }}
          options={{
            drawerIcon: ({ color }) => (
                <Ionicons name="chatbox-ellipses" size={22} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Notifications"
          component={Notifications}
          initialParams={{ userId: userData._id }}
          options={{
            drawerIcon: ({ color }) => (
                <Ionicons name="notifications" size={22} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Profile"
          component={Profile}
          options={{
            drawerIcon: ({ color }) => (
              <Ionicons name="person" size={22} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Support"
          component={Help}
          options={{
            drawerIcon: ({ color }) => (
              <MaterialIcons name="support-agent" size={22} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Settings"
          component={Settings}
          options={{
            drawerIcon: ({ color }) => (
              <Ionicons name="settings" size={22} color={color} />
            ),
          }}
        />
      </Drawer.Navigator>
    </GestureHandlerRootView>
  );
};

export default AppStack;

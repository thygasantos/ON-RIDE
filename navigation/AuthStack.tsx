import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '@/screens/auth';
import RegisterScreen from '@/screens/Register';
import EditaccountScreen from '@/screens/settings/editaccount';
import EditPassScreen from '@/screens/settings/editpass';
import EditCodeScreen from '@/screens/settings/editcode';
import ChatScreen from '@/screens/messages/chatscreen';
import AboutScreen from '@/screens/settings/about';
import privacyScreen from '@/screens/settings/privacy';
import Confirm from '@/screens/request/confirm';
import Category from '@/screens/request/category';
import Seach from '@/screens/request/seach';
import Cancel from '@/screens/request/cancel';
import Feed from '@/screens/request/feed';
import Options from '@/screens/request/options';
import Vehicles from '@/screens/settings/[Vehicles]';
import AddVehicles from '@/screens/settings/AddAuto';


import AppStack from './AppStack';
import CallStack from './CallStack';
import { Text } from 'react-native';


const Stack = createNativeStackNavigator();

const AuthStack = ({props}) => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="auth" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="home" component={AppStack} />
      <Stack.Screen name="Category" component={Category} />
      <Stack.Screen name="Confirm" component={Confirm} />
      <Stack.Screen name="Seach" component={Seach} />
      <Stack.Screen name="Cancel" component={Cancel} />
      <Stack.Screen name="Feed" component={Feed} options={{ title: 'Feed Requests',headerStyle: { backgroundColor: 'black' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' }, headerShown: true  }}  />
      <Stack.Screen name="Options" component={Options} options={{ title: 'Options',headerStyle: { backgroundColor: 'black' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' }, headerShown: true  }}  />
      <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerStyle: { backgroundColor: 'black' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' }, headerShown: true }} />
      <Stack.Screen name="editaccount" component={EditaccountScreen}  options={{ title: 'Edit Account', headerStyle: { backgroundColor: 'black' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' }, headerShown: true }} />
      <Stack.Screen name="editpass" component={EditPassScreen} options={{ title: 'Edit Password',headerStyle: { backgroundColor: 'black' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' }, headerShown: true  }} />
      <Stack.Screen name="Vehicles" component={Vehicles} options={{ title: 'Vehicles',headerStyle: { backgroundColor: 'black' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' }, headerShown: true  }} />
      <Stack.Screen name="AddVehicles" component={AddVehicles} options={{ title: 'Add Vehicles',headerStyle: { backgroundColor: 'black' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' }, headerShown: true  }} />
      <Stack.Screen name="about" component={AboutScreen} options={{ title: 'About',headerStyle: { backgroundColor: 'black' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' }, headerShown: true  }} />
      <Stack.Screen name="privacy" component={privacyScreen} options={{ title: 'Privacy Policy', headerStyle: { backgroundColor: 'black' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' }, headerShown: true  }} />
      <Stack.Screen name="PaymentSuccess" component={() => <Text>Payment Success</Text>} />
      <Stack.Screen name="PaymentCancel" component={() => <Text>Payment Cancelled</Text>} />
    </Stack.Navigator>
  );
};

export default AuthStack;

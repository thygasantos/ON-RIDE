import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Category from '@/screens/request/category';
import Confirm from '@/screens/request/confirm';
import Seach from '@/screens/request/seach';
import Drive from '@/screens/request/drive';
import Cancel from '@/screens/request/cancel';
import AppStack from './AppStack';

const Stack = createNativeStackNavigator();

const CallStack = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="category" component={Category} />
      <Stack.Screen name="confirm" component={Confirm} />
      <Stack.Screen name="seach" component={Seach} />
      <Stack.Screen name="drive" component={Drive} />
      <Stack.Screen name="cancel" component={Cancel} />
    </Stack.Navigator>
  );
};

export default CallStack;
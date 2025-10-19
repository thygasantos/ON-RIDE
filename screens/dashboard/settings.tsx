import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import React, { useState } from "react";
import { Ionicons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';
import { Switch } from 'react-native-paper';
import editaccount from '@/screens/settings/editaccount';
import editpass from '@/screens/settings/editpass';
import Vehicles from '@/screens/settings/Vehicles';
import editcode from '@/screens/settings/editcode';
import about from '@/screens/settings/about';
import privacy from '@/screens/settings/privacy';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function settings({navigation}) {
  const [location, setLocation] = useState(true);
  const onToggleSwitch = () => setLocation(!location);

  return (
    <View style={{flex:1, justifyContent:'flex-start', alignItems:'center', backgroundColor: 'black', }}>
       <View style={{ marginTop: 1, alignItems: 'center',  alignSelf: 'center' }}>
        <TouchableOpacity 
          onPress={() => navigation.push("editaccount")} 
          style={{
            width: SCREEN_WIDTH * 0.9, 
            height: 60, 
            backgroundColor: 'white',
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 15,
            marginBottom: 10
          }}
        >
          <MaterialIcons style={{ marginRight: 10 }} size={40} name='manage-accounts' color="black"/>
          <Text style={{ fontWeight: 'bold', fontSize: 25, flex: 1 }}>Edit Account</Text>
          <AntDesign size={40} name='right' color="black"/>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.push("editpass")} 
          style={{
            width: SCREEN_WIDTH * 0.9, 
            height: 60, 
            backgroundColor: 'white',
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 15,
            marginBottom: 10
          }}
        >
          <MaterialCommunityIcons style={{ marginRight: 10 }} size={40} name='form-textbox-password' color="black"/>
          <Text style={{ fontWeight: 'bold', fontSize: 25, flex: 1 }}>Edit Password</Text>
          <AntDesign size={40} name='right' color="black"/>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate(Vehicles)} 
          style={{
            width: SCREEN_WIDTH * 0.9, 
            height: 60, 
            backgroundColor: 'white',
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 15,
            marginBottom: 10
          }}
        >
          <MaterialCommunityIcons style={{ marginRight: 10 }} size={40} name='car-cog' color="black"/>
          <Text style={{ fontWeight: 'bold', fontSize: 25, flex: 1 }}>Vehicles</Text>
          <AntDesign size={40} name='right' color="black"/>
        </TouchableOpacity>

        <View 
          style={{
            width: SCREEN_WIDTH * 0.9, 
            height: 60, 
            backgroundColor: 'white',
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 15,
            marginBottom: 60
          }}
        >
          <Entypo style={{ marginRight: 10 }} size={40} name='location' color="black"/>
          <Text style={{ fontWeight: 'bold', fontSize: 25, flex: 1 }}>Location</Text>
          <Switch value={location} onValueChange={onToggleSwitch}/>
        </View>

        <TouchableOpacity 
          onPress={() => navigation.push("about")} 
          style={{
            width: SCREEN_WIDTH * 0.9, 
            height: 60, 
            backgroundColor: 'white',
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 15,
            marginBottom: 10
          }}
        >
          <Entypo style={{ marginRight: 10 }} size={40} name='info-with-circle' color="black"/>
          <Text style={{ fontWeight: 'bold', fontSize: 25, flex: 1 }}>About</Text>
          <AntDesign size={40} name='right' color="black"/>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.push("privacy")} 
          style={{
            width: SCREEN_WIDTH * 0.9, 
            height: 60, 
            backgroundColor: 'white',
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 15,
            marginBottom: 10
          }}
        >
          <MaterialIcons style={{ marginRight: 10 }} size={40} name='privacy-tip' color="black"/>
          <Text style={{ fontWeight: 'bold', fontSize: 25, flex: 1 }}>Privacy Policy</Text>
          <AntDesign size={40} name='right' color="black"/>
        </TouchableOpacity>


       </View>
    </View>
  )
}

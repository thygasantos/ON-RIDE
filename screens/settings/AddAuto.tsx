import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, View, Button, Alert } from "react-native";
import { Avatar,  Card, Modal, PaperProvider, Portal } from "react-native-paper";
import { FloatingLabelInput } from 'react-native-floating-label-input';


const LeftContent = (props) => <Avatar.Icon {...props} icon="car" />;

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Notifications({navigation}) {
    const [visible, setVisible] = React.useState(false);
    const [placa, setPlaca] = useState(''); 
    const [cor, setCor] = useState(''); 
    const [modelo, setModelo] = useState(''); 
    const [ano, setAno] = useState('');
    const [userData, setUserData] = useState('');
    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);
    const containerStyle = {backgroundColor: 'white', padding: 20,margin:10};


  async function getData() {
    const token = await AsyncStorage.getItem('token');
    console.log(token);
    axios
      .post('https://on-host-api.vercel.app/userdata', {token: token})
      .then(res => {
        console.log(res.data);
        setUserData(res.data.data);
      });
  }

  useEffect(() => {
      getData();
  }, []);


  function handleVehicle(){
    const formData = {
      userId: userData._id,
      modelo: modelo,
      cor: cor,
      placa: placa,
      ano: ano,
    };
   if ( modelo === '' || cor === '' || placa === '' ) {
      alert("All fields are required");
      return;
  }
    axios
    .post('https://on-host-api.vercel.app/add-vehicle', formData)
    .then(res => {
      console.log(res.data);
      navigation.navigate({ name : 'Vehicles' });
    if (res.data.status == 'OK') {
      alert('Add Successfull!!');
    } else {
      alert(JSON.stringify(res.data));
    }
      })
    .catch(e => console.log(e));
  };


  return (
    <View style={styles.container}>
     <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#E0E0E0", paddingVertical: 5, borderRadius: 50, marginTop: 30, }} >
      <FloatingLabelInput labelStyles={{ paddingBottom: 20,  }} containerStyles={{ paddingHorizontal: 10, borderRadius: 50, width: '80%', }} label={'Model'}  style={{ borderRadius:50, fontWeight: "bold", textAlign: "center", color: "gray", width: 300, fontSize: modelo ? 30 : 30, }}
        placeholder='Model' value={modelo} defaultValue='name' onChange={e => setModelo(e.nativeEvent.text)}
          /> 
          </View>
                    
         <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#E0E0E0", paddingVertical: 5, borderRadius: 50, marginTop: 30, }} >
           <FloatingLabelInput labelStyles={{ paddingBottom: 20,  }} containerStyles={{ paddingHorizontal: 10, borderRadius: 50, width: '80%', }} label={'Color'}  style={{ borderRadius:50, fontWeight: "bold", textAlign: "center", color: "gray", width: 300, fontSize: cor ? 30 : 30, }}
            placeholder='color' value={cor}   onChange={e => setCor(e.nativeEvent.text)} 
             /> 
             </View>    

             <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#E0E0E0", paddingVertical: 5, borderRadius: 50, marginTop: 30, }} >
           <FloatingLabelInput labelStyles={{ paddingBottom: 20,  }} containerStyles={{ paddingHorizontal: 10, borderRadius: 50, width: '80%', }} label={'AAAA-0000'}  style={{ borderRadius:50, fontWeight: "bold", textAlign: "center", color: "gray", width: 300, fontSize: placa ? 30 : 30, }}
            placeholder='AAAA-0000' value={placa}   onChange={e => setPlaca(e.nativeEvent.text)} 
             /> 
             </View>     
       <View style={{ marginTop: 60, borderRadius: 50 }} >
      <Button onPress={handleVehicle
        
      }  title="Add Vehicle" />  
     </View> 
                   
   </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
    padding: 10,

  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",

  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
    backgroundColor: "black",

  },
});

import axios from 'axios';
import React, { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import {  Dimensions, StyleSheet, Text, View } from 'react-native';
import { Modal, Portal, Button, PaperProvider, TextInput , List } from 'react-native-paper';
import * as Location from 'expo-location'
import { requestForegroundPermissionsAsync, getCurrentPositionAsync, watchPositionAsync, LocationObject, LocationAccuracy } from "expo-location";
import userData from '@/screens/settings/editaccount';
import Toast from 'react-native-toast-message';


const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;


const Help = ({ route, navigation }) => {

  const [name, setName] = useState(''); 
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [dns, setIpAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [moeda, setCurrency] = useState(''); 
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [userData, setUserData] = useState('');
  const [expanded, setExpanded] = useState(true);

  const handlePress = () => setExpanded(!expanded);


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

  const [visible, setVisible] = React.useState(false);
  const [note,setNote]=useState('');
  const [notes,setNotes]=useState([]);


  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const containerStyle = {backgroundColor: 'white', padding: 20,margin:10};


  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        setIpAddress(data.ip);
      } catch (error) {
        console.error(error);
      }
    };
    fetchIp();
  }, []);

  
  async function requestLocationPermissions(){
    const { granted } = await requestForegroundPermissionsAsync();

    if(granted){
      const currentPosition = await getCurrentPositionAsync();
      setLocation(currentPosition);
      console.log("localização = >", currentPosition);
    }

   }
  
   useEffect(() => {
    requestLocationPermissions();
    
      }, []);

 useEffect(() => {
  watchPositionAsync({
    accuracy: Location.LocationAccuracy.Highest,
    timeInterval: 1000,
    distanceInterval: 1
  },(response) => {
    setLocation(response);

  });
  
      }, []);
  
  function handleSend(){
    const formdata = {
      name: userData.name,
      email: userData.email,
      title: title,
      message: message,
      longitude: location?.coords.longitude,
      latitude: location?.coords.latitude,
      country: country,
      region: region,
      city: city,
      dns: dns,
      phone: userData.phone,
      moeda: moeda,
    };
    if ( title === '' || message === '' ) {
      alert("All fields are required");
      return;
     }
      axios
      .post('https://on-host-api.vercel.app/suporte', formdata)
      .then(res => {
        console.log(res.data);
        hideModal();
        if (res.data.status == 'ok') {
        alert('Send Successfull !!');
      } else {
        alert(JSON.stringify(res.data));
      }
        })
      .catch(e => console.log(e));
    };

  function handleConversation(){
    const formdata = {
      userId: userData._id,
      receiverId: '68db1fd0ca4959ab87b484e5',
      requestId: '68c71da9aa99c7358be865d5',
 
    };
      axios
      .post('https://on-host-api.vercel.app/conversation', formdata)
      .then(res => {
        console.log(res.data);
        hideModal();
        if (res.data.status == 'ok') {
        Toast.show({
          type: 'success',
          text1: 'Send Successfull !!',
        })
      navigation.push('ChatScreen', {receiverId: '68db1fd0ca4959ab87b484e5', userId: userData._id });
      } else {
      navigation.push('ChatScreen', {receiverId: '68db1fd0ca4959ab87b484e5', userId: userData._id});
      }
        })
      .catch(e => console.log(e));
    };




  return (
    <PaperProvider>
      <Portal>
        <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={containerStyle}>
          <Text>Chat Message Support</Text>
          <TextInput 
            value={title}
            onChange={e => setTitle(e.nativeEvent.text)}
            placeholder='Title message .'
            style={styles.textInpput}
          />
          <TextInput 
            value={message}
            onChange={e => setMessage(e.nativeEvent.text)}
            placeholder='Enter Your Message Support...'
            style={{height: 300, margin: 10 }}
          />
        <View style={{width:150}}>

        <Button onPress={handleSend} style={ { backgroundColor:'blue', margin: 10, width: 250 , marginTop: 10 }} >
           Send message
          </Button> 

        </View>
        </Modal>
      </Portal>

      <View style={styles.container}>
      <Button style={ { marginTop: 30, backgroundColor:'blue', width: SCREEN_WIDTH * 0.9, justifyContent: 'center', alignItems: 'center' }} onPress={handleConversation}>
        <Text style={{ color: "white" }}>
        CHAT SUPPORT
        </Text>
      </Button>
      <View style={{ width: SCREEN_WIDTH, justifyContent: 'center', alignItems:'center', marginTop: 20, padding:10 }}>
      <List.AccordionGroup >
        <List.Accordion expanded={true} onPress={handlePress} style={{ width: SCREEN_WIDTH , backgroundColor: 'white' }} title="How do I Edit account" id="1">
        <Text style={{color: 'black', backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', fontSize: 18, padding:10}}>At the top, tap Menu. Under Settings, tap Go to Edit account. Under Name, add or edit your name. Under Phone, add or edit your phone number.</Text>
        </List.Accordion>
        <List.Accordion expanded={true} onPress={handlePress} style={{width: SCREEN_WIDTH,  backgroundColor: 'white' }} title="How do I Edit Password" id="2">
        <Text style={{color: 'black', backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', fontSize: 18, padding:10}}>At the top, tap Menu. Under Settings, tap Go to Edit password. Under Password, add or edit your Password. We use bcrypt encryption .</Text>
        </List.Accordion>
        <List.Accordion expanded={true} onPress={handlePress} style={{width: SCREEN_WIDTH, backgroundColor: 'white' }} title="How do I Edit code security" id="3">
        <Text style={{color: 'black', backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', fontSize: 18, padding:10}}>At the top, tap Menu. Under Settings, tap Settings. Go to Edit code security, Under Edit Code, add or edit your PIN Code Security.</Text>
        </List.Accordion>
        <List.Accordion expanded={true} onPress={handlePress} style={{width: SCREEN_WIDTH, backgroundColor: 'white' }} title="How do I Disable Location" id="4">
        <Text style={{color: 'black', backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', fontSize: 18, padding:10}}>At the top, tap Menu. Under Settings, tap Settings. Under Location, Disable or enable your Location.</Text>
        </List.Accordion>
      </List.AccordionGroup>
      </View>
      </View>
      
    </PaperProvider>
  )
}
export default Help;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  textInpput:{
    height:40,
    borderColor:'white',
    borderWidth:1,
    paddingHorizontal:10,
    marginVertical:10
  },
  noteContainer:{
flexDirection:'row',
alignItems:'center',
backgroundColor:'gray',
justifyContent:'space-between',
margin:10,
padding:10
  }
});



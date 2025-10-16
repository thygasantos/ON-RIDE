import { View, TextInput, Button, Text, Alert, ToastAndroid } from 'react-native'
import React, { useState, useContext, useEffect } from 'react'
import { FloatingLabelInput } from 'react-native-floating-label-input';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location'
import axios from 'axios';
import { useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Entypo } from '@expo/vector-icons/';


export default function editpass() {
  const [password, setPassword] = useState('');
  const [rePassword, setRePassword] = useState('');
  const [id, setId] = useState<Object>('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dns, setIpAddress] = useState('');
  const [show, setShow] = useState(false);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [userData, setUserData] = useState('');
  const [moeda, setCurrency] = useState('');
  const [city, setCity] = useState('');
  const [userDate, setUserDate] = useState('');
  const [displayCurrentAddress, setDisplayCurrentAddress] = useState('Location Loading.....');
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(false)
  const route = useRoute();



  useEffect(() => {
    const timeout = setTimeout(() => {
      setShow(!show);
    }, 50000);
    return () => clearTimeout(timeout);
  }, [show]);



  useEffect(() => {
    (async () => {

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude)
      setLongitude(location.coords.longitude);
      setLocation(location.coords);
    })();
  }, []);

  let text = 'Waiting..';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }
  console.warn("latitude: ", latitude);
  console.warn("longitude: ", longitude);


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
    const userData = { name: name, email: email, phone: phone, _id: id };
    setId(userData._id);
    setEmail(userData.email);
    setName(userData.name);
    setPhone(userData.phone);
  }, []);

  useEffect(() => {
    async function updateLocation() {
      const formdata = {
        email: userData.email,
        dns: dns,
        latitude: latitude,
        longitude: latitude,
      };
      axios
        .post('https://on-host-api.vercel.app/update-location', formdata)
        .then(res => {
          console.log(res.data)
          if (res.data.status == 'Ok') {
          }
        });
    }
    updateLocation();
  }, []);

  const addNotification = () => {
    const formdata = {
      userId: userData._id,
      message: 'Edited Your Password Sucessfull !!',
      title: 'Alert',
      createAt: new Date(),
    };
    axios
      .post('https://on-host-api.vercel.app/notification', formdata)
      .then(res => {
        console.log(res.data)
        if (res.data.status == 'ok') {
          ToastAndroid.show('Successfull !!!', ToastAndroid.TOP);
        }
      });
  };


  const updatePassword = () => {
    const formdata = {
      password: password,
      rePassword: rePassword,
      email: userData.email,
      dns: dns,
      latitude: latitude,
      longitude: longitude,
    };
    if (password === '') {
      Toast.show({
        type: 'error',
        text1: 'Password are required !!',
      })
      return;
    }
    if (password !== rePassword) {
      Toast.show({
        type: 'error',
        text1: 'Passwords do not match.',
      })
    }
    axios
      .post('https://on-host-api.vercel.app/update-password', formdata)
      .then(res => {
        console.log(res.data)
        if (res.data.status == 'Ok') {
          addNotification();
          Toast.show({
            type: 'success',
            text1: 'Updated Password Successfull !!!',
          })
        }
      });
  };



  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black', }}>
      <View style={{ width: 300, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#E0E0E0", paddingVertical: 5, borderRadius: 50, marginTop: 30, }} >
        <FloatingLabelInput labelStyles={{ paddingBottom: 20, }} containerStyles={{ paddingHorizontal: 10, borderRadius: 50, width: 300, }} label={'Password'} isPassword={true} togglePassword={show} style={{ borderRadius: 50, fontWeight: "bold", textAlign: "center", color: "gray", width: 300, fontSize: password ? 30 : 30, }} placeholder="Password" value={password} onChange={e => setPassword(e.nativeEvent.text)} customShowPasswordComponent={<Entypo name="eye" size={24} color="black" />} customHidePasswordComponent={<Entypo name="eye-with-line" size={24} color="black" />} />
      </View>
      <View style={{ justifyContent: 'center', width: 300, flexDirection: "row", alignItems: "center", }} >
        <Text style={{ marginTop: 10, color: 'white', fontSize: 12, }}>
          at least 8 characters, contaning a letter and a number
        </Text>
      </View>
      <View style={{ width: 300, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#E0E0E0", paddingVertical: 5, borderRadius: 50, marginTop: 70, }} >
        <FloatingLabelInput labelStyles={{ paddingBottom: 20, }} containerStyles={{ paddingHorizontal: 10, borderRadius: 50, width: 300, }} label={'Re-Password'} isPassword={true} togglePassword={show} style={{ borderRadius: 50, fontWeight: "bold", textAlign: "center", color: "gray", width: 300, fontSize: rePassword ? 30 : 30, }} placeholder="Re-Password" value={rePassword} onChange={e => setRePassword(e.nativeEvent.text)} customShowPasswordComponent={<Entypo name="eye" size={24} color="black" />} customHidePasswordComponent={<Entypo name="eye-with-line" size={24} color="black" />} />
      </View>
      <View style={{ justifyContent: 'center', width: 300, flexDirection: "row", alignItems: "center", }} >
        <Text style={{ marginTop: 10, color: 'white', fontSize: 12, }}>
          at least 8 characters, contaning a letter and a number
        </Text>
      </View>
      <View style={{ marginTop: 60, borderRadius: 50 }} >
        <Button onPress={updatePassword} title="Edit Password" />
      </View>

    </View>

  )
}

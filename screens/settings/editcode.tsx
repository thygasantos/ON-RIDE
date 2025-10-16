import { View, Button, Text, Alert } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import ReactNativePinView from 'react-native-pin-view';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function editcode() {
  const [userData, setUserData] = useState(null); // Initialize as null
  const [dns, setIpAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [enteredPin, setEnteredPin] = useState('');
  const pinView = useRef(null);

  // Fetch location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setLatitude(location.coords.latitude);
        setLongitude(location.coords.longitude);
      } catch (error) {
        console.error('Failed to fetch location:', error);
        setErrorMsg('Failed to fetch location');
      }
    })();
  }, []);

  // Fetch IP address
  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setIpAddress(data.ip);
      } catch (error) {
        console.error('Failed to fetch IP:', error);
        setErrorMsg('Failed to fetch IP address');
      }
    };
    fetchIp();
  }, []);

  // Fetch user data
  useEffect(() => {
    const getData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setErrorMsg('No token found');
          return;
        }
        const res = await axios.post('https://on-host-api.vercel.app/userdata', { token });
        setUserData(res.data.data);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setErrorMsg('Failed to fetch user data');
      }
    };
    getData();
  }, []);

  // Update location
  useEffect(() => {
    if (!userData?.email || !dns || !latitude || !longitude) return;

    const updateLocation = async () => {
      try {
        const formdata = {
          email: userData.email,
          dns,
          latitude,
          longitude,
        };
        const res = await axios.post('https://on-host-api.vercel.app/update-location', formdata);
        if (res.data.status === 'ok') {
          console.log('Location updated successfully');
        }
      } catch (error) {
        console.error('Failed to update location:', error);
        setErrorMsg('Failed to update location');
      }
    };
    updateLocation();
  }, [userData, dns, latitude, longitude]);

  // Add notification
  const addNotification = async () => {
    if (!userData?._id) return;
    try {
      const formdata = {
        userId: userData._id,
        message: 'Edited Your PIN Successfully!',
        title: 'Alert',
        createAt: new Date(),
      };
      const res = await axios.post('https://on-host-api.vercel.app/notification', formdata);
      if (res.data.status === 'ok') {
        Toast.show({
          type: 'success',
          text1: 'Notification Sent!',
        });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      setErrorMsg('Failed to send notification');
    }
  };

  // Update PIN
  const updatePin = async () => {
    if (!enteredPin) {
      Toast.show({
        type: 'error',
        text1: 'PIN is required',
      })
      return;
    }
    if (enteredPin.length !== 4) {
      Toast.show({
        type: 'error',
        text1: 'PIN must be 4 digits',
      })
      return;
    }
    if (!userData?.email) {
      Toast.show({
        type: 'error',
        text1: 'User data not loaded',
      })
      return;
    }

    try {
      const formdata = {
        email: userData.email,
        dns,
        latitude,
        longitude,
        pin: enteredPin,
      };
      const res = await axios.post('https://on-host-api.vercel.app/update-pin', formdata);
      if (res.data.status === 'Ok') {
        await addNotification();
        Toast.show({
          type: 'success',
          text1: 'PIN Updated Successfully!',
        });
        pinView.current.clear(); // Clear PIN input
        setEnteredPin('');
      }
    } catch (error) {
      console.error('Failed to update PIN:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to update PIN',
      })
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
      }}
    >
      {errorMsg && <Text style={{ color: 'red', marginBottom: 10 }}>{errorMsg}</Text>}
      <View style={{ width: 300, alignItems: 'center' }}>
        <ReactNativePinView
          inputSize={20}

          ref={pinView}
          pinLength={4}
          buttonSize={60}
          onValueChange={setEnteredPin}
          buttonAreaStyle={{ marginTop: 24 }}
          inputAreaStyle={{ marginBottom: 40 }}
          inputViewEmptyStyle={{
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: 'white',
          }}
          inputViewFilledStyle={{ backgroundColor: 'blue' }}
          buttonViewStyle={{
            borderColor: 'white',
            borderBottomWidth: 1,
            borderWidth: 1,
            borderRadius: 50,
          }}
          buttonTextStyle={{
            color: 'white',
            fontSize: 25,
          }}
          onButtonPress={key => {
            if (key === 'custom_right') {
              pinView.current.clear();
              setEnteredPin('');
            }
          }}
          customRightButton={<MaterialCommunityIcons name="backspace-outline" size={35} color="white" />}
        />
      </View>
      <View style={{ marginTop: 60, borderRadius: 50 }}>
        <Button onPress={updatePin} title="Update PIN" />
      </View>
    </View>
  );
}

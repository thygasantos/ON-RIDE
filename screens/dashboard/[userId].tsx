import { Button, View, Text, ScrollView, StyleSheet, Dimensions, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from 'react';
import { Avatar, Card } from "react-native-paper";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location'
import { requestForegroundPermissionsAsync, getCurrentPositionAsync, watchPositionAsync, LocationObject, LocationAccuracy } from "expo-location";



const LeftContent = (props: any) => <Ionicons {...props} name="notifications" />;

const SCREEN_WIDTH = Dimensions.get('window').width;


const notifications = ({ route, navigation }) => {
  const [userData, setUserData] = useState('');
  const [notifications, setNotifications] = useState('');
  const [id, setId] = useState<Object>('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dns, setIpAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(null);



  async function requestLocationPermissions() {
    const { granted } = await requestForegroundPermissionsAsync();

    if (granted) {
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
    }, (response) => {
      setLocation(response);
    });
  }, []);

  useEffect(() => {
    (async () => {
      setLatitude(location?.coords.latitude)
      setLongitude(location?.coords.longitude);
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

  const myListEmpty = () => {
    return (
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 25, justifyContent: 'center', alignItems: 'center' }}>No Notifications</Text>
      </View>
    );
  };



  async function getAllNotification() {
    setLoading(true);
    const { userId = userData._id } = route.params;
    axios
      .get('https://on-host-api.vercel.app/notificationdata/' + userData._id)
      .then(res => {
        console.log(res.data);
        setNotifications(res.data.data);
        setLoading(false);
      });
  };

  useEffect(() => {
    (async () => {
      getData();
      getAllNotification();
    })();
  }, [userData._id]);

  const handleLoadMore = () => {
    if (!loading) {
      (async () => {
        getAllNotification();
      })();
    }
  };

  const NotificationCard = ({ data }) => (
    <View>
      <Card style={{ margin: 10, width: SCREEN_WIDTH * 0.95 }}>
        <Card.Title titleStyle={{ fontWeight: "bold" }}
          title={data.title}
          subtitle={data.createAt}
          left={LeftContent}
        />
        <Card.Content>
          <Text style={{ fontSize: 18, padding: 20, fontWeight: "bold", textAlign: "center" }} variant="bodyMedium">{data.message}</Text>
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black', }}>
      <ScrollView onPointerMove={handleLoadMore} >
        <FlatList
          data={notifications}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={myListEmpty}
          keyExtractor={item => item._id}
          renderItem={({ item }) => <NotificationCard data={item} />}
          onTouchMove={handleLoadMore}
          ListFooterComponent={() => (<TouchableOpacity style={{ alignItems: 'center', padding: 16 }} onPress={handleLoadMore}><Text style={{ color: 'white', fontWeight: 'bold' }}>{loading ? <ActivityIndicator size={"large"} color={"white"} /> : 'Load More'}</Text></TouchableOpacity>)}
        />
      </ScrollView >

    </View>
  );
}

export default notifications;

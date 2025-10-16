import { StyleSheet, Button, ToastAndroid, Text, Dimensions, View, ActivityIndicator, FlatList, Image, TextInput, Alert, ScrollView, TouchableOpacity } from "react-native";
import { CommonActions, NavigationContainer, useNavigation } from '@react-navigation/native';
import { FontAwesome, FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';
import uuid from 'react-native-uuid';
import BottomSheet from 'react-native-simple-bottom-sheet';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Marker, LatLng } from "react-native-maps";
import { requestForegroundPermissionsAsync, getCurrentPositionAsync, watchPositionAsync, LocationObject, LocationAccuracy } from "expo-location";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { Card } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import Toast from "react-native-toast-message";
import * as Network from "expo-network";
import CustomPicker from '@/components/CustomPicker'; // Adjust the path to your component

const GOOGLE_MAPS_APIKEY = process.env.GOOGLE_MAPS_APIKEY;


const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const pickerItems = [
  {
    label: 'Cash',
    value: 'cash',
    icon: () => <FontAwesome name="money" size={20} color="#000" style={styles.icon} />,
  },
  {
    label: 'Other',
    value: 'other',
    icon: () => <FontAwesome name="refresh" size={20} color="#000" style={styles.icon} />,
  },
];

export default function confirm({ route, navigation }) {
  const { id, info, latitude, longitude, dlongitude, dlatitude, destination, valor_total, km, time, polylineCoords, tax_km, tax_app } = route.params;
  const [categoryData, setCategoryData] = useState('');
  const [dns, setIpAddress] = useState('');
  const [categorys, setCategorys] = useState('');
  const [delivery, setDelivery] = useState('');
  const [selectedOption, setSelectedOption] = useState<{ value: string; label: string; } | null>(null)
  const [selectMoeda, setSelectMoeda] = useState('cash');
  const position = { lat: 53.54992, lng: 10.00678 };
  const [result, setResult] = useState([]);
  const [location, setLocation] = useState<LocationObject | null>(null);
  const mapRef = useRef<MapView>(null);
  const [userData, setUserData] = useState('');
  const [message, setMessage] = useState('');
  const requestId = uuid.v4();
  const [loading, setLoading] = useState(true);
  const [isNetworkAvailable, setIsNetworkAvailable] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [polylineData, setPolylineData] = useState(null);
  const [routeData, setRouteData] = useState(null);


  const pickerItems = [
    { label: 'Money', value: 'cash', icon: 'money' },
    { label: 'Other', value: 'other', icon: 'question' },
  ];


  async function getData() {
    setLoading(true);
    const token = await AsyncStorage.getItem('token');
    console.log(token);
    axios
      .post('https://on-host-api.vercel.app/userdata', { token: token })
      .then(res => {
        console.log(res.data);
        setUserData(res.data.data);
        setLoading(false);

      });
  }

  useEffect(() => {
    (async () => {
      getData();
    })();
  }, []);

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


// Check network status
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        setIsNetworkAvailable(networkState.isConnected);
        if (!networkState.isConnected) {
          setError("No internet connection");
          Toast.show({
            type: "error",
            text1: "No Internet",
            text2: "Please check your network connection.",
          });
        }
      } catch (err) {
        console.error("Network check error:", err);
      }
    };
    checkNetwork();
  }, []);


  async function getCategory() {
    axios.get('https://on-host-api.vercel.app/categorydata/' + id)
      .then(res => {
        console.log(res.data);
        setCategoryData(res.data.data);
      });
  }


  useEffect(() => {
    getCategory();
  }, []);

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
    const startWatching = async () => {
      await watchPositionAsync(
        {
          accuracy: Location.LocationAccuracy.Highest,
          timeInterval: 100,
          distanceInterval: 1,
        },
        (response) => {
          setLocation(response);
          if (
            mapRef.current &&
            response?.coords.latitude &&
            response?.coords.longitude &&
            dlatitude &&
            dlongitude
          ) {
            mapRef.current.fitToCoordinates(
              [
                { latitude: response.coords.latitude, longitude: response.coords.longitude },
                { latitude: dlatitude, longitude: dlongitude },
              ],
              { edgePadding: { top: 0, right: 50, bottom: 300, left: 50 }, animated: true }
            );
          }
        }
      );
    };
    startWatching();
  }, [dlatitude, dlongitude]);


  const handleCamera = () => {
    watchPositionAsync({
      accuracy: Location.LocationAccuracy.Highest,
      timeInterval: 1000,
      distanceInterval: 1
    }, (response) => {
      setLocation(response);
      mapRef.current?.fitToCoordinates(
        [
          { latitude: response.coords.latitude, longitude: response.coords.longitude },
          { latitude: dlatitude, longitude: dlongitude },
        ],
        { edgePadding: { top: 0, right: 50, bottom: 300, left: 50 }, animated: true }
      );
    });
  };


  useEffect(() => {
    async function updateLocation() {
      if (!userData.email || !location?.coords.latitude || !location?.coords.longitude) return;
      const formdata = {
        email: userData.email,
        dns,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      try {
        const res = await axios.post('https://on-host-api.vercel.app/update-location', formdata);
        console.log(res.data);
      } catch (error) {
        console.error('Location update failed:', error);
      }
    }
    updateLocation();
  }, [userData.email, dns, location?.coords.latitude, location?.coords.longitude]);





  async function handleRequest() {
    if (!isNetworkAvailable) {
      setError("No internet connection");
      Toast.show({
        type: "error",
        text1: "No Internet",
        text2: "Please check your network connection.",
      });
      return;
    }
    if (!info || !destination) {
      alert('Error', 'All fields are required');
      return;
    }
    const requestData = {
      userId: userData._id,
      requestId,
      categoryId: id,
      info,
      d_info: destination,
      pagamento: selectMoeda,
      status: 'process',
      d_latitude: dlatitude,
      d_longitude: dlongitude,
      token: userData.code,
      distance: km,
      time,
      latitude: location?.coords.latitude,
      longitude: location?.coords.longitude,
      region: userData.region,
      country: userData.country,
      city: userData.city,
      moeda: userData.moeda,
      valor: valor_total,
      tax_app: tax_app,
      tax_km: tax_km,
      delivery: categoryData?.delivery,
    };
    try {
      setIsLoading(true);
      const res = await axios.post('https://on-host-api.vercel.app/request', requestData);
      if (res.data.status === 'OK') {
        await AsyncStorage.setItem('requestId', requestId);
        navigation.push("Seach", { requestId, dlatitude, dlongitude })
      } else {
        alert('Error', JSON.stringify(res.data.data));
      }
    } catch (error) {
      console.error('Request failed:', error);
      alert('Error', 'Failed to submit request');
    } finally {
      setIsLoading(false);
    }
  }

  const handleCancel = () => {
    navigation.dispatch(CommonActions.navigate({ name: 'Dashboard' }));
  };

  if (loading) {
    return <ActivityIndicator size="large" color="white" style={{ flex: 1, justifyContent: 'center', backgroundColor: 'black' }} />;
  }


  const CategoryCard = ({ data }) => (
    <View>
      <Card style={{ margin: 10 }}>
        <Card.Content >
          <FontAwesome size={40} name={data.icon} color="black" /><Text style={{ fontWeight: 'bold', textAlign: 'center', fontSize: 25, marginTop: -25, }}>{data.name}</Text><Text style={{ marginTop: -20, alignSelf: 'flex-end', fontSize: 12, marginRight: 50 }}>BRL</Text><Text style={{ marginTop: -25, alignSelf: 'flex-end', fontWeight: 'bold', textAlign: 'center', fontSize: 25 }}>{data.valor}</Text>
        </Card.Content>
      </Card>
    </View>
  );


  return (
    <>
      <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, flex: 1, backgroundColor: 'black', justifyContent: 'flex-start' }}>
        <View style={{ borderRadius: 50, elevation: 10, paddingVertical: 12, paddingHorizontal: 18, flexWrap: 'wrap' }}>
          <View style={{ position: 'absolute', top: 35, elevation: 10, backgroundColor: "white", marginTop: 20, marginLeft: 22, borderRadius: 50, zIndex: 100 }} >
            <MaterialCommunityIcons onPress={() => navigation.goBack()} style={{ alignSelf: "center" }} name='arrow-left' size={36} color="black" />
          </View>
        </View>
        <View style={{ position: 'absolute', flex: 1, width: 270, height: 105, zIndex: 100, marginTop: 10, borderRadius: 10, backgroundColor: 'white', left: SCREEN_WIDTH * 0.2, elevation: 10, }}>
          <Image style={{ marginStart: 20, marginTop: 8, height: 65, width: 25 }} source={require("@/assets/transit.png")} />
          <TextInput style={{ borderRadius: 50, marginStart: 60, marginTop: -65, backgroundColor: "gray", fontWeight: "bold", textAlign: "center", color: "white", width: 200, height: 35, fontSize: 18 }}
            editable={false} value={info}
          />
          <Text style={{ fontWeight: "bold", marginStart: 60, marginTop: 5, zIndex: 100 }}>{destination}</Text>

        </View>
        <View style={{ zIndex: -10, marginTop: -30, width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
          {location && (
            <MapView
              ref={mapRef}
              initialRegion={{
                latitude: location?.coords.latitude,
                longitude: location?.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005
              }}
              showsMyLocationButton={true}
              followsUserLocation={true}
              provider={PROVIDER_GOOGLE}
              loadingEnabled={true}
              style={{
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT
              }}
            >
              <Marker title={info} coordinate={{ latitude: location?.coords.latitude, longitude: location?.coords.longitude }}>
                <Image source={require('@/assets/location.png')} style={{ width: 20, height: 20, borderRadius: 9, backgroundColor: "black", alignItems: "center", justifyContent: "center" }} />
              </Marker>

              <Marker title={destination} coordinate={{ latitude: dlatitude, longitude: dlongitude }} pinColor="blue" />
              {polylineCoords.length > 0 && (
                <Polyline coordinates={polylineCoords} strokeWidth={3} strokeColor="blue" />
              )}
            </MapView>
          )}
        </View>
        <BottomSheet isOpen sliderMinHeight={255} >
          <View style={{ width: 48, height: 48, marginStart: 270, alignSelf: 'stretch', position: 'absolute', top: -120, elevation: 10, zIndex: 10, flexWrap: 'wrap', borderRadius: 50, borderWidth: 1, backgroundColor: 'white' }}>
            <TouchableOpacity onPress={handleCamera} style={{ marginTop: 5, marginLeft: 6 }}>
              <FontAwesome6 size={34} name='location-crosshairs' color="black" />
            </TouchableOpacity>
          </View>
          <Text style={{ textAlign: "center", fontSize: 28, fontWeight: 'bold', marginTop: -20 }} >Km : {km} Min : {time}  </Text>
          <ScrollView
             showsHorizontalScrollIndicator={false}
             contentInsetAdjustmentBehavior="automatic"
             style={{ marginBottom: 10, paddingHorizontal: 12}}
              >
          <View style={{ margin: 20, marginEnd: 30, height: 400, elevation: 10 }}>
            <Card style={{ margin: 10 }}>
              <Card.Content >
                <Image style={{ width: 50, height: 50 }} source={{ uri: categoryData.icon }} /><Text style={{ fontWeight: 'bold', textAlign: 'center', fontSize: 25, marginTop: -25, }}>{categoryData.name}</Text><Text style={{ marginTop: -20, alignSelf: 'flex-end', fontSize: 12, marginRight: 50 }}>{userData.moeda}</Text><Text style={{ marginTop: -25, alignSelf: 'flex-end', fontWeight: 'bold', textAlign: 'center', fontSize: 25 }}>{valor_total}</Text>
              </Card.Content>
            </Card>
            <Text style={{ fontSize: 18, color: "red", padding: 10, fontWeight: "bold", textAlign: "left" }}>Payment Method </Text>
             <CustomPicker
               selectedValue={selectMoeda}
               onValueChange={(value) => setSelectMoeda(value)}
               items={pickerItems}
             />
            {categoryData.delivery ? <TextInput
              value={message}
              onChange={e => setMessage(e.nativeEvent.text)}
              placeholder='OBS..'
              style={{ height: 50, textAlign: "center", margin: 10, borderWidth: 1, borderColor: "blue", borderRadius: 10 }}
              /> : ''}

          </View>
              </ScrollView>
              <View style={{ zIndex: 100, flexDirection: "row", justifyContent: "space-around", alignItems: "center",  marginBottom: 10,  }}>
            {userData.block ? <Button disabled={true} title="Confirm" onPress={() => handleRequest()} />
              : <Button disabled={isLoading || !isNetworkAvailable} title="Confirm" onPress={() => handleRequest()} />}
            <Text onPress={() => handleCancel()} style={{ fontSize: 12, color: "red", padding: 10, fontWeight: "bold", textAlign: "center", marginEnd: 0 }}>CANCEL </Text>
              </View>
        </BottomSheet>
      </View>
    </>

  );
};

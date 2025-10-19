import { useEffect, useState, useRef, useContext, useCallback, useMemo } from 'react';
import {
  ScrollView,
  Button,
  FlatList,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
  Image,
  KeyboardAvoidingView,
  TextInput,
  Pressable,
  Platform,
  TouchableOpacity,
  Modal,
  Animated,
  Easing
} from "react-native";
import { OriginContext, DestinationContext } from '@/context/contexts';
import BottomSheet from 'react-native-simple-bottom-sheet';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from "expo-location";
import * as Updates from "expo-updates";
import axios from 'axios';
import MapQuestAutocomplete from '@/components/MapQuestAutocomplete';
import Config from "react-native-config";
import { requestForegroundPermissionsAsync, getCurrentPositionAsync, watchPositionAsync, LocationAccuracy } from "expo-location";
import { FontAwesome6 } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import * as Network from "expo-network";
import React from 'react';


const GOOGLE_MAPS_APIKEY = 'pk.eyJ1IjoidGh5YWdvIiwiYSI6IlgyYnFZa3cifQ.sm008NJiQD9tNZHfXpu3EA';

const origin = { latitude: -16.7255443, longitude: -43.850392 };
const destination = { latitude: 37.771707, longitude: -122.4053769 };

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function dashboard({ route, navigation }) {
  const [userData, setUserData] = useState('');
  const [userId, setUserId] = useState('');
  const [requests, setRequests] = useState([]);
  const [requestId, setRequestId] = useState('');
  const [requestData, setRequestData] = useState('');
  const [categoryData, setCategoryData] = useState([]);
  const [dns, setIpAddress] = useState('');
  const [zoom, setZoom] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [location, setLocation] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connect, setConnect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNetworkAvailable, setIsNetworkAvailable] = useState(true);
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [moeda, setCurrency] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [displayCurrentAddress, setDisplayCurrentAddress] = useState('Location Loading...');
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(false);
  const [categorys, setCategorys] = useState([]);
  const [destination, setDestination] = useState(route.params?.infoplace || '');
  const [visible, setVisible] = useState(false);
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);


  const mapRef = useRef(null);
  const lastFetchRef = useRef(0);
  const fetchIntervalRef = useRef(null);

  // Pulse animation setup
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse effect for "SEARCHING" state
  useEffect(() => {
    if (connect) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1); // Reset scale when not pulsing
    }
  }, [connect]);
  

  const handleSelect = async (place: any) => {
    console.log('Selected place:', place);
    setDestination(place.displayString);
    navigation.push("Category", { show: true, infoplace: place.displayString, d_latitude: place.place.geometry.coordinates[1], d_longitude: place.place.geometry.coordinates[0] });
  };


  //  useEffect(() => {
  //   (async () => {
  //
  //    let { status } = await Location.requestForegroundPermissionsAsync();
  //   if (status !== 'granted') {
  //    setErrorMsg('Permission to access location was denied');
  //    return;
  //     }
  //
  //    let location = await Location.getCurrentPositionAsync({});
  //    setLatitude(location.coords.latitude)
  //    setLongitude(location.coords.longitude);
  //   setLocation(location.coords);
  //  })();
  // }, []);

  //    let text = 'Waiting..';
  // if (errorMsg) {
  //   text = errorMsg;
  // } else if (location) {
  //   text = JSON.stringify(location);
  // }
  // console.warn("latitude: ", latitude);
  // console.warn("longitude: ", longitude);

  useEffect(() => {
    (async () => {
      const requestId = await AsyncStorage.getItem('requestId');
      setRequestId(requestId);
      console.log("REQUEEEESTIDStart =>", requestId);
    })();
  }, [requestdata, requestId]);



  async function getCategoryData() {
    axios.get('https://on-host-api.vercel.app/getCategory').then(res => {
      console.log(res.data);

      setCategoryData(res.data.data);
    });
  }
  useEffect(() => {
    getData();
    getCategoryData();
  }, []);

  useEffect(() => {
    axios.get('https://on-host-api.vercel.app/getCategory')
      .then(categorys => setCategorys(categorys.data))
      .catch(err => console.log(err))
  }, [])

  async function getData() {
    const token = await AsyncStorage.getItem('token');
    console.log(token);
    axios
      .post('https://on-host-api.vercel.app/userdata', { token: token })
      .then(res => {
        console.log(res.data);
        setUserData(res.data.data);
        setUserId(res.data.data._id);
      });
  }
  function handleNavigate() {
    navigation.push("Category");
  }


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

  const myListEmpty = () => {
    return (
      <View style={{ justifyContent: 'flex-start', alignItems: 'center', alignContent: 'center' }}>
        <Text style={{ color: 'black', fontSize: 25, justifyContent: 'flex-start', alignItems: 'center' }}>No Requests</Text>
      </View>
    );
  };

  async function getAllRequest(userId: string) {
    setLoading(true);
    axios
      .get('https://on-host-api.vercel.app/requestdashboard/' + userId)
      .then(res => {
        console.log(res.data);
        setRequests(res.data.data);
        setLoading(false);
      });
  };

  useEffect(() => {
    (async () => {
      getData();
      getAllRequest(userId);
    })();
  }, [userId]);


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
      mapRef.current?.animateCamera({
        pitch: 90,
        center: response.coords,
        zoom: 18

      })
    });

  }, []);

  useEffect(() => {
    (async () => {
      setLatitude(location?.coords.latitude)
      setLongitude(location?.coords.longitude)
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
    (async () => {
      setLatitude(location?.coords.latitude);
      console.log("latitudeStart =>", latitude);
    })();
  }, [latitude]);

  useEffect(() => {
    (async () => {
      setLongitude(location?.coords.longitude);
      console.log("LongitudeStart =>", longitude);
    })();
  }, [longitude]);

  useEffect(() => {
    const getCity = async () => {
      try {
        setLatitude(latitude);
        setLongitude(longitude);
        const response = await fetch("https://nominatim.openstreetmap.org/reverse?lat=" + JSON.stringify(latitude) + "&lon=" + JSON.stringify(longitude) + "&format=json");
        const data = await response.json();
        console.log(JSON.stringify(data.address.city));
        setCity(data.address.city);
      } catch (error) {
        console.error(error);
      }
    };

    getCity();
  }, [latitude, longitude]);



  useEffect(() => {
    const getRegion_code = async () => {
      setLatitude(latitude);
      setLongitude(longitude);
      try {
        const response = await fetch("https://nominatim.openstreetmap.org/reverse?lat=" + JSON.stringify(latitude) + "&lon=" + JSON.stringify(longitude) + "&format=json");
        const data = await response.json();
        console.log(JSON.stringify(data.address.state));
        setRegion_code(data.address.state);
      } catch (error) {
        console.error(error);
      }
    };
    getRegion_code();
  }, [latitude, longitude]);



  useEffect(() => {
    const getCountry = async () => {
      setLatitude(latitude);
      setLongitude(longitude);
      try {
        const response = await fetch("https://nominatim.openstreetmap.org/reverse?lat=" + JSON.stringify(latitude) + "&lon=" + JSON.stringify(longitude) + "&format=json");
        const data = await response.json();
        console.log(JSON.stringify(data.address.country));
        setCountry(data.address.country);
      } catch (error) {
        console.error(error);
      }
    };
    getCountry();
  }, [latitude, longitude]);


  useEffect(() => {
    const getCurrency_code = async () => {
      // Connect ipapi.co with fetch()
      const response = await fetch("https://ipapi.co/json/")
      const data = await response.json()
      // Set the IP address to the constant `ip`
      setCurrency(data.currency)
    }
    // Run `getIP` function above just once when the page is rendered
    getCurrency_code()
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


  const handleLoadMore = () => {
    if (!loading) {
      (async () => {
        getAllRequest(userId);
      })();
    }
  };

  const handleZoomIn = () => {
    mapRef.current?.getCamera().then((cam) => {
      if (Platform.OS === 'android') {
        cam.zoom += 1; // Increment zoom level
      } else {
        cam.altitude /= 2; // Decrease altitude for iOS
      }
      mapRef.current?.animateCamera(cam, { duration: 200 });
    });
  };

  const handleZoomOut = () => {
    mapRef.current?.getCamera().then((cam) => {
      if (Platform.OS === 'android') {
        cam.zoom -= 1; // Decrement zoom level
      } else {
        cam.altitude *= 2; // Increase altitude for iOS
      }
      mapRef.current?.animateCamera(cam, { duration: 200 });
    });
  };

  const handleCamera = () => {
    watchPositionAsync({
      accuracy: Location.LocationAccuracy.Highest,
      timeInterval: 1000,
      distanceInterval: 1
    }, (response) => {
      setLocation(response);
      mapRef.current?.animateCamera({
        pitch: 90,
        center: response.coords,
        zoom: 18

      })
    });
  };


  const RequestCard = ({ data }) => (
    <View
      style={styles.cardContainer}
    >
      <FontAwesome6 size={25} name='location-dot' color="black" /><Text style={styles.cardText}>{data.d_info}</Text>
    </View>
  );

  async function getRequest(requestId: string) {
    axios.get('https://on-host-api.vercel.app/GetRequest/' + requestId)
      .then(async res => {
        console.log(res.data)
        setRequestData(res.data.data)
        if (res.data.data.status == 'process') {
          const latitude = typeof res.data.data.d_latitude === 'string' ? parseFloat(res.data.data.d_latitude) : res.data.data.d_latitude;
          const longitude = typeof res.data.data.d_longitude === 'string' ? parseFloat(res.data.data.d_longitude) : res.data.data.d_longitude;
          navigation.navigate("Seach", { requestId: requestId, dlatitude: latitude, dlongitude: longitude });
        }
        if (res.data.data.status == 'accepted') {
          const latitude = typeof res.data.data.d_latitude === 'string' ? parseFloat(res.data.data.d_latitude) : res.data.data.d_latitude;
          const longitude = typeof res.data.data.d_longitude === 'string' ? parseFloat(res.data.data.d_longitude) : res.data.data.d_longitude;
          navigation.navigate("Seach", { requestId: requestId, dlatitude: latitude, dlongitude: longitude });
        }
      });
  }

  useEffect(() => {
    (async () => {
      getRequest(requestId);
    })();
  }, [requestdata, requestId]);


    // ---------- request fetching / polling ----------
  const fetchRequests = useCallback(async () => {
    // simple rate limiter: don't fetch more than once every 3s
    const now = Date.now();
    if (now - lastFetchRef.current < 3000) return;
    lastFetchRef.current = now;

    if (!latitude || !longitude) return;
    try {
      const res = await axios.get(`https://on-host-api.vercel.app/requests/process`, {
        params: { latitude, longitude, max_km: 10 },
        timeout: 100,
      });
      const data = res.data?.data || [];
      if (data.length > 0 && !modalVisible) {
        setCurrentRequest(data[0]);
        setRequestId(data[0]._id);
        setVisible(true);
      }
    } catch (err) {
      console.warn('fetchRequests', err?.message || err);
    }
  }, [latitude, longitude, visible]);

  const startFetchInterval = useCallback(() => {
    if (fetchIntervalRef.current) return;
    fetchIntervalRef.current = setInterval(() => {
      fetchRequests();
    }, 5000);
  }, [fetchRequests]);

  const stopFetchInterval = useCallback(() => {
    if (fetchIntervalRef.current) {
      clearInterval(fetchIntervalRef.current);
      fetchIntervalRef.current = null;
    }
  }, []);
  
  return (
    <View style={{ flex: 1 }}>
      <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, }}>
        <View style={{ borderRadius: 50, backgroundColor: 'white', elevation: 10, zIndex: 10, flexWrap: 'wrap' }}>
          <View style={{ width: 55, height: 55, position: 'absolute', top: 32, elevation: 10, backgroundColor: "white", marginTop: 40, marginLeft: 50, borderRadius: 50, zIndex: 10 }} >
            <MaterialCommunityIcons style={{ marginStart: 3, elevation: 10, zIndex: 10, display: 'flex' }} onPress={() => navigation.toggleDrawer()} name='menu' size={50} color="black" position="static" top="5%" alignSelf="left" pandding="10" />
          </View>
        </View>
        <View style={{ zIndex: -10, marginTop: -30, width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
          {
            location &&

            <MapView ref={mapRef} initialRegion={{ latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }} showsMyLocationButton={true} followsUserLocation={true} provider={PROVIDER_GOOGLE} loadingEnabled={true} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} >
              <Marker coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }} >
                <Image
                  source={require('@/assets/location.png')}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 9,
                    backgroundColor: "black",
                    alignItems: "center",
                    justifyContent: "center"
                  }}

                />
              </Marker>
            </MapView>
          }
        </View>


        {/* BottomSheet */}
        <BottomSheet isOpen index={0} enableHandlePanningGesture={false} enableContentPanningGesture={false} enablePanDownToClose={false} sliderMinHeight={'135'}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: "center", alignContent: "center" }}>
            <MaterialCommunityIcons onPress={() => navigation.push('Options')}  name="square-edit-outline" size={55} color="black" style={{ marginRight: 10 }} />
            {connect ? (
              <Animated.View style={{
                transform: [{ scale: pulseAnim }],
                alignItems: 'center',
                justifyContent: 'center',
                margin: 30,
                shadowColor: '#00ff0dff',
                shadowOffset: { width: 1, height: 2 },
                shadowOpacity: 0.6,
                shadowRadius: 50,
                elevation: 5,
                backgroundColor: '#00ff0d1a',
                borderRadius: 50,
                paddingHorizontal: 30,
                paddingVertical: 10,
              }}>
                <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 25, textAlign: 'center' }}>SEARCHING</Text>
              </Animated.View>
            ) : (
              <TouchableOpacity
                disabled={isLoading || !isNetworkAvailable}
                onPress={() => handleConnect()}
                style={[styles.connectButton, isLoading && styles.disabledButton]}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 25, textAlign: 'center' }}>CONNECT</Text>
              </TouchableOpacity>
            )}
            <MaterialIcons onPress={() => navigation.push('Feed')} name="feed" size={55} color="black" style={{ marginLeft: 10 }} />
          </View>
        </BottomSheet>
      </View>
      <Modal animationType="slide" transparent visible={visible} onRequestClose={() => setVisible(false)}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>New Request!</Text>
            {currentRequest ? (
              <>
                <Text>Destination: {currentRequest.d_info}</Text>
                <Text>Distance: {currentRequest.distance} km</Text>
                <Text>Time: {currentRequest.time} min</Text>
                <Text>Value: {currentRequest.valor} {currentRequest.moeda}</Text>
                <Text>Payment: {currentRequest.pagamento}</Text>
              </>
            ) : (
              <ActivityIndicator />
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Pressable style={[styles.button, styles.buttonAccept]} onPress={() => acceptRequest(currentRequest)}>
                <Text style={styles.textStyle}>Accept</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.buttonDecline]} onPress={() => setModalVisible(false)}>
                <Text style={styles.textStyle}>Decline</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: SCREEN_WIDTH * 0.8,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 15,
    alignSelf: 'center',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardText: {
    color: 'black',
    paddingStart: 10,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0400ffff',
    padding: 10,
    borderRadius: 50,
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_HEIGHT * 0.08,
    justifyContent: 'center',
    marginBottom: 10,
  },
  disabledButton: { backgroundColor: '#A0A0A0' },
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 22 },
  modalView: { margin: 20, backgroundColor: 'white', borderRadius: 20, padding: 35, alignItems: 'center', elevation: 5 },
  button: { borderRadius: 20, padding: 10, elevation: 2, margin: 10 },
  buttonAccept: { backgroundColor: '#2196F3' },
  buttonDecline: { backgroundColor: '#FF0000' },
  textStyle: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
  modalText: { marginBottom: 15, textAlign: 'center', fontSize: 20, fontWeight: 'bold' },
});

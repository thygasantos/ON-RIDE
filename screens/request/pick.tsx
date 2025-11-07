import React, { useEffect, useRef, useState, useMemo } from 'react';
import { StyleSheet, FlatList, Text, Dimensions, View, TextInput, ScrollView, Image, TouchableOpacity, Pressable } from 'react-native';
import BottomSheet from 'react-native-simple-bottom-sheet';
import { FontAwesome6, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { requestForegroundPermissionsAsync, getCurrentPositionAsync, watchPositionAsync, LocationObject } from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import SwipeButton from '@/components/SwipeButton';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Category({ route, navigation }) {
  const [categorys, setCategorys] = useState([]);
  const [delivery, setDelivery] = useState([]);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('LOADING ...');
  const [userData, setUserData] = useState({ moeda: '' });
  const [latitude, setLatitude] = useState(route.params?.latitude || 0);
  const [longitude, setLongitude] = useState(route.params?.longitude || 0);
  const [dlatitude, setDlatitude] = useState(route.params?.d_latitude || 0);
  const [dlongitude, setDlongitude] = useState(route.params?.d_longitude || 0);
  const [destination, setDestination] = useState(route.params?.infoplace || '');
  const [showInfo, setShowInfo] = useState(route.params?.show || false);
  const [result, setResult] = useState(null);
  const mapRef = useRef(null);
  const [toggleState, setToggleState] = useState(false);
  const handleToggle = (value: boolean | ((prevState: boolean) => boolean)) => setToggleState(value);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const [userResponse, categoryResponse, deliveryResponse] = await Promise.all([
          axios.post('https://on-host-api.vercel.app/userdata', { token }),
          axios.get('https://on-host-api.vercel.app/getCategory'),
          axios.get('https://on-host-api.vercel.app/getDelivery'),
        ]);
        setUserData(userResponse.data.data);
        setCategorys(categoryResponse.data.data);
        setDelivery(deliveryResponse.data.data);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, []);

  // Request location permissions and watch position
  useEffect(() => {
    let subscription;
    const startWatching = async () => {
      const { granted } = await requestForegroundPermissionsAsync();
      if (granted) {
        const currentPosition = await getCurrentPositionAsync();
        setLocation(currentPosition);
        subscription = await watchPositionAsync(
          {
            accuracy: Location.LocationAccuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (response) => {
            setLocation(response);
            if (mapRef.current && response?.coords && dlatitude && dlongitude) {
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
      }
    };
    startWatching();
    return () => subscription?.remove();
  }, [dlatitude, dlongitude]);

  // Update location and address
  useEffect(() => {
    if (!location?.coords) return;
    const { latitude, longitude } = location.coords;
    const updateLocation = async () => {
      try {
        setLatitude(latitude);
        setLongitude(longitude);
        const [addressResponse, countryResponse] = await Promise.all([
          axios.get('https://api.mapbox.com/search/geocode/v6/reverse', {
            params: { longitude, latitude, access_token: 'pk.eyJ1IjoidGh5YWdvIiwiYSI6IlgyYnFZa3cifQ.sm008NJiQD9tNZHfXpu3EA' },
          }),
          axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`),
        ]);
        const address = addressResponse?.data?.features?.[0]?.properties?.full_address;
        const country = countryResponse?.data?.address?.country_code;
        setAddress(address || 'Unknown');
        AsyncStorage.multiSet([
          ['latitude', String(latitude)],
          ['longitude', String(longitude)],
          ['address', address],
          ['country', country],
        ]);
      } catch (error) {
        console.error('Error updating location:', error);
      }
    };
    updateLocation();
  }, [location?.coords]);

  // Fetch directions
  useEffect(() => {
    if (!longitude || !latitude || !dlongitude || !dlatitude) return;
    const fetchDirections = async () => {
      try {
        const response = await axios.get(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${longitude},${latitude};${dlongitude},${dlatitude}`,
          {
            params: {
              access_token: 'pk.eyJ1IjoidGh5YWdvIiwiYSI6IlgyYnFZa3cifQ.sm008NJiQD9tNZHfXpu3EA',
              geometries: 'geojson',
              steps: true,
              alternatives: false,
              overview: 'simplified',
            },
          }
        );
        const route = response.data.routes[0];
        setResult(route);
        setPolylineCoords(
          route.geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }))
        );
      } catch (error) {
        console.error('Error fetching directions:', error);
      }
    };
    fetchDirections();
  }, [longitude, latitude, dlongitude, dlatitude]);

 

  return (
    <View style={styles.safeContainer}>
      <View style={styles.headerContainer}>
        <View style={styles.backIconWrapper}>
          <MaterialCommunityIcons
            onPress={() => navigation.goBack()}
            style={styles.backIcon}
            name="arrow-left"
            size={36}
            color="black"
          />
        </View>
      </View>
      <View style={styles.searchWrapper}>
        <Image style={styles.transitIcon} source={require('@/assets/transit.png')} />
        <Text style={styles.addressInput}  >{address}</Text>
        <View style={styles.autocompleteContainer}>
        <Text style={{ fontWeight: 'bold', textAlign: 'center', color: 'black', width: 200, height: 35, fontSize: 13, marginLeft: 10, marginTop: 20 }}  >{address}</Text>
        </View>
      </View>
      <BottomSheet isOpen sliderMinHeight={255}>
        <View style={styles.locationButton}>
          <TouchableOpacity>
            <FontAwesome6 size={34} name="location-crosshairs" color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.driverInfo}>
          <View style={styles.ratingContainer}>
            <Image
              style={styles.driverImage}
              source={{ uri: 'https://on-host-api.vercel.app/static/default-blue.png' }} // Replace with driver image URL
            />
            <Text style={styles.driverName}>test</Text>
            <Text style={styles.rating}>5.0 ★</Text>
          </View>
          <View style={styles.messageContainer}>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons name="call" size={35} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons name="chat-bubble" size={35} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ paddingBottom: 20 }}>
          <SwipeButton onToggle={handleToggle} textOff="Deslize" textOn="Ativado" />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'flex-start' },
  headerContainer: { borderRadius: 50, elevation: 10, paddingVertical: 12, paddingHorizontal: 18 },
  backIconWrapper: { position: 'absolute', top: 50, left: 20, borderRadius: 50, backgroundColor: 'white', zIndex: 100, elevation: 10 },
  backIcon: { alignSelf: 'center' },
  searchWrapper: {
    position: 'absolute',
    width: 270,
    height: 115,
    zIndex: 10,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    alignSelf: 'center',
    left: SCREEN_WIDTH * 0.2,
  },
  transitIcon: { height: 65, width: 25, marginRight: 10 },
  addressInput: {  fontWeight: 'bold', textAlign: 'center', color: 'black', width: 200, height: 35, fontSize: 13, marginLeft: 10, marginTop: -50 },
  autocompleteContainer: { position: 'absolute', top: 40, left: 45, width: SCREEN_WIDTH * 0.65, zIndex: 100, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  locationButton: { width: 48, height: 48, right: SCREEN_WIDTH * 0.03, bottom: SCREEN_HEIGHT * 0.37, alignSelf: 'stretch', position: 'absolute', top: -120, elevation: 10, zIndex: 10, borderRadius: 50, borderWidth: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  infoText: { textAlign: 'center', fontSize: 28, fontWeight: 'bold', marginTop: -10 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginVertical: 10 },
  container: { margin: 10, borderRadius: 10, elevation: 2, shadowColor: '#2600ffff', shadowOffset: { width: 1, height: 1 }, shadowOpacity: 0.8, shadowRadius: 2 },
  content: { padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  icon: { width: 50, height: 50 },
  name: { fontWeight: 'bold', textAlign: 'center', fontSize: 25, marginTop: 8 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  currency: { fontSize: 12, marginRight: 8 },
  price: { fontWeight: 'bold', fontSize: 25 },
  iconButton: {
    padding: 10,
    alignItems: "flex-end",
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_HEIGHT * 0.2,
    marginStart: 30,
  },
  categoryImage: {
    width: 100,
    height: 100,
    borderRadius: 25,
    marginLeft: -50,

  },
  driverImage: {
    width: 50,
    height: 50,
    zIndex: 10,
    borderWidth: 1,
    borderRadius: 25,
    marginTop: 20,
    marginRight: -45,
  },
  driverDetails: {
    flex: 1,
  },
  eta: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
  licensePlate: {
    fontSize: 14,
    fontWeight: "bold",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    alignContent: "center",
    marginTop: 20,
    marginLeft: SCREEN_WIDTH * 0.5,
    zIndex: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
    marginRight: -60,
    marginBottom: 10,
  },
  rating: {
    fontSize: 12,
    color: "#000",
    marginRight: 10,
    marginTop: 120,

  },
  driverName: {
    marginTop: 90,
    marginRight: -30,
    fontWeight: "bold",
    fontSize: 20,
    color: "#000",
  },
  safetyNote: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
});

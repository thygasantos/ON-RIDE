import React, { useEffect, useRef, useState, useMemo } from 'react';
import { StyleSheet, FlatList, Text, Dimensions, View, Pressable, TextInput, ScrollView, Image, Alert, TouchableOpacity, } from "react-native";
import BottomSheet from "react-native-simple-bottom-sheet";
import { CommonActions, NavigationContainer, useNavigation } from '@react-navigation/native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from "react-native-maps-directions";
import { requestForegroundPermissionsAsync, getCurrentPositionAsync, watchPositionAsync, LocationObject, LocationAccuracy } from "expo-location";
import * as Location from "expo-location";
import { Avatar, Button, Card } from "react-native-paper";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome6 } from '@expo/vector-icons';
import { Ionicons } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Octicons from "@expo/vector-icons/Octicons";
import { Marker, LatLng } from "react-native-maps";
import MapQuestAutocomplete from '@/components/MapQuestAutocomplete';
import Constants from "expo-constants";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from "react-native";



const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const GOOGLE_MAPS_APIKEY = process.env.GOOGLE_MAPS_APIKEY;



export default function category({ route, navigation }) {
  const [categorys, setCategorys] = useState([]);
  const [delivery, setDelivery] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [dns, setIpAddress] = useState('');
  const [location, setLocation] = useState<LocationObject | null>(null);
  const mapRef = useRef<MapView>(null);
  const [origin, setOrigin] = useState([]);
  const [info, setInfo] = useState([]);
  const [address, setAddress] = useState('LOADING ...');
  const [suburb, setSuburb] = useState('');
  const [region, setRegion_code] = useState('');
  const [country, setCountry] = useState('');
  const [moeda, setCurrency] = useState(null);
  const [city, setCity] = useState('');
  const [showDirections, setShowDirections] = useState(true);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [result, setResult] = useState([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [data, setData] = useState([])
  const position = { lat: -16.72303141272937, lng: -43.86561901010458 };
  const [userData, setUserData] = useState('');
  const [displayCurrentAddress, setDisplayCurrentAddress] = useState('Location Loading.....');
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(false)
  const [polylineData, setPolylineData] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [polylineCoords, setPolylineCoords] = useState([]);
  const [latitude, setLatitude] = useState(route.params?.latitude || 0);
  const [longitude, setLongitude] = useState(route.params?.longitude || 0);
  const [dlatitude, setDlatitude] = useState(route.params?.d_latitude || '');
  const [dlongitude, setDlongitude] = useState(route.params?.d_longitude || '');
  const [destination, setDestination] = useState(route.params?.infoplace || '');
  const [showInfo, setShowInfo] = useState(route.params?.show || false);

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


  async function getAllCategory() {
    axios.get('https://on-host-api.vercel.app/getCategory')
      .then(res => {
        console.log(res.data);
        setCategorys(res.data.data);

      });
  }

  async function getAllDelivery() {
    axios.get('https://on-host-api.vercel.app/getDelivery')
      .then(res => {
        console.log(res.data);
        setDelivery(res.data.data);

      });
  }


  useEffect(() => {
    getAllDelivery();
    getAllCategory();
  }, []);

  const handleSelect = async (place: any) => {
    console.log('Selected place:', place);
    setShowInfo(true)
    setDestination(place.displayString);
    setDlatitude(place.place.geometry.coordinates[1]);
    setDlongitude(place.place.geometry.coordinates[0]);
  };


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

  }, [location?.coords]);



  useEffect(() => {
    (async () => {
      setLatitude(location?.coords.latitude)
      setLongitude(location?.coords.longitude)
    })();
  }, [location?.coords]);

  let text = 'Waiting..';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }
  console.warn("latitude: ", latitude);
  console.warn("longitude: ", longitude);

  useEffect(() => {
    const startWatching = async () => {
      await watchPositionAsync(
        {
          accuracy: Location.LocationAccuracy.Highest,
          timeInterval: 1000,
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
    (async () => {
      setLatitude(location?.coords.latitude);
      AsyncStorage.setItem('latitude', location?.coords.latitude);
      console.log("latitudeStart =>", latitude);
    })();
  }, [latitude]);

  useEffect(() => {
    (async () => {
      setLongitude(location?.coords.longitude);
      AsyncStorage.setItem('longitude', location?.coords.longitude);
      console.log("LongitudeStart =>", longitude);
    })();
  }, [longitude]);



  useEffect(() => {
    async function getAddress() {
      setLatitude(latitude);
      setLongitude(longitude);
      axios
        .get("https://api.mapbox.com/search/geocode/v6/reverse",
          {
            params: {
              longitude,
              latitude,
              access_token: 'pk.eyJ1IjoidGh5YWdvIiwiYSI6IlgyYnFZa3cifQ.sm008NJiQD9tNZHfXpu3EA',
            },
          }
        )
        .then(res => {
          console.log(JSON.stringify(res?.data?.features?.[0]?.properties?.full_address));
          AsyncStorage.setItem('address', res?.data?.features?.[0]?.properties?.full_address);
          setAddress(res?.data?.features?.[0]?.properties?.full_address);
        });
    }
    getAddress();
  }, [latitude, longitude]);



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


  useEffect(() => {
    (async () => {
      setDlatitude(dlatitude);
      AsyncStorage.setItem('dlatitude', dlatitude);
      console.log("dlatitude =>", dlatitude);
    })();
  }, [dlatitude]);


  useEffect(() => {
    (async () => {
      setDlongitude(dlongitude);
      AsyncStorage.setItem('dlongitude', dlongitude);
      console.log("dlongitude =>", dlongitude);
    })();
  }, [dlongitude]);


  useEffect(() => {
    (async () => {
      setDestination(infoplace);
      AsyncStorage.setItem('infoplace', infoplace);
      console.log("infoplace =>", infoplace);
    })();
  }, [destination]);


  useEffect(() => {
    (async () => {
      setShowInfo(show);
      AsyncStorage.setItem('show', show);
      console.log("show =>", show);
    })();
  }, [showInfo]);

  useEffect(() => {
    async function fetchDirections(longitude, latitude, dlongitude, dlatitude) {
      setLatitude(latitude);
      setLongitude(longitude);
      setDlatitude(dlatitude);
      setDlongitude(dlongitude);
      try {
        const response = await axios.get("https://api.mapbox.com/directions/v5/mapbox/driving/"+longitude+","+latitude+";"+dlongitude+","+dlatitude+"", {
          params: {
            access_token: 'pk.eyJ1IjoidGh5YWdvIiwiYSI6IlgyYnFZa3cifQ.sm008NJiQD9tNZHfXpu3EA',
            geometries: 'geojson',
            steps: true,
            alternatives: false,
            overview: 'full',
          },
        },
        );
        console.log("ROUTES IN PROGRESS =>", response.data.routes[0]);
        setResult(response.data.routes[0]);
        const route = response.data.routes[0];
        setRouteData(route);
        setPolylineCoords(
        route.geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }))
          );
        return response.data.routes[0];
      } catch (error) {
        console.error('Error fetching directions:', error);
        return null;
      }
    };

    fetchDirections(longitude, latitude, dlongitude, dlatitude);
  }, [longitude, latitude, dlongitude, dlatitude]);


  
  const convertTime = (time) => (time >= 10 ? (time / 60).toFixed(1) : time);
  const convert = (value) => (value >= 100 ? (value / 1000).toFixed(2) : value);


  function handleNavigate() {
    navigation.navigate("Confirm");
  }

  const CategoryCard = ({ data }) => {
    const priceData = useMemo(() => {
      if (!showInfo || !result?.distance) return { total: '0.00', taxKm: '0.00', taxApp: '0.00', distance: 0, duration: 0 };
      const distance = convert(result.distance);
      const duration = convertTime(result.duration);
      const total = parseFloat(
        Number(data.tax_km) * (Number(distance) + Number(data.valor) + Number(data.tax_app.replace("%", "")) / 100)
      ).toFixed(2);
      const taxKm = parseFloat(Number(data.tax_km) * Number(distance)).toFixed(2);
      const taxApp = parseFloat(
        (Number(data.tax_app.replace("%", "")) / 100) / Number(data.tax_km) * (Number(distance) + Number(data.valor))
      ).toFixed(2);
      return { total, taxKm, taxApp, distance, duration };
    }, [data.tax_km, data.valor, data.tax_app, result?.distance, showInfo]);

    return (
      <Pressable
        onPress={() =>
          navigation.push('Confirm', {
            id: data._id,
            showInfo,
            info: address,
            dlongitude,
            dlatitude,
            destination,
            km: priceData.distance,
            time: priceData.duration,
            polylineCoords,
            valor_total: priceData.total,
            tax_km: priceData.taxKm,
            tax_app: priceData.taxApp,
          })
        }
        style={({ pressed }) => [styles.container, { backgroundColor: pressed ? '#002efcb9' : 'white' }]}

      >
        <View style={styles.content}>
          <Image style={styles.icon} source={{ uri: data.icon }} />
          <Text style={styles.name}>{data.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>{userData.moeda || 'USD'}</Text>
            <Text style={styles.price}>{priceData.total}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const DeliveryCard = ({ data }) => {
    const priceData = useMemo(() => {
      if (!showInfo || !result?.distance) return { total: '0.00', taxKm: '0.00', taxApp: '0.00', distance: 0, duration: 0 };
      const distance = convert(result.distance);
      const duration = convertTime(result.duration);
      const total = parseFloat(
        Number(data.tax_km) * (Number(distance) + Number(data.valor) + Number(data.tax_app.replace("%", "")) / 100)
      ).toFixed(2);
      const taxKm = parseFloat(Number(data.tax_km) * Number(distance)).toFixed(2);
      const taxApp = parseFloat(
        (Number(data.tax_app.replace("%", "")) / 100) / Number(data.tax_km) * (Number(distance) + Number(data.valor))
      ).toFixed(2);
      return { total, taxKm, taxApp, distance, duration };
    }, [data.tax_km, data.valor, data.tax_app, result?.distance, showInfo]);

    return (
      <Pressable
        onPress={() =>
          navigation.push('Confirm', {
            id: data._id,
            showInfo,
            info: address,
            dlongitude,
            dlatitude,
            destination,
            km: priceData.distance,
            time: priceData.duration,
            polylineCoords,
            valor_total: priceData.total,
            tax_km: priceData.taxKm,
            tax_app: priceData.taxApp,
          })
        }
        style={({ pressed }) => [styles.container, { backgroundColor: pressed ? '#002efcb9' : 'white' }]}
      >
        <View style={styles.content}>
          <Image style={styles.icon} source={{ uri: data.icon }} />
          <Text style={styles.name}>{data.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>{userData.moeda || 'USD'}</Text>
            <Text style={styles.price}>{priceData.total}</Text>
          </View>
        </View>
      </Pressable>
    );
  };


  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.headerContainer}>
        <View style={styles.backIconWrapper}>
          <MaterialCommunityIcons
            onPress={() => navigation.goBack()}
            style={styles.backIcon}
            name='arrow-left'
            size={36}
            color="black"
          />
        </View>
      </View>
      <View style={styles.searchWrapper}>
        <Image style={styles.transitIcon} source={require("@/assets/transit.png")} />
        <TextInput
          style={styles.addressInput}
          editable={false}
          value={address}
          onChange={e => setAddress(e.nativeEvent.text)}
        />
      <View style={styles.autocompleteContainer}>
      <MapQuestAutocomplete onSelect={handleSelect} />
      </View>
      </View>
      <View style={styles.mapContainer}>
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
            style={styles.map}
          >
            <Marker title={address} coordinate={{ latitude: location?.coords.latitude, longitude: location?.coords.longitude }}>
              <Image source={require('@/assets/location.png')} style={styles.markerIcon} />
            </Marker>

            <Marker title={destination} coordinate={{ latitude: dlatitude, longitude: dlongitude }} pinColor="blue" />
           
            {polylineCoords.length > 0 && (
              <Polyline coordinates={polylineCoords} strokeWidth={3} strokeColor="blue" />
            )}
          </MapView>
        )}
      </View>
      <BottomSheet isOpen sliderMinHeight={255}>
        <View style={{ width: 48, height: 48, marginStart: 270, alignSelf: 'stretch', position: 'absolute', top: -120, elevation: 10, zIndex: 10, flexWrap: 'wrap', borderRadius: 50, borderWidth: 1, backgroundColor: 'white' }}>
          <TouchableOpacity onPress={handleCamera} style={{ marginTop: 5, marginLeft: 6 }}>
            <FontAwesome6 size={34} name='location-crosshairs' color="black" />
          </TouchableOpacity>
        </View>
        {showInfo ? (
          <Text style={styles.infoText}>
            Km : {convert(result?.distance)} Min : {convertTime(result?.duration)}
          </Text>
        ) : null}
      <FlatList
          data={[
            { title: 'Popular', data: categorys },
            { title: 'Delivery', data: delivery },
          ]}
          keyExtractor={(item, index) => item.title + index}
          renderItem={({ item }) => (
            <View>
              <Text style={styles.sectionTitle}>{item.title}</Text>
              <FlatList
                data={item.data}
                keyExtractor={subItem => subItem._id}
                renderItem={({ item: subItem }) => (
                  item.title === 'Popular' ? <CategoryCard data={subItem} /> : <DeliveryCard data={subItem} />
                )}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
              />
            </View>
          )}
        />
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "flex-start"
  },
  headerContainer: {
    borderRadius: 50,
    elevation: 10,
    flexWrap: "wrap",
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  backIconWrapper: {
    position: "absolute",
    top: 50,
    left: 20,
    borderRadius: 50,
    backgroundColor: "white",
    zIndex: 100,
    elevation: 10,
  },
  backIcon: {
    alignSelf: "center",
  },
  searchWrapper: {
    position: "absolute",
    width: 270,
    height: 115,
    zIndex: 10,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    alignSelf: "center",
    left: SCREEN_WIDTH * 0.2,
  },
  transitIcon: {
    height: 65,
    width: 25,
    marginRight: 10,
  },
  addressInput: {
    borderRadius: 50,
    backgroundColor: "gray",
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
    width: 200,
    height: 35,
    fontSize: 18,
    marginLeft: 10,
    marginTop: -50,
  },
  placeInput: {
    backgroundColor: "white",
    borderRadius: 50,
    borderColor: "blue",
    borderWidth: 2,
    width: 200,
    color: "blue",
    alignItems: "center",
    height: 35,
    textAlign: "center",
    fontSize: 28,
    marginRight: 10,
    marginTop: 30,
    marginBottom: -20,
  },
  placeContainer: {
    alignItems: "center",
    position: "absolute",
    justifyContent: "center",
    width: 200,
    borderWidth: 0,
    marginLeft: 70,
    marginBottom: 30,
    fontWeight: "bold",
    fontSize: 38,
    zIndex: 100,
    elevation: 10,

  },
  mapContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: -10,
    marginTop: -30,
  },
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  markerIcon: {
    width: 20,
    height: 20,
    borderRadius: 9,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: -10,
  },
  scrollView: {
    marginBottom: 30,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 10,
  },
  autocompleteContainer: {
  position: 'absolute',
  top: 40, // Adjusts the position below the address TextInput
  left: 45, // Aligns with the transitIcon and TextInput padding
  width: SCREEN_WIDTH * 0.65, // Matches the width of searchWrapper for consistency
  zIndex: 100, // Ensures it appears above other elements
  borderRadius: 10, // Consistent with other UI elements
  paddingHorizontal: 10, // Adds padding for better appearance
  paddingVertical: 5, // Adds vertical padding for content
  },
  container: {
    margin: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#2600ffff',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  content: {
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  icon: {
    width: 50,
    height: 50,
  },
  name: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 25,
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  currency: {
    fontSize: 12,
    marginRight: 8,
  },
  price: {
    fontWeight: 'bold',
    fontSize: 25,
  },
  // ...other styles reused from before
});


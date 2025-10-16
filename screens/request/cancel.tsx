import { StyleSheet, Text, Dimensions, View, ActivityIndicator, Image, Button } from "react-native";
import { CommonActions, NavigationContainer, useNavigation } from '@react-navigation/native';
import { requestForegroundPermissionsAsync, getCurrentPositionAsync, watchPositionAsync, LocationObject, LocationAccuracy } from "expo-location";
import * as Location from "expo-location";
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import BottomSheet from 'react-native-simple-bottom-sheet';
import MapView , { PROVIDER_GOOGLE } from 'react-native-maps';
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Linking from 'expo-linking';
import { Marker } from "react-native-maps";
import axios from "axios";



const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;


export default function cancel({route, navigation}) {
    const position = {lat: 53.54992, lng: 10.00678};
    const [location, setLocation] = useState<LocationObject | null>(null);
    const mapRef = useRef<MapView>(null);
    const [requestdata, setRequestData] = useState('');
    const { requestId } = route.params;
    const { dlatitude } = route.params;
    const { dlongitude } = route.params;
    const [loading, setLoading] = useState(true);



    async function getRequest() {
      setLoading(true);
      axios.get('https://on-host-api.vercel.app/GetRequest/' + requestId)
      .then(res => {console.log(res.data);
        setRequestData(res.data.data);
        setLoading(false);
        });
    }
    

    useEffect(() => {
      (async () => {
      getRequest();
         })();
      }, [requestdata]);


    const [variant, setVariant] = useState('process');

    const toggleVariant = useCallback(() => {
      setVariant((currentVariant) => currentVariant === 'process' ? 'accept' : 'process' );
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
      mapRef.current?.animateCamera({
        pitch: 30,
        center: response.coords,
        zoom: 13

      })
    });
    
        }, []);

        function handleHome(){
          navigation.dispatch(CommonActions.navigate({ name: 'Dashboard' }));
         }

    return (
        <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, flex: 1, backgroundColor: 'black', justifyContent: 'flex-start'}}>
        <View style={{ backgroundColor: 'white', zIndex: 10, elevation: 10 , flexWrap: 'wrap'}}>
          <View style={{ position: 'absolute', top: 35, elevation: 10, display: 'flex' , backgroundColor:"white", marginTop:-10, marginLeft: 22, borderRadius:50, zIndex: 10 }} >            
           <MaterialCommunityIcons onPress={() => handleHome()}  style={{  elevation:10, zIndex: 10, display: 'flex' }} name='arrow-left' size={50} color="black" position="absolute" top="55%" alignSelf="left" pandding="10" />
          </View>
           </View>
           <View style={{ position: 'absolute', flex:1, width: SCREEN_WIDTH * 0.70, height: 70 , zIndex:10, marginTop: 20, borderRadius:10, backgroundColor: 'white', marginStart: 100,}}>
             <Image style={{marginStart: 20 , marginTop: 5, height: 50, width: 50 }} source={{uri: "https://on-host-api.vercel.app/static/origin-online.gif",}}/>
             
           <View style={{ width: 250, alignItems: 'center', justifyContent: 'center' , marginStart: 60, }}>
           <Text style={{ marginTop: -48, fontWeight: "bold",}}>{requestdata?.info}</Text>
                       
           </View>
           </View>
           <View style={{ zIndex: -10 , marginTop: -30, width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
           {
             location &&
    
            <MapView ref={mapRef} initialRegion={{latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }} showsMyLocationButton={true} followsUserLocation={true} provider={PROVIDER_GOOGLE} style={{ width: SCREEN_WIDTH , height: SCREEN_HEIGHT }} >
             <Marker coordinate = {{latitude: location.coords.latitude, longitude: location.coords.longitude}} >
              <Image 
                                source ={require('@/assets/location.png')}
                                style ={ {width: 20,
                                  height: 20,
                                  borderRadius:9,
                                  backgroundColor:"black",
                                  alignItems:"center",
                                  justifyContent:"center"}}
                                
                   />
             </Marker>
             <Marker coordinate = {{latitude: dlatitude, longitude: dlongitude }} pinColor = {"blue"}          
              />  
            </MapView>
           }
             </View>
          <BottomSheet isOpen sliderMinHeight={'155'} >
            <View style={{alignItems: "center", alignContent: "center"}}>
            <Image  source={{ uri: 'https://on-host-api.vercel.app/static/cancel.png' }} style={{ marginTop: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 100, width: 100, height: 100,  }} />
            <Text style={{ margin: 10, color: "#FF0000", fontStyle: 'italic', width: "auto", fontSize: 35, padding: 10, fontWeight: "bold", textAlign: "center" }}>CANCELED</Text>
            </View>
            </BottomSheet>
        </View>
    );
};

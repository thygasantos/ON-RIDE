import { StyleSheet, Text, Dimensions, View, ActivityIndicator, Image, TextInput, ScrollView } from "react-native";
import { CommonActions, NavigationContainer, useNavigation } from '@react-navigation/native';
import { requestForegroundPermissionsAsync, getCurrentPositionAsync, watchPositionAsync, LocationObject, LocationAccuracy } from "expo-location";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from 'react-native-simple-bottom-sheet';
import MapView , { Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Marker } from "react-native-maps";
import axios from "axios";
import { Card } from "react-native-paper";



const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;


export default function drive({ route, navigation }) {
    const position = {lat: 53.54992, lng: 10.00678};
    const [location, setLocation] = useState<LocationObject | null>(null);
    const mapRef = useRef<MapView>(null);
    const [counter, setCounter] = useState(60);
    const [minute, setMinute] = useState(4);
    const [initialCount, setInitialCount] = useState(0);
    const [requestdata, setRequestData] = useState('');
    const [categoryData, setCategoryData] = useState('');
    const [drivedata, setDriveData] = useState('');
    const { requestId } = route.params;
    const { dlatitude } = route.params;
    const { dlongitude } = route.params;
    const [loading, setLoading] = useState(true);




    async function getRequest() {
        setLoading(true);
        axios.get('https://on-host-api.vercel.app/GetRequest/' + requestId)
          .then(res => {
            console.log(res.data)
            setRequestData(res.data.data)
            if (res.data.data.status == 'canceled') {
              navigation.navigate("cancel", { requestId: requestId, dlatitude: dlatitude, dlongitude: dlongitude });
            }
            setLoading(false);
          });
      }
    
    
      useEffect(() => {
        (async () => {
          getRequest();
        })();
      }, [requestdata]);
    
      
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


    useEffect(() => {
      const moveTo = async () => {
        const camera = await mapRef.current?.getCamera();
        if (camera) {
          mapRef.current?.animateCamera({
          center: {
             latitude: dlatitude,
             longitude: dlongitude,
          },
             zoom: 13,
          }, {duration: 1000});
        }
      };
      }, [dlatitude, dlongitude]);


      function handleCancel() {
        const formdata = {
          requestId: requestId,
          status: 'canceled',
        };
        axios
          .post('https://on-host-api.vercel.app/update-request', formdata)
          .then(res => {
            console.log(res.data)
            if (res.data.status == 'Ok') {
              navigation.navigate("cancel", { requestId: requestId, dlatitude: dlatitude, dlongitude: dlongitude });
            }
          });
      }
    
    return (
        <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, flex: 1, backgroundColor: 'black' , justifyContent: 'flex-start'}}>
   <View style={{ backgroundColor: 'white', zIndex: 100, elevation: 10 , flexWrap: 'wrap'}}>
          <View style={{ position: 'absolute', top: 35, elevation: 10, display: 'flex' , backgroundColor:"white", marginTop:-10, marginLeft: 22, borderRadius:50, zIndex: 100 }} >            
           <MaterialCommunityIcons onPress={() => navigation.goBack()}  style={{  elevation:10, zIndex: 100, display: 'flex' }} name='arrow-left' size={50} color="black" position="absolute" top="55%" alignSelf="left" pandding="10" />
          </View>
           </View>
            <View style={{ position: 'absolute', flex:1, width: 350, height: 60 , zIndex:10, marginTop: 20, borderRadius:10, backgroundColor: 'white', marginStart: 100,}}>
            <Image style={{marginStart: 20 , marginTop: 5, height: 50, width: 50 }} source={{uri: "https://on-host-api.vercel.app/static/origin-online.gif",}}/>
  
            <View style={{ width: 250, alignItems: 'center', justifyContent: 'center' , marginStart: 60, }}>
            <Text style={{ marginTop: -48, fontWeight: "bold",}}>{requestdata?.info}</Text>
            
            </View>
           </View>
           <View style={{ zIndex: -10 , marginTop: -30, width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
           {
             location &&
    
            <MapView ref={mapRef} initialRegion={{latitude: location?.coords.latitude, longitude: location?.coords.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }} showsMyLocationButton={true} followsUserLocation={true} provider={PROVIDER_GOOGLE} style={{ width: SCREEN_WIDTH , height: SCREEN_HEIGHT }} >
             <Marker coordinate = {{latitude: location?.coords.latitude, longitude: location?.coords.longitude}} >
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
          <BottomSheet isOpen sliderMinHeight={'155'}>
          <Text style={{ textAlign: "center", fontSize: 28, fontWeight: 'bold', marginTop: -10, padding: 10 }}>Km : {requestdata?.distance} Time : {requestdata?.time}  </Text>
          <View style={{ justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
          <Text style={{fontSize: 18, marginTop: 10, marginEnd: 110, alignSelf: 'flex-start' }}>{requestdata?.moeda}</Text>
          <Text style={{ fontSize: 45, fontWeight: 'bold', marginTop: -40  }}> {requestdata?.valor} </Text>
          </View>
           <Card style={{ margin: 10, height: 240 }}>
            <Card.Content>
              <Image style={{ width : 50, height: 50, borderRadius: 100, }} source={{ uri: 'https://on-host-api.vercel.app/static/default-blue.png' }}/><Text style={{ fontWeight: 'bold', textAlign: 'center', fontSize: 18, marginTop: -25, }}>username</Text><Text style={{ marginTop: -20, alignSelf: 'flex-end', fontSize: 12, marginRight: 50 }}>{requestdata?.moeda}</Text><Text style={{ marginTop: -25, alignSelf: 'flex-end', fontWeight: 'bold', textAlign: 'center', fontSize: 25 }}>{requestdata?.valor}</Text>
            </Card.Content>
            <Card.Content>
            <Image style={{marginStart: 20 , marginTop: 40, height: 65, width: 25 }} source={require("@/assets/transit.png")}/>
             <Text style={{ fontWeight: "bold", marginStart: 60, zIndex: 10, marginTop: -65, fontSize: 18 }}>{requestdata?.info}</Text>
             <Text style={{ fontWeight: "bold", marginStart: 60, zIndex: 10, marginTop: 10, fontSize: 18 }}>{requestdata?.d_info}</Text>
            </Card.Content>
          </Card>
          <View style={{ padding: 10 }}>
          <Text onPress={() => handleCancel()} style={{ fontSize: 18, color: "red", fontWeight: "bold", textAlign: "center" }}>CANCEL </Text>
          </View>
        </BottomSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
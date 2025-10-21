import { Dimensions, Image, Pressable, StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Animated } from "react-native";
import { Card } from "react-native-paper";
import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requestForegroundPermissionsAsync, getCurrentPositionAsync } from "expo-location";

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function Feed({ navigation }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requests, setRequests] = useState([]);
  const [userData, setUserData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Convert Decimal128 to string
  const convertDecimal128 = (value) => {
    if (value && typeof value === 'object' && '$numberDecimal' in value) {
      return value.$numberDecimal.toString();
    }
    return value?.toString() || '';
  };

  // Request location permissions
  const requestLocationPermissions = useCallback(async () => {
    try {
      const { granted } = await requestForegroundPermissionsAsync();
      if (granted) {
        const currentPosition = await getCurrentPositionAsync();
        setLatitude(currentPosition.coords.latitude);
        setLongitude(currentPosition.coords.longitude);
      } else {
        setErrorMsg('Permission to access location was denied');
      }
    } catch (error) {
      console.error('Location permission error:', error);
      setErrorMsg('Failed to get location');
    }
  }, []);

  // Get user data
  const getData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setErrorMsg('No user token found');
        return;
      }
      const res = await axios.post('https://on-host-api.vercel.app/userdata', { token });
      setUserData(res.data.data);
    } catch (error) {
      console.error('User data fetch error:', error);
      setErrorMsg('Failed to fetch user data');
    }
  }, []);

  // Get location details (city, region, country)
  const getLocationDetails = useCallback(async () => {
    if (!latitude || !longitude) return;
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
      const { city, state, country } = res.data.address || {};
      setCity(city || '');
      setRegion(state || '');
      setCountry(country || '');
      await AsyncStorage.setItem('city', city || '');
      await AsyncStorage.setItem('region', state || '');
      await AsyncStorage.setItem('country', country || '');
    } catch (error) {
      console.error('Location details fetch error:', error);
      setErrorMsg('Failed to fetch location details');
    }
  }, [latitude, longitude]);

  // Get all requests
  const getAllRequests = useCallback(async () => {
    if (!userData?.city) return;
    setLoading(true);
    try {
      const res = await axios.get(`https://on-host-api.vercel.app/requestdrive?city=${userData.city}`);
      const convertedRequests = res.data.data.map(request => ({
        ...request,
        valor: convertDecimal128(request.valor),
        distance: convertDecimal128(request.distance),
        time: convertDecimal128(request.time),
      }));
      setRequests(convertedRequests);
    } catch (error) {
      console.error('Requests fetch error:', error);
      setErrorMsg('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, [userData?.city]);

  // Handle request selection
  const handleRequestSelect = useCallback(async (requestId) => {
    setLoading(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    try {
      await AsyncStorage.setItem('requestId', requestId);
      const res = await axios.get(`https://on-host-api.vercel.app/GetRequestDrive/${requestId}`);
      const requestData = res.data.data;
      setSelectedRequest({
        ...requestData,
        valor: convertDecimal128(requestData.valor),
        distance: convertDecimal128(requestData.distance),
        time: convertDecimal128(requestData.time),
      });
    } catch (error) {
      console.error('Request fetch error:', error);
      setErrorMsg('Failed to fetch request details');
    } finally {
      setLoading(false);
    }
  }, [fadeAnim, scaleAnim]);

  // Handle accept request
  const handleAccepted = useCallback(async () => {
    if (!selectedRequest || !userData) return;
    setLoading(true);
    try {
      const formdata = {
        requestId: selectedRequest._id,
        status: 'accepted',
        userDrive: userData._id,
      };
      const res = await axios.post('https://on-host-api.vercel.app/accepted-request', formdata);
      if (res.data.status === 'Ok') {
        navigation.navigate("Explore", { requestId: selectedRequest._id });
        setSelectedRequest(null);
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        setErrorMsg('Failed to accept request');
      }
    } catch (error) {
      console.error('Accept request error:', error);
      setErrorMsg('Failed to accept request');
    } finally {
      setLoading(false);
    }
  }, [selectedRequest, userData, navigation, fadeAnim]);

  // Handle cancel request
  const handleCancel = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedRequest(null));
  }, [fadeAnim]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getAllRequests();
    setRefreshing(false);
  }, [getAllRequests]);

  // Initial setup
  useEffect(() => {
    requestLocationPermissions();
    getData();
  }, [requestLocationPermissions, getData]);

  // Update location details when coordinates change
  useEffect(() => {
    getLocationDetails();
  }, [latitude, longitude, getLocationDetails]);

  // Fetch requests when userData changes
  useEffect(() => {
    getAllRequests();
  }, [userData, getAllRequests]);

  const RequestCard = ({ data }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
      Animated.spring(scale, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View style={[styles.cardContainer, { transform: [{ scale }] }]}>
        <Pressable onPress={() => handleRequestSelect(data._id)} onPressIn={onPressIn} onPressOut={onPressOut}>
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardIconContainer}>
                <FontAwesome size={32} name="car" color="#333" />
                <Image style={styles.transitIcon} source={require("@/assets/transit.png")} />
              </View>
              <Text style={styles.cardInfo}>{data.info || 'No info'}</Text>
              <Text style={styles.cardDestination}>{data.d_info || 'No destination'}</Text>
              <View style={styles.cardValueContainer}>
                <Text style={styles.cardCurrency}>{data.moeda || ''}</Text>
                <Text style={styles.cardValue}>{data.valor || '0'}</Text>
              </View>
            </Card.Content>
          </Card>
        </Pressable>
      </Animated.View>
    );
  };

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {loading ? <ActivityIndicator size="large" color="#fff" /> : 'No calls in process'}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={getAllRequests}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity onPress={() => setErrorMsg(null)}>
            <Text style={styles.errorDismiss}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
      {selectedRequest && (
        <Animated.View style={[styles.requestDetails, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.callInProgress}>Call in Progress</Text>
          <View style={styles.requestInfoContainer}>
            <Text style={styles.requestCurrency}>{selectedRequest.moeda || ''}</Text>
            <Text style={styles.requestValue}>{selectedRequest.valor || '0'}</Text>
            <Text style={styles.requestMetrics}>
              <FontAwesome size={14} name="star" color="#FFD700" /> 5.0 | KM: {selectedRequest.distance || '0'} | Time: {selectedRequest.time || '0'}
            </Text>
          </View>
          <View style={styles.requestDetailsContent}>
            <Image style={styles.requestTransitIcon} source={require("@/assets/transit.png")} />
            <Text style={styles.requestInfoText}>{selectedRequest.info || 'No info'}</Text>
            <Text style={styles.requestDestination}>{selectedRequest.d_info || 'No destination'}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.acceptButton, loading && styles.disabledButton]}
                onPress={handleAccepted}
                disabled={loading}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
      <FlatList
        data={requests}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={ListEmptyComponent}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <RequestCard data={item} />}
        onEndReached={getAllRequests}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    width: SCREEN_WIDTH,
  },
  errorContainer: {
    backgroundColor: '#FF4D4D',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorDismiss: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardIconContainer: {
    marginRight: 12,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transitIcon: {
    position: 'absolute',
    width: 20,
    height: 40,
    left: 24,
    top: 8,
  },
  cardInfo: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cardDestination: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    color: '#666',
    marginTop: 4,
  },
  cardValueContainer: {
    alignItems: 'flex-end',
  },
  cardCurrency: {
    fontSize: 12,
    color: '#666',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007bff',
  },
  requestDetails: {
    backgroundColor: '#FFF',
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  callInProgress: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  requestInfoContainer: {
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  requestCurrency: {
    fontSize: 16,
    color: '#666',
  },
  requestValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#007bff',
    marginVertical: 8,
  },
  requestMetrics: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  requestDetailsContent: {
    padding: 16,
    alignItems: 'center',
  },
  requestTransitIcon: {
    width: 24,
    height: 48,
    marginBottom: 8,
  },
  requestInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginVertical: 8,
  },
  requestDestination: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  acceptButton: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    opacity: 0.7,
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF4D4D',
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FF4D4D',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: SCREEN_HEIGHT * 0.5,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
    paddingTop: 8,
  },
});

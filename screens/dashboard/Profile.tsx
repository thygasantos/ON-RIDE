import { View, Text, Image, Dimensions, ActivityIndicator } from 'react-native'
import { DrawerActions, useNavigation } from '@react-navigation/native';
import React, { useContext, useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'; // For star icons
import axios from 'axios';


const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;


export default function Profile() {
  const navigation = useNavigation();
  const [userData, setUserData] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function getData() {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.post('https://on-host-api.vercel.app/userdata', { token });
      if (response.data?.data) {
        setUserData(response.data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, []);


  const renderStars = (rating) => {
    const stars = [];
    const maxStars = 5;
    for (let i = 1; i <= maxStars; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= (rating || 4) ? 'star' : 'star-outline'}
          size={50}
          color="#FFD700"
          style={{ marginHorizontal: 2 , marginTop: -20 }}
        />
      );
    }
    return stars;
  };


  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }


  return (
    <View style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH, flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black', }}>
      <View style={{ justifyContent: 'center', alignItems: 'center', }}>
        <Image source={{ uri: userData?.image || 'https://on-host-api.vercel.app/static/default-blue.png' }} style={{ marginTop: 250, paddingTop: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 100, width: 100, height: 100, }} />

        <Text style={{ padding: 10, fontWeight: 'bold', fontSize: 28, color: 'white', }}>{userData?.name || 'Username'}</Text>
        <View style={{ marginTop: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', width: SCREEN_WIDTH, height: SCREEN_HEIGHT, borderTopLeftRadius: 50, borderTopRightRadius: 50 }}>
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Requests</Text>
            <Text style={styles.sectionTitle}>-</Text>
            <Text style={styles.requestsText}>
              {userData?.requestCount || 0}
            </Text>
          </View>
          <View style={{ width: SCREEN_WIDTH * 0.7 , borderColor: '#0000003f' , borderWidth: 1, marginTop: 10 }}/>
          <Text style={{ fontSize: 55 , marginTop: 50 }} > 4/5 </Text>
          <View style={styles.ratingContainer}>
            {renderStars(userData?.rating)}
            <Text style={styles.ratingText}>({userData?.rating || 4}/5)</Text>
          </View>
          <Text style={styles.infoText}>Joined: {userData?.createAt ? new Date(userData.createAt).toLocaleDateString() : 'N/A'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  profileContainer: {
    alignItems: 'center',
    paddingTop: 50,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginTop: 100,
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 50,
  },
  ratingText: {
    color: '#000',
    fontSize: 16,
    marginLeft: 8,
  },
  requestsText: {
    color: '#000',
    fontSize: 28,
    marginTop: -50,
    flexdirection: 'row',
    marginBottom: 40,
  },
  infoCard: {
    width: SCREEN_WIDTH * 0.9,
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    marginTop: -250,
  },
  sectionTitle: {
    fontSize: 35,
    fontWeight: '600',
    marginBottom: 1,
    padding: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginTop: 30,
    marginVertical: 5,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 18,
    textAlign: 'center',
  },
};

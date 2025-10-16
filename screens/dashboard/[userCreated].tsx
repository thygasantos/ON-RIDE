import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { AntDesign } from "@expo/vector-icons";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function Arrows({ route, navigation }) {
  const [userData, setUserData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Request location permissions and watch position
  useEffect(() => {
    let subscription;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          return;
        }

        const currentPosition = await Location.getCurrentPositionAsync({});
        setLocation(currentPosition);

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.LocationAccuracy.Highest,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (response) => {
            setLocation(response);
          }
        );
      } catch (error) {
        setErrorMsg("Error fetching location");
        console.error(error);
      }
    })();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Fetch user data
  useEffect(() => {
    const getData = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setErrorMsg("No authentication token found");
          return;
        }
        const response = await axios.post(
          "https://on-host-api.vercel.app/userdata",
          { token }
        );
        setUserData(response.data.data);
      } catch (error) {
        setErrorMsg("Error fetching user data");
        console.error(error);
      }
    };
    getData();
  }, []);

  // Update location to server
  useEffect(() => {
    if (userData && location) {
      const updateLocation = async () => {
        try {
          const formdata = {
            email: userData.email,
            dns: "", // Assuming dns is not needed or fetched elsewhere
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          const response = await axios.post(
            "https://on-host-api.vercel.app/update-location",
            formdata
          );
          if (response.data.status !== "Ok") {
            console.warn("Location update failed");
          }
        } catch (error) {
          console.error("Error updating location:", error);
        }
      };
      updateLocation();
    }
  }, [userData, location]);

  // Fetch requests
  const getAllRequest = async () => {
    if (!userData?._id) return;
    try {
      setLoading(true);
      const response = await axios.get(
        `https://on-host-api.vercel.app/requestdata/${userData._id}?page=${page}`
      );
      setRequests((prev) => [...prev, ...response.data.data]);
      setPage((prev) => prev + 1);
    } catch (error) {
      setErrorMsg("Error fetching requests");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?._id) {
      getAllRequest();
    }
  }, [userData]);

  const handleLoadMore = () => {
    if (!loading) {
      getAllRequest();
    }
  };

  const myListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No Requests</Text>
    </View>
  );

  const RequestItem = ({ data }) => {
    // Format date using native JavaScript (fixed field name to 'createAt' based on original API response)
    const formattedDate = data.createAt
      ? new Date(data.createAt).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      : "Invalid Date";

    return (
      <View style={styles.requestItem}>
        <View style={styles.header}>
          <Image
            source={require("@/assets/icon.png")} // Placeholder icon
            style={styles.icon}
          />
          <View>
            <Text style={styles.status}>{data.status}</Text>
            <Text style={styles.date}>{formattedDate}</Text>
            <TouchableOpacity>
              <Text style={styles.currency}>
                {data.moeda}
              </Text>
              <Text style={styles.valor}>
                {data?.valor?.$numberDecimal
                  ? parseFloat(Number(data.valor.$numberDecimal)).toFixed(2)
                  : "0.00"}
              <AntDesign name="right" size={18} color="black" style={{margin: 3}} />
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.content}>
          <Image
            style={styles.transitIcon}
            source={require("@/assets/transit.png")}
          />
          <Text style={styles.title}>{data.info}</Text>
          <Text style={styles.subtitle}>{data.d_info}</Text>
        </View>
        <Image
          style={styles.image}
          source={require("@/assets/icon.png")} // Replace with dynamic image if available
        />
      </View >
    );
  };

  return (
    <View style={styles.container}>
      {errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : (
        <FlatList
          data={requests}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={myListEmpty}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <RequestItem data={item} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            loading ? (
              <ActivityIndicator size="large" color="white" style={styles.loader} />
            ) : (
              <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  requestItem: {
    margin: 10,
    width: SCREEN_WIDTH * 0.9,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  status: {
    fontSize: 18,
    fontWeight: "bold",
  },
  date: {
    fontSize: 14,
    color: "#666",
  },
  content: {
    marginBottom: 10,
  },
  transitIcon: {
    marginLeft: 3,
    marginTop: 18,
    height: 95,
    width: 25,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 35,
    marginTop: -100,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    fontWeight: "bold",
    marginLeft: 35,
    marginTop: 10,
  },
  valor: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2e7d32",
    marginTop: -35,
    marginLeft: 190,
    alignSelf: "flex-end",
    alignContent: "space-between",
    alignItems: "flex-end",
  },
  currency: { 
    fontSize: 16,
    marginLeft: 155,
    marginTop: -30,
  },
  image: {
    height: 180,
    width: SCREEN_WIDTH * 0.8,
    borderRadius: 10,
    alignSelf: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "#fff",
    fontSize: 25,
  },
  errorText: {
    color: "red",
    fontSize: 18,
    textAlign: "center",
    margin: 20,
  },
  loadMoreButton: {
    alignItems: "center",
    padding: 16,
  },
  loadMoreText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  loader: {
    marginVertical: 20,
  },
});

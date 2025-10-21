import React, { useCallback, useEffect, useState } from "react";
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
import axios, { AxiosError } from "axios";
import { AntDesign } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import type { NavigationProp, RouteProp } from "@react-navigation/native";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface Request {
  _id: string;
  status: string;
  createAt: string;
  moeda: string;
  valor: { $numberDecimal: string };
  info: string;
  d_info: string;
}

interface UserData {
  _id: string;
  email: string;
}

interface LocationData {
  coords: {
    latitude: number;
    longitude: number;
  };
}

interface Props {
  route: RouteProp<any, any>;
  navigation: NavigationProp<any>;
}

const Arrows: React.FC<Props> = ({ route, navigation }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);

  // Show toast notification
  const showToast = useCallback(
    (type: "success" | "error", text1: string, text2?: string) => {
      Toast.show({
        type,
        text1,
        text2,
        position: "top",
        visibilityTime: 3000,
      });
    },
    []
  );

  // Request location permissions and watch position
  const setupLocation = useCallback(async () => {
    let subscription: Location.LocationSubscription | null = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        showToast("error", "Location Error", "Permission to access location denied");
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
      showToast("error", "Location Error", "Failed to fetch location");
      console.error("Error fetching location:", error);
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [showToast]);

  // Fetch user data
  const getUserData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setErrorMsg("No authentication token found");
        showToast("error", "Authentication Error", "No token found");
        return;
      }
      const response = await axios.post<{ data: UserData }>(
        "https://on-host-api.vercel.app/userdata",
        { token }
      );
      setUserData(response.data.data);
    } catch (error) {
      setErrorMsg("Error fetching user data");
      showToast("error", "User Data Error", "Failed to fetch user data");
      console.error("Error fetching user data:", error);
    }
  }, [showToast]);

  // Update location to server
  const updateLocation = useCallback(async () => {
    if (!userData || !location) return;

    try {
      const formData = {
        email: userData.email,
        dns: "", // Assuming dns is not needed or fetched elsewhere
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      const response = await axios.post<{ status: string }>(
        "https://on-host-api.vercel.app/update-location",
        formData
      );
      if (response.data.status === "Ok") {

      } else {
        console.warn("Location update failed");
        showToast("error", "Location Update Failed", "Failed to update location");
      }
    } catch (error) {
      console.error("Error updating location:", error);
      showToast("error", "Location Error", "Failed to update location");
    }
  }, [userData, location, showToast]);

  // Fetch requests
  const getAllRequests = useCallback(async () => {
    if (!userData?._id) return;
    try {
      setLoading(true);
      const response = await axios.get<{ data: Request[] }>(
        `https://on-host-api.vercel.app/requestdata/${userData._id}?page=${page}`
      );
      setRequests((prev) => [...prev, ...response.data.data]);
      setPage((prev) => prev + 1);
    } catch (error) {
      setErrorMsg("Error fetching requests");
      showToast("error", "Requests Error", "Failed to fetch requests");
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  }, [userData, page, showToast]);

  useEffect(() => {
    setupLocation();
    getUserData();
  }, [setupLocation, getUserData]);

  useEffect(() => {
    if (userData?._id) {
      getAllRequests();
    }
  }, [userData, getAllRequests]);

  useEffect(() => {
    updateLocation();
  }, [updateLocation]);

  const handleLoadMore = useCallback(() => {
    if (!loading) {
      getAllRequests();
    }
  }, [loading, getAllRequests]);

  const renderEmptyList = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No Requests</Text>
    </View>
  ), []);

  const renderRequestItem = useCallback(
    ({ item }: { item: Request }) => {
      const formattedDate = item.createAt
        ? new Date(item.createAt).toLocaleString("pt-BR", {
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
              <Text style={styles.status}>{item.status}</Text>
              <Text style={styles.date}>{formattedDate}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Request", { id: item._id, info: item.info, latitude: 0, longitude: 0, dlatitude: 0, dlongitude: 0, destination: item.d_info, valor_total: parseFloat(Number(item.valor.$numberDecimal)).toFixed(2), km: item.distance, time: item.time, polylineCoords: [], tax_km: '', tax_app: '', moeda: item.moeda, date: formattedDate, status: item.status, payment: item.pagamento })}
              >
                <Text style={styles.currency}>{item.moeda}</Text>
                <Text style={styles.valor}>
                  {item?.valor?.$numberDecimal
                    ? parseFloat(Number(item.valor.$numberDecimal)).toFixed(2)
                    : "0.00"}
                  <AntDesign name="right" size={18} color="black" style={styles.arrowIcon} />
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.content}>
            <Image
              style={styles.transitIcon}
              source={require("@/assets/transit.png")}
            />
            <Text style={styles.title}>{item.info}</Text>
            <Text style={styles.subtitle}>{item.d_info}</Text>
          </View>
          <Image
            style={styles.image}
            source={require("@/assets/icon.png")} // Replace with dynamic image if available
          />
        </View>
      );
    },
    [navigation]
  );

  return (
    <View style={styles.container}>
      {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
      <FlatList
        data={requests}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyList}
        keyExtractor={(item) => item._id}
        renderItem={renderRequestItem}
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
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 10,
  },
  requestItem: {
    margin: 10,
    width: SCREEN_WIDTH * 0.9,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  status: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  date: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  content: {
    marginBottom: 12,
  },
  transitIcon: {
    marginLeft: 3,
    marginTop: 18,
    height: 95,
    width: 25,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 35,
    marginTop: -100,
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    fontWeight: "500",
    marginLeft: 35,
    marginTop: 10,
  },
  valor: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2e7d32",
    marginTop: -35,
    marginLeft: 190,
    alignSelf: "flex-end",
  },
  currency: {
    fontSize: 16,
    marginLeft: 155,
    marginTop: -30,
    color: "#333",
  },
  arrowIcon: {
    margin: 3,
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
    fontSize: 24,
    fontWeight: "600",
  },
  errorText: {
    color: "#ff3333",
    fontSize: 18,
    textAlign: "center",
    margin: 20,
  },
  loadMoreButton: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    margin: 10,
  },
  loadMoreText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  loader: {
    marginVertical: 20,
  },
});

export default Arrows;

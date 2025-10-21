import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError } from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Avatar, Button, Card, Portal, RadioButton } from "react-native-paper";
import Toast from "react-native-toast-message";
import type { NavigationProp, RouteProp } from "@react-navigation/native";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface Vehicle {
  _id: string;
  modelo: string;
  cor: string;
  placa: string;
}

interface UserData {
  email: string;
}

interface Props {
  route: RouteProp<any, any>;
  navigation: NavigationProp<any>;
}

const LeftContent = (props: any) => <Avatar.Icon {...props} icon="car" />;

const Vehicles: React.FC<Props> = ({ route, navigation }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [dns, setIpAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  // Show toast notification
  const showToast = useCallback((type: "success" | "error", text1: string, text2?: string) => {
    Toast.show({
      type,
      text1,
      text2,
      position: "top",
      visibilityTime: 3000,
    });
  }, []);

  // Fetch IP address
  const fetchIp = useCallback(async () => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      setIpAddress(data.ip);
    } catch (error) {
      console.error("Failed to fetch IP:", error);
      setError("Failed to fetch IP address");
      showToast("error", "IP Fetch Failed", "Unable to retrieve IP address");
    }
  }, [showToast]);

  // Fetch user data
  const getUserData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        showToast("error", "Authentication Error", "No token found");
        return;
      }

      const response = await axios.post<{ data: UserData }>(
        "https://on-host-api.vercel.app/userdata",
        { token }
      );
      setUserData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setError("Failed to fetch user data");
      showToast("error", "User Data Error", "Failed to fetch user data");
    }
  }, [showToast]);

  // Fetch vehicles
  const getAllVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const { Vehicles } = route.params;
      const response = await axios.get<{ data: Vehicle[] }>(
        `https://on-host-api.vercel.app/vehiclesdata/${Vehicles}`
      );
      setVehicles(response.data.data);
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      setError("Failed to fetch vehicles");
      showToast("error", "Vehicles Error", "Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  }, [route.params, showToast]);

  // Update vehicle
  const updateVehicle = useCallback(
    async (vehicleId: string) => {
      if (!userData) {
        setError("User data not available");
        showToast("error", "Update Error", "User data not available");
        return;
      }

      try {
        const formData = {
          email: userData.email,
          dns,
          vehicleid: vehicleId,
        };

        const response = await axios.post<{ status: string }>(
          "https://on-host-api.vercel.app/update-vehicle",
          formData
        );

        if (response.data.status === "Ok") {
          setSelectedId(vehicleId);
          showToast("success", "Vehicle Updated", "Vehicle updated successfully!");
        }
      } catch (error) {
        console.error("Failed to update vehicle:", error);
        setError("Failed to update vehicle");
        showToast("error", "Update Error", "Failed to update vehicle");
      }
    },
    [userData, dns, showToast]
  );

  useEffect(() => {
    fetchIp();
    getUserData();
    getAllVehicles();
  }, [fetchIp, getUserData, getAllVehicles]);

  const renderVehicleCard = useCallback(
    ({ item }: { item: Vehicle }) => (
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <RadioButton
            value={item._id}
            status={selectedId === item._id ? "checked" : "unchecked"}
            onPress={() => updateVehicle(item._id)}
          />
          <Card.Content>
            <Text style={styles.cardText}>{item.modelo}</Text>
            <Text style={styles.cardText}>{item.cor}</Text>
            <Text style={styles.cardText}>{item.placa}</Text>
          </Card.Content>
        </View>
      </Card>
    ),
    [selectedId, updateVehicle]
  );

  const renderEmptyList = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No Vehicles</Text>
    </View>
  ), []);

  const handleLoadMore = useCallback(() => {
    if (!loading) {
      getAllVehicles();
    }
  }, [loading, getAllVehicles]);

  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Button
        mode="contained"
        onPress={() => navigation.navigate("AddVehicles")}
        style={styles.addButton}
        labelStyle={styles.buttonText}
      >
        Add Vehicles
      </Button>
      <FlatList
        data={vehicles}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyList}
        keyExtractor={(item) => item._id}
        renderItem={renderVehicleCard}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => (
          <TouchableOpacity style={styles.loadMore} onPress={handleLoadMore}>
            {loading ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <Text style={styles.loadMoreText}>Load More</Text>
            )}
          </TouchableOpacity>
        )}
      />
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#000",
    padding: 10,
  },
  card: {
    margin: 10,
    width: SCREEN_WIDTH - 20,
    backgroundColor: "#fff",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  cardText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    padding: 5,
  },
  addButton: {
    width: 350,
    marginTop: 20,
    backgroundColor: "#007AFF",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "bold",
  },
  loadMore: {
    alignItems: "center",
    padding: 16,
  },
  loadMoreText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
});

export default Vehicles;

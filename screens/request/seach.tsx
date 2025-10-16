import {
  StyleSheet,
  Text,
  Dimensions,
  View,
  ActivityIndicator,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  watchPositionAsync,
  LocationObject,
  LocationAccuracy,
} from "expo-location";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import BottomSheet from "react-native-simple-bottom-sheet";
import MapView, { Circle, PROVIDER_GOOGLE, Marker } from "react-native-maps";
import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomPicker from "@/components/SeachPicker";

// Constants
const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;
const API_BASE_URL = "https://on-host-api.vercel.app";

// Interfaces
interface Location {
  coords: {
    latitude: number;
    longitude: number;
  };
}

interface RequestData {
  info?: string;
  status?: string;
  categoryId?: string;
  moeda?: string;
  valor?: { $numberDecimal: string };
}

interface CategoryData {
  name?: string;
  icon?: string;
}

interface DriverData {
  avatar?: string;
}

// Theme
const theme = {
  colors: {
    primary: "#007AFF",
    background: "#000",
    card: "#FFF",
    text: "#000",
    secondaryText: "#666",
    error: "#FF0000",
  },
  spacing: {
    small: 10,
    medium: 20,
    large: 30,
  },
};

// Components
const DriverInfo = ({ driverInfo, drivedata }: { driverInfo: any; drivedata: DriverData }) => (
  <View style={styles.driverInfo}>
    <View style={styles.ratingContainer}>
      <Image
        style={styles.driverImage}
        source={{ uri: drivedata?.avatar || `${API_BASE_URL}/static/default-blue.png` }}
      />
      <Text style={styles.driverName}>{driverInfo.name}</Text>
      <Text style={styles.rating}>{driverInfo.rating} ★</Text>
    </View>
    <Image
      style={styles.categoryImage}
      source={{ uri: drivedata?.avatar || `${API_BASE_URL}/static/car.png` }}
    />
    <View style={styles.driverDetails}>
      <Text style={styles.eta}>{driverInfo.eta}</Text>
      <Text style={styles.licensePlate}>{driverInfo.licensePlate}</Text>
      <Text style={styles.carModel}>{driverInfo.car}</Text>
    </View>
  </View>
);

const RequestCard = ({ categoryData, requestdata, selectMoeda, setSelectMoeda }: any) => (
  <View style={styles.requestCard}>
    <View style={{ flexDirection: "column" }}>
      <Image
        style={styles.requestImage}
        source={{ uri: categoryData?.icon || `${API_BASE_URL}/static/car.png` }}
      />
      <Text style={styles.requestText}>{categoryData?.name}</Text>
    </View>
    <CustomPicker
      selectedValue={selectMoeda}
      onValueChange={setSelectMoeda}
      items={[
        { label: "Money", value: "cash", icon: "money" },
        { label: "Other", value: "other", icon: "question" },
      ]}
    />
    <Text style={styles.moedaText}>{requestdata?.moeda}</Text>
    <Text style={styles.valorText}>
      {requestdata?.valor?.$numberDecimal
        ? parseFloat(Number(requestdata.valor.$numberDecimal)).toFixed(2)
        : "0.00"}
    </Text>
  </View>
);

export default function SearchScreen({ route, navigation }: any) {
  const { requestId, dlatitude, dlongitude } = route.params;
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [requestdata, setRequestData] = useState<RequestData | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
  const [drivedata, setDriveData] = useState<DriverData | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [categoryid, setCategoryId] = useState<string>("");
  const [selectMoeda, setSelectMoeda] = useState<string>("other");
  const [countdown, setCountdown] = useState<number>(300);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const driverInfo = useMemo(
    () => ({
      name: "John Doe",
      rating: 3.97,
      licensePlate: "KW690YF",
      car: "Fuchsia Toyota Camry",
      eta: "2 min",
    }),
    []
  );

  // Countdown timer
  useEffect(() => {
    const timer = countdown > 0 && setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1 && requestdata?.status === "process") {
          handleCancel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, requestdata]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const res = await axios.post(`${API_BASE_URL}/userdata`, { token });
      setUserData(res.data.data);
    } catch (err) {
      setError("Failed to fetch user data");
      Alert.alert("Error", "Unable to fetch user data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRequest = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/GetRequest/${requestId}`);
      setRequestData(res.data.data);
      setCategoryId(res.data.data.categoryId);
      if (res.data.data.status === "PICK-UP") {
        navigation.navigate("drive", { requestId, dlatitude, dlongitude });
      } else if (res.data.data.status === "canceled") {
        await AsyncStorage.removeItem("requestId");
        navigation.navigate("cancel", { requestId, dlatitude, dlongitude });
      }
    } catch (err) {
      setError("Failed to fetch request data");
      Alert.alert("Error", "Unable to fetch request data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [requestId, dlatitude, dlongitude, navigation]);

  const fetchCategory = useCallback(async () => {
    if (!categoryid) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/categorydata/${categoryid}`);
      setCategoryData(res.data.data);
    } catch (err) {
      setError("Failed to fetch category data");
      Alert.alert("Error", "Unable to fetch category data.");
    }
  }, [categoryid]);

  const requestLocationPermissions = useCallback(async () => {
    try {
      const { granted } = await requestForegroundPermissionsAsync();
      if (!granted) {
        setError("Location permission denied");
        Alert.alert("Permission Denied", "Please enable location services to use this feature.");
        return;
      }
      const currentPosition = await getCurrentPositionAsync();
      setLocation(currentPosition);
    } catch (err) {
      setError("Failed to get location");
      Alert.alert("Error", "Unable to access location. Please try again.");
    }
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchRequest();
  }, [fetchUserData, fetchRequest]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory, categoryid]);

  useEffect(() => {
    requestLocationPermissions();
    const subscription = watchPositionAsync(
      {
        accuracy: LocationAccuracy.Highest,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (response) => {
        setLocation(response);
        mapRef.current?.animateCamera({
          center: response.coords,
          pitch: 30,
          zoom: 13,
        });
      }
    );
    return () => subscription.then((sub) => sub.remove());
  }, [requestLocationPermissions]);

  useEffect(() => {
    if (dlatitude && dlongitude) {
      mapRef.current?.animateCamera(
        {
          center: { latitude: dlatitude, longitude: dlongitude },
          zoom: 13,
        },
        { duration: 1000 }
      );
    }
  }, [dlatitude, dlongitude]);

  const handleCancel = useCallback(async () => {
    try {
      const formdata = { requestId, status: "canceled" };
      const res = await axios.post(`${API_BASE_URL}/update-request`, formdata);
      if (res.data.status === "Ok") {
        await AsyncStorage.removeItem("requestId");
        navigation.push("Cancel", { requestId, dlatitude, dlongitude });
      }
    } catch (err) {
      setError("Failed to cancel request");
      Alert.alert("Error", "Unable to cancel request. Please try again.");
    }
  }, [requestId, dlatitude, dlongitude, navigation]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchRequest} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          style={styles.headerImage}
          source={{ uri: `${API_BASE_URL}/static/origin-online.gif` }}
        />
        <Text style={styles.headerText}>{requestdata?.info || "Loading..."}</Text>
      </View>
      {location && (
        <MapView
          ref={mapRef}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          showsMyLocationButton={true}
          followsUserLocation={true}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
        >
          <Marker coordinate={location.coords}>
            <Image
              source={require("@/assets/location.png")}
              style={styles.markerImage}
            />
          </Marker>
          <Marker coordinate={{ latitude: dlatitude, longitude: dlongitude }} pinColor="blue" />
          {requestdata?.status === "process" && (
            <Circle
              center={location.coords}
              strokeColor="blue"
              strokeWidth={1}
              radius={2000}
            />
          )}
        </MapView>
      )}
      <BottomSheet isOpen sliderMinHeight={155}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : (
          <>
            {requestdata?.delivery ? <View style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', margin: 20}}><Text style={{fontSize: 18, fontWeight: 'bold' }}>Your Code Security</Text><Text style={{fontSize: 24, fontWeight: 'bold' }}>{requestdata?.token}</Text></View> : ''}
            {requestdata?.status === "process" && (
              <>
                <RequestCard
                  categoryData={categoryData}
                  requestdata={requestdata}
                  selectMoeda={selectMoeda}
                  setSelectMoeda={setSelectMoeda}
                />
                <Text style={styles.countdownText}>{formatTime(countdown)}</Text>
                <Text onPress={handleCancel} style={styles.cancelText}>
                  CANCEL
                </Text>
              </>
            )}
            {requestdata?.status === "accepted" && (
              <>
                <ScrollView style={styles.bottomSheetContent}>
                  <Text style={styles.sectionTitle}>Meet By Pickup</Text>
                  <DriverInfo driverInfo={driverInfo} drivedata={drivedata} />
                  <Text style={styles.safetyNote}>
                    Driver may record trip for added safety
                  </Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Any pickup notes?"
                      placeholderTextColor={theme.colors.secondaryText}
                    />
                    <TouchableOpacity style={styles.iconButton}>
                      <MaterialIcons name="call" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                      <MaterialIcons name="chat-bubble" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.delayNote}>
                    Expect some pick up delays as we rev back up
                  </Text>
                </ScrollView>
                <Text onPress={handleCancel} style={styles.cancelText}>
                  CANCEL
                </Text>
              </>
            )}
          </>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
  },
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  header: {
    position: "absolute",
    zIndex: 10,
    width: SCREEN_WIDTH * 0.9,
    height: 70,
    marginTop: theme.spacing.large,
    borderRadius: 10,
    backgroundColor: theme.colors.card,
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.small,
  },
  headerImage: {
    width: 50,
    height: 50,
    marginLeft: theme.spacing.small,
  },
  headerText: {
    flex: 1,
    fontWeight: "bold",
    marginLeft: theme.spacing.small,
  },
  bottomSheetContent: {
    padding: theme.spacing.small,
    height: 400,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.secondaryText,
    marginBottom: theme.spacing.small,
    textAlign: "center",
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.small,
  },
  categoryImage: {
    width: 100,
    height: 100,
    borderRadius: 25,
    marginLeft: -30,
  },
  driverImage: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 25,
    marginTop: theme.spacing.medium,
    marginRight: -50,
  },
  driverDetails: {
    flex: 1,
  },
  eta: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  licensePlate: {
    fontSize: 14,
    fontWeight: "bold",
  },
  carModel: {
    fontSize: 14,
    color: theme.colors.secondaryText,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: -60,
    marginBottom: theme.spacing.small,
  },
  rating: {
    fontSize: 12,
    color: theme.colors.text,
    marginRight: 25,
    marginTop: 120,
  },
  driverName: {
    marginTop: 80,
    marginRight: -40,
    fontWeight: "bold",
    fontSize: 20,
    color: theme.colors.text,
  },
  safetyNote: {
    fontSize: 12,
    color: theme.colors.secondaryText,
    textAlign: "center",
    marginBottom: theme.spacing.small,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.small,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 5,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: theme.colors.text,
  },
  iconButton: {
    padding: 5,
  },
  delayNote: {
    fontSize: 12,
    color: theme.colors.secondaryText,
    textAlign: "center",
    marginBottom: theme.spacing.small,
  },
  requestCard: {
    padding: theme.spacing.small,
    marginBottom: theme.spacing.medium,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    shadowColor: '#2600ffff',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    width: SCREEN_WIDTH * 0.9,
    height: 80,
  },
  requestImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginStart: theme.spacing.medium,
  },
  requestText: {
    marginStart: theme.spacing.medium,
    fontSize: 12,
    fontWeight: "bold",
  },
  moedaText: {
    textAlign: "center",
    padding: 1,
    fontSize: 18,
    fontWeight: "bold",
  },
  valorText: {
    textAlign: "center",
    marginEnd: theme.spacing.medium,
    padding: 1,
    fontSize: 28,
    fontWeight: "bold",
  },
  countdownText: {
    fontSize: 28,
    padding: theme.spacing.medium,
    fontWeight: "bold",
    textAlign: "center",
  },
  cancelText: {
    fontSize: 10,
    color: theme.colors.error,
    padding: theme.spacing.medium,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    marginBottom: theme.spacing.medium,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.small,
    borderRadius: 5,
  },
  retryButtonText: {
    color: theme.colors.card,
    fontWeight: "bold",
  },
  markerImage: {
    width: 20,
    height: 20,
    borderRadius: 9,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});

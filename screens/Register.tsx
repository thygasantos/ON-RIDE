import {
  Alert,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  Image,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import React, { useState, useContext, useEffect, useCallback, useRef } from "react";
import { FloatingLabelInput } from "react-native-floating-label-input";
import axios from "axios";
import Spinner from "react-native-loading-spinner-overlay";
import { AuthContext } from "@/context/AuthContext";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentPositionAsync, requestForegroundPermissionsAsync } from "expo-location";
import Toast from "react-native-toast-message";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AntDesign, Entypo } from "@expo/vector-icons";
import debounce from "lodash.debounce";

// Replace with your Mapbox access token
const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoidGh5YWdvIiwiYSI6IlgyYnFZa3cifQ.sm008NJiQD9tNZHfXpu3EA";

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dns, setIpAddress] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [region, setRegion_code] = useState("");
  const [country, setCountry] = useState("");
  const [moeda, setCurrency] = useState("");
  const [city, setCity] = useState("");
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const abortControllerRef = useRef(null);

  // Request location permissions
  async function requestLocationPermissions() {
    const { granted } = await requestForegroundPermissionsAsync();
    if (granted) {
      const currentPosition = await getCurrentPositionAsync();
      setLatitude(currentPosition.coords.latitude);
      setLongitude(currentPosition.coords.longitude);
    } else {
      setErrorMsg("Permission to access location was denied");
      Toast.show({
        type: "error",
        text1: "Location Permission Denied",
        text2: "Please enable location services to proceed.",
      });
    }
  }

  // Initial location fetch
  useEffect(() => {
    requestLocationPermissions();
  }, []);

  // Debounced address fetching function using Mapbox
  const fetchAddress = useCallback(
    debounce(async (lat, lon) => {
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        Toast.show({
          type: "error",
          text1: "Invalid Coordinates",
          text2: "Unable to fetch address due to invalid coordinates.",
        });
        setIsAddressLoading(false);
        return;
      }

      setIsAddressLoading(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort(); // Cancel previous request
      }
      abortControllerRef.current = new AbortController();

      try {
        const res = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json` +
            `?access_token=${MAPBOX_ACCESS_TOKEN}&types=place,region,country`,
          { signal: abortControllerRef.current.signal }
        );

        const features = res.data.features || [];
        let city = "Unknown City";
        let region = "Unknown Region";
        let country = "Unknown Country";

        // Extract city, region, and country from Mapbox response
        for (const feature of features) {
          if (feature.place_type.includes("place")) {
            city = feature.text || city;
          } else if (feature.place_type.includes("region")) {
            region = feature.text || region;
          } else if (feature.place_type.includes("country")) {
            country = feature.text || country;
          }
        }

        setCity(city);
        setCountry(country);
        setRegion_code(region);

        // Batch AsyncStorage writes
        await AsyncStorage.multiSet([
          ["city", city],
          ["region", region],
          ["country", country],
        ]);

        Toast.show({
          type: "success",
          text1: `Region Successfully !`,
        });
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Address fetch cancelled");
          return;
        }
        console.error("Error fetching address:", error);
        Toast.show({
          type: "error",
          text1: "Region Fetch Failed",
          text2: "Unable to retrieve region. Please try again later.",
        });
      } finally {
        setIsAddressLoading(false);
      }
    }, 1000, { leading: false, trailing: true }), // Debounce for 1 second
    []
  );

  // Fetch address based on latitude and longitude
  useEffect(() => {
    fetchAddress(latitude, longitude);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort(); // Cleanup on unmount
      }
    };
  }, [latitude, longitude, fetchAddress]);

  // Fetch currency based on IP
  useEffect(() => {
    const getCurrencyCode = async () => {
      try {
        const res = await axios.get("https://ipapi.co/json/");
        setCurrency(res.data.currency);
        await AsyncStorage.setItem("moeda", res.data.currency);
      } catch (error) {
        console.error("Error fetching currency:", error);
      }
    };
    getCurrencyCode();
  }, []);

  // Fetch IP address
  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        setIpAddress(data.ip);
      } catch (error) {
        console.error("Error fetching IP:", error);
      }
    };
    fetchIp();
  }, []);

  // Handle registration
  const handleRegister = async () => {
    if (!name || !email || !password) {
      Toast.show({
        type: "info",
        text1: "All fields are required",
      });
      return;
    }

    const userData = {
      name,
      email,
      password,
      phone: "null",
      longitude,
      latitude,
      moeda,
      region,
      country,
      city,
      dns,
    };

    try {
      const res = await axios.post("https://on-host-api.vercel.app/register", userData);
      if (res.data.status === "OK") {
        Toast.show({
          type: "success",
          text1: "Registered Successfully!",
        });
        login(email, password);
      } else {
        Toast.show({
          type: "error",
          text1: res.data.message || "Registration failed",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      Toast.show({
        type: "error",
        text1: "An error occurred during registration",
      });
    }
  };

  // Navigate to login screen
  const handleNavigate = () => {
    navigation.navigate("auth");
  };

  return (
    <View style={styles.container}>
      <Image
        style={styles.logo}
        source={{ uri: "https://on-host-api.vercel.app/static/logotipo-black.png" }}
      />
      <KeyboardAvoidingView behavior="padding">
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Register to your Account</Text>
        </View>
        <View style={styles.formContainer}>
          {isAddressLoading ? (
            <ActivityIndicator size="large" color="blue" />
          ) : city && region && country ? (
            <View style={styles.locationContainer}>
              <MaterialCommunityIcons name="map-marker" size={40} color="black" />
              <Text style={styles.locationText}>
                {city} - {region} - {country}
              </Text>
            </View>
          ) : (
            <Text style={styles.locationText}>Unable to load location</Text>
          )}
          <View style={styles.inputContainer}>
            <FloatingLabelInput
              label="Name"
              labelStyles={styles.labelStyles}
              containerStyles={styles.inputWrapper}
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
            />
          </View>
          <View style={styles.inputContainer}>
            <FloatingLabelInput
              label="example@email.com"
              labelStyles={styles.labelStyles}
              containerStyles={styles.inputWrapper}
              style={styles.input}
              placeholder="example@email.com"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={styles.inputContainer}>
            <FloatingLabelInput
              label="Password"
              labelStyles={styles.labelStyles}
              containerStyles={styles.inputWrapper}
              style={styles.input}
              isPassword
              togglePassword={showPassword}
              customShowPasswordComponent={<Entypo name="eye" size={24} color="black" />}
              customHidePasswordComponent={<Entypo name="eye-with-line" size={24} color="black" />}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              onTogglePassword={setShowPassword}
            />
          </View>
        </View>
        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNavigate}>
          <Text style={styles.loginText}>Already have an Account? Login</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  logo: {
    marginTop: -20,
    width: 150,
    height: 100,
    resizeMode: "contain",
  },
  headerContainer: {
    alignItems: "center",
  },
  headerText: {
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 10,
    color: "#041E42",
  },
  formContainer: {
    marginTop: 10,
    width: 300,
    padding: 10,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    justifyContent: "center",
  },
  locationText: {
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 10,
    color: "#041E42",
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E0E0E0",
    paddingVertical: 5,
    borderRadius: 50,
    marginTop: 30,
  },
  inputWrapper: {
    paddingHorizontal: 10,
    borderRadius: 50,
    width: 300,
  },
  input: {
    borderRadius: 50,
    fontWeight: "bold",
    textAlign: "center",
    color: "gray",
    width: 300,
    fontSize: 16,
  },
  labelStyles: {
    paddingBottom: 20,
  },
  registerButton: {
    marginTop: 80,
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: "center",
  },
  registerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginText: {
    marginTop: 40,
    fontSize: 18,
    textAlign: "center",
    color: "#041E42",
    textDecorationLine: "none",
  },
});

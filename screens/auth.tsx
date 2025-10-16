import {
  StyleSheet,
  Text,
  View,
  Image,
  KeyboardAvoidingView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import React, { useState, useEffect, useCallback, useContext } from "react";
import { FloatingLabelInput } from "react-native-floating-label-input";
import axios from "axios";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { AuthContext } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { AntDesign, Entypo } from "@expo/vector-icons";
import * as Network from "expo-network";
import debounce from "lodash.debounce";


const { width } = Dimensions.get("window");

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isNetworkAvailable, setIsNetworkAvailable] = useState(true);
  const { login } = useContext(AuthContext) || { login: () => {} };
  const navigation = useNavigation();



  // Check network status
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        setIsNetworkAvailable(networkState.isConnected);
        if (!networkState.isConnected) {
          setError("No internet connection");
          Toast.show({
            type: "error",
            text1: "No Internet",
            text2: "Please check your network connection.",
          });
        }
      } catch (err) {
        console.error("Network check error:", err);
      }
    };
    checkNetwork();
  }, []);

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  

  // Check if user is already logged in
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
        if (isLoggedIn === "true") {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "home" }],
            })
          );
        }
      } catch (err) {
        console.error("AsyncStorage error:", err);
      }
    };
    checkLoginStatus();
  }, [navigation]);

  // Debounced login handler
  const handleSubmit = useCallback(
    debounce(async () => {
      if (!isNetworkAvailable) {
        setError("No internet connection");
        Toast.show({
          type: "error",
          text1: "No Internet",
          text2: "Please check your network connection.",
        });
        return;
      }

      if (!email || !password) {
        setError("All fields are required");
        Toast.show({
          type: "info",
          text1: "All fields are required",
        });
        return;
      }

      if (!validateEmail(email)) {
        setError("Invalid email format");
        Toast.show({
          type: "error",
          text1: "Invalid Email",
          text2: "Please enter a valid email address.",
        });
        return;
      }

      setIsLoading(true);
      try {
        const userData = { email, password };
        const res = await axios.post("https://on-host-api.vercel.app/login-user", userData);
        if (res.data.status === "ok") {
          AsyncStorage.setItem('token', res.data.data);
          AsyncStorage.setItem('isLoggedIn', JSON.stringify(true));
          Toast.show({
            type: "success",
            text1: "Login Successful",
          });
          login(email, password);
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "home" }],
            })
          );
        } else {
          setError(res.data.data || "Login failed");
          Toast.show({
            type: "error",
            text1: res.data.data || "Login failed",
          });
        }
      } catch (error) {
        setError("An error occurred during login");
        Toast.show({
          type: "error",
          text1: "Login Error",
          text2: "Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    }, 500, { leading: false, trailing: true }),
    [email, password, login, navigation, isNetworkAvailable]
  );

  // Navigate to Register screen
  const handleNavigate = () => {
    navigation.navigate("Register");
  };

  return (
    <View style={styles.container}>
      <Image
        style={styles.logo}
        source={{ uri: "https://on-host-api.vercel.app/static/logotipo-black.png" }}
      />
      <KeyboardAvoidingView behavior="padding" style={styles.keyboardAvoidingContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Log in to your Account</Text>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <FloatingLabelInput
              label="example@email.com"
              labelStyles={styles.labelStyles}
              containerStyles={styles.inputWrapper}
              style={styles.input}
              placeholder="example@email.com"
              value={email}
              onChangeText={setEmail}
              accessibilityLabel="Email input"
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
              accessibilityLabel="Password input"
            />
          </View>
        </View>
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isLoading || !isNetworkAvailable}
          accessibilityLabel="Login button"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNavigate}
          accessibilityLabel="Navigate to Register screen"
        >
          <Text style={styles.registerText}>First time using? Register</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  logo: {
    width: 150,
    height: 100,
    resizeMode: "contain",
    marginBottom: 20,
  },
  keyboardAvoidingContainer: {
    width: width * 0.9,
    alignItems: "center",
  },
  headerContainer: {
    alignItems: "center",
  },
  headerText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#041E42",
    marginBottom: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    width: 300,
  },
  formContainer: {
    width: 300,
    padding: 10,
    marginTop: 40,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E0E0E0",
    paddingVertical: 5,
    borderRadius: 50,
    marginBottom: 20,
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
  loginButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: "center",
    width: 300,
  },
  googleButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: "center",
    marginTop: 15,
    width: 300,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  googleButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
  },
  registerText: {
    marginTop: 50,
    fontSize: 18,
    textAlign: "center",
    color: "#041E42",
    textDecorationLine: "none",
  },
});

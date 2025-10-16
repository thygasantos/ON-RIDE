import { View, Button, TextInput, Text, Image, StyleSheet, Platform } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export default function editaccount() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [userData, setUserData] = useState(null);
  const [dns, setDns] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [city, setCity] = useState('');
  const [moeda, setMoeda] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const backendUrl = 'https://on-host-api.vercel.app';

  // Fetch IP, city, and currency from ipapi.co
  useEffect(() => {
    const fetchIpData = async () => {
      try {
        const [ipResponse, geoResponse] = await Promise.all([
          fetch('https://api.ipify.org?format=json'),
          fetch('https://ipapi.co/json/'),
        ]);
        const ipData = await ipResponse.json();
        const geoData = await geoResponse.json();
        setDns(ipData.ip);
        setCity(geoData.city);
        setMoeda(geoData.currency);
      } catch (error) {
        console.error('Failed to fetch IP data:', error);
        Toast.show({ type: 'error', text1: 'Failed to fetch IP or location data' });
      }
    };
    fetchIpData();
  }, []);

  // Fetch user data
  useEffect(() => {
    const getData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Toast.show({ type: 'error', text1: 'No token found' });
          return;
        }
        const res = await axios.post(`${backendUrl}/userdata`, { token });
        const user = res.data.data;
        setUserData(user);
        setName(user.name || '');
        setPhone(user.phone || '');
        setUploadedImageUrl(user.image || null);
      } catch (error) {
        console.error('Failed to fetch user data:', error.response?.data || error.message);
        Toast.show({ type: 'error', text1: 'Failed to fetch user data' });
      }
    };
    getData();
  }, []);

  // Request location permissions and get current position
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Toast.show({ type: 'error', text1: 'Permission to access location was denied' });
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setLatitude(location.coords.latitude);
        setLongitude(location.coords.longitude);
      } catch (error) {
        console.error('Failed to fetch location:', error);
        Toast.show({ type: 'error', text1: 'Failed to fetch location' });
      }
    })();
  }, []);

  // Update location when dependencies change
  useEffect(() => {
    if (!userData?.email || !dns || !latitude || !longitude) return;

    const updateLocation = async () => {
      try {
        const formdata = {
          email: userData.email,
          dns,
          latitude,
          longitude,
        };
        const res = await axios.post(`${backendUrl}/update-location`, formdata);
        if (res.data.status === 'ok') {
          console.log('Location updated successfully');
        }
      } catch (error) {
        console.error('Failed to update location:', error.response?.data || error.message);
        Toast.show({ type: 'error', text1: 'Failed to update location' });
      }
    };
    updateLocation();
  }, [userData, dns, latitude, longitude]);

  // Pick image - FIXED FOR ANDROID
  const pickImage = async () => {
    console.log('🚀 Starting image picker... Platform:', Platform.OS);

    // Request permissions FIRST
    const permissions = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('📱 Permissions status:', permissions.status);

    if (permissions.status !== 'granted') {
      console.log('❌ Permission denied');
      Toast.show({
        type: 'error',
        text1: 'Permission denied',
        text2: 'Enable photos access in Settings > Apps > Your App > Permissions'
      });
      return;
    }

    console.log('✅ Permissions granted');

    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
      return;
    }

    console.log('📸 Launching image library...');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // FALSE = direct file URI (better for Android)
      quality: 0.7, // 70% quality
      allowsMultipleSelection: false,
    });

    console.log('📥 Result:', result);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      console.log('✅ Selected image:', {
        uri: asset.uri,
        type: asset.type,
        fileName: asset.fileName,
        width: asset.width,
        height: asset.height,
      });

      setSelectedImage(asset);
      setUploadStatus('✅ Image ready to upload');
    } else {
      console.log('❌ Selection canceled or no assets');
      setUploadStatus('❌ Selection canceled');
    }
  };

  // Handle web file input
  const handleWebFileChange = (event) => {
    const file = event.target.files[0];
    console.log('Web file selected:', file);
    if (file) {
      if (file.size > 500 * 1024) {
        Toast.show({ type: 'error', text1: 'Image too large; please select a file under 500KB' });
        return;
      }
      setSelectedImage({
        uri: URL.createObjectURL(file),
        type: file.type || 'image/jpeg',
        name: file.name || 'image.jpg',
        file,
      });
      setUploadStatus('Image selected. Press "Upload Image" to upload.');
    }
    event.target.value = '';
  };

  // Helper: Fetch policy with retry (up to 2 times)
  const fetchPolicy = async (email, retryCount = 0) => {
    try {
      const sigResponse = await axios.post(`${backendUrl}/generate-upload-policy`, { email });
      const { apiKey, policy, signature, path } = sigResponse.data.data;

      // Validate response
      if (!apiKey || !policy || !signature || !path) {
        throw new Error('Invalid policy response from backend');
      }

      console.log('Policy received:', {
        apiKey: apiKey.substring(0, 10) + '...',
        policy: policy.substring(0, 20) + '...',
        path
      });
      return { apiKey, policy, signature, path };
    } catch (error) {
      console.error('Policy fetch error:', error.response?.data || error.message, 'Status:', error.response?.status);
      if (retryCount < 2 && error.response?.status === 400) {
        console.log(`Retrying policy fetch (attempt ${retryCount + 1})...`);
        return fetchPolicy(email, retryCount + 1);
      }
      throw error;
    }
  };

  // Helper: Create Blob from base64 for binary FormData
  const createBlobFromBase64 = (base64Data, type) => {
    const byteCharacters = atob(base64Data.split(',')[1]); // Strip 'data:...;base64,'
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  };

  // Upload image to Filestack - FIXED FOR ANDROID
  const uploadImage = async () => {
    if (!selectedImage) {
      Toast.show({ type: 'error', text1: 'No image selected!' });
      return;
    }
    if (!userData?.email) {
      Toast.show({ type: 'error', text1: 'Email required!' });
      return;
    }

    let tempFileUri = null;

    try {
      setUploadStatus('🔄 Requesting upload policy...');
      console.log('📤 Uploading for email:', userData.email);

      // Step 1: Get policy
      const sigResponse = await axios.post(`${backendUrl}/generate-upload-policy`, {
        email: userData.email,
      });
      const { apiKey, policy, signature, path } = sigResponse.data.data;
      console.log('✅ Policy received:', { apiKey: apiKey.substring(0, 10) + '...', path });

      // Step 2: Prepare file URI
      let uploadUri = selectedImage.uri;
      let fileType = selectedImage.type || 'image/jpeg';
      let fileName = path.split('/').pop() || `image-${Date.now()}.jpg`;

      console.log('📁 Original URI:', uploadUri);

      // ANDROID FIX: Convert content:// to file://
      if (Platform.OS === 'android' && uploadUri.startsWith('content://')) {
        try {
          console.log('🔄 Converting content:// to file://...');
          const tempPath = `${FileSystem.cacheDirectory}${fileName}`;
          await FileSystem.copyAsync({
            from: uploadUri,
            to: tempPath
          });
          uploadUri = `file://${tempPath}`;
          tempFileUri = tempPath;
          console.log('✅ Converted to:', uploadUri);
        } catch (copyError) {
          console.error('❌ Copy failed:', copyError);
          // Fallback: Use original URI with direct upload
          console.log('🔄 Using original content:// URI (fallback)');
        }
      }

      // Step 3: Validate file
      console.log('🔍 Validating file...');
      const fileInfo = await FileSystem.getInfoAsync(
        uploadUri.startsWith('file://') ? uploadUri.replace('file://', '') : uploadUri
      );
      console.log('📊 File info:', {
        exists: fileInfo.exists,
        size: fileInfo.size,
        uri: uploadUri,
      });

      if (!fileInfo.exists) {
        throw new Error(`❌ File not found at ${uploadUri}`);
      }
      if (fileInfo.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('❌ Image too large (max 5MB)');
      }

      // Step 4: Build endpoint
      const endpoint = `https://www.filestackapi.com/api/store/S3?key=${apiKey}&policy=${policy}&signature=${signature}&path=${encodeURIComponent(path)}`;
      console.log('📤 Endpoint:', endpoint);

      // Step 5: FormData
      const formData = new FormData();
      formData.append('file', {
        uri: uploadUri,
        type: fileType,
        name: fileName,
      });
      console.log('📦 FormData created:', { uri: uploadUri, type: fileType, name: fileName });

      setUploadStatus('📤 Uploading...');

      // Step 6: Upload with fetch (simpler for debugging)
      const uploadResponse = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const responseText = await uploadResponse.text();
      console.log('📥 Response:', {
        status: uploadResponse.status,
        text: responseText.substring(0, 200),
      });

      if (!uploadResponse.ok) {
        if (responseText.includes('Nothing found to store')) {
          throw new Error('❌ No file detected - check permissions and try different image');
        }
        throw new Error(`❌ Upload failed: ${uploadResponse.status} - ${responseText}`);
      }

      const uploadResult = JSON.parse(responseText);
      const imageUrl = uploadResult.url;
      console.log('✅ Uploaded:', imageUrl);

      setUploadedImageUrl(imageUrl);
      setUploadStatus('✅ Upload complete!');

      // Step 7: Update backend
      const updateResponse = await axios.post(`${backendUrl}/update-user-image`, {
        email: userData.email,
        imageUrl,
      });
      console.log('🔄 Backend update:', updateResponse.data);
      setUploadStatus(updateResponse.data.data?.message || '✅ Image uploaded!');

      Toast.show({ type: 'success', text1: 'Image uploaded!' });

    } catch (error) {
      console.error('❌ Upload error:', error);
      const errorMessage = error.message || 'Upload failed';
      setUploadStatus(`❌ ${errorMessage}`);
      Toast.show({ type: 'error', text1: errorMessage });
    } finally {
      if (tempFileUri) {
        try {
          await FileSystem.deleteAsync(tempFileUri);
          console.log('🗑️ Temp file deleted');
        } catch (e) {
          console.log('⚠️ Temp file cleanup failed:', e.message);
        }
      }
    }
  };

  // Add notification
  const addNotification = async () => {
    if (!userData?._id) return;
    try {
      const formdata = {
        userId: userData._id,
        message: 'Edited Your Account Successfully!',
        title: 'Alert',
        createdAt: new Date(),
      };
      const res = await axios.post(`${backendUrl}/notification`, formdata);
      if (res.data.status === 'ok') {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Account updated successfully!',
        });
      }
    } catch (error) {
      console.error('Notification error:', error);
    }
  };

  // Update profile
  const updateProfile = async () => {
    if (!name.trim() || !phone.trim()) {
      Toast.show({ type: 'error', text1: 'Name and phone are required' });
      return;
    }
    if (!userData?.email) {
      Toast.show({ type: 'error', text1: 'User data not loaded' });
      return;
    }

    try {
      const formdata = {
        name: name.trim(),
        email: userData.email,
        phone: phone.trim(),
        dns,
        latitude,
        longitude,
        moeda,
        city,
        image: uploadedImageUrl || userData.image || '',
      };
      const res = await axios.post(`${backendUrl}/update-user`, formdata);
      if (res.data.status === 'Ok') {
        await addNotification();
        Toast.show({ type: 'success', text1: 'Account updated successfully!' });
      } else {
        throw new Error(res.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Update error:', error);
      Toast.show({ type: 'error', text1: 'Failed to update profile' });
    }
  };

  const previewUri = selectedImage ? selectedImage.uri : (uploadedImageUrl || 'https://on-host-api.vercel.app/static/default-blue.png');

  return (
    <View style={styles.container}>
      {/* Image Preview */}
      <Image source={{ uri: previewUri }} style={styles.imagePreview} />

      {/* Image Controls */}
      <Button title="Pick an Image" onPress={pickImage} />

      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleWebFileChange}
          style={{ display: 'none' }}
        />
      )}
      
      {selectedImage && <Button title="Upload Image" onPress={uploadImage} />}

      {/* Progress and Status */}
      {uploadProgress > 0 && (
        <Text style={styles.statusText}>Uploading... {uploadProgress}%</Text>
      )}
      {uploadStatus ? <Text style={styles.statusText}>{uploadStatus}</Text> : null}

      {/* Inputs */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter name"
          value={name}
          onChangeText={setName}
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter phone"
          value={phone}
          keyboardType="numeric"
          onChangeText={setPhone}
        />
      </View>

      {/* Update Button */}
      <View style={styles.buttonContainer}>
        <Button title="Edit Account" onPress={updateProfile} />
      </View>

      <Toast />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 40,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E0E0E0',
    paddingVertical: 5,
    borderRadius: 50,
    marginTop: 30,
    width: 300,
  },
  input: {
    borderRadius: 50,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'gray',
    width: 300,
    fontSize: 30,
    paddingHorizontal: 10, // Added for better padding
  },
  buttonContainer: {
    marginTop: 60,
    borderRadius: 50,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
  },
  statusText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
  },
});

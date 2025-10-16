import React, { useEffect, useState, useCallback, useRef, useLayoutEffect } from "react";
import { View, ScrollView, Text, Button, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Image } from "react-native";
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome, Entypo, Feather } from "@expo/vector-icons";
import EmojiSelector from "react-native-emoji-selector";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const chatscreen = ({ route, navigation }) => {
    const [messages, setMessages] = useState([]);
    const [showEmojiSelector, setShowEmojiSelector] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState("");
    const [recepientData, setRecepientData] = useState('');
    const [userData, setUserData] = useState('');
    const [id, setId] = useState<Object>('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [receiverId, setReceiverId] = useState(route.params?.receiverId);
    const [userId, setUserId] = useState(route.params?.userId);
    const [conversationId, setConversationId] = useState(route.params?.conversationId);


    const scrollViewRef = useRef(null);


    async function getData() {
        const token = await AsyncStorage.getItem('token');
        console.log(token);
        axios
            .post('https://on-host-api.vercel.app/userdata', { token: token })
            .then(res => {
                console.log(res.data);
                setUserData(res.data.data);
            });
    }
    useEffect(() => {
        getData();
    }, []);


    useEffect(() => {
        const userData = { name: name, email: email, phone: phone, _id: id };
        setId(userData._id);
        setEmail(userData.email);
        setName(userData.name);
        setPhone(userData.phone);
    }, []);

    useEffect(() => {
        scrollToBottom()
    }, []);

    const scrollToBottom = () => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: false })
        }
    }

    const handleContentSizeChange = () => {
        scrollToBottom();
    }

    const handleEmojiPress = () => {
        setShowEmojiSelector(!showEmojiSelector);
    };


    useEffect(() => {
        (async () => {
            async function fetchMessages() {
                axios
                    .get('https://on-host-api.vercel.app/messages/' + userId + '/' + receiverId)
                    .then(res => {
                        setMessages(res.data.data);
                    });
            }
            fetchMessages();
        })();
    }, [messages]);


    async function fetchRecepientData() {
        axios
            .get('https://on-host-api.vercel.app/user/' + receiverId)
            .then(res => {
                setRecepientData(res.data.data);
            });
    }

    useEffect(() => {
        fetchRecepientData();
    }, []);

    async function handleSend(messageType: string, imageUri: undefined) {
        try {
            const formData = { senderId: userId, receiverId: receiverId, conversationId: conversationId, messageType: messageType, messageText: message }
            axios
                .post("https://on-host-api.vercel.app/messages", formData)
                .then(res => {
                    if (res.data.status == 'OK') {
                        setMessage('');
                        setSelectedImage("");
                    }
                    else {
                        console.log("send sucessfull !!");
                        setMessage('');
                    }
                })
        }
        catch (error) {
            console.log("Error in sending the message:", error);
        } finally {
            setMessage(''); // Clear input regardless of success or failure
        }
    };


    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: "",
            headerLeft: () => (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Ionicons
                        onPress={() => navigation.goBack()}
                        name="arrow-back"
                        size={24}
                        color="white"
                    />
                    {selectedMessages.length > 0 ? (
                        <View>
                            <Text style={{ fontSize: 16, fontWeight: "500" }}>
                                {selectedMessages.length}
                            </Text>
                        </View>
                    ) : (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Image
                                style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 15,
                                    resizeMode: "cover",
                                }}
                                source={{ uri: recepientData?.image || 'https://on-host-api.vercel.app/static/default-blue.png' }}
                            />
                            <Text style={{ color: 'white', marginLeft: 15, fontSize: 20, fontWeight: "bold" }}>
                                {recepientData?.name}
                            </Text>
                        </View>
                    )}
                </View>
            ),
            headerRight: () =>
                selectedMessages.length > 0 ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Ionicons name="md-arrow-redo-sharp" size={24} color="white" />
                        <Ionicons name="md-arrow-undo" size={24} color="white" />
                        <FontAwesome name="star" size={24} color="white" />
                        <MaterialIcons
                            name="delete"
                            size={24}
                            color="white"
                        />
                    </View>
                ) : null,
        });
    }, [recepientData, selectedMessages]);

    const formatTime = (time: string | number | Date) => {
        const options = { hour: "numeric", minute: "numeric" };
        return new Date(time).toLocaleString("en-US", options);
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F0F0F0" }}>
            <ScrollView ref={scrollViewRef} contentContainerStyle={{ flexGrow: 1 }} onContentSizeChange={handleContentSizeChange}>
                {messages?.map((item, index) => {
                    if (item?.messageType === "text") {
                        return (
                            <Pressable
                                key={item._id || index}
                                style={[
                                    item.senderId === userId
                                        ? {
                                            alignSelf: "flex-end",
                                            backgroundColor: "#DCF8C6",
                                            padding: 8,
                                            maxWidth: "60%",
                                            borderRadius: 7,
                                            margin: 10,
                                        }
                                        : {
                                            alignSelf: "flex-start",
                                            backgroundColor: "white",
                                            padding: 8,
                                            margin: 10,
                                            borderRadius: 7,
                                            maxWidth: "60%",
                                        },
                                ]}
                            >
                                <Text
                                    style={{
                                        fontSize: 18,
                                    }}
                                >
                                    {item?.message}
                                </Text>
                                <Text
                                    style={{
                                        textAlign: "right",
                                        fontSize: 9,
                                        color: "gray",
                                        marginTop: 5,
                                    }}
                                >
                                    {formatTime(item?.createAt)}
                                </Text>
                            </Pressable>
                        );
                    }
                })}
            </ScrollView>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 10,
                    paddingVertical: 10,
                    borderTopWidth: 1,
                    borderTopColor: "#dddddd",

                }}
            >
                <Entypo
                    onPress={handleEmojiPress}
                    style={{ marginRight: 5 }}
                    name="emoji-happy"
                    size={24}
                    color="black"
                />
                <TextInput
                    value={message}
                    onChangeText={setMessage}
                    style={{
                        flex: 1,
                        height: 50,
                        borderWidth: 1,
                        borderColor: "#dddddd",
                        borderRadius: 20,
                        paddingHorizontal: 10,
                    }}
                    placeholder="Type Your message..."
                />
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 7,
                        marginHorizontal: 8,
                    }}
                >
                    <Entypo name="camera" size={24} color="black" />
                </View>
                <Pressable
                    onPress={() => handleSend("text")}
                    style={{
                        backgroundColor: "#007bff",
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 20,
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "bold" }}>Send</Text>
                </Pressable>
            </View>
            {showEmojiSelector && (
                <EmojiSelector
                    onEmojiSelected={(emoji) => {
                        setMessage((prevMessage) => prevMessage + emoji);
                    }}
                    style={{ height: 350 }}
                />
            )}
        </KeyboardAvoidingView>
    );
}
export default chatscreen;

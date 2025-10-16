import { View, Text, Image, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Pressable, Dimensions, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { AntDesign } from '@expo/vector-icons';
import { Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { NavigationProp } from '@react-navigation/native';

// Type definitions
interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  image?: string;
}

interface Conversation {
  _id: string;
  users: string[] | User[];
  lastMessage?: string;
  updatedAt?: string;
}

interface MessagesProps {
  navigation: NavigationProp<any>;
  route: any;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const Messages = ({ route, navigation }: MessagesProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [recipientsData, setRecipientsData] = useState<{ [key: string]: User }>({});

  // Fetch user data
  const getData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
      const res = await axios.post('https://on-host-api.vercel.app/userdata', { token });
      setUserData(res.data.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Fetch all conversations
  const getAllConversations = async () => {
    if (!userData?._id) return; // Wait until userData is available
    try {
      setLoading(true);
      const res = await axios.get(`https://on-host-api.vercel.app/conversation-accept/${userData._id}`);
      setConversations(res.data.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recipient data for a single user
  const fetchRecipientData = async (recipientId: string) => {
    try {
      const res = await axios.get(`https://on-host-api.vercel.app/user/${recipientId}`);
      return res.data.data;
    } catch (error) {
      console.error(`Error fetching recipient data for ID ${recipientId}:`, error);
      return null;
    }
  };

  // Fetch recipient data for all conversations
  const fetchAllRecipientsData = async () => {
    if (!conversations.length || !userData?._id) return;

    const newRecipientsData: { [key: string]: User } = { ...recipientsData };

    for (const conversation of conversations) {
      const recipientId = getRecipientId(conversation.users, userData._id);
      if (recipientId && !newRecipientsData[recipientId]) {
        const recipient = await fetchRecipientData(recipientId);
        if (recipient) {
          newRecipientsData[recipientId] = recipient;
        }
      }
    }

    setRecipientsData(newRecipientsData);
  };

  // Load user data on mount
  useEffect(() => {
    getData();
  }, []);

  // Load conversations when userData is available
  useEffect(() => {
    if (userData?._id) {
      getAllConversations();
    }
  }, [userData]);

  // Fetch recipients data when conversations change
  useEffect(() => {
    fetchAllRecipientsData();
  }, [conversations, userData]);

  // Handle load more for pagination
  const handleLoadMore = () => {
    if (!loading && userData?._id) {
      getAllConversations();
    }
  };

  // Get recipient ID (exclude current user)
  const getRecipientId = (users: string[] | User[] | undefined, currentUserId: string | undefined): string | null => {
    if (!currentUserId || !users || users.length < 2) {
      console.warn('Invalid input: missing currentUserId or insufficient users', { currentUserId, users });
      return null;
    }

    const recipient = users.find((user) => {
      const userId = typeof user === 'string' ? user : user._id;
      return userId && userId !== currentUserId;
    });

    if (!recipient) {
      console.warn('No valid recipient found in users', { users, currentUserId });
      return null;
    }

    return typeof recipient === 'string' ? recipient : recipient._id;
  };

  // Conversation card component
  const ConversationCard = ({ data }: { data: Conversation }) => {
    const recipientId = getRecipientId(data.users, userData?._id);
    const recipient = recipientId ? recipientsData[recipientId] : null;
    const recipientName = recipient?.name || 'UserName';

    if (!recipientId || !userData?._id) {
      return (
        <View style={styles.card}>
          <Card>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.errorText}>Invalid conversation</Text>
            </Card.Content>
          </Card>
        </View>
      );
    }

    return (
      <Pressable
        onPress={() => {
          if (recipientId === userData._id) {
            alert('Error', 'You cannot start a chat with yourself');
            return;
          }
          navigation.navigate('ChatScreen', {
            receiverId: recipientId,
            userId: userData._id,
            receiverName: recipientName,
          });
        }}
        style={styles.card}
      >
        <Card>
          <Card.Content style={styles.cardContent}>
            <Image
              source={{
                uri: recipient?.image || 'https://on-host-api.vercel.app/static/default-blue.png',
              }}
              style={styles.avatar}
            />
            <View style={styles.textContainer}>
              <Text style={styles.name}>{recipientName}</Text>
              <Text style={styles.lastMessage}>
                {data.lastMessage || 'No messages yet'}
              </Text>
            </View>
            <AntDesign name="right" size={24} color="black" />
          </Card.Content>
        </Card>
      </Pressable>
    );
  };

  return (
    <View style={styles.centered}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {loading && !conversations.length ? (
          <ActivityIndicator size="large" color="white" />
        ) : (
          <FlatList
            data={conversations}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <ConversationCard data={item} />}
            ListFooterComponent={() => (
              <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
                <Text style={styles.loadMoreText}>
                  {loading ? <ActivityIndicator size="large" color="white" /> : 'Load More'}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <Text style={styles.emptyText}>No conversations</Text>
            )}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  card: {
    margin: 10,
    width: SCREEN_WIDTH * 0.95,
    alignSelf: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#000',
  },
  lastMessage: {
    fontSize: 14,
    color: '#000',
    marginTop: 5,
  },
  loadMoreButton: {
    alignItems: 'center',
    padding: 16,
  },
  loadMoreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 25,
  },
});

export default Messages;

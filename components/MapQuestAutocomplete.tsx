import React, { useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import axios from 'axios';

const MAPQUEST_API_KEY = 'Didx513vUX6oOklrmIiNn4waZceEVemO'; // Replace with your key

export default function MapQuestAutocomplete({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch suggestions from MapQuest API
  const fetchSuggestions = async (text) => {
    setLoading(true);
    setQuery(text);
    if (text.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(
        `https://www.mapquestapi.com/search/v3/prediction`,
        {
          params: {
            key: MAPQUEST_API_KEY,
            q: text,
            collection: 'adminArea,poi,address,category,franchise,airport', // you can use user's location here if available
            limit: 5,
          },
        }
      );
      setResults(res.data.results || []);
    } catch (err) {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Where to?"
        value={query}
        onChangeText={fetchSuggestions}
      />
      {loading && <Text style={styles.loading}>Loading...</Text>}
      <FlatList
        data={results}
        keyExtractor={item => item.id}
        style={{ zIndex: 100, backgroundColor: '#fff' }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              setQuery(item.displayString);
              setResults([]);
              if (onSelect) onSelect(item);
            }}
          >
            <Text>{item.displayString}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  input: {
    borderColor: '#007AFF',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    margin: 10,
    fontSize: 18,
    backgroundColor: '',
    textAlign: 'center',
    zIndex: 100,
  },
  loading: {
    marginLeft: 10,
    color: '#999',
    zIndex: 100,
  },
  item: {
    padding: 12,
    borderBottomColor: '#ededed',
    borderBottomWidth: 1,
    backgroundColor: '#fff',
    zIndex: 100,
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

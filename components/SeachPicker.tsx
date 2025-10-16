import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;



const SeachPicker = ({ selectedValue, onValueChange, items }) => {
    const [modalVisible, setModalVisible] = useState(false);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => {
                onValueChange(item.value);
                setModalVisible(false);
            }}
        >
            <FontAwesome name={item.icon} size={20} color="#000" style={styles.icon} />
            <Text style={styles.itemText}>{item.label}</Text>
        </TouchableOpacity>
    );

    const selectedItem = items.find((item) => item.value === selectedValue) || items[0];

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.picker}
            >
                <FontAwesome name={selectedItem.icon} size={20} color="#000" style={styles.icon} />
                <Text style={styles.pickerText}>{selectedItem.label}</Text>
            </TouchableOpacity>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 10,
        padding: 20,
    },
    picker: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 5,
        padding: 10,

    },
    pickerText: {
        flex: 1,
        fontSize: 16,
    },
    icon: {
        marginRight: 10,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 10,
        padding: 20,
        maxHeight: 300,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemText: {
        alignItems: 'center',
        alignContent: 'center',
        textAlign: 'center',
        fontSize: 16,
    },
    closeButton: {
        padding: 10,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        marginTop: 10,
    },
    closeButtonText: {
        fontSize: 16,
        color: '#333',
    },
});

export default SeachPicker;

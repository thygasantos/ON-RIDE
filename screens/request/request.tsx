import React, { useState } from "react";
import { Dimensions, Image, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Picker } from '@react-native-picker/picker';

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

const CustomPicker = ({ selectedValue, onValueChange, items }) => {
  return (
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={styles.picker}
        itemStyle={styles.pickerItem}
      >
        {items.map((item) => (
          <Picker.Item
            key={item.value}
            label={`${item.icon} ${item.label}`}
            value={item.value}
          />
        ))}
      </Picker>
    </View>
  );
};

export default function RequestScreen({ route, navigation }) {
    const { id, info, latitude, longitude, dlongitude, dlatitude, destination, valor_total, km, time, polylineCoords, tax_km, tax_app, moeda, date, status, payment } = route.params;
    const [selectMoeda, setSelectMoeda] = useState('cash');

    const pickerItems = [
        { label: 'Cash', value: 'cash', icon: '💵' },
        { label: 'Credit Card', value: 'card', icon: '💳' },
        { label: 'Digital Wallet', value: 'wallet', icon: '📱' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.paymentContainer}>
                <View style={styles.paymentHeader}>
                    <Text style={styles.paymentTitle}>Payment Details</Text>
                    <Text style={styles.paymentAmount}>{moeda} {valor_total}</Text>
                </View>
                <View style={styles.paymentDetails}>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Payment Method</Text>
                        <Text style={styles.paymentValue}>{payment}</Text>
                    </View>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Status</Text>
                        <Text style={styles.paymentValue}>{status}</Text>
                    </View>
                </View>
                <Text style={styles.dateText}>{date}</Text>
            </View>

            <View style={styles.tripDetails}>
                <Text style={styles.sectionTitle}>Trip Details</Text>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Distance</Text>
                    <Text style={styles.detailValue}>{km} km</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{time} min</Text>
                </View>
            </View>

            <View style={styles.requestItem}>
                <Image
                    style={styles.transitIcon}
                    source={require("@/assets/transit.png")}
                />
                <Text style={styles.title}>{info}</Text>
                <Text style={styles.subtitle}>{destination}</Text>
                <Image
                    style={styles.image}
                    source={require("@/assets/icon.png")}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 20,
    },
    paymentContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    paymentTitle: {
        color: '#000',
        fontSize: 20,
        fontWeight: '600',
    },
    paymentAmount: {
        color: '#4CAF50',
        fontSize: 28,
        fontWeight: '700',
    },
    paymentDetails: {
        marginBottom: 15,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    paymentLabel: {
        color: '#000',
        fontSize: 16,
    },
    paymentValue: {
        color: '#000',
        fontSize: 16,
        fontWeight: '500',
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 15,
    },
    picker: {
        height: 50,
        width: '100%',
    },
    pickerItem: {
        fontSize: 16,
        color: '#000',
    },
    dateText: {
        color: '#000',
        fontSize: 16,
        textAlign: 'center',
    },
    tripDetails: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    sectionTitle: {
        color: '#000',
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 10,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        color: '#000',
        fontSize: 16,
    },
    detailValue: {
        color: '#000',
        fontSize: 16,
        fontWeight: '500',
    },
    requestItem: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    transitIcon: {
        marginLeft: 3,
        height: 95,
        width: 25,
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 35,
        marginTop: -90,
        color: "#333",
    },
    subtitle: {
        fontSize: 18,
        color: "#666",
        fontWeight: "500",
        marginLeft: 35,
        marginTop: 10,
    },
    image: {
        height: 180,
        width: SCREEN_WIDTH * 0.8,
        borderRadius: 10,
        marginTop: 20,
        alignSelf: "center",
    },
});

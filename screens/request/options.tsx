import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function delivery() {
    return (
        <View style={styles.container}>
            <Text style={{color: 'white'}}> options page</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

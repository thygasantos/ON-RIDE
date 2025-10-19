import React from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar, Button, Card } from "react-native-paper";

const LeftContent = (props) => <Avatar.Icon {...props} icon="car" />;

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Vehicles({navigation}) {
  return (
    <View style={styles.container}>
      <Button style={ { width: 350, marginTop: 30, backgroundColor:'blue', alignItems: 'center' , justifyContent: 'center' }} >
        <Text style={{ color: 'white' , width: 350, alignItems: 'center', justifyContent: 'center'}}>
        ADD VEHICLES
        </Text>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "black",
    padding: 10,

  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",

  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
    backgroundColor: "black",

  },
});


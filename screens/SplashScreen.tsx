import React from 'react';
import { ActivityIndicator, View } from 'react-native';

const SplashScreen = () => {
    return(
        <View style={{ flex: 1 , justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size={'large'} color={'black'} />
        </View>
    );
};


export default SplashScreen;
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ResourcesScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Resources Screen</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    text: {
        fontFamily: 'Inter_500Medium',
        fontSize: 18,
        color: '#2D3748',
    }
});

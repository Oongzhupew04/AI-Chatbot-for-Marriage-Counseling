import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiBaseUrl = () => {
    // Attempt to automatically get the IP address of the Metro bundler
    const hostUri = Constants.expoConfig?.hostUri;
    
    if (hostUri) {
        // hostUri is usually in the format "192.168.1.x:8081"
        const ipAddress = hostUri.split(':')[0];
        return `http://${ipAddress}:3000`;
    }

    // Fallback if hostUri is unavailable (e.g. production or standard React Native)
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};

export const API_BASE_URL = getApiBaseUrl();

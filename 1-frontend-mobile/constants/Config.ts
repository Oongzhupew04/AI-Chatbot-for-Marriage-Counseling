import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiBaseUrl = () => {
    // Return the live DigitalOcean server IP for testing
    return 'http://165.22.103.4:3000';
};

export const API_BASE_URL = getApiBaseUrl();

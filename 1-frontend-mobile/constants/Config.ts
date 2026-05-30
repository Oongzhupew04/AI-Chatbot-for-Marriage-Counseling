import { Platform } from 'react-native';

// Use 10.0.2.2 for Android emulator, Wi-Fi IP for Expo Go physical device
export const API_BASE_URL = Platform.OS === 'android' 
    ? 'http://10.0.2.2:3000' 
    : 'http://10.127.93.143:3000';

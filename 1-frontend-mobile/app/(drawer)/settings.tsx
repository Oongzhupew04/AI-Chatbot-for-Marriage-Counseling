import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator, Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// NOTE: Android push notifications are temporarily disabled here.
// In Expo SDK 53+, the Firebase Cloud Messaging (FCM) library was removed from
// the Android Expo Go app to reduce bloat. Importing 'expo-notifications' on
// Android Expo Go causes a fatal crash. We conditionally require it only for iOS.
// (To enable on Android, an EAS Custom Development Build is required).
let Notifications: any;
if (Platform.OS !== 'android') {
    Notifications = require('expo-notifications');
}
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { API_BASE_URL } from '../../constants/Config';
import { getStyles } from './settings.styles';
import { useTheme } from '../../context/ThemeContext';
import ChangePasswordModal from '../../components/modals/changePasswordModal';
import DeleteAccountModal from '../../components/modals/deleteAccountModal';

export default function SettingsScreen() {
    const router = useRouter();
    const { isDarkMode, toggleDarkMode, theme } = useTheme();
    const styles = getStyles(theme);
    const [notifications, setNotifications] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        const fetchPreferences = async () => {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const config = { headers: { Authorization: `Bearer ${token}` } };
            try {
                const response = await axios.get(`${API_BASE_URL}/api/settings/preferences`, config);

                if (response.data.success) {
                    const { push_notifications_enabled, dark_mode_enabled } = response.data;

                    setNotifications(push_notifications_enabled);
                    await AsyncStorage.setItem('push_notifications_enabled', String(push_notifications_enabled));

                    if (isDarkMode !== dark_mode_enabled) {
                        // Keep our local async storage in sync, theme context will catch up on next load
                        // But since we are here, we can just call toggleDarkMode to sync state
                        await toggleDarkMode(dark_mode_enabled);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user preferences:", error);

                // Fallback to local storage if API fails
                const storedPref = await AsyncStorage.getItem('push_notifications_enabled');
                if (storedPref === 'true') setNotifications(true);
                // Note: Dark mode is handled by ThemeContext so we don't need fallback here
            } finally {
                setIsLoading(false);
            }
        };

        fetchPreferences();
    }, []);

    const handleNotificationToggle = async (value: boolean) => {
        if (Platform.OS === 'android') {
            Alert.alert('Notice', 'Push notifications are temporarily disabled on Android Expo Go.');
            return;
        }

        setNotifications(value);
        await AsyncStorage.setItem('push_notifications_enabled', String(value));

        const token = await AsyncStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            await axios.put(`${API_BASE_URL}/api/settings/preferences`, { pushEnabled: value }, config);

            if (value) {
                // Request permissions and get Expo push token
                if (Device.isDevice) {
                    const existingPermissions: any = await Notifications.getPermissionsAsync();
                    let isGranted = existingPermissions.granted || existingPermissions.status === 'granted';
                    if (!isGranted) {
                        const requestPermissions: any = await Notifications.requestPermissionsAsync();
                        isGranted = requestPermissions.granted || requestPermissions.status === 'granted';
                    }
                    if (!isGranted) {
                        Alert.alert('Permission required', 'Failed to get push token for push notification!');
                        setNotifications(false);
                        await AsyncStorage.setItem('push_notifications_enabled', 'false');
                        return;
                    }

                    // Get token
                    try {
                        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

                        const tokenData = await Notifications.getExpoPushTokenAsync(
                            projectId ? { projectId } : undefined
                        );
                        const expoPushToken = tokenData.data;

                        // Send to backend
                        await axios.post(`${API_BASE_URL}/api/settings/push-subscription`, {
                            user_id: 0, // Ignored by backend (trusts JWT)
                            endpoint: expoPushToken,
                            keys: {
                                p256dh: 'expo',
                                auth: 'expo'
                            }
                        }, config);

                        // Schedule a local notification to immediately prove permissions work
                        await Notifications.scheduleNotificationAsync({
                            content: {
                                title: "Push Notifications Enabled!",
                                body: "Your device is now registered to receive alerts.",
                                sound: true,
                            },
                            trigger: null, // trigger immediately
                        });

                    } catch (tokenError: any) {
                        console.error("Token generation failed:", tokenError);
                        Alert.alert("Development Notice", "Failed to generate push token. This usually requires an Expo account. Error: " + tokenError.message);
                    }
                } else {
                    Alert.alert('Notice', 'Must use physical device for Push Notifications');
                }
            } else {
                // DELETE token from backend (we don't have the exact token here, but backend can delete all subscriptions or we can store the token locally)
                // For simplicity, we just delete all push subscriptions for this user or the stored one.
                // Actually backend delete_push_subscription requires endpoint. 
                // We could get it or just let the backend handle cleanup.
                const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
                if (tokenData) {
                    await axios.delete(`${API_BASE_URL}/api/settings/push-subscription?endpoint=${encodeURIComponent(tokenData.data)}`, config);
                }
            }
        } catch (error) {
            console.error("Failed to update push settings", error);
            // Revert on failure
            setNotifications(!value);
            Alert.alert("Error", "Failed to update notification preferences.");
        }
    };

    const handleDarkModeToggle = async (value: boolean) => {
        await toggleDarkMode(value);
    };

    const handleDeleteSuccess = async () => {
        await AsyncStorage.clear();
        router.replace('/auth/login');
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.mainContent}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>Manage your preferences and account settings</Text>
            </View>

            <View style={styles.settingsGrid}>
                {/* Notifications Card */}
                <View style={styles.settingCard}>
                    <View style={styles.cardTitleContainer}>
                        <FontAwesome5 name="bell" size={16} color="#F59E0B" />
                        <Text style={styles.cardTitle}>Notifications</Text>
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingInfoTitle}>Push Notifications</Text>
                            <Text style={styles.settingInfoDesc}>Receive alerts for upcoming check-ins</Text>
                        </View>
                        <Switch
                            value={notifications}
                            onValueChange={handleNotificationToggle}
                            trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* Appearance Card */}
                <View style={styles.settingCard}>
                    <View style={styles.cardTitleContainer}>
                        <FontAwesome5 name="paint-brush" size={16} color="#3B82F6" />
                        <Text style={styles.cardTitle}>Appearance</Text>
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingInfoTitle}>Dark Mode</Text>
                            <Text style={styles.settingInfoDesc}>Switch to a darker theme for night viewing</Text>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={handleDarkModeToggle}
                            trackColor={{ false: theme.border, true: theme.primary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* Privacy & Security Card */}
                <View style={styles.settingCard}>
                    <View style={styles.cardTitleContainer}>
                        <FontAwesome5 name="lock" size={16} color="#10B981" />
                        <Text style={styles.cardTitle}>Privacy & Security</Text>
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingInfoTitle}>Change Password</Text>
                            <Text style={styles.settingInfoDesc}>Update your account password</Text>
                        </View>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => setIsPasswordModalOpen(true)}>
                            <Text style={styles.actionBtnText}>Update</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Danger Zone Card */}
                <View style={[styles.settingCard, styles.settingCardDanger]}>
                    <View style={[styles.cardTitleContainer, { borderBottomColor: '#FCA5A5' }]}>
                        <FontAwesome5 name="exclamation-triangle" size={16} color="#EF4444" />
                        <Text style={[styles.cardTitle, styles.cardTitleDanger]}>Danger Zone</Text>
                    </View>

                    <View style={styles.dangerSettingRow}>
                        <View style={styles.dangerSettingInfo}>
                            <Text style={[styles.settingInfoTitle, styles.settingInfoTitleDanger]}>Delete Account</Text>
                            <Text style={styles.settingInfoDesc}>Permanently remove your account and all associated data.</Text>
                        </View>
                        <TouchableOpacity style={styles.dangerBtn} onPress={() => setIsDeleteModalOpen(true)}>
                            <Text style={styles.dangerBtnText}>Delete Account</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ChangePasswordModal
                visible={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />

            <DeleteAccountModal
                visible={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onSuccess={handleDeleteSuccess}
            />
        </ScrollView>
    );
}

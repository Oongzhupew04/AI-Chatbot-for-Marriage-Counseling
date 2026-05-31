import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, Image, DeviceEventEmitter } from 'react-native';
import { styles } from './_layout.styles';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList, DrawerToggleButton } from '@react-navigation/drawer';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter, usePathname, Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/Config';

const isTokenValid = (token: string | null): boolean => {
    if (!token) return false;

    try {
        const payloadBase64 = token.split('.')[1];
        // Standardize base64 string
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');

        // Decode base64 to utf-8 safely
        const decodedJson = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        const decodedToken = JSON.parse(decodedJson);

        const expirationTimeInMilliseconds = decodedToken.exp * 1000;
        return Date.now() < expirationTimeInMilliseconds;
    } catch (error) {
        console.error("Failed to decode token");
        return false;
    }
};

function CustomDrawerContent(props: any) {
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [initials, setInitials] = useState('');
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const loadProfileData = async () => {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                try {
                    const response = await axios.get(`${API_BASE_URL}/api/users/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.data.success) {
                        const { username, email, profile_pic } = response.data.profile;

                        setUserName(username || '');
                        setUserEmail(email || '');

                        let finalPicUrl = profile_pic;
                        if (finalPicUrl) {
                            if (finalPicUrl.startsWith('http://localhost:3000')) {
                                finalPicUrl = finalPicUrl.replace('http://localhost:3000', API_BASE_URL);
                            } else if (finalPicUrl.startsWith('/')) {
                                finalPicUrl = `${API_BASE_URL}${finalPicUrl}`;
                            }
                        }

                        if (finalPicUrl) {
                            setProfilePic(finalPicUrl);
                            await AsyncStorage.setItem('profilePic', finalPicUrl);
                        } else {
                            setProfilePic(null);
                            await AsyncStorage.removeItem('profilePic');
                        }

                        if (username) await AsyncStorage.setItem('username', username);
                        if (email) await AsyncStorage.setItem('email', email);

                        const derivedInitials = (username || 'U')
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase();
                        setInitials(derivedInitials);

                        return; // Successfully loaded from DB, skip local storage fallback
                    }
                } catch (error) {
                    console.error("Failed to fetch latest profile for drawer:", error);
                }
            }

            // Fallback to local storage if API fails or no token
            const storedName = await AsyncStorage.getItem('username');
            const storedEmail = await AsyncStorage.getItem('email');
            const storedPic = await AsyncStorage.getItem('profilePic');

            if (storedName) {
                setUserName(storedName);
                const derivedInitials = storedName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
                setInitials(derivedInitials);
            }
            if (storedEmail) {
                setUserEmail(storedEmail);
            }
            if (storedPic) {
                setProfilePic(storedPic);
            } else {
                setProfilePic(null);
            }
        };

        loadProfileData();
    }, []);

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('userRole');
        await AsyncStorage.removeItem('currentChatId');
        router.replace('/auth/login');
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <DrawerContentScrollView {...props} contentContainerStyle={{ padding: 24 }}>
                <View style={styles.homebrand}>
                    <FontAwesome6 name="heart-pulse" size={20} color="#7C9A92" />
                    <Text style={styles.homebrandText}>Counselor.AI</Text>
                </View>

                {/* Primary Nav Links */}
                <DrawerItemList {...props} />

                <View style={styles.divider} />

                {/* Settings / Help */}
                <TouchableOpacity style={styles.navItem}>
                    <FontAwesome6 name="gear" size={16} color="#718096" style={{ width: 24 }} />
                    <Text style={styles.navText}>Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/help')}>
                    <FontAwesome6 name="circle-question" size={16} color="#718096" style={{ width: 24 }} />
                    <Text style={styles.navText}>Help</Text>
                </TouchableOpacity>

            </DrawerContentScrollView>

            <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
                    <FontAwesome6 name="circle-user" size={16} color="#718096" style={{ width: 24 }} />
                    <Text style={styles.navText}>My Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
                    <FontAwesome6 name="arrow-right-from-bracket" size={16} color="#E53E3E" style={{ width: 24 }} />
                    <Text style={[styles.navText, { color: '#E53E3E' }]}>Log Out</Text>
                </TouchableOpacity>

                <View style={[styles.divider, { marginBottom: 16, marginTop: 8 }]} />

                <View style={[styles.userProfile, { padding: 0, borderTopWidth: 0 }]}>
                    {profilePic ? (
                        <Image source={{ uri: profilePic }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarFallback}>
                            <Text style={styles.avatarText}>{initials || 'U'}</Text>
                        </View>
                    )}
                    <View style={styles.userInfo}>
                        <Text style={styles.userName} numberOfLines={1}>{userName || 'User'}</Text>
                        <Text style={styles.userEmail} numberOfLines={1}>{userEmail || 'user@example.com'}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

export default function DrawerLayout() {
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            const token = await AsyncStorage.getItem('token');
            const isValid = isTokenValid(token);

            if (isValid) {
                setIsAuthenticated(true);
            } else {
                // If there's an invalid/expired token in storage, wipe it
                if (token) {
                    await AsyncStorage.removeItem('token');
                    await AsyncStorage.removeItem('userRole');
                    await AsyncStorage.removeItem('currentChatId');
                }
                setIsAuthenticated(false);
            }
            setIsChecking(false);
        };

        checkAuth();
    }, []);

    if (isChecking) {
        return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
    }

    if (!isAuthenticated) {
        return <Redirect href="/auth/login" />;
    }

    return (
        <Drawer
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: true,
                header: () => (
                    <SafeAreaView style={{ backgroundColor: '#FFFFFF' }}>
                        <View style={styles.customHeader}>
                            <DrawerToggleButton tintColor="#2D3748" />
                            <FontAwesome6 name="heart-pulse" size={20} color="#7C9A92" />
                            <Text style={styles.homebrandText}>Counselor.AI</Text>
                            {pathname === '/' && (
                                <TouchableOpacity style={styles.headerRightIcon} onPress={() => DeviceEventEmitter.emit('openRightDrawer')}>
                                    <FontAwesome6 name="clock-rotate-left" size={20} color="#718096" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </SafeAreaView>
                ),
                drawerStyle: {
                    width: 280,
                },
                drawerActiveBackgroundColor: '#EBF3F1',
                drawerActiveTintColor: '#7C9A92',
                drawerInactiveTintColor: '#718096',
                drawerLabelStyle: {
                    fontFamily: 'Inter_500Medium',
                    fontSize: 15,
                    marginLeft: -5,
                }
            }}
        >
            <Drawer.Screen
                name="index" // This matches app/(drawer)/index.tsx
                listeners={{
                    drawerItemPress: () => {
                        DeviceEventEmitter.emit('startNewChat');
                    }
                }}
                options={{
                    drawerLabel: 'Home',
                    title: 'Home',
                    drawerIcon: ({ color }) => (
                        <FontAwesome6 name="house" size={16} color={color} style={{ width: 20 }} />
                    ),
                }}
            />
            <Drawer.Screen
                name="analysis"
                options={{
                    drawerLabel: 'Analysis',
                    title: 'Analysis',
                    drawerIcon: ({ color }) => (
                        <FontAwesome6 name="chart-pie" size={16} color={color} style={{ width: 20 }} />
                    ),
                }}
            />
            <Drawer.Screen
                name="resources"
                options={{
                    drawerLabel: 'Resources',
                    title: 'Resources',
                    drawerIcon: ({ color }) => (
                        <FontAwesome6 name="book-open" size={16} color={color} style={{ width: 20 }} />
                    ),
                }}
            />
            <Drawer.Screen
                name="help"
                options={{
                    drawerItemStyle: { display: 'none' },
                    title: 'Help'
                }}
            />
            <Drawer.Screen
                name="profile"
                options={{
                    drawerItemStyle: { display: 'none' },
                    title: 'My Profile'
                }}
            />
        </Drawer>
    );
}



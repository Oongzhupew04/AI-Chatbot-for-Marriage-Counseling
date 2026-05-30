import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, DeviceEventEmitter } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter, usePathname, Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/Config';

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
                <TouchableOpacity style={styles.navItem}>
                    <FontAwesome6 name="circle-question" size={16} color="#718096" style={{ width: 24 }} />
                    <Text style={styles.navText}>Help</Text>
                </TouchableOpacity>

            </DrawerContentScrollView>

            <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
                <TouchableOpacity style={styles.navItem}>
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

    useEffect(() => {
        const checkAuth = async () => {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                setIsAuthenticated(true);
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
                headerShown: false,
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
        </Drawer>
    );
}

const styles = StyleSheet.create({
    homebrand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 30,
    },
    homebrandText: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 19.2, // 1.2rem
        color: '#2D3748',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 15,
    },
    sectionHeader: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: '#718096',
        marginBottom: 10,
        marginLeft: 10,
    },
    historyItem: {
        flexDirection: 'row',
        gap: 12,
        padding: 10,
        borderRadius: 12,
        alignItems: 'center',
    },
    historyIcon: {
        width: 32,
        height: 32,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyInfo: {
        flex: 1,
    },
    historyTitle: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13.6,
        color: '#2D3748',
    },
    historyDate: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#718096',
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 12,
    },
    navText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: '#718096',
    },
    userProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    avatarFallback: {
        width: 36,
        height: 36,
        backgroundColor: '#6B7C93',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14.4,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14.4,
        color: '#2D3748',
    },
    userEmail: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#718096',
    }
});

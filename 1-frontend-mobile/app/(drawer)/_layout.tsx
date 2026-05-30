import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

function CustomDrawerContent(props: any) {
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [initials, setInitials] = useState('');
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const loadProfileData = async () => {
            const storedName = await AsyncStorage.getItem('username');
            const storedEmail = await AsyncStorage.getItem('email');
            
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

                {/* Recent Sessions header inside drawer */}
                <Text style={styles.sectionHeader}>Recent Sessions</Text>
                
                {/* Note: In a full app, you would map over fetched sessions here */}
                <TouchableOpacity style={styles.historyItem}>
                    <View style={styles.historyIcon}><FontAwesome6 name="comment-dots" size={14} color="#718096" /></View>
                    <View style={styles.historyInfo}>
                        <Text style={styles.historyTitle}>New Chat</Text>
                        <Text style={styles.historyDate}>Today</Text>
                    </View>
                </TouchableOpacity>

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
                <TouchableOpacity style={styles.navItem}>
                    <FontAwesome6 name="circle-user" size={16} color="#718096" style={{ width: 24 }} />
                    <Text style={styles.navText}>My Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
                    <FontAwesome6 name="arrow-right-from-bracket" size={16} color="#E53E3E" style={{ width: 24 }} />
                    <Text style={[styles.navText, { color: '#E53E3E' }]}>Log Out</Text>
                </TouchableOpacity>

            </DrawerContentScrollView>

            <View style={styles.userProfile}>
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
    );
}

export default function DrawerLayout() {
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
                    marginLeft: -15,
                }
            }}
        >
            <Drawer.Screen
                name="index" // This matches app/(drawer)/index.tsx
                options={{
                    drawerLabel: 'Home',
                    title: 'Home',
                    drawerIcon: ({ color }) => (
                        <FontAwesome6 name="house" size={16} color={color} style={{ width: 20 }} />
                    ),
                }}
            />
            {/* You can add more screens like analysis.tsx, resources.tsx here */}
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

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Animated } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getStyles } from './resources.styles';
import { API_BASE_URL } from '../../constants/Config';
import { useTheme } from '../../context/ThemeContext';

interface Resource {
    id: number;
    title: string;
    description: string;
    type: string;
    url: string;
    icon: string;
}

export default function ResourcesScreen() {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const response = await axios.get(`${API_BASE_URL}/api/resources`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data && response.data.success) {
                    setResources(response.data.resources);
                } else {
                    setError('Failed to load resources.');
                }
            } catch (err) {
                console.error('Error fetching resources:', err);
                setError('Could not connect to the server.');
            } finally {
                setLoading(false);
            }
        };

        fetchResources();
    }, []);

    const openLink = async (url: string) => {
        try {
            // Replace localhost with the actual network IP so the mobile device can reach the server
            let parsedUrl = url;
            if (parsedUrl.includes('localhost:3000') || parsedUrl.includes('127.0.0.1:3000')) {
                const baseUrlWithoutHttp = API_BASE_URL.replace(/^https?:\/\//, '');
                parsedUrl = parsedUrl.replace('localhost:3000', baseUrlWithoutHttp).replace('127.0.0.1:3000', baseUrlWithoutHttp);
                
                // Ensure http/https is preserved if the base URL didn't have it
                if (!parsedUrl.startsWith('http')) {
                    parsedUrl = API_BASE_URL.startsWith('https') ? `https://${parsedUrl}` : `http://${parsedUrl}`;
                }
            }

            const supported = await Linking.canOpenURL(parsedUrl);
            if (supported) {
                await Linking.openURL(parsedUrl);
            } else {
                console.error("Don't know how to open URI: " + url);
            }
        } catch (err) {
            console.error("An error occurred opening link", err);
        }
    };

    const mapIconName = (iconClass: string): string => {
        if (!iconClass) return 'book';
        const parts = iconClass.split('fa-');
        if (parts.length > 1) {
            return parts[1].split(' ')[0];
        }
        return 'book';
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.mainContent}>
            <View style={styles.header}>
                <Text style={styles.title}>Relationship Resources</Text>
                <Text style={styles.subtitle}>Curated articles, videos, and worksheets to strengthen your bond.</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#7C9A92" />
                    <Text style={styles.loadingText}>Loading resources...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : (
                <View style={styles.resourcesGrid}>
                    {resources.map((res) => (
                        <TouchableOpacity
                            key={res.id}
                            style={styles.resourceCard}
                            activeOpacity={0.7}
                            onPress={() => openLink(res.url)}
                        >
                            <LinearGradient
                                colors={['rgba(16, 185, 129, 0.1)', 'rgba(59, 130, 246, 0.1)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.iconContainer}
                            >
                                <FontAwesome5 name={mapIconName(res.icon)} size={24} color="#7C9A92" />
                            </LinearGradient>

                            <View style={styles.content}>
                                <View style={styles.badgeContainer}>
                                    <Text style={styles.badgeText}>{res.type.toUpperCase()}</Text>
                                </View>
                                <Text style={styles.resourceTitle}>{res.title}</Text>
                                <Text style={styles.resourceDesc}>{res.description}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

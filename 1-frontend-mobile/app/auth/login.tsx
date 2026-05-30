import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../constants/Config';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [consent, setConsent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter both email and password.");
            return;
        }
        if (!consent) {
            Alert.alert("Error", "You must agree to the disclaimer.");
            return;
        }

        try {
            setIsLoading(true);
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                email,
                password
            });
            
            const data = response.data;
            
            if (data.token) {
                await AsyncStorage.setItem('token', data.token);
                await AsyncStorage.setItem('userID', String(data.id));
                await AsyncStorage.setItem('username', data.username);
                await AsyncStorage.setItem('email', data.email);
                await AsyncStorage.removeItem('currentChatId');
                
                if (data.role) {
                    await AsyncStorage.setItem('userRole', data.role);
                }

                if (data.role && String(data.role).toLowerCase() === 'admin') {
                    router.replace('/');
                } else {
                    router.replace('/');
                }
            }
        } catch (error: any) {
            console.error("Login error:", error);
            if (error.response && error.response.data && error.response.data.error) {
                Alert.alert("Login Failed", error.response.data.error);
            } else {
                Alert.alert("Error", "A network error occurred. Please try again later.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#EBF3F1', '#dae8e4']}
                style={styles.bgBlob}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.card}>
                    <View style={styles.brandContainer}>
                        <FontAwesome6 name="heart-pulse" size={24} color="#7C9A92" />
                        <Text style={styles.brandText}>Counselor.AI</Text>
                    </View>
                    
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Welcome Back</Text>
                        <Text style={styles.headerSubtitle}>Please enter your details to sign in.</Text>
                    </View>

                    <TouchableOpacity style={styles.googleBtn}>
                        <FontAwesome6 name="google" size={18} color="#2D3748" style={{ marginRight: 10 }} />
                        <Text style={styles.googleBtnText}>Sign in with Google</Text>
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or sign in with email</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="example@gmail.com"
                            placeholderTextColor="#718096"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="#718096"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.disclaimerBox}>
                        <TouchableOpacity 
                            style={styles.checkboxContainer}
                            onPress={() => setConsent(!consent)}
                        >
                            <Ionicons 
                                name={consent ? "checkbox" : "square-outline"} 
                                size={20} 
                                color={consent ? "#7C9A92" : "#718096"} 
                                style={styles.checkboxIcon}
                            />
                        </TouchableOpacity>
                        <Text style={styles.disclaimerText}>
                            I understand this AI provides emotional support, not professional therapy. In emergencies, I will contact local authorities.
                        </Text>
                    </View>

                    <TouchableOpacity 
                        style={styles.submitBtn} 
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footerLinks}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <Link href="/auth/register" asChild>
                            <TouchableOpacity>
                                <Text style={styles.linkText}>Create free account</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                    <View style={[styles.footerLinks, { marginTop: 8 }]}>
                        <TouchableOpacity>
                            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F4F3', // var(--bg-body)
        position: 'relative',
    },
    bgBlob: {
        position: 'absolute',
        width: 700,
        height: 700,
        borderRadius: 350,
        bottom: -200,
        left: -150,
        opacity: 0.6, // Soften to simulate blur
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#FFFFFF', // var(--bg-white)
        borderRadius: 20, // var(--radius-lg)
        padding: 30, // Adjusted for mobile screen size vs web 48px
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 40,
        elevation: 10,
        alignItems: 'center', // Center content horizontally
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        gap: 10,
    },
    brandText: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 24, // 1.5rem
        color: '#2D3748', // var(--text-main)
    },
    header: {
        marginBottom: 24,
        alignItems: 'center',
        width: '100%',
    },
    headerTitle: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 28, // 1.75rem
        color: '#2D3748',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15.2, // 0.95rem
        color: '#718096', // var(--text-muted)
    },
    googleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0', // var(--border-light)
        borderRadius: 12, // var(--radius-md)
        paddingVertical: 12,
        marginBottom: 24,
    },
    googleBtnText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15.2, // 0.95rem
        color: '#2D3748',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    dividerText: {
        fontFamily: 'Inter_400Regular',
        paddingHorizontal: 10,
        fontSize: 13.6, // 0.85rem
        color: '#718096',
    },
    formGroup: {
        width: '100%',
        marginBottom: 16,
    },
    label: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13.6, // 0.85rem
        color: '#2D3748',
        marginBottom: 8,
    },
    input: {
        fontFamily: 'Inter_400Regular',
        backgroundColor: '#F8FAFC', // var(--bg-hover)
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16, // 1rem
        color: '#2D3748',
    },
    disclaimerBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FDFDEA',
        borderWidth: 1,
        borderColor: '#F6E05E',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        width: '100%',
    },
    checkboxContainer: {
        marginRight: 10,
        marginTop: 2, // Slight offset to align with text
    },
    checkboxIcon: {
        // sizing managed in icon props
    },
    disclaimerText: {
        fontFamily: 'Inter_400Regular',
        flex: 1,
        fontSize: 12.8, // 0.8rem
        color: '#744210',
        lineHeight: 18,
    },
    submitBtn: {
        width: '100%',
        backgroundColor: '#7C9A92', // var(--primary-sage)
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 24,
    },
    submitBtnText: {
        fontFamily: 'Inter_600SemiBold',
        color: '#FFFFFF',
        fontSize: 16,
    },
    footerLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        fontFamily: 'Inter_400Regular',
        color: '#718096',
        fontSize: 14.4, // 0.9rem
    },
    linkText: {
        fontFamily: 'Inter_600SemiBold',
        color: '#7C9A92', // var(--primary-sage)
        fontSize: 14.4,
    },
    forgotPasswordText: {
        fontFamily: 'Inter_500Medium',
        color: '#718096',
        fontSize: 13.6, // 0.85rem
    }
});

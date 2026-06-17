import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../constants/Config';
import { LinearGradient } from 'expo-linear-gradient';
import { getStyles } from './login.styles';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen() {
    const { theme } = useTheme();
    const styles = getStyles(theme);
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
                if (data.role && String(data.role).toLowerCase() === 'admin') {
                    Alert.alert(
                        "Admin Login Not Supported",
                        "Please use the website to login. The mobile app does not support admin accounts."
                    );
                    return;
                }

                await AsyncStorage.setItem('token', data.token);
                await AsyncStorage.setItem('userID', String(data.id));
                await AsyncStorage.setItem('username', data.username);
                await AsyncStorage.setItem('email', data.email);
                await AsyncStorage.removeItem('currentChatId');

                if (data.role) {
                    await AsyncStorage.setItem('userRole', data.role);
                }

                router.replace('/' as any);
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
            <StatusBar barStyle="dark-content" backgroundColor={theme.card} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
                        <View style={styles.card}>
                            <View style={styles.brandContainer}>
                                <FontAwesome6 name="heart-pulse" size={24} color="#7C9A92" />
                                <Text style={styles.brandText}>Counselor.AI</Text>
                            </View>

                            <View style={styles.header}>
                                <Text style={styles.headerTitle}>Welcome Back</Text>
                                <Text style={styles.headerSubtitle}>Please enter your details to sign in.</Text>
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
                            <View style={[styles.footerLinks, { marginTop: 8, marginBottom: 10 }]}>
                                <Link href="/auth/forgot-password" asChild>
                                    <TouchableOpacity>
                                        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}



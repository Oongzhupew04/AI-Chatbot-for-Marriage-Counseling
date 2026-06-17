import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { getStyles } from './forgot-password.styles';
import { useTheme } from '../../context/ThemeContext';
import { API_BASE_URL } from '../../constants/Config';
import axios from 'axios';

export default function ForgotPassword() {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRequestOtp = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setIsSubmitting(true);
        Keyboard.dismiss();

        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
            
            Alert.alert(
                'Check Your Email',
                response.data.message || `If an account exists, an OTP has been sent to ${email}`,
                [
                    {
                        text: 'OK',
                        onPress: () => router.push({ pathname: '/auth/reset-password', params: { email } })
                    }
                ]
            );
        } catch (error: any) {
            console.error("Forgot password error:", error);
            const errorMessage = error.response?.data?.error || "Failed to request OTP. Please try again.";
            Alert.alert("Error", errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                style={styles.keyboardView} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        
                        <View style={styles.brand}>
                            <FontAwesome6 name="heart-pulse" style={styles.iconHeartPulse} />
                            <Text style={styles.brandText}>Counselor.AI</Text>
                        </View>

                        <View style={styles.header}>
                            <Text style={styles.title}>Forgot Password</Text>
                            <Text style={styles.subtitle}>Enter your email address to receive a one-time passcode (OTP).</Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="example@gmail.com"
                                placeholderTextColor={theme.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!isSubmitting}
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
                            onPress={handleRequestOtp}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.submitBtnText}>
                                {isSubmitting ? 'Sending...' : 'Send OTP'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.footerLinks}>
                            <Text style={styles.footerText}>Remember your password? </Text>
                            <Link href="/auth/login" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.linkText}>Back to Login</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

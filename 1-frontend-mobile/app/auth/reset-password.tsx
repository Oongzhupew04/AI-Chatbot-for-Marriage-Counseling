import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { getStyles } from './reset-password.styles';
import { useTheme } from '../../context/ThemeContext';
import { API_BASE_URL } from '../../constants/Config';
import axios from 'axios';

export default function ResetPassword() {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const router = useRouter();
    const params = useLocalSearchParams();
    
    // Get email from URL params passed from forgot-password
    const email = Array.isArray(params.email) ? params.email[0] : params.email || '';

    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleResetPassword = async () => {
        if (!otp.trim() || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match!');
            return;
        }

        if (newPassword.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters long');
            return;
        }

        setIsSubmitting(true);
        Keyboard.dismiss();

        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, { 
                email, 
                otp, 
                newPassword 
            });
            
            Alert.alert(
                'Success',
                'Password reset successfully. Please login with your new password.',
                [
                    {
                        text: 'Login',
                        onPress: () => router.push('/auth/login')
                    }
                ]
            );
        } catch (error: any) {
            console.error("Reset password error:", error);
            const errorMessage = error.response?.data?.error || "Failed to reset password. Please check your OTP and try again.";
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
                            <Text style={styles.title}>Reset Password</Text>
                            <Text style={styles.subtitle}>Enter the OTP sent to your email and your new password.</Text>
                        </View>

                        {email ? (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <TextInput
                                    style={[styles.input, styles.inputDisabled]}
                                    value={email}
                                    editable={false}
                                />
                            </View>
                        ) : null}

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>One-Time Password (OTP)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter 6-digit OTP"
                                placeholderTextColor={theme.textSecondary}
                                value={otp}
                                onChangeText={setOtp}
                                keyboardType="number-pad"
                                editable={!isSubmitting}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>New Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={theme.textSecondary}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                editable={!isSubmitting}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={theme.textSecondary}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                editable={!isSubmitting}
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
                            onPress={handleResetPassword}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.submitBtnText}>
                                {isSubmitting ? 'Resetting...' : 'Reset Password'}
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

import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/Config';
import { getStyles } from './changePasswordModal.styles';
import { useTheme } from '../../context/ThemeContext';

interface ChangePasswordModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function ChangePasswordModal({ visible, onClose }: ChangePasswordModalProps) {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [otpSentMessage, setOtpSentMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);

    if (!visible) return null;

    const resetForm = () => {
        setPasswordError('');
        setPasswordSuccess('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtp('');
        setOtpSentMessage('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSendOtp = async () => {
        setPasswordError('');
        setOtpSentMessage('');
        setIsSendingOtp(true);

        try {
            const token = await AsyncStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`${API_BASE_URL}/api/settings/request-otp`, {}, config);
            setOtpSentMessage('OTP has been sent to your email.');
        } catch (error: any) {
            setPasswordError(error.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleChangePassword = async () => {
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters long.');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`${API_BASE_URL}/api/settings/change-password`, {
                currentPassword,
                newPassword,
                otp
            }, config);
            setPasswordSuccess('Password changed successfully!');
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (error: any) {
            setPasswordError(error.response?.data?.message || 'Failed to change password. Please check your current password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <KeyboardAvoidingView 
                style={styles.modalOverlay} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.modalContent}>
                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <Text style={styles.modalTitle}>Change Password</Text>
                        
                        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                        {passwordSuccess ? <Text style={styles.successText}>{passwordSuccess}</Text> : null}
                        {otpSentMessage ? <Text style={styles.successText}>{otpSentMessage}</Text> : null}

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Current Password</Text>
                            <TextInput
                                style={styles.input}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Verification Code (OTP)</Text>
                            <View style={styles.otpContainer}>
                                <TextInput
                                    style={[styles.input, styles.otpInput]}
                                    value={otp}
                                    onChangeText={setOtp}
                                    placeholder="6-digit code"
                                    placeholderTextColor="#A0AEC0"
                                />
                                <TouchableOpacity 
                                    style={styles.sendOtpBtn} 
                                    onPress={handleSendOtp}
                                    disabled={isSendingOtp}
                                >
                                    <Text style={styles.sendOtpBtnText}>{isSendingOtp ? 'Sending...' : 'Send OTP'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>New Password</Text>
                            <TextInput
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Confirm New Password</Text>
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnCancel} onPress={handleClose}>
                                <Text style={styles.btnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.btnSubmit, isSubmitting && { opacity: 0.7 }]} 
                                onPress={handleChangePassword}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.btnSubmitText}>{isSubmitting ? 'Updating...' : 'Update Password'}</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

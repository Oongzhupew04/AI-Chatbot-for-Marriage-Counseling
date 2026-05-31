import React from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styles } from './registrationOtpModal.styles';

interface RegistrationOtpModalProps {
    isOpen: boolean;
    email: string;
    otp: string;
    setOtp: (otp: string) => void;
    otpError: string;
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: () => void;
}

export default function RegistrationOtpModal({
    isOpen,
    email,
    otp,
    setOtp,
    otpError,
    isSubmitting,
    onClose,
    onSubmit
}: RegistrationOtpModalProps) {
    if (!isOpen) return null;

    return (
        <Modal transparent={true} animationType="fade" visible={isOpen} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.heading}>Verify Your Email</Text>
                    <Text style={styles.emailText}>
                        We sent a 6-digit verification code to{"\n"}
                        {email}.
                    </Text>

                    {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

                    <TextInput
                        style={styles.otpInput}
                        placeholder="123456"
                        placeholderTextColor="#9CA3AF"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={6}
                    />

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={styles.btnCancel}
                            onPress={onClose}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.btnCancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.btnSubmit, (isSubmitting || otp.length < 6) && styles.btnSubmitDisabled]}
                            onPress={onSubmit}
                            disabled={isSubmitting || otp.length < 6}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.btnSubmitText}>Verify & Register</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}



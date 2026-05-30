import React from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';

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
        <Modal transparent={true} animationType="slide" visible={isOpen} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalCard}>
                    <Text style={styles.title}>Email Verification</Text>
                    <Text style={styles.subtitle}>
                        We've sent a 6-digit one-time password to:
                    </Text>
                    <Text style={styles.emailText}>{email}</Text>
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Enter 6-digit OTP"
                        placeholderTextColor="#9ca3af"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={6}
                    />
                    
                    {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
                    
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={[styles.button, styles.cancelButton]} 
                            onPress={onClose}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.button, styles.submitButton]} 
                            onPress={onSubmit}
                            disabled={isSubmitting || otp.length < 6}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Verify & Register</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#4b5563',
        textAlign: 'center',
    },
    emailText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 18,
        textAlign: 'center',
        letterSpacing: 4,
        marginBottom: 8,
        color: '#111827',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 13,
        marginBottom: 16,
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
    },
    cancelButtonText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 16,
    },
    submitButton: {
        backgroundColor: '#657e65', // var(--primary-sage) from web app roughly
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

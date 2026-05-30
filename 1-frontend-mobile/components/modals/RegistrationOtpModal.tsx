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

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 32,
        paddingHorizontal: 24,
        borderRadius: 16,
        width: '85%',
        maxWidth: 380,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    heading: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
        fontFamily: 'Inter_600SemiBold',
    },
    emailText: {
        fontSize: 15,
        color: '#6B7280',
        marginBottom: 24,
        lineHeight: 22,
        textAlign: 'center',
        fontFamily: 'Inter_400Regular',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
        fontFamily: 'Inter_400Regular',
    },
    otpInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingVertical: 16,
        fontSize: 24,
        textAlign: 'center',
        letterSpacing: 8,
        marginBottom: 24,
        width: '100%',
        color: '#374151',
        fontWeight: 'bold',
        fontFamily: 'Inter_600SemiBold',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 12,
    },
    btnCancel: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnCancelText: {
        color: '#111827',
        fontWeight: '600',
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
    },
    btnSubmit: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#7C9A92',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnSubmitDisabled: {
        opacity: 0.7,
    },
    btnSubmitText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
    },
});

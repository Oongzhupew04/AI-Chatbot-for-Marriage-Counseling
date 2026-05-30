import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface DishonestyModalProps {
    onClose: () => void;
}

export default function DishonestyModal({ onClose }: DishonestyModalProps) {
    return (
        <Modal transparent={true} animationType="fade" visible={true} onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={() => {}}>
                    <View style={styles.iconCircle}>
                        <FontAwesome5 name="info" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.heading}>Notice</Text>
                    <Text style={styles.text}>
                        Please be honest with us after this as we detected some dishonesty in the relationship assessment for better experience.
                    </Text>
                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>I Understand</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
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
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#7C9A92',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    heading: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
        fontFamily: 'Inter_600SemiBold',
    },
    text: {
        fontSize: 15,
        color: '#6B7280',
        marginBottom: 28,
        lineHeight: 22,
        textAlign: 'center',
        fontFamily: 'Inter_400Regular',
    },
    button: {
        backgroundColor: '#7C9A92',
        paddingVertical: 14,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
        fontFamily: 'Inter_600SemiBold',
    },
});

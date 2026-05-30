import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DishonestyModalProps {
    onClose: () => void;
}

export default function DishonestyModal({ onClose }: DishonestyModalProps) {
    return (
        <Modal transparent={true} animationType="fade" visible={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalCard}>
                    <View style={styles.header}>
                        <Ionicons name="warning" size={24} color="#f59e0b" style={styles.icon} />
                        <Text style={styles.title}>Registration Successful</Text>
                    </View>
                    <Text style={styles.message}>
                        Thank you for registering. However, based on your responses, our system has identified potential inconsistencies or signs of dishonest answers in your relationship assessment.
                    </Text>
                    <Text style={styles.message}>
                        For AI-assisted counseling to be effective, honesty is crucial. We encourage you to reflect on your answers. You may proceed to login.
                    </Text>
                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>Acknowledge & Login</Text>
                    </TouchableOpacity>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    icon: {
        marginRight: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    message: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 16,
        lineHeight: 20,
    },
    button: {
        backgroundColor: '#000',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

import React from 'react';
import { Modal, View, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { styles } from './thankYouModal.styles';

interface ThankYouModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ThankYouModal({ isOpen, onClose }: ThankYouModalProps) {
    if (!isOpen) return null;

    return (
        <Modal transparent={true} animationType="fade" visible={isOpen} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>
                <View style={styles.container}>
                    <FontAwesome5 name="check-circle" solid size={48} color="#7C9A92" style={styles.icon} />
                    <Text style={styles.heading}>Session Ended</Text>
                    <Text style={styles.text}>Thank you for sharing with us today.</Text>
                </View>
            </View>
        </Modal>
    );
}

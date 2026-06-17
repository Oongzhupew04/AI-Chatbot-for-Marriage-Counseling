import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { getStyles } from './dishonestyModal.styles';
import { useTheme } from '../../context/ThemeContext';

interface DishonestyModalProps {
    onClose: () => void;
}

export default function DishonestyModal({ onClose }: DishonestyModalProps) {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    return (
        <Modal transparent={true} animationType="fade" visible={true} onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={() => {}}>
                    <View style={styles.iconCircle}>
                        <FontAwesome5 name="info" style={styles.iconInfo} />
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



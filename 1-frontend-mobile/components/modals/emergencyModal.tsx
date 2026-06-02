import React from 'react';
import { Modal, View, Text, TouchableOpacity, Linking, TouchableWithoutFeedback } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { getStyles } from './emergencyModal.styles';
import { useTheme } from '../../context/ThemeContext';

interface EmergencyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function EmergencyModal({ isOpen, onClose }: EmergencyModalProps) {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    if (!isOpen) return null;

    const handleCall = (number: string) => {
        Linking.openURL(`tel:${number}`);
    };

    return (
        <Modal transparent={true} animationType="fade" visible={isOpen} onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContainer}>
                            <View style={styles.iconCircle}>
                                <FontAwesome5 name="life-ring" size={60} color={theme.danger} />
                            </View>

                            <Text style={styles.heading}>You Are Not Alone</Text>
                            <Text style={styles.text}>
                                We noticed you might be going through a difficult time. Please reach out to a professional who can listen and help immediately.
                            </Text>

                            <View style={styles.contactsBox}>
                                <TouchableOpacity style={styles.contactRow} onPress={() => handleCall('0376272929')}>
                                    <FontAwesome5 name="phone-alt" size={20} color={theme.danger} style={styles.contactIcon} />
                                    <View style={styles.contactInfo}>
                                        <Text style={styles.contactName}>Befrienders KL (24/7)</Text>
                                        <Text style={styles.contactNumber}>03-7627 2929</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.contactRow} onPress={() => handleCall('15999')}>
                                    <FontAwesome5 name="phone-alt" size={20} color={theme.danger} style={styles.contactIcon} />
                                    <View style={styles.contactInfo}>
                                        <Text style={styles.contactName}>Talian Kasih (24/7)</Text>
                                        <Text style={styles.contactNumber}>15999</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.contactRow, styles.contactRowLast]} onPress={() => handleCall('15555')}>
                                    <FontAwesome5 name="phone-alt" size={20} color={theme.danger} style={styles.contactIcon} />
                                    <View style={styles.contactInfo}>
                                        <Text style={styles.contactName}>HEAL Line (Mental Health)</Text>
                                        <Text style={styles.contactNumber}>15555</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.button} onPress={onClose}>
                                <Text style={styles.buttonText}>I am safe now</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

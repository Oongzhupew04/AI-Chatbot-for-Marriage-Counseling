import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { API_BASE_URL } from '../../constants/Config';
import { getStyles } from './deleteAccountModal.styles';
import { useTheme } from '../../context/ThemeContext';

interface DeleteAccountModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function DeleteAccountModal({ visible, onClose, onSuccess }: DeleteAccountModalProps) {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');

    if (!visible) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        setError('');
        
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.delete(`${API_BASE_URL}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                onSuccess();
            } else {
                setError('Failed to delete account.');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'An error occurred.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.warningIconContainer}>
                        <FontAwesome5 name="exclamation-triangle" style={styles.iconWarning} />
                    </View>
                    
                    <Text style={styles.modalTitle}>Delete Account</Text>
                    
                    <Text style={styles.warningText}>
                        Are you sure you want to permanently delete your account? This action cannot be undone and all your data (chats, check-ins, profile) will be lost.
                    </Text>
                    
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    
                    <View style={styles.modalActions}>
                        <TouchableOpacity 
                            style={styles.btnCancel} 
                            onPress={onClose} 
                            disabled={isDeleting}
                        >
                            <Text style={styles.btnCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.btnDelete, isDeleting && styles.btnDeleteDisabled]} 
                            onPress={handleDelete} 
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.btnDeleteText}>Yes, Delete My Account</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

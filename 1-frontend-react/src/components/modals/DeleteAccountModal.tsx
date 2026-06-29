import React, { useState } from 'react';
import styles from './DeleteAccountModal.module.css';
import axios from 'axios';

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

export default function DeleteAccountModal({ onClose, onSuccess }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setIsDeleting(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete('/api/users/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
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
        <div className={styles['modal-overlay']}>
            <div className={styles['modal-content']}>
                <div className={styles['warning-icon']}>
                    <i className="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Delete Account</h3>
                <p className={styles['warning-text']}>
                    Are you sure you want to permanently delete your account? This action cannot be undone and all your data (chats, check-ins, profile) will be lost.
                </p>
                {error && <p className={styles['error-text']}>{error}</p>}
                
                <div className={styles['modal-actions']}>
                    <button className={styles['btn-cancel']} onClick={onClose} disabled={isDeleting}>Cancel</button>
                    <button className={styles['btn-delete']} onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
                    </button>
                </div>
            </div>
        </div>
    );
}

import React from 'react';
import styles from './ContactUserModal.module.css';

interface UserForEmail {
    username: string;
    email: string;
}

interface ContactUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserForEmail | null;
    emailMessage: string;
    setEmailMessage: (msg: string) => void;
    handleSendEmail: () => void;
    emailSending: boolean;
}

export default function ContactUserModal({
    isOpen,
    onClose,
    user,
    emailMessage,
    setEmailMessage,
    handleSendEmail,
    emailSending
}: ContactUserModalProps) {
    if (!isOpen || !user) return null;

    return (
        <div className={styles['modal-overlay']}>
            <div className={styles['modal-content']}>
                <div className={styles['modal-header']}>
                    <h2>Contact {user.username}</h2>
                    <button className={styles['close-btn']} onClick={onClose}>&times;</button>
                </div>
                <div className={styles['email-form']}>
                    <p className={styles['help-text']}>
                        This will send an email directly to <strong>{user.email}</strong>.
                    </p>
                    <textarea 
                        placeholder="Type your check-in message here..."
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                    />
                    <button 
                        className={styles['submit-btn']} 
                        onClick={handleSendEmail}
                        disabled={emailSending || !emailMessage.trim()}
                    >
                        {emailSending ? 'Sending...' : 'Send Email'}
                    </button>
                </div>
            </div>
        </div>
    );
}

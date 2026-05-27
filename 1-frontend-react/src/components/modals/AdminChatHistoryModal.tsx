import React from 'react';
import styles from './AdminChatHistoryModal.module.css';

export interface Message {
    sender: 'user' | 'bot';
    text: string;
}

interface AdminChatHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    chatHistory: Message[] | null;
}

export default function AdminChatHistoryModal({ isOpen, onClose, chatHistory }: AdminChatHistoryModalProps) {
    if (!isOpen) return null;

    return (
        <div className={styles['modal-overlay']}>
            <div className={styles['modal-content']}>
                <div className={styles['modal-header']}>
                    <h2>Conversation History</h2>
                    <button className={styles['close-btn']} onClick={onClose}>&times;</button>
                </div>
                <div className={styles['chat-history']}>
                    {chatHistory && chatHistory.length > 0 ? (
                        chatHistory.map((msg, idx) => (
                            <div key={idx} className={`${styles.message} ${msg.sender === 'user' ? styles.user : styles.bot}`}>
                                {msg.text}
                            </div>
                        ))
                    ) : (
                        <div>No messages found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

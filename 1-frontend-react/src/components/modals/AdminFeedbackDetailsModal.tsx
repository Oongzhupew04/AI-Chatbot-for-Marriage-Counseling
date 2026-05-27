import React from 'react';
import styles from './AdminFeedbackDetailsModal.module.css';

export interface Feedback {
    id: number;
    user_id: number;
    username: string;
    email: string;
    rating: number;
    worked_well: string;
    issues: string;
    comments: string;
    chat_id: number;
    timestamp: string;
}

interface AdminFeedbackDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    feedback: Feedback | null;
}

export default function AdminFeedbackDetailsModal({ isOpen, onClose, feedback }: AdminFeedbackDetailsModalProps) {
    if (!isOpen || !feedback) return null;

    return (
        <div className={styles['modal-overlay']}>
            <div className={styles['modal-content']}>
                <div className={styles['modal-header']}>
                    <h2>Feedback Details</h2>
                    <button className={styles['close-btn']} onClick={onClose}>&times;</button>
                </div>
                <div className={styles['modal-body']}>
                    <div><strong>User:</strong> {feedback.username} ({feedback.email})</div>
                    <div><strong>Chat ID:</strong> {feedback.chat_id || 'N/A'}</div>
                    <div>
                        <strong>Rating:</strong> {feedback.rating}/5
                        <i className="fas fa-star" style={{ color: '#ECC94B', marginLeft: '5px' }}></i>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '10px 0' }} />
                    <div>
                        <strong>What worked well:</strong>
                        <p style={{ margin: '5px 0 15px 0' }}>{feedback.worked_well || 'N/A'}</p>
                    </div>
                    <div>
                        <strong>Issues faced:</strong>
                        <p style={{ margin: '5px 0 15px 0' }}>{feedback.issues || 'N/A'}</p>
                    </div>
                    <div>
                        <strong>Additional comments:</strong>
                        <p style={{ margin: '5px 0 0 0' }}>{feedback.comments || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

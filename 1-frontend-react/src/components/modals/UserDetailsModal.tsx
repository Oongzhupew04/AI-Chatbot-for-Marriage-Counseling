import React from 'react';
import styles from './UserDetailsModal.module.css';

interface UserDetailsModalProps {
    isOpen: boolean;
    user: any;
    onClose: () => void;
    onAction: (actionType: 'freeze' | 'reset-password' | 'delete') => void;
    actionLoading: boolean;
}

export default function UserDetailsModal({ isOpen, user, onClose, onAction, actionLoading }: UserDetailsModalProps) {
    if (!isOpen || !user) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>User Management</h3>
                    <button onClick={onClose} className={styles.closeButton}>&times;</button>
                </div>
                
                <div className={styles.userInfo}>
                    <div className={styles.userHeader}>
                        {user.profile_pic ? (
                            <img src={user.profile_pic} alt={user.username} className={styles.userAvatar} />
                        ) : (
                            <div className={styles.userAvatar} style={{ background: '#B2F5EA', color: '#2C7A7B' }}>
                                <i className="fas fa-user"></i>
                            </div>
                        )}
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-main)' }}>{user.username}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email}</div>
                        </div>
                    </div>

                    <p>
                        <strong>Account Status</strong>
                        <span style={{ 
                            color: user.status === 'frozen' ? '#9B2C2C' : '#276749',
                            background: user.status === 'frozen' ? '#FED7D7' : '#C6F6D5',
                            padding: '4px 10px',
                            borderRadius: '15px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                        }}>
                            {user.status === 'frozen' ? 'Frozen' : 'Active'}
                        </span>
                    </p>
                    <p>
                        <strong>Total Sessions</strong>
                        <span style={{ fontWeight: 600 }}>{user.sessions_count}</span>
                    </p>
                    <p>
                        <strong>Registered</strong>
                        <span>{user.created_at !== 'N/A' && user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recent'}</span>
                    </p>
                </div>

                <div className={styles.actionsContainer}>
                    <button 
                        onClick={() => onAction('reset-password')}
                        disabled={actionLoading}
                        className={`${styles.actionBtn} ${styles.resetBtn}`}
                    >
                        <i className="fas fa-key"></i> Reset Password
                    </button>
                    <button 
                        onClick={() => onAction('freeze')}
                        disabled={actionLoading}
                        className={`${styles.actionBtn} ${styles.freezeBtn}`}
                    >
                        {user.status === 'frozen' ? (
                            <><i className="fas fa-unlock"></i> Unfreeze Account</>
                        ) : (
                            <><i className="fas fa-lock"></i> Freeze Account</>
                        )}
                    </button>
                    <button 
                        onClick={() => onAction('delete')}
                        disabled={actionLoading}
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    >
                        <i className="fas fa-trash-alt"></i> Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
}

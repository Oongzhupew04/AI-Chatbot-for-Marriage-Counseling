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
                            <div className={`${styles.userAvatar} ${styles.avatarPlaceholder}`}>
                                <i className="fas fa-user"></i>
                            </div>
                        )}
                        <div>
                            <div className={styles.username}>{user.username}</div>
                            <div className={styles.email}>{user.email}</div>
                        </div>
                    </div>

                    <p>
                        <strong>Account Status</strong>
                        <span className={`${styles.statusBadge} ${user.status === 'frozen' ? styles.statusFrozen : styles.statusActive}`}>
                            {user.status === 'frozen' ? 'Frozen' : 'Active'}
                        </span>
                    </p>
                    <p>
                        <strong>Total Sessions</strong>
                        <span className={styles.sessionCount}>{user.sessions_count}</span>
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

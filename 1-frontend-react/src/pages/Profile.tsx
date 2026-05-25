import React, { useState, useEffect } from 'react';
import styles from './Profile.module.css';

export default function Profile(): JSX.Element {
    const [userName, setUserName] = useState('User');
    const [userEmail, setUserEmail] = useState('user@example.com');
    
    // Simulate fetching user data from local storage or context
    useEffect(() => {
        // Normally you might fetch this from an API or use context
        const role = localStorage.getItem('userRole');
        if (role) {
            setUserName(role === 'admin' ? 'Admin User' : 'Valued User');
        }
    }, []);

    return (
        <main className={styles['main-content']}>
            <div className={styles['header']}>
                <div>
                    <h1>My Profile</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your personal information</p>
                </div>
            </div>

            <div className={styles['profile-container']}>
                <div className={styles['profile-header-card']}>
                    <div className={styles['avatar-container']}>
                        <i className="fas fa-user"></i>
                        <div className={styles['edit-avatar-btn']}>
                            <i className="fas fa-camera" style={{ fontSize: '1rem', color: 'white' }}></i>
                        </div>
                    </div>
                    
                    <div className={styles['profile-info']}>
                        <h2>{userName}</h2>
                        <p>{userEmail}</p>
                        <div className={styles['status-badge']}>
                            <i className="fas fa-check-circle"></i> Premium Member
                        </div>
                    </div>
                </div>

                <div className={styles['profile-details-card']}>
                    <div className={styles['card-title']}>
                        <i className="fas fa-address-card" style={{ color: '#F59E0B' }}></i> Personal Details
                        <button className={styles['edit-btn']} style={{ marginLeft: 'auto' }}>
                            <i className="fas fa-pen"></i> Edit
                        </button>
                    </div>

                    <div className={styles['details-grid']}>
                        <div className={styles['detail-item']}>
                            <div className={styles['detail-label']}>Full Name</div>
                            <div className={styles['detail-value']}>{userName}</div>
                        </div>
                        <div className={styles['detail-item']}>
                            <div className={styles['detail-label']}>Email Address</div>
                            <div className={styles['detail-value']}>{userEmail}</div>
                        </div>
                        <div className={styles['detail-item']}>
                            <div className={styles['detail-label']}>Phone Number</div>
                            <div className={styles['detail-value']}>Not provided</div>
                        </div>
                        <div className={styles['detail-item']}>
                            <div className={styles['detail-label']}>Timezone</div>
                            <div className={styles['detail-value']}>UTC+8</div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

import React, { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';

export default function Sidebar({ children }: { children: React.ReactNode }) {
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [initials, setInitials] = useState('');
    const navigate = useNavigate();

    const startNewChat = () => {
        // In React, you'd typically clear the local chat state or generate a new ID
        localStorage.removeItem('currentChatId');
        navigate('/');
        window.location.reload();
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('currentChatId');

        // 3. Clear Zustand's live memory just to be safe
        useChatStore.getState().clearSession();

        // 2. Redirect back to the login screen
        navigate('/login');
    };

    // 2. Use useEffect to load the data from localStorage when the sidebar mounts
    useEffect(() => {
        const storedName = localStorage.getItem('username');
        const storedEmail = localStorage.getItem('email');

        if (storedName) {
            setUserName(storedName);

            // Optional: Create dynamic avatar initials (e.g., "Vincent Oong" -> "VO")
            const derivedInitials = storedName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();
            setInitials(derivedInitials);
        }

        if (storedEmail) {
            setUserEmail(storedEmail);
        }
    }, []);

    return (
        <>
            <nav className={styles['sidebar-left']}>
                <div className={styles['homebrand']}>
                    <i className="fas fa-heart-pulse"></i>
                    <span>Counselor.AI</span>
                </div>

                <div className={styles['nav-menu']}>
                    <a href="#" className={`${styles['nav-item']} ${styles['active']}`} id="newChatBtn" onClick={startNewChat}>
                        <i className="fa-solid fa-house"></i> Home
                    </a>
                    <a href="#" className={styles['nav-item']} onClick={() => navigate('/analysis')}>
                        <i className="fas fa-chart-pie"></i> Analysis
                    </a>
                    <div className={styles['divider']}></div>
                    <a href="#" className={styles['nav-item']} onClick={() => navigate('/community')}>
                        <i className="fas fa-users"></i> Community <span className={styles['new-btn']}>NEW</span>
                    </a>
                    <a href="#" className={styles['nav-item']} onClick={() => navigate('/settings')}>
                        <i className="fas fa-cog"></i> Settings
                    </a>
                    <a href="#" className={styles['nav-item']} onClick={() => navigate('/help')}>
                        <i className="fas fa-question-circle"></i> Help
                    </a>
                    <div style={{ flex: 1 }}></div> <a href="#" className={styles['nav-item']} onClick={() => navigate('/profile')}>
                        <i className="fas fa-user-circle"></i> My Profile
                    </a>
                    <a href="#" className={styles['nav-item']} style={{ color: 'var(--accent-alert)' }} onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i> Log Out
                    </a>
                </div>

                <div className={styles['user-profile']}>
                    <div className={styles['avatar']}>{initials}</div>
                    <div className={styles['user-info']}>
                        <h4>{userName}</h4>
                        <p>{userEmail}</p>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <>
                {children}
            </>
        </>
    );
}
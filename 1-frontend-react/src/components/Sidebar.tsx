import React from 'react';
import styles from './Sidebar.module.css';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();

    const startNewChat = () => {
        // In React, you'd typically clear the local chat state or generate a new ID
        localStorage.removeItem('currentChatId');
        navigate('/');
        window.location.reload(); 
    };

    const handleLogout = () => {
        // 1. Destroy the token in the browser's memory
        localStorage.removeItem('token');
        
        // 2. Redirect back to the login screen
        navigate('/login');
    };

    return (
        <>
            <nav className={styles['sidebar-left']}>
                <div className={styles['homebrand']}>
                    <i className="fas fa-heart-pulse"></i>
                    <span>Counselor.AI</span>
                </div>

                <div className={styles['nav-menu']}>
                    <a href="#" className={`${styles['nav-item']} ${styles['active']}`} id="newChatBtn" onClick={startNewChat}>
                        <i className="fas fa-comment-dots"></i> New Chat
                    </a>
                    <a href="#" className={styles['nav-item']} onClick={() => navigate('/history')}>
                        <i className="fas fa-folder-open"></i> History
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
                    <div className={styles['avatar']}>VO</div>
                    <div className={styles['user-info']}>
                        <h4>Vincent Oong</h4>
                        <p>vincent@mmu.edu.my</p>
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
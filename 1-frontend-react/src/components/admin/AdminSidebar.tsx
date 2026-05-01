import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminSidebar.module.css';


export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    
    const handleLogout = () => {
        // 1. Destroy the token in the browser's memory
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        
        // 2. Redirect back to the login screen
        navigate('/login');
    };

    return (
        <>
            <nav className={styles['sidebar-left']}>
                <div className={styles['brand']}>
                    <i className="fas fa-heart-pulse"></i>
                    <span>Counselor.AI</span>
                </div>

                <ul className={styles['nav-menu']}>
                    <a href="#" className={`${styles['nav-item']} ${styles['active']}`}>
                        <i className="fas fa-th-large"></i> Dashboard
                    </a>
                    <a href="#" className={styles['nav-item']}>
                        <i className="fas fa-users-cog"></i> User Management
                    </a>
                    <a href="#" className={styles['nav-item']}>
                        <i className="fas fa-exclamation-triangle"></i> High-Risk Alerts
                        <span className={styles['nav-badge']}>3</span>
                    </a>
                    <a href="#" className={styles['nav-item']}>
                        <i className="fas fa-comment-alt"></i> User Feedback
                    </a>
                    <a href="#" className={styles['nav-item']}>
                        <i className="fas fa-sliders-h"></i> System Config
                    </a>
                    <div style={{ flex: 1 }}></div> <a href="#" className={styles['nav-item']}>
                        <i className="fas fa-user-circle"></i> My Profile
                    </a>
                    <a href="#" className={styles['nav-item']} style={{ color: 'var(--accent-alert)' }} onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i> Log Out
                    </a>
                </ul>

                <div className={styles['user-profile']}>
                    <div className={styles['avatar']}>AD</div>
                    <div style={{ fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: '600' }}>Admin User</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>System Administrator</div>
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
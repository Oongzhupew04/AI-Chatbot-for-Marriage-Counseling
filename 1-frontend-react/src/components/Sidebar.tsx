import React, { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import axios from 'axios';

export default function Sidebar({ children }: { children: React.ReactNode }) {
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [initials, setInitials] = useState('');
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

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

    // 2. Use useEffect to load the data from the database (or fallback to localStorage)
    useEffect(() => {
        const loadProfileData = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await axios.get('/api/users/profile', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (response.data.success) {
                        const { username, email, profile_pic } = response.data.profile;
                        
                        setUserName(username || '');
                        setUserEmail(email || '');
                        
                        if (profile_pic) {
                            setProfilePic(profile_pic);
                            localStorage.setItem('profilePic', profile_pic);
                        } else {
                            setProfilePic(null);
                            localStorage.removeItem('profilePic');
                        }
                        
                        if (username) localStorage.setItem('username', username);
                        if (email) localStorage.setItem('email', email);

                        const derivedInitials = (username || 'U')
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase();
                        setInitials(derivedInitials);
                        
                        return; // Successfully loaded from DB, skip local storage fallback
                    }
                } catch (error) {
                    console.error("Failed to fetch latest profile for sidebar:", error);
                }
            }

            // Fallback to local storage if API fails or no token
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

            const storedPic = localStorage.getItem('profilePic');
            if (storedPic) {
                setProfilePic(storedPic);
            } else {
                setProfilePic(null);
            }
        };

        loadProfileData();

        window.addEventListener('profileUpdated', loadProfileData);
        return () => window.removeEventListener('profileUpdated', loadProfileData);
    }, []);

    return (
        <>
            <nav className={styles['sidebar-left']}>
                <div className={styles['homebrand']}>
                    <i className="fas fa-heart-pulse"></i>
                    <span>Counselor.AI</span>
                </div>

                <div className={styles['nav-menu']}>
                    <a href="#" className={`${styles['nav-item']} ${location.pathname === '/' || location.pathname === '/home' ? styles['active'] : ''}`} id="newChatBtn" onClick={(e) => { e.preventDefault(); startNewChat(); }}>
                        <i className="fa-solid fa-house"></i> Home
                    </a>
                    <a href="#" className={`${styles['nav-item']} ${location.pathname === '/analysis' ? styles['active'] : ''}`} onClick={(e) => { e.preventDefault(); navigate('/analysis'); }}>
                        <i className="fas fa-chart-pie"></i> Analysis
                    </a>
                    <a href="#" className={`${styles['nav-item']} ${location.pathname === '/resources' ? styles['active'] : ''}`} onClick={(e) => { e.preventDefault(); navigate('/resources'); }}>
                        <i className="fas fa-book-open"></i> Resources
                    </a>
                    <div className={styles['divider']}></div>

                    <a href="#" className={`${styles['nav-item']} ${location.pathname === '/settings' ? styles['active'] : ''}`} onClick={(e) => { e.preventDefault(); navigate('/settings'); }}>
                        <i className="fas fa-cog"></i> Settings
                    </a>
                    <a href="#" className={`${styles['nav-item']} ${location.pathname === '/help' ? styles['active'] : ''}`} onClick={(e) => { e.preventDefault(); navigate('/help'); }}>
                        <i className="fas fa-question-circle"></i> Help
                    </a>
                    <div className={styles.flex1}></div> 
                    <a href="#" className={`${styles['nav-item']} ${location.pathname === '/profile' ? styles['active'] : ''}`} onClick={(e) => { e.preventDefault(); navigate('/profile'); }}>
                        <i className="fas fa-user-circle"></i> My Profile
                    </a>
                    <a href="#" className={`${styles['nav-item']} ${styles.textDanger}`} onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                        <i className="fas fa-sign-out-alt"></i> Log Out
                    </a>
                </div>

                <div className={styles['user-profile']}>
                    {profilePic ? (
                        <img src={profilePic} alt="Profile" className={`${styles['avatar']} ${styles.avatarCover}`} />
                    ) : (
                        <div className={styles['avatar']}>{initials}</div>
                    )}
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

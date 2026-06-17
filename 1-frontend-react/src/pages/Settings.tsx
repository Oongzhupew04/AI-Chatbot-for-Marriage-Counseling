import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Settings.module.css';
import ChangePasswordModal from '../components/modals/ChangePasswordModal';
import DeleteAccountModal from '../components/modals/DeleteAccountModal';
import { useNavigate } from 'react-router-dom';

const VAPID_PUBLIC_KEY = 'BE4if7ko6g7qeFCfwGAI3jSMZrqcGpiIP2T4NxAyAhMVyFK1VXuNe_YWy-5qcqoZBPRBtEY5Z66sscaIfyVkk-c';

// Utility to convert Base64 URL safe to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function Settings(): JSX.Element {
    const [notifications, setNotifications] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    // Password Modal State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    
    // Delete Account Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPreferences = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            const config = { headers: { Authorization: `Bearer ${token}` } };
            try {
                const response = await axios.get('http://localhost:3000/api/settings/preferences', config);
                
                if (response.data.success) {
                    const { push_notifications_enabled, dark_mode_enabled } = response.data;
                    
                    setNotifications(push_notifications_enabled);
                    localStorage.setItem('push_notifications_enabled', String(push_notifications_enabled));
                    
                    setDarkMode(dark_mode_enabled);
                    localStorage.setItem('dark_mode_enabled', String(dark_mode_enabled));
                    
                    if (dark_mode_enabled) {
                        document.documentElement.classList.add('dark-mode');
                    } else {
                        document.documentElement.classList.remove('dark-mode');
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user preferences:", error);
                
                // Fallback to local storage if API fails
                const storedPref = localStorage.getItem('push_notifications_enabled');
                if (storedPref === 'true') setNotifications(true);

                const storedDarkMode = localStorage.getItem('dark_mode_enabled');
                if (storedDarkMode === 'true') {
                    setDarkMode(true);
                    document.documentElement.classList.add('dark-mode');
                }
            }
        };

        fetchPreferences();
    }, []);

    const handleNotificationToggle = async () => {
        const newValue = !notifications;
        setNotifications(newValue);
        localStorage.setItem('push_notifications_enabled', String(newValue));

        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            // Tell backend about the preference change
            await axios.put('http://localhost:3000/api/settings/preferences', { pushEnabled: newValue }, config);

            if (newValue) {
                // Subscribe logic
                if ('serviceWorker' in navigator && 'PushManager' in window) {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        const registration = await navigator.serviceWorker.ready;
                        const subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                        });

                        // Save subscription to backend
                        await axios.post('http://localhost:3000/api/settings/push-subscription', subscription.toJSON(), config);
                    } else {
                        console.warn("Notification permission denied");
                        setNotifications(false);
                    }
                }
            } else {
                // Unsubscribe logic
                if ('serviceWorker' in navigator && 'PushManager' in window) {
                    const registration = await navigator.serviceWorker.ready;
                    const subscription = await registration.pushManager.getSubscription();
                    if (subscription) {
                        await subscription.unsubscribe();
                        await axios.delete('http://localhost:3000/api/settings/push-subscription', {
                            ...config,
                            data: { endpoint: subscription.endpoint } // Express needs data for DELETE body
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Failed to update push settings", error);
            // Revert state on failure
            setNotifications(!newValue);
        }
    };

    const handleDarkModeToggle = async () => {
        const newValue = !darkMode;
        setDarkMode(newValue);
        localStorage.setItem('dark_mode_enabled', String(newValue));

        if (newValue) {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }

        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            await axios.put('http://localhost:3000/api/settings/darkmode', { darkModeEnabled: newValue }, config);
        } catch (error) {
            console.error("Failed to update dark mode settings", error);
            // Revert state on failure
            setDarkMode(!newValue);
            localStorage.setItem('dark_mode_enabled', String(!newValue));
            if (!newValue) {
                document.documentElement.classList.add('dark-mode');
            } else {
                document.documentElement.classList.remove('dark-mode');
            }
        }
    };

    return (
        <main className={styles['main-content']}>
            <div className={styles['header']}>
                <div>
                    <h1>Settings</h1>
                    <p className={styles['text-muted']}>Manage your preferences and account settings</p>
                </div>
            </div>

            <div className={styles['settings-grid']}>
                <div className={styles['setting-card']}>
                    <div className={styles['card-title']}>
                        <i className={`fas fa-bell ${styles['icon-warning']}`}></i> Notifications
                    </div>

                    <div className={styles['setting-row']}>
                        <div className={styles['setting-info']}>
                            <h4>Push Notifications</h4>
                            <p>Receive alerts for upcoming check-ins</p>
                        </div>
                        <label className={styles['switch']}>
                            <input type="checkbox" checked={notifications} onChange={handleNotificationToggle} />
                            <span className={styles['slider']}></span>
                        </label>
                    </div>
                </div>

                <div className={styles['setting-card']}>
                    <div className={styles['card-title']}>
                        <i className={`fas fa-paint-brush ${styles['icon-primary']}`}></i> Appearance
                    </div>

                    <div className={styles['setting-row']}>
                        <div className={styles['setting-info']}>
                            <h4>Dark Mode</h4>
                            <p>Switch to a darker theme for night viewing</p>
                        </div>
                        <label className={styles['switch']}>
                            <input type="checkbox" checked={darkMode} onChange={handleDarkModeToggle} />
                            <span className={styles['slider']}></span>
                        </label>
                    </div>
                </div>

                <div className={styles['setting-card']}>
                    <div className={styles['card-title']}>
                        <i className={`fas fa-lock ${styles['icon-success']}`}></i> Privacy & Security
                    </div>

                    <div className={styles['setting-row']}>
                        <div className={styles['setting-info']}>
                            <h4>Change Password</h4>
                            <p>Update your account password</p>
                        </div>
                        <button className={styles['action-btn']} onClick={() => setIsPasswordModalOpen(true)}>Update</button>
                    </div>
                </div>

                <div className={`${styles['setting-card']} ${styles['card-danger']}`}>
                    <div className={`${styles['card-title']} ${styles['card-title-danger']}`}>
                        <i className="fas fa-exclamation-triangle"></i> Danger Zone
                    </div>

                    <div className={styles['setting-row']}>
                        <div className={styles['setting-info']}>
                            <h4 className={styles['text-danger']}>Delete Account</h4>
                            <p>Permanently remove your account and all associated data.</p>
                        </div>
                        <button className={styles['danger-btn']} onClick={() => setIsDeleteModalOpen(true)}>Delete Account</button>
                    </div>
                </div>
            </div>

            <ChangePasswordModal 
                isOpen={isPasswordModalOpen} 
                onClose={() => setIsPasswordModalOpen(false)} 
            />
            {isDeleteModalOpen && (
                <DeleteAccountModal 
                    onClose={() => setIsDeleteModalOpen(false)}
                    onSuccess={() => {
                        localStorage.clear();
                        window.location.href = '/login'; // Force full app reload to clear Zustand memory and ensure fresh state
                    }}
                />
            )}
        </main>
    );
}

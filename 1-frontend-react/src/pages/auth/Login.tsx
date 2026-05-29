import React, { useState } from 'react';
import styles from './Login.module.css';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [consent, setConsent] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Pointing to your new Node.js Gateway
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            // Added response.ok so fetch handles 400/500 level errors properly
            if (response.ok && data.token) {
                
                // 1. Save the token to browser memory
                localStorage.setItem('token', data.token);
                localStorage.setItem('userID', data.id);
                localStorage.setItem('username', data.username);
                localStorage.setItem('email', data.email);
                localStorage.removeItem('currentChatId');
                
                // 2. Extract and save the role (assuming your backend sends data.user.role)
                const userRole = data.role;
                if (userRole) {
                    localStorage.setItem('userRole', userRole);
                }

                // 3. The Traffic Controller: Redirect based on the role
                if (userRole && String(userRole).toLowerCase() === 'admin') {
                    navigate('/admin-home'); // Send admins here
                } else {
                    navigate('/'); // Send normal users here
                }
                
            } else {
                // If response is not ok (e.g., wrong password), show the error
                alert(data.error || "Login failed. Please check your credentials.");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("A network error occurred. Please try again later.");
        }
    };

    return (
        <div className={styles['body']}>
            <div className={styles['bg-blob']}></div>
            <div className={styles['login-card']}>
                <div className={styles.brand}>
                    <i className="fas fa-heart-pulse"></i>
                    <span>Counselor.AI</span>
                </div>
                <div className={styles.header}>
                    <h1>Welcome Back</h1>
                    <p>Please enter your details to sign in.</p>
                </div>
                <button className={styles['btn-google']}>
                    <i className="fa-brands fa-google"></i> Sign in with Google
                </button>
                <div className={styles.divider}><span>or sign in with email</span></div>

                <form onSubmit={handleLogin}>
                    <div className={styles['form-group']}>
                        <label htmlFor="email">Email Address</label>
                        <input type="email" id="email" className={styles['input-field']} placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className={styles['form-group']}>
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" className={styles['input-field']} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <div className={styles['disclaimer-box']}>
                        <input type="checkbox" id="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} required style={{ marginRight: '8px' }}/>
                        <label htmlFor="consent">
                            I understand this AI provides emotional support, not professional therapy. In emergencies, I will contact local authorities.
                        </label>
                    </div>
                    <button type="submit" className={styles['btn-submit']} style={{ backgroundColor: 'var(--primary-sage)', color: 'white', cursor: 'pointer' }}>Sign In</button>
                </form>
                <div className={styles['footer-links']}>
                    <p>Don't have an account? <Link to="/register">Create free account</Link></p>
                    <p style={{ marginTop: '8px' }}><Link to="/forgot-password" style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Forgot password?</Link></p>
                </div>
            </div>
        </div>
    );
}
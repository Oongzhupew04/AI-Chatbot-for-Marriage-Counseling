import React, { useState } from 'react';
import styles from './ResetPassword.module.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function ResetPassword() {
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    
    // Optional: get email from state if passed from ForgotPassword
    const email = location.state?.email || '';

    const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert("Password reset successfully. Please login with your new password.");
                navigate('/login');
            } else {
                alert(data.error || "Failed to reset password. Please check your OTP and try again.");
            }
        } catch (error) {
            console.error("Reset password error:", error);
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
                    <h1>Reset Password</h1>
                    <p>Enter the OTP sent to your email and your new password.</p>
                </div>
                <form onSubmit={handleResetPassword}>
                    {email && (
                        <div className={styles['form-group']}>
                            <label>Email Address</label>
                            <input 
                                type="email" 
                                className={`${styles['input-field']} ${styles['input-disabled']}`} 
                                value={email} 
                                disabled 
                            />
                        </div>
                    )}
                    <div className={styles['form-group']}>
                        <label htmlFor="otp">One-Time Password (OTP)</label>
                        <input 
                            type="text" 
                            id="otp" 
                            className={styles['input-field']} 
                            placeholder="Enter 6-digit OTP" 
                            value={otp} 
                            onChange={(e) => setOtp(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className={styles['form-group']}>
                        <label htmlFor="newPassword">New Password</label>
                        <input 
                            type="password" 
                            id="newPassword" 
                            className={styles['input-field']} 
                            placeholder="••••••••" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                            required 
                            minLength={8}
                        />
                    </div>
                    <div className={styles['form-group']}>
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input 
                            type="password" 
                            id="confirmPassword" 
                            className={styles['input-field']} 
                            placeholder="••••••••" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            required 
                            minLength={8}
                        />
                    </div>
                    <button type="submit" className={styles['btn-submit']}>Reset Password</button>
                </form>

                <div className={styles['footer-links']}>
                    <p>Remember your password? <Link to="/login">Back to Login</Link></p>
                </div>
            </div>
        </div>
    );
}

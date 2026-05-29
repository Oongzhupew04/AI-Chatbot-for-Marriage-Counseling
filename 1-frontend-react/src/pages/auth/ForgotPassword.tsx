import React, { useState } from 'react';
import styles from './ForgotPassword.module.css';
import { Link, useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleRequestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || `If an account exists, an OTP has been sent to ${email}`);
                navigate('/reset-password', { state: { email } });
            } else {
                alert(data.error || "Failed to request OTP. Please try again.");
            }
        } catch (error) {
            console.error("Forgot password error:", error);
            alert("A network error occurred. Please try again later.");
        } finally {
            setIsSubmitting(false);
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
                    <h1>Forgot Password</h1>
                    <p>Enter your email address to receive a one-time passcode (OTP).</p>
                </div>
                <form onSubmit={handleRequestOtp}>
                    <div className={styles['form-group']}>
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            className={styles['input-field']}
                            placeholder="example@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className={styles['btn-submit']} disabled={isSubmitting}>
                        {isSubmitting ? 'Sending...' : 'Send OTP'}
                    </button>
                </form>

                <div className={styles['footer-links']}>
                    <p>Remember your password? <Link to="/login">Back to Login</Link></p>
                </div>
            </div>
        </div>
    );
}

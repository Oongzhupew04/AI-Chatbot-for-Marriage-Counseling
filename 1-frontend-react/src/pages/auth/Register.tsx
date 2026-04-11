import React, { useState, useEffect } from 'react';
import styles from './Register.module.css';
import { Link } from 'react-router-dom';

export default function Register() {
    const [formData, setFormData] = useState({ username: '', email: '', password: '', confirm_password: '', privacy_policy: false, ai_consent: false });
    const [error, setError] = useState('');
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        validateForm();
    }, [formData]);

    const validateForm = () => {
        const { email, password, confirm_password, privacy_policy, ai_consent } = formData;
        let errorMessage = "";
        let valid = true;

        if (email && !email.includes('@')) { errorMessage = "Email Address must contain an '@' symbol."; valid = false; }
        else if (password.length > 0) {
            if (password.length < 8) { errorMessage = "Password must be at least 8 characters."; valid = false; }
            else if (!/[A-Z]/.test(password)) { errorMessage = "Password must contain an uppercase letter."; valid = false; }
            else if (!/[a-z]/.test(password)) { errorMessage = "Password must contain a lowercase letter."; valid = false; }
            else if (!/[0-9]/.test(password)) { errorMessage = "Password must contain a number."; valid = false; }
        } else { valid = false; }

        if (confirm_password.length > 0 && password !== confirm_password) {
            errorMessage = "Passwords do not match!";
            valid = false;
        }

        if (valid && password === confirm_password && (!privacy_policy || !ai_consent)) {
            errorMessage = "You must accept the terms and AI consent.";
            valid = false;
        }

        setError(errorMessage);
        setIsValid(valid && password === confirm_password && privacy_policy && ai_consent);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative', padding: '40px 20px' }}>
            <div className={styles['bg-blob']}></div>
            <div className={styles['register-card']}>
                <div className={styles.brand}><i className="fas fa-heart-pulse"></i><span>Counselor.AI</span></div>
                <div className={styles.header}>
                    <h1>Create your account</h1>
                    <p>Start your journey towards a healthier relationship.</p>
                </div>
                
                <form>
                    <div className={styles['form-group']}>
                        <label>Username / Full Name</label>
                        <input type="text" name="username" className={styles['input-field']} onChange={handleChange} required />
                    </div>
                    <div className={styles['form-group']}>
                        <label>Email Address</label>
                        <input type="email" name="email" className={styles['input-field']} onChange={handleChange} required />
                    </div>
                    <div className={styles['form-row']} style={{ display: 'flex', gap: '16px' }}>
                        <div className={styles['form-group']}>
                            <label>Password</label>
                            <input type="password" name="password" className={styles['input-field']} onChange={handleChange} required />
                        </div>
                        <div className={styles['form-group']}>
                            <label>Confirm</label>
                            <input type="password" name="confirm_password" className={styles['input-field']} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className={styles['checkbox-group']} style={{ display: 'flex', gap: '10px', textAlign: 'left', marginBottom: '10px' }}>
                        <input type="checkbox" name="privacy_policy" onChange={handleChange} required />
                        <label style={{ fontSize: '0.85rem' }}>I agree to the Privacy Policy.</label>
                    </div>
                    <div className={styles['checkbox-group']} style={{ display: 'flex', gap: '10px', textAlign: 'left' }}>
                        <input type="checkbox" name="ai_consent" onChange={handleChange} required />
                        <label style={{ fontSize: '0.85rem' }}>I consent to AI-assisted emotional support.</label>
                    </div>

                    <div className={styles['error-message']} style={{ color: '#ef4444', height: '20px', marginTop: '10px' }}>{error}</div>

                    <button type="submit" className={styles['btn-submit']} disabled={!isValid} style={{ backgroundColor: isValid ? '#000' : 'var(--primary-sage)', cursor: isValid ? 'pointer' : 'not-allowed' }}>
                        Create Account
                    </button>
                </form>
                <div className={styles['footer-links']}>
                    <p>Already have an account? <Link to="/login">Sign in</Link></p>
                </div>
            </div>
        </div>
    );
}
import React from 'react';
import styles from './RegistrationOtpModal.module.css';

interface RegistrationOtpModalProps {
    isOpen: boolean;
    email: string;
    otp: string;
    setOtp: (val: string) => void;
    otpError: string;
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: () => void;
}

export default function RegistrationOtpModal({
    isOpen,
    email,
    otp,
    setOtp,
    otpError,
    isSubmitting,
    onClose,
    onSubmit
}: RegistrationOtpModalProps) {
    if (!isOpen) return null;

    return (
        <div className={styles['modal-overlay']}>
            <div className={styles['modal-content']}>
                <h3>Verify Your Email</h3>
                <p className={styles['email-text']}>
                    We sent a 6-digit verification code to <strong>{email}</strong>.
                </p>
                {otpError && <p className={styles['error-text']}>{otpError}</p>}
                
                <input 
                    type="text" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    placeholder="123456"
                    className={styles['otp-input']}
                    maxLength={6}
                />
                
                <div className={styles['modal-actions']}>
                    <button 
                        type="button"
                        onClick={onClose}
                        className={styles['btn-cancel']}
                    >
                        Cancel
                    </button>
                    <button 
                        type="button"
                        onClick={onSubmit}
                        disabled={isSubmitting || otp.length < 6}
                        className={styles['btn-submit']}
                    >
                        {isSubmitting ? 'Verifying...' : 'Verify & Register'}
                    </button>
                </div>
            </div>
        </div>
    );
}

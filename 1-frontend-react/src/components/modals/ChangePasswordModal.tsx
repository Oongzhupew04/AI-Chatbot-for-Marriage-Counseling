import React, { useState } from 'react';
import axios from 'axios';
import styles from './ChangePasswordModal.module.css';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [otpSentMessage, setOtpSentMessage] = useState('');
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);

    if (!isOpen) return null;

    const resetForm = () => {
        setPasswordError('');
        setPasswordSuccess('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtp('');
        setOtpSentMessage('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSendOtp = async () => {
        setPasswordError('');
        setOtpSentMessage('');
        setIsSendingOtp(true);

        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            await axios.post('http://localhost:3000/api/settings/request-otp', {}, config);
            setOtpSentMessage('OTP has been sent to your email.');
        } catch (error: any) {
            setPasswordError(error.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters long.');
            return;
        }

        setIsSubmittingPassword(true);
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            await axios.put('http://localhost:3000/api/settings/change-password', {
                currentPassword,
                newPassword,
                otp
            }, config);
            setPasswordSuccess('Password changed successfully!');
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (error: any) {
            setPasswordError(error.response?.data?.message || 'Failed to change password. Please check your current password.');
        } finally {
            setIsSubmittingPassword(false);
        }
    };

    return (
        <div className={styles['modal-overlay']}>
            <div className={styles['modal-content']}>
                <h3>Change Password</h3>
                {passwordError && <p className={styles['error-text']}>{passwordError}</p>}
                {passwordSuccess && <p className={styles['success-text']}>{passwordSuccess}</p>}
                {otpSentMessage && <p className={styles['success-text']}>{otpSentMessage}</p>}
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className={styles['form-group']}>
                        <label>Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles['form-group']}>
                        <label>Verification Code (OTP)</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                style={{ flex: 1 }}
                                placeholder="6-digit code"
                            />
                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={isSendingOtp}
                                style={{
                                    padding: '0 15px',
                                    border: '1px solid var(--primary-sage, #10B981)',
                                    background: 'transparent',
                                    color: 'var(--primary-sage, #10B981)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                {isSendingOtp ? 'Sending...' : 'Send OTP'}
                            </button>
                        </div>
                    </div>
                    <div className={styles['form-group']}>
                        <label>New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles['form-group']}>
                        <label>Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles['modal-actions']}>
                        <button type="button" className={styles['btn-cancel']} onClick={handleClose}>Cancel</button>
                        <button type="submit" className={styles['btn-submit']} disabled={isSubmittingPassword}>
                            {isSubmittingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

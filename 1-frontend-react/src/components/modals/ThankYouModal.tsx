import React from 'react';
import styles from './ThankYouModal.module.css';

interface ThankYouModalProps {
    onClose: () => void;
}

export default function ThankYouModal({ onClose }: ThankYouModalProps) {
    return (
        <div className={styles['thank-you-overlay']} onClick={onClose}>
            <div 
                className={styles['thank-you-container']} 
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
            >
                <i className={`fas fa-check-circle ${styles['thank-you-icon']}`}></i>
                <h2 className={styles['thank-you-heading']}>Session Ended</h2>
                <p className={styles['thank-you-text']}>Thank you for sharing with us today.</p>
            </div>
        </div>
    );
}
import React from 'react';
import styles from './DishonestyModal.module.css';

interface DishonestyModalProps {
    onClose: () => void;
}

export default function DishonestyModal({ onClose }: DishonestyModalProps) {
    return (
        <div className={styles['dishonesty-overlay']} onClick={onClose}>
            <div 
                className={styles['dishonesty-container']} 
                onClick={(e) => e.stopPropagation()} 
            >
                <div className={styles['dishonesty-icon-container']}>
                    <i className="fas fa-info-circle"></i>
                </div>
                <h3 className={styles['dishonesty-heading']}>Notice</h3>
                <p className={styles['dishonesty-text']}>
                    Please be honest with us after this as we detected some dishonesty in the relationship assessment for better experience.
                </p>
                <button 
                    onClick={onClose} 
                    className={styles['dishonesty-button']}
                >
                    I Understand
                </button>
            </div>
        </div>
    );
}

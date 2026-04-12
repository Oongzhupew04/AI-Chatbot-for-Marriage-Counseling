import React from 'react';
import styles from './EmergencyModal.module.css';

export default function EmergencyModal({ onClose }: { onClose: () => void }) {
    return (
        <div className={styles['emergency-overlay']}>
            <div className={styles['emergency-container']}>
            
                <i className={`${styles['emergency-icon']} fas fa-life-ring`}></i>
                
                <h2 className={styles['emergency-heading']}>You Are Not Alone</h2>
                <p className={styles['emergency-text']}>
                    We noticed you might be going through a difficult time. Please reach out to a professional who can listen and help immediately.
                </p>

                <div className={styles['emergency-contacts-box']}>
                    <div className={styles['contact-row']}>
                        <i className={`${styles['contact-row-icon']} fas fa-phone-alt`}></i>
                        <div>
                            <strong className={styles['contact-name']}>Befrienders KL (24/7)</strong>
                            <a href="tel:0376272929" className={styles['contact-number']}>03-7627 2929</a>
                        </div>
                    </div>

                    <div className={styles['contact-row']}>
                        <i className={`${styles['contact-row-icon']} fas fa-phone-alt`}></i>
                        <div>
                            <strong className={styles['contact-name']}>Talian Kasih (24/7)</strong>
                            <a href="tel:15999" className={styles['contact-number']}>15999</a>
                        </div>
                    </div>

                    <div className={styles['contact-row']}>
                        <i className={`${styles['contact-row-icon']} fas fa-phone-alt`}></i>
                        <div>
                            <strong className={styles['contact-name']}>HEAL Line (Mental Health)</strong>
                            <a href="tel:15555" className={styles['contact-number']}>15555</a>
                        </div>
                    </div>
                </div>

                <button onClick={onClose} className={styles['btn-safe']}>
                    I am safe now
                </button>
            </div>
        </div>
    );
}
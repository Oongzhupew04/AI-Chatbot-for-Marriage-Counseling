import React from 'react';
import styles from './Help.module.css';

export default function Help(): JSX.Element {
    return (
        <main className={styles['main-content']}>
            <div className={styles['header']}>
                <div>
                    <h1>Help & Support</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Find answers and get in touch with our support team</p>
                </div>
            </div>

            <div className={styles['help-container']}>
                <div className={styles['help-card']}>
                    <div className={styles['card-title']}>
                        <i className="fas fa-question-circle" style={{ color: '#3B82F6' }}></i> Frequently Asked Questions
                    </div>
                    
                    <div className={styles['faq-list']}>
                        <div className={styles['faq-item']}>
                            <div className={styles['faq-question']}>How do I start a new session?</div>
                            <div className={styles['faq-answer']}>
                                You can start a new session by navigating to the Home page and typing in the chat box at the bottom. The AI will automatically begin responding.
                            </div>
                        </div>

                        <div className={styles['faq-item']}>
                            <div className={styles['faq-question']}>Is my data private?</div>
                            <div className={styles['faq-answer']}>
                                Yes. All your conversations and check-in data are securely stored and strictly private. We do not share your information with any third parties.
                            </div>
                        </div>

                        <div className={styles['faq-item']}>
                            <div className={styles['faq-question']}>How is my relationship risk calculated?</div>
                            <div className={styles['faq-answer']}>
                                Our AI model analyzes your daily check-ins, the severity of unmet needs based on Maslow's hierarchy, and long-term behavioral trends to provide a reliable risk baseline.
                            </div>
                        </div>
                        
                        <div className={styles['faq-item']}>
                            <div className={styles['faq-question']}>Can I export my chat history?</div>
                            <div className={styles['faq-answer']}>
                                Yes. You can navigate to Settings &gt; Privacy &amp; Security and click on the "Export" button to download a copy of your session data.
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles['help-card']}>
                    <div className={styles['contact-section']}>
                        <div className={styles['contact-info']}>
                            <h4>Need more help?</h4>
                            <p>Our support team is available 24/7 to assist you.</p>
                        </div>
                        <button className={styles['contact-btn']}>
                            <i className="fas fa-envelope"></i> Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import styles from './Help.module.css';

interface FaqItem {
    id: number;
    question: string;
    answer: string;
}

export default function Help(): JSX.Element {
    const [faqs, setFaqs] = useState<FaqItem[]>([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    const handleContactSupport = () => {
        // Opens Gmail compose window in a new tab
        const email = 'vincentoong12345@gmail.com';
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`, '_blank', 'noopener,noreferrer');
    };

    useEffect(() => {
        const fetchFaqs = async () => {
            setLoading(true);
            try {
                const response = await axios.get('/api/faq');
                if (response.data.success) {
                    setFaqs(response.data.faqs);
                }
            } catch (err) {
                console.error("Failed to fetch FAQs:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFaqs();
    }, [location.key]);
    return (
        <main className={styles['main-content']}>
            <div className={styles['header']}>
                <div>
                    <h1>Help & Support</h1>
                    <p className={styles['text-muted']}>Find answers and get in touch with our support team</p>
                </div>
            </div>

            <div className={styles['help-container']}>
                <div className={styles['help-card']}>
                    <div className={styles['card-title']}>
                        <i className={`fas fa-question-circle ${styles['text-blue']}`}></i> Frequently Asked Questions
                    </div>

                    <div className={styles['faq-list']}>
                        {loading ? (
                            <p className={styles['text-muted']}>Loading FAQs...</p>
                        ) : faqs.length > 0 ? (
                            faqs.map((faq) => (
                                <div key={faq.id} className={styles['faq-item']}>
                                    <div className={styles['faq-question']}>{faq.question}</div>
                                    <div className={styles['faq-answer']}>{faq.answer}</div>
                                </div>
                            ))
                        ) : (
                            <p className={styles['text-muted']}>No FAQs available at the moment.</p>
                        )}
                    </div>
                </div>

                <div className={styles['help-card']}>
                    <div className={styles['contact-section']}>
                        <div className={styles['contact-info']}>
                            <h4>Need more help?</h4>
                            <p>Our support team is available 24/7 to assist you.</p>
                        </div>
                        <button className={styles['contact-btn']} onClick={handleContactSupport}>
                            <i className="fas fa-envelope"></i> Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

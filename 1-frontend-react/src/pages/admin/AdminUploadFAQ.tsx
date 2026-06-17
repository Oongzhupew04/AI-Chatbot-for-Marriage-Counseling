import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import styles from './AdminUploadFAQ.module.css';

export default function AdminUploadFAQ() {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [faqs, setFaqs] = useState<any[]>([]);

    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3000/api/faq', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setFaqs(data.faqs || []);
            }
        } catch (error) {
            console.error("Failed to fetch FAQs:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!question.trim() || !answer.trim()) {
            alert("Please provide both a question and an answer.");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/admin/faqs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ question, answer })
            });

            const data = await response.json();

            if (response.ok) {
                alert("FAQ uploaded successfully!");
                setQuestion('');
                setAnswer('');
                fetchFaqs();
            } else {
                alert(data.error || "Failed to upload FAQ");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("A network error occurred while uploading.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className={styles['main-content']}>
            <div className={styles['dashboard-header']}>
                <h1>Upload FAQs</h1>
            </div>

            <div className={styles['stats-grid']}>
                <div className={styles['upload-card']}>
                    <div className={styles['card-header-row']}>
                        <span className={styles['card-title']}>Add a New FAQ</span>
                    </div>
                    <form className={styles['form-container']} onSubmit={handleSubmit}>
                        <div className={styles['form-group']}>
                            <label className={styles['form-label']}>Question</label>
                            <input
                                type="text"
                                className={styles['form-input']}
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Enter the frequently asked question"
                                required
                            />
                        </div>
                        <div className={styles['form-group']}>
                            <label className={styles['form-label']}>Answer</label>
                            <textarea
                                className={styles['form-textarea']}
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="Enter the detailed answer"
                                required
                            />
                        </div>
                        <div className={styles['form-actions']}>
                            <button type="submit" className={styles['submit-btn']} disabled={isSubmitting}>
                                {isSubmitting ? 'Uploading...' : 'Upload FAQ'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className={`${styles['card-header-row']} ${styles.headerSection}`}>
                <span className={styles['card-title']}>Saved FAQs</span>
            </div>

            <div className={styles['table-container']}>
                <table className={styles['data-table']}>
                    <thead>
                        <tr>
                            <th className={styles.colId}>ID</th>
                            <th className={styles.colQuestion}>Question</th>
                            <th className={styles.colAnswer}>Answer</th>
                        </tr>
                    </thead>
                    <tbody>
                        {faqs.map(faq => (
                            <tr key={faq.id}>
                                <td>{faq.id}</td>
                                <td><strong>{faq.question}</strong></td>
                                <td className={styles.preWrap}>{faq.answer}</td>
                            </tr>
                        ))}
                        {faqs.length === 0 && (
                            <tr>
                                <td colSpan={3} className={styles.emptyState}>No FAQs found in the database.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    );
}

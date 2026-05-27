import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './UserFeedback.module.css';
import AdminFeedbackDetailsModal, { Feedback } from '../../components/modals/AdminFeedbackDetailsModal';
import AdminChatHistoryModal, { Message } from '../../components/modals/AdminChatHistoryModal';

export default function UserFeedback() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Chat Modal states
    const [selectedChat, setSelectedChat] = useState<Message[] | null>(null);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                // Attempt to fetch from an endpoint (may not exist yet, fallback to mock data)
                const res = await axios.get('http://localhost:3000/api/admin/feedbacks', config);
                if (res.data.success) {
                    setFeedbacks(res.data.feedbacks);
                } else {
                    loadMockData();
                }
            } catch (error) {
                console.error("Failed to fetch feedbacks, loading mock data", error);
                loadMockData();
            } finally {
                setLoading(false);
            }
        };

        const loadMockData = () => {
            setFeedbacks([
                {
                    id: 1,
                    user_id: 101,
                    chat_id: 2001,
                    username: 'john_doe',
                    email: 'john@example.com',
                    rating: 5,
                    worked_well: 'The empathetic responses',
                    issues: 'None',
                    comments: 'This chatbot has really helped my marriage. Thank you!',
                    timestamp: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: 2,
                    user_id: 102,
                    chat_id: 2002,
                    username: 'jane_smith',
                    email: 'jane@example.com',
                    rating: 3,
                    worked_well: 'Quick replies',
                    issues: 'Advice was a bit generic',
                    comments: 'It is okay, but sometimes the advice is generic.',
                    timestamp: new Date(Date.now() - 172800000).toISOString()
                },
                {
                    id: 3,
                    user_id: 103,
                    chat_id: 2003,
                    username: 'mark_williams',
                    email: 'mark@example.com',
                    rating: 1,
                    worked_well: 'Nothing',
                    issues: 'Felt like talking to a wall',
                    comments: 'I did not find the sessions helpful at all. Need a real human.',
                    timestamp: new Date(Date.now() - 259200000).toISOString()
                }
            ]);
        };

        fetchFeedback();
    }, []);

    const viewConversation = async (chatId: number | null) => {
        if (!chatId) {
            alert("No conversation history linked to this feedback.");
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`http://localhost:3000/api/chats/${chatId}/messages`, config);
            setSelectedChat(res.data.messages || []);
            setIsChatModalOpen(true);
        } catch (error) {
            console.error("Failed to fetch conversation", error);
            alert("Could not load conversation history.");
        }
    };

    const getPillClass = (rating: number) => {
        if (rating >= 4) return styles['pill-positive'];
        if (rating === 3) return styles['pill-neutral'];
        return styles['pill-negative'];
    };

    const getRatingLabel = (rating: number) => {
        if (rating >= 4) return 'Positive';
        if (rating === 3) return 'Neutral';
        return 'Negative';
    };

    return (
        <main className={styles['main-content']}>
            <div className={styles['dashboard-header']}>
                <h1>User Feedback</h1>
            </div>

            {loading ? (
                <div>Loading feedback...</div>
            ) : (
                <div className={styles['table-container']}>
                    <table className={styles['data-table']}>
                        <thead>
                            <tr>
                                <th>Chat ID</th>
                                <th>User</th>
                                <th>Rating</th>
                                <th>Sentiment</th>
                                <th>Comments</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feedbacks.map(feedback => (
                                <tr key={feedback.id}>
                                    <td>
                                        <span 
                                            className={styles['clickable-text']}
                                            onClick={() => viewConversation(feedback.chat_id)}
                                            title="Click to view full conversation"
                                        >
                                            <i className="fas fa-comment-alt" style={{ fontSize: '0.8rem' }}></i>
                                            #{feedback.chat_id || 'N/A'}
                                        </span>
                                    </td>
                                    <td>
                                        <div>
                                            <strong>{feedback.username}</strong>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{feedback.email}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ fontWeight: 'bold' }}>{feedback.rating}/5</span>
                                            <i className="fas fa-star" style={{ color: '#ECC94B' }}></i>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles['status-pill']} ${getPillClass(feedback.rating)}`}>
                                            {getRatingLabel(feedback.rating)}
                                        </span>
                                    </td>
                                    <td style={{ maxWidth: '300px' }}>
                                        <div 
                                            className={styles['clickable-text']}
                                            style={{
                                                whiteSpace: 'nowrap',
                                                maxWidth: '100%',
                                                display: 'inline-flex'
                                            }} 
                                            title="Click to view full feedback details" 
                                            onClick={() => {
                                                setSelectedFeedback(feedback);
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            <i className="fas fa-external-link-alt" style={{ fontSize: '0.8rem', flexShrink: 0, marginTop: '3px' }}></i>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>"{feedback.comments}"</span>
                                        </div>
                                    </td>
                                    <td>{feedback.timestamp ? new Date(feedback.timestamp).toLocaleString() : 'N/A'}</td>
                                </tr>
                            ))}
                            {feedbacks.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No feedback found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <AdminFeedbackDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                feedback={selectedFeedback}
            />

            <AdminChatHistoryModal
                isOpen={isChatModalOpen}
                onClose={() => setIsChatModalOpen(false)}
                chatHistory={selectedChat}
            />
        </main>
    );
}

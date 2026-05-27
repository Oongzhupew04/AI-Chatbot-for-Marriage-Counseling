import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './HighRiskAlerts.module.css';

interface Incident {
    id: number;
    user_id: number;
    username: string;
    email: string;
    trigger_keyword: string;
    status: string;
    chat_id: number | null;
    timestamp: string;
}

interface Message {
    sender: 'user' | 'bot';
    text: string;
}

export default function HighRiskAlerts() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [selectedChat, setSelectedChat] = useState<Message[] | null>(null);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    
    const [selectedUserForEmail, setSelectedUserForEmail] = useState<Incident | null>(null);
    const [emailMessage, setEmailMessage] = useState('');
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailSending, setEmailSending] = useState(false);

    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get('http://localhost:3000/api/admin/incidents/all', config);
                if (res.data.success) {
                    setIncidents(res.data.incidents);
                }
            } catch (error) {
                console.error("Failed to fetch incidents", error);
            } finally {
                setLoading(false);
            }
        };

        fetchIncidents();
    }, []);

    const viewConversation = async (chatId: number | null) => {
        if (!chatId) {
            alert("No conversation history linked to this alert.");
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

    const openEmailModal = (incident: Incident) => {
        setSelectedUserForEmail(incident);
        setEmailMessage('');
        setIsEmailModalOpen(true);
    };

    const handleSendEmail = async () => {
        if (!selectedUserForEmail || !emailMessage.trim()) return;
        
        setEmailSending(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.post(`http://localhost:3000/api/admin/incidents/${selectedUserForEmail.id}/contact`, {
                user_id: selectedUserForEmail.user_id,
                message: emailMessage
            }, config);
            
            if (res.data.success) {
                alert("Email sent successfully!");
                setIsEmailModalOpen(false);
            }
        } catch (error: any) {
            console.error("Failed to send email", error);
            alert(error.response?.data?.error || "Failed to send email.");
        } finally {
            setEmailSending(false);
        }
    };

    const handleResolveIncident = async (incidentId: number) => {
        if (!window.confirm("Are you sure you want to mark this incident as resolved?")) return;
        
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.put(`http://localhost:3000/api/admin/incidents/${incidentId}/resolve`, {}, config);
            
            if (res.data.success) {
                alert("Incident marked as resolved!");
                setIncidents(incidents.map(inc => 
                    inc.id === incidentId ? { ...inc, status: 'Resolved' } : inc
                ));
            }
        } catch (error: any) {
            console.error("Failed to resolve incident", error);
            alert(error.response?.data?.error || "Failed to resolve incident.");
        }
    };

    return (
        <main className={styles['main-content']}>
            <div className={styles['dashboard-header']}>
                <h1>High-Risk Alerts</h1>
            </div>

            {loading ? (
                <div>Loading alerts...</div>
            ) : (
                <div className={styles['table-container']}>
                    <table className={styles['data-table']}>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Trigger Keyword</th>
                                <th>Timestamp</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {incidents.map(incident => (
                                <tr key={incident.id}>
                                    <td>
                                        <div>
                                            <strong>{incident.username}</strong>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{incident.email}</div>
                                        </div>
                                    </td>
                                    <td>"{incident.trigger_keyword}"</td>
                                    <td>{incident.timestamp ? new Date(incident.timestamp).toLocaleString() : 'N/A'}</td>
                                    <td>
                                        <span className={`${styles['status-pill']} ${incident.status === 'Pending Review' ? styles['pill-pending'] : styles['pill-resolved']}`}>
                                            {incident.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button className={styles['action-btn']} onClick={() => viewConversation(incident.chat_id)}>
                                            <i className="fas fa-comments"></i> View Chat
                                        </button>
                                        <button className={styles['action-btn']} onClick={() => openEmailModal(incident)}>
                                            <i className="fas fa-envelope"></i> Contact
                                        </button>
                                        {incident.status !== 'Resolved' && (
                                            <button className={styles['action-btn']} style={{ color: 'var(--success-color)' }} onClick={() => handleResolveIncident(incident.id)}>
                                                <i className="fas fa-check"></i> Resolve
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {incidents.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>No high-risk alerts found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Chat Modal */}
            {isChatModalOpen && (
                <div className={styles['modal-overlay']}>
                    <div className={styles['modal-content']}>
                        <div className={styles['modal-header']}>
                            <h2>Conversation History</h2>
                            <button className={styles['close-btn']} onClick={() => setIsChatModalOpen(false)}>&times;</button>
                        </div>
                        <div className={styles['chat-history']}>
                            {selectedChat && selectedChat.length > 0 ? (
                                selectedChat.map((msg, idx) => (
                                    <div key={idx} className={`${styles.message} ${msg.sender === 'user' ? styles.user : styles.bot}`}>
                                        {msg.text}
                                    </div>
                                ))
                            ) : (
                                <div>No messages found.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Email Modal */}
            {isEmailModalOpen && selectedUserForEmail && (
                <div className={styles['modal-overlay']}>
                    <div className={styles['modal-content']} style={{ height: 'auto', maxWidth: '500px' }}>
                        <div className={styles['modal-header']}>
                            <h2>Contact {selectedUserForEmail.username}</h2>
                            <button className={styles['close-btn']} onClick={() => setIsEmailModalOpen(false)}>&times;</button>
                        </div>
                        <div className={styles['email-form']}>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                This will send an email directly to <strong>{selectedUserForEmail.email}</strong>.
                            </p>
                            <textarea 
                                placeholder="Type your check-in message here..."
                                value={emailMessage}
                                onChange={(e) => setEmailMessage(e.target.value)}
                            />
                            <button 
                                className={styles['submit-btn']} 
                                onClick={handleSendEmail}
                                disabled={emailSending || !emailMessage.trim()}
                            >
                                {emailSending ? 'Sending...' : 'Send Email'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { useChatMutation } from '../hooks/useChat';
import CheckinModal from '../components/modals/CheckinModal';
import EmergencyModal from '../components/modals/EmergencyModal';
import ThankYouModal from '../components/modals/ThankYouModal';
import FeedbackModal from '../components/modals/FeedbackModal';
import styles from './Home.module.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';



export default function Home(): JSX.Element {
    const navigate = useNavigate();
    // State to track if the modal is open
    const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
    const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
    const [showEmergency, setShowEmergency] = useState(false);
    const [showThankYou, setShowThankYou] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]); // State to hold sidebar items
    const [input, setInput] = useState<string>('');

    // Get today's date string for check-in comparison
    const getTodayString = () => new Date().toDateString();
    
    // Zustand
    const { messages, chatId, addMessage, setChatId, setMessages, clearSession } = useChatStore();
    
    // React Query
    const chatMutation = useChatMutation();
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Functions to open and close
    const openCheckinModal = () => setIsCheckinModalOpen(true);
    const closeCheckinModal = () => setIsCheckinModalOpen(false);
    const openEmergencyModal = () => setShowEmergency(true);
    const closeEmergencyModal = () => setShowEmergency(false);
    const openThankYouModal = () => setShowThankYou(true);
    const closeThankYouModal = () => setShowThankYou(false);
    const openFeedbackModal = () => setShowFeedback(true);
    const closeFeedbackModal = () => setShowFeedback(false);

    // AUTO-TRIGGER CHECKIN MODAL: Runs exactly once when the page loads
    useEffect(() => {
        const today = getTodayString();
        const lastCheckIn = localStorage.getItem('lastCheckInDate');
        const hasSeenModal = sessionStorage.getItem('hasSeenCheckinModal');

        if (lastCheckIn === today) {
            // They already did it today
            setHasCheckedInToday(true);
        } else if (!hasSeenModal) {
            // They haven't completed it, AND we haven't shown it to them yet!
            setHasCheckedInToday(false);
            setIsCheckinModalOpen(true);

            // Instantly leave a note so we don't show it again if they switch tabs
            sessionStorage.setItem('hasSeenCheckinModal', 'true');
        }
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, chatMutation.isPending]);

    // 1. Fetch Sessions on Page Load
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:3000/api/chats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data && response.data.sessions) {
                    setSessions(response.data.sessions);
                } else {
                    console.error("Backend did not return sessions. It returned:", response.data);
                    setSessions([]); // Keep it as an empty array to prevent crashes!
                }
            } catch (err) {
                console.error("Failed to load sidebar sessions", err);
                setSessions([]);
            }
        };
        fetchSessions();
    }, []);

    useEffect(() => {
        // 1. Check if they left a chat open before refreshing
        const savedChatId = localStorage.getItem('currentChatId');
        
        if (savedChatId) {
            // 2. Convert it back to a number from a string
            const parsedId = parseInt(savedChatId, 10);
            
            // 3. Automatically trigger the load function!
            if (!isNaN(parsedId)) {
                handleLoadSession(parsedId);
            }
        }
    }, []);

    // 2. Function to handle clicking a past session
    const handleLoadSession = async (loadChatId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:3000/api/chats/${loadChatId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Set the active ID and overwrite the screen with the history!
            setChatId(loadChatId);
            setMessages(response.data.messages);
        } catch (err) {
            console.error("Failed to load chat history", err);
        }
    };

    const handleSendMessage = () => {
        const text = input.trim();
        if (!text) return;

        // Frontend Safety Override
        const unsafeWords = ["suicide", "killing", "die", "kill"];
        if (unsafeWords.some(word => text.toLowerCase().includes(word))) {
            setShowEmergency(true);
        }

        // 1. Update UI immediately (Optimistic update)
        addMessage({ sender: 'user', text });
        setInput('');

        // 2. Fire API call via React Query
        chatMutation.mutate(
            { message: text, chatId },
            {
                onSuccess: (data) => {
                    if (data.chatId && !chatId) {
                        setChatId(data.chatId);
                        setSessions(prevSessions => [
                            {
                                id: data.chatId,
                                title: text,
                                updated_at: new Date().toISOString()
                            },
                            ...prevSessions
                        ]);
                    }

                    addMessage({ 
                        sender: 'bot', 
                        text: data.response, 
                        action: data.action 
                    });
                },
                onError: (error) => {
                    console.error('Failed to send message:', error);
                    addMessage({ sender: 'bot', text: 'Sorry, I am having trouble connecting.' });
                }
            }
        );
    };

    const handleConfirmEnd = () => {
        // 1. Wipe the chat from the screen (this automatically removes the buttons!)
        clearSession(); 

        // 2. Show the "Thank You" Modal
        openThankYouModal();

        // 3. Wait 2 seconds, then Hide Thank You -> Show Feedback
        setTimeout(() => {
            closeThankYouModal();
            openFeedbackModal();
        }, 2000);
    };

    const handleCancelEnd = () => {
        // 1. Add the user's decision to the screen (this removes the buttons)
        addMessage({ sender: 'user', text: 'No, I want to continue.', action: 'none' });

        // 2. Instantly add the bot's response locally, just like your JS snippet
        addMessage({ sender: 'bot', text: 'Okay, we can continue chatting.', action: 'none' });
        
        // (Optional Pro-Tip: You could still fire chatMutation.mutate() here
        // if you want the Python backend to know the user decided to stay!)
    };

    const handleCheckinSuccess = () => {
        // Lock it in for the day
        localStorage.setItem('lastCheckInDate', getTodayString());
        setHasCheckedInToday(true);
        setIsCheckinModalOpen(false); 
    };

    const handleFeedbackSubmit = () => {
        
    };

    return (
        <>
            <main className={styles['main-content']}>
                <div style={{ position: 'absolute', top: '24px', left: '40px', fontWeight: 600, fontSize: '1.1rem' }}>AI Chat</div>
                <div style={{ position: 'absolute', top: '24px', right: '40px', display: 'flex', gap: '15px' }}>
                    <button className={styles['upgrade-pill']}>
                        <i className="fas fa-bolt"></i> Upgrade Plan
                    </button>
                    <i className="far fa-bell" style={{ fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer', alignSelf: 'center' }}></i>
                </div>

                {messages.length === 0 && (
                    <div id="welcome-section">
                        <div className={styles['welcome-header']}>
                            <h1>Welcome to Your Safe Space</h1>
                            <p>Start by checking in or discussing a specific issue. We are here to listen.</p>
                        </div>

                        <div className={styles['action-grid']}>
                            <div className={styles['action-card']} onClick={openCheckinModal}>
                                <div className={styles['card-content']}>
                                    <div className={`${styles['icon-box']} ${styles['icon-orange']}`}><i className="fas fa-clipboard-check"></i></div>
                                    <div className={styles['card-text']}>Daily Check-in</div>
                                </div>
                                <i className="fas fa-plus plus-icon"></i>
                            </div>

                            <div className={styles['action-card']}>
                                <div className={styles['card-content']}>
                                    <div className={`${styles['icon-box']} ${styles['icon-blue']}`}><i className="fas fa-comments"></i></div>
                                    <div className={styles['card-text']}>Start Session</div>
                                </div>
                                <i className="fas fa-plus plus-icon"></i>
                            </div>

                            <div className={styles['action-card']} data-url="{{ url_for('analysis') }}" onClick={() => navigate('/analysis')}>
                                <div className={styles['card-content']}>
                                    <div className={`${styles['icon-box']} ${styles['icon-green']}`}><i className="fas fa-chart-line"></i></div>
                                    <div className={styles['card-text']}>View Analysis</div>
                                </div>
                                <i className="fas fa-plus plus-icon"></i>
                            </div>

                            <div className={styles['action-card']} onClick={openEmergencyModal}>
                                <div className={styles['card-content']}>
                                    <div className={`${styles['icon-box']} ${styles['icon-red']}`}><i className="fas fa-phone-alt"></i></div>
                                    <div className={styles['card-text']}>Emergency Help</div>
                                </div>
                                <i className="fas fa-plus plus-icon"></i>
                            </div>
                        </div>
                    </div>
                )}

                {messages.length > 0 && (
                    <div id="chat-box" className={styles['chat-container']}>
                        {/* 1. Loop through all saved messages and draw them */}
                        {(messages || []).map((m, index) => {
                            // Check if this is the very last message in the array
                            const isLastMessage = index === messages.length - 1;

                            return (
                                <div key={index} className={`${styles['message-bubble']} ${styles[`${m.sender}-msg`]}`}>
                                    {/* Display the message text */}
                                    <div>{m.text}</div>

                                    {/* Conditionally render the Yes/No buttons ONLY on the last message */}
                                    {isLastMessage && m.action === "confirm_end" && (
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                            <button 
                                                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 'bold' }} 
                                                onClick={handleConfirmEnd}
                                            >
                                                Yes
                                            </button>
                                            <button 
                                                style={{ padding: '8px 23px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-dark)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }} 
                                                onClick={handleCancelEnd}
                                            >
                                                No
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* 2. Show the typing animation automatically while waiting for Python */}
                        {chatMutation.isPending && (
                            <div className={`${styles['message-bubble']} ${styles['bot-msg']} ${styles['typing-indicator']}`}>
                                <div className={styles['dot']}></div>
                                <div className={styles['dot']}></div>
                                <div className={styles['dot']}></div>
                            </div>
                        )}

                        {/* 3. The invisible anchor that auto-scrolls to the bottom */}
                        <div ref={chatEndRef} />
                    </div>
                )}

                <div className={styles['input-wrapper']}>
                    <textarea 
                        id="user-input" 
                        className={styles['chat-input']} 
                        placeholder="Tell me what's on your mind today..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault(); // Prevents adding a new line
                                handleSendMessage(); // Fires your send function
                            }
                        }}
                    ></textarea>
                    <div className={styles['input-footer']}>
                        <div className={styles['attachments']}>
                            <button className={styles['attach-btn']}><i className="fas fa-paperclip"></i> Attach</button>
                            <button className={styles['attach-btn']}><i className="fas fa-microphone"></i> Voice Message</button>
                        </div>
                        <button className={styles['send-btn']} onClick={handleSendMessage}>
                            <i className="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>

                <div className={styles['disclaimer']}>
                    Counselor.AI is an emotional support tool, not a licensed therapist. In emergencies, call 999.
                </div>
            </main>


            <aside className={styles['sidebar-right']}>
                <div className={styles['right-header']}>
                    <h3>Recent Sessions</h3>
                </div>

                <div className={styles['search-wrapper']}>
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="Search sessions..." />
                </div>

                <ul className={styles['history-list']}>
                    {/* Map over the database sessions! */}
                    {sessions && sessions.length > 0 ? (
                        sessions.map(session => (
                            <li 
                                key={session.id} 
                                className={styles['history-item']} 
                                onClick={() => handleLoadSession(session.id)}
                            >
                                <div className={styles['history-icon']}><i className="far fa-comment-alt"></i></div>
                                <div className={styles['history-info']}>
                                    {/* We use the first user message as the title. If empty, say "Empty Chat" */}
                                    <h4>{session.title ? session.title.substring(0, 20) + "..." : "New Chat"}</h4>
                                    <p>{new Date(session.updated_at).toLocaleDateString('en-GB')}</p>
                                </div>
                                <i
                                    className="fas fa-ellipsis-h"
                                    style={{ color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 'auto' }}
                                    onClick={(e) => e.stopPropagation()}
                                ></i>
                            </li>
                        ))
                    ) : (
                        // 3. Display the "Empty" state
                        <li className={styles['no-sessions']}>
                            <p>No session history found</p>
                        </li>
                    )}
                </ul>

                <div className={styles['right-header']} style={{ marginTop: '40px' }}>
                    <h3>Resources</h3>
                </div>

                <ul className={styles['history-list']}>
                    <li className={styles['history-item']}>
                        <div className={styles['history-icon']}><i className="fas fa-book-open"></i></div>
                        <div className={styles['history-info']}>
                            <h4>Love Languages</h4>
                            <p>Understanding the basics...</p>
                        </div>
                    </li>
                </ul>
            </aside>
            {showEmergency && <EmergencyModal onClose={closeEmergencyModal} />}
            {isCheckinModalOpen && (<CheckinModal onClose={closeCheckinModal} onSuccess={handleCheckinSuccess} />)}
            {showThankYou && <ThankYouModal onClose={closeThankYouModal} />}
            {showFeedback && <FeedbackModal onClose={closeFeedbackModal} onSubmit={handleFeedbackSubmit} />}
        </>
    );
}
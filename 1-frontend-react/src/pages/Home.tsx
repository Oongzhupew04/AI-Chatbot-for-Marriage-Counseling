import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { useChatMutation } from '../hooks/useChat';
import CheckinModal from '../components/modals/CheckinModal';
import EmergencyModal from '../components/modals/EmergencyModal';
import styles from './Home.module.css';
import { useNavigate } from 'react-router-dom';



export default function Home(): JSX.Element {
    const navigate = useNavigate();
    // State to track if the modal is open
    const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
    const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
    const [showEmergency, setShowEmergency] = useState(false);
    const [input, setInput] = useState<string>('');

    // Get today's date string for check-in comparison
    const getTodayString = () => new Date().toDateString();
    
    // Zustand
    const { messages, chatId, addMessage, setChatId } = useChatStore();
    
    // React Query
    const chatMutation = useChatMutation();
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Functions to open and close
    const openCheckinModal = () => setIsCheckinModalOpen(true);
    const closeCheckinModal = () => setIsCheckinModalOpen(false);
    const openEmergencyModal = () => setShowEmergency(true);
    const closeEmergencyModal = () => setShowEmergency(false);

    // Kicks user out of Home Page when token expired
    // useEffect(() => {
    //     const token = localStorage.getItem('token');
        
    //     if (token) {
    //         try {
    //             // A JWT is split into 3 parts by periods. We want the middle part (the data)
    //             const payload = JSON.parse(atob(token.split('.')[1]));
                
    //             // The 'exp' value is in seconds. Date.now() is in milliseconds.
    //             const isExpired = (payload.exp * 1000) < Date.now();
                
    //             if (isExpired) {
    //                 console.log("Token expired on load. Logging out.");
    //                 localStorage.removeItem('token');
    //                 navigate('/login');
    //             }
    //         } catch (e) {
    //             // If the token is mangled or unreadable, kick them out
    //             localStorage.removeItem('token');
    //             navigate('/login');
    //         }
    //     } else {
    //         // No token at all? Kick them out.
    //         navigate('/login');
    //     }
    // }, [navigate]);

    // AUTO-TRIGGER CHECKIN MODAL: Runs exactly once when the page loads
    useEffect(() => {
        const today = getTodayString();
        const lastCheckIn = localStorage.getItem('lastCheckInDate');

        if (lastCheckIn === today) {
            // They already did it today
            setHasCheckedInToday(true);
        } else {
            // It's a new day (or their first time ever)! 
            // Automatically pop open the modal
            setHasCheckedInToday(false);
            setIsCheckinModalOpen(true);
        }
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, chatMutation.isPending]);

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

    // THE SUBMIT ACTION: When they finish the form in the modal
    const handleCheckInSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // ... your backend fetch() code to save the check-in goes here ...

        // Lock it in for the day
        localStorage.setItem('lastCheckInDate', getTodayString());
        setHasCheckedInToday(true);
        setIsCheckinModalOpen(false); // Close the modal
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
                        {messages.map((m, index) => (
                            <div key={index} className={`${styles['message-bubble']} ${styles[`${m.sender}-msg`]}`}>
                                {m.text}
                            </div>
                        ))}

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
                    <i className="fas fa-ellipsis-h" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}></i>
                </div>

                <ul className={styles['history-list']}>
                    <li className={styles['history-item']}>
                        <div className={styles['history-icon']}><i className="far fa-comment-alt"></i></div>
                        <div className={styles['history-info']}>
                            <h4>Communication Issue</h4>
                            <p>Discussed feeling unheard...</p>
                        </div>
                    </li>
                    <li className={styles['history-item']}>
                        <div className={styles['history-icon']}><i className="far fa-comment-alt"></i></div>
                        <div className={styles['history-info']}>
                            <h4>Trust Building</h4>
                            <p>Reflecting on last week's...</p>
                        </div>
                    </li>
                    <li className={styles['history-item']}>
                        <div className={styles['history-icon']}><i className="far fa-file-alt"></i></div>
                        <div className={styles['history-info']}>
                            <h4>Weekly Report</h4>
                            <p>Analysis of emotional tre...</p>
                        </div>
                    </li>
                    <li className={styles['history-item']}>
                        <div className={styles['history-icon']}><i className="far fa-heart"></i></div>
                        <div className={styles['history-info']}>
                            <h4>Date Night Ideas</h4>
                            <p>List of activities for...</p>
                        </div>
                    </li>
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
            {isCheckinModalOpen && (<CheckinModal onClose={closeCheckinModal} />)}
        </>
    );
}
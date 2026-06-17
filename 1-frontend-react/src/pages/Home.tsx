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
    const [sessions, setSessions] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
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
        // If the user clicks anywhere on the document, close the dropdown
        const handleClickOutside = () => setOpenDropdownId(null);
        document.addEventListener('click', handleClickOutside);

        // Cleanup the event listener
        return () => document.removeEventListener('click', handleClickOutside);
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

    const handleDeleteSession = async (sessionIdToDelete: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevents triggering the `handleLoadSession` click event

        try {
            // 1. (Optional) Call your backend to delete it from the database
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3000/api/chats/${sessionIdToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 2. Remove it from the sidebar instantly
            setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionIdToDelete));

            // 3. If the user deleted the chat they are currently looking at, clear the screen
            if (chatId === sessionIdToDelete) {
                clearSession(); // Assuming you have this from your chatStore
            }

            // 4. Close the dropdown
            setOpenDropdownId(null);

        } catch (err) {
            console.error("Failed to delete session", err);
            alert("Failed to delete the session. Please try again.");
        }
    };

    const filteredSessions = sessions.filter(session => {
        const title = session.title || "New Chat";
        return title.toLowerCase().includes(searchQuery.toLowerCase());
    });

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
                    if (data.risk_level && data.risk_level >= 1) {
                        setShowEmergency(true);
                    }

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
                onError: (error: any) => {
                    console.error('Failed to send message:', error);
                    const errorMessage = error.response?.data?.error || 'Sorry, I am having trouble connecting.';
                    addMessage({ sender: 'bot', text: errorMessage });
                }
            }
        );
    };

    const finishSession = async () => {
        // 1. Log the end to the DB
        try {
            const token = localStorage.getItem('token');
            if (chatId) {
                await axios.post(`http://localhost:3000/api/chats/${chatId}/end`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Add it locally so UI updates instantly
                addMessage({ sender: 'bot', text: '[Session Ended]', action: 'session_ended' });
            }
        } catch (e) {
            console.error("Failed to end session in DB", e);
        }

        // Clear the session to return to new chat page
        clearSession();

        // 2. Show the "Thank You" Modal
        openThankYouModal();

        // 3. Wait 2 seconds, then Hide Thank You
        setTimeout(() => {
            closeThankYouModal();
        }, 2000);
    };

    const handleConfirmEnd = () => {
        // Show feedback modal FIRST, so we don't lose the chatId in Zustand!
        openFeedbackModal();
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

    const handleFeedbackSubmit = async (data: any) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:3000/api/feedback', {
                chatId,
                ...data
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Failed to submit feedback", err);
        } finally {
            closeFeedbackModal();
            await finishSession(); // Clear session and show Thank You ONLY AFTER feedback finishes
        }
    };

    const handleFeedbackCancel = async () => {
        closeFeedbackModal();
        await finishSession(); // Still clear session even if they skip feedback
    };

    const isSessionEnded = messages.length > 0 && messages[messages.length - 1].text === '[Session Ended]';

    return (
        <>
            <main className={styles['main-content']}>
                <div className={styles['ai-chat-title']}>AI Chat</div>


                {messages.length === 0 && (
                    <div id="welcome-section">
                        <div className={styles['welcome-header']}>
                            <h1>Welcome to Your Private<br />Relationship Conversation</h1>
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

                            <div className={styles['action-card']} onClick={() => navigate('/resources')}>
                                <div className={styles['card-content']}>
                                    <div className={`${styles['icon-box']} ${styles['icon-blue']}`}><i className="fas fa-book-open"></i></div>
                                    <div className={styles['card-text']}>Browse Resources</div>
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
                            if (m.text === '[Session Ended]') {
                                return (
                                    <div key={index} className={styles['session-ended-divider']}>
                                        <div className={styles['divider-line']}></div>
                                        <span className={styles['divider-text']}>Session Ended</span>
                                        <div className={styles['divider-line']}></div>
                                    </div>
                                );
                            }

                            // Check if this is the very last message in the array
                            const isLastMessage = index === messages.length - 1;

                            return (
                                <div key={index} className={`${styles['message-bubble']} ${styles[`${m.sender}-msg`]}`}>
                                    {/* Display the message text */}
                                    <div>{m.text}</div>

                                    {/* Conditionally render the Yes/No buttons ONLY on the last message */}
                                    {isLastMessage && m.action === "confirm_end" && (
                                        <div className={styles['confirmation-buttons']}>
                                            <button
                                                className={styles['btn-confirm-yes']}
                                                onClick={handleConfirmEnd}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                className={styles['btn-confirm-no']}
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

                <div className={`${styles['input-wrapper']} ${isSessionEnded ? styles['input-disabled'] : ''}`}>
                    <textarea
                        id="user-input"
                        className={styles['chat-input']}
                        placeholder={isSessionEnded ? "This session has ended. Navigate to Home to start a new session." : "Tell me what's on your mind today..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (isSessionEnded) return;
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault(); // Prevents adding a new line
                                handleSendMessage(); // Fires your send function
                            }
                        }}
                        disabled={isSessionEnded}
                    ></textarea>
                    <div className={styles['input-footer']}>
                        <div className={styles['attachments']}>
                        </div>
                        <button className={styles['send-btn']} onClick={handleSendMessage} disabled={isSessionEnded}>
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
                    <input
                        type="text"
                        placeholder="Search sessions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <ul className={styles['history-list']}>
                    {/* Use filteredSessions instead of sessions */}
                    {filteredSessions && filteredSessions.length > 0 ? (
                        filteredSessions.map(session => (
                            <li
                                key={session.id}
                                className={styles['history-item']}
                                onClick={() => handleLoadSession(session.id)}
                            >
                                <div className={styles['history-icon']}><i className="far fa-comment-alt"></i></div>
                                <div className={styles['history-info']}>
                                    <h4>{session.title ? session.title.substring(0, 20) + "..." : "New Chat"}</h4>
                                    <p>{new Date(session.updated_at).toLocaleDateString('en-GB')}</p>
                                </div>
                                {/* 🌟 NEW: The Relative Wrapper */}
                                <div className={styles['history-action-wrapper']}>

                                    {/* The Trigger Icon */}
                                    <i
                                        className={`fas fa-ellipsis-h ${styles['history-ellipsis']}`}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Stop row click
                                            setOpenDropdownId(openDropdownId === session.id ? null : session.id);
                                        }}
                                    ></i>

                                    {/* The Dropdown Menu */}
                                    {openDropdownId === session.id && (
                                        <div className={styles['dropdown-menu']} onClick={(e) => e.stopPropagation()}>
                                            <button
                                                className={styles['dropdown-item-danger']}
                                                onClick={(e) => handleDeleteSession(session.id, e)}
                                            >
                                                <i className="fas fa-trash"></i> Delete Session
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))
                    ) : (
                        <li className={styles['no-sessions']}>
                            {/* Show a different message if they searched for something that doesn't exist */}
                            <p>{searchQuery ? "No matching sessions found" : "No session history found"}</p>
                        </li>
                    )}
                </ul>

                <div className={styles['support-card']}>
                    <i className="fas fa-hand-holding-heart"></i>
                    <h4>You are not alone</h4>
                    <p>Remember that every step forward is progress. We're here for you.</p>
                </div>
            </aside>
            {showEmergency && <EmergencyModal onClose={closeEmergencyModal} />}
            {isCheckinModalOpen && (<CheckinModal onClose={closeCheckinModal} onSuccess={handleCheckinSuccess} />)}
            {showThankYou && <ThankYouModal onClose={closeThankYouModal} />}
            {showFeedback && <FeedbackModal onClose={handleFeedbackCancel} onSubmit={handleFeedbackSubmit} />}
        </>
    );
}
import React, { useState, useEffect } from 'react';
import styles from './CheckinModal.module.css';

interface CheckinModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const ROTATIONAL_QUESTIONS = [
    "Do you enjoy your spouse's company?",
    "Are you feeling happy in the relationship right now?",
    "Do you find your spouse attractive?",
    "Are you currently enjoying doing things together?",
    "Do you enjoy cuddling with your spouse?",
    "Do you feel you respect your spouse?",
    "Are you feeling proud of your spouse lately?",
    "Does your relationship have a romantic side right now?",
    "Do you feel a strong sense of love for your spouse today?"
];

export default function CheckinModal({ onClose, onSuccess }: CheckinModalProps) {
    // State for the Core Metric (1-7 Scale)
    const [satisfactionScore, setSatisfactionScore] = useState<number | null>(null);
    
    // State for the Rotational Question (-2 to +2 Scale)
    const [rotationalAnswer, setRotationalAnswer] = useState<number | null>(null);
    const [todayQuestion, setTodayQuestion] = useState("");

    // State for Maslow Needs Checkbox
    const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
    // State for the Journal Textarea
    const [journalText, setJournalText] = useState("");

    // Validation Logic
    const isStep1Filled = satisfactionScore !== null;
    const isStep2Filled = rotationalAnswer !== null;
    // Step 3 is filled if they selected at least one need AND typed something in the journal
    const isStep3Filled = selectedNeeds.length > 0;

    const isFormValid = isStep1Filled && isStep2Filled && isStep3Filled;

    // Set a random rotational question on component mount
    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * ROTATIONAL_QUESTIONS.length);
        setTodayQuestion(ROTATIONAL_QUESTIONS[randomIndex]);
    }, []);

    const handleNeedToggle = (need: string) => {
        setSelectedNeeds(prev => 
            prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
        );
    };

    const handleSubmit = async () => {
        // Here you would construct your payload to send to your Flask backend / Vector DB
        const payload = {
            coreMetric: satisfactionScore,
            rotational: {
                question: todayQuestion,
                score: rotationalAnswer
            },
            unmetNeeds: selectedNeeds,
            journalEntry: journalText,
            timestamp: new Date().toISOString()
        };

        try {
            // Retrieve the token saved during login
            const token = localStorage.getItem('token'); 

            const response = await fetch('http://localhost:3000/api/checkin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Passes the JWT to your middleware
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log("Check-in saved payload:", payload);
                alert("Check-in saved! Your analysis has been updated.");
                onSuccess();
            } else {
                const errorData = await response.json();
                alert(`Failed to save: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Error submitting check-in:", error);
            alert("A network error occurred. Please try again.");
        }
    };

    return (
        <div className={styles['modal-overlay']}>
            <div className={styles['modal-container']}>
                <div className={styles['modal-header']}>
                    <div className={styles['header-text']}>
                        <h2>Daily Check-In</h2>
                        <p>Track your relationship satisfaction and needs.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div className={styles['date-badge']}>
                            <i className="far fa-calendar-alt"></i> Today
                        </div>
                        <button className={styles['close-btn']} onClick={onClose}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div className={styles['modal-body']}>
                    
                    {/* STEP 1: CORE METRIC */}
                    <div className={styles['checkin-card']}>
                        <div className={styles['card-header']}>
                            <h3><span className={styles['step-num']}>1</span> Satisfaction</h3>
                            <span>Overall, how satisfied are you with your relationship today?</span>
                        </div>
                        
                        <div className={styles['num-option']}>
                            {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setSatisfactionScore(num)}
                                    className={`${styles['num-button']} ${satisfactionScore === num ? styles['selected'] : ''}`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#777' }}>
                            <span>Very Dissatisfied</span>
                            <span>Very Satisfied</span>
                        </div>
                    </div>

                    {/* STEP 2: ROTATIONAL QUESTION */}
                    <div className={`${styles['checkin-card']} ${styles['featured']}`}>
                        <div className={styles['badge-featured']}>Daily Focus</div>
                        <div className={styles['card-header']}>
                            <h3 style={{ color: 'var(--primary-sage)' }}><span className={styles['step-num']} style={{ background: 'var(--primary-sage)', color: 'white' }}>2</span> Reflection</h3>
                            <span>{todayQuestion}</span>
                        </div>

                        <ul className={styles['checklist']} style={{ marginTop: '15px' }}>
                            {[
                                { label: 'Yes', value: 2 },
                                { label: 'Rather yes', value: 1 },
                                { label: 'Neither yes nor no', value: 0 },
                                { label: 'Rather not', value: -1 },
                                { label: 'No', value: -2 }
                            ].map((option, idx) => (
                                <li key={idx} style={{ marginBottom: '8px', listStyle: 'none' }}>
                                    <input 
                                        type="radio" 
                                        name="rotational" 
                                        id={`rot_${option.value}`}
                                        checked={rotationalAnswer === option.value}
                                        onChange={() => setRotationalAnswer(option.value)}
                                        style={{ marginRight: '10px' }}
                                    />
                                    <label htmlFor={`rot_${option.value}`} style={{ cursor: 'pointer' }}>
                                        {option.label}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* STEP 3: MASLOW'S NEEDS & JOURNAL (Kept from your original design) */}
                    <div className={styles['checkin-card']}>
                        <div className={styles['card-header']}>
                            <h3><span className={styles['step-num']}>3</span> Context</h3>
                            <span>What is your primary unmet need today?</span>
                        </div>

                        <ul className={styles['checklist']} style={{ marginBottom: '20px' }}>
                            {['Love & Belonging', 'Esteem', 'Safety', 'Physiological'].map(need => (
                                <li key={need}>
                                    <input
                                        type="checkbox"
                                        id={need}
                                        checked={selectedNeeds.includes(need)}
                                        onChange={() => handleNeedToggle(need)}
                                    />
                                    <label htmlFor={need}><strong>{need}</strong></label>
                                </li>
                            ))}
                        </ul>

                        <textarea 
                            className={styles['notes-area']} 
                            placeholder="Add any additional context for the chatbot... (e.g., I felt really appreciated when you...)"
                            value={journalText}
                            onChange={(e) => setJournalText(e.target.value)}
                        ></textarea>
                    </div>

                </div>

                <div className={styles['modal-footer']}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className={styles['card-btn'] + ' ' + styles['btn-outline']} style={{ width: 'auto', margin: '0', padding: '10px 20px' }} onClick={onClose}>
                            Skip for now
                        </button>
                        <button 
                            className={styles['card-btn'] + ' ' + styles['btn-primary']}
                            style={{ width: 'auto', margin: '0', padding: '10px 24px', opacity: isFormValid ? 1 : 0.6 }} 
                            onClick={handleSubmit}
                            disabled={!isFormValid}
                        >
                            Save Entry
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
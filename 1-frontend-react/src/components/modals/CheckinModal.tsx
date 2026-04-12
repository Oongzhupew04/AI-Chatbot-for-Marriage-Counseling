import React, { useState } from 'react';
import styles from './CheckinModal.module.css';


export default function CheckinModal({ onClose }: { onClose: () => void }) {
    const [selectedEmoji, setSelectedEmoji] = useState('Neutral');

    const emojis = [
        { label: 'Stressed', icon: '😫' },
        { label: 'Sad', icon: '😢' },
        { label: 'Neutral', icon: '😐' },
        { label: 'Happy', icon: '🙂' },
        { label: 'Excited', icon: '😍' }
    ];

    const handleSubmit = () => {
        alert("Check-in saved!");
        onClose();
    };

    return (
        <div className={styles['modal-overlay']}>
            <div className={styles['modal-container']}>
                <div className={styles['modal-header']}>
                    <div className={styles['header-text']}>
                        <h2>Daily Check-In</h2>
                        <p>Reflect on your day to track your progress.</p>
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
                    
                    <div className={styles['checkin-card']}>
                        <div className={styles['card-header']}>
                            <h3><span className={styles['step-num']}>1</span> Emotions</h3>
                            <span>How are you feeling right now?</span>
                        </div>
                        
                        <div className={styles['emoji-grid']}>
                            <div className={styles['emoji-option']} title="Stressed">😫</div>
                            <div className={styles['emoji-option']} title="Sad">😢</div>
                            <div className={`${styles['emoji-option']} ${styles['selected']}`} title="Neutral">😐</div>
                            <div className={styles['emoji-option']} title="Happy">🙂</div>
                            <div className={styles['emoji-option']} title="Excited">😍</div>
                        </div>

                        <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px', display: 'block' }}>Energy Level:</span>
                            <div className={styles['checklist']}>
                                <li><input type="radio" name="energy" id="low" />
                                    <label htmlFor="low">Low Energy (Drained)</label>
                                </li>
                                <li><input type="radio" name="energy" id="med" checked />
                                    <label htmlFor="med">Balanced</label>
                                </li>
                                <li><input type="radio" name="energy" id="high" />
                                    <label htmlFor="high">High Energy</label>
                                </li>
                            </div>
                        </div>
                    </div>

                    <div className={`${styles['checkin-card']} ${styles['featured']}`}>
                        <div className={styles['badge-featured']}>Key Focus</div>
                        <div className={styles['card-header']}>
                            <h3 style={{ color: 'var(--primary-sage)' }}><span className={styles['step-num']} style={{ background: 'var(--primary-sage)', color: 'white' }}>2</span> Needs</h3>
                            <span>What is your primary unmet need today?</span>
                        </div>

                        <ul className={styles['checklist']}>
                            <li><input type="checkbox" id="n1" />
                                <label htmlFor="n1"><strong>Love & Belonging</strong> (Connection, Intimacy)</label>
                            </li>
                            <li><input type="checkbox" id="n2" checked />
                                <label htmlFor="n2"><strong>Esteem</strong> (Appreciation, Respect)</label>
                            </li>
                            <li><input type="checkbox" id="n3" />
                                <label htmlFor="n3"><strong>Safety</strong> (Stability, Reassurance)</label>
                            </li>
                            <li><input type="checkbox" id="n4" />
                                <label htmlFor="n4"><strong>Physiological</strong> (Rest, Help with chores)</label>
                            </li>
                        </ul>
                    </div>

                    <div className={styles['checkin-card']}>
                        <div className={styles['card-header']}>
                            <h3><span className={styles['step-num']}>3</span> Journal</h3>
                            <span>What's on your mind? (Encrypted)</span>
                        </div>

                        <textarea className={styles['notes-area']} placeholder="E.g., I felt really appreciated when you..."></textarea>
                        
                        <button className={styles['card-btn'] + ' ' + styles['btn-outline']}>
                            <i className="fas fa-microphone"></i> Record Voice Note
                        </button>
                    </div>

                </div>

                <div className={styles['modal-footer']}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className={styles['card-btn'] + ' ' + styles['btn-outline']} style={{ width: 'auto', margin: '0', padding: '10px 20px' }} onClick={onClose}>
                            Skip for now
                        </button>
                        <button className={styles['card-btn'] + ' ' + styles['btn-primary']} style={{ width: 'auto', margin: '0', padding: '10px 24px' }}>
                            Save Entry
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
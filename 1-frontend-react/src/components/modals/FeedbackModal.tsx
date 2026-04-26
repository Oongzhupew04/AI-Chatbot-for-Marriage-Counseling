import React from 'react';
import styles from './FeedbackModal.module.css';

interface FeedbackModalProps {
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

export default function FeedbackModal({ onClose, onSubmit }: FeedbackModalProps) {
    return (
        <div className={styles['modal-overlay']} onClick={onClose}>
            <div 
                className={styles['modal-container']} 
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles['modal-header']}>
                    <div className={styles['header-text']}>
                        <h2>Session Feedback</h2>
                        <p>Help us improve Counselor.AI for you.</p>
                    </div>
                    <button className={styles['close-btn']} onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className={styles['modal-body']}>
                    <div className={styles['feedback-card']}>
                        <div className={styles['card-header']} style={{ textAlign: 'center' }}>
                            <h3>How helpful was this session?</h3>
                            <span>Rate the advice and empathy provided.</span>
                        </div>
                        
                        <div className={styles['star-rating']}>
                            <input type="radio" id="star5" name="rating" value="5" className={styles['chip-input']} />
                            <label htmlFor="star5" title="Excellent"><i className="fas fa-star"></i></label>
                            
                            <input type="radio" id="star4" name="rating" value="4" className={styles['chip-input']} />
                            <label htmlFor="star4" title="Good"><i className="fas fa-star"></i></label>
                            
                            <input type="radio" id="star3" name="rating" value="3" className={styles['chip-input']} />
                            <label htmlFor="star3" title="Average"><i className="fas fa-star"></i></label>
                            
                            <input type="radio" id="star2" name="rating" value="2" className={styles['chip-input']} />
                            <label htmlFor="star2" title="Poor"><i className="fas fa-star"></i></label>
                            
                            <input type="radio" id="star1" name="rating" value="1" className={styles['chip-input']} />
                            <label htmlFor="star1" title="Very Bad"><i className="fas fa-star"></i></label>
                        </div>
                    </div>

                    <div className={styles['feedback-card']}>
                        <div className={styles['card-header']}>
                            <h3><span className={styles['step-num']}>2</span> What worked well?</h3>
                            <span>Select all that apply.</span>
                        </div>

                        <div className={styles['chip-group']}>
                            <input type="checkbox" id="good-empathy" className={styles['chip-input']} />
                            <label htmlFor="good-empathy" className={styles['chip-label']}>❤️ Felt Understood</label>
                            
                            <input type="checkbox" id="good-advice" className={styles['chip-input']} />
                            <label htmlFor="good-advice" className={styles['chip-label']}>💡 Actionable Advice</label>
                            
                            <input type="checkbox" id="good-tone" className={styles['chip-input']} />
                            <label htmlFor="good-tone" className={styles['chip-label']}>🗣️ Calming Tone</label>
                            
                            <input type="checkbox" id="good-privacy" className={styles['chip-input']} />
                            <label htmlFor="good-privacy" className={styles['chip-label']}>🔒 Felt Safe</label>
                        </div>
                    </div>

                    <div className={styles['feedback-card']}>
                        <div className={styles['card-header']}>
                            <h3><span className={styles['step-num']}>3</span> Any issues?</h3>
                            <span>Help us fix bugs in the AI logic.</span>
                        </div>

                        <div className={styles['chip-group']}>
                            <input type="checkbox" id="bad-robot" className={styles['chip-input']} />
                            <label htmlFor="bad-robot" className={styles['chip-label']}>🤖 Too Robotic</label>
                            
                            <input type="checkbox" id="bad-repeat" className={styles['chip-input']} />
                            <label htmlFor="bad-repeat" className={styles['chip-label']}>🔁 Repetitive</label>
                            
                            <input type="checkbox" id="bad-context" className={styles['chip-input']} />
                            <label htmlFor="bad-context" className={styles['chip-label']}>❓ Misunderstood Context</label>
                        </div>
                    </div>

                    <div className={styles['feedback-card']}>
                        <div className={styles['card-header']}>
                            <h3><span className={styles['step-num']}>4</span> Additional Comments</h3>
                            <span>Share specific details (Optional).</span>
                        </div>

                        <textarea className={styles['text-area']} placeholder="The AI was great, but it forgot that I mentioned..."></textarea>
                    </div>
                </div>

                <div className={styles['modal-footer']}>
                    <button className={styles['btn-outline']} onClick={onClose}>Cancel</button>
                    <button className={styles['btn-primary']} onClick={onSubmit}>Submit Feedback</button>
                </div>
            </div>
        </div>
    );
}
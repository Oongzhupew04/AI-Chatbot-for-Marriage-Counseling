import React from 'react';
import styles from './Analysis.module.css';

export default function Analysis(): JSX.Element {
    return (
        <main className={styles['main-content']}>
            <div className={styles['header']}>
                <div>
                    <h1>Relationship Health</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Weekly analysis based on 5 sessions</p>
                </div>
                <button className={styles['date-picker']}>
                    This Week <i className="fas fa-chevron-down" style={{ marginLeft: '8px' }}></i>
                </button>
            </div>

            <div className={styles['analysis-grid']}>

                <div className={`${styles['metric-card']} ${styles['card-main']}`}>
                    <div className={styles['card-title']}>
                        <div className={styles['icon-bg']} style={{ background: '#EBF3F1', color: 'var(--primary-sage)' }}>
                            <i className="fas fa-heart"></i>
                        </div>
                        <span className={`${styles['trend-badge']} ${styles['trend-up']}`}>
                            <i className="fas fa-arrow-up"></i> 5.77%
                        </span>
                    </div>
                    <div className={styles['card-label']}>Overall Connection Score</div>
                    <div className={styles['card-value']}>85/100</div>

                    <div className={styles['chart-container']}>
                        <div className={styles['chart-tooltip']}>Score: 88</div>
                        <div className={styles['tooltip-dot']}></div>

                        <svg width="100%" height="100%" viewBox="0 0 400 150" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="gradBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: 'rgb(91, 141, 239)', stopOpacity: 0.2 }} />
                                    <stop offset="100%" style={{ stopColor: 'rgb(91, 141, 239)', stopOpacity: 0 }} />
                                </linearGradient>
                            </defs>
                            <path d="M0,120 Q50,100 100,110 T200,90 T300,50 T400,30 V150 H0 Z" fill="url(#gradBlue)" />
                            <path d="M0,120 Q50,100 100,110 T200,90 T300,50 T400,30" fill="none" stroke="#5B8DEF" stroke-width="4" stroke-linecap="round" />
                        </svg>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                        </div>
                    </div>
                </div>

                <div className={`${styles['metric-card']} ${styles['card-comm']}`}>
                    <div className={styles['card-title']}>
                        <div className={styles['card-label']}>Communication Clarity</div>
                        <span className={`${styles['trend-badge']} ${styles['trend-up']}`}>+8%</span>
                    </div>
                    <div className={styles['card-value']}>High</div>

                    <div className={styles['chart-container']} style={{ height: '100px' }}>
                        <div className={styles['chart-tooltip']} style={{ left: '50%', top: '30%' }}>Good</div>
                        <div className={styles['tooltip-dot']} style={{ left: '50%', top: '30%', borderColor: 'var(--primary-sage)' }}></div>

                        <svg width="100%" height="100%" viewBox="0 0 200 80" preserveAspectRatio="none">
                            <path d="M0,50 Q40,20 80,40 T160,20 T200,30" fill="none" stroke="#7C9A92" stroke-width="3" stroke-linecap="round" />
                        </svg>
                    </div>
                </div>

                <div className={`${styles['metric-card']} ${styles['card-maslow']}`}>
                    <div className={styles['maslow-visual']}>
                        <div className={styles['maslow-level']} style={{ background: '#A0AEC0' }}>Self-Actualization</div>
                        <div className={styles['maslow-level']} style={{ background: '#A0AEC0' }}>Esteem</div>
                        <div className={`${styles['maslow-level']} ${styles['active']}`} style={{ background: 'var(--primary-sage)' }}>Love & Belonging</div>
                        <div className={`${styles['maslow-level']} ${styles['active']}`} style={{ background: '#5B8DEF' }}>Safety</div>
                        <div className={`${styles['maslow-level']} ${styles['active']}`} style={{ background: '#5B8DEF' }}>Physiological</div>
                    </div>
                    <div className={styles['maslow-text']}>
                        <h3 style={{ fontFamily: "'Merriweather', serif", fontSize: '1.1rem', marginBottom: '5px' }}>Needs Analysis</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current focus based on your chats.</p>

                        <div className={styles['insight-box']}>
                            <strong>Insight:</strong> You are effectively communicating safety needs, but expressing a desire for more quality time (Belonging).
                        </div>
                    </div>
                </div>

                <div className={`${styles['metric-card']} ${styles['card-conflict']}`}>
                    <div className={styles['card-title']}>
                        <div className={styles['card-label']}>Conflict Frequency</div>
                        <span className={`${styles['trend-badge']} ${styles['trend-down']}`}>4.93%</span> </div>
                    <div className={styles['card-value']}>Low</div>

                    <div className={styles['chart-container']} style={{ height: '100px' }}>
                        <div className={styles['chart-tooltip']} style={{ left: '80%', top: '70%', background: '#F2994A' }}>-2 Events</div>
                        <div className={styles['tooltip-dot']} style={{ left: '80%', top: '70%', borderColor: '#F2994A', boxShadow: '0 0 0 4px rgba(242, 153, 74, 0.2)' }}></div>

                        <svg width="100%" height="100%" viewBox="0 0 200 80" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="gradOrange" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: 'rgb(242, 153, 74)', stopOpacity: 0.2 }} />
                                    <stop offset="100%" style={{ stopColor: 'rgb(242, 153, 74)', stopOpacity: 0 }} />
                                </linearGradient>
                            </defs>
                            <path d="M0,40 L50,60 L100,20 L150,60 L200,80 V80 H0 Z" fill="url(#gradOrange)" />
                            <path d="M0,40 L50,60 L100,20 L150,60 L200,80" fill="none" stroke="#F2994A" stroke-width="3" />
                        </svg>
                        <div style={{ marginTop: '5px', color: 'var(--text-muted)', fontSize: '0.7rem', textAlign: 'center' }}>
                            Improved significantly since Monday
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
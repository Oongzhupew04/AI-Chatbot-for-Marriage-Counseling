import React from 'react';
import styles from './AdminHome.module.css';

export default function AdminHome() {
    return (
        <main className={styles['main-content']}>
            <div className={styles['dashboard-header']}>
                <h1>Analytics & Overview</h1>
                <div className={styles['header-actions']}>
                    <div className={styles['icon-btn']} title="Notifications">
                        <i className="far fa-bell"></i>
                        <div className={styles['badge']}></div>
                    </div>
                    <button style={{ background: 'var(--text-main)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: 600, cursor: 'pointer' }}>
                        <i className="fas fa-plus" style={{ marginRight: '8px' }}></i> Generate Report
                    </button>
                </div>
            </div>

            <div className={styles['stats-grid']}>
                
                <div className={`${styles['stat-card']} ${styles['card-alert']}`}>
                    <div className={styles['card-header-row']}>
                        <div className={styles['card-title']}>Active Risk Alerts</div>
                        <i className="fas fa-bell" style={{ color: 'var(--accent-alert)' }}></i>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Requires Review</div>
                    <div className={styles['alert-count']}>3</div>

                    <div className={styles['avatar-stack']}>
                        <div className={styles['mini-avatar']} style={{ background: '#FED7D7', color: '#C53030' }}>A</div>
                        <div className={styles['mini-avatar']} style={{ background: '#FED7D7', color: '#C53030' }}>B</div>
                        <div className={styles['mini-avatar']} style={{ background: '#FED7D7', color: '#C53030' }}>C</div>
                        <div className={styles['mini-avatar']} style={{ background: '#eee', color: '#666' }}>+25</div>
                    </div>
                </div>

                <div className={styles['stat-card']}>
                    <div className={styles['card-header-row']}>
                        <div className={styles['card-title']}>Total Sessions</div>
                        <i className="fas fa-chart-line" style={{ color: 'var(--primary-sage)' }}></i>
                    </div>
                    <div className={styles['alert-count']} style={{ color: 'var(--primary-dark)' }}>5,839</div>
                    <div style={{ fontSize: '0.8rem', color: '#38A169' }}>+11% last week</div>

                    <svg className={styles['chart-mock-line']} viewBox="0 0 100 30" preserveAspectRatio="none">
                        <path className={styles['svg-line']} d="M0,24 Q10,20 20,22 T40,15 T60,18 T80,12 T100,20"/>
                    </svg>
                </div>

                <div className={styles['stat-card']}>
                    <div className={styles['card-header-row']}>
                        <div className={styles['card-title']}>Avg. Feedback</div>
                        <div style={{ background: '#C6F6D5', color: '#276749', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>+8%</div>
                    </div>

                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>4.8/5</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Based on 120 ratings</div>

                    <div className={styles['chart-mock-bar']}>
                        <div className={styles['bar']} style={{ height: '30%' }}></div>
                        <div className={styles['bar']} style={{ height: '50%' }}></div>
                        <div className={styles['bar']} style={{ height: '40%' }}></div>
                        <div className={`${styles.bar} ${styles.active}`} style={{ height: '80%' }}></div>
                    </div>
                </div>

                <div className={`${styles['stat-card']} ${styles['card-config']}`}>
                    <div>
                        <div className={styles['card-title']} style={{ fontSize: '1.2rem', marginBottom: '5px' }}>System Status</div>
                        <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>DeepSeek API: Online</div>
                        <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Database: Healthy</div>
                    </div>
                    <button className={styles['config-btn']}>Manage Config</button>
                </div>
            </div>

            <div className={styles['section-header']}>
                <span>Recent High-Risk Incidents</span>
                <button className={styles['action-btn']}>View All</button>
            </div>

            <div className={styles['incident-list']}>
                <div className={styles['incident-item']}>
                    <div className={styles['incident-avatar']}><i className="fas fa-user-injured"></i></div>
                    <div className={styles['incident-info']}>
                        <h4>User: Anon_22</h4>
                        <p>Trigger: "Self-harm"</p>
                    </div>
                    <div className={`${styles['status-pill']} ${styles['pill-pending']}`}>Pending Review</div>
                </div>

                <div className={styles['incident-item']}>
                    <div className={styles['incident-avatar']}><i className="fas fa-exclamation-circle"></i></div>
                    <div className={styles['incident-info']}>
                        <h4>User: John Doe</h4>
                        <p>Trigger: "Violence"</p>
                    </div>
                    <div className={`${styles['status-pill']} ${styles['pill-resolved']}`}>Resolved</div>
                </div>

                <div className={styles['incident-item']}>
                    <div className={styles['incident-avatar']}><i className="fas fa-user-injured"></i></div>
                    <div className={styles['incident-info']}>
                        <h4>User: Sara K.</h4>
                        <p>Trigger: "Abuse"</p>
                    </div>
                    <div className={`${styles['status-pill']} ${styles['pill-pending']}`}>Pending Review</div>
                </div>
            </div>

            <div className={styles['section-header']}>
                <span>User Management</span>
                <div style={{ position: 'relative' }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: '10px', top: '8px', color: '#A0AEC0' }}></i>
                    <input type="text" placeholder="Search users..." style={{ padding: '8px 10px 8px 30px', border: '1px solid var(--border-light)', borderRadius: '8px', outline: 'none' }} />
                </div>
            </div>

            <div className={styles['table-container']}>
                <table className={styles['data-table']}>
                    <thead>
                        <tr>
                            <th style={{ width: '5%' }}><input type="checkbox" /></th>
                            <th style={{ width: '25%' }}>User Profile</th>
                            <th style={{ width: '15%' }}>Account Type</th>
                            <th style={{ width: '15%' }}>Status</th>
                            <th style={{ width: '20%' }}>Registration Date</th>
                            <th style={{ width: '10%' }}>Sessions</th>
                            <th style={{ width: '10%' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><input type="checkbox" /></td>
                            <td>
                                <div className={styles['user-cell']}>
                                    <div className={styles['user-img']}></div>
                                    <strong>Vincent Oong</strong>
                                </div>
                            </td>
                            <td>Couple</td>
                            <td><span className={`${styles['status-pill']} ${styles['pill-pending']}`} style={{ background: '#FEEBC8', color: '#9C4221' }}>Flagged</span></td>
                            <td>Feb 19th, 2026</td>
                            <td>12</td>
                            <td><button className={styles['action-btn']}>Details</button></td>
                        </tr>
                        <tr>
                            <td><input type="checkbox" /></td>
                            <td>
                                <div className={styles['user-cell']}>
                                    <div className={styles['user-img']} style={{ background: '#B2F5EA' }}></div>
                                    <strong>Adrian Daren</strong>
                                </div>
                            </td>
                            <td>Individual</td>
                            <td><span className={`${styles['status-pill']} ${styles['pill-resolved']}`} style={{ background: '#C6F6D5', color: '#22543D' }}>Active</span></td>
                            <td>Feb 18th, 2026</td>
                            <td>5</td>
                            <td><button className={styles['action-btn']}>Details</button></td>
                        </tr>
                        <tr>
                            <td><input type="checkbox" /></td>
                            <td>
                                <div className={styles['user-cell']}>
                                    <div className={styles['user-img']} style={{ background: '#FED7E2' }}></div>
                                    <strong>Roxanne Hills</strong>
                                </div>
                            </td>
                            <td>Couple</td>
                            <td><span className={`${styles['status-pill']} ${styles['pill-resolved']}`} style={{ background: '#C6F6D5', color: '#22543D' }}>Active</span></td>
                            <td>Apr 16th, 2026</td>
                            <td>24</td>
                            <td><button className={styles['action-btn']}>Details</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </main>
    );
}
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './AdminHome.module.css';
import UserDetailsModal from '../../components/modals/UserDetailsModal';

export default function AdminHome() {
    const [stats, setStats] = useState<any>(null);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                const [statsRes, incidentsRes, usersRes] = await Promise.all([
                    axios.get('http://localhost:3000/api/admin/stats', config),
                    axios.get('http://localhost:3000/api/admin/incidents', config),
                    axios.get('http://localhost:3000/api/admin/users', config)
                ]);

                if (statsRes.data.success) setStats(statsRes.data.stats);
                if (incidentsRes.data.success) setIncidents(incidentsRes.data.incidents);
                if (usersRes.data.success) setUsers(usersRes.data.users);
            } catch (error) {
                console.error("Failed to fetch admin data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, []);

    const filteredUsers = users.filter(u =>
        u.role !== 'admin' &&
        (u.username.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleAction = async (actionType: 'freeze' | 'reset-password' | 'delete') => {
        if (!selectedUser) return;

        const confirmMsg = actionType === 'delete'
            ? 'Are you sure you want to permanently delete this user?'
            : `Are you sure you want to ${actionType} this user?`;

        if (!window.confirm(confirmMsg)) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const userId = selectedUser.id;

            if (actionType === 'freeze') {
                const res = await axios.put(`http://localhost:3000/api/admin/users/${userId}/freeze`, {}, config);
                if (res.data.success) {
                    setUsers(users.map(u => u.id === userId ? { ...u, status: res.data.status } : u));
                    setSelectedUser({ ...selectedUser, status: res.data.status });
                    alert(`User status changed to ${res.data.status}`);
                }
            } else if (actionType === 'reset-password') {
                const res = await axios.post(`http://localhost:3000/api/admin/users/${userId}/reset-password`, {}, config);
                if (res.data.success) alert(res.data.message);
            } else if (actionType === 'delete') {
                const res = await axios.delete(`http://localhost:3000/api/admin/users/${userId}`, config);
                if (res.data.success) {
                    setUsers(users.filter(u => u.id !== userId));
                    setIsModalOpen(false);
                    alert("User deleted successfully.");
                }
            }
        } catch (error: any) {
            alert(error.response?.data?.error || "Action failed");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <main className={styles['main-content']}>
            <div className={styles['dashboard-header']}>
                <h1>Analytics & Overview</h1>
            </div>

            {loading ? (
                <div>Loading dashboard data...</div>
            ) : (
                <>
                    <div className={styles['stats-grid']}>

                        <div className={`${styles['stat-card']} ${styles['card-alert']}`}>
                            <div className={styles['card-header-row']}>
                                <div className={styles['card-title']}>Active Risk Alerts</div>
                                <i className={`fas fa-bell ${styles.iconAlert}`}></i>
                            </div>
                            <div className={styles.subText}>Requires Review</div>
                            <div className={styles['alert-count']}>{stats?.active_risk_alerts || 0}</div>

                            <div className={styles['avatar-stack']}>
                                {/* Using placeholder mini-avatars since we just have a count right now, or map from incidents */}
                                {incidents.slice(0, 3).map((incident, idx) => (
                                    <div key={idx} className={`${styles['mini-avatar']} ${styles.avatarDanger}`}>
                                        {incident.username ? incident.username[0].toUpperCase() : 'U'}
                                    </div>
                                ))}
                                {stats?.active_risk_alerts > 3 && (
                                    <div className={`${styles['mini-avatar']} ${styles.avatarMore}`}>+{stats.active_risk_alerts - 3}</div>
                                )}
                            </div>
                        </div>

                        <div className={styles['stat-card']}>
                            <div className={styles['card-header-row']}>
                                <div className={styles['card-title']}>Weekly Sessions</div>
                                <i className={`fas fa-chart-line ${styles.iconSage}`}></i>
                            </div>

                            {(() => {
                                const weeklyData = stats?.weekly_sessions || [];
                                const currentWeekSessions = weeklyData.length > 0 ? weeklyData[weeklyData.length - 1].count : 0;
                                const prevWeekSessions = weeklyData.length > 1 ? weeklyData[weeklyData.length - 2].count : 0;

                                let percentageChange = 0;
                                if (prevWeekSessions > 0) {
                                    percentageChange = ((currentWeekSessions - prevWeekSessions) / prevWeekSessions) * 100;
                                } else if (currentWeekSessions > 0) {
                                    percentageChange = 100;
                                }

                                const isIncrease = percentageChange >= 0;
                                const percentageColor = isIncrease ? '#38A169' : '#E53E3E';
                                const percentageText = `${isIncrease ? '+' : ''}${percentageChange.toFixed(1)}% from last week`;

                                return (
                                    <>
                                        <div className={`${styles['alert-count']} ${styles.textPrimaryDark}`}>
                                            {currentWeekSessions.toLocaleString()}
                                        </div>
                                        <div className={isIncrease ? styles.textSuccess : styles.textDanger}>
                                            {percentageText}
                                        </div>
                                    </>
                                );
                            })()}

                            <svg className={styles['chart-mock-line']} viewBox="0 0 100 30" preserveAspectRatio="none">
                                {(() => {
                                    if (!stats?.weekly_sessions || stats.weekly_sessions.length < 2) {
                                        return <path className={styles['svg-line']} d="M0,24 Q10,20 20,22 T40,15 T60,18 T80,12 T100,20" />;
                                    }

                                    const data = stats.weekly_sessions.map((w: any) => w.count);
                                    const max = Math.max(...data) || 1;

                                    // Add 2px padding on all sides so the stroke doesn't get clipped by the viewBox (0 0 100 30)
                                    const height = 26;
                                    const width = 96;

                                    let pathD = "";
                                    for (let i = 0; i < data.length; i++) {
                                        const x = (i / (data.length - 1)) * width + 2;
                                        const y = height - (data[i] / max) * height + 2;

                                        if (i === 0) {
                                            pathD += `M${x},${y}`;
                                        } else {
                                            const prevX = ((i - 1) / (data.length - 1)) * width + 2;
                                            const prevY = height - (data[i - 1] / max) * height + 2;
                                            const cpX = prevX + (x - prevX) / 2;
                                            pathD += ` C ${cpX},${prevY} ${cpX},${y} ${x},${y}`;
                                        }
                                    }

                                    return <path className={styles['svg-line']} d={pathD} fill="none" strokeWidth="2" />;
                                })()}
                            </svg>
                        </div>

                        <div className={styles['stat-card']}>
                            <div className={styles['card-header-row']}>
                                <div className={styles['card-title']}>Avg. Feedback</div>
                                <div className={styles.badgeActive}>Active</div>
                            </div>

                            <div className={styles.bigNumber}>{stats?.avg_feedback || '0.0'}/5</div>
                            <div className={styles.mutedLabel}>Average Rating</div>

                            <div className={styles['chart-mock-bar']}>
                                {(() => {
                                    const dist = stats?.feedback_distribution || [0, 0, 0, 0, 0];
                                    const maxCount = Math.max(...dist) || 1;

                                    return dist.map((count: number, idx: number) => {
                                        // Minimum height of 10% so the bar is always slightly visible
                                        const heightPct = Math.max((count / maxCount) * 100, 10);
                                        const isActive = count === maxCount && count > 0;
                                        const starRating = idx + 1;

                                        const roundedHeight = Math.round(heightPct / 10) * 10;
                                        return (
                                            <div
                                                key={idx}
                                                className={`${styles.bar} ${isActive ? styles.active : ''} ${styles[`h${roundedHeight}`]}`}
                                                title={`${starRating} Star: ${count} ratings`}
                                            ></div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        <div className={styles['stat-card']}>
                            <div className={styles['card-header-row']}>
                                <div className={styles['card-title']}>Total Users</div>
                                <i className={`fas fa-users ${styles.iconSage}`}></i>
                            </div>
                            <div className={`${styles['alert-count']} ${styles.textPrimaryDark}`}>
                                {stats?.total_users?.toLocaleString() || 0}
                            </div>
                            <div className={styles.mutedLabel}>Registered Accounts</div>
                        </div>
                    </div>

                    <div className={styles['section-header']}>
                        <span>Recent High-Risk Incidents</span>
                    </div>

                    <div className={styles['incident-list']}>
                        {incidents.length > 0 ? incidents.slice(0, 3).map(incident => (
                            <div key={incident.id} className={styles['incident-item']}>
                                <div className={styles['incident-avatar']}><i className="fas fa-user-injured"></i></div>
                                <div className={styles['incident-info']}>
                                    <h4>User: {incident.username}</h4>
                                    <p>Trigger: "{incident.trigger_keyword}"</p>
                                </div>
                                <div className={`${styles['status-pill']} ${incident.status === 'Pending Review' ? styles['pill-pending'] : styles['pill-resolved']}`}>
                                    {incident.status}
                                </div>
                            </div>
                        )) : (
                            <div className={styles.emptyIncidents}>No recent high-risk incidents.</div>
                        )}
                    </div>

                    <div className={styles['section-header']}>
                        <span>User Management</span>
                        <div className={styles.searchWrapper}>
                            <i className={`fas fa-search ${styles.searchIcon}`}></i>
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                    </div>

                    <div className={styles['table-container']}>
                        <table className={styles['data-table']}>
                            <thead>
                                <tr>
                                    <th className={styles.colProfile}>User Profile</th>
                                    <th className={styles.colAccount}>Account Type</th>
                                    <th className={styles.colStatus}>Status</th>
                                    <th className={styles.colRegDate}>Registration Date</th>
                                    <th className={styles.colSessions}>Sessions</th>
                                    <th className={styles.colActions}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className={styles['user-cell']}>
                                                {user.profile_pic ? (
                                                    <img src={user.profile_pic} alt={user.username} className={`${styles['user-img']} ${styles.roundedCircle}`} />
                                                ) : (
                                                    <div className={`${styles['user-img']} ${styles.bgTeal}`}></div>
                                                )}
                                                <strong>{user.username}</strong>
                                            </div>
                                        </td>
                                        <td className={styles.textCapitalize}>{user.role}</td>
                                        <td>
                                            {user.status === 'frozen' ? (
                                                <span className={`${styles['status-pill']} ${styles['pill-pending']} ${styles.badgeFrozen}`}>Frozen</span>
                                            ) : (
                                                <span className={`${styles['status-pill']} ${styles['pill-resolved']} ${styles.badgeActiveUser}`}>Active</span>
                                            )}
                                        </td>
                                        <td>{user.created_at !== 'N/A' && user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recent'}</td>
                                        <td>{user.sessions_count}</td>
                                        <td>
                                            <button
                                                className={styles['action-btn']}
                                                onClick={() => { setSelectedUser(user); setIsModalOpen(true); }}
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className={styles.emptyState}>No users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <UserDetailsModal
                isOpen={isModalOpen}
                user={selectedUser}
                onClose={() => setIsModalOpen(false)}
                onAction={handleAction}
                actionLoading={actionLoading}
            />
        </main>
    );
}
import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Analysis.module.css';

interface CheckinData {
    day: string;
    coreMetric: number;
    unmetNeeds: string[];
    journalEntry: string;
    rotationalQuestion: string;
    rotationalScore: number;
}

interface BaselineData {
    maritalRiskPercentage: number;
    q13: number;
    q17: number;
    q19: number;
}

const isConcerning = (val: number) => val > 3;

const getRotationalLabel = (score: number) => {
    switch (score) {
        case 2: return "Yes";
        case 1: return "Rather yes";
        case 0: return "Neither yes nor no";
        case -1: return "Rather not";
        case -2: return "No";
        default: return "Unknown";
    }
};
export default function Analysis(): JSX.Element {
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
    const [checkinData, setCheckinData] = useState<CheckinData[]>([]);
    const [baselineData, setBaselineData] = useState<BaselineData | null>(null);
    useEffect(() => {
        const fetchAnalysisData = async () => {
            try {
                const token = localStorage.getItem('token');
                // This assumes your Node gateway has an /api/analysis endpoint implemented
                const response = await axios.get('http://localhost:3000/api/analysis', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setCheckinData(response.data.checkins || []);
                setBaselineData(response.data.baseline || null);

                // --- DEBUGGING ---
                // You can view this output in your Browser's Developer Tools (Press F12 -> Console tab)
                console.log("DEBUG: checkinData received from backend:", response.data.checkins);
                // -----------------
            } catch (err: any) {
                console.error("Failed to fetch analysis data", err);
            }
        };

        fetchAnalysisData();
    }, []);


    const renderBaselineSection = () => (
        <>
            {/* --- INITIAL BASELINE SECTION --- */}
            <div className={`${styles['header']} ${styles['baseline-header']}`}>
                <div>
                    <h2 className={styles['baseline-title']}>Initial Assessment Baseline</h2>
                    <p className={styles['baseline-desc']}>Risk analysis derived from your registration relationship assessment</p>
                </div>
            </div>

            <div className={styles['baseline-grid']}>
                {/* 5. OVERALL RISK PERCENTAGE */}
                <div className={`${styles['metric-card']}`} style={{ animationDelay: '0.5s' }}>
                    <div className={styles['card-title']}>
                        <div className={styles['card-label']}>Marital Risk Percentage</div>
                        <div className={styles['icon-bg']} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                    </div>

                    <div className={styles['risk-score-container']}>
                        <div
                            className={styles['risk-score-value']}
                            style={{ color: (100 - (baselineData?.maritalRiskPercentage || 0)) > 50 ? '#EF4444' : ((100 - (baselineData?.maritalRiskPercentage || 0)) > 30 ? '#F59E0B' : '#10B981') }}
                        >
                            {100 - (baselineData?.maritalRiskPercentage || 0)}%
                        </div>
                        <p className={styles['risk-score-desc']}>
                            Based on our AI model, this is your baseline risk probability for relationship dissatisfaction.
                        </p>
                    </div>

                    <div className={styles['progress-track']}>
                        <div
                            className={styles['progress-fill']}
                            style={{
                                width: `${100 - (baselineData?.maritalRiskPercentage || 0)}%`,
                                backgroundColor: (100 - (baselineData?.maritalRiskPercentage || 0)) > 50 ? '#EF4444' : ((100 - (baselineData?.maritalRiskPercentage || 0)) > 30 ? '#F59E0B' : '#10B981')
                            }}
                        ></div>
                    </div>
                </div>

                {/* 6. BASELINE CONCERNS (Q17, Q13, Q19) */}
                <div className={`${styles['metric-card']}`} style={{ animationDelay: '0.6s' }}>
                    <div className={styles['card-title']}>
                        <div className={styles['card-label']}>Core Vulnerabilities</div>
                        <div className={styles['icon-bg']} style={{ background: '#EBF3F1', color: 'var(--primary-sage)' }}>
                            <i className="fas fa-search-plus"></i>
                        </div>
                    </div>

                    <div className={styles['concerns-list']}>
                        {/* Q17 Self Actualization */}
                        <div className={`${styles['concern-row']} ${isConcerning(baselineData?.q17 || 0) ? styles['concern-row-concerning'] : styles['concern-row-healthy']}`}>
                            <div>
                                <div className={styles['concern-title']}>Self-Actualization</div>
                                <div className={styles['concern-subtitle']}>"Are you proud of your spouse?"</div>
                            </div>
                            {isConcerning(baselineData?.q17 || 0) ?
                                <span className={`${styles['concern-badge']} ${styles['badge-concerning']}`}><i className="fas fa-exclamation-circle"></i> Concerning</span> :
                                <span className={`${styles['concern-badge']} ${styles['badge-healthy']}`}><i className="fas fa-check-circle"></i> Healthy</span>}
                        </div>

                        {/* Q13 Esteem */}
                        <div className={`${styles['concern-row']} ${isConcerning(baselineData?.q13 || 0) ? styles['concern-row-concerning'] : styles['concern-row-healthy']}`}>
                            <div>
                                <div className={styles['concern-title']}>Esteem</div>
                                <div className={styles['concern-subtitle']}>"Do you find your spouse attractive?"</div>
                            </div>
                            {isConcerning(baselineData?.q13 || 0) ?
                                <span className={`${styles['concern-badge']} ${styles['badge-concerning']}`}><i className="fas fa-exclamation-circle"></i> Concerning</span> :
                                <span className={`${styles['concern-badge']} ${styles['badge-healthy']}`}><i className="fas fa-check-circle"></i> Healthy</span>}
                        </div>

                        {/* Q19 Love */}
                        <div className={`${styles['concern-row']} ${isConcerning(baselineData?.q19 || 0) ? styles['concern-row-concerning'] : styles['concern-row-healthy']}`}>
                            <div>
                                <div className={styles['concern-title']}>Love</div>
                                <div className={styles['concern-subtitle']}>"Do you love your spouse?"</div>
                            </div>
                            {isConcerning(baselineData?.q19 || 0) ?
                                <span className={`${styles['concern-badge']} ${styles['badge-concerning']}`}><i className="fas fa-exclamation-circle"></i> Concerning</span> :
                                <span className={`${styles['concern-badge']} ${styles['badge-healthy']}`}><i className="fas fa-check-circle"></i> Healthy</span>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );



    const latestCheckin = checkinData[checkinData.length - 1];

    // 1. Calculate Average Satisfaction (Scale 1-7, converted to percentage)
    const avgScore = useMemo(() => {
        if (checkinData.length === 0) return 0;
        const total = checkinData.reduce((acc, curr) => acc + curr.coreMetric, 0);
        return Math.round(((total / checkinData.length) / 7) * 100);
    }, [checkinData]);
    // 2. Aggregate Unmet Needs
    const needsCount = useMemo(() => {
        const counts: Record<string, number> = { 'Physiological': 0, 'Safety': 0, 'Love & Belonging': 0, 'Esteem': 0, 'Self-Actualization': 0 };
        checkinData.forEach(day => {
            day.unmetNeeds.forEach(need => {
                if (counts[need] !== undefined) counts[need]++;
            });
        });
        return counts;
    }, [checkinData]);
    const mostUnmetNeed = Object.keys(needsCount).reduce((a, b) => needsCount[a] > needsCount[b] ? a : b);

    // 3. Mathematical Behavioral Insights (No AI)
    const behavioralInsights = useMemo(() => {
        // Needs Impact Analysis
        const daysWithNeeds = checkinData.filter(d => d.unmetNeeds.length > 0);
        const daysWithoutNeeds = checkinData.filter(d => d.unmetNeeds.length === 0);
        const avgWith = daysWithNeeds.length ? (daysWithNeeds.reduce((a, b) => a + b.coreMetric, 0) / daysWithNeeds.length) : 0;
        const avgWithout = daysWithoutNeeds.length ? (daysWithoutNeeds.reduce((a, b) => a + b.coreMetric, 0) / daysWithoutNeeds.length) : 0;

        // Weekend vs Weekday Lift Analysis
        const isWeekend = (dateStr: string) => {
            const date = new Date(dateStr);
            return date.getDay() === 0 || date.getDay() === 6;
        };
        const weekends = checkinData.filter(d => isWeekend(d.day));
        const weekdays = checkinData.filter(d => !isWeekend(d.day));
        const avgWeekend = weekends.length ? (weekends.reduce((a, b) => a + b.coreMetric, 0) / weekends.length) : 0;
        const avgWeekday = weekdays.length ? (weekdays.reduce((a, b) => a + b.coreMetric, 0) / weekdays.length) : 0;

        // Day-to-day Stability/Volatility Analysis
        let maxChange = 0;
        for (let i = 1; i < checkinData.length; i++) {
            const diff = Math.abs(checkinData[i].coreMetric - checkinData[i - 1].coreMetric);
            if (diff > maxChange) maxChange = diff;
        }

        return {
            needsImpactWith: avgWith.toFixed(1),
            needsImpactWithout: avgWithout.toFixed(1),
            weekendLift: (avgWeekend - avgWeekday).toFixed(1),
            maxFluctuation: maxChange
        };
    }, [checkinData]);

    // 4. Trend Calculation
    const trend = useMemo(() => {
        if (checkinData.length < 2) return { value: 0, isUp: true };
        const first = checkinData[0].coreMetric;
        const last = checkinData[checkinData.length - 1].coreMetric;
        const diff = last - first;
        const percentage = Math.round((Math.abs(diff) / first) * 100);
        return { value: percentage, isUp: diff >= 0 };
    }, [checkinData]);

    if (checkinData.length < 7) {
        return (
            <main className={styles['main-content']}>
                <div className={styles['header']}>
                    <div>
                        <h1>Relationship Analysis</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Insights based on your last 7 daily check-ins</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '60px 20px', background: 'var(--bg-white)', borderRadius: '16px', border: '1px solid var(--border-light)', marginBottom: '50px' }}>
                    <div style={{ fontSize: '4rem', color: 'var(--primary-sage)', marginBottom: '20px' }}>
                        <i className="fas fa-chart-line"></i>
                    </div>
                    <h2 style={{ fontFamily: "'Merriweather', serif", fontSize: '2rem', marginBottom: '15px' }}>Not Enough Data Yet</h2>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '500px', lineHeight: '1.6' }}>
                        Our AI needs at least 7 days of daily check-ins to analyse your behavioral insights and trend analysis.
                        <br /><br />
                        You currently have <strong>{checkinData.length}</strong> check-in{checkinData.length !== 1 ? 's' : ''}. Keep going!
                    </p>
                </div>
                {renderBaselineSection()}
            </main>
        );
    }

    // SVG Path calculation for the 7-day line chart (Curved)
    const maxMetric = 7;
    const points = checkinData.map((d, i) => ({
        x: (i / (checkinData.length - 1)) * 400, // 400 is SVG width
        y: 150 - ((d.coreMetric / maxMetric) * 120) // 150 is SVG height, 120 is max height
    }));

    let lineD = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        // Create a smooth cubic bezier curve by placing control points halfway horizontally
        const cp1x = prev.x + (curr.x - prev.x) / 2;
        const cp2x = prev.x + (curr.x - prev.x) / 2;
        lineD += ` C ${cp1x},${prev.y} ${cp2x},${curr.y} ${curr.x},${curr.y}`;
    }
    const pathD = `${lineD} L 400,150 L 0,150 Z`;
    return (
        <main className={styles['main-content']}>
            <div className={styles['header']}>
                <div>
                    <h1>Relationship Analysis</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Insights based on your last 7 daily check-ins</p>
                </div>
            </div>
            <div className={styles['analysis-grid']}>
                {/* 1. SATISFACTION TREND */}
                <div className={`${styles['metric-card']} ${styles['card-main']}`}>
                    <div className={styles['card-title']}>
                        <div className={styles['icon-bg']} style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#EC4899' }}>
                            <i className="fas fa-heart"></i>
                        </div>
                        <span className={`${styles['trend-badge']} ${trend.isUp ? styles['trend-up'] : styles['trend-down']}`}>
                            <i className={`fas fa-arrow-${trend.isUp ? 'up' : 'down'}`}></i> {trend.isUp ? '+' : '-'}{trend.value}%
                        </span>
                    </div>
                    <div className={styles['card-label']}>Average Satisfaction Score</div>
                    <div className={styles['card-value']}>{avgScore}/100</div>
                    <div className={styles['chart-container']}>
                        {hoveredPoint !== null && (
                            <>
                                <div className={styles['chart-tooltip']} style={{
                                    left: `${(points[hoveredPoint].x / 400) * 100}%`,
                                    top: `calc(${(points[hoveredPoint].y / 150) * 100}% - 12px)`
                                }}>
                                    Score: {checkinData[hoveredPoint].coreMetric}/7
                                </div>
                                <div className={styles['tooltip-dot']} style={{
                                    left: `${(points[hoveredPoint].x / 400) * 100}%`,
                                    top: `${(points[hoveredPoint].y / 150) * 100}%`
                                }}></div>
                            </>
                        )}
                        <svg width="100%" height="100%" viewBox="0 0 400 150" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="gradBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: 'rgb(91, 141, 239)', stopOpacity: 0.3 }} />
                                    <stop offset="100%" style={{ stopColor: 'rgb(91, 141, 239)', stopOpacity: 0 }} />
                                </linearGradient>
                            </defs>
                            <path d={pathD} fill="url(#gradBlue)" />
                            <path d={lineD} fill="none" stroke="#5B8DEF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            {points.map((pt, i) => {
                                const halfSegment = 400 / ((points.length - 1) * 2);
                                const leftEdge = Math.max(0, pt.x - halfSegment);
                                const rightEdge = Math.min(400, pt.x + halfSegment);
                                return (
                                    <rect
                                        key={i}
                                        x={leftEdge}
                                        y={0}
                                        width={rightEdge - leftEdge}
                                        height={150}
                                        fill="transparent"
                                        style={{ cursor: 'pointer', outline: 'none' }}
                                        onMouseEnter={() => setHoveredPoint(i)}
                                        onMouseLeave={() => setHoveredPoint(null)}
                                    />
                                );
                            })}
                        </svg>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {checkinData.map((d, i) => {
                                const parts = d.day.split(' ');
                                return <span key={i}>{`${parts[0]} ${parts[1]}`}</span>;
                            })}
                        </div>
                    </div>
                </div>
                {/* 2. ROTATIONAL INSIGHTS */}
                <div className={`${styles['metric-card']} ${styles['card-comm']}`}>
                    <div className={styles['card-title']}>
                        <div className={styles['card-label']}>Recent Reflection</div>
                        <div className={styles['icon-bg']} style={{ background: '#EBF3F1', color: 'var(--primary-sage)' }}>
                            <i className="fa-solid fa-brain"></i>
                        </div>
                    </div>
                    <div className={styles['card-value']} style={{ fontSize: '1.2rem', margin: '15px 0' }}>
                        "{latestCheckin.rotationalQuestion}"
                    </div>

                    <div style={{ background: '#F8FAFC', padding: '15px', borderRadius: '12px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Latest Answer:</span>
                            <strong style={{ color: '#F2994A' }}>{getRotationalLabel(latestCheckin.rotationalScore)} ({latestCheckin.rotationalScore > 0 ? '+' : ''}{latestCheckin.rotationalScore})</strong>
                        </div>
                        <div style={{ width: '100%', background: 'var(--border-light)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${((latestCheckin.rotationalScore + 2) / 4) * 100}%`, background: '#F2994A', height: '100%', borderRadius: '4px' }}></div>
                        </div>
                    </div>
                </div>
                {/* 3. MASLOW NEEDS SYNTHESIS */}
                <div className={`${styles['metric-card']} ${styles['card-maslow']}`}>
                    <div className={styles['maslow-visual']}>
                        {['Self-Actualization', 'Esteem', 'Love & Belonging', 'Safety', 'Physiological'].map(need => {
                            const isMostUnmet = need === mostUnmetNeed && needsCount[need] > 0;
                            return (
                                <div
                                    key={need}
                                    className={`${styles['maslow-level']} ${isMostUnmet ? styles['active'] : ''}`}
                                    style={{
                                        background: isMostUnmet ? '#10B981' : '#A0AEC0',
                                        opacity: isMostUnmet ? 1 : 0.4
                                    }}
                                >
                                    {need}
                                </div>
                            );
                        })}
                    </div>
                    <div className={styles['maslow-text']}>
                        <h3 style={{ fontFamily: "'Merriweather', serif", fontSize: '1.6rem', marginBottom: '5px' }}>Unmet Needs Analysis</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Aggregated from your check-ins.</p>
                        <div className={styles['insight-box']} style={{ borderLeftColor: '#10B981', background: 'rgba(16, 185, 129, 0.15)' }}>
                            <strong style={{ color: '#059669' }}>Primary Focus: {mostUnmetNeed}</strong><br />
                            This need was flagged {needsCount[mostUnmetNeed]} times this week.
                        </div>
                    </div>
                </div>
                {/* 4. BEHAVIORAL PATTERNS */}
                <div className={`${styles['metric-card']} ${styles['card-conflict']}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div className={styles['card-title']}>
                        <div className={styles['card-label']}>Behavioral Patterns</div>
                        <div className={styles['icon-bg']} style={{ background: '#EBF3F1', color: 'var(--primary-sage)' }}>
                            <i className="fas fa-chart-pie"></i>
                        </div>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        {/* Insight 1: Needs Impact */}
                        <div className={styles['interactive-row']} style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(242, 153, 74, 0.2)', minWidth: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F2994A' }}>
                                <i className="fas fa-balance-scale"></i>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Needs Impact</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.3' }}>
                                    Satisfaction drops to <strong>{behavioralInsights.needsImpactWith}/7</strong> when needs are unmet (vs {behavioralInsights.needsImpactWithout} when met).
                                </div>
                            </div>
                        </div>

                        {/* Insight 2: Weekend Lift */}
                        <div className={styles['interactive-row']} style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(91, 141, 239, 0.2)', minWidth: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5B8DEF' }}>
                                <i className="fas fa-calendar-day"></i>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Routine Impact</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.3' }}>
                                    Connection scores are <strong>{Number(behavioralInsights.weekendLift) > 0 ? `+${behavioralInsights.weekendLift}` : behavioralInsights.weekendLift} pts higher</strong> on weekends.
                                </div>
                            </div>
                        </div>

                        {/* Insight 3: Stability */}
                        <div className={styles['interactive-row']} style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.2)', minWidth: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                                <i className="fas fa-water"></i>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Emotional Stability</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.3' }}>
                                    Scores fluctuated by a max of <strong>{behavioralInsights.maxFluctuation} pts</strong> day-to-day. Connection is stable.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {renderBaselineSection()}
        </main>
    );
}
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

interface TrendData {
    date: string;
    daily_score: number;
    moving_average: number;
    user_role: string;
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
    const [trendData, setTrendData] = useState<TrendData[]>([]);
    const [chartMode, setChartMode] = useState<'7day' | '30day'>('7day');
    useEffect(() => {
        const fetchAnalysisData = async () => {
            try {
                const token = localStorage.getItem('token');
                // This assumes your Node gateway has an /api/analysis endpoint implemented
                const response = await axios.get('/api/analysis', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setCheckinData(response.data.checkins || []);
                setBaselineData(response.data.baseline || null);
                setTrendData(response.data.trend_analysis || []);

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
                <div className={`${styles['metric-card']} ${styles['delay-1']}`}>
                    <div className={styles['card-title']}>
                        <div className={styles['card-label']}>Marital Risk Percentage</div>
                        <div className={`${styles['icon-bg']} ${styles['icon-red']}`}>
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                    </div>

                    <div className={styles['risk-score-container']}>
                        <div className={`${styles['risk-score-value']} ${styles[(100 - (baselineData?.maritalRiskPercentage || 0)) > 50 ? 'risk-red' : ((100 - (baselineData?.maritalRiskPercentage || 0)) > 30 ? 'risk-yellow' : 'risk-green')]}`}>
                            {100 - (baselineData?.maritalRiskPercentage || 0)}%
                        </div>
                        <p className={styles['risk-score-desc']}>
                            Based on our AI model, this is your baseline risk probability for relationship dissatisfaction.
                        </p>
                    </div>

                    <div className={styles['progress-track']}>
                        <style>{`.dynamic-width-risk { width: ${100 - (baselineData?.maritalRiskPercentage || 0)}%; }`}</style>
                        <div className={`${styles['progress-fill']} dynamic-width-risk ${styles[(100 - (baselineData?.maritalRiskPercentage || 0)) > 50 ? 'risk-bg-red' : ((100 - (baselineData?.maritalRiskPercentage || 0)) > 30 ? 'risk-bg-yellow' : 'risk-bg-green')]}`}></div>
                    </div>
                </div>

                {/* 6. BASELINE CONCERNS (Q17, Q13, Q19) */}
                <div className={`${styles['metric-card']} ${styles['delay-2']}`}>
                    <div className={styles['card-title']}>
                        <div className={styles['card-label']}>Core Vulnerabilities</div>
                        <div className={`${styles['icon-bg']} ${styles['icon-sage']}`}>
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

    // 1. Calculate Average Satisfaction (Scale 1-7)
    const avgScore = useMemo(() => {
        if (chartMode === '7day') {
            if (checkinData.length === 0) return 0;
            const total = checkinData.reduce((acc, curr) => acc + curr.coreMetric, 0);
            return (total / checkinData.length).toFixed(1);
        } else {
            if (trendData.length === 0) return 0;
            const total = trendData.reduce((acc, curr) => acc + curr.moving_average, 0);
            return (total / trendData.length).toFixed(1);
        }
    }, [checkinData, trendData, chartMode]);
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
        if (chartMode === '7day') {
            if (checkinData.length < 2) return { value: 0, isUp: true };
            const first = checkinData[0].coreMetric;
            const last = checkinData[checkinData.length - 1].coreMetric;
            const diff = last - first;
            const percentage = Math.round((Math.abs(diff) / first) * 100);
            return { value: percentage, isUp: diff >= 0 };
        } else {
            if (trendData.length < 2) return { value: 0, isUp: true };
            const first = trendData[0].moving_average;
            const last = trendData[trendData.length - 1].moving_average;
            const diff = last - first;
            const percentage = Math.round((Math.abs(diff) / first) * 100);
            return { value: percentage, isUp: diff >= 0 };
        }
    }, [checkinData, trendData, chartMode]);

    if (checkinData.length < 7) {
        return (
            <main className={styles['main-content']}>
                <div className={styles['header']}>
                    <div>
                        <h1>Relationship Analysis</h1>
                        <p className={styles['text-muted']}>Insights based on your last 7 daily check-ins</p>
                    </div>
                </div>

                <div className={styles['empty-state']}>
                    <div className={styles['empty-icon']}>
                        <i className="fas fa-chart-line"></i>
                    </div>
                    <h2 className={styles['empty-title']}>Not Enough Data Yet</h2>
                    <p className={styles['empty-desc']}>
                        Our AI needs at least 7 days of daily check-ins to analyse your behavioral insights and trend analysis.
                        <br /><br />
                        You currently have <strong>{checkinData.length}</strong> check-in{checkinData.length !== 1 ? 's' : ''}. Keep going!
                    </p>
                </div>
                {renderBaselineSection()}
            </main>
        );
    }

    const activeData = chartMode === '7day' ? checkinData : trendData;
    const activeLength = activeData.length > 0 ? activeData.length : 1;

    // SVG Path calculation for the dynamic line chart (Curved)
    const maxMetric = 7;
    const points = activeData.map((d: any, i) => {
        const val = chartMode === '7day' ? d.coreMetric : d.moving_average;
        return {
            x: (i / (activeLength - 1)) * 400, // 400 is SVG width
            y: 150 - ((val / maxMetric) * 120) // 150 is SVG height, 120 is max height
        };
    });

    let lineD = points.length > 0 ? `M ${points[0].x},${points[0].y}` : 'M 0,150';
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        // Create a smooth cubic bezier curve by placing control points halfway horizontally
        const cp1x = prev.x + (curr.x - prev.x) / 2;
        const cp2x = prev.x + (curr.x - prev.x) / 2;
        lineD += ` C ${cp1x},${prev.y} ${cp2x},${curr.y} ${curr.x},${curr.y}`;
    }
    const pathD = points.length > 0 ? `${lineD} L 400,150 L 0,150 Z` : 'M 0,150 Z';
    return (
        <main className={styles['main-content']}>
            <div className={styles['header']}>
                <div>
                    <h1>Relationship Analysis</h1>
                    <p className={styles['text-muted']}>Insights based on your last 7 daily check-ins</p>
                </div>
            </div>
            <div className={styles['analysis-grid']}>
                {/* 1. SATISFACTION TREND */}
                <div className={`${styles['metric-card']} ${styles['card-main']}`}>
                    <div className={styles['card-title']}>
                        <div className={`${styles['icon-bg']} ${styles['icon-pink']}`}>
                            <i className="fas fa-heart"></i>
                        </div>
                        <span className={`${styles['trend-badge']} ${trend.isUp ? styles['trend-up'] : styles['trend-down']}`}>
                            <i className={`fas fa-arrow-${trend.isUp ? 'up' : 'down'}`}></i> {trend.isUp ? '+' : '-'}{trend.value}%
                        </span>
                    </div>
                    <div className={styles['card-label']}>Average Satisfaction Score</div>
                    <div className={styles['card-value']}>{avgScore}/7</div>
                    
                    {/* Chart Toggle Buttons */}
                    <div className={styles['toggle-container']}>
                        <button 
                            onClick={() => setChartMode('7day')}
                            className={`${styles['chart-toggle-btn']} ${chartMode === '7day' ? styles['btn-active-blue'] : styles['btn-inactive']}`}
                        >
                            7-Day Volatility
                        </button>
                        <button 
                            onClick={() => setChartMode('30day')}
                            className={`${styles['chart-toggle-btn']} ${chartMode === '30day' ? styles['btn-active-green'] : styles['btn-inactive']}`}
                        >
                            30-Day Stability
                        </button>
                    </div>

                    <div className={styles['chart-container']}>

                        {hoveredPoint !== null && points[hoveredPoint] && (
                            <style>{`
                                .dynamic-tooltip { left: ${(points[hoveredPoint].x / 400) * 100}%; top: calc(${(points[hoveredPoint].y / 150) * 100}% - 12px); }
                                .dynamic-tooltip-dot { left: ${(points[hoveredPoint].x / 400) * 100}%; top: ${(points[hoveredPoint].y / 150) * 100}%; }
                            `}</style>
                        )}
                        {hoveredPoint !== null && points[hoveredPoint] && (
                            <>
                                <div className={`${styles['chart-tooltip']} dynamic-tooltip`}>
                                    {chartMode === '7day' 
                                        ? `Score: ${(activeData[hoveredPoint] as CheckinData).coreMetric}/7` 
                                        : `Avg: ${(activeData[hoveredPoint] as TrendData).moving_average.toFixed(1)}/7`}
                                </div>
                                <div className={`${styles['tooltip-dot']} dynamic-tooltip-dot`}></div>
                            </>
                        )}
                        <svg width="100%" height="100%" viewBox="0 0 400 150" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="gradBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" className={chartMode === '30day' ? styles['stop-green-30'] : styles['stop-blue-30']} />
                                    <stop offset="100%" className={chartMode === '30day' ? styles['stop-green-0'] : styles['stop-blue-0']} />
                                </linearGradient>
                            </defs>
                            <path d={pathD} fill="url(#gradBlue)" />
                            <path d={lineD} fill="none" stroke={chartMode === '30day' ? '#10B981' : '#5B8DEF'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
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
                                        className={styles['chart-rect']}
                                        onMouseEnter={() => setHoveredPoint(i)}
                                        onMouseLeave={() => setHoveredPoint(null)}
                                    />
                                );
                            })}
                        </svg>

                        <div className={styles['x-axis-labels']}>
                            {chartMode === '7day' 
                                ? activeData.map((d: any, i) => {
                                    const parts = d.day.split(' ');
                                    return <span key={i}>{`${parts[0]} ${parts[1]}`}</span>;
                                  })
                                : activeData.map((d: any, i) => {
                                    // For 30 day, only show a few labels to prevent overlap
                                    if (i === 0 || i === Math.floor(activeData.length / 2) || i === activeData.length - 1) {
                                        const parts = d.date.split(' ');
                                        // Backend sends "Jun 08" (Month Day), so we flip it to "08 Jun" (Date Month)
                                        return <span key={i}>{`${parts[1]} ${parts[0]}`}</span>;
                                    }
                                    return <span key={i} className={styles['hidden']}>.</span>;
                                  })
                            }
                        </div>
                    </div>
                </div>
                {/* 2. ROTATIONAL INSIGHTS */}
                <div className={`${styles['metric-card']} ${styles['card-comm']}`}>
                    <div className={styles['card-title']}>
                        <div className={styles['card-label']}>Recent Reflection</div>
                        <div className={`${styles['icon-bg']} ${styles['icon-sage']}`}>
                            <i className="fa-solid fa-brain"></i>
                        </div>
                    </div>
                    <div className={`${styles['card-value']} ${styles['reflection-val']}`}>
                        "{latestCheckin.rotationalQuestion}"
                    </div>

                    <div className={styles['reflection-box']}>
                        <div className={styles['reflection-header']}>
                            <span className={styles['text-muted']}>Latest Answer:</span>
                            <strong className={styles['text-orange']}>{getRotationalLabel(latestCheckin.rotationalScore)} ({latestCheckin.rotationalScore > 0 ? '+' : ''}{latestCheckin.rotationalScore})</strong>
                        </div>
                        <div className={styles['bar-bg']}>
                            <style>{`.dynamic-rotational-bar { width: ${((latestCheckin.rotationalScore + 2) / 4) * 100}%; }`}</style>
                            <div className={`${styles['bar-fill-orange']} dynamic-rotational-bar`}></div>
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
                                    className={`${styles['maslow-level']} ${isMostUnmet ? styles['maslow-bg-active'] : styles['maslow-bg-inactive']} ${isMostUnmet ? styles['active'] : ''}`}
                                >
                                    {need}
                                </div>
                            );
                        })}
                    </div>
                    <div className={styles['maslow-text']}>
                        <h3 className={styles['unmet-title']}>Unmet Needs Analysis</h3>
                        <p className={styles['unmet-desc']}>Aggregated from your check-ins.</p>
                        <div className={styles['insight-box']}>
                            <strong className={styles['text-green']}>Primary Focus: {mostUnmetNeed}</strong><br />
                            This need was flagged {needsCount[mostUnmetNeed]} times this week.
                        </div>
                    </div>
                </div>
                {/* 4. BEHAVIORAL PATTERNS */}
                <div className={`${styles['metric-card']} ${styles['card-conflict']} ${styles['flex-col-between']}`}>
                    <div className={styles['card-title']}>
                        <div className={styles['card-label']}>Behavioral Patterns</div>
                        <div className={`${styles['icon-bg']} ${styles['icon-sage']}`}>
                            <i className="fas fa-chart-pie"></i>
                        </div>
                    </div>

                    <div className={styles['mt-10']}>
                        {/* Insight 1: Needs Impact */}
                        <div className={`${styles['interactive-row']} ${styles['insight-row']} ${styles['mb-10']}`}>
                            <div className={styles['icon-orange']}>
                                <i className="fas fa-balance-scale"></i>
                            </div>
                            <div className={styles['flex-1']}>
                                <div className={styles['insight-label']}>Needs Impact</div>
                                <div className={styles['insight-text']}>
                                    Satisfaction drops to <strong>{behavioralInsights.needsImpactWith}/7</strong> when needs are unmet (vs {behavioralInsights.needsImpactWithout} when met).
                                </div>
                            </div>
                        </div>

                        {/* Insight 2: Weekend Lift */}
                        <div className={`${styles['interactive-row']} ${styles['insight-row']} ${styles['mb-10']}`}>
                            <div className={styles['icon-blue']}>
                                <i className="fas fa-calendar-day"></i>
                            </div>
                            <div className={styles['flex-1']}>
                                <div className={styles['insight-label']}>Routine Impact</div>
                                <div className={styles['insight-text']}>
                                    Connection scores are <strong>{Number(behavioralInsights.weekendLift) > 0 ? `+${behavioralInsights.weekendLift}` : behavioralInsights.weekendLift} pts higher</strong> on weekends.
                                </div>
                            </div>
                        </div>

                        {/* Insight 3: Stability */}
                        <div className={`${styles['interactive-row']} ${styles['insight-row']}`}>
                            <div className={styles['icon-green']}>
                                <i className="fas fa-water"></i>
                            </div>
                            <div className={styles['flex-1']}>
                                <div className={styles['insight-label']}>Emotional Stability</div>
                                <div className={styles['insight-text']}>
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

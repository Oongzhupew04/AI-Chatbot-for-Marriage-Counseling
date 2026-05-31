import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5, FontAwesome6 } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { styles } from './analysis.styles';
import { API_BASE_URL } from '../../constants/Config';

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

export default function AnalysisScreen() {
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
    const [checkinData, setCheckinData] = useState<CheckinData[]>([]);
    const [baselineData, setBaselineData] = useState<BaselineData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const screenWidth = Dimensions.get('window').width - 40; // padding 20 on each side
    const chartWidth = Dimensions.get('window').width - 80;  // additional 40px for metricCard padding

    useEffect(() => {
        const fetchAnalysisData = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const response = await axios.get(`${API_BASE_URL}/api/analysis`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setCheckinData(response.data.checkins || []);
                setBaselineData(response.data.baseline || null);
            } catch (err: any) {
                console.error("Failed to fetch analysis data", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalysisData();
    }, []);

    const renderBaselineSection = () => {
        const riskPct = 100 - (baselineData?.maritalRiskPercentage || 0);
        const isHighRisk = riskPct > 50;
        const isMedRisk = riskPct > 30 && riskPct <= 50;
        const riskColor = isHighRisk ? '#EF4444' : (isMedRisk ? '#F59E0B' : '#10B981');
        const riskBg = isHighRisk ? 'rgba(239, 68, 68, 0.1)' : (isMedRisk ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)');

        return (
            <View>
                <View style={styles.baselineHeader}>
                    <Text style={styles.baselineTitle}>Initial Assessment Baseline</Text>
                    <Text style={styles.baselineDesc}>Risk analysis derived from your registration relationship assessment</Text>
                </View>

                {/* 5. OVERALL RISK PERCENTAGE */}
                <View style={styles.metricCard}>
                    <View style={styles.cardTitleContainer}>
                        <Text style={styles.cardLabel}>Marital Risk Percentage</Text>
                        <View style={[styles.iconBg, { backgroundColor: riskBg }]}>
                            <FontAwesome5 name="exclamation-triangle" size={16} color={riskColor} />
                        </View>
                    </View>

                    <View style={styles.riskScoreContainer}>
                        <Text style={[styles.riskScoreValue, { color: riskColor }]}>
                            {riskPct}%
                        </Text>
                        <Text style={styles.riskScoreDesc}>
                            Based on our AI model, this is your baseline risk probability for relationship dissatisfaction.
                        </Text>
                    </View>

                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${riskPct}%`, backgroundColor: riskColor }]} />
                    </View>
                </View>

                {/* 6. BASELINE CONCERNS */}
                <View style={[styles.metricCard, { marginBottom: 40 }]}>
                    <View style={styles.cardTitleContainer}>
                        <Text style={styles.cardLabel}>Core Vulnerabilities</Text>
                        <View style={[styles.iconBg, { backgroundColor: '#EBF3F1' }]}>
                            <FontAwesome5 name="search-plus" size={16} color="#7C9A92" />
                        </View>
                    </View>

                    <View style={styles.concernsList}>
                        {/* Q17 Self Actualization */}
                        <View style={[styles.concernRow, isConcerning(baselineData?.q17 || 0) ? styles.concernRowConcerning : styles.concernRowHealthy]}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text style={styles.concernTitle}>Self-Actualization</Text>
                                <Text style={styles.concernSubtitle}>"Are you proud of your spouse?"</Text>
                            </View>
                            <View style={[styles.concernBadge, isConcerning(baselineData?.q17 || 0) ? styles.badgeConcerning : styles.badgeHealthy]}>
                                <FontAwesome5 name={isConcerning(baselineData?.q17 || 0) ? "exclamation-circle" : "check-circle"} size={12} color={isConcerning(baselineData?.q17 || 0) ? "#EF4444" : "#10B981"} />
                                <Text style={isConcerning(baselineData?.q17 || 0) ? styles.badgeTextConcerning : styles.badgeTextHealthy}>
                                    {isConcerning(baselineData?.q17 || 0) ? 'Concerning' : 'Healthy'}
                                </Text>
                            </View>
                        </View>

                        {/* Q13 Esteem */}
                        <View style={[styles.concernRow, isConcerning(baselineData?.q13 || 0) ? styles.concernRowConcerning : styles.concernRowHealthy]}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text style={styles.concernTitle}>Esteem</Text>
                                <Text style={styles.concernSubtitle}>"Do you find your spouse attractive?"</Text>
                            </View>
                            <View style={[styles.concernBadge, isConcerning(baselineData?.q13 || 0) ? styles.badgeConcerning : styles.badgeHealthy]}>
                                <FontAwesome5 name={isConcerning(baselineData?.q13 || 0) ? "exclamation-circle" : "check-circle"} size={12} color={isConcerning(baselineData?.q13 || 0) ? "#EF4444" : "#10B981"} />
                                <Text style={isConcerning(baselineData?.q13 || 0) ? styles.badgeTextConcerning : styles.badgeTextHealthy}>
                                    {isConcerning(baselineData?.q13 || 0) ? 'Concerning' : 'Healthy'}
                                </Text>
                            </View>
                        </View>

                        {/* Q19 Love */}
                        <View style={[styles.concernRow, isConcerning(baselineData?.q19 || 0) ? styles.concernRowConcerning : styles.concernRowHealthy]}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text style={styles.concernTitle}>Love</Text>
                                <Text style={styles.concernSubtitle}>"Do you love your spouse?"</Text>
                            </View>
                            <View style={[styles.concernBadge, isConcerning(baselineData?.q19 || 0) ? styles.badgeConcerning : styles.badgeHealthy]}>
                                <FontAwesome5 name={isConcerning(baselineData?.q19 || 0) ? "exclamation-circle" : "check-circle"} size={12} color={isConcerning(baselineData?.q19 || 0) ? "#EF4444" : "#10B981"} />
                                <Text style={isConcerning(baselineData?.q19 || 0) ? styles.badgeTextConcerning : styles.badgeTextHealthy}>
                                    {isConcerning(baselineData?.q19 || 0) ? 'Concerning' : 'Healthy'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#7C9A92" />
            </View>
        );
    }

    const latestCheckin = checkinData[checkinData.length - 1];

    if (checkinData.length < 7) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.mainContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Relationship Analysis</Text>
                    <Text style={styles.subtitle}>Insights based on your last 7 daily check-ins</Text>
                </View>

                <View style={styles.notEnoughDataContainer}>
                    <FontAwesome6 name="chart-line" size={60} color="#7C9A92" style={styles.notEnoughDataIcon} />
                    <Text style={styles.notEnoughDataTitle}>Not Enough Data Yet</Text>
                    <Text style={styles.notEnoughDataDesc}>
                        Our AI needs at least 7 days of daily check-ins to analyse your behavioral insights and trend analysis.{'\n\n'}
                        You currently have <Text style={styles.boldDesc}>{checkinData.length}</Text> check-in{checkinData.length !== 1 ? 's' : ''}. Keep going!
                    </Text>
                </View>

                {renderBaselineSection()}
            </ScrollView>
        );
    }

    // 1. Calculate Average Satisfaction
    const avgScore = (() => {
        if (checkinData.length === 0) return 0;
        const total = checkinData.reduce((acc, curr) => acc + curr.coreMetric, 0);
        return Math.round(((total / checkinData.length) / 7) * 100);
    })();

    // 2. Aggregate Unmet Needs
    const needsCount = (() => {
        const counts: Record<string, number> = { 'Physiological': 0, 'Safety': 0, 'Love & Belonging': 0, 'Esteem': 0, 'Self-Actualization': 0 };
        checkinData.forEach(day => {
            day.unmetNeeds.forEach(need => {
                if (counts[need] !== undefined) counts[need]++;
            });
        });
        return counts;
    })();
    const mostUnmetNeed = Object.keys(needsCount).reduce((a, b) => needsCount[a] > needsCount[b] ? a : b);

    // 3. Mathematical Behavioral Insights
    const behavioralInsights = (() => {
        const daysWithNeeds = checkinData.filter(d => d.unmetNeeds.length > 0);
        const daysWithoutNeeds = checkinData.filter(d => d.unmetNeeds.length === 0);
        const avgWith = daysWithNeeds.length ? (daysWithNeeds.reduce((a, b) => a + b.coreMetric, 0) / daysWithNeeds.length) : 0;
        const avgWithout = daysWithoutNeeds.length ? (daysWithoutNeeds.reduce((a, b) => a + b.coreMetric, 0) / daysWithoutNeeds.length) : 0;

        const isWeekend = (dateStr: string) => {
            // Parse "DD MMM" format reliably across JS engines
            const parts = dateStr.split(' ');
            if (parts.length >= 2) {
                const day = parseInt(parts[0], 10);
                const monthStr = parts[1].substring(0, 3);
                const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
                const month = months[monthStr] !== undefined ? months[monthStr] : 0;
                const date = new Date(new Date().getFullYear(), month, day);
                return date.getDay() === 0 || date.getDay() === 6;
            }
            return false;
        };
        const weekends = checkinData.filter(d => isWeekend(d.day));
        const weekdays = checkinData.filter(d => !isWeekend(d.day));
        const avgWeekend = weekends.length ? (weekends.reduce((a, b) => a + b.coreMetric, 0) / weekends.length) : 0;
        const avgWeekday = weekdays.length ? (weekdays.reduce((a, b) => a + b.coreMetric, 0) / weekdays.length) : 0;

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
    })();

    // 4. Trend Calculation
    const trend = (() => {
        if (checkinData.length < 2) return { value: 0, isUp: true };
        const first = checkinData[0].coreMetric;
        const last = checkinData[checkinData.length - 1].coreMetric;
        const diff = last - first;
        const percentage = Math.round((Math.abs(diff) / first) * 100);
        return { value: percentage, isUp: diff >= 0 };
    })();

    // SVG Path calculation
    const maxMetric = 7;
    const chartHeight = 150;

    const points = checkinData.map((d, i) => ({
        x: (i / (checkinData.length - 1)) * chartWidth,
        y: chartHeight - ((d.coreMetric / maxMetric) * (chartHeight - 30)) // Give some top padding
    }));

    let lineD = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cp1x = prev.x + (curr.x - prev.x) / 2;
        const cp2x = prev.x + (curr.x - prev.x) / 2;
        lineD += ` C ${cp1x},${prev.y} ${cp2x},${curr.y} ${curr.x},${curr.y}`;
    }
    const pathD = `${lineD} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.mainContent}>
            <View style={styles.header}>
                <Text style={styles.title}>Relationship Analysis</Text>
                <Text style={styles.subtitle}>Insights based on your last 7 daily check-ins</Text>
            </View>

            {/* 1. SATISFACTION TREND */}
            <View style={styles.metricCard}>
                <View style={styles.cardTitleContainer}>
                    <View style={[styles.iconBg, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
                        <FontAwesome5 name="heart" size={16} color="#EC4899" />
                    </View>
                    <View style={[styles.trendBadge, trend.isUp ? styles.trendUp : styles.trendDown]}>
                        <FontAwesome5 name={trend.isUp ? "arrow-up" : "arrow-down"} size={10} color={trend.isUp ? "#10B981" : "#EF4444"} />
                        <Text style={trend.isUp ? styles.trendTextUp : styles.trendTextDown}>
                            {trend.isUp ? '+' : '-'}{trend.value}%
                        </Text>
                    </View>
                </View>
                <Text style={styles.cardLabel}>Average Satisfaction Score</Text>
                <Text style={styles.cardValue}>{avgScore}/100</Text>

                <View style={styles.chartContainer}>
                    {hoveredPoint !== null && (
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                            <View style={[styles.chartTooltip, {
                                left: points[hoveredPoint].x - 30, // Center it roughly
                                top: points[hoveredPoint].y - 35
                            }]}>
                                <Text style={styles.chartTooltipText}>Score: {checkinData[hoveredPoint].coreMetric}/7</Text>
                            </View>
                            <View style={[styles.chartTooltipDot, {
                                left: points[hoveredPoint].x - 6, // half width
                                top: points[hoveredPoint].y - 6 // half height
                            }]} />
                        </View>
                    )}

                    <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                        <Defs>
                            <LinearGradient id="gradBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                                <Stop offset="0%" stopColor="rgb(91, 141, 239)" stopOpacity="0.3" />
                                <Stop offset="100%" stopColor="rgb(91, 141, 239)" stopOpacity="0" />
                            </LinearGradient>
                        </Defs>
                        <Path d={pathD} fill="url(#gradBlue)" />
                        <Path d={lineD} fill="none" stroke="#5B8DEF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

                        {points.map((pt, i) => {
                            const halfSegment = chartWidth / ((points.length - 1) * 2);
                            const leftEdge = Math.max(0, pt.x - halfSegment);
                            const rightEdge = Math.min(chartWidth, pt.x + halfSegment);
                            return (
                                <Rect
                                    key={i}
                                    x={leftEdge}
                                    y={0}
                                    width={rightEdge - leftEdge}
                                    height={chartHeight}
                                    fill="transparent"
                                    onPressIn={() => setHoveredPoint(i)}
                                    onPressOut={() => setHoveredPoint(null)}
                                />
                            );
                        })}
                    </Svg>

                    <View style={styles.chartXAxis}>
                        {checkinData.map((d, i) => {
                            const parts = d.day.split(' ');
                            return <Text key={i} style={styles.chartXAxisText}>{`${parts[0]}\n${parts[1]}`}</Text>;
                        })}
                    </View>
                </View>
            </View>

            {/* 2. ROTATIONAL INSIGHTS */}
            <View style={styles.metricCard}>
                <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardLabel}>Recent Reflection</Text>
                    <View style={[styles.iconBg, { backgroundColor: '#EBF3F1' }]}>
                        <FontAwesome5 name="brain" size={16} color="#7C9A92" />
                    </View>
                </View>
                <Text style={[styles.cardValue, { fontSize: 18, marginVertical: 15, lineHeight: 26, flexWrap: 'wrap' }]}>
                    "{latestCheckin.rotationalQuestion}"
                </Text>

                <View style={{ backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, marginTop: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: '#718096', fontFamily: 'Inter_400Regular', fontSize: 13 }}>Latest Answer:</Text>
                        <Text style={{ color: '#F2994A', fontFamily: 'Inter_700Bold', fontSize: 12.5 }}>
                            {getRotationalLabel(latestCheckin.rotationalScore)} ({latestCheckin.rotationalScore > 0 ? '+' : ''}{latestCheckin.rotationalScore})
                        </Text>
                    </View>
                    <View style={{ width: '100%', backgroundColor: '#E2E8F0', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                        <View style={{ width: `${((latestCheckin.rotationalScore + 2) / 4) * 100}%`, backgroundColor: '#F2994A', height: '100%', borderRadius: 4 }} />
                    </View>
                </View>
            </View>

            {/* 3. MASLOW NEEDS SYNTHESIS */}
            <View style={styles.metricCard}>
                <View style={styles.maslowVisual}>
                    {['Physiological', 'Safety', 'Love & Belonging', 'Esteem', 'Self-Actualization'].map(need => {
                        const isMostUnmet = need === mostUnmetNeed && needsCount[need] > 0;
                        return (
                            <View
                                key={need}
                                style={[
                                    styles.maslowLevel,
                                    { backgroundColor: isMostUnmet ? '#10B981' : '#A0AEC0' }
                                ]}
                            >
                                <Text style={isMostUnmet ? styles.maslowTextActive : styles.maslowTextInactive}>
                                    {need}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                <Text style={{ fontFamily: 'Merriweather_700Bold', fontSize: 20, color: '#2D3748', marginBottom: 5 }}>Unmet Needs Analysis</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#718096' }}>Aggregated from your check-ins.</Text>

                <View style={styles.insightBox}>
                    <Text style={styles.insightBoxTitle}>Primary Focus: {mostUnmetNeed}</Text>
                    <Text style={styles.insightBoxText}>This need was flagged {needsCount[mostUnmetNeed]} times this week.</Text>
                </View>
            </View>

            {/* 4. BEHAVIORAL PATTERNS */}
            <View style={styles.metricCard}>
                <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardLabel}>Behavioral Patterns</Text>
                    <View style={[styles.iconBg, { backgroundColor: '#EBF3F1' }]}>
                        <FontAwesome5 name="chart-pie" size={16} color="#7C9A92" />
                    </View>
                </View>

                <View style={{ marginTop: 10 }}>
                    {/* Insight 1 */}
                    <View style={styles.interactiveRow}>
                        <View style={[styles.interactiveRowIconBox, { backgroundColor: 'rgba(242, 153, 74, 0.2)' }]}>
                            <FontAwesome5 name="balance-scale" size={16} color="#F2994A" />
                        </View>
                        <View style={styles.interactiveRowContent}>
                            <Text style={styles.interactiveRowLabel}>Needs Impact</Text>
                            <Text style={styles.interactiveRowText}>
                                Satisfaction drops to <Text style={styles.interactiveRowTextBold}>{behavioralInsights.needsImpactWith}/7</Text> when needs are unmet (vs {behavioralInsights.needsImpactWithout} when met).
                            </Text>
                        </View>
                    </View>

                    {/* Insight 2 */}
                    <View style={styles.interactiveRow}>
                        <View style={[styles.interactiveRowIconBox, { backgroundColor: 'rgba(91, 141, 239, 0.2)' }]}>
                            <FontAwesome5 name="calendar-day" size={16} color="#5B8DEF" />
                        </View>
                        <View style={styles.interactiveRowContent}>
                            <Text style={styles.interactiveRowLabel}>Routine Impact</Text>
                            <Text style={styles.interactiveRowText}>
                                Connection scores are <Text style={styles.interactiveRowTextBold}>{Number(behavioralInsights.weekendLift) > 0 ? `+${behavioralInsights.weekendLift}` : behavioralInsights.weekendLift} pts higher</Text> on weekends.
                            </Text>
                        </View>
                    </View>

                    {/* Insight 3 */}
                    <View style={styles.interactiveRow}>
                        <View style={[styles.interactiveRowIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                            <FontAwesome5 name="water" size={16} color="#10B981" />
                        </View>
                        <View style={styles.interactiveRowContent}>
                            <Text style={styles.interactiveRowLabel}>Emotional Stability</Text>
                            <Text style={styles.interactiveRowText}>
                                Scores fluctuated by a max of <Text style={styles.interactiveRowTextBold}>{behavioralInsights.maxFluctuation} pts</Text> day-to-day. Connection is stable.
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {renderBaselineSection()}
        </ScrollView>
    );
}

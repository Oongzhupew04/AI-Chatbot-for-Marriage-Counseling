import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ScrollView, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Alert, Keyboard, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/Config';
import { getStyles } from './checkinModal.styles';
import { useTheme } from '../../context/ThemeContext';

interface CheckinModalProps {
    isOpen: boolean;
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

export default function CheckinModal({ isOpen, onClose, onSuccess }: CheckinModalProps) {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const [satisfactionScore, setSatisfactionScore] = useState<number | null>(null);
    const [rotationalAnswer, setRotationalAnswer] = useState<number | null>(null);
    const [todayQuestion, setTodayQuestion] = useState("");
    const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
    const [journalText, setJournalText] = useState("");

    const isStep1Filled = satisfactionScore !== null;
    const isStep2Filled = rotationalAnswer !== null;
    const isStep3Filled = selectedNeeds.length > 0;

    const isFormValid = isStep1Filled && isStep2Filled && isStep3Filled;

    useEffect(() => {
        if (isOpen) {
            const randomIndex = Math.floor(Math.random() * ROTATIONAL_QUESTIONS.length);
            setTodayQuestion(ROTATIONAL_QUESTIONS[randomIndex]);

            // Reset state
            setSatisfactionScore(null);
            setRotationalAnswer(null);
            setSelectedNeeds([]);
            setJournalText("");
        }
    }, [isOpen]);

    const handleNeedToggle = (need: string) => {
        setSelectedNeeds(prev =>
            prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
        );
    };

    const handleSubmit = async () => {
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
            const token = await AsyncStorage.getItem('token');

            const response = await fetch(`${API_BASE_URL}/api/checkin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log("Check-in saved payload:", payload);
                Alert.alert("Success", "Check-in saved! Your analysis has been updated.");
                onSuccess();
            } else {
                const errorData = await response.json();
                Alert.alert("Error", `Failed to save: ${errorData.error}`);
            }
        } catch (error) {
            console.error("Error submitting check-in:", error);
            Alert.alert("Error", "A network error occurred. Please try again.");
        }
    };

    if (!isOpen) return null;

    return (
        <Modal transparent={true} animationType="fade" visible={isOpen} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}
                    pointerEvents="box-none"
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <View style={styles.headerTopRow}>
                                <Text style={styles.headerTitle}>Daily Check-In</Text>
                                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                                    <FontAwesome5 name="times" size={16} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.headerBottomRow}>
                                <Text style={styles.headerSubtitle}>Track your relationship satisfaction and needs.</Text>
                                <View style={styles.dateBadge}>
                                    <FontAwesome5 name="calendar-alt" size={12} color={'black'} />
                                    <Text style={styles.dateBadgeText}>Today</Text>
                                </View>
                            </View>
                        </View>

                        <ScrollView
                            style={styles.modalBody}
                            contentContainerStyle={styles.modalBodyContent}
                            keyboardShouldPersistTaps="handled"
                        >

                            {/* STEP 1: CORE METRIC */}
                            <View style={styles.checkinCard}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardHeaderTitleRow}>
                                        <View style={styles.stepNum}>
                                            <Text style={styles.stepNumText}>1</Text>
                                        </View>
                                        <Text style={styles.cardHeaderTitleText}>Satisfaction</Text>
                                    </View>
                                    <Text style={styles.cardHeaderSubtitle}>Overall, how satisfied are you with your relationship today?</Text>
                                </View>

                                <View style={styles.numOptionRow}>
                                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                        <TouchableOpacity
                                            key={num}
                                            onPress={() => setSatisfactionScore(num)}
                                            style={[styles.numButton, satisfactionScore === num && styles.numButtonSelected]}
                                        >
                                            <Text style={[styles.numButtonText, satisfactionScore === num && styles.numButtonTextSelected]}>{num}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <View style={styles.numOptionLabels}>
                                    <Text style={styles.numOptionLabelText}>Very Dissatisfied</Text>
                                    <Text style={styles.numOptionLabelText}>Very Satisfied</Text>
                                </View>
                            </View>

                            {/* STEP 2: ROTATIONAL QUESTION */}
                            <View style={[styles.checkinCard, styles.checkinCardFeatured]}>
                                <View style={styles.badgeFeatured}>
                                    <Text style={styles.badgeFeaturedText}>Daily Focus</Text>
                                </View>
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardHeaderTitleRow}>
                                        <View style={[styles.stepNum, styles.stepNumFeatured]}>
                                            <Text style={[styles.stepNumText, styles.stepNumTextFeatured]}>2</Text>
                                        </View>
                                        <Text style={[styles.cardHeaderTitleText, styles.cardHeaderTitleTextFeatured]}>Reflection</Text>
                                    </View>
                                    <Text style={styles.cardHeaderSubtitle}>{todayQuestion}</Text>
                                </View>

                                <View style={styles.checklist}>
                                    {[
                                        { label: 'Yes', value: 2 },
                                        { label: 'Rather yes', value: 1 },
                                        { label: 'Neither yes nor no', value: 0 },
                                        { label: 'Rather not', value: -1 },
                                        { label: 'No', value: -2 }
                                    ].map((option, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={styles.checklistItem}
                                            onPress={() => setRotationalAnswer(option.value)}
                                        >
                                            <View style={[styles.radioCircle, rotationalAnswer === option.value && styles.radioCircleSelected]}>
                                                {rotationalAnswer === option.value && <View style={styles.radioDot} />}
                                            </View>
                                            <Text style={styles.checklistLabel}>{option.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* STEP 3: MASLOW'S NEEDS & JOURNAL */}
                            <View style={[styles.checkinCard]}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardHeaderTitleRow}>
                                        <View style={styles.stepNum}>
                                            <Text style={styles.stepNumText}>3</Text>
                                        </View>
                                        <Text style={styles.cardHeaderTitleText}>Context</Text>
                                    </View>
                                    <Text style={styles.cardHeaderSubtitle}>What is your primary unmet need today?</Text>
                                </View>

                                <View style={[styles.checklist, { marginBottom: 20 }]}>
                                    {['Love & Belonging', 'Esteem', 'Safety', 'Physiological'].map(need => (
                                        <TouchableOpacity
                                            key={need}
                                            style={styles.checklistItem}
                                            onPress={() => handleNeedToggle(need)}
                                        >
                                            <View style={[styles.checkbox, selectedNeeds.includes(need) && styles.checkboxSelected]}>
                                                {selectedNeeds.includes(need) && <FontAwesome5 name="check" size={10} color="white" />}
                                            </View>
                                            <Text style={[styles.checklistLabel, styles.checklistLabelBold]}>{need}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TextInput
                                    style={styles.notesArea}
                                    placeholder="Add any additional context for the chatbot... (e.g., I felt really appreciated when you...)"
                                    placeholderTextColor="#A0AEC0"
                                    value={journalText}
                                    onChangeText={setJournalText}
                                    multiline
                                />
                            </View>

                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <View style={styles.footerButtons}>
                                <TouchableOpacity style={styles.btnOutline} onPress={onClose}>
                                    <Text style={styles.btnOutlineText}>Skip for now</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.btnPrimary, !isFormValid && styles.btnPrimaryDisabled]}
                                    onPress={handleSubmit}
                                    disabled={!isFormValid}
                                >
                                    <Text style={styles.btnPrimaryText}>Save Entry</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

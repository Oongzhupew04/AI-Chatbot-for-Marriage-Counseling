import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ScrollView, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Keyboard, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/Config';
import { styles } from './feedbackModal.styles';

export interface FeedbackData {
    rating: string;
    workedWell: string[];
    issues: string[];
    comments: string;
}

interface FeedbackModalProps {
    isOpen: boolean;
    chatId: number | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function FeedbackModal({ isOpen, chatId, onClose, onSuccess }: FeedbackModalProps) {
    const [rating, setRating] = useState<string>('');
    const [workedWell, setWorkedWell] = useState<string[]>([]);
    const [issues, setIssues] = useState<string[]>([]);
    const [comments, setComments] = useState<string>('');
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRating('');
            setWorkedWell([]);
            setIssues([]);
            setComments('');
            setIsFocused(false);
        }
    }, [isOpen]);

    const handleWorkedWellToggle = (value: string) => {
        setWorkedWell(prev => 
            prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
    };

    const handleIssuesToggle = (value: string) => {
        setIssues(prev => 
            prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
    };

    const handleCloseOrSkip = () => {
        onClose();
        onSuccess();
    };

    const handleSubmit = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/feedback`, {
                chatId,
                rating,
                workedWell,
                issues,
                comments
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Failed to submit feedback", err);
        } finally {
            onClose();
            onSuccess(); // Clear session and show Thank You ONLY AFTER feedback finishes
        }
    };

    if (!isOpen) return null;

    return (
        <Modal transparent={true} animationType="fade" visible={isOpen} onRequestClose={handleCloseOrSkip}>
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
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.headerTitle}>Session Feedback</Text>
                                <Text style={styles.headerSubtitle}>Help us improve Counselor.AI for you.</Text>
                            </View>
                            <TouchableOpacity style={styles.closeBtn} onPress={handleCloseOrSkip}>
                                <FontAwesome5 name="times" size={16} color="#718096" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView 
                            style={styles.modalBody} 
                            contentContainerStyle={styles.modalBodyContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* STEP 1: RATING */}
                            <View style={styles.feedbackCard}>
                                <View style={[styles.cardHeader, styles.cardHeaderCenter]}>
                                    <View style={styles.cardHeaderTitleRow}>
                                        <Text style={styles.cardHeaderTitleText}>How helpful was this session?</Text>
                                    </View>
                                    <Text style={[styles.cardHeaderSubtitle, styles.cardHeaderSubtitleCenter]}>Rate the advice and empathy provided.</Text>
                                </View>

                                <View style={styles.starRating}>
                                    {[1, 2, 3, 4, 5].map((starValue) => (
                                        <TouchableOpacity 
                                            key={starValue} 
                                            onPress={() => setRating(starValue.toString())}
                                            style={styles.starIcon}
                                        >
                                            <FontAwesome5 
                                                name="star" 
                                                solid 
                                                size={32} 
                                                color={rating && parseInt(rating) >= starValue ? "#D4AF37" : "#E2E8F0"} 
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* STEP 2: WHAT WORKED WELL */}
                            <View style={styles.feedbackCard}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardHeaderTitleRow}>
                                        <View style={styles.stepNum}>
                                            <Text style={styles.stepNumText}>2</Text>
                                        </View>
                                        <Text style={styles.cardHeaderTitleText}>What worked well?</Text>
                                    </View>
                                    <Text style={styles.cardHeaderSubtitle}>Select all that apply.</Text>
                                </View>

                                <View style={styles.chipGroup}>
                                    {[
                                        { id: 'good-empathy', label: '❤️ Felt Understood' },
                                        { id: 'good-advice', label: '💡 Actionable Advice' },
                                        { id: 'good-tone', label: '🗣️ Calming Tone' },
                                        { id: 'good-privacy', label: '🔒 Felt Safe' },
                                    ].map(item => (
                                        <TouchableOpacity 
                                            key={item.id}
                                            style={[styles.chipLabel, workedWell.includes(item.id) && styles.chipLabelSelected]}
                                            onPress={() => handleWorkedWellToggle(item.id)}
                                        >
                                            <Text style={[styles.chipText, workedWell.includes(item.id) && styles.chipTextSelected]}>{item.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* STEP 3: ISSUES */}
                            <View style={styles.feedbackCard}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardHeaderTitleRow}>
                                        <View style={styles.stepNum}>
                                            <Text style={styles.stepNumText}>3</Text>
                                        </View>
                                        <Text style={styles.cardHeaderTitleText}>Any issues?</Text>
                                    </View>
                                    <Text style={styles.cardHeaderSubtitle}>Help us fix bugs in the AI logic.</Text>
                                </View>

                                <View style={styles.chipGroup}>
                                    {[
                                        { id: 'bad-robot', label: '🤖 Too Robotic' },
                                        { id: 'bad-repeat', label: '🔁 Repetitive' },
                                        { id: 'bad-context', label: '❓ Misunderstood Context' },
                                    ].map(item => (
                                        <TouchableOpacity 
                                            key={item.id}
                                            style={[styles.chipLabel, issues.includes(item.id) && styles.chipLabelSelected]}
                                            onPress={() => handleIssuesToggle(item.id)}
                                        >
                                            <Text style={[styles.chipText, issues.includes(item.id) && styles.chipTextSelected]}>{item.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* STEP 4: COMMENTS */}
                            <View style={styles.feedbackCard}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardHeaderTitleRow}>
                                        <View style={styles.stepNum}>
                                            <Text style={styles.stepNumText}>4</Text>
                                        </View>
                                        <Text style={styles.cardHeaderTitleText}>Additional Comments</Text>
                                    </View>
                                    <Text style={styles.cardHeaderSubtitle}>Share specific details (Optional).</Text>
                                </View>

                                <TextInput 
                                    style={[styles.textArea, isFocused && styles.textAreaFocused]}
                                    placeholder="The AI was great, but it forgot that I mentioned..."
                                    placeholderTextColor="#A0AEC0"
                                    value={comments}
                                    onChangeText={setComments}
                                    multiline
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                />
                            </View>

                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <View style={styles.footerButtons}>
                                <TouchableOpacity style={styles.btnOutline} onPress={handleCloseOrSkip}>
                                    <Text style={styles.btnOutlineText}>Skip</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit}>
                                    <Text style={styles.btnPrimaryText}>Submit Feedback</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

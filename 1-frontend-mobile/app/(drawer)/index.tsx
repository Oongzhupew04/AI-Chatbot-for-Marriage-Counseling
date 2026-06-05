import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, Keyboard, TouchableWithoutFeedback, Animated, Dimensions, Pressable, DeviceEventEmitter } from 'react-native';
import { BlurView } from 'expo-blur';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter, useFocusEffect } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/Config';
import { getStyles } from './index.styles';
import EmergencyModal from '../../components/modals/emergencyModal';
import CheckinModal from '../../components/modals/checkinModal';
import FeedbackModal from '../../components/modals/feedbackModal';
import ThankYouModal from '../../components/modals/thankYouModal';
import { useTheme } from '../../context/ThemeContext';

interface Message {
    sender: 'user' | 'bot';
    text: string;
    action?: string;
}

interface Session {
    id: string;
    title: string;
    updated_at: string;
}

const TypingIndicator = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animateDot = (dot: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: -5,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.delay(800 - delay),
                ])
            ).start();
        };

        animateDot(dot1, 0);
        animateDot(dot2, 150);
        animateDot(dot3, 300);
    }, []);

    const dotStyle = {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#718096',
        marginHorizontal: 3,
    };

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', height: 20, paddingHorizontal: 5 }}>
            <Animated.View style={[dotStyle, { transform: [{ translateY: dot1 }] }]} />
            <Animated.View style={[dotStyle, { transform: [{ translateY: dot2 }] }]} />
            <Animated.View style={[dotStyle, { transform: [{ translateY: dot3 }] }]} />
        </View>
    );
};

const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
};

let hasSeenCheckinModalThisSession = false;

export default function HomeScreen() {
    const headerHeight = useHeaderHeight();
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
    const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isThankYouModalOpen, setIsThankYouModalOpen] = useState(false);
    const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const navigation = useNavigation();

    // AUTO-TRIGGER CHECKIN MODAL: Runs exactly once when the page loads
    useEffect(() => {
        const checkAutoTrigger = async () => {
            try {
                const today = getTodayString();
                const lastCheckIn = await AsyncStorage.getItem('lastCheckInDate');

                if (lastCheckIn === today) {
                    setHasCheckedInToday(true);
                } else if (!hasSeenCheckinModalThisSession) {
                    setHasCheckedInToday(false);
                    setIsCheckinModalOpen(true);
                    hasSeenCheckinModalThisSession = true;
                }
            } catch (error) {
                console.error('Error auto-triggering checkin modal:', error);
            }
        };

        checkAutoTrigger();
    }, []);

    const handleCheckinSuccess = async () => {
        try {
            await AsyncStorage.setItem('lastCheckInDate', getTodayString());
            setHasCheckedInToday(true);
            setIsCheckinModalOpen(false);
        } catch (error) {
            console.error('Error saving checkin date:', error);
        }
    };

    // Chat Logic State
    const [chatId, setChatId] = useState<number | null>(null);
    const [isPending, setIsPending] = useState(false);
    const isSessionEnded = messages.length > 0 && messages[messages.length - 1].text === '[Session Ended]';

    // Right Drawer State
    const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });
        return () => { showSub.remove(); hideSub.remove(); };
    }, []);

    const screenWidth = Dimensions.get('window').width;
    const slideAnim = useRef(new Animated.Value(screenWidth)).current;

    useEffect(() => {
        if (!isRightDrawerOpen) {
            setOpenDropdownId(null);
            Keyboard.dismiss();
        }

        Animated.timing(slideAnim, {
            toValue: isRightDrawerOpen ? 0 : screenWidth,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [isRightDrawerOpen]);

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('openRightDrawer', () => {
            setIsRightDrawerOpen(true);
        });
        return () => sub.remove();
    }, []);

    const fetchSessions = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(`${API_BASE_URL}/api/chats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data && response.data.sessions) {
                setSessions(response.data.sessions);
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchSessions();
        }, [])
    );

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('startNewChat', () => {
            setChatId(null);
            setMessages([]);
            setInput('');
        });
        return () => subscription.remove();
    }, []);

    const handleLoadSession = async (id: string) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/chats/${id}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setChatId(parseInt(id, 10));
            setMessages(response.data.messages);
            setIsRightDrawerOpen(false);
        } catch (error) {
            console.error('Failed to load session:', error);
        }
    };

    const handleDeleteSession = async (id: string) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            await axios.delete(`${API_BASE_URL}/api/chats/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setSessions(sessions.filter(s => s.id !== id));
            setOpenDropdownId(null);

            if (chatId?.toString() === id) {
                setChatId(null);
                setMessages([]);
            }
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    const filteredSessions = sessions.filter(session =>
        (session.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSendMessage = async () => {
        const text = input.trim();
        if (!text) return;

        // Frontend Safety Override
        const unsafeWords = ["suicide", "killing", "die", "kill"];
        if (unsafeWords.some(word => text.toLowerCase().includes(word))) {
            setIsEmergencyModalOpen(true);
        }

        Keyboard.dismiss();

        setMessages(prev => [...prev, { sender: 'user', text } as Message]);
        setInput('');
        setIsPending(true);

        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await axios.post(`${API_BASE_URL}/api/chat`,
                { message: text, chatId },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const data = response.data;
            if (data.chatId && !chatId) {
                setChatId(data.chatId);
                setSessions(prevSessions => [
                    { id: data.chatId.toString(), title: text, updated_at: new Date().toISOString() },
                    ...prevSessions
                ]);
            }

            setMessages(prev => [...prev, { sender: 'bot', text: data.response, action: data.action }]);
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I am having trouble connecting.', action: 'none' }]);
        } finally {
            setIsPending(false);
        }
    };

    const finishSession = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (chatId && token) {
                await axios.post(`${API_BASE_URL}/api/chats/${chatId}/end`, {}, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setMessages(prev => [...prev, { sender: 'bot', text: '[Session Ended]', action: 'session_ended' }]);
            }
        } catch (e) {
            console.error("Failed to end session in DB", e);
        }
        setChatId(null);
        setMessages([]);

        setIsThankYouModalOpen(true);
        setTimeout(() => {
            setIsThankYouModalOpen(false);
        }, 2000);
    };

    const handleConfirmEnd = () => {
        // Show feedback modal FIRST, so we don't lose the chatId
        setIsFeedbackModalOpen(true);
    };

    const handleCancelEnd = () => {
        setMessages(prev => [
            ...prev,
            { sender: 'user', text: 'No, I want to continue.', action: 'none' },
            { sender: 'bot', text: 'Okay, we can continue chatting.', action: 'none' }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.card} />
            <View style={styles.keyboardView}>
                <View style={styles.mainContent}>
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
                        enabled={!isRightDrawerOpen && Platform.OS === 'ios'}
                    >
                        {messages.length === 0 ? (
                            <ScrollView contentContainerStyle={styles.welcomeSection}>
                                <View style={styles.welcomeHeader}>
                                    <Text style={styles.welcomeTitle}>Welcome to Your Private Relationship Conversation</Text>
                                    <Text style={styles.welcomeSubtitle}>Start by checking in or discussing a specific issue. We are here to listen.</Text>
                                </View>

                                <View style={styles.actionGrid}>
                                    <TouchableOpacity style={styles.actionCard} onPress={() => setIsCheckinModalOpen(true)}>
                                        <View style={styles.cardContent}>
                                            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                                                <FontAwesome6 name="clipboard-check" size={16} color="#D97706" />
                                            </View>
                                            <Text style={styles.cardText}>Daily Check-in</Text>
                                        </View>
                                        <FontAwesome6 name="plus" size={14} color={theme.textSecondary} />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/resources' as any)}>
                                        <View style={styles.cardContent}>
                                            <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                                                <FontAwesome6 name="book-open" size={16} color="#2563EB" />
                                            </View>
                                            <Text style={styles.cardText}>Browse Resources</Text>
                                        </View>
                                        <FontAwesome6 name="plus" size={14} color={theme.textSecondary} />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/analysis' as any)}>
                                        <View style={styles.cardContent}>
                                            <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
                                                <FontAwesome6 name="chart-line" size={16} color="#059669" />
                                            </View>
                                            <Text style={styles.cardText}>View Analysis</Text>
                                        </View>
                                        <FontAwesome6 name="plus" size={14} color={theme.textSecondary} />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.actionCard} onPress={() => setIsEmergencyModalOpen(true)}>
                                        <View style={styles.cardContent}>
                                            <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                                                <FontAwesome6 name="phone-volume" size={16} color="#DC2626" />
                                            </View>
                                            <Text style={styles.cardText}>Emergency Help</Text>
                                        </View>
                                        <FontAwesome6 name="plus" size={14} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        ) : (
                            <ScrollView
                                ref={scrollViewRef}
                                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                                style={styles.chatContainer}
                                contentContainerStyle={{ padding: 20, paddingBottom: 0 }}
                            >
                                {messages.map((m, i) => {
                                    if (m.text === '[Session Ended]') {
                                        return (
                                            <View key={i} style={styles.sessionEndedContainer}>
                                                <View style={styles.sessionEndedLine} />
                                                <Text style={styles.sessionEndedText}>Session Ended</Text>
                                                <View style={styles.sessionEndedLine} />
                                            </View>
                                        );
                                    }

                                    const isLastMessage = i === messages.length - 1;

                                    return (
                                        <View key={i} style={[
                                            styles.messageBubble,
                                            m.sender === 'user' ? styles.userMsg : styles.botMsg
                                        ]}>
                                            <Text style={[
                                                styles.messageText,
                                                m.sender === 'user' ? { color: theme.card } : { color: theme.text }
                                            ]}>{m.text}</Text>

                                            {isLastMessage && m.action === "confirm_end" && (
                                                <View style={styles.confirmActionContainer}>
                                                    <TouchableOpacity style={styles.btnYes} onPress={handleConfirmEnd}>
                                                        <Text style={styles.btnYesText}>Yes</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity style={styles.btnNo} onPress={handleCancelEnd}>
                                                        <Text style={styles.btnNoText}>No</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}

                                {isPending && (
                                    <View style={[styles.messageBubble, styles.botMsg, { alignSelf: 'flex-start', paddingVertical: 12 }]}>
                                        <TypingIndicator />
                                    </View>
                                )}
                            </ScrollView>
                        )}

                        {isInputFocused && (
                            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]} >
                                    <BlurView 
                                        intensity={30} 
                                        tint="dark" 
                                        style={StyleSheet.absoluteFill} 
                                        experimentalBlurMethod="dimezisBlurView" 
                                    />
                                </View>
                            </TouchableWithoutFeedback>
                        )}

                        <View style={[
                            styles.inputWrapper,
                            isInputFocused && { zIndex: 11 },
                            isSessionEnded && { opacity: 0.6 },
                            Platform.OS === 'android' && !isRightDrawerOpen && { marginBottom: keyboardHeight > 0 ? keyboardHeight + 10 : 10 }
                        ]}>
                            <TextInput
                                style={styles.chatInput}
                                placeholder={isSessionEnded ? "This session has ended." : "Tell me what's on your mind today..."}
                                placeholderTextColor="#A0AEC0"
                                value={input}
                                onChangeText={setInput}
                                multiline
                                maxLength={1000}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                                editable={!isSessionEnded}
                            />
                            <View style={styles.inputFooter}>
                                <View style={styles.attachments}>

                                </View>
                                <TouchableOpacity
                                    style={[styles.sendBtn, isSessionEnded && { backgroundColor: '#CBD5E0' }]}
                                    onPress={handleSendMessage}
                                    disabled={isSessionEnded}
                                >
                                    <FontAwesome6 name="paper-plane" size={14} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                    </KeyboardAvoidingView>

                    <Text style={styles.disclaimer}>
                        Counselor.AI is an emotional support tool, not a licensed therapist. In emergencies, call 999.
                    </Text>
                </View>
            </View>

            {/* Right Drawer Overlay */}
            {isRightDrawerOpen && (
                <TouchableWithoutFeedback onPress={() => setIsRightDrawerOpen(false)}>
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }]} />
                </TouchableWithoutFeedback>
            )}

            {/* Right Drawer Panel */}
            <Animated.View style={[
                styles.rightDrawer,
                { transform: [{ translateX: slideAnim }] }
            ]}>
                <Pressable
                    style={{ flex: 1 }}
                    onPress={() => { setOpenDropdownId(null); Keyboard.dismiss(); }}
                >
                    <View style={styles.rightHeader}>
                        <Text style={styles.rightHeaderTitle}>Recent Sessions</Text>
                        <TouchableOpacity onPress={() => setIsRightDrawerOpen(false)} style={{ padding: 5 }}>
                            <FontAwesome6 name="xmark" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchWrapper}>
                        <FontAwesome6 name="magnifying-glass" size={14} color={theme.textSecondary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search sessions..."
                            placeholderTextColor="#A0AEC0"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    <ScrollView
                        style={styles.historyList}
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                        keyboardShouldPersistTaps="handled"
                        onScrollBeginDrag={() => {
                            setOpenDropdownId(null);
                            Keyboard.dismiss();
                        }}
                    >
                        {filteredSessions.length > 0 ? (
                            filteredSessions.map((session, index) => (
                                <TouchableOpacity
                                    key={session.id}
                                    style={[styles.historyItem, { zIndex: filteredSessions.length - index }]}
                                    onPress={() => handleLoadSession(session.id)}
                                >
                                    <View style={styles.historyIcon}><FontAwesome6 name="comment-dots" size={14} color={theme.textSecondary} /></View>
                                    <View style={styles.historyInfo}>
                                        <Text style={styles.historyTitle} numberOfLines={1}>
                                            {session.title ? (session.title.length > 20 ? session.title.substring(0, 20) + "..." : session.title) : "New Chat"}
                                        </Text>
                                        <Text style={styles.historyDate}>{new Date(session.updated_at).toLocaleDateString('en-GB')}</Text>
                                    </View>
                                    <View style={{ position: 'relative' }}>
                                        <TouchableOpacity
                                            style={{ padding: 10 }}
                                            onPress={(e) => {
                                                setOpenDropdownId(openDropdownId === session.id ? null : session.id);
                                            }}
                                        >
                                            <FontAwesome6 name="ellipsis" size={20} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                        {openDropdownId === session.id && (
                                            <TouchableOpacity
                                                style={styles.dropdownMenu}
                                                onPress={() => handleDeleteSession(session.id)}
                                            >
                                                <FontAwesome6 name="trash" size={14} color={theme.danger} style={{ marginRight: 8 }} />
                                                <Text style={styles.dropdownDanger}>Delete</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.noSessions}>
                                <Text style={styles.noSessionsText}>
                                    {searchQuery ? "No matching sessions found" : "No session history found"}
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </Pressable>
            </Animated.View>

            <EmergencyModal isOpen={isEmergencyModalOpen} onClose={() => setIsEmergencyModalOpen(false)} />
            <CheckinModal
                isOpen={isCheckinModalOpen}
                onClose={() => setIsCheckinModalOpen(false)}
                onSuccess={handleCheckinSuccess}
            />
            <FeedbackModal
                isOpen={isFeedbackModalOpen}
                chatId={chatId}
                onClose={() => setIsFeedbackModalOpen(false)}
                onSuccess={finishSession}
            />
            <ThankYouModal
                isOpen={isThankYouModalOpen}
                onClose={() => setIsThankYouModalOpen(false)}
            />
        </SafeAreaView>
    );
}



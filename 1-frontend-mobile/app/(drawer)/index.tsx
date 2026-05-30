import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, Keyboard, TouchableWithoutFeedback, Animated, Dimensions, Pressable, DeviceEventEmitter } from 'react-native';
import { BlurView } from 'expo-blur';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { DrawerToggleButton } from '@react-navigation/drawer';
import { useNavigation } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/Config';

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

export default function HomeScreen() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const navigation = useNavigation();

    // Chat Logic State
    const [chatId, setChatId] = useState<number | null>(null);
    const [isPending, setIsPending] = useState(false);
    const isSessionEnded = messages.length > 0 && messages[messages.length - 1].text === '[Session Ended]';

    // Right Drawer State
    const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

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

    useEffect(() => {
        fetchSessions();
    }, []);

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
    };

    const handleConfirmEnd = () => {
        finishSession();
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
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                enabled={!isRightDrawerOpen}
            >
                <View style={styles.mainContent}>
                    <View style={styles.customHeader}>
                        <DrawerToggleButton tintColor="#2D3748" />
                        <FontAwesome6 name="heart-pulse" size={20} color="#7C9A92" />
                        <Text style={styles.homebrandText}>Counselor.AI</Text>
                        <TouchableOpacity style={styles.headerRightIcon} onPress={() => setIsRightDrawerOpen(true)}>
                            <FontAwesome6 name="clock-rotate-left" size={20} color="#718096" />
                        </TouchableOpacity>
                    </View>
                    {messages.length === 0 ? (
                        <ScrollView contentContainerStyle={styles.welcomeSection}>
                            <View style={styles.welcomeHeader}>
                                <Text style={styles.welcomeTitle}>Welcome to Your Safe Space</Text>
                                <Text style={styles.welcomeSubtitle}>Start by checking in or discussing a specific issue. We are here to listen.</Text>
                            </View>

                            <View style={styles.actionGrid}>
                                <TouchableOpacity style={styles.actionCard}>
                                    <View style={styles.cardContent}>
                                        <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                                            <FontAwesome6 name="clipboard-check" size={16} color="#D97706" />
                                        </View>
                                        <Text style={styles.cardText}>Daily Check-in</Text>
                                    </View>
                                    <FontAwesome6 name="plus" size={14} color="#718096" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionCard}>
                                    <View style={styles.cardContent}>
                                        <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                                            <FontAwesome6 name="book-open" size={16} color="#2563EB" />
                                        </View>
                                        <Text style={styles.cardText}>Browse Resources</Text>
                                    </View>
                                    <FontAwesome6 name="plus" size={14} color="#718096" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionCard}>
                                    <View style={styles.cardContent}>
                                        <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
                                            <FontAwesome6 name="chart-line" size={16} color="#059669" />
                                        </View>
                                        <Text style={styles.cardText}>View Analysis</Text>
                                    </View>
                                    <FontAwesome6 name="plus" size={14} color="#718096" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionCard}>
                                    <View style={styles.cardContent}>
                                        <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                                            <FontAwesome6 name="phone-volume" size={16} color="#DC2626" />
                                        </View>
                                        <Text style={styles.cardText}>Emergency Help</Text>
                                    </View>
                                    <FontAwesome6 name="plus" size={14} color="#718096" />
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
                                            m.sender === 'user' ? { color: '#FFFFFF' } : { color: '#2D3748' }
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
                                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                            </View>
                        </TouchableWithoutFeedback>
                    )}

                    <View style={[styles.inputWrapper, isInputFocused && { zIndex: 11 }, isSessionEnded && { opacity: 0.6 }]}>
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
                                <TouchableOpacity style={styles.attachBtn} disabled={isSessionEnded}>
                                    <FontAwesome6 name="paperclip" size={16} color={isSessionEnded ? "#CBD5E0" : "#718096"} />
                                </TouchableOpacity>
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

                    <Text style={styles.disclaimer}>
                        Counselor.AI is an emotional support tool, not a licensed therapist. In emergencies, call 999.
                    </Text>
                </View>
            </KeyboardAvoidingView>

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
                            <FontAwesome6 name="xmark" size={20} color="#718096" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchWrapper}>
                        <FontAwesome6 name="magnifying-glass" size={14} color="#A0AEC0" />
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
                                    <View style={styles.historyIcon}><FontAwesome6 name="comment-dots" size={14} color="#718096" /></View>
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
                                            <FontAwesome6 name="ellipsis" size={20} color="#A0AEC0" />
                                        </TouchableOpacity>
                                        {openDropdownId === session.id && (
                                            <TouchableOpacity
                                                style={styles.dropdownMenu}
                                                onPress={() => handleDeleteSession(session.id)}
                                            >
                                                <FontAwesome6 name="trash" size={14} color="#E53E3E" style={{ marginRight: 8 }} />
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

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyboardView: {
        flex: 1,
    },
    mainContent: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 20,
        elevation: 3,
        position: 'relative',
        overflow: 'hidden',
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: '#2D3748',
    },
    homebrandText: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 19.2, // 1.2rem
        color: '#2D3748',
        marginLeft: 12,
    },
    welcomeSection: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        paddingBottom: 120, // space for input wrapper
    },
    welcomeHeader: {
        alignItems: 'center',
        marginBottom: 40,
    },
    welcomeTitle: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 28,
        color: '#2D3748',
        marginBottom: 10,
        textAlign: 'center',
    },
    welcomeSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: '#718096',
        textAlign: 'center',
    },
    actionGrid: {
        width: '100%',
        gap: 12,
    },
    actionCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: '#2D3748',
    },
    chatContainer: {
        flex: 1,
        marginBottom: 150, // space for input
    },
    messageBubble: {
        maxWidth: '85%',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 15,
    },
    userMsg: {
        alignSelf: 'flex-end',
        backgroundColor: '#7C9A92',
        borderBottomRightRadius: 2,
    },
    botMsg: {
        alignSelf: 'flex-start',
        backgroundColor: '#EBF3F1',
        borderBottomLeftRadius: 2,
    },
    messageText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15.2,
        lineHeight: 22,
    },
    inputWrapper: {
        position: 'absolute',
        bottom: 40,
        left: 16,
        right: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 30,
        elevation: 5,
    },
    chatInput: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#2D3748',
        maxHeight: 100,
        minHeight: 24,
        marginBottom: 12,
    },
    inputFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
    },
    attachments: {
        flexDirection: 'row',
    },
    attachBtn: {
        padding: 4,
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#7C9A92',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disclaimer: {
        position: 'absolute',
        bottom: 8,
        left: 16,
        right: 16,
        textAlign: 'center',
        fontFamily: 'Inter_400Regular',
        fontSize: 10,
        color: '#A0AEC0',
    },
    headerRightIcon: {
        width: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 'auto',
    },
    rightDrawer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        width: 320,
        backgroundColor: '#FFFFFF',
        zIndex: 101,
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        shadowColor: '#000',
        shadowOffset: { width: -5, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    rightHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    rightHeaderTitle: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 18,
        color: '#2D3748',
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchInput: {
        flex: 1,
        height: 40,
        marginLeft: 8,
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#2D3748',
    },
    historyList: {
        flex: 1,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    historyIcon: {
        width: 32,
        height: 32,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    historyInfo: {
        flex: 1,
    },
    historyTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: '#2D3748',
        marginBottom: 4,
    },
    historyDate: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#718096',
    },
    dropdownMenu: {
        position: 'absolute',
        top: 30,
        right: 0,
        backgroundColor: '#FFF5F5',
        borderWidth: 1,
        borderColor: '#FED7D7',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        width: 105,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    dropdownDanger: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#E53E3E',
    },
    noSessions: {
        alignItems: 'center',
        marginTop: 40,
    },
    noSessionsText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#A0AEC0',
    },
    sessionEndedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    sessionEndedLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    sessionEndedText: {
        paddingHorizontal: 15,
        fontSize: 14,
        fontFamily: 'Inter_500Medium',
        color: '#718096',
    },
    confirmActionContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 15,
    },
    btnYes: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnYesText: {
        color: '#FFFFFF',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
    },
    btnNo: {
        paddingVertical: 8,
        paddingHorizontal: 23,
        borderRadius: 8,
        backgroundColor: '#2D3748',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnNoText: {
        color: '#FFFFFF',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
    }
});

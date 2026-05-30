import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { DrawerToggleButton } from '@react-navigation/drawer';
import { useNavigation } from 'expo-router';

// Dummy interfaces to mock state for UI purposes before hooking into backend
interface Message {
    sender: 'user' | 'bot';
    text: string;
}

export default function HomeScreen() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);
    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => <DrawerToggleButton tintColor="#2D3748" />,
            headerTitle: 'AI Chat',
            headerTitleStyle: {
                fontFamily: 'Inter_600SemiBold',
                fontSize: 17.6,
                color: '#2D3748'
            },
            headerStyle: {
                backgroundColor: '#FFFFFF',
                shadowColor: 'transparent', // removes border on iOS
                elevation: 0, // removes border on android
            }
        });
    }, [navigation]);

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages([...messages, { sender: 'user', text: input }]);
        setInput('');
        
        // Mock bot response
        setTimeout(() => {
            setMessages(prev => [...prev, { sender: 'bot', text: 'I am here to listen. Tell me more.' }]);
        }, 1000);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                style={styles.keyboardView} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.mainContent}>
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
                            contentContainerStyle={{ padding: 20, paddingBottom: 20 }}
                        >
                            {messages.map((m, i) => (
                                <View key={i} style={[
                                    styles.messageBubble, 
                                    m.sender === 'user' ? styles.userMsg : styles.botMsg
                                ]}>
                                    <Text style={[
                                        styles.messageText, 
                                        m.sender === 'user' ? { color: '#FFFFFF' } : { color: '#2D3748' }
                                    ]}>{m.text}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.chatInput}
                            placeholder="Tell me what's on your mind today..."
                            placeholderTextColor="#A0AEC0"
                            value={input}
                            onChangeText={setInput}
                            multiline
                            maxLength={1000}
                        />
                        <View style={styles.inputFooter}>
                            <View style={styles.attachments}>
                                <TouchableOpacity style={styles.attachBtn}>
                                    <FontAwesome6 name="paperclip" size={16} color="#718096" />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                                <FontAwesome6 name="paper-plane" size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    <Text style={styles.disclaimer}>
                        Counselor.AI is an emotional support tool, not a licensed therapist. In emergencies, call 999.
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F4F3',
    },
    keyboardView: {
        flex: 1,
    },
    mainContent: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        margin: 16,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 20,
        elevation: 3,
        position: 'relative',
        overflow: 'hidden',
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
        marginBottom: 100, // space for input
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
        bottom: 24,
        left: 16,
        right: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 20,
        padding: 16,
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
        bottom: 6,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: 'Inter_400Regular',
        fontSize: 10,
        color: '#A0AEC0',
    }
});

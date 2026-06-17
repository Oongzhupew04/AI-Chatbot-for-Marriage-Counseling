import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import axios from 'axios';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getStyles } from './help.styles';
import { API_BASE_URL } from '../../constants/Config';
import { useTheme } from '../../context/ThemeContext';

interface FaqItem {
    id: number;
    question: string;
    answer: string;
}

export default function HelpScreen() {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const [faqs, setFaqs] = useState<FaqItem[]>([]);
    const [loading, setLoading] = useState(true);

    const handleContactSupport = async () => {
        const email = 'vincentoong12345@gmail.com';

        // Custom URL scheme to open the native Gmail app directly
        const gmailAppUrl = `googlegmail://co?to=${email}`;
        // Fallback to the web-based Gmail compose screen
        const webUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}`;

        try {
            // Try opening the Gmail app directly. 
            // We bypass canOpenURL because iOS blocks it without Info.plist queries configured.
            await Linking.openURL(gmailAppUrl);
        } catch (err) {
            // If it fails (e.g., app not installed), fallback to browser
            try {
                await Linking.openURL(webUrl);
            } catch (fallbackErr) {
                console.error("An error occurred opening mail client", fallbackErr);
            }
        }
    };

    useEffect(() => {
        const fetchFaqs = async () => {
            setLoading(true);
            try {
                // In a production environment with proper DNS/networking this would just be API_BASE_URL/api/faq
                // If using localhost on emulator, Config.ts correctly handles 10.0.2.2 or dev IP
                const response = await axios.get(`${API_BASE_URL}/api/faq`);
                if (response.data.success) {
                    setFaqs(response.data.faqs);
                }
            } catch (err) {
                console.error("Failed to fetch FAQs:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFaqs();
    }, []);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.mainContent}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Help & Support</Text>
                    <Text style={styles.subtitle}>Find answers and get in touch with our support team</Text>
                </View>
            </View>

            <View style={styles.helpContainer}>
                {/* FAQ Card */}
                <View style={styles.helpCard}>
                    <View style={styles.cardTitleContainer}>
                        <FontAwesome5 name="question-circle" style={styles.iconQuestion} />
                        <Text style={styles.cardTitle}>Frequently Asked Questions</Text>
                    </View>

                    <View style={styles.faqList}>
                        {loading ? (
                            <ActivityIndicator size="small" color="#7C9A92" style={styles.loadingIndicator} />
                        ) : faqs.length > 0 ? (
                            faqs.map((faq) => (
                                <View key={faq.id} style={styles.faqItem}>
                                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No FAQs available at the moment.</Text>
                        )}
                    </View>
                </View>

                {/* Contact Card */}
                <View style={styles.helpCard}>
                    <LinearGradient
                        colors={['rgba(16, 185, 129, 0.1)', 'rgba(59, 130, 246, 0.1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.contactSection}
                    >
                        <View style={styles.contactInfoContainer}>
                            <Text style={styles.contactInfoTitle}>Need more help?</Text>
                            <Text style={styles.contactInfoDesc}>Our support team is available 24/7 to assist you.</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.contactBtn}
                            onPress={handleContactSupport}
                            activeOpacity={0.8}
                        >
                            <FontAwesome5 name="envelope" style={styles.iconEnvelope} />
                            <Text style={styles.contactBtnText}>Contact Support</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </View>
        </ScrollView>
    );
}

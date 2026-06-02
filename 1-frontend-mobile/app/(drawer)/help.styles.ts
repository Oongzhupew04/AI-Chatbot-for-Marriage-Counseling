import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../context/ThemeContext';

export const getStyles = (theme: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background, // Matching var(--bg-body)
    },
    mainContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 26,
        color: theme.text,
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: theme.textSecondary,
        lineHeight: 22,
    },
    helpContainer: {
        flexDirection: 'column',
        gap: 30,
    },
    helpCard: {
        backgroundColor: theme.card,
        borderRadius: 20, // var(--radius-xl)
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 3,
    },
    cardTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: theme.border, // var(--border-light)
        paddingBottom: 15,
        marginBottom: 20,
        gap: 10,
    },
    cardTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: theme.text,
    },
    faqList: {
        flexDirection: 'column',
        gap: 15,
    },
    faqItem: {
        backgroundColor: theme.background, // var(--bg-hover)
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: theme.primary, // var(--primary-sage) fallback color based on web CSS #10B981, wait, web CSS has var(--primary-sage, #10B981). The web's primary sage is actually #7C9A92, but the css fallback had #10B981. Let's stick with #7C9A92 for consistency with the rest of the app.
    },
    faqQuestion: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: theme.text,
        marginBottom: 8,
    },
    faqAnswer: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: theme.textSecondary,
        lineHeight: 21,
    },
    loadingText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: theme.textSecondary,
        textAlign: 'center',
        paddingVertical: 20,
    },
    emptyText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: theme.textSecondary,
        textAlign: 'center',
        paddingVertical: 20,
    },
    contactSection: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    contactInfoContainer: {
        width: '100%',
        marginBottom: 15,
    },
    contactInfoTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: theme.text,
        marginBottom: 5,
    },
    contactInfoDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: theme.textSecondary,
        lineHeight: 18,
    },
    contactBtn: {
        backgroundColor: '#7C9A92', // var(--primary-sage)
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contactBtnText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: theme.card,
    }
});

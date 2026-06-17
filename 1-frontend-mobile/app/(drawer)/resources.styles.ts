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
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 26,
        color: theme.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: theme.textSecondary,
        marginTop: 15,
    },
    errorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    errorText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: theme.danger,
    },
    resourcesGrid: {
        gap: 20,
    },
    resourceCard: {
        backgroundColor: theme.card,
        borderRadius: 20, // var(--radius-xl)
        padding: 24,
        flexDirection: 'column',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    content: {
        flexDirection: 'column',
        gap: 8,
    },
    badgeContainer: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
        marginBottom: 6,
    },
    badgeText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 11,
        color: '#7C9A92', // var(--primary-sage)
        letterSpacing: 0.5,
    },
    resourceTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: theme.text,
        marginBottom: 6,
    },
    resourceDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: theme.textSecondary,
        lineHeight: 21,
    },
    iconResource: {
        fontSize: 24,
        color: '#7C9A92',
    }
});

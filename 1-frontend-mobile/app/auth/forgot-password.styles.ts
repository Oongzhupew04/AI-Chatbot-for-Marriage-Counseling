import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../context/ThemeContext';

export const getStyles = (theme: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    brand: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 40,
    },
    brandText: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 24,
        color: theme.text,
        marginLeft: 10,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 28,
        color: theme.text,
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: theme.textSecondary,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: theme.text,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        color: theme.text,
        backgroundColor: theme.card,
    },
    submitBtn: {
        backgroundColor: theme.primary,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
    },
    footerLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
        flexWrap: 'wrap',
    },
    footerText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: theme.textSecondary,
    },
    linkText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: theme.primary,
    }
});

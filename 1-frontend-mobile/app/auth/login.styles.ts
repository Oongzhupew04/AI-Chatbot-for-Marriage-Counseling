import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../context/ThemeContext';

export const getStyles = (theme: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.card,
        position: 'relative',
    },
    bgBlob: {
        position: 'absolute',
        width: 700,
        height: 700,
        borderRadius: 350,
        bottom: -200,
        left: -150,
        opacity: 0.6, // Soften to simulate blur
    },
    keyboardView: {
        flex: 1,
    },
    card: {
        flex: 1,
        backgroundColor: theme.card,
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        gap: 10,
    },
    brandText: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 24, // 1.5rem
        color: theme.text, // var(--text-main)
    },
    header: {
        marginBottom: 24,
        alignItems: 'center',
        width: '100%',
    },
    headerTitle: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 28, // 1.75rem
        color: theme.text,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15.2, // 0.95rem
        color: theme.textSecondary, // var(--text-muted)
    },
    googleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border, // var(--border-light)
        borderRadius: 12, // var(--radius-md)
        paddingVertical: 12,
        marginBottom: 24,
    },
    googleBtnText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15.2, // 0.95rem
        color: theme.text,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: theme.border,
    },
    dividerText: {
        fontFamily: 'Inter_400Regular',
        paddingHorizontal: 10,
        fontSize: 13.6, // 0.85rem
        color: theme.textSecondary,
    },
    formGroup: {
        width: '100%',
        marginBottom: 16,
    },
    label: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13.6, // 0.85rem
        color: theme.text,
        marginBottom: 8,
    },
    input: {
        fontFamily: 'Inter_400Regular',
        backgroundColor: theme.background, // var(--bg-hover)
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16, // 1rem
        color: theme.text,
    },
    disclaimerBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FDFDEA',
        borderWidth: 1,
        borderColor: '#F6E05E',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        width: '100%',
    },
    checkboxContainer: {
        marginRight: 10,
        marginTop: 2, // Slight offset to align with text
    },
    checkboxIcon: {
        // sizing managed in icon props
    },
    disclaimerText: {
        fontFamily: 'Inter_400Regular',
        flex: 1,
        fontSize: 12.8, // 0.8rem
        color: '#744210',
        lineHeight: 18,
    },
    submitBtn: {
        width: '100%',
        backgroundColor: '#7C9A92', // var(--primary-sage)
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 24,
    },
    submitBtnText: {
        fontFamily: 'Inter_600SemiBold',
        color: theme.card,
        fontSize: 16,
    },
    footerLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    footerText: {
        fontFamily: 'Inter_400Regular',
        color: theme.textSecondary,
        fontSize: 13,
    },
    linkText: {
        fontFamily: 'Inter_600SemiBold',
        color: '#7C9A92',
        fontSize: 13,
        textDecorationLine: 'underline',
    },
    forgotPasswordText: {
        fontFamily: 'Inter_500Medium',
        color: theme.textSecondary,
        fontSize: 13,
        textDecorationLine: 'underline',
    }
});

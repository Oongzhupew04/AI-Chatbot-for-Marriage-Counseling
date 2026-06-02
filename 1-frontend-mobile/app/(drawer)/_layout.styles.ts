import { StyleSheet, Platform } from 'react-native';
import { ThemeColors } from '../../context/ThemeContext';

export const getStyles = (theme: ThemeColors) => StyleSheet.create({
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        height: 56, // Standard header height
    },
    headerRightIcon: {
        width: 48,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 'auto',
    },
    homebrand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 30,
        marginLeft: 15,
    },
    homebrandText: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 19.2, // 1.2rem
        color: theme.text,
        marginLeft: 12,
    },
    divider: {
        height: 1,
        backgroundColor: theme.border,
        marginVertical: 15,
    },
    sectionHeader: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: theme.textSecondary,
        marginBottom: 10,
        marginLeft: 10,
    },
    historyItem: {
        flexDirection: 'row',
        gap: 12,
        padding: 10,
        borderRadius: 12,
        alignItems: 'center',
    },
    historyIcon: {
        width: 32,
        height: 32,
        backgroundColor: theme.background,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyInfo: {
        flex: 1,
    },
    historyTitle: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13.6,
        color: theme.text,
    },
    historyDate: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: theme.textSecondary,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 12,
    },
    navText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: theme.textSecondary,
    },
    userProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    avatarFallback: {
        width: 36,
        height: 36,
        backgroundColor: theme.textSecondary,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: theme.background,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14.4,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14.4,
        color: theme.text,
    },
    userEmail: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: theme.textSecondary,
    }
});

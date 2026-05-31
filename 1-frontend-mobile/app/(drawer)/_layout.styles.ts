import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
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
        color: '#2D3748',
        marginLeft: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 15,
    },
    sectionHeader: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: '#718096',
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
        backgroundColor: '#F8FAFC',
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
        color: '#2D3748',
    },
    historyDate: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#718096',
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
        color: '#718096',
    },
    userProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    avatarFallback: {
        width: 36,
        height: 36,
        backgroundColor: '#6B7C93',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14.4,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14.4,
        color: '#2D3748',
    },
    userEmail: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#718096',
    }
});

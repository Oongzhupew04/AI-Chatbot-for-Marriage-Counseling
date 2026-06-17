import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../context/ThemeContext';

export const getStyles = (theme: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    mainContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 24,
        color: theme.text,
    },
    subtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 4,
    },
    settingsGrid: {
        flexDirection: 'column',
        gap: 20,
    },
    settingCard: {
        backgroundColor: theme.card,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        flexDirection: 'column',
        gap: 15,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    settingCardDanger: {
        borderColor: theme.dangerBorder,
        backgroundColor: theme.dangerBg,
    },
    cardTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        paddingBottom: 10,
    },
    cardTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: theme.text,
    },
    cardTitleDanger: {
        color: theme.danger,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: theme.background,
    },
    settingInfo: {
        flex: 1,
        paddingRight: 10,
    },
    dangerSettingRow: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: theme.background,
        gap: 15,
    },
    dangerSettingInfo: {
        width: '100%',
    },
    settingInfoTitle: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: theme.text,
    },
    settingInfoTitleDanger: {
        color: theme.danger,
    },
    settingInfoDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: theme.textSecondary,
        marginTop: 2,
    },
    actionBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1,
    },
    actionBtnText: {
        fontFamily: 'Inter_600SemiBold',
        color: theme.text,
        fontSize: 14,
    },
    dangerBtn: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: theme.danger,
        shadowColor: theme.danger,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 2,
    },
    dangerBtnText: {
        fontFamily: 'Inter_600SemiBold',
        color: '#FFFFFF',
        fontSize: 14,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBell: {
        fontSize: 16,
        color: '#F59E0B',
    },
    iconBrush: {
        fontSize: 16,
        color: '#3B82F6',
    },
    iconLock: {
        fontSize: 16,
        color: '#10B981',
    },
    cardTitleContainerDanger: {
        borderBottomColor: '#FCA5A5',
    },
    iconWarning: {
        fontSize: 16,
        color: '#EF4444',
    }
});

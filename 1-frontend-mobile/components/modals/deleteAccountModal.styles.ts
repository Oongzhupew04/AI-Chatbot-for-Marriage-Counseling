import { StyleSheet, Dimensions } from 'react-native';
import { ThemeColors } from '../../context/ThemeContext';

const { height } = Dimensions.get('window');

export const getStyles = (theme: ThemeColors) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: theme.card,
        width: '90%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 24,
        maxHeight: height * 0.8,
        alignItems: 'center',
    },
    warningIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.dangerBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 20,
        color: theme.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    warningText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    errorText: {
        fontFamily: 'Inter_500Medium',
        color: theme.danger,
        fontSize: 14,
        marginBottom: 15,
        textAlign: 'center',
        backgroundColor: theme.dangerBg,
        padding: 10,
        borderRadius: 8,
        width: '100%',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        width: '100%',
    },
    btnCancel: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnCancelText: {
        fontFamily: 'Inter_600SemiBold',
        color: theme.text,
        fontSize: 15,
        textAlign: 'center',
    },
    btnDelete: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: theme.danger,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnDeleteText: {
        fontFamily: 'Inter_600SemiBold',
        color: theme.card,
        fontSize: 15,
        textAlign: 'center',
    },
    iconWarning: {
        fontSize: 24,
        color: '#EF4444',
    },
    btnDeleteDisabled: {
        opacity: 0.7,
    }
});

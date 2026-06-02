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
    },
    modalTitle: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 20,
        color: theme.text,
        marginBottom: 20,
        textAlign: 'center',
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
    },
    successText: {
        fontFamily: 'Inter_500Medium',
        color: '#38A169',
        fontSize: 14,
        marginBottom: 15,
        textAlign: 'center',
        backgroundColor: '#F0FFF4',
        padding: 10,
        borderRadius: 8,
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
        fontFamily: 'Inter_400Regular',
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: theme.text,
        backgroundColor: theme.background,
    },
    otpContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    otpInput: {
        flex: 1,
    },
    sendOtpBtn: {
        borderWidth: 1,
        borderColor: theme.primary,
        borderRadius: 8,
        paddingHorizontal: 15,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    sendOtpBtnText: {
        fontFamily: 'Inter_600SemiBold',
        color: theme.primary,
        fontSize: 14,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 20,
    },
    btnCancel: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: theme.border,
    },
    btnCancelText: {
        fontFamily: 'Inter_600SemiBold',
        color: theme.text,
        fontSize: 15,
    },
    btnSubmit: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: theme.primary,
        alignItems: 'center',
    },
    btnSubmitText: {
        fontFamily: 'Inter_600SemiBold',
        color: theme.card,
        fontSize: 15,
    }
});

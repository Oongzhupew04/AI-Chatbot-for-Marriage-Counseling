import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../context/ThemeContext';

export const getStyles = (theme: ThemeColors) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: theme.card,
        width: '90%',
        maxWidth: 500,
        maxHeight: '90%',
        flexShrink: 1,
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        borderLeftWidth: 10,
        borderLeftColor: theme.danger,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 50,
        elevation: 10,
    },
    iconCircle: {
        marginBottom: 20,
    },
    heading: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 24,
        color: theme.text,
        marginBottom: 10,
        textAlign: 'center',
    },
    text: {
        fontFamily: 'Inter_400Regular',
        color: theme.textSecondary,
        marginBottom: 25,
        lineHeight: 22,
        textAlign: 'center',
        fontSize: 15,
    },
    contactsBox: {
        backgroundColor: theme.dangerBg,
        borderRadius: 12,
        padding: 20,
        width: '100%',
        marginBottom: 25,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    contactRowLast: {
        marginBottom: 0,
    },
    contactIcon: {
        marginRight: 15,
        fontSize: 20,
        color: theme.danger,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontFamily: 'Inter_600SemiBold',
        color: theme.text,
        fontSize: 15,
        marginBottom: 2,
    },
    contactNumber: {
        fontFamily: 'Inter_700Bold',
        color: theme.danger,
        fontSize: 17,
    },
    button: {
        backgroundColor: theme.textSecondary,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 30,
        alignItems: 'center',
    },
    buttonText: {
        color: theme.card,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
    },
    scrollContent: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    iconLifeRing: {
        fontSize: 60,
        color: theme.danger,
    }
});

import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../context/ThemeContext';

export const getStyles = (theme: ThemeColors) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: theme.card,
        paddingVertical: 32,
        paddingHorizontal: 24,
        borderRadius: 16,
        width: '85%',
        maxWidth: 380,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#7C9A92',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    heading: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
        fontFamily: 'Inter_600SemiBold',
    },
    text: {
        fontSize: 15,
        color: '#6B7280',
        marginBottom: 28,
        lineHeight: 22,
        textAlign: 'center',
        fontFamily: 'Inter_400Regular',
    },
    button: {
        backgroundColor: '#7C9A92',
        paddingVertical: 14,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
        fontFamily: 'Inter_600SemiBold',
    },
});

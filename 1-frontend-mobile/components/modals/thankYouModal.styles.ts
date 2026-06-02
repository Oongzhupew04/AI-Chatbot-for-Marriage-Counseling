import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../context/ThemeContext';

export const getStyles = (theme: ThemeColors) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: theme.card,
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
        width: '80%',
        maxWidth: 400,
    },
    icon: {
        marginBottom: 20,
    },
    heading: {
        fontFamily: 'Merriweather_700Bold',
        fontSize: 24,
        marginBottom: 10,
        color: theme.text,
        textAlign: 'center',
    },
    text: {
        color: theme.textSecondary,
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        textAlign: 'center',
    }
});

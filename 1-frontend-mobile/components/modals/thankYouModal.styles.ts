import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: '#FFFFFF',
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
        color: '#2D3748',
        textAlign: 'center',
    },
    text: {
        color: '#718096',
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        textAlign: 'center',
    }
});

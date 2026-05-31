import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        width: '90%',
        maxWidth: 500,
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        borderLeftWidth: 10,
        borderLeftColor: '#E53E3E',
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
        color: '#2D3748',
        marginBottom: 10,
        textAlign: 'center',
    },
    text: {
        fontFamily: 'Inter_400Regular',
        color: '#718096',
        marginBottom: 25,
        lineHeight: 22,
        textAlign: 'center',
        fontSize: 15,
    },
    contactsBox: {
        backgroundColor: '#FFF5F5',
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
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontFamily: 'Inter_600SemiBold',
        color: '#2D3748',
        fontSize: 15,
        marginBottom: 2,
    },
    contactNumber: {
        fontFamily: 'Inter_700Bold',
        color: '#E53E3E',
        fontSize: 17,
    },
    button: {
        backgroundColor: '#718096',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 30,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
    },
});

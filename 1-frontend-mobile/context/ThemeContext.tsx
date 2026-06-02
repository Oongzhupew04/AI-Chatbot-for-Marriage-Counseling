import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../constants/Config';

export interface ThemeColors {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    danger: string;
    dangerBg: string;
    dangerBorder: string;
    iconPrimary: string;
    iconSecondary: string;
}

export const lightTheme: ThemeColors = {
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#2D3748',
    textSecondary: '#718096',
    border: '#E2E8F0',
    primary: '#7C9A92',
    danger: '#EF4444',
    dangerBg: '#FEF2F2',
    dangerBorder: '#FCA5A5',
    iconPrimary: '#3B82F6',
    iconSecondary: '#F59E0B',
};

export const darkTheme: ThemeColors = {
    background: '#0F172A',
    card: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
    primary: '#7C9A92',
    danger: '#F87171',
    dangerBg: '#451A1A',
    dangerBorder: '#991B1B',
    iconPrimary: '#60A5FA',
    iconSecondary: '#FCD34D',
};

interface ThemeContextProps {
    isDarkMode: boolean;
    theme: ThemeColors;
    toggleDarkMode: (value: boolean) => Promise<void>;
    isLoadingTheme: boolean;
}

const ThemeContext = createContext<ThemeContextProps>({
    isDarkMode: false,
    theme: lightTheme,
    toggleDarkMode: async () => { },
    isLoadingTheme: true,
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const systemColorScheme = useColorScheme();
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [isLoadingTheme, setIsLoadingTheme] = useState(true);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const storedPref = await AsyncStorage.getItem('dark_mode_enabled');
                if (storedPref !== null) {
                    setIsDarkMode(storedPref === 'true');
                } else {
                    // Fallback to system setting if no preference is saved
                    setIsDarkMode(systemColorScheme === 'dark');
                }
            } catch (error) {
                console.error('Failed to load theme preference', error);
            } finally {
                setIsLoadingTheme(false);
            }
        };

        loadTheme();
    }, [systemColorScheme]);

    const toggleDarkMode = async (value: boolean) => {
        setIsDarkMode(value);
        try {
            await AsyncStorage.setItem('dark_mode_enabled', String(value));

            // Also notify backend if authenticated
            const token = await AsyncStorage.getItem('token');
            if (token) {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.put(`${API_BASE_URL}/api/settings/darkmode`, { darkModeEnabled: value }, config)
                    .catch(e => console.error("Failed to sync dark mode to server", e));
            }
        } catch (error) {
            console.error('Failed to save theme preference', error);
        }
    };

    const theme = isDarkMode ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{ isDarkMode, theme, toggleDarkMode, isLoadingTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);

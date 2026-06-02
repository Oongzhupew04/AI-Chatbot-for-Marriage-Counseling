import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar, Modal, FlatList } from 'react-native';
import { useRouter, Link } from 'expo-router';
// Custom dropdown avoids iOS wheel
import axios from 'axios';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../constants/Config';
import DishonestyModal from '../../components/modals/dishonestyModal';
import RegistrationOtpModal from '../../components/modals/registrationOtpModal';
import { LinearGradient } from 'expo-linear-gradient';
import { getStyles } from './register.styles';
import { useTheme } from '../../context/ThemeContext';

const CustomDropdown = ({ label, value, options, onSelect, style }: { label: string, value: string, options: { label: string, value: string }[], onSelect: (val: string) => void, style?: any }) => {
    const [visible, setVisible] = useState(false);
    const selectedLabel = options.find(o => o.value === value)?.label || 'Select...';

    return (
        <View style={[styles.formGroup, style]}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity style={styles.dropdownInput} onPress={() => setVisible(true)}>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: value ? '#2D3748' : '#A0AEC0' }}>{selectedLabel}</Text>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="slide">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label}</Text>
                        </View>
                        <FlatList
                            data={options}
                            keyExtractor={item => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.dropdownItem, value === item.value && styles.dropdownItemSelected]}
                                    onPress={() => { onSelect(item.value); setVisible(false); }}
                                >
                                    <Text style={[styles.dropdownItemText, value === item.value && styles.dropdownItemTextSelected]}>{item.label}</Text>
                                    {value === item.value && <Ionicons name="checkmark" size={20} color="#7C9A92" />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default function RegisterScreen() {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', confirm_password: '',
        sex: '', age: '', years_married: '', children_count: '',
        children_raised: '', education: '', material_situation: '',
        religious_affiliation: '', religiousness: '',
        q13: '', q17: '', q19: '', q20: '',
        privacy_policy: false, ai_consent: false
    });

    const [error, setError] = useState('');
    const [isValid, setIsValid] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpError, setOtpError] = useState('');
    const router = useRouter();

    useEffect(() => {
        validateForm();
    }, [formData]);

    const validateForm = () => {
        const { email, password, confirm_password, privacy_policy, ai_consent } = formData;
        let errorMessage = "";
        let valid = true;

        if (email && !email.includes('@')) { errorMessage = "Email Address must contain an '@' symbol."; valid = false; }
        else if (password.length > 0) {
            if (password.length < 8) { errorMessage = "Password must be at least 8 characters."; valid = false; }
            else if (!/[A-Z]/.test(password)) { errorMessage = "Password must contain an uppercase letter."; valid = false; }
            else if (!/[a-z]/.test(password)) { errorMessage = "Password must contain a lowercase letter."; valid = false; }
            else if (!/[0-9]/.test(password)) { errorMessage = "Password must contain a number."; valid = false; }
        } else { valid = false; }

        if (confirm_password.length > 0 && password !== confirm_password) {
            errorMessage = "Passwords do not match!";
            valid = false;
        }

        const requiredFields = [
            'sex', 'age', 'years_married', 'children_count',
            'children_raised', 'education', 'material_situation', 'religious_affiliation',
            'religiousness', 'q13', 'q17', 'q19', 'q20'
        ];
        const hasEmptyFields = requiredFields.some(field => (formData as any)[field] === '');

        if (valid && hasEmptyFields) {
            errorMessage = "Please complete ALL Personal Information and Relationship Assessment.";
            valid = false;
        }

        if (valid && password === confirm_password && (!privacy_policy || !ai_consent)) {
            errorMessage = "You must accept the terms and AI consent.";
            valid = false;
        }

        setError(errorMessage);
        setIsValid(valid && password === confirm_password && privacy_policy && ai_consent);
    };

    const handleChange = (name: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!isValid) return;

        try {
            setIsSubmitting(true);
            setError('');
            const response = await axios.post(`${API_BASE_URL}/api/auth/request-registration-otp`, { email: formData.email });
            if (response.data.success) setShowOtpModal(true);
            else setError(response.data.message || "Failed to send OTP.");
        } catch (err: any) {
            setError(err.response?.data?.error || "Could not connect to server.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyAndRegister = async () => {
        try {
            setIsSubmitting(true);
            setOtpError('');
            const response = await axios.post(`${API_BASE_URL}/api/auth/register`, { ...formData, otp });
            if (response.data.success) {
                setShowOtpModal(false);
                if (response.data.dishonesty_detected) setShowPopup(true);
                else Alert.alert("Success", "Account created successfully!", [{ text: "OK", onPress: () => router.replace('/auth/login') }]);
            } else setOtpError(response.data.message || "Registration failed.");
        } catch (err: any) {
            setOtpError(err.response?.data?.error || "Could not connect to server.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderPicker = (label: string, name: keyof typeof formData, options: { label: string, value: string }[], style?: any) => (
        <CustomDropdown
            label={label}
            value={(formData as any)[name] as string}
            options={options}
            onSelect={(val) => handleChange(name, val)}
            style={style}
        />
    );

    const scale1Options = [
        { label: "1 - Yes", value: "1" }, { label: "2 - Rather yes", value: "2" },
        { label: "3 - Neither yes nor no", value: "3" }, { label: "4 - Rather not", value: "4" }, { label: "5 - No", value: "5" }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.card} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    <View style={styles.card}>
                        <View style={styles.brandContainer}>
                            <FontAwesome6 name="heart-pulse" size={22} color="#7C9A92" />
                            <Text style={styles.brandText}>Counselor.AI</Text>
                        </View>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Create your account</Text>
                            <Text style={styles.headerSubtitle}>Start your journey towards a healthier relationship.</Text>
                        </View>

                        {/* Account Basics */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Username / Full Name</Text>
                            <TextInput style={styles.input} value={formData.username} onChangeText={(val) => handleChange('username', val)} />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput style={styles.input} value={formData.email} onChangeText={(val) => handleChange('email', val)} keyboardType="email-address" autoCapitalize="none" />
                        </View>

                        <View style={styles.formRow}>
                            <View style={[styles.formGroup, { width: '48%' }]}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput style={styles.input} value={formData.password} onChangeText={(val) => handleChange('password', val)} secureTextEntry />
                            </View>
                            <View style={[styles.formGroup, { width: '48%' }]}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <TextInput style={styles.input} value={formData.confirm_password} onChangeText={(val) => handleChange('confirm_password', val)} secureTextEntry />
                            </View>
                        </View>

                        <View style={styles.dividerLine} />
                        <Text style={styles.sectionTitle}>Personal Information</Text>

                        <View style={styles.formRow}>
                            {renderPicker("Sex", "sex", [{ label: "Male", value: "Male" }, { label: "Female", value: "Female" }], { width: '48%' })}
                            <View style={[styles.formGroup, { width: '48%' }]}>
                                <Text style={styles.label}>Age</Text>
                                <TextInput style={styles.input} value={formData.age} onChangeText={(val) => handleChange('age', val)} keyboardType="number-pad" />
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Years Married</Text>
                            <TextInput style={styles.input} value={formData.years_married} onChangeText={(val) => handleChange('years_married', val)} keyboardType="number-pad" />
                        </View>

                        <View style={styles.formRow}>
                            <View style={[styles.formGroup, { width: '48%', marginTop: 18 }]}>
                                <Text style={styles.label}>Children (Total)</Text>
                                <TextInput style={styles.input} value={formData.children_count} onChangeText={(val) => handleChange('children_count', val)} keyboardType="number-pad" />
                            </View>
                            <View style={[styles.formGroup, { width: '48%' }]}>
                                <Text style={styles.label}>Children Raised Presently</Text>
                                <TextInput style={styles.input} value={formData.children_raised} onChangeText={(val) => handleChange('children_raised', val)} keyboardType="number-pad" />
                            </View>
                        </View>

                        {renderPicker("Education", "education", [
                            { label: "No formal education", value: "No formal education" }, { label: "Primary school", value: "Primary school" },
                            { label: "Secondary school", value: "Secondary school" }, { label: "High school/college", value: "High school or technical college" },
                            { label: "Bachelor/Masters", value: "Bachelor or masters degree" }
                        ])}
                        {renderPicker("Material Situation (compared to Average People)", "material_situation", [
                            { label: "Much better", value: "Much better" }, { label: "Better", value: "Better" },
                            { label: "Similar", value: "Similar" }, { label: "Worse", value: "Worse" }, { label: "Much worse", value: "Much worse" }
                        ])}
                        {renderPicker("Religious Affiliation", "religious_affiliation", [
                            { label: "Protestant", value: "Protestant" }, { label: "Catholic", value: "Catholic" },
                            { label: "Jewish", value: "Jewish" }, { label: "Muslim", value: "Muslim" },
                            { label: "Buddhist", value: "Buddhist" }, { label: "None", value: "None" },
                            { label: "Other", value: "Other" }
                        ])}
                        {renderPicker("Religiousness (1-7)", "religiousness", [
                            { label: "1 - Not at all", value: "1" }, { label: "2", value: "2" }, { label: "3", value: "3" },
                            { label: "4 - Moderately", value: "4" }, { label: "5", value: "5" }, { label: "6", value: "6" }, { label: "7 - Extremely", value: "7" }
                        ])}

                        <View style={styles.dividerLine} />
                        <Text style={styles.sectionTitle}>Relationship Assessment</Text>

                        {renderPicker("Do you find your spouse attractive?", "q13", scale1Options)}
                        {renderPicker("Are you proud of your spouse?", "q17", scale1Options)}
                        {renderPicker("Do you love your spouse?", "q19", scale1Options)}
                        {renderPicker("Overall, how satisfied are you with your marriage?", "q20", [
                            { label: "1 - Very dissatisfied", value: "1" }, { label: "2", value: "2" },
                            { label: "3", value: "3" }, { label: "4", value: "4" }, { label: "5 - Very satisfied", value: "5" }
                        ])}

                        <View style={styles.dividerLine} />

                        <TouchableOpacity style={styles.checkboxRow} onPress={() => handleChange('privacy_policy', !formData.privacy_policy)}>
                            <Ionicons name={formData.privacy_policy ? "checkbox" : "square-outline"} size={22} color={formData.privacy_policy ? "#7C9A92" : "#718096"} />
                            <Text style={styles.checkboxLabel}>I agree to the Privacy Policy.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.checkboxRow} onPress={() => handleChange('ai_consent', !formData.ai_consent)}>
                            <Ionicons name={formData.ai_consent ? "checkbox" : "square-outline"} size={22} color={formData.ai_consent ? "#7C9A92" : "#718096"} />
                            <Text style={styles.checkboxLabel}>I consent to AI-assisted emotional support.</Text>
                        </TouchableOpacity>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <TouchableOpacity style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={!isValid || isSubmitting}>
                            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Account</Text>}
                        </TouchableOpacity>

                        <View style={styles.footerLinks}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <Link href="/auth/login" asChild>
                                <TouchableOpacity><Text style={styles.linkText}>Sign in</Text></TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            {showPopup && <DishonestyModal onClose={() => { setShowPopup(false); router.replace('/auth/login'); }} />}
            <RegistrationOtpModal isOpen={showOtpModal} email={formData.email} otp={otp} setOtp={setOtp} otpError={otpError} isSubmitting={isSubmitting} onClose={() => setShowOtpModal(false)} onSubmit={handleVerifyAndRegister} />
        </SafeAreaView>
    );
}



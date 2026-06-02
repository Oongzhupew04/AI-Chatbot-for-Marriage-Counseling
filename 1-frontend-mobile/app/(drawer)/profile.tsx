import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, DeviceEventEmitter, Alert, Modal, FlatList } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStyles } from './profile.styles';
import { API_BASE_URL } from '../../constants/Config';
import { useTheme } from '../../context/ThemeContext';

interface UserProfile {
    id: number;
    username: string;
    email: string;
    role: string;
    sex?: string;
    age?: number;
    years_married?: number;
    children_count?: number;
    children_raised?: number;
    education?: string;
    religious_affiliation?: string;
    profile_pic?: string;
}

const CustomDropdown = ({ label, value, options, onSelect, style }: { label: string, value: string, options: { label: string, value: string }[], onSelect: (val: string) => void, style?: any }) => {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const [visible, setVisible] = useState(false);
    const selectedLabel = options.find(o => o.value === value)?.label || 'Select...';

    return (
        <View style={[style]}>
            <TouchableOpacity style={styles.dropdownInput} onPress={() => setVisible(true)}>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: value ? theme.text : theme.textSecondary }}>{selectedLabel}</Text>
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

export default function ProfileScreen() {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

    const getFinalPicUrl = (url: string | undefined) => {
        if (!url) return null;
        if (url.startsWith('http://localhost:3000')) {
            return url.replace('http://localhost:3000', API_BASE_URL);
        } else if (url.startsWith('/')) {
            return `${API_BASE_URL}${url}`;
        }
        return url;
    };

    useEffect(() => {
        const fetchProfile = async () => {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            setLoading(true);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.get(`${API_BASE_URL}/api/users/profile`, config);
                if (response.data.success) {
                    setProfile(response.data.profile);
                    setEditForm(response.data.profile);
                    if (response.data.profile.profile_pic) {
                        await AsyncStorage.setItem('profilePic', response.data.profile.profile_pic);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleImageUpload = async () => {
        // Ask the user for the permission to access the media library
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "You've refused to allow this app to access your photos!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            // Prepare the FormData
            const formData = new FormData();
            
            // Extract filename from URI
            const uriParts = asset.uri.split('/');
            const fileName = uriParts[uriParts.length - 1];
            
            // Extract type from URI or default to jpeg
            const match = /\.(\w+)$/.exec(fileName);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            formData.append('profile_pic', {
                uri: asset.uri,
                name: fileName,
                type,
            } as any);

            try {
                const config = {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                };
                const response = await axios.post(`${API_BASE_URL}/api/users/profile-pic`, formData, config);
                if (response.data.success) {
                    const newPicUrl = response.data.profile_pic;
                    setProfile(prev => prev ? { ...prev, profile_pic: newPicUrl } : null);
                    await AsyncStorage.setItem('profilePic', newPicUrl);
                } else {
                    Alert.alert("Error", "Failed to upload profile picture.");
                }
            } catch (err) {
                console.error("Failed to upload profile picture:", err);
                Alert.alert("Error", "An error occurred while uploading.");
            }
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
        if (profile) setEditForm(profile);
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        if (profile) setEditForm(profile);
    };

    const handleSaveClick = async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.put(`${API_BASE_URL}/api/users/profile`, editForm, config);
            if (response.data.success) {
                setProfile({ ...profile, ...editForm } as UserProfile);
                if (editForm.username) {
                    await AsyncStorage.setItem('username', editForm.username);
                }
                setIsEditing(false);
                DeviceEventEmitter.emit('profileUpdated');
            }
        } catch (err) {
            console.error("Failed to update profile:", err);
            Alert.alert("Error", "Failed to save profile updates.");
        }
    };

    const handleInputChange = (name: keyof UserProfile, value: string | number | undefined) => {
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading && !profile) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Error loading profile. Please log in again.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.mainContent}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>My Profile</Text>
                    <Text style={styles.subtitle}>Manage your personal information</Text>
                </View>
            </View>

            <View style={styles.profileContainer}>
                {/* Header Card */}
                <LinearGradient
                    colors={['rgba(16, 185, 129, 0.15)', 'rgba(59, 130, 246, 0.15)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.profileHeaderCard}
                >
                    <View style={styles.avatarContainer}>
                        {getFinalPicUrl(profile.profile_pic) ? (
                            <Image 
                                source={{ uri: getFinalPicUrl(profile.profile_pic)! }} 
                                style={styles.avatarImage} 
                                contentFit="cover"
                            />
                        ) : (
                            <FontAwesome5 name="user" size={40} color={theme.primary} />
                        )}
                        <TouchableOpacity style={styles.editAvatarBtn} onPress={handleImageUpload} activeOpacity={0.8}>
                            <FontAwesome5 name="camera" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{profile.username}</Text>
                        <Text style={styles.profileEmail}>{profile.email}</Text>
                        <View style={styles.statusBadge}>
                            <FontAwesome5 name={profile.role === 'admin' ? "shield-alt" : "user-check"} size={12} color="#059669" />
                            <Text style={styles.statusBadgeText}>{profile.role === 'admin' ? 'Admin' : 'User'}</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Details Card */}
                <View style={styles.profileDetailsCard}>
                    <View style={styles.cardTitleContainer}>
                        <FontAwesome5 name="address-card" size={18} color="#F59E0B" />
                        <Text style={styles.cardTitle}>Personal Details</Text>

                        {!isEditing ? (
                            <TouchableOpacity style={styles.editBtn} onPress={handleEditClick}>
                                <FontAwesome5 name="pen" size={12} color={theme.text} />
                                <Text style={styles.editBtnText}>Edit</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.editBtnGroup}>
                                <TouchableOpacity style={styles.editBtn} onPress={handleCancelClick}>
                                    <Text style={styles.editBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.editBtn, styles.editBtnActive]} onPress={handleSaveClick}>
                                    <FontAwesome5 name="save" size={12} color="#FFFFFF" />
                                    <Text style={[styles.editBtnText, styles.editBtnTextActive]}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.detailsGrid}>
                        {/* Full Name */}
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Full Name</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.inputField}
                                    value={editForm.username || ''}
                                    onChangeText={(val) => handleInputChange('username', val)}
                                />
                            ) : (
                                <Text style={styles.detailValue}>{profile.username}</Text>
                            )}
                        </View>
                        
                        {/* Email Address */}
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Email Address</Text>
                            <Text style={styles.detailValue}>{profile.email}</Text>
                        </View>

                        {/* Sex and Age Row */}
                        <View style={{ flexDirection: 'row', gap: 15 }}>
                            {/* Sex */}
                            <View style={[styles.detailItem, { flex: 1 }]}>
                                <Text style={styles.detailLabel}>Sex</Text>
                                {isEditing ? (
                                    <CustomDropdown
                                        label="Sex"
                                        value={editForm.sex || ''}
                                        options={[
                                            { label: "Male", value: "Male" },
                                            { label: "Female", value: "Female" }
                                        ]}
                                        onSelect={(val) => handleInputChange('sex', val)}
                                    />
                                ) : (
                                    <Text style={styles.detailValue}>{profile.sex || 'Not provided'}</Text>
                                )}
                            </View>

                            {/* Age */}
                            <View style={[styles.detailItem, { flex: 1 }]}>
                                <Text style={styles.detailLabel}>Age</Text>
                                {isEditing ? (
                                    <TextInput
                                        style={styles.inputField}
                                        value={editForm.age !== undefined && editForm.age !== null ? editForm.age.toString() : ''}
                                        onChangeText={(val) => handleInputChange('age', val ? parseInt(val) : undefined)}
                                        keyboardType="numeric"
                                    />
                                ) : (
                                    <Text style={styles.detailValue}>{profile.age || 'Not provided'}</Text>
                                )}
                            </View>
                        </View>

                        {/* Years Married and Children Count Row */}
                        <View style={{ flexDirection: 'row', gap: 15 }}>
                            {/* Years Married */}
                            <View style={[styles.detailItem, { flex: 1 }]}>
                                <Text style={styles.detailLabel}>Years Married</Text>
                                {isEditing ? (
                                    <TextInput
                                        style={styles.inputField}
                                        value={editForm.years_married !== undefined && editForm.years_married !== null ? editForm.years_married.toString() : ''}
                                        onChangeText={(val) => handleInputChange('years_married', val ? parseInt(val) : undefined)}
                                        keyboardType="numeric"
                                    />
                                ) : (
                                    <Text style={styles.detailValue}>{profile.years_married ?? 'Not provided'}</Text>
                                )}
                            </View>

                            {/* Children Count */}
                            <View style={[styles.detailItem, { flex: 1 }]}>
                                <Text style={styles.detailLabel}>Children Count</Text>
                                {isEditing ? (
                                    <TextInput
                                        style={styles.inputField}
                                        value={editForm.children_count !== undefined && editForm.children_count !== null ? editForm.children_count.toString() : ''}
                                        onChangeText={(val) => handleInputChange('children_count', val ? parseInt(val) : undefined)}
                                        keyboardType="numeric"
                                    />
                                ) : (
                                    <Text style={styles.detailValue}>{profile.children_count ?? 'Not provided'}</Text>
                                )}
                            </View>
                        </View>

                        {/* Children Raised and empty space for grid */}
                        <View style={{ flexDirection: 'row', gap: 15 }}>
                            {/* Children Raised */}
                            <View style={[styles.detailItem, { flex: 1 }]}>
                                <Text style={styles.detailLabel}>Children Raised</Text>
                                {isEditing ? (
                                    <TextInput
                                        style={styles.inputField}
                                        value={editForm.children_raised !== undefined && editForm.children_raised !== null ? editForm.children_raised.toString() : ''}
                                        onChangeText={(val) => handleInputChange('children_raised', val ? parseInt(val) : undefined)}
                                        keyboardType="numeric"
                                    />
                                ) : (
                                    <Text style={styles.detailValue}>{profile.children_raised ?? 'Not provided'}</Text>
                                )}
                            </View>
                            <View style={{ flex: 1 }} />
                        </View>

                        {/* Education */}
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Education</Text>
                            {isEditing ? (
                                <CustomDropdown
                                    label="Education"
                                    value={editForm.education || ''}
                                    options={[
                                        { label: "No formal education", value: "No formal education" },
                                        { label: "Primary school", value: "Primary school" },
                                        { label: "Secondary school", value: "Secondary school" },
                                        { label: "High school or technical college", value: "High school or technical college" },
                                        { label: "Bachelor or masters degree", value: "Bachelor or masters degree" }
                                    ]}
                                    onSelect={(val) => handleInputChange('education', val)}
                                />
                            ) : (
                                <Text style={styles.detailValue}>{profile.education || 'Not provided'}</Text>
                            )}
                        </View>

                        {/* Religious Affiliation */}
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Religious Affiliation</Text>
                            {isEditing ? (
                                <CustomDropdown
                                    label="Religious Affiliation"
                                    value={editForm.religious_affiliation || ''}
                                    options={[
                                        { label: "Protestant", value: "Protestant" },
                                        { label: "Catholic", value: "Catholic" },
                                        { label: "Jewish", value: "Jewish" },
                                        { label: "Muslim", value: "Muslim" },
                                        { label: "Buddhist", value: "Buddhist" },
                                        { label: "None", value: "None" },
                                        { label: "Jehovah", value: "Jehovah" },
                                        { label: "Evangelic", value: "Evangelic" },
                                        { label: "Spiritualism", value: "Spiritualism" },
                                        { label: "Orthodox", value: "Orthodox" },
                                        { label: "Hinduism", value: "Hinduism" },
                                        { label: "Other", value: "Other" }
                                    ]}
                                    onSelect={(val) => handleInputChange('religious_affiliation', val)}
                                />
                            ) : (
                                <Text style={styles.detailValue}>{profile.religious_affiliation || 'Not provided'}</Text>
                            )}
                        </View>

                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

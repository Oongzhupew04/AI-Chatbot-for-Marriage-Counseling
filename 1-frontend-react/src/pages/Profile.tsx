import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import styles from './Profile.module.css';

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

export default function Profile(): JSX.Element {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
    const location = useLocation();

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            setLoading(true);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                // Using location.key ensures refetch on every visit
                const response = await axios.get('http://localhost:3000/api/users/profile', config);
                if (response.data.success) {
                    setProfile(response.data.profile);
                    setEditForm(response.data.profile);
                    if (response.data.profile.profile_pic) {
                        localStorage.setItem('profilePic', response.data.profile.profile_pic);
                        window.dispatchEvent(new Event('profileUpdated'));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [location.key]);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        const formData = new FormData();
        formData.append('profile_pic', file);

        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };
            const response = await axios.post('http://localhost:3000/api/users/profile-pic', formData, config);
            if (response.data.success) {
                const newPicUrl = response.data.profile_pic;
                setProfile(prev => prev ? { ...prev, profile_pic: newPicUrl } : null);
                localStorage.setItem('profilePic', newPicUrl);
                window.dispatchEvent(new Event('profileUpdated'));
            }
        } catch (err) {
            console.error("Failed to upload profile picture:", err);
            alert("Failed to upload profile picture.");
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
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.put('http://localhost:3000/api/users/profile', editForm, config);
            if (response.data.success) {
                setProfile({ ...profile, ...editForm } as UserProfile);
                if (editForm.username) {
                    localStorage.setItem('username', editForm.username);
                }
                window.dispatchEvent(new Event('profileUpdated'));
                setIsEditing(false);
            }
        } catch (err) {
            console.error("Failed to update profile:", err);
            alert("Failed to save profile updates.");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: e.target.type === 'number' ? (value ? parseInt(value) : undefined) : value
        }));
    };

    if (loading && !profile) {
        return (
            <main className={styles['main-content']}>
                <p style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading profile...</p>
            </main>
        );
    }

    if (!profile) {
        return (
            <main className={styles['main-content']}>
                <p style={{ padding: '40px', color: 'var(--text-muted)' }}>Error loading profile. Please log in again.</p>
            </main>
        );
    }

    return (
        <main className={styles['main-content']}>
            <div className={styles['header']}>
                <div>
                    <h1>My Profile</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your personal information</p>
                </div>
            </div>

            <div className={styles['profile-container']}>
                <div className={styles['profile-header-card']}>
                    <div className={styles['avatar-container']}>
                        {profile.profile_pic ? (
                            <img src={profile.profile_pic} alt="Profile" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <i className="fas fa-user"></i>
                        )}
                        <div className={styles['edit-avatar-btn']} onClick={handleCameraClick} style={{ cursor: 'pointer' }}>
                            <i className="fas fa-camera" style={{ fontSize: '1rem', color: 'white' }}></i>
                        </div>
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
                    </div>

                    <div className={styles['profile-info']}>
                        <h2>{profile.username}</h2>
                        <p>{profile.email}</p>
                        <div className={styles['status-badge']}>
                            <i className={profile.role === 'admin' ? "fas fa-shield-alt" : "fas fa-user-check"}></i>
                            {profile.role === 'admin' ? 'Admin' : 'User'}
                        </div>
                    </div>
                </div>

                <div className={styles['profile-details-card']}>
                    <div className={styles['card-title']}>
                        <i className="fas fa-address-card" style={{ color: '#F59E0B' }}></i> Personal Details

                        {!isEditing ? (
                            <button className={styles['edit-btn']} style={{ marginLeft: 'auto' }} onClick={handleEditClick}>
                                <i className="fas fa-pen"></i> Edit
                            </button>
                        ) : (
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                                <button className={styles['edit-btn']} style={{ marginLeft: 'auto' }} onClick={handleCancelClick}>
                                    Cancel
                                </button>
                                <button className={styles['edit-btn']} style={{ marginLeft: 'auto' }} onClick={handleSaveClick}>
                                    <i className="fas fa-save"></i> Save
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={styles['details-grid']}>
                        <div className={styles['detail-item']}>
                            <div className={styles['detail-label']}>Full Name</div>
                            <div className={styles['detail-value']}>
                                {isEditing ? (
                                    <input type="text" name="username" value={editForm.username || ''} onChange={handleInputChange} style={{ width: '100%', padding: '5px', background: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                                ) : (
                                    profile.username
                                )}
                            </div>
                        </div>
                        <div className={styles['detail-item']}>
                            <div className={styles['detail-label']}>Email Address</div>
                            <div className={styles['detail-value']}>{profile.email}</div>
                        </div>
                        <div className={styles['detail-item']}>
                            <div className={styles['detail-label']}>Sex</div>
                            <div className={styles['detail-value']}>
                                {isEditing ? (
                                    <select name="sex" value={editForm.sex || ''} onChange={handleInputChange} style={{ width: '100%', padding: '5px', background: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                ) : (
                                    profile.sex || 'Not provided'
                                )}
                            </div>
                        </div>
                        <div className={styles['detail-item']}>
                            <div className={styles['detail-label']}>Age</div>
                            <div className={styles['detail-value']}>
                                {isEditing ? (
                                    <input type="number" min="0" name="age" value={editForm.age || ''} onChange={handleInputChange} style={{ width: '100%', padding: '5px', background: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                                ) : (
                                    profile.age || 'Not provided'
                                )}
                            </div>
                        </div>
                        <div className={styles['detail-item']}>
                            <div className={styles['detail-label']}>Years Married</div>
                            <div className={styles['detail-value']}>
                                {isEditing ? (
                                    <input type="number" min="0" name="years_married" value={editForm.years_married ?? ''} onChange={handleInputChange} style={{ width: '100%', padding: '5px', background: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                                ) : (
                                    profile.years_married ?? 'Not provided'
                                )}
                            </div>
                        </div>
                        <div className={styles['detail-item']}>
                            <div className={styles['detail-label']}>Children Count</div>
                            <div className={styles['detail-value']}>
                                {isEditing ? (
                                    <input type="number" min="0" name="children_count" value={editForm.children_count ?? ''} onChange={handleInputChange} style={{ width: '100%', padding: '5px', background: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                                ) : (
                                    profile.children_count ?? 'Not provided'
                                )}
                            </div>
                        </div>
                        <div className={styles['detail-item']}>
                            <div className={styles['detail-label']}>Children Raised</div>
                            <div className={styles['detail-value']}>
                                {isEditing ? (
                                    <input type="number" min="0" name="children_raised" value={editForm.children_raised ?? ''} onChange={handleInputChange} style={{ width: '100%', padding: '5px', background: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
                                ) : (
                                    profile.children_raised ?? 'Not provided'
                                )}
                            </div>
                        </div>
                        <div className={styles['detail-item']}>
                            <div className={styles['detail-label']}>Education</div>
                            <div className={styles['detail-value']}>
                                {isEditing ? (
                                    <select name="education" value={editForm.education || ''} onChange={handleInputChange} style={{ width: '100%', padding: '5px', background: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                                        <option value="" disabled></option>
                                        <option value="No formal education">No formal education</option>
                                        <option value="Primary school">Primary school</option>
                                        <option value="Secondary school">Secondary school</option>
                                        <option value="High school or technical college">High school or technical college</option>
                                        <option value="Bachelor or masters degree">Bachelor or masters degree</option>
                                    </select>
                                ) : (
                                    profile.education || 'Not provided'
                                )}
                            </div>
                        </div>
                        <div className={styles['detail-item']}>
                            <div className={styles['detail-label']}>Religious Affiliation</div>
                            <div className={styles['detail-value']}>
                                {isEditing ? (
                                    <select name="religious_affiliation" value={editForm.religious_affiliation || ''} onChange={handleInputChange} style={{ width: '100%', padding: '5px', background: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                                        <option value="" disabled></option>
                                        <option value="Protestant">Protestant</option>
                                        <option value="Catholic">Catholic</option>
                                        <option value="Jewish">Jewish</option>
                                        <option value="Muslim">Muslim</option>
                                        <option value="Buddhist">Buddhist</option>
                                        <option value="None">None</option>
                                        <option value="Jehovah">Jehovah</option>
                                        <option value="Evangelic">Evangelic</option>
                                        <option value="Spiritualism">Spiritualism</option>
                                        <option value="Orthodox">Orthodox</option>
                                        <option value="Hinduism">Hinduism</option>
                                        <option value="Other">Other</option>
                                    </select>
                                ) : (
                                    profile.religious_affiliation || 'Not provided'
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

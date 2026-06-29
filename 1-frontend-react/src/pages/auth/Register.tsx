import React, { useState, useEffect } from 'react';
import styles from './Register.module.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DishonestyModal from '../../components/modals/DishonestyModal';
import RegistrationOtpModal from '../../components/modals/RegistrationOtpModal';

export default function Register() {
    // Updated state to include Q1-Q9 from the questionnaire
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirm_password: '',
        sex: '',
        age: '',
        years_married: '',
        children_count: '',
        children_raised: '',
        education: '',
        material_situation: '',
        religious_affiliation: '',
        religiousness: '',
        q13: '', q17: '', q19: '', q20: '', // Default: Neither yes nor no
        privacy_policy: false,
        ai_consent: false
    });
    const [error, setError] = useState('');
    const [isValid, setIsValid] = useState(false);
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpError, setOtpError] = useState('');

    useEffect(() => {
        validateForm();
    }, [formData]);

    const validateForm = () => {
        const { email, password, confirm_password, privacy_policy, ai_consent, age, years_married } = formData;
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

        // 2. Define array of required fields
        const requiredFields = [
            'sex', 'age', 'years_married', 'children_count',
            'children_raised', 'education', 'material_situation', 'religious_affiliation',
            'religiousness', 'q13', 'q17', 'q19', 'q20'
        ];

        // 3. Check if any are empty
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement;
        const { name, value, type, checked } = target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent standard HTML form submission

        // Smoothly scroll to the top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        try {
            setIsSubmitting(true);
            setError(''); // Clear any previous UI errors

            const response = await axios.post('/api/auth/request-registration-otp', {
                email: formData.email
            });

            if (response.data.success) {
                setShowOtpModal(true);
            } else {
                setError(response.data.message || "Failed to send OTP. Please try again.");
            }
        } catch (err: any) {
            console.error("OTP request error:", err);
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError("Could not connect to the server. Please try again later.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyAndRegister = async () => {
        try {
            setIsSubmitting(true);
            setOtpError('');

            const payload = { ...formData, otp };
            const response = await axios.post('/api/auth/register', payload);

            if (response.data.success) {
                setShowOtpModal(false);
                if (response.data.dishonesty_detected) {
                    setShowPopup(true);
                } else {
                    navigate('/login');
                }
            } else {
                setOtpError(response.data.message || "Registration failed. Invalid OTP.");
            }
        } catch (err: any) {
            console.error("Registration error:", err);
            if (err.response && err.response.data && err.response.data.error) {
                setOtpError(err.response.data.error);
            } else {
                setOtpError("Could not connect to the server. Please try again later.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper function to render Q13, Q17, Q19 dropdowns to save code space
    const renderScale1Select = (name: string, label: string) => (
        <div className={`${styles['form-group']} ${styles['mb-10']}`}>
            <label className={styles['text-sm']}>{label}</label>
            <select name={name} className={styles['input-field']} onChange={handleChange} value={(formData as any)[name]} required>
                <option value="" disabled></option>
                <option value="1">Yes</option>
                <option value="2">Rather yes</option>
                <option value="3">Neither yes nor no</option>
                <option value="4">Rather not</option>
                <option value="5">No</option>
            </select>
        </div>
    );

    return (
        <div className={styles['body']}>
            <div className={styles['bg-blob']}></div>
            <div className={`${styles['register-card']} ${styles['max-w-600']}`}>
                <div className={styles.brand}><i className="fas fa-heart-pulse"></i><span>Counselor.AI</span></div>
                <div className={styles.header}>
                    <h1>Create your account</h1>
                    <p>Start your journey towards a healthier relationship.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Account Basics */}
                    <div className={styles['form-group']}>
                        <label>Username / Full Name</label>
                        <input type="text" name="username" className={styles['input-field']} onChange={handleChange} required />
                    </div>
                    <div className={styles['form-group']}>
                        <label>Email Address</label>
                        <input type="email" name="email" className={styles['input-field']} onChange={handleChange} required />
                    </div>
                    <div className={styles['form-row']}>
                        <div className={styles['form-group']}>
                            <label>Password</label>
                            <input type="password" name="password" className={styles['input-field']} onChange={handleChange} required />
                        </div>
                        <div className={styles['form-group']}>
                            <label>Confirm Password</label>
                            <input type="password" name="confirm_password" className={styles['input-field']} onChange={handleChange} required />
                        </div>
                    </div>

                    <hr className={styles['custom-hr']} />
                    <h3 className={styles['section-title']}>Personal Information</h3>

                    {/* Q1, Q2, Q3 */}
                    <div className={`${styles['form-row']} ${styles['mb-15']}`}>
                        <div className={`${styles['form-group']} ${styles['flex-1']}`}>
                            <label>Sex</label>
                            <select name="sex" className={styles['input-field']} onChange={handleChange} value={formData.sex} required>
                                <option value="" disabled></option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div className={`${styles['form-group']} ${styles['flex-1']}`}>
                            <label>Age</label>
                            <input type="number" min="0" name="age" className={styles['input-field']} onChange={handleChange} required />
                        </div>
                        <div className={`${styles['form-group']} ${styles['flex-1']}`}>
                            <label>Years Married</label>
                            <input type="number" min="0" name="years_married" className={styles['input-field']} onChange={handleChange} required />
                        </div>
                    </div>

                    {/* Q4, Q5 */}
                    <div className={`${styles['form-row']} ${styles['mb-15']}`}>
                        <div className={`${styles['form-group']} ${styles['flex-1']}`}>
                            <label>Children (Total)</label>
                            <input type="number" min="0" name="children_count" className={styles['input-field']} onChange={handleChange} required />
                        </div>
                        <div className={`${styles['form-group']} ${styles['flex-1']}`}>
                            <label>Children Raised Presently</label>
                            <input type="number" min="0" name="children_raised" className={styles['input-field']} onChange={handleChange} required />
                        </div>
                    </div>

                    {/* Q6, Q7 */}
                    <div className={`${styles['form-row']} ${styles['mb-15']}`}>
                        <div className={`${styles['form-group']} ${styles['flex-1']}`}>
                            <label>Education</label>
                            <select name="education" className={styles['input-field']} onChange={handleChange} value={formData.education} required>
                                <option value="" disabled></option>
                                <option value="No formal education">No formal education</option>
                                <option value="Primary school">Primary school</option>
                                <option value="Secondary school">Secondary school</option>
                                <option value="High school or technical college">High school or technical college</option>
                                <option value="Bachelor or masters degree">Bachelor or masters degree</option>
                            </select>
                        </div>
                        <div className={`${styles['form-group']} ${styles['flex-1']}`}>
                            <label>Material Situation (compared to Average People)</label>
                            <select name="material_situation" className={styles['input-field']} onChange={handleChange} value={formData.material_situation} required>
                                <option value="" disabled></option>
                                <option value="Much better">Much better</option>
                                <option value="Better">Better</option>
                                <option value="Similar">Similar</option>
                                <option value="Worse">Worse</option>
                                <option value="Much worse">Much worse</option>
                            </select>
                        </div>
                    </div>

                    {/* Q8, Q9 */}
                    <div className={`${styles['form-row']} ${styles['mb-15']}`}>
                        <div className={`${styles['form-group']} ${styles['flex-1']}`}>
                            <label>Religious Affiliation</label>
                            <select name="religious_affiliation" className={styles['input-field']} onChange={handleChange} value={formData.religious_affiliation} required>
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
                        </div>
                        <div className={`${styles['form-group']} ${styles['flex-1']}`}>
                            <label>Religiousness (1-7)</label>
                            <select name="religiousness" className={styles['input-field']} onChange={handleChange} value={formData.religiousness} required>
                                <option value="" disabled></option>
                                <option value="1">1 - Not at all</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4 - Moderately</option>
                                <option value="5">5</option>
                                <option value="6">6</option>
                                <option value="7">7 - Extremely</option>
                            </select>
                        </div>
                    </div>

                    <hr className={styles['custom-hr']} />
                    <h3 className={styles['section-title']}>Relationship Assessment</h3>

                    <div className={styles['grid-cols-2']}>
                        {renderScale1Select('q13', 'Do you find your spouse attractive?')}
                        {renderScale1Select('q17', 'Are you proud of your spouse?')}
                        {renderScale1Select('q19', 'Do you love your spouse?')}
                    </div>

                    <br />
                    <br />

                    {/* Q20 implementation */}
                    <div className={`${styles['form-group']} ${styles['mb-10']}`}>
                        <label className={`${styles['text-md']} ${styles['text-center']}`}>Overall, how satisfied are you with your marriage?</label>
                        <select name="q20" className={styles['input-field']} onChange={handleChange} value={formData.q20} required>
                            <option value="" disabled></option>
                            <option value="1">1 - Very dissatisfied</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5 - Very satisfied</option>
                        </select>
                    </div>

                    <hr className={styles['custom-hr']} />

                    {/* Consents */}
                    <div className={`${styles['checkbox-group']} ${styles['mb-10']}`}>
                        <input type="checkbox" name="privacy_policy" onChange={handleChange} required />
                        <label className={styles['text-sm']}>I agree to the Privacy Policy.</label>
                    </div>
                    <div className={styles['checkbox-group']}>
                        <input type="checkbox" name="ai_consent" onChange={handleChange} required />
                        <label className={styles['text-sm']}>I consent to AI-assisted emotional support.</label>
                    </div>

                    <div className={`${styles['error-message']} ${styles['mt-10']}`}>{error}</div>

                    <button type="submit" className={`${styles['btn-submit']} ${isValid ? styles['btn-submit-valid'] : ''}`} disabled={!isValid}>
                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
                <div className={styles['footer-links']}>
                    <p>Already have an account? <Link to="/login">Sign in</Link></p>
                </div>
            </div>

            {/* Dishonesty Popup Modal */}
            {showPopup && (
                <DishonestyModal onClose={() => { setShowPopup(false); navigate('/login'); }} />
            )}

            {/* OTP Verification Modal */}
            <RegistrationOtpModal
                isOpen={showOtpModal}
                email={formData.email}
                otp={otp}
                setOtp={setOtp}
                otpError={otpError}
                isSubmitting={isSubmitting}
                onClose={() => setShowOtpModal(false)}
                onSubmit={handleVerifyAndRegister}
            />
        </div>
    );
}

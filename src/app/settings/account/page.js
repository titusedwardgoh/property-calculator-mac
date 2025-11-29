"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Edit2, Plus, MoreVertical, Clock } from 'lucide-react';
import EditEmailModal from '@/components/EditEmailModal';
import NotificationModal from '@/components/NotificationModal';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function AccountSettingsPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const supabase = createClient();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        buyerType: '',
        isPPR: '',
        isAustralianResident: '',
        isFirstHomeBuyer: '',
        hasPensionCard: ''
    });

    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [addresses, setAddresses] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [pendingEmailVerification, setPendingEmailVerification] = useState(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameData, setNameData] = useState({ firstName: '', lastName: '' });
    const [isSavingName, setIsSavingName] = useState(false);
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [phoneData, setPhoneData] = useState('');
    const [isSavingPhone, setIsSavingPhone] = useState(false);
    const [notification, setNotification] = useState({ isOpen: false, type: 'success', title: '', message: '' });

    // Add global error handler for unhandled Supabase auth errors
    useEffect(() => {
        const handleError = (event) => {
            const error = event.error || event.reason;
            if (error && isRefreshTokenError(error)) {
                console.error('Unhandled refresh token error detected, redirecting to login...');
                event.preventDefault(); // Prevent default error handling
                router.push('/login?next=/settings/account');
            }
        };

        // Listen for unhandled promise rejections (common for async Supabase operations)
        window.addEventListener('unhandledrejection', handleError);
        // Listen for general errors
        window.addEventListener('error', handleError);

        return () => {
            window.removeEventListener('unhandledrejection', handleError);
            window.removeEventListener('error', handleError);
        };
    }, [router]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login?next=/settings/account');
        } else if (user) {
            // Load user data from Supabase
            loadUserData();
        }
    }, [user, loading, router]);

    // Helper function to check if error is an invalid refresh token error
    const isRefreshTokenError = (error) => {
        if (!error) return false;
        const message = error.message || '';
        return (
            message.includes('Invalid Refresh Token') ||
            message.includes('Refresh Token Not Found') ||
            message.includes('refresh_token_not_found') ||
            error.status === 401
        );
    };

    // Listen for auth state changes to detect email verification
    useEffect(() => {
        if (!user) return;

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            try {
                // Check for token refresh errors
                if (event === 'TOKEN_REFRESHED' && !session) {
                    // Token refresh failed, check for errors
                    const { error: sessionError } = await supabase.auth.getSession();
                    if (sessionError && isRefreshTokenError(sessionError)) {
                        console.error('Invalid refresh token detected, redirecting to login...');
                        router.push('/login?next=/settings/account');
                        return;
                    }
                }

                // Handle SIGNED_OUT event
                if (event === 'SIGNED_OUT') {
                    router.push('/login?next=/settings/account');
                    return;
                }

                if (event === 'USER_UPDATED' && session?.user) {
                    // Check if email was verified
                    const currentUser = session.user;
                    
                    // If user has a new email and it's confirmed, update profiles
                    if (currentUser.email && currentUser.email_confirmed_at && pendingEmailVerification) {
                        // Check if the verified email matches the pending one
                        if (currentUser.email === pendingEmailVerification) {
                            // Email was verified, update profiles table
                            try {
                                const { error: updateError } = await supabase
                                    .from('profiles')
                                    .update({
                                        email: currentUser.email,
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('id', currentUser.id);

                                if (updateError) {
                                    // Check if it's a refresh token error
                                    if (isRefreshTokenError(updateError)) {
                                        console.error('Invalid refresh token detected, redirecting to login...');
                                        router.push('/login?next=/settings/account');
                                        return;
                                    }
                                    console.error('Error updating profile email:', updateError);
                                    throw updateError;
                                }
                                
                                // Update local state
                                setEmail(currentUser.email);
                                setPendingEmailVerification(null);
                                
                                // Reload user data to ensure everything is in sync
                                await loadUserData();
                                
                                // Show success message
                                setNotification({
                                    isOpen: true,
                                    type: 'success',
                                    title: 'Email Updated',
                                    message: 'Email successfully verified and updated!'
                                });
                            } catch (error) {
                                // Check if it's a refresh token error
                                if (isRefreshTokenError(error)) {
                                    console.error('Invalid refresh token detected, redirecting to login...');
                                    router.push('/login?next=/settings/account');
                                    return;
                                }
                                console.error('Error updating profile email:', error);
                                setNotification({
                                    isOpen: true,
                                    type: 'error',
                                    title: 'Update Error',
                                    message: 'Email was verified but there was an error updating your profile. Please refresh the page.'
                                });
                            }
                        }
                    }
                }
            } catch (error) {
                // Catch any unexpected errors in the auth state change handler
                if (isRefreshTokenError(error)) {
                    console.error('Invalid refresh token detected, redirecting to login...');
                    router.push('/login?next=/settings/account');
                    return;
                }
                console.error('Error in auth state change handler:', error);
            }
        });

        return () => subscription.unsubscribe();
    }, [user, supabase, pendingEmailVerification, router]);

    const loadUserData = async () => {
        if (!user) return;
        
        try {
            // Load from profiles table
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            // Check if error is related to invalid session
            if (error) {
                if (isRefreshTokenError(error)) {
                    console.error('Session invalid, redirecting to login...');
                    router.push('/login?next=/settings/account');
                    return;
                }
            }

            if (profile && !error) {
                setFormData({
                    firstName: profile.first_name || '',
                    lastName: profile.last_name || '',
                    buyerType: profile.buyer_type || '',
                    isPPR: profile.is_ppr || '',
                    isAustralianResident: profile.is_australian_resident || '',
                    isFirstHomeBuyer: profile.is_first_home_buyer || '',
                    hasPensionCard: profile.has_pension_card || ''
                });
                
                // Set name data for editing
                setNameData({
                    firstName: profile.first_name || '',
                    lastName: profile.last_name || ''
                });

                // Load email - prioritize profile.email, then user.email
                if (profile.email) {
                    // Use email from profiles.email field
                    setEmail(profile.email);
                } else {
                    // Fallback to user email from auth
                    setEmail(user.email || '');
                }

                // Load phone and addresses if stored
                if (profile.phone_number) setPhoneNumber(profile.phone_number);
                if (profile.addresses) setAddresses(profile.addresses);
            } else if (!error) {
                // No profile found but no error - initialize with user email
                setEmail(user.email || '');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            // Check if it's a session-related error
            if (isRefreshTokenError(error)) {
                console.error('Session invalid, redirecting to login...');
                router.push('/login?next=/settings/account');
                return;
            }
            // Initialize with user email for other errors
            if (user?.email) {
                setEmail(user.email);
            }
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);

        try {
            // Get email from state or fallback to user.email
            const primaryEmail = email || user.email;

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: primaryEmail, // Save to profiles.email field
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    buyer_type: formData.buyerType,
                    is_ppr: formData.isPPR,
                    is_australian_resident: formData.isAustralianResident,
                    is_first_home_buyer: formData.isFirstHomeBuyer,
                    has_pension_card: formData.hasPensionCard,
                    email: primaryEmail, // Save email
                    phone_number: phoneNumber,
                    addresses: addresses,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                });

            if (error) {
                if (isRefreshTokenError(error)) {
                    console.error('Invalid refresh token detected, redirecting to login...');
                    router.push('/login?next=/settings/account');
                    return;
                }
                throw error;
            }
            
            setNotification({
                isOpen: true,
                type: 'success',
                title: 'Settings Saved',
                message: 'Settings saved successfully!'
            });
        } catch (error) {
            console.error('Error saving settings:', error);
            if (isRefreshTokenError(error)) {
                console.error('Invalid refresh token detected, redirecting to login...');
                router.push('/login?next=/settings/account');
                return;
            }
            setNotification({
                isOpen: true,
                type: 'error',
                title: 'Save Error',
                message: 'Error saving settings. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleEditEmail = async (newEmail, password) => {
        if (!user) return;

        try {
            // First, verify the password by attempting to sign in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password
            });

            if (signInError) {
                if (isRefreshTokenError(signInError)) {
                    console.error('Invalid refresh token detected, redirecting to login...');
                    router.push('/login?next=/settings/account');
                    return;
                }
                throw new Error('Invalid password. Please try again.');
            }

            // Password is correct, now update email in Supabase Auth (this will send verification email)
            const { data, error } = await supabase.auth.updateUser({
                email: newEmail
            });

            if (error) {
                if (isRefreshTokenError(error)) {
                    console.error('Invalid refresh token detected, redirecting to login...');
                    router.push('/login?next=/settings/account');
                    return;
                }
                throw new Error(error.message || 'Failed to update email');
            }

            // Store pending verification email
            setPendingEmailVerification(newEmail);
            
            // Note: profiles.email will be updated automatically when email is verified
            // via the onAuthStateChange listener above
            
            // The modal will show success message
            return Promise.resolve();
        } catch (error) {
            console.error('Error updating email:', error);
            if (isRefreshTokenError(error)) {
                console.error('Invalid refresh token detected, redirecting to login...');
                router.push('/login?next=/settings/account');
                return;
            }
            throw error;
        }
    };

    const getCurrentEmail = () => {
        return email || user?.email || '';
    };

    const handleStartEditName = () => {
        setNameData({
            firstName: formData.firstName,
            lastName: formData.lastName
        });
        setIsEditingName(true);
    };

    const handleCancelEditName = () => {
        setIsEditingName(false);
        setNameData({
            firstName: formData.firstName,
            lastName: formData.lastName
        });
    };

    const handleSaveName = async () => {
        if (!user) return;
        setIsSavingName(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: nameData.firstName,
                    last_name: nameData.lastName,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) {
                if (isRefreshTokenError(error)) {
                    console.error('Invalid refresh token detected, redirecting to login...');
                    router.push('/login?next=/settings/account');
                    return;
                }
                throw error;
            }

            // Update local state
            setFormData(prev => ({
                ...prev,
                firstName: nameData.firstName,
                lastName: nameData.lastName
            }));

            setIsEditingName(false);
            setNotification({
                isOpen: true,
                type: 'success',
                title: 'Name Updated',
                message: 'Name updated successfully!'
            });
        } catch (error) {
            console.error('Error updating name:', error);
            if (isRefreshTokenError(error)) {
                console.error('Invalid refresh token detected, redirecting to login...');
                router.push('/login?next=/settings/account');
                return;
            }
            setNotification({
                isOpen: true,
                type: 'error',
                title: 'Update Error',
                message: 'Error updating name. Please try again.'
            });
        } finally {
            setIsSavingName(false);
        }
    };

    const getCurrentPhoneNumber = () => {
        return phoneNumber || '';
    };

    const handleStartEditPhone = () => {
        setPhoneData(getCurrentPhoneNumber());
        setIsEditingPhone(true);
    };

    const handleCancelEditPhone = () => {
        setIsEditingPhone(false);
        setPhoneData(getCurrentPhoneNumber());
    };

    const handleSavePhone = async () => {
        if (!user) return;
        setIsSavingPhone(true);

        try {
            // PhoneInput returns phone in E.164 format (e.g., "+12015550123")
            const updatedPhoneNumber = phoneData && phoneData.trim() ? phoneData.trim() : '';

            const { error } = await supabase
                .from('profiles')
                .update({
                    phone_number: updatedPhoneNumber,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) {
                if (isRefreshTokenError(error)) {
                    console.error('Invalid refresh token detected, redirecting to login...');
                    router.push('/login?next=/settings/account');
                    return;
                }
                throw error;
            }

            // Update local state
            setPhoneNumber(updatedPhoneNumber);

            setIsEditingPhone(false);
            setNotification({
                isOpen: true,
                type: 'success',
                title: 'Phone Updated',
                message: 'Phone number updated successfully!'
            });
        } catch (error) {
            console.error('Error updating phone:', error);
            if (isRefreshTokenError(error)) {
                console.error('Invalid refresh token detected, redirecting to login...');
                router.push('/login?next=/settings/account');
                return;
            }
            setNotification({
                isOpen: true,
                type: 'error',
                title: 'Update Error',
                message: 'Error updating phone number. Please try again.'
            });
        } finally {
            setIsSavingPhone(false);
        }
    };

    const getDisplayName = () => {
        if (formData.firstName || formData.lastName) {
            return `${formData.firstName} ${formData.lastName}`.trim() || 'Your name';
        }
        return 'Your name';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-base-200 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Profile + Buyer Questions */}
                    <div className="space-y-6">
                        {/* Profile Section */}
                        <div className="bg-base-100 rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Profile</h2>
                            <div className="flex flex-col items-center mb-4">
                                <div className="relative mb-4">
                                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="w-10 h-10 text-primary" />
                                    </div>
                                    <button className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-secondary hover:bg-primary-focus transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            {!isEditingName ? (
                                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <User className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-900">{getDisplayName()}</span>
                                    </div>
                                    <button 
                                        onClick={handleStartEditName}
                                        className="text-primary hover:text-primary-focus text-sm font-medium cursor-pointer"
                                    >
                                        Edit
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                value={nameData.firstName}
                                                onChange={(e) => setNameData(prev => ({ ...prev, firstName: e.target.value }))}
                                                placeholder="First name"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                                disabled={isSavingName}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                value={nameData.lastName}
                                                onChange={(e) => setNameData(prev => ({ ...prev, lastName: e.target.value }))}
                                                placeholder="Last name"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                                disabled={isSavingName}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={handleCancelEditName}
                                            disabled={isSavingName}
                                            className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveName}
                                            disabled={isSavingName || !nameData.firstName || !nameData.lastName}
                                            className="px-4 py-2 bg-primary text-secondary rounded-lg hover:bg-primary-focus transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {isSavingName ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Buyer Questions Section */}
                        <div className="bg-base-100 rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Buyer Information</h2>
                            <div className="space-y-6">
                                {/* Owner/Investor */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Are you an Owner or Investor?
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: 'owner-occupier', label: 'Owner-Occupier', description: 'I will live in this property' },
                                            { value: 'investor', label: 'Investor', description: 'I will rent this property out' }
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => updateFormData('buyerType', option.value)}
                                                className={`py-3 px-4 rounded-lg border-2 text-left transition-colors ${
                                                    formData.buyerType === option.value
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="font-medium mb-1">{option.label}</div>
                                                <div className="text-xs text-gray-500">{option.description}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* PPR */}
                                {formData.buyerType && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Will you live in this property? (PPR)
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { value: 'yes', label: 'Yes', description: 'This will be my main home' },
                                                { value: 'no', label: 'No', description: 'This will not be my main home' }
                                            ].map((option) => {
                                                const isDisabled = formData.buyerType === 'investor' && option.value === 'yes';
                                                return (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => !isDisabled && updateFormData('isPPR', option.value)}
                                                        disabled={isDisabled}
                                                        className={`py-3 px-4 rounded-lg border-2 text-left transition-colors ${
                                                            isDisabled
                                                                ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                                                                : formData.isPPR === option.value
                                                                    ? 'border-primary bg-primary/10 text-primary'
                                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className="font-medium mb-1">{option.label}</div>
                                                        <div className="text-xs text-gray-500">{option.description}</div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Citizen */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Australian citizen or permanent resident?
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: 'yes', label: 'Yes', description: 'Australian citizen or permanent resident' },
                                            { value: 'no', label: 'No', description: 'Foreign buyer' }
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => updateFormData('isAustralianResident', option.value)}
                                                className={`py-3 px-4 rounded-lg border-2 text-left transition-colors ${
                                                    formData.isAustralianResident === option.value
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="font-medium mb-1">{option.label}</div>
                                                <div className="text-xs text-gray-500">{option.description}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* First Home Buyer */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        First home buyer?
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: 'yes', label: 'Yes', description: 'This is my first home purchase' },
                                            { value: 'no', label: 'No', description: 'I have owned property before' }
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => updateFormData('isFirstHomeBuyer', option.value)}
                                                className={`py-3 px-4 rounded-lg border-2 text-left transition-colors ${
                                                    formData.isFirstHomeBuyer === option.value
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="font-medium mb-1">{option.label}</div>
                                                <div className="text-xs text-gray-500">{option.description}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Pensioner */}
                                {formData.isAustralianResident === 'yes' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Do you have a pensioner concession card?
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { value: 'yes', label: 'Yes', description: 'I have a pensioner concession card' },
                                                { value: 'no', label: 'No', description: 'I do not have a pensioner concession card' }
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => updateFormData('hasPensionCard', option.value)}
                                                    className={`py-3 px-4 rounded-lg border-2 text-left transition-colors ${
                                                        formData.hasPensionCard === option.value
                                                            ? 'border-primary bg-primary/10 text-primary'
                                                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <div className="font-medium mb-1">{option.label}</div>
                                                    <div className="text-xs text-gray-500">{option.description}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Email, Phone, Addresses */}
                    <div className="space-y-6">
                        {/* Email Section */}
                        <div className="bg-base-100 rounded-lg shadow-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Email</h2>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-900">{getCurrentEmail()}</span>
                                        {pendingEmailVerification && pendingEmailVerification === getCurrentEmail() && (
                                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Pending Verification
                                            </span>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => setIsEmailModalOpen(true)}
                                        disabled={!!pendingEmailVerification}
                                        className="text-primary hover:text-primary-focus text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Phone Section */}
                        <div className="bg-base-100 rounded-lg shadow-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Phone number</h2>
                            </div>
                            {isEditingPhone ? (
                                <div className="space-y-4">
                                    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                                        <PhoneInput
                                            international
                                            defaultCountry="AU"
                                            value={phoneData}
                                            onChange={(value) => setPhoneData(value || '')}
                                            placeholder="Enter phone number"
                                            disabled={isSavingPhone}
                                            className="[&_.PhoneInputCountry]:px-3 [&_.PhoneInputCountry]:py-2 [&_.PhoneInputCountry]:border-r [&_.PhoneInputCountry]:border-gray-300 [&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center [&_.PhoneInputCountry]:gap-2 [&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:px-4 [&_.PhoneInputInput]:py-2 [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:focus:ring-0 [&_.PhoneInputInput]:focus:outline-none [&_.PhoneInputInput]:disabled:opacity-50 [&_.PhoneInputInput]:disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={handleCancelEditPhone}
                                            disabled={isSavingPhone}
                                            className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSavePhone}
                                            disabled={isSavingPhone || !phoneData}
                                            className="px-4 py-2 bg-primary text-secondary rounded-lg hover:bg-primary-focus transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {isSavingPhone ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {(() => {
                                        const currentPhone = getCurrentPhoneNumber();
                                        return currentPhone ? (
                                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Phone className="w-5 h-5 text-gray-400" />
                                                    <span className="text-gray-900">{currentPhone}</span>
                                                </div>
                                                <button 
                                                    onClick={handleStartEditPhone}
                                                    className="text-primary hover:text-primary-focus text-sm font-medium cursor-pointer"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Phone className="w-5 h-5 text-gray-400" />
                                                    <span className="text-gray-500">No phone number</span>
                                                </div>
                                                <button 
                                                    onClick={handleStartEditPhone}
                                                    className="text-primary hover:text-primary-focus text-sm font-medium cursor-pointer"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Addresses Section */}
                        <div className="bg-base-100 rounded-lg shadow-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Addresses</h2>
                                <button className="text-primary hover:text-primary-focus text-sm font-medium flex items-center gap-1">
                                    <Plus className="w-4 h-4" />
                                    Add
                                </button>
                            </div>
                            <div className="space-y-3">
                                {addresses.length > 0 ? (
                                    addresses.map((address, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-5 h-5 text-gray-400" />
                                                {address.isPrimary && (
                                                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">Primary</span>
                                                )}
                                                <span className="text-gray-900">{address.address}</span>
                                            </div>
                                            <button className="text-gray-400 hover:text-gray-600">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm">No addresses added</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-primary hover:bg-primary-focus text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Email Edit Modal */}
            <EditEmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                currentEmail={getCurrentEmail()}
                onUpdateEmail={handleEditEmail}
            />

            {/* Notification Modal */}
            <NotificationModal
                isOpen={notification.isOpen}
                onClose={() => setNotification({ ...notification, isOpen: false })}
                type={notification.type}
                title={notification.title}
                message={notification.message}
            />
        </div>
    );
}

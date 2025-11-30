"use client";

import { useState, useEffect, useRef } from 'react';
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
    const [address, setAddress] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [pendingEmailVerification, setPendingEmailVerification] = useState(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameData, setNameData] = useState({ firstName: '', lastName: '' });
    const [isSavingName, setIsSavingName] = useState(false);
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [phoneData, setPhoneData] = useState('');
    const [isSavingPhone, setIsSavingPhone] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [addressData, setAddressData] = useState('');
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [isManualEntry, setIsManualEntry] = useState(false);
    const [manualAddress, setManualAddress] = useState({
        address: '',
        suburb: '',
        state: '',
        postcode: ''
    });
    const [showManualEntryButton, setShowManualEntryButton] = useState(false);
    const [hasValidAddress, setHasValidAddress] = useState(false);
    const [availableSuburbs, setAvailableSuburbs] = useState([]);
    const [isLoadingSuburbs, setIsLoadingSuburbs] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState(null);
    const autocompleteRef = useRef(null);
    const autocompleteInputRef = useRef(null);
    const scriptLoadingRef = useRef(false);
    const scriptLoadedRef = useRef(false);
    const [notification, setNotification] = useState({ isOpen: false, type: 'success', title: '', message: '' });

    // Add global error handler for unhandled Supabase auth errors
    useEffect(() => {
        const handleError = (event) => {
            const error = event.error || event.reason;
            if (error && isRefreshTokenError(error)) {
                // Silently handle refresh token errors - expected after token expiration
                event.preventDefault(); // Prevent default error handling
                event.stopPropagation(); // Stop error propagation
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

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
        };
    }, [typingTimeout]);

    // Load Google Maps script dynamically from API route
    useEffect(() => {
        if (!isEditingAddress) return;

        const loadGoogleMapsScript = async () => {
            try {
                // Check if script already loaded or is currently loading
                if (scriptLoadedRef.current || scriptLoadingRef.current) {
                    return;
                }

                // Check if Google Maps is already available globally
                if (window.__googleMapsLoaded || (window.google && window.google.maps && window.google.maps.places)) {
                    scriptLoadedRef.current = true;
                    return;
                }

                // Check if script tag already exists
                const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
                if (existingScript) {
                    scriptLoadedRef.current = true;
                    return;
                }

                // Check global loading state to prevent multiple simultaneous loads
                if (window.__googleMapsLoading) {
                    return;
                }

                window.__googleMapsLoading = true;
                scriptLoadingRef.current = true;

                // Fetch script URL from backend API
                const response = await fetch('/api/google-maps-config');
                const data = await response.json();
                
                if (data.scriptUrl) {
                    // Create and load script
                    const script = document.createElement('script');
                    script.src = data.scriptUrl;
                    script.async = true;
                    script.defer = true;
                    
                    // Add load event listener
                    script.onload = () => {
                        scriptLoadedRef.current = true;
                        scriptLoadingRef.current = false;
                        window.__googleMapsLoading = false;
                        window.__googleMapsLoaded = true;
                        
                        // Trigger autocomplete initialization if editing address
                        if (isEditingAddress && !hasValidAddress && autocompleteInputRef.current) {
                            // Add a small delay for mobile devices
                            setTimeout(() => {
                                initializeAutocomplete();
                            }, 200);
                        }
                    };
                    
                    script.onerror = () => {
                        scriptLoadingRef.current = false;
                        window.__googleMapsLoading = false;
                        console.error('Failed to load Google Maps script');
                    };
                    
                    document.head.appendChild(script);
                } else {
                    scriptLoadingRef.current = false;
                    window.__googleMapsLoading = false;
                }
            } catch (error) {
                console.error('Failed to load Google Maps script:', error);
                scriptLoadingRef.current = false;
                window.__googleMapsLoading = false;
            }
        };

        loadGoogleMapsScript();
    }, [isEditingAddress, hasValidAddress]);

    // Initialize Google Places Autocomplete when editing starts
    useEffect(() => {
        if (isEditingAddress && !hasValidAddress && !isManualEntry) {
            // Wait for Google Maps API to load AND for the input to be rendered
            const checkGoogleMaps = () => {
                if (typeof window !== 'undefined' && 
                    (window.__googleMapsLoaded || (window.google && window.google.maps && window.google.maps.places)) && 
                    autocompleteInputRef.current) {
                    initializeAutocomplete();
                } else {
                    // Increase timeout for mobile devices
                    const timeout = window.innerWidth < 768 ? 200 : 100;
                    setTimeout(checkGoogleMaps, timeout);
                }
            };
            
            // Add initial delay for mobile devices to ensure proper rendering
            const initialDelay = window.innerWidth < 768 ? 300 : 100;
            setTimeout(checkGoogleMaps, initialDelay);
        }
    }, [isEditingAddress, hasValidAddress, isManualEntry]);

    // Reinitialize autocomplete when switching back from manual entry
    useEffect(() => {
        if (isEditingAddress && !isManualEntry && autocompleteInputRef.current) {
            // Longer delay for mobile devices to ensure proper rendering
            const delay = window.innerWidth < 768 ? 300 : 100;
            const timer = setTimeout(() => {
                if (typeof window !== 'undefined' && 
                    (window.__googleMapsLoaded || (window.google && window.google.maps && window.google.maps.places))) {
                    initializeAutocomplete();
                }
            }, delay);
            
            return () => clearTimeout(timer);
        }
    }, [isManualEntry, isEditingAddress]);

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

                // Load phone and address if stored
                if (profile.phone_number) setPhoneNumber(profile.phone_number);
                if (profile.address) setAddress(profile.address);
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
                    phone_number: phoneNumber,
                    address: address,
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

    // Address editing functions
    const getCurrentAddress = () => {
        return address || '';
    };

    const handleStartEditAddress = () => {
        setAddressData('');
        setIsEditingAddress(true);
        setHasValidAddress(false);
        setIsManualEntry(false);
        setManualAddress({
            address: '',
            suburb: '',
            state: '',
            postcode: ''
        });
        setAvailableSuburbs([]);
    };

    const handleCancelEditAddress = () => {
        setIsEditingAddress(false);
        setAddressData('');
        setHasValidAddress(false);
        setIsManualEntry(false);
        setManualAddress({
            address: '',
            suburb: '',
            state: '',
            postcode: ''
        });
        setAvailableSuburbs([]);
    };

    const handleSaveAddress = async () => {
        if (!user) return;
        if (!hasValidAddress && !addressData.trim()) {
            setNotification({
                isOpen: true,
                type: 'error',
                title: 'Validation Error',
                message: 'Please enter a valid address.'
            });
            return;
        }

        setIsSavingAddress(true);

        try {
            const addressToSave = hasValidAddress ? addressData : addressData.trim();

            const { error } = await supabase
                .from('profiles')
                .update({
                    address: addressToSave,
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
            setAddress(addressToSave);
            setIsEditingAddress(false);
            setAddressData('');
            setHasValidAddress(false);
            setIsManualEntry(false);
            setManualAddress({
                address: '',
                suburb: '',
                state: '',
                postcode: ''
            });
            setAvailableSuburbs([]);

            setNotification({
                isOpen: true,
                type: 'success',
                title: 'Address Updated',
                message: 'Address updated successfully!'
            });
        } catch (error) {
            console.error('Error updating address:', error);
            if (isRefreshTokenError(error)) {
                console.error('Invalid refresh token detected, redirecting to login...');
                router.push('/login?next=/settings/account');
                return;
            }
            setNotification({
                isOpen: true,
                type: 'error',
                title: 'Update Error',
                message: 'Error updating address. Please try again.'
            });
        } finally {
            setIsSavingAddress(false);
        }
    };

    const resetAddressValidation = () => {
        setHasValidAddress(false);
        setIsManualEntry(false);
        setManualAddress({
            address: '',
            suburb: '',
            state: '',
            postcode: ''
        });
        setAvailableSuburbs([]);
        setIsLoadingSuburbs(false);
    };

    // Get state from postcode based on Australian postcode ranges
    const getStateFromPostcode = (postcode) => {
        const code = parseInt(postcode);
        
        // NSW: 2000-2599, 2619-2899, 2921-2999
        if ((code >= 2000 && code <= 2599) || (code >= 2619 && code <= 2899) || (code >= 2921 && code <= 2999)) {
            return 'NSW';
        }
        // ACT: 2600-2618, 2900-2920
        if ((code >= 2600 && code <= 2618) || (code >= 2900 && code <= 2920)) {
            return 'ACT';
        }
        // VIC: 3000-3999
        if (code >= 3000 && code <= 3999) {
            return 'VIC';
        }
        // QLD: 4000-4999
        if (code >= 4000 && code <= 4999) {
            return 'QLD';
        }
        // SA: 5000-5799
        if (code >= 5000 && code <= 5799) {
            return 'SA';
        }
        // WA: 6000-6797
        if (code >= 6000 && code <= 6797) {
            return 'WA';
        }
        // TAS: 7000-7799
        if (code >= 7000 && code <= 7799) {
            return 'TAS';
        }
        // NT: 0800-0899, 0900-0999
        if ((code >= 800 && code <= 899) || (code >= 900 && code <= 999)) {
            return 'NT';
        }
        
        // Default to NSW if no match
        return 'NSW';
    };

    // Fetch suburbs for a given postcode
    const fetchSuburbsForPostcode = async (postcode) => {
        setIsLoadingSuburbs(true);
        try {
            const response = await fetch(`/api/validate-suburb?postcode=${postcode}`);
            const data = await response.json();
            
            if (response.ok && data.suburbs && data.suburbs.length > 0) {
                setAvailableSuburbs(data.suburbs);
                // Auto-select state if all suburbs are in the same state
                const states = [...new Set(data.suburbs.map(s => s.state))];
                if (states.length === 1) {
                    setManualAddress(prev => ({ ...prev, state: states[0] }));
                }
            } else {
                // No suburbs found, auto-detect state from postcode
                setAvailableSuburbs([]);
                const detectedState = getStateFromPostcode(postcode);
                setManualAddress(prev => ({ ...prev, state: detectedState }));
            }
        } catch (error) {
            console.error('Error fetching suburbs:', error);
            setAvailableSuburbs([]);
            // Auto-detect state from postcode even on API error
            const detectedState = getStateFromPostcode(postcode);
            setManualAddress(prev => ({ ...prev, state: detectedState }));
        } finally {
            setIsLoadingSuburbs(false);
        }
    };

    // Validate manual address
    const validateManualAddress = () => {
        const { address, suburb, state, postcode } = manualAddress;
        return address.trim() !== '' && 
               suburb.trim() !== '' && 
               state.trim() !== '' && 
               postcode.trim() !== '' && 
               /^\d{4}$/.test(postcode.trim());
    };

    // Save manual address
    const saveManualAddress = () => {
        if (validateManualAddress()) {
            const { address, suburb, state, postcode } = manualAddress;
            
            // Format the display to match Google API format
            const streetAddress = address.trim();
            const suburbPostcode = `${suburb}, ${state} ${postcode}`.trim();
            const fullAddress = `${streetAddress}, ${suburbPostcode}`;
            
            setAddressData(fullAddress);
            setHasValidAddress(true);
        }
    };

    // Handle manual address field changes
    const handleManualAddressChange = (field, value) => {
        // For postcode field, only allow numeric input
        if (field === 'postcode') {
            // Remove any non-numeric characters
            value = value.replace(/[^\d]/g, '');
        }
        
        setManualAddress(prev => ({
            ...prev,
            [field]: value
        }));

        // If postcode is being changed and it's 4 digits, fetch suburbs
        if (field === 'postcode' && /^\d{4}$/.test(value)) {
            fetchSuburbsForPostcode(value);
        } else if (field === 'postcode' && value.length !== 4) {
            // Clear suburbs if postcode is not 4 digits
            setAvailableSuburbs([]);
            setManualAddress(prev => ({ ...prev, suburb: '', state: '' }));
        }
    };

    // Initialize Google Places Autocomplete
    const initializeAutocomplete = () => {
        if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places && autocompleteInputRef.current) {
            // Clear existing autocomplete instance if it exists
            if (autocompleteRef.current) {
                window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
                autocompleteRef.current = null;
            }
            
            // Ensure the input is visible and properly rendered
            const input = autocompleteInputRef.current;
            if (!input.offsetParent) {
                // Input is not visible, retry after a short delay
                setTimeout(() => {
                    if (autocompleteInputRef.current && autocompleteInputRef.current.offsetParent) {
                        initializeAutocomplete();
                    }
                }, 100);
                return;
            }
            
            autocompleteRef.current = new window.google.maps.places.Autocomplete(input, {
                types: ['address'],
                componentRestrictions: { country: 'au' }, // Restrict to Australia
                fields: ['formatted_address', 'address_components'] // Request address components
            });

            autocompleteRef.current.addListener('place_changed', () => {
                const place = autocompleteRef.current.getPlace();
                if (place.formatted_address) {
                    // Remove ", Australia" from the end of the address
                    const cleanedAddress = place.formatted_address.replace(/, Australia$/, '');
                    setAddressData(cleanedAddress);
                    setHasValidAddress(true);
                }
            });
        }
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

                    {/* Right Column: Email, Phone, Address */}
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

                        {/* Address Section */}
                        <div className="bg-base-100 rounded-lg shadow-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Address</h2>
                            </div>
                            {isEditingAddress ? (
                                <div className="space-y-4">
                                    {!hasValidAddress ? (
                                        <div>
                                            {!isManualEntry ? (
                                                <>
                                                    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                                                        <input
                                                            ref={autocompleteInputRef}
                                                            type="text"
                                                            placeholder="Enter street address"
                                                            value={addressData}
                                                            onChange={(e) => {
                                                                setAddressData(e.target.value);
                                                                setHasValidAddress(false);
                                                                
                                                                // Clear existing timeout
                                                                if (typingTimeout) {
                                                                    clearTimeout(typingTimeout);
                                                                }
                                                                
                                                                // Hide manual entry button immediately when typing
                                                                setShowManualEntryButton(false);
                                                                
                                                                // Show manual entry button after user stops typing for 1 second
                                                                const newTimeout = setTimeout(() => {
                                                                    setShowManualEntryButton(true);
                                                                }, 1000);
                                                                
                                                                setTypingTimeout(newTimeout);
                                                            }}
                                                            onFocus={(e) => {
                                                                // Only scroll on mobile devices
                                                                if (window.innerWidth < 768) {
                                                                    setTimeout(() => {
                                                                        e.target.scrollIntoView({ 
                                                                            behavior: 'smooth', 
                                                                            block: 'center' 
                                                                        });
                                                                    }, 300);
                                                                }
                                                                
                                                                // Ensure autocomplete is initialized on mobile focus
                                                                if (window.innerWidth < 768 && !autocompleteRef.current && 
                                                                    typeof window !== 'undefined' && 
                                                                    (window.__googleMapsLoaded || (window.google && window.google.maps && window.google.maps.places))) {
                                                                    setTimeout(() => {
                                                                        initializeAutocomplete();
                                                                    }, 100);
                                                                }
                                                            }}
                                                            className="w-full px-4 py-2 border-0 focus:ring-0 focus:outline-none"
                                                            disabled={isSavingAddress}
                                                        />
                                                    </div>
                                                    {addressData && !hasValidAddress && showManualEntryButton && (
                                                        <button
                                                            onClick={() => setIsManualEntry(true)}
                                                            className="mt-2 text-sm text-primary hover:underline cursor-pointer"
                                                        >
                                                            Can&apos;t find address?
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="space-y-4">
                                                    <input
                                                        type="text"
                                                        placeholder="Address (123 Main Street)"
                                                        value={manualAddress.address}
                                                        onChange={(e) => handleManualAddressChange('address', e.target.value)}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                                        disabled={isSavingAddress}
                                                    />
                                                    <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                                                        <input
                                                            type="text"
                                                            placeholder="Postcode"
                                                            value={manualAddress.postcode}
                                                            onChange={(e) => handleManualAddressChange('postcode', e.target.value)}
                                                            maxLength={4}
                                                            className="w-full md:w-36 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                                            disabled={isSavingAddress}
                                                        />
                                                        <div className="flex-1">
                                                            {availableSuburbs.length > 0 ? (
                                                                <select
                                                                    value={manualAddress.suburb}
                                                                    onChange={(e) => handleManualAddressChange('suburb', e.target.value)}
                                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                                                                    disabled={isSavingAddress}
                                                                >
                                                                    <option value="">Select Suburb</option>
                                                                    {availableSuburbs.map((suburb, index) => (
                                                                        <option key={index} value={suburb.name}>
                                                                            {suburb.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    placeholder={isLoadingSuburbs ? "Loading suburbs..." : "Suburb"}
                                                                    value={manualAddress.suburb}
                                                                    onChange={(e) => handleManualAddressChange('suburb', e.target.value)}
                                                                    disabled={isLoadingSuburbs || isSavingAddress}
                                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={saveManualAddress}
                                                            disabled={!validateManualAddress() || isSavingAddress}
                                                            className="px-4 py-2 bg-primary text-secondary rounded-lg hover:bg-primary-focus transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                        >
                                                            Use This Address
                                                        </button>
                                                        <button
                                                            onClick={() => setIsManualEntry(false)}
                                                            disabled={isSavingAddress}
                                                            className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                        >
                                                            Back
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-3 border border-gray-200 rounded-lg">
                                            <div className="text-gray-900">{addressData}</div>
                                            <button
                                                onClick={() => {
                                                    setAddressData('');
                                                    setHasValidAddress(false);
                                                    setIsManualEntry(false);
                                                    setManualAddress({
                                                        address: '',
                                                        suburb: '',
                                                        state: '',
                                                        postcode: ''
                                                    });
                                                    setAvailableSuburbs([]);
                                                }}
                                                className="text-sm text-gray-500 hover:text-gray-700 mt-2 underline"
                                            >
                                                Change address
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={handleCancelEditAddress}
                                            disabled={isSavingAddress}
                                            className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveAddress}
                                            disabled={isSavingAddress || !hasValidAddress}
                                            className="px-4 py-2 bg-primary text-secondary rounded-lg hover:bg-primary-focus transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {isSavingAddress ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {(() => {
                                        const currentAddress = getCurrentAddress();
                                        return currentAddress ? (
                                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <MapPin className="w-5 h-5 text-gray-400" />
                                                    <span className="text-gray-900">{currentAddress}</span>
                                                </div>
                                                <button 
                                                    onClick={handleStartEditAddress}
                                                    className="text-primary hover:text-primary-focus text-sm font-medium cursor-pointer"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <MapPin className="w-5 h-5 text-gray-400" />
                                                    <span className="text-gray-500">No address</span>
                                                </div>
                                                <button 
                                                    onClick={handleStartEditAddress}
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

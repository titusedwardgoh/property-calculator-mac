"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Edit2, Plus, MoreVertical } from 'lucide-react';

export default function AccountSettingsPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const supabase = createClient();

    const [formData, setFormData] = useState({
        fullName: '',
        buyerType: '',
        isPPR: '',
        isAustralianResident: '',
        isFirstHomeBuyer: '',
        hasPensionCard: ''
    });

    const [emails, setEmails] = useState([]);
    const [phoneNumbers, setPhoneNumbers] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login?next=/settings/account');
        } else if (user) {
            // Load user data from Supabase
            loadUserData();
        }
    }, [user, loading, router]);

    const loadUserData = async () => {
        if (!user) return;
        
        try {
            // Load from profiles table
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile && !error) {
                setFormData({
                    fullName: profile.full_name || '',
                    buyerType: profile.buyer_type || '',
                    isPPR: profile.is_ppr || '',
                    isAustralianResident: profile.is_australian_resident || '',
                    isFirstHomeBuyer: profile.is_first_home_buyer || '',
                    hasPensionCard: profile.has_pension_card || ''
                });

                // Load emails, phones, addresses if stored
                if (profile.emails) setEmails(profile.emails);
                if (profile.phone_numbers) setPhoneNumbers(profile.phone_numbers);
                if (profile.addresses) setAddresses(profile.addresses);
            } else {
                // Initialize with user email
                setEmails([{ email: user.email, isPrimary: true }]);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            // Initialize with user email
            if (user?.email) {
                setEmails([{ email: user.email, isPrimary: true }]);
            }
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: formData.fullName,
                    buyer_type: formData.buyerType,
                    is_ppr: formData.isPPR,
                    is_australian_resident: formData.isAustralianResident,
                    is_first_home_buyer: formData.isFirstHomeBuyer,
                    has_pension_card: formData.hasPensionCard,
                    emails: emails,
                    phone_numbers: phoneNumbers,
                    addresses: addresses,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                });

            if (error) throw error;
            
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error saving settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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
                    {/* Profile Section */}
                    <div className="bg-base-100 rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Profile</h2>
                        <div className="flex flex-col items-center mb-4">
                            <div className="relative mb-4">
                                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-12 h-12 text-primary" />
                                </div>
                                <button className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-secondary hover:bg-primary-focus transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => updateFormData('fullName', e.target.value)}
                                placeholder="Your name"
                                className="text-center text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1 w-full"
                            />
                            <button className="text-primary hover:text-primary-focus text-sm font-medium mt-2">
                                Change Name
                            </button>
                        </div>
                    </div>

                    {/* Contact Info & Buyer Questions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Contact Information */}
                        <div className="bg-base-100 rounded-lg shadow-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Emails</h2>
                                <button className="text-primary hover:text-primary-focus text-sm font-medium flex items-center gap-1">
                                    <Plus className="w-4 h-4" />
                                    Add
                                </button>
                            </div>
                            <div className="space-y-3">
                                {emails.map((email, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-5 h-5 text-gray-400" />
                                            {email.isPrimary && (
                                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">Primary</span>
                                            )}
                                            <span className="text-gray-900">{email.email}</span>
                                        </div>
                                        <button className="text-primary hover:text-primary-focus text-sm font-medium">Edit</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-base-100 rounded-lg shadow-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">Phone numbers</h2>
                                <button className="text-primary hover:text-primary-focus text-sm font-medium flex items-center gap-1">
                                    <Plus className="w-4 h-4" />
                                    Add
                                </button>
                            </div>
                            <div className="space-y-3">
                                {phoneNumbers.length > 0 ? (
                                    phoneNumbers.map((phone, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Phone className="w-5 h-5 text-gray-400" />
                                                {phone.isPrimary && (
                                                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">Primary</span>
                                                )}
                                                <span className="text-gray-900">{phone.number}</span>
                                            </div>
                                            <button className="text-primary hover:text-primary-focus text-sm font-medium">Change</button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm">No phone numbers added</p>
                                )}
                            </div>
                        </div>

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
        </div>
    );
}

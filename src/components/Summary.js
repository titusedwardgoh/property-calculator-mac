"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useFormStore } from '../stores/formStore';

export default function Summary() {
    const formData = useFormStore();
    const [isExpanded, setIsExpanded] = useState(false);

    // Sync with shared dropdown state
    useEffect(() => {
        setIsExpanded(formData.openDropdown === 'summary');
    }, [formData.openDropdown]);

    // Only render when summary should be shown
    if (!formData.showSummary) {
        return null;
    }

    const toggleExpanded = () => {
        if (isExpanded) {
            // Close this dropdown
            formData.updateFormData('openDropdown', null);
        } else {
            // Close other dropdown first, then open this one
            formData.updateFormData('openDropdown', 'summary');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
                opacity: 1, 
                y: 0
            }}
            transition={{ 
                opacity: { duration: 0.5 },
                y: { duration: 0.3 }
            }}
            className="bg-primary rounded-lg shadow-lg px-4 py-3 cursor-pointer hover:shadow-xl transition-shadow duration-200 relative"
            onClick={toggleExpanded}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <h3 className="text-md lg:text-lg xl:text-xl font-medium text-base-100">Summary</h3>
                </div>
                <div className="text-right">
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ChevronDown 
                                size={20} 
                                className={`text-base-100 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Dropdown Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ 
                            height: { duration: 0.3, ease: "easeInOut" },
                            opacity: { duration: 0.2 }
                        }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 px-4 z-10"
                    >
                        <div className="space-y-3 py-1">
                            {/* Placeholder content - will be populated later */}
                            <div className="text-center text-gray-500 py-8">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h4 className="text-lg font-medium text-gray-700 mb-2">Summary Coming Soon</h4>
                                <p className="text-sm text-gray-500">
                                    This will contain a comprehensive summary of all your property purchase details, 
                                    costs, and calculations.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

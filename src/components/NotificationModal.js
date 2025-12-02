"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function NotificationModal({ isOpen, onClose, type = 'success', title, message }) {
    if (!isOpen) return null;

    const icons = {
        success: CheckCircle,
        error: AlertCircle,
        info: Info
    };

    const colors = {
        success: {
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            headerBg: 'bg-green-50'
        },
        error: {
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            headerBg: 'bg-red-50'
        },
        info: {
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            headerBg: 'bg-blue-50'
        }
    };

    const Icon = icons[type] || CheckCircle;
    const colorScheme = colors[type] || colors.success;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-[200]"
                    />
                    
                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                            {/* Header */}
                            <div className={`${colorScheme.headerBg} px-8 pt-8 pb-6`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 ${colorScheme.iconBg} rounded-full flex items-center justify-center`}>
                                            <Icon className={`w-6 h-6 ${colorScheme.iconColor}`} />
                                        </div>
                                        {title && (
                                            <h3 className="text-2xl font-bold text-gray-900">
                                                {title}
                                            </h3>
                                        )}
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                                        aria-label="Close"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-8 py-6">
                                <p className="text-gray-700 mb-6">
                                    {message}
                                </p>

                                {/* Footer Button */}
                                <button
                                    onClick={onClose}
                                    className="w-full bg-primary cursor-pointer hover:bg-primary-focus text-secondary px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}


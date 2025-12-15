"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Play, Eye, Trash2, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { useFormStore } from '@/stores/formStore';
import { resetSessionAndForm } from '@/lib/sessionManager';

export default function DashboardContent({ userEmail, handleLogout }) {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const resetForm = useFormStore(state => state.resetForm);

  useEffect(() => {
    loadSurveys();
  }, [user]);

  const loadSurveys = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'loadUserProperties',
          userId: user.id,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSurveys(result.data || []);
      }
    } catch (error) {
      console.error('Error loading surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = (propertyId) => {
    // Store property ID in sessionStorage to resume
    sessionStorage.setItem('resumePropertyId', propertyId);
    router.push('/calculator?resume=true');
  };

  const handleDeleteClick = (propertyId, e) => {
    e.stopPropagation();
    setPropertyToDelete(propertyId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!propertyToDelete) return;

    setDeletingId(propertyToDelete);
    setShowDeleteModal(false);
    
    try {
      // Update user_saved to false instead of deleting
      const { error } = await supabase
        .from('properties')
        .update({ user_saved: false })
        .eq('id', propertyToDelete)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove from local state (it won't show on dashboard anymore)
      setSurveys(surveys.filter(s => s.id !== propertyToDelete));
    } catch (error) {
      console.error('Error updating survey:', error);
      alert('Failed to update survey. Please try again.');
    } finally {
      setDeletingId(null);
      setPropertyToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setPropertyToDelete(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCompletionStatus = (survey) => {
    if (survey.completion_status === 'complete') {
      return { text: 'Completed', color: 'text-success', bg: 'bg-success/10' };
    }
    const percentage = survey.completion_percentage || 0;
    return {
      text: `${percentage}% Complete`,
      color: 'text-warning',
      bg: 'bg-warning/10',
    };
  };
  return (
    <div className="min-h-screen bg-base-200">
      <main className="pb-24">
        {/* Hero Section */}
        <section className="container bg-secondary mx-auto px-4 py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex items-center justify-center mb-6"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary">
                <User className="w-8 h-8" />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="text-4xl md:text-5xl font-bold text-base-100 leading-tight mb-6"
            >
              Dashboard
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="text-lg md:text-xl text-base-100 mb-8"
            >
              Welcome back, {userEmail}
            </motion.p>
          </div>
        </section>

        {/* Dashboard Content */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="bg-base-100  p-6 flex justify-center items-center"
            >
              <Link
                href="/calculator"
                onClick={(e) => {
                  // Reset form and session before starting new survey
                  // This ensures a completely fresh start
                  resetSessionAndForm(resetForm);
                  // Clear any resume flags
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('resumePropertyId');
                  }
                }}
                className="bg-primary text-lg hover:bg-primary-focus text-secondary px-12 py-5 rounded-full font-medium text-base transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Start New Survey
              </Link>
            </motion.div>

            {/* Saved Surveys */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="bg-base-100 border border-base-200 rounded-3xl shadow-sm p-8 md:p-12"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Saved Surveys</h2>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : surveys.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">No saved surveys yet.</p>
                  <p className="text-sm text-gray-500">
                    Start a new survey and save it to see it here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {surveys.map((survey, index) => {
                    const status = getCompletionStatus(survey);
                    const isComplete = survey.completion_status === 'complete';
                    
                    return (
                      <motion.div
                        key={survey.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="border border-base-300 rounded-xl p-6 hover:shadow-md transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {survey.property_address || `Survey ${index + 1}`}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color} ${status.bg}`}>
                                {status.text}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              {survey.property_price && (
                                <p>Property Price: ${survey.property_price.toLocaleString()}</p>
                              )}
                              {survey.selected_state && (
                                <p>State: {survey.selected_state}</p>
                              )}
                              <p>Last updated: {formatDate(survey.updated_at)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isComplete ? (
                              <button
                                onClick={() => handleResume(survey.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                            ) : (
                              <button
                                onClick={() => handleResume(survey.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-focus text-secondary rounded-full transition-all hover:shadow-lg"
                              >
                                <Play className="w-4 h-4" />
                                Resume
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDeleteClick(survey.id, e)}
                              disabled={deletingId === survey.id}
                              className="flex items-center gap-2 px-4 py-2 bg-error/10 text-error rounded-full hover:bg-error/20 transition-colors disabled:opacity-50"
                            >
                              {deletingId === survey.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleDeleteCancel}
              className="fixed inset-0 bg-blue-900/30 z-50"
            />
            
            {/* Modal - Styled like the save/quit popup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Top Illustration Section */}
                <div className="bg-pink-50 px-8 pt-8 pb-6">
                  <div className="flex items-end justify-center gap-2 mb-4">
                    {/* Hand holding block */}
                    <div className="relative">
                      <div className="w-8 h-8 bg-yellow-400 rounded transform rotate-12"></div>
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full"></div>
                    </div>
                    {/* Building blocks structure */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-6 h-6 bg-red-500 rounded-t-full"></div>
                      <div className="w-8 h-4 bg-blue-500 rounded"></div>
                      <div className="w-6 h-4 bg-yellow-400 rounded"></div>
                      <div className="w-10 h-3 bg-red-500 rounded"></div>
                      <div className="flex gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Middle Text Section */}
                <div className="px-8 py-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Remove survey?
                  </h3>
                  <p className="text-gray-600 text-base">
                    This survey will be removed from your dashboard. The data will be kept in the system.
                  </p>
                </div>
                
                {/* Bottom Action Buttons */}
                <div className="px-8 pb-8 flex gap-3">
                  <button
                    onClick={handleDeleteCancel}
                    className="flex-1 border-2 border-blue-500 text-blue-600 bg-white hover:bg-blue-50 px-6 py-3 rounded-full font-medium transition-all duration-200"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


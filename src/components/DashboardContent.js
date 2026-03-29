"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Play, Eye, Trash2, FileText, Loader2, X, AlertTriangle, Search, ArrowUpDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { useFormStore } from '@/stores/formStore';
import { resetSessionAndForm } from '@/lib/sessionManager';

function SurveyInspectedToggle({ inspected, onToggle, compact }) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex shrink-0 cursor-pointer items-center rounded-full focus:outline-none active:outline-none ${
        compact ? 'h-6 w-12' : 'h-6 w-14'
      }`}
      animate={{
        backgroundColor: inspected ? '#10b981' : '#ef4444',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <AnimatePresence>
        {!inspected && (
          <motion.span
            key="no"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-none absolute right-0 flex h-full items-center font-bold text-white z-10 ${
              compact ? 'pr-2.5 text-[10px]' : 'pr-3 text-[10px]'
            }`}
          >
            No
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {inspected && (
          <motion.span
            key="yes"
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-none absolute left-0 flex h-full items-center font-bold text-white z-10 ${
              compact ? 'pl-2 text-[10px]' : 'pl-2.5 text-[10px]'
            }`}
          >
            Yes
          </motion.span>
        )}
      </AnimatePresence>
      <motion.span
        className={`absolute rounded-full bg-white shadow-md ${
          compact ? 'h-4 w-4' : 'h-4.5 w-4.5'
        }`}
        animate={{
          left: inspected ? 'auto' : compact ? '0.15rem' : '0.225rem',
          right: inspected ? (compact ? '0.125rem' : '0.155rem') : 'auto',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      />
    </motion.button>
  );
}

export default function DashboardContent({
  userEmail,
  userName,
  profilePictureUrl,
  handleLogout,
}) {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteCount, setBulkDeleteCount] = useState(0);
  const [sortOption, setSortOption] = useState('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPlaceholder, setSearchPlaceholder] = useState('Search by property address...');
  const [selectedProperties, setSelectedProperties] = useState(new Set());
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const resetForm = useFormStore(state => state.resetForm);

  useEffect(() => {
    loadSurveys();
  }, [user?.id]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const sync = () =>
      setSearchPlaceholder(mq.matches ? 'Search address' : 'Search by property address...');
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

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

  const handleToggleInspected = async (propertyId, currentInspected) => {
    if (!user) return;
    
    const newInspectedStatus = !currentInspected;
    
    // Optimistically update UI immediately
    setSurveys(prevSurveys => 
      prevSurveys.map(survey => 
        survey.id === propertyId 
          ? { ...survey, inspected: newInspectedStatus }
          : survey
      )
    );

    // Update database in the background
    try {
      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updatePropertyInspected',
          propertyId: propertyId,
          inspected: newInspectedStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to update inspected status');
      }
    } catch (error) {
      console.error('Error updating inspected status:', error);
      // Revert the optimistic update on error
      setSurveys(prevSurveys => 
        prevSurveys.map(survey => 
          survey.id === propertyId 
            ? { ...survey, inspected: currentInspected }
            : survey
        )
      );
      alert('Failed to update inspected status. Please try again.');
    }
  };

  const handleCheckboxChange = (propertyId, isChecked) => {
    setSelectedProperties(prev => {
      const next = new Set(prev);
      if (isChecked) {
        next.add(propertyId);
      } else {
        next.delete(propertyId);
      }
      // Close sort menu when selecting properties
      if (isChecked && showSortMenu) {
        setShowSortMenu(false);
      }
      return next;
    });
  };

  // Select all / unselect all based on current visible (sorted) list
  const handleSelectAllChange = (visibleIds) => {
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedProperties.has(id));
    if (allSelected) {
      setSelectedProperties(new Set());
    } else {
      setSelectedProperties(new Set(visibleIds));
    }
  };

  const handleBulkDelete = () => {
    if (selectedProperties.size === 0 || !user) return;
    
    // Show confirmation modal
    setBulkDeleteCount(selectedProperties.size);
    setShowBulkDeleteModal(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedProperties.size === 0 || !user) return;
    
    // Close modal
    setShowBulkDeleteModal(false);
    
    const propertyIds = Array.from(selectedProperties);
    
    // Store deleted surveys for rollback
    const deletedSurveys = surveys.filter(survey => selectedProperties.has(survey.id));
    
    // Optimistically remove from UI immediately
    setSurveys(prevSurveys => 
      prevSurveys.filter(survey => !selectedProperties.has(survey.id))
    );
    
    // Clear selection immediately for instant feedback
    setSelectedProperties(new Set());
    
    // Update database in the background
    try {
      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bulkDeleteProperties',
          propertyIds: propertyIds,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to delete properties');
      }
    } catch (error) {
      console.error('Error deleting properties:', error);
      // Restore deleted surveys on error
      setSurveys(prevSurveys => [...prevSurveys, ...deletedSurveys]);
      alert('Failed to delete properties. Please try again.');
    }
  };

  const handleBulkDeleteCancel = () => {
    setShowBulkDeleteModal(false);
    setBulkDeleteCount(0);
  };

  const handleBulkInspected = async () => {
    if (selectedProperties.size === 0 || !user) return;
    
    const propertyIds = Array.from(selectedProperties);
    
    // Store original inspected status for rollback
    const originalInspectedStatus = new Map();
    surveys.forEach(survey => {
      if (selectedProperties.has(survey.id)) {
        originalInspectedStatus.set(survey.id, survey.inspected || false);
      }
    });
    
    // Store selected properties for rollback (needed for error handling)
    const selectedPropsForRollback = new Set(selectedProperties);
    
    // Optimistically update UI immediately
    setSurveys(prevSurveys => 
      prevSurveys.map(survey => 
        selectedProperties.has(survey.id)
          ? { ...survey, inspected: true }
          : survey
      )
    );
    
    // Clear selection immediately for instant feedback
    setSelectedProperties(new Set());

    // Update database in the background
    try {
      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bulkUpdateInspected',
          propertyIds: propertyIds,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to update inspected status');
      }
    } catch (error) {
      console.error('Error updating inspected status:', error);
      // Revert the optimistic update on error
      setSurveys(prevSurveys => 
        prevSurveys.map(survey => 
          selectedPropsForRollback.has(survey.id)
            ? { ...survey, inspected: originalInspectedStatus.get(survey.id) || false }
            : survey
        )
      );
      alert('Failed to update inspected status. Please try again.');
    }
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
      return { text: 'Survey Complete', color: 'text-success', bg: 'bg-success/10' };
    }
    const percentage = survey.completion_percentage || 0;
    return {
      text: `Survey ${percentage}% Complete`,
      color: 'text-warning',
      bg: 'bg-warning/10',
    };
  };

  const sortSurveys = (surveysToSort, sortBy) => {
    const sorted = [...surveysToSort];
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
      case 'address-az':
        return sorted.sort((a, b) => {
          const addressA = (a.property_address || '').toLowerCase();
          const addressB = (b.property_address || '').toLowerCase();
          return addressA.localeCompare(addressB);
        });
      case 'state':
        return sorted.sort((a, b) => {
          const stateA = (a.selected_state || '').toLowerCase();
          const stateB = (b.selected_state || '').toLowerCase();
          return stateA.localeCompare(stateB);
        });
      case 'completion-asc':
        return sorted.sort((a, b) => {
          const percentA = a.completion_percentage || 0;
          const percentB = b.completion_percentage || 0;
          // Handle completed surveys - put them at the end
          if (a.completion_status === 'complete' && b.completion_status !== 'complete') return 1;
          if (b.completion_status === 'complete' && a.completion_status !== 'complete') return -1;
          if (a.completion_status === 'complete' && b.completion_status === 'complete') return 0;
          return percentA - percentB;
        });
      case 'completion-desc':
        return sorted.sort((a, b) => {
          const percentA = a.completion_percentage || 0;
          const percentB = b.completion_percentage || 0;
          // Handle completed surveys - put them at the beginning
          if (a.completion_status === 'complete' && b.completion_status !== 'complete') return -1;
          if (b.completion_status === 'complete' && a.completion_status !== 'complete') return 1;
          if (a.completion_status === 'complete' && b.completion_status === 'complete') return 0;
          return percentB - percentA;
        });
      default:
        return sorted;
    }
  };

  // Filter surveys based on search query
  const filteredSurveys = surveys.filter(survey => {
    if (!searchQuery.trim()) return true;
    const address = (survey.property_address || '').toLowerCase();
    const state = (survey.selected_state || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return address.includes(query) || state.includes(query);
  });

  // Sort the filtered surveys
  const sortedSurveys = sortSurveys(filteredSurveys, sortOption);
  return (
    <div className="min-h-screen bg-base-200">
      <main className="pb-24">
        {/* Hero Section */}
        <section className="container bg-secondary mx-auto px-4 py-6 lg:py-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex items-center justify-center mb-6"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary overflow-hidden shrink-0 ring-2 ring-base-100/20">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt={
                      userName || userEmail
                        ? `Profile photo of ${userName || userEmail}`
                        : 'Profile photo'
                    }
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8" aria-hidden />
                )}
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="text-4xl md:text-5xl font-bold text-base-100 leading-tight mb-2"
            >
              Dashboard
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="text-lg md:text-xl text-base-100 mb-1"
            >
              Welcome back, {userName || userEmail}
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
              
              {/* Container with fixed height to prevent layout shift */}
              <div className="relative h-10 mb-6">
                {/* Select-all checkbox - fixed position, not part of sliding animation */}
                {sortedSurveys.length > 0 && (
                  <label className="absolute right-6 top-0 bottom-0 flex items-center z-10 cursor-pointer select-none shrink-0">
                    <input
                      type="checkbox"
                      checked={sortedSurveys.every(s => selectedProperties.has(s.id))}
                      onChange={() => handleSelectAllChange(sortedSurveys.map(s => s.id))}
                      className="w-5 h-5 cursor-pointer text-primary border-gray-300 rounded focus:ring-0 focus:ring-offset-0 focus:outline-none"
                      aria-label="Select or unselect all properties"
                    />
                  </label>
                )}
                {/* Search and Sort Bar - Hidden when properties are selected */}
                <AnimatePresence mode="wait">
                  {selectedProperties.size === 0 && (
                    <motion.div
                      key="search-bar"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex items-center gap-3"
                    >
                      <div className="relative flex-1 h-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder={searchPlaceholder}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full h-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div className="relative mr-14">
                        <button
                          onClick={() => setShowSortMenu(!showSortMenu)}
                          className="flex cursor-pointer items-center justify-center w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          aria-label="Sort surveys"
                        >
                          <ArrowUpDown className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    
                    {/* Sort Dropdown Menu */}
                    <AnimatePresence>
                      {showSortMenu && (
                        <>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSortMenu(false)}
                            className="fixed inset-0 z-10"
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20"
                          >
                            <button
                              onClick={() => { setSortOption('newest'); setShowSortMenu(false); }}
                              className={`w-full cursor-pointer text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                sortOption === 'newest' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                              }`}
                            >
                              Newest First
                            </button>
                            <button
                              onClick={() => { setSortOption('oldest'); setShowSortMenu(false); }}
                              className={`w-full cursor-pointer text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                sortOption === 'oldest' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                              }`}
                            >
                              Oldest First
                            </button>
                            <button
                              onClick={() => { setSortOption('address-az'); setShowSortMenu(false); }}
                              className={`w-full cursor-pointer text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                sortOption === 'address-az' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                              }`}
                            >
                              Address (A-Z)
                            </button>
                            <button
                              onClick={() => { setSortOption('state'); setShowSortMenu(false); }}
                              className={`w-full cursor-pointer text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                sortOption === 'state' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                              }`}
                            >
                              By State
                            </button>
                            <button
                              onClick={() => { setSortOption('completion-asc'); setShowSortMenu(false); }}
                              className={`w-full cursor-pointer text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                sortOption === 'completion-asc' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                              }`}
                            >
                              Completion % (Low to High)
                            </button>
                            <button
                              onClick={() => { setSortOption('completion-desc'); setShowSortMenu(false); }}
                              className={`w-full cursor-pointer text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                sortOption === 'completion-desc' ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                              }`}
                            >
                              Completion % (High to Low)
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bulk Action Buttons - Shown when properties are selected */}
                <AnimatePresence mode="wait">
                  {selectedProperties.size > 0 && (
                    <motion.div
                      key="bulk-actions"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex items-center gap-3 pr-14"
                    >
                      <button
                        type="button"
                        onClick={handleBulkDelete}
                        aria-label={`Delete ${selectedProperties.size} ${selectedProperties.size === 1 ? 'property' : 'properties'}`}
                        className="flex h-10 min-h-10 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0 rounded-lg bg-error px-2 py-0.5 text-center text-[13px] font-medium leading-tight text-white transition-colors hover:bg-error/90 sm:h-auto sm:min-h-0 sm:flex-initial sm:flex-row sm:gap-2 sm:px-6 sm:py-2 sm:text-base sm:leading-normal"
                      >
                        <Trash2 className="hidden h-5 w-5 shrink-0 sm:block" />
                        <span className="flex flex-col sm:hidden">
                          <span>Delete</span>
                          <span>
                            {selectedProperties.size}{' '}
                            {selectedProperties.size === 1 ? 'property' : 'properties'}
                          </span>
                        </span>
                        <span className="hidden sm:inline">
                          Delete {selectedProperties.size}{' '}
                          {selectedProperties.size === 1 ? 'property' : 'properties'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkInspected}
                        aria-label={`Mark ${selectedProperties.size} ${selectedProperties.size === 1 ? 'property' : 'properties'} as inspected`}
                        className="flex h-10 min-h-10 min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0 rounded-lg bg-primary px-2 py-0.5 text-center text-[13px] font-medium leading-tight text-secondary transition-colors hover:bg-primary-focus sm:h-auto sm:min-h-0 sm:w-auto sm:flex-initial sm:flex-row sm:gap-2 sm:px-6 sm:py-2 sm:text-base sm:leading-normal"
                      >
                        <span className="flex flex-col sm:hidden">
                          <span>Inspect</span>
                          <span>
                            {selectedProperties.size}{' '}
                            {selectedProperties.size === 1 ? 'property' : 'properties'}
                          </span>
                        </span>
                        <Eye className="hidden h-5 w-5 shrink-0 sm:block" aria-hidden />
                        <span className="hidden sm:inline sm:text-base">
                          Inspected {selectedProperties.size}{' '}
                          {selectedProperties.size === 1 ? 'property' : 'properties'}
                        </span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
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
              ) : sortedSurveys.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">Oops, we can&apos;t find any surveys matching your search.</p>
                  <p className="text-sm text-gray-500">
                    Try adjusting your search terms or clear the search to see all surveys.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedSurveys.map((survey, index) => {
                    const status = getCompletionStatus(survey);
                    const isComplete = survey.completion_status === 'complete';
                    
                    return (
                      <motion.div
                        key={survey.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="border border-secondary rounded-xl p-6 hover:shadow-md transition-all"
                      >
                        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-4 sm:grid-rows-[auto_1fr] sm:gap-x-4 sm:gap-y-2">
                          <div className="col-start-1 row-start-1 min-w-0 self-start pr-1 sm:pr-0">
                            <div className="mb-2 flex flex-wrap items-start gap-x-2 gap-y-1 sm:items-center">
                              <h3 className="text-base font-semibold leading-snug text-gray-900 [overflow-wrap:anywhere] sm:text-lg sm:leading-normal">
                                {survey.property_address || `Survey ${index + 1}`}
                              </h3>
                              <span
                                className={`inline-flex shrink-0 px-3 py-1 text-xs font-medium whitespace-nowrap rounded-full ${status.color} ${status.bg}`}
                              >
                                {status.text}
                              </span>
                            </div>
                          </div>
                          <div className="col-start-2 row-start-1 justify-self-end self-start">
                            <input
                              type="checkbox"
                              checked={selectedProperties.has(survey.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleCheckboxChange(survey.id, e.target.checked);
                              }}
                              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-gray-300 text-primary focus:outline-none focus:ring-0 focus:ring-offset-0 sm:mt-0"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Select survey ${survey.property_address || index + 1}`}
                            />
                          </div>
                          <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-1 sm:row-start-2">
                            <div className="text-sm text-gray-600 space-y-1">
                              {survey.property_price && (
                                <p>Property Price: ${survey.property_price.toLocaleString()}</p>
                              )}
                              {survey.selected_state && (
                                <p>State: {survey.selected_state}</p>
                              )}
                              <p>Last updated: {formatDate(survey.updated_at)}</p>
                              <div className="mt-2 hidden items-center gap-2 sm:flex">
                                <span className="text-sm text-gray-600">Inspected:</span>
                                <SurveyInspectedToggle
                                  inspected={!!survey.inspected}
                                  compact={false}
                                  onToggle={(e) => {
                                    e.stopPropagation();
                                    handleToggleInspected(survey.id, survey.inspected || false);
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="col-span-2 row-start-3 justify-self-stretch sm:col-span-1 sm:col-start-2 sm:row-start-2 sm:flex sm:h-full sm:min-h-0 sm:justify-self-end sm:self-stretch sm:items-end">
                            <div className="flex w-full min-w-0 flex-nowrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-2">
                              <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:hidden">
                                <span className="shrink-0 text-sm font-medium text-gray-600">
                                  Inspected:
                                </span>
                                <SurveyInspectedToggle
                                  inspected={!!survey.inspected}
                                  compact
                                  onToggle={(e) => {
                                    e.stopPropagation();
                                    handleToggleInspected(survey.id, survey.inspected || false);
                                  }}
                                />
                              </div>
                              {isComplete ? (
                                <button
                                  onClick={() => handleResume(survey.id)}
                                  type="button"
                                  className="flex shrink-0 cursor-pointer items-center justify-center gap-0 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors sm:gap-2 sm:px-7 sm:py-2 sm:text-base"
                                >
                                  <Eye className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden />
                                  View
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleResume(survey.id)}
                                  type="button"
                                  className="flex shrink-0 cursor-pointer items-center justify-center gap-0 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-secondary transition-all hover:bg-primary-focus hover:shadow-lg sm:gap-2 sm:px-4 sm:py-2 sm:text-base"
                                >
                                  <Play className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden />
                                  Resume
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => handleDeleteClick(survey.id, e)}
                                disabled={deletingId === survey.id}
                                className="flex shrink-0 cursor-pointer items-center gap-0 rounded-full bg-error/10 px-3 py-2 text-error hover:bg-error/20 transition-colors disabled:opacity-50 sm:gap-2 sm:px-4 sm:py-2"
                              >
                                {deletingId === survey.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin sm:h-4 sm:w-4" />
                                ) : (
                                  <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" />
                                )}
                              </button>
                            </div>
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
                <div className="bg-primary/10 px-8 pt-8 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-gray-900">Delete saved survey?</h3>
                    </div>
                    <button
                      onClick={handleDeleteCancel}
                      className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="px-8 py-6">
                  <p className="text-gray-600 text-base mb-6">
                    This survey will be removed from your dashboard.
                  </p>
                
                  {/* Action Buttons */}
                  <div className="flex gap-3">
                  <button
                    onClick={handleDeleteCancel}
                      className="flex-1 cursor-pointer border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-6 py-3 rounded-full font-medium transition-all duration-200"
                  >
                      Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                      className="flex-1 cursor-pointer bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg"
                  >
                      Delete
                  </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation Modal */}
      <AnimatePresence>
        {showBulkDeleteModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleBulkDeleteCancel}
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
                <div className="bg-primary/10 px-8 pt-8 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-gray-900">
                        Delete {bulkDeleteCount} {bulkDeleteCount === 1 ? 'survey' : 'surveys'}?
                      </h3>
                    </div>
                    <button
                      onClick={handleBulkDeleteCancel}
                      className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="px-8 py-6">
                  <p className="text-gray-600 text-base mb-6">
                    {bulkDeleteCount === 1 
                      ? 'This survey will be removed from your dashboard.'
                      : 'These surveys will be removed from your dashboard.'
                    }
                  </p>
                
                  {/* Action Buttons */}
                  <div className="flex gap-3">
                  <button
                    onClick={handleBulkDeleteCancel}
                      className="flex-1 cursor-pointer border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 px-6 py-3 rounded-full font-medium transition-all duration-200"
                  >
                      Cancel
                  </button>
                  <button
                    onClick={handleBulkDeleteConfirm}
                      className="flex-1 cursor-pointer bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 hover:shadow-lg"
                  >
                      Delete
                  </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


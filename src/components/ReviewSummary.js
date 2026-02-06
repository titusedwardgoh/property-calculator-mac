"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useFormStore } from '../stores/formStore';
import { getRequiredFields, calculateGlobalProgress } from '../lib/progressCalculation';
import { getFieldLabel, formatFieldValue } from '../lib/fieldMapping';

export default function ReviewSummary() {
  const formData = useFormStore();
  const { updateFormData, setShowReviewPage } = formData;
  
  // Get required fields based on current form state
  const requiredFields = getRequiredFields(formData);
  
  // Calculate global progress
  const progress = calculateGlobalProgress(formData, {});
  
  // Helper function to filter section fields
  const getSectionFields = (sectionFields, requiredFields, formData) => {
    return sectionFields.filter(field => 
      requiredFields.includes(field) && 
      formData[field] !== null && 
      formData[field] !== undefined && 
      formData[field] !== ''
    );
  };
  
  // Define section fields
  const propertyFields = ['propertyAddress', 'selectedState', 'propertyCategory', 'propertyType', 'propertyPrice', 'isWA', 'isWAMetro'];
  const buyerFields = ['buyerType', 'isPPR', 'isAustralianResident', 'isFirstHomeBuyer', 'savingsAmount', 'needsLoan', 'income', 'dependants', 'ownedPropertyLast5Years', 'hasPensionCard'];
  const loanFields = ['loanDeposit', 'loanType', 'loanTerm', 'loanRate', 'loanLMI', 'loanSettlementFees', 'loanEstablishmentFee'];
  const sellerFields = ['councilRates', 'waterRates', 'bodyCorp', 'landTransferFee', 'legalFees', 'buildingAndPestInspection', 'constructionStarted', 'dutiableValue'];
  
  // Filter fields for each section
  const propertyFieldsToShow = getSectionFields(propertyFields, requiredFields, formData);
  const buyerFieldsToShow = getSectionFields(buyerFields, requiredFields, formData);
  const loanFieldsToShow = formData.needsLoan === 'yes' ? getSectionFields(loanFields, requiredFields, formData) : [];
  const sellerFieldsToShow = getSectionFields(sellerFields, requiredFields, formData);
  
  // Edit button handlers
  const handlePropertyEdit = () => {
    updateFormData('showReviewPage', false);
    updateFormData('propertyDetailsActiveStep', 1);
    updateFormData('propertyDetailsComplete', false);
    updateFormData('isResumingSurvey', false);
    window.scrollTo(0, 0);
  };
  
  const handleBuyerEdit = () => {
    updateFormData('showReviewPage', false);
    updateFormData('buyerDetailsActiveStep', 1);
    updateFormData('buyerDetailsComplete', false);
    updateFormData('isResumingSurvey', false);
    // Do NOT reset showLoanDetails or showSellerQuestions - preserve user's progress
    window.scrollTo(0, 0);
  };
  
  const handleLoanEdit = () => {
    updateFormData('showReviewPage', false);
    updateFormData('showLoanDetails', true);
    updateFormData('showSellerQuestions', false);
    updateFormData('loanDetailsActiveStep', 1);
    updateFormData('loanDetailsComplete', false);
    updateFormData('isResumingSurvey', false);
    window.scrollTo(0, 0);
  };
  
  const handleSellerEdit = () => {
    updateFormData('showReviewPage', false);
    updateFormData('showLoanDetails', false);
    updateFormData('showSellerQuestions', true);
    updateFormData('sellerQuestionsActiveStep', 1);
    updateFormData('sellerQuestionsComplete', false);
    updateFormData('isResumingSurvey', false);
    window.scrollTo(0, 0);
  };
  
  // Render section card
  const renderSection = (title, fields, onEdit, index) => {
    if (fields.length === 0) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 + (index * 0.1), ease: "easeOut" }}
        className="border border-gray-200 rounded-lg p-6 mb-6 bg-white shadow-sm"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            className="px-4 py-2 cursor-pointer text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            Edit
          </motion.button>
        </div>
        <div className="space-y-3">
          {fields.map((field, fieldIndex) => (
            <motion.div
              key={field}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + (index * 0.1) + (fieldIndex * 0.05), ease: "easeOut" }}
              className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
            >
              <span className="text-gray-600">{getFieldLabel(field)}</span>
              <span className="text-gray-900 font-medium text-right">{formatFieldValue(field, formData[field])}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="review-summary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="max-w-4xl mx-auto p-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Review Your Information</h2>
          <p className="text-gray-600">Please review your information below. Click Edit on any section to make changes.</p>
        </motion.div>
        
        {renderSection('Property Details', propertyFieldsToShow, handlePropertyEdit, 0)}
        {renderSection('Buyer Profile', buyerFieldsToShow, handleBuyerEdit, 1)}
        {renderSection('Loan Details', loanFieldsToShow, handleLoanEdit, 2)}
        {renderSection('Seller Costs', sellerFieldsToShow, handleSellerEdit, 3)}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          className="mt-8 pt-6 border-t border-gray-200"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowReviewPage(false);
                updateFormData('showSummary', true);
                window.scrollTo(0, 0);
              }}
              className="px-6 py-3 cursor-pointer bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              Back to Results
            </motion.button>
            {progress < 100 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                className="text-center"
              >
                <button
                  disabled
                  className="px-8 py-4 bg-gray-300 text-gray-500 rounded-lg font-semibold text-lg cursor-not-allowed"
                >
                  Generate My Property Report
                </button>
                <p className="mt-3 text-sm text-gray-600">Survey incomplete - please fill all required fields</p>
              </motion.div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowReviewPage(false);
                  updateFormData('showSummary', true);
                  window.scrollTo(0, 0);
                }}
                className="px-8 py-4 bg-gray-800 text-white rounded-lg font-semibold text-lg hover:bg-gray-900 transition-colors shadow-lg"
              >
                Generate My Property Report
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

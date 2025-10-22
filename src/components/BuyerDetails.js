import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useFormNavigation from './shared/FormNavigation.js';
import { formatCurrency } from '../states/shared/baseCalculations.js';
import { useStateSelector } from '../states/useStateSelector.js';

import { useFormStore } from '../stores/formStore';
import { getQuestionSlideAnimation, getQuestionNumberAnimation } from './shared/animations/questionAnimations';
import { getBackButtonAnimation, getNextButtonAnimation } from './shared/animations/buttonAnimations';
import { getInputButtonAnimation, getInputFieldAnimation } from './shared/animations/inputAnimations';

export default function BuyerDetails() {
    const formData = useFormStore();
    const updateFormData = useFormStore(state => state.updateFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState('forward'); // 'forward' or 'backward'
  const [isInitialEntry, setIsInitialEntry] = useState(true); // Track if we're on initial entry from PropertyDetails
  const totalSteps = formData.isACT ? 10 : 7; // Add extra steps for ACT income, property ownership, and dependants questions
  
  // Get state-specific functions when state is selected
  const { stateFunctions } = useStateSelector(formData.selectedState || 'NSW');
  
  // Calculate the starting step number based on whether WA or ACT is selected
  const getStartingStepNumber = () => {
    if (formData.selectedState === 'WA') {
      return 7;
    } else if (formData.selectedState === 'ACT') {
      return 6; // ACT starts at 6, despite having extra income question
    } else {
      return 6;
    }
  };

  // Watch for buyerDetailsCurrentStep flag from SellerQuestions or LoanDetails
  useEffect(() => {
    if (formData.buyerDetailsCurrentStep) {
      setCurrentStep(formData.buyerDetailsCurrentStep);
      // Reset the flag
      updateFormData('buyerDetailsCurrentStep', null);
      // Ensure we're not in completion state when going back to a specific question
      if (formData.buyerDetailsComplete) {
        updateFormData('buyerDetailsComplete', false);
      }
      // Reset navigation flags to ensure proper flow
      updateFormData('showLoanDetails', false);
      updateFormData('showSellerQuestions', false);
    }
  }, [formData.buyerDetailsCurrentStep, updateFormData, formData.buyerDetailsComplete]);

  // Auto-set ownedPropertyLast5Years to "no" if first home buyer is "yes"
  useEffect(() => {
    if (formData.isFirstHomeBuyer === 'yes' && !formData.ownedPropertyLast5Years) {
      updateFormData('ownedPropertyLast5Years', 'no');
    }
  }, [formData.isFirstHomeBuyer, formData.ownedPropertyLast5Years, updateFormData]);

  // Auto-set hasPensionCard to "no" if explicitly not Australian resident
  useEffect(() => {
    if (formData.isAustralianResident === 'no' && formData.hasPensionCard === '') {
      updateFormData('hasPensionCard', 'no');
    }
  }, [formData.isAustralianResident, formData.hasPensionCard, updateFormData]);

  // Auto-set isPPR to "no" if buyer type is "investor"
  useEffect(() => {
    if (formData.buyerType === 'investor' && formData.isPPR !== 'no') {
      updateFormData('isPPR', 'no');
    }
  }, [formData.buyerType, formData.isPPR, updateFormData]);

  const nextStep = () => {
    // Mark that we've moved past the initial entry once we leave Q1
    if (currentStep === 1 && isInitialEntry) {
      setIsInitialEntry(false);
    }
    
    // Log current form entries before proceeding
    console.log('📋 Current Form Entries:', {
        // Property Details
      propertyAddress: formData.propertyAddress,
      selectedState: formData.selectedState,
      isWA: formData.isWA,
      propertyCategory: formData.propertyCategory,
      propertyType: formData.propertyType,
      propertyPrice: formData.propertyPrice,
      // Buyer Details
      buyerType: formData.buyerType,
      isPPR: formData.isPPR,
      isAustralianResident: formData.isAustralianResident,
      isFirstHomeBuyer: formData.isFirstHomeBuyer,
      ownedPropertyLast5Years: formData.ownedPropertyLast5Years,
      hasPensionCard: formData.hasPensionCard,
      needsLoan: formData.needsLoan,
      savingsAmount: formData.savingsAmount,
      income: formData.income,
      dependants: formData.dependants,
      // Loan Details (if applicable)
      loanDeposit: formData.loanDeposit,
      loanType: formData.loanType,
      loanTerm: formData.loanTerm,
      loanRate: formData.loanRate,
      loanLMI: formData.loanLMI,
      loanSettlementFees: formData.loanSettlementFees,
      loanEstablishmentFee: formData.loanEstablishmentFee,
      LVR: formData.LVR,
      LMI_COST: formData.LMI_COST,
      MONTHLY_LOAN_REPAYMENT: formData.MONTHLY_LOAN_REPAYMENT,
      ANNUAL_LOAN_REPAYMENT: formData.ANNUAL_LOAN_REPAYMENT,
      // Seller Questions
      councilRates: formData.councilRates,
      waterRates: formData.waterRates,
      constructionStarted: formData.constructionStarted,
      dutiableValue: formData.dutiableValue,
      bodyCorp: formData.bodyCorp,
      landTransferFee: formData.landTransferFee,
      legalFees: formData.legalFees,
      buildingAndPestInspection: formData.buildingAndPestInspection,
      FIRBFee: formData.FIRBFee,
      sellerQuestion9: formData.sellerQuestion9
    });
    
    if (currentStep < totalSteps) {
      setDirection('forward');
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        // Update the store with current step for progress tracking
        updateFormData('buyerDetailsActiveStep', currentStep + 1);
        
        // Trigger auto-selection when moving from savings to loan question
        const isMovingToLoanQuestion = 
          (currentStep === 6 && !formData.isACT) || // Non-ACT: savings (6) -> loan (7)
          (currentStep === 9 && formData.isACT);    // ACT: savings (9) -> loan (10)
        
        if (isMovingToLoanQuestion) {
          autoSuggestLoanDecision();
        }
      }, 150);
    } else if (currentStep === totalSteps) {
      // Form is complete
      updateFormData('buyerDetailsComplete', true);
      // Reset the navigation flags to ensure proper flow
      updateFormData('showLoanDetails', false);
      updateFormData('showSellerQuestions', false);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection('backward');
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        // Update the store with current step for progress tracking
        updateFormData('buyerDetailsActiveStep', currentStep - 1);
      }, 150);
    }
  };

  const handleBack = () => {
    setDirection('backward');
    // Go back to PropertyDetails
    updateFormData('propertyDetailsComplete', false);
    // Set PropertyDetails to show the last step (property price step)
    // For both WA and non-WA, the property price step is internal step 6
    updateFormData('propertyDetailsCurrentStep', 6);
  };

  // Check if current step is valid
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.buyerType && formData.buyerType.trim() !== '';
      case 2:
        return formData.isPPR && formData.isPPR.trim() !== '';
      case 3:
        return formData.isAustralianResident && formData.isAustralianResident.trim() !== '';
      case 4:
        return formData.isFirstHomeBuyer && formData.isFirstHomeBuyer.trim() !== '';
      case 5:
        return formData.isACT ? (formData.ownedPropertyLast5Years && formData.ownedPropertyLast5Years.trim() !== '') : (formData.hasPensionCard && formData.hasPensionCard.trim() !== '');
      case 6:
        return formData.isACT ? (formData.hasPensionCard && formData.hasPensionCard.trim() !== '') : (formData.savingsAmount && formData.savingsAmount.trim() !== '');
      case 7:
        return formData.isACT ? (formData.income && formData.income.trim() !== '') : (formData.needsLoan && formData.needsLoan.trim() !== '');
      case 8:
        return formData.isACT ? (formData.dependants && formData.dependants.trim() !== '') : (formData.needsLoan && formData.needsLoan.trim() !== '');
      case 9:
        return formData.isACT ? (formData.savingsAmount && formData.savingsAmount.trim() !== '') : true;
      case 10:
        return formData.isACT ? (formData.needsLoan && formData.needsLoan.trim() !== '') : true;
      default:
        return false;
    }
  };

  // Use shared navigation hook
  useFormNavigation({
    currentStep,
    totalSteps,
    isCurrentStepValid,
    onNext: nextStep,
    onPrev: prevStep,
    onComplete: () => {
      if (formData.buyerDetailsComplete) {
        // We're on the completion page, move to next section
        if (formData.needsLoan === 'yes') {
          updateFormData('showLoanDetails', true);
        } else {
          updateFormData('showSellerQuestions', true);
        }
      } else {
        // Handle form completion
        updateFormData('buyerDetailsComplete', true);
      }
    },
    onBack: handleBack,
    isComplete: formData.buyerDetailsComplete
  });

  // Update FIRB fee when relevant fields change
  useEffect(() => {
    formData.updateFIRBFee();
  }, [formData.propertyPrice, formData.propertyType, formData.isAustralianResident, formData.updateFIRBFee]);

  // Auto-suggest loan decision based on savings vs property price + stamp duty + 10,000
  const autoSuggestLoanDecision = () => {
    const propertyPrice = parseInt(formData.propertyPrice) || 0;
    const savingsAmount = parseInt(formData.savingsAmount) || 0;
    
    if (propertyPrice > 0 && savingsAmount > 0 && stateFunctions?.calculateStampDuty) {
      // Use existing stamp duty calculation
      const stampDuty = stateFunctions.calculateStampDuty(propertyPrice, formData.selectedState);
      const totalNeeded = propertyPrice + stampDuty + 10000;
      
      const suggestedLoan = savingsAmount >= totalNeeded ? 'no' : 'yes';
      
      // Only auto-suggest if the field is empty (first time)
      if (!formData.needsLoan || formData.needsLoan === '') {
        updateFormData('needsLoan', suggestedLoan);
      }
    }
  };

  // Get the suggested loan decision for visual indication
  const getSuggestedLoanDecision = () => {
    const propertyPrice = parseInt(formData.propertyPrice) || 0;
    const savingsAmount = parseInt(formData.savingsAmount) || 0;
    
    if (propertyPrice > 0 && savingsAmount > 0 && stateFunctions?.calculateStampDuty) {
      const stampDuty = stateFunctions.calculateStampDuty(propertyPrice, formData.selectedState);
      const totalNeeded = propertyPrice + stampDuty + 10000;
      
      return savingsAmount >= totalNeeded ? 'no' : 'yes';
    }
    return null;
  };


  // Helper function to generate loan suggestion text
  const getLoanSuggestionText = () => {
    const propertyPrice = parseInt(formData.propertyPrice) || 0;
    const savingsAmount = parseInt(formData.savingsAmount) || 0;
    
    if (propertyPrice > 0 && savingsAmount > 0 && stateFunctions?.calculateStampDuty) {
      // Use existing stamp duty calculation
      const stampDuty = stateFunctions.calculateStampDuty(propertyPrice, formData.selectedState);
      const totalNeeded = propertyPrice + stampDuty + 10000;
      
      if (savingsAmount >= totalNeeded) {
        return `You may not need a loan as you have savings of ${formatCurrency(savingsAmount)}.`;
      } else {
        return `You will likely need a loan as you have savings of ${formatCurrency(savingsAmount)}.`;
      }
    }
    
    return "This affects your loan calculations and costs.";
  };

  const renderStep = () => {
    // Show completion message if form is complete
    if (formData.buyerDetailsComplete) {
      return (
        <div className="flex flex-col mt-8 md:mt-0 pr-2">
          <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
            Buyer Details Complete
          </h2>
          <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
            {formData.needsLoan === 'yes' 
              ? 'Now let\'s get some details about your loan...'
              : 'Now let\'s ask a few additional questions some of which you need to ask the seller...'
            }
          </p>

        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="flex flex-col mt-8 md:mt-0 pr-2">
            <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
              Are you an Owner or Investor?
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              This affects your eligibility for concessions and grants
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:flex gap-2 mb-8">
              {[
                { value: 'owner-occupier', label: 'Owner-Occupier', description: 'I will live in this property' },
                { value: 'investor', label: 'Investor', description: 'I will rent this property out' }
              ].map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => updateFormData('buyerType', option.value)}
                  {...getInputButtonAnimation()}
                  className={`py-2 px-3 rounded-lg w-full md:w-[250px] border-2 flex flex-col items-start ${
                    formData.buyerType === option.value
                      ? 'border-gray-800 bg-secondary text-white shadow-lg'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-base font-medium mb-2 leading-none">{option.label}</div>
                  <div className={`text-xs leading-none text-left ${
                    formData.buyerType === option.value || 
                    formData.isPPR === option.value || 
                    formData.isAustralianResident === option.value || 
                    formData.isFirstHomeBuyer === option.value || 
                    formData.needsLoan === option.value
                      ? 'text-gray-300'
                      : 'text-gray-500'
                  }`}>{option.description}</div>
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col mt-8 md:mt-0 pr-2">
            <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
              Will you live in this property?
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              {formData.buyerType === 'investor' 
                ? "You have indicated you are an investor"
                : "This affects your eligibility for some concessions"
              }
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:flex gap-2 mb-8">
              {[
                { value: 'yes', label: 'Yes', description: 'This will be my main home' },
                { value: 'no', label: 'No', description: 'This will not be my main home' }
              ].map((option) => {
                const isDisabled = formData.buyerType === 'investor' && option.value === 'yes';
                return (
                  <motion.button
                    key={option.value}
                    onClick={() => !isDisabled && updateFormData('isPPR', option.value)}
                    disabled={isDisabled}
                    {...(!isDisabled ? getInputButtonAnimation() : {})}
                    className={`py-2 px-3 rounded-lg w-full md:w-[250px] border-2 flex flex-col items-start ${
                      isDisabled 
                        ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                        : formData.isPPR === option.value
                          ? 'border-gray-800 bg-secondary text-white shadow-lg'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-base font-medium mb-2 leading-none">{option.label}</div>
                    <div className={`text-xs leading-none text-left ${
                      formData.buyerType === option.value || 
                      formData.isPPR === option.value || 
                      formData.isAustralianResident === option.value || 
                      formData.isFirstHomeBuyer === option.value || 
                      formData.needsLoan === option.value
                        ? 'text-gray-400'
                        : 'text-gray-500'
                    }`}>{option.description}</div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col mt-8 md:mt-0 pr-2">
            <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
              Australian citizen or permanent resident?
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              Residents may have additional concessions and foreigners extra duties
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:flex gap-2 mb-8">
              {[
                { value: 'yes', label: 'Yes', description: 'Australian citizen or permanent resident' },
                { value: 'no', label: 'No, I reside overseas', description: 'Foreign buyer' }
              ].map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => updateFormData('isAustralianResident', option.value)}
                  {...getInputButtonAnimation()}
                  className={`py-2 px-3 rounded-lg w-full md:w-[250px] border-2 flex flex-col items-start ${
                    formData.isAustralianResident === option.value
                      ? 'border-gray-800 bg-secondary text-white shadow-lg'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-base font-medium mb-2 leading-none">{option.label}</div>
                  <div className={`text-xs leading-none text-left ${
                    formData.buyerType === option.value || 
                    formData.isPPR === option.value || 
                    formData.isAustralianResident === option.value || 
                    formData.isFirstHomeBuyer === option.value || 
                    formData.needsLoan === option.value
                      ? 'text-gray-400'
                      : 'text-gray-500'
                  }`}>{option.description}</div>
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col mt-8 md:mt-0 pr-2">
            <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
              Is this your first home purchase?
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              First home buyers may have additional concessions and grants.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:flex gap-2 mb-8">
              {[
                { value: 'yes', label: 'Yes', description: 'This is my first home purchase' },
                { value: 'no', label: 'No', description: 'I have owned property before' }
              ].map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => updateFormData('isFirstHomeBuyer', option.value)}
                  {...getInputButtonAnimation()}
                  className={`py-2 px-3 rounded-lg w-full md:w-[250px] border-2 flex flex-col items-start ${
                    formData.isFirstHomeBuyer === option.value
                      ? 'border-gray-800 bg-secondary text-white shadow-lg'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-base font-medium mb-2 leading-none">{option.label}</div>
                  <div className={`text-xs leading-none text-left ${
                    formData.buyerType === option.value || 
                    formData.isPPR === option.value || 
                    formData.isAustralianResident === option.value || 
                    formData.isFirstHomeBuyer === option.value || 
                    formData.needsLoan === option.value
                      ? 'text-gray-400'
                      : 'text-gray-500'
                  }`}>{option.description}</div>
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 5:
        if (formData.isACT) {
          return (
            <div className="flex flex-col mt-8 md:mt-0 pr-2">
              <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
                Have you owned any other property in the last 5 years?
              </h2>
              <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
                {formData.isFirstHomeBuyer === 'yes' 
                  ? 'You have indicated you are a first home buyer'
                  : 'This affects your eligibility for ACT Home Buyer Concession Scheme (HBCS).'
                }
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:flex gap-2 mb-8">
                {[
                  { value: 'yes', label: 'Yes', description: 'I have owned property in the last 5 years' },
                  { value: 'no', label: 'No', description: 'I have not owned property in the last 5 years' }
                ].map((option) => {
                  const isDisabled = formData.isFirstHomeBuyer === 'yes' && option.value === 'yes';
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => !isDisabled && updateFormData('ownedPropertyLast5Years', option.value)}
                      disabled={isDisabled}
                      {...(!isDisabled ? getInputButtonAnimation() : {})}
                      className={`py-2 px-3 rounded-lg w-full md:w-[260px] border-2 flex flex-col items-start ${
                        isDisabled 
                          ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                          : formData.ownedPropertyLast5Years === option.value
                            ? 'border-gray-800 bg-secondary text-white shadow-lg'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                    <div className="text-base font-medium mb-2 leading-none">{option.label}</div>
                    <div className={`text-xs leading-none text-left ${
                      isDisabled
                        ? 'text-gray-400'
                        : formData.buyerType === option.value || 
                          formData.isPPR === option.value || 
                          formData.isAustralianResident === option.value || 
                          formData.isFirstHomeBuyer === option.value || 
                          formData.ownedPropertyLast5Years === option.value
                            ? 'text-gray-400'
                            : 'text-gray-500'
                    }`}>{option.description}</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        } else {
          return (
            <div className="flex flex-col mt-8 md:mt-0 pr-2">
              <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
                Are you a holder of a pensioneer card?
              </h2>
              <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
                {formData.isAustralianResident !== 'yes' 
                  ? "You have indicated you are not an Australian Citizen or permanent resident"
                  : "This may affect your eligibility for additional concessions and grants."
                }
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:flex gap-2 mb-8">
                {[
                  { value: 'yes', label: 'Yes', description: 'I have a pension or concession card' },
                  { value: 'no', label: 'No', description: 'I do not have a pension or concession card' }
                ].map((option) => {
                  const isDisabled = formData.isAustralianResident !== 'yes' && option.value === 'yes';
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => !isDisabled && updateFormData('hasPensionCard', option.value)}
                      disabled={isDisabled}
                      {...(!isDisabled ? getInputButtonAnimation() : {})}
                      className={`py-2 px-3 rounded-lg w-full md:w-[260px] border-2 flex flex-col items-start ${
                        isDisabled 
                          ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                          : formData.hasPensionCard === option.value
                            ? 'border-gray-800 bg-secondary text-white shadow-lg'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-base font-medium mb-2 leading-none">{option.label}</div>
                      <div className={`text-xs leading-none text-left ${
                        isDisabled
                          ? 'text-gray-400'
                          : formData.buyerType === option.value || 
                            formData.isPPR === option.value || 
                            formData.isAustralianResident === option.value || 
                            formData.isFirstHomeBuyer === option.value || 
                            formData.hasPensionCard === option.value
                              ? 'text-gray-400'
                              : 'text-gray-500'
                      }`}>{option.description}</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        }

      case 6:
        if (formData.isACT) {
          return (
            <div className="flex flex-col mt-8 md:mt-0 pr-2">
              <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
                Are you a holder of a pensioneer card?
              </h2>
              <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
                {formData.isAustralianResident !== 'yes' 
                  ? "You have indicated you are not an Australian Citizen or permanent resident"
                  : "This may affect your eligibility for additional concessions and grants."
                }
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:flex gap-2 mb-8">
                {[
                  { value: 'yes', label: 'Yes', description: 'I have a pension or concession card' },
                  { value: 'no', label: 'No', description: 'I do not have a pension or concession card' }
                ].map((option) => {
                  const isDisabled = formData.isAustralianResident !== 'yes' && option.value === 'yes';
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => !isDisabled && updateFormData('hasPensionCard', option.value)}
                      disabled={isDisabled}
                      {...(!isDisabled ? getInputButtonAnimation() : {})}
                      className={`py-2 px-3 rounded-lg w-full md:w-[260px] border-2 flex flex-col items-start ${
                        isDisabled 
                          ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                          : formData.hasPensionCard === option.value
                            ? 'border-gray-800 bg-secondary text-white shadow-lg'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-base font-medium mb-2 leading-none">{option.label}</div>
                      <div className={`text-xs leading-none text-left ${
                        isDisabled
                          ? 'text-gray-400'
                          : formData.buyerType === option.value || 
                            formData.isPPR === option.value || 
                            formData.isAustralianResident === option.value || 
                            formData.isFirstHomeBuyer === option.value || 
                            formData.hasPensionCard === option.value
                              ? 'text-gray-400'
                              : 'text-gray-500'
                      }`}>{option.description}</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        } else {
          return (
            <div className="flex flex-col mt-8 md:mt-0 pr-2">
              <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
                How much savings do you have?
              </h2>
              <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8 ">
                You will need savings to cover the deposit and other upfront costs.
              </p>
              <div className=" relative pr-8">
                <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none ${
                  formData.savingsAmount ? 'text-gray-800' : 'text-gray-400'
                }`}>
                  $
                </div>
                <motion.input
                  type="tel"
                  placeholder="0"
                  value={formData.savingsAmount ? formatCurrency(parseInt(formData.savingsAmount)).replace('$', '') : ''}
                  onChange={(e) => {
                    // Remove all non-digit characters and update form data
                    const numericValue = e.target.value.replace(/[^\d]/g, '');
                    updateFormData('savingsAmount', numericValue);
                  }}
                  {...getInputFieldAnimation()}
                  className="w-50 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
                />
              </div>
            </div>
          );
        }

      case 7:
        if (formData.isACT) {
          return (
            <div className="flex flex-col mt-8 md:mt-0 pr-2">
              <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
                What is your income?
              </h2>
              <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
                In ACT the Home Buyer Concession Scheme (HBCS) is income tested.
              </p>
              <div className=" relative pr-8">
                <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none ${
                  formData.income ? 'text-gray-800' : 'text-gray-400'
                }`}>
                  $
                </div>
                <motion.input
                  type="tel"
                  placeholder="0"
                  value={formData.income ? formatCurrency(parseInt(formData.income)).replace('$', '') : ''}
                  onChange={(e) => {
                    // Remove all non-digit characters and update form data
                    const numericValue = e.target.value.replace(/[^\d]/g, '');
                    updateFormData('income', numericValue);
                  }}
                  {...getInputFieldAnimation()}
                  className="w-50 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
                />
              </div>
            </div>
          );
        } else {
          return (
            <div className="flex flex-col mt-8 md:mt-0 pr-2">
              <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
                Do you need a loan to purchase?
              </h2>
              <p className={`lg:text-lg xl:text-xl lg:mb-20 leading-relaxed mb-8 ${
                formData.needsLoan && formData.needsLoan !== '' && formData.needsLoan !== getSuggestedLoanDecision() 
                  ? 'text-primary' 
                  : 'text-gray-500'
              }`}>
                {getLoanSuggestionText()}
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:flex gap-2 mb-8">
                {[
                  { value: 'yes', label: 'Yes', description: 'I need a loan to purchase' },
                  { value: 'no', label: 'No', description: 'I will pay cash' }
                ].map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => updateFormData('needsLoan', option.value)}
                    {...getInputButtonAnimation()}
                    className={`py-2 px-3 rounded-lg w-full md:w-[250px] border-2 flex flex-col items-start ${
                      formData.needsLoan === option.value
                        ? 'border-gray-800 bg-secondary text-white shadow-lg'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-base font-medium mb-2 leading-none">{option.label}</div>
                    <div className={`text-xs leading-none ${
                      formData.buyerType === option.value || 
                      formData.isPPR === option.value || 
                      formData.isAustralianResident === option.value || 
                      formData.isFirstHomeBuyer === option.value || 
                      formData.needsLoan === option.value
                        ? 'text-gray-500'
                        : 'text-gray-500'
                    }`}>{option.description}</div>
                  </motion.button>
                ))}
              </div>
            </div>
          );
        }

      case 8:
        if (formData.isACT) {
          return (
            <div className="flex flex-col mt-8 md:mt-0 pr-2">
              <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
                How many dependants do you have?
              </h2>
              <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
                This affects your eligibility for the Home Buyer Concession Scheme (HBCS) in ACT.
              </p>
              <div className=" relative pr-8">
                <motion.input
                  type="tel"
                  placeholder="0"
                  value={formData.dependants || ''}
                  onChange={(e) => {
                    // Only allow whole numbers
                    const numericValue = e.target.value.replace(/[^\d]/g, '');
                    updateFormData('dependants', numericValue);
                  }}
                  {...getInputFieldAnimation()}
                  className="w-32 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
                />
              </div>
            </div>
          );
        } else {
          return null; // This case should not be reached for non-ACT
        }

      case 9:
        if (formData.isACT) {
          return (
            <div className="flex flex-col mt-8 md:mt-0 pr-2">
              <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
                How much savings do you have?
              </h2>
              <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8 ">
              You will need savings to cover the deposit and other upfront costs.
              </p>
              <div className=" relative pr-8">
                <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none ${
                  formData.savingsAmount ? 'text-gray-800' : 'text-gray-400'
                }`}>
                  $
                </div>
                <motion.input
                  type="tel"
                  placeholder="0"
                  value={formData.savingsAmount ? formatCurrency(parseInt(formData.savingsAmount)).replace('$', '') : ''}
                  onChange={(e) => {
                    // Remove all non-digit characters and update form data
                    const numericValue = e.target.value.replace(/[^\d]/g, '');
                    updateFormData('savingsAmount', numericValue);
                  }}
                  {...getInputFieldAnimation()}
                  className="w-64 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
                />
              </div>
            </div>
          );
        } else {
          return null; // This case should not be reached for non-ACT
        }

      case 10:
        if (formData.isACT) {
          return (
            <div className="flex flex-col mt-8 md:mt-0 pr-2">
              <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
                Do you need a loan to purchase?
              </h2>
              <p className={`lg:text-lg xl:text-xl lg:mb-20 leading-relaxed mb-8 ${
                formData.needsLoan && formData.needsLoan !== '' && formData.needsLoan !== getSuggestedLoanDecision() 
                  ? 'text-primary' 
                  : 'text-gray-500'
              }`}>
                {getLoanSuggestionText()}
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:flex gap-2 mb-8">
                {[
                  { value: 'yes', label: 'Yes', description: 'I need a loan to purchase' },
                  { value: 'no', label: 'No', description: 'I will pay cash' }
                ].map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => updateFormData('needsLoan', option.value)}
                    {...getInputButtonAnimation()}
                    className={`py-2 px-3 rounded-lg w-full md:w-[250px] border-2 flex flex-col items-start ${
                      formData.needsLoan === option.value
                        ? 'border-gray-800 bg-secondary text-white shadow-lg'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-base font-medium mb-2 leading-none">{option.label}</div>
                    <div className={`text-xs leading-none ${
                      formData.needsLoan === option.value
                        ? 'text-gray-300'
                        : 'text-gray-500'
                    }`}>{option.description}</div>
                  </motion.button>
                ))}
              </div>
            </div>
          );
        } else {
          return null; // This case should not be reached for non-ACT
        }

      default:
        return null;
    }
  };

  return (
    <div className="bg-base-100 rounded-lg overflow-hidden mt-15">
      <div className="flex">
        <AnimatePresence mode="wait">
          <motion.span
            key={`step-${formData.buyerDetailsComplete ? 'complete' : currentStep}`}
            {...getQuestionNumberAnimation(direction, 0.4)}
            className={`flex items-center text-xs -mt-93 md:-mt-93 lg:-mt-93 lg:text-sm lg:pt-15 font-extrabold mr-2 pt-14 whitespace-nowrap ${
              formData.buyerDetailsComplete ? 'text-base-100' : 'text-primary'
            }`}
          >
            {(formData.buyerDetailsComplete ? getStartingStepNumber() : currentStep + getStartingStepNumber() - 1) < 10 ? <span className="text-xs text-base-100">&nbsp;&nbsp;&nbsp;</span> : null}
            {formData.buyerDetailsComplete ? getStartingStepNumber() : currentStep + getStartingStepNumber() - 1} 
            <span className={`text-xs ${formData.buyerDetailsComplete ? 'text-primary' : ''}`}>→</span>
          </motion.span>
        </AnimatePresence>
        <div className="pb-6 pb-24 md:pb-8 flex">
          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${formData.buyerDetailsComplete ? 'complete' : currentStep}`}
              {...getQuestionSlideAnimation(direction, formData.buyerDetailsComplete || (currentStep === 1 && isInitialEntry), 0.5, 0.3)}
              className="h-80"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation - Fixed bottom on mobile, normal position on desktop */}
      <div className="md:pl-8 xl:text-lg fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto bg-base-100 md:bg-transparent pt-0 pr-4 pb-4 pl-4 md:p-0 md:mt-8 md:px-6 md:pb-8 lg:mt-15 xl:mt-30">
        {/* Progress Bar - Now rendered on main page for medium+ screens */}
        <div className="block md:hidden w-full bg-gray-100 h-1 mb-4">
          <div 
            className="bg-primary h-1 transition-all duration-300"
            style={{ width: `${formData.buyerDetailsComplete ? 100 : ((currentStep - 1) / totalSteps) * 100}%` }}
          ></div>
        </div>
        
        <div className="flex justify-start mx-auto mt-4">
          {formData.buyerDetailsComplete ? (
            // Completion state: Back and Next buttons
            <>
              <motion.button
                onClick={() => {
                  setDirection('backward');
                  updateFormData('buyerDetailsComplete', false);
                  // Go back to the loan question (last question before completion)
                  setCurrentStep(formData.isACT ? 10 : 7); // Go back to loan question
                }}
                {...getBackButtonAnimation()}
                className="bg-primary px-6 py-3 rounded-full border border-primary font-medium hover:bg-primary hover:border-gray-700 hover:shadow-sm flex-shrink-0 cursor-pointer"
              >
                &lt;
              </motion.button>
              
              <motion.button
                onClick={() => {
                  // Move to next section based on loan need
                  if (formData.needsLoan === 'yes') {
                    // Go to loan details - set a flag to show it
                    updateFormData('showLoanDetails', true);
                  } else {
                    // Go to seller questions - set a flag to show it
                    updateFormData('showSellerQuestions', true);
                  }
                }}
                {...getNextButtonAnimation()}
                className="flex-1 ml-4 px-6 py-3 rounded-full border border-primary bg-primary hover:bg-primary hover:border-gray-700 hover:shadow-sm font-medium cursor-pointer"
              >
                Next
              </motion.button>
            </>
          ) : currentStep === 1 ? (
            // Step 1: Back to PropertyDetails and Next buttons
            <>
              <motion.button
                onClick={handleBack}
                {...getBackButtonAnimation()}
                className="bg-primary px-6 py-3 rounded-full border border-primary font-medium hover:bg-primary hover:border-gray-700 hover:shadow-sm flex-shrink-0 cursor-pointer"
              >
                &lt;
              </motion.button>
              
              <motion.button
                onClick={nextStep}
                disabled={!isCurrentStepValid()}
                {...getNextButtonAnimation(isCurrentStepValid())}
                className={`flex-1 ml-4 px-6 py-3 rounded-full border border-primary font-medium ${
                  !isCurrentStepValid()
                    ? 'border-primary-100 cursor-not-allowed bg-primary text-base-100'
                    : 'bg-primary hover:bg-primary hover:border-gray-700 hover:shadow-sm cursor-pointer'
                }`}
              >
                {(() => {
                  const isLoanQuestion = (currentStep === 7 && !formData.isACT) || (currentStep === 10 && formData.isACT);
                  if (isLoanQuestion) {
                    return "Add in concessions";
                  }
                  return 'Next';
                })()}
              </motion.button>
            </>
          ) : (
            // Step 2 onwards: Back and Next buttons
            <>
              <motion.button
                onClick={prevStep}
                {...getBackButtonAnimation()}
                className="bg-primary px-6 py-3 rounded-full border border-primary font-medium hover:bg-primary hover:border-gray-700 hover:shadow-sm flex-shrink-0 cursor-pointer"
              >
                &lt;
              </motion.button>
              
              <motion.button
                onClick={nextStep}
                disabled={!isCurrentStepValid()}
                {...getNextButtonAnimation(isCurrentStepValid())}
                className={`flex-1 ml-4 px-6 py-3 bg-primary rounded-full border border-primary font-medium ${
                  !isCurrentStepValid()
                    ? 'border-primary-100 cursor-not-allowed bg-gray-50 text-base-100'
                    : 'text-secondary hover:bg-primary hover:border-gray-700 hover:shadow-sm cursor-pointer'
                }`}
              >
                {(() => {
                  const isLoanQuestion = (currentStep === 7 && !formData.isACT) || (currentStep === 10 && formData.isACT);
                  if (isLoanQuestion) {
                    return "Add in concessions";
                  }
                  return 'Next';
                })()}
              </motion.button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useFormNavigation from './shared/FormNavigation.js';
import { useFormStore } from '../stores/formStore';
import { formatCurrency } from '../states/shared/baseCalculations.js';
import { getQuestionSlideAnimation, getQuestionNumberAnimation } from './shared/animations/questionAnimations';
import { getBackButtonAnimation, getNextButtonAnimation } from './shared/animations/buttonAnimations';
import { getInputButtonAnimation, getInputFieldAnimation } from './shared/animations/inputAnimations';

export default function SellerQuestions() {
  const formData = useFormStore();
  const updateFormData = useFormStore(state => state.updateFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState('forward');
  const [isInitialEntry, setIsInitialEntry] = useState(true);
  const [localCompletionState, setLocalCompletionState] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [buttonsExiting, setButtonsExiting] = useState(false);
  const totalSteps = 8;

  // Calculate the starting step number based on WA, ACT selection and loan need
  const getStartingStepNumber = () => {
    const isWA = formData.selectedState === 'WA';
    const isACT = formData.selectedState === 'ACT';
    const needsLoan = formData.needsLoan === 'yes';
    
    if (needsLoan) {
      // Loan path: PropertyDetails + BuyerDetails + LoanDetails
      if (isWA) {
        // WA: PropertyDetails (6) + BuyerDetails starts at (7) + 7 steps + LoanDetails (7) = 20
        return 21;
      } else if (isACT) {
        // ACT: PropertyDetails (5) + BuyerDetails starts at (6) + 10 steps + LoanDetails (7) = 23
        return 23;
      } else {
        // Non-WA/ACT: PropertyDetails (5) + BuyerDetails starts at (6) + 7 steps + LoanDetails (7) = 19
        return 20;
      }
    } else {
      // No loan path: PropertyDetails + BuyerDetails
      if (isWA) {
        // WA: PropertyDetails (6) + BuyerDetails starts at (7) + 7 steps = 13
        return 14;
      } else if (isACT) {
        // ACT: PropertyDetails (5) + BuyerDetails starts at (6) + 10 steps = 16
        return 16;
      } else {
        // Non-WA/ACT: PropertyDetails (5) + BuyerDetails starts at (6) + 7 steps = 13
        return 13;
      }
    }
  };

  // Calculate the actual number of steps being shown based on property type
  const getActualStepsShown = () => {
    const shouldShowConstructionQuestions = formData.propertyType === 'off-the-plan' || formData.propertyType === 'house-and-land';
    const isOffThePlanNonVIC = formData.propertyType === 'off-the-plan' && formData.selectedState !== 'VIC';
    
    if (shouldShowConstructionQuestions) {
      if (isOffThePlanNonVIC) {
        // Off-the-plan (non-VIC): Skip dutiable value question (subtract 1)
        return totalSteps - 1;
      } else {
        // VIC off-the-plan or house-and-land: All questions shown
        return totalSteps;
      }
    } else {
      // Construction questions are skipped (subtract 2)
      return totalSteps - 2;
    }
  };

  // Map internal currentStep to actual step position within visible steps
  const getActualStepPosition = () => {
    const shouldShowConstructionQuestions = formData.propertyType === 'off-the-plan' || formData.propertyType === 'house-and-land';
    const isOffThePlanNonVIC = formData.propertyType === 'off-the-plan' && formData.selectedState !== 'VIC';
    
    if (shouldShowConstructionQuestions) {
      if (isOffThePlanNonVIC) {
        // Off-the-plan (non-VIC): Skip dutiable value question (case 4)
        if (currentStep <= 3) {
          return currentStep;
        } else if (currentStep >= 5) {
          return currentStep - 1; // Adjust for skipped case 4
        } else {
          return currentStep; // Case 4 shouldn't happen, but fallback
        }
      } else {
        // VIC off-the-plan or house-and-land: All questions shown
        return currentStep;
      }
    } else {
      // Construction questions are skipped (cases 3-4)
      if (currentStep <= 2) {
        return currentStep;
      } else if (currentStep >= 5) {
        return currentStep - 2; // Adjust for skipped cases 3-4
      } else {
        return currentStep; // Cases 3-4 shouldn't happen, but fallback
      }
    }
  };

  // Calculate the current step number for display, accounting for skipped questions
  const getCurrentStepNumber = () => {
    const shouldShowConstructionQuestions = formData.propertyType === 'off-the-plan' || formData.propertyType === 'house-and-land';
    const isOffThePlanNonVIC = formData.propertyType === 'off-the-plan' && formData.selectedState !== 'VIC';
    
    let stepNumber;
    
    if (shouldShowConstructionQuestions) {
      if (isOffThePlanNonVIC) {
        // Off-the-plan (non-VIC): Skip dutiable value question (case 4)
        if (currentStep <= 3) {
          // Cases 1-3: Normal numbering
          stepNumber = currentStep + getStartingStepNumber() - 1;
        } else if (currentStep >= 5) {
          // Cases 5+: Adjust for skipped dutiable value question (subtract 1)
          stepNumber = (currentStep - 1) + getStartingStepNumber() - 1;
        } else {
          // Case 4: Shouldn't happen for off-the-plan (non-VIC), but fallback
          stepNumber = currentStep + getStartingStepNumber() - 1;
        }
      } else {
        // VIC off-the-plan or house-and-land: All questions shown
        stepNumber = currentStep + getStartingStepNumber() - 1;
      }
    } else {
      // Construction questions are skipped, adjust numbering
      if (currentStep <= 2) {
        // Cases 1-2: Normal numbering
        stepNumber = currentStep + getStartingStepNumber() - 1;
      } else if (currentStep >= 5) {
        // Cases 5+: Adjust for skipped questions (subtract 2)
        stepNumber = (currentStep - 2) + getStartingStepNumber() - 1;
      } else {
        // Cases 3-4: Shouldn't happen, but fallback
        stepNumber = currentStep + getStartingStepNumber() - 1;
      }
    }
    
    
    return stepNumber;
  };

  const nextStep = useCallback(() => {
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
      // Monthly ongoing costs
      COUNCIL_RATES_MONTHLY: formData.COUNCIL_RATES_MONTHLY,
      WATER_RATES_MONTHLY: formData.WATER_RATES_MONTHLY,
      BODY_CORP_MONTHLY: formData.BODY_CORP_MONTHLY
    });
    
    // Initialize the store with current step if this is the first call
    if (currentStep === 1) {
      updateFormData('sellerQuestionsActiveStep', currentStep);
    }
    
    // Check if we should show construction questions
    const shouldShowConstructionQuestions = formData.propertyType === 'off-the-plan' || formData.propertyType === 'house-and-land';
    
    let nextStepNumber = currentStep + 1;
    
    // Skip construction questions if they shouldn't be shown
    if (!shouldShowConstructionQuestions) {
      if (currentStep === 2) {
        // After water rates, skip to body corporate (case 5)
        nextStepNumber = 5;
      }
    } else {
      // Skip dutiable value for off-the-plan (non-VIC)
      if (currentStep === 3 && formData.propertyType === 'off-the-plan' && formData.selectedState !== 'VIC') {
        // Skip from construction started to body corporate
        nextStepNumber = 5;
        // Auto-set dutiable value
        updateFormData('dutiableValue', formData.propertyPrice);
      }
    }
    
    if (currentStep < totalSteps) {
      setDirection('forward');
      setTimeout(() => {
        setCurrentStep(nextStepNumber);
        // Update the store with current step for progress tracking
        updateFormData('sellerQuestionsActiveStep', nextStepNumber);
      }, 150);
    } else if (currentStep === totalSteps) {
      // Form is complete
      updateFormData('sellerQuestionsComplete', true);
      // Update ongoing costs when seller questions complete
      formData.updateOngoingCosts();
      // Don't set localCompletionState here - it will be set when the completion page is shown
      
      // Log final form completion
      console.log('📊 Final Complete Form Summary:', {
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
        buildingAndPestInspection: formData.buildingAndPestInspection
      });
    }
  }, [currentStep, totalSteps, updateFormData, formData]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      // Check if we should show construction questions
      const shouldShowConstructionQuestions = formData.propertyType === 'off-the-plan' || formData.propertyType === 'house-and-land';
      
      let prevStepNumber = currentStep - 1;
      
      // Skip construction questions if they shouldn't be shown
      if (!shouldShowConstructionQuestions) {
        if (currentStep === 5) {
          // When going back from body corporate, skip to water rates (case 2)
          prevStepNumber = 2;
        }
      } else {
        // Handle back navigation for off-the-plan (non-VIC)
        if (currentStep === 5 && formData.propertyType === 'off-the-plan' && formData.selectedState !== 'VIC') {
          // When going back from body corporate, skip to construction started (case 3)
          prevStepNumber = 3;
        }
      }
      
      setDirection('backward');
      setTimeout(() => {
        setCurrentStep(prevStepNumber);
        // Update the store with current step for progress tracking
        updateFormData('sellerQuestionsActiveStep', prevStepNumber);
      }, 150);
    }
  }, [currentStep, updateFormData, formData.propertyType, formData.selectedState]);

  const handleBack = useCallback(() => {
    setDirection('backward');
    // Reset the current section completion and visibility
    updateFormData('sellerQuestionsComplete', false);
    updateFormData('showSellerQuestions', false);

    if (formData.needsLoan === 'yes') {
      // Go back to LoanDetails Q7 (loan path)
      updateFormData('loanDetailsComplete', false);
      updateFormData('showLoanDetails', true);
      updateFormData('loanDetailsCurrentStep', 7);
      // Reset the showSellerQuestions flag to ensure proper flow
      updateFormData('showSellerQuestions', false);
             } else {
      // Go back to BuyerDetails (no loan path - "Do you need a loan?" question)
      updateFormData('buyerDetailsComplete', false);
      updateFormData('showLoanDetails', false);
      // For ACT, the loan question is step 10, for others it's step 7
      const loanQuestionStep = formData.selectedState === 'ACT' ? 10 : 7;
      updateFormData('buyerDetailsCurrentStep', loanQuestionStep);
    }
  }, [formData.needsLoan, updateFormData, formData.selectedState]);



  // Check if current step is valid
  const isCurrentStepValid = useCallback(() => {
    const shouldShowConstructionQuestions = formData.propertyType === 'off-the-plan' || formData.propertyType === 'house-and-land';
    
    switch (currentStep) {
      case 1:
        return formData.councilRates && formData.councilRates.trim() !== '';
      case 2:
        return formData.waterRates && formData.waterRates.trim() !== '';
      case 3:
        return shouldShowConstructionQuestions ? (formData.constructionStarted && formData.constructionStarted.trim() !== '') : true;
      case 4:
        // Skip validation for off-the-plan (non-VIC) since we auto-set the value
        if (formData.propertyType === 'off-the-plan' && formData.selectedState !== 'VIC') {
          return true; // Always valid since we auto-set the value
        }
        return shouldShowConstructionQuestions ? (formData.dutiableValue && formData.dutiableValue.trim() !== '') : true;
      case 5:
        return formData.bodyCorp && formData.bodyCorp.trim() !== '';
      case 6:
        return formData.landTransferFee && formData.landTransferFee.trim() !== '';
      case 7:
        return formData.legalFees && formData.legalFees.trim() !== '';
      case 8:
        return formData.buildingAndPestInspection && formData.buildingAndPestInspection.trim() !== '';
      default:
        return false;
    }
  }, [currentStep, formData.councilRates, formData.waterRates, formData.constructionStarted, formData.dutiableValue, formData.bodyCorp, formData.landTransferFee, formData.legalFees, formData.buildingAndPestInspection, formData.propertyType, formData.selectedState]);

  // Initialize currentStep from store when component mounts
  useEffect(() => {
    if (formData.sellerQuestionsActiveStep && formData.sellerQuestionsActiveStep > 0) {
      setCurrentStep(formData.sellerQuestionsActiveStep);
    }
  }, [formData.sellerQuestionsActiveStep]);

  // Set localCompletionState when sellerQuestionsComplete becomes true
  useEffect(() => {
    if (formData.sellerQuestionsComplete) {
      setLocalCompletionState(true);
    }
  }, [formData.sellerQuestionsComplete]);

  // Set default rates when user reaches relevant steps
  useEffect(() => {
    if (currentStep === 1 && !formData.councilRates && formData.propertyPrice) {
      const propertyPrice = parseInt(formData.propertyPrice) || 0;
      const defaultCouncilRates = Math.round(propertyPrice * 0.0015); // 0.15%
      updateFormData('councilRates', defaultCouncilRates.toString());
    }
    if (currentStep === 2 && !formData.waterRates) {
      updateFormData('waterRates', '1500');
    }
  }, [currentStep, formData.councilRates, formData.waterRates, formData.propertyPrice, updateFormData]);

  // Auto-advance when construction questions are skipped
  useEffect(() => {
    const shouldShowConstructionQuestions = formData.propertyType === 'off-the-plan' || formData.propertyType === 'house-and-land';
    
    if (!shouldShowConstructionQuestions) {
      if (currentStep === 3 || currentStep === 4) {
        // Skip to body corporate question (case 5)
        setCurrentStep(5);
        updateFormData('sellerQuestionsActiveStep', 5);
      }
    } else {
      // Auto-advance for off-the-plan (non-VIC) - skip dutiable value question
      if (formData.propertyType === 'off-the-plan' && formData.selectedState !== 'VIC') {
        if (currentStep === 4) {
          // Skip to body corporate question (case 5) and auto-set dutiable value
          updateFormData('dutiableValue', formData.propertyPrice);
          setCurrentStep(5);
          updateFormData('sellerQuestionsActiveStep', 5);
        }
      }
    }
  }, [currentStep, formData.propertyType, formData.selectedState, formData.propertyPrice, updateFormData]);

  // Use shared navigation hook
  useFormNavigation({
    currentStep,
    totalSteps,
    isCurrentStepValid,
    onNext: nextStep,
    onPrev: prevStep,
    onComplete: useCallback(() => {
      if (localCompletionState) {
        // We're on the completion page, move to final completion
        updateFormData('allFormsComplete', true);
        updateFormData('showSummary', true);
      } else {
        // Handle form completion
        updateFormData('sellerQuestionsComplete', true);
        setLocalCompletionState(true);
      }
    }, [localCompletionState, updateFormData]),
    onBack: useCallback(() => {
      if (localCompletionState) {
        // We're on the completion page, go back to the last question
        updateFormData('sellerQuestionsComplete', false);
        setLocalCompletionState(false);
        setCurrentStep(8);
      } else {
        // We're on a question, use the normal back logic
        handleBack();
      }
    }, [localCompletionState, updateFormData, handleBack]),
    isComplete: localCompletionState
  });

  const renderStep = () => {
    // Show completion message if form is complete
    if (localCompletionState) {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="seller-complete"
            {...getQuestionSlideAnimation('forward', false, 0.5, 0.3)}
            className="flex flex-col mt-8 md:mt-0 pr-2"
          >
            <h2 
              className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight"
            >
              Seller Questions Complete
            </h2>
            <p 
              className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8"
            >
              All forms are now complete!
            </p>
          </motion.div>
        </AnimatePresence>
      );
    }
    switch (currentStep) {
      case 1:
        return (
          <div className="flex flex-col mt-8 md:mt-0 pr-2">
            <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
              Ask the seller: What are the annual council rates?
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              Below is an estimate only based on the property price
            </p>
            <div className="relative pr-8">
              <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none ${
                formData.councilRates ? 'text-gray-800' : 'text-gray-400'
              }`}>
                $
              </div>
              <motion.input
                type="tel"
                placeholder="0"
                value={formData.councilRates ? formatCurrency(parseInt(formData.councilRates)).replace('$', '') : ''}
                onChange={(e) => {
                  // Remove all non-digit characters and update form data
                  const numericValue = e.target.value.replace(/[^\d]/g, '');
                  updateFormData('councilRates', numericValue);
                }}
                {...getInputFieldAnimation()}
                className="w-35 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col mt-8 md:mt-0 pr-2">
            <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
            Ask the seller: What are the annual water rates?
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              Annual water rates and service charges
            </p>
            <div className="relative pr-8">
              <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none ${
                formData.waterRates ? 'text-gray-800' : 'text-gray-400'
              }`}>
                $
              </div>
              <motion.input
                type="tel"
                placeholder="0"
                value={formData.waterRates ? formatCurrency(parseInt(formData.waterRates)).replace('$', '') : ''}
                onChange={(e) => {
                  // Remove all non-digit characters and update form data
                  const numericValue = e.target.value.replace(/[^\d]/g, '');
                  updateFormData('waterRates', numericValue);
                }}
                {...getInputFieldAnimation()}
                className="w-35 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
              />
            </div>
          </div>
        );

      case 3:
        // Only show construction question if property type is off-the-plan or house-and-land
        if (formData.propertyType === 'off-the-plan' || formData.propertyType === 'house-and-land') {
          return (
            <div className="flex flex-col mt-8 md:mt-0 pr-2">
              <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
                Has construction already started on the property?
              </h2>
              <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
                Determine if construction work has begun
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8">
                {[
                  { value: 'yes', label: 'Yes', description: 'Construction has started' },
                  { value: 'no', label: 'No', description: 'Construction has not started' }
                ].map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => updateFormData('constructionStarted', option.value)}
                    {...getInputButtonAnimation()}
                    className={`py-2 px-3 rounded-lg border-2 flex flex-col items-start ${
                      formData.constructionStarted === option.value
                        ? 'border-gray-800 bg-secondary text-white shadow-lg'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-base font-medium mb-2 leading-none">{option.label}</div>
                    <div className={`text-xs leading-none text-left ${
                      formData.constructionStarted === option.value
                        ? 'text-gray-300'
                        : 'text-gray-500'
                    }`}>{option.description}</div>
                  </motion.button>
                ))}
              </div>
            </div>
          );
        } else {
          // Skip to next question (case 5 - body corporate)
          return null;
        }

      case 4:
        // Only show dutiable value question if property type is off-the-plan or house-and-land
        if (formData.propertyType === 'off-the-plan' || formData.propertyType === 'house-and-land') {
          // Skip dutiable value question for off-the-plan (non-VIC) and auto-set value
          if (formData.propertyType === 'off-the-plan' && formData.selectedState !== 'VIC') {
            // Auto-set dutiable value to property price and skip to next question
            updateFormData('dutiableValue', formData.propertyPrice);
            // This will be handled by the navigation logic
            return null;
          }
          
          // Show dutiable value question for VIC off-the-plan or house-and-land
          return (
            <div className="flex flex-col mt-8 md:mt-0 pr-2">
              <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
                What is the dutiable value of the property?
              </h2>
              <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
                The value used to calculate stamp duty and transfer duty
              </p>
              <div className="relative pr-8">
                <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none ${
                  formData.dutiableValue ? 'text-gray-800' : 'text-gray-400'
                }`}>
                  $
                </div>
                <motion.input
                  type="tel"
                  placeholder="0"
                  value={formData.dutiableValue ? formatCurrency(parseInt(formData.dutiableValue)).replace('$', '') : ''}
                  onChange={(e) => {
                    // Remove all non-digit characters and update form data
                    const numericValue = e.target.value.replace(/[^\d]/g, '');
                    updateFormData('dutiableValue', numericValue);
                  }}
                  {...getInputFieldAnimation()}
                  className="w-50 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
                />
              </div>
            </div>
          );
        } else {
          // Skip to next question (case 5 - body corporate)
          return null;
        }

      case 5:
        return (
          <div className="flex flex-col mt-8 md:mt-0 pr-2">
            <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
              Ask the seller: Is there body corporate or strata fees?
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              Annual body corporate or strata fees
            </p>
            <div className="relative pr-8">
              <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none ${
                formData.bodyCorp ? 'text-gray-800' : 'text-gray-400'
              }`}>
                $
              </div>
              <motion.input
                type="tel"
                placeholder="0"
                value={formData.bodyCorp ? formatCurrency(parseInt(formData.bodyCorp)).replace('$', '') : ''}
                onChange={(e) => {
                  // Remove all non-digit characters and update form data
                  const numericValue = e.target.value.replace(/[^\d]/g, '');
                  updateFormData('bodyCorp', numericValue);
                }}
                {...getInputFieldAnimation()}
                className="w-40 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="flex flex-col mt-8 md:mt-0 pr-2">
            <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
              What is the Land Transfer Fee?
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              Official registration of property ownership
            </p>
            <div className="relative pr-8">
              <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none ${
                formData.landTransferFee ? 'text-gray-800' : 'text-gray-400'
              }`}>
                $
              </div>
              <motion.input
                type="tel"
                placeholder="0"
                value={formData.landTransferFee ? formatCurrency(parseInt(formData.landTransferFee)).replace('$', '') : ''}
                onChange={(e) => {
                  // Remove all non-digit characters and update form data
                  const numericValue = e.target.value.replace(/[^\d]/g, '');
                  updateFormData('landTransferFee', numericValue);
                }}
                {...getInputFieldAnimation()}
                className="w-40 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
              />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="flex flex-col mt-8 md:mt-0 pr-2">
            <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
              What is the cost for Legal & Conveyancing Services?
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              Professional legal services for property transfer
            </p>
            <div className="relative pr-8">
              <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none ${
                formData.legalFees ? 'text-gray-800' : 'text-gray-400'
              }`}>
                $
              </div>
              <motion.input
                type="tel"
                placeholder="0"
                value={formData.legalFees ? formatCurrency(parseInt(formData.legalFees)).replace('$', '') : ''}
                onChange={(e) => {
                  // Remove all non-digit characters and update form data
                  const numericValue = e.target.value.replace(/[^\d]/g, '');
                  updateFormData('legalFees', numericValue);
                }}
                {...getInputFieldAnimation()}
                className="w-40 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
              />
            </div>
          </div>
        );

      case 8:
        return (
          <div className="flex flex-col mt-8 md:mt-0 pr-2">
            <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
              What is the cost for Building and Pest Inspection?
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              Professional inspection of property condition and pest assessment
            </p>
            <div className="relative pr-8">
              <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none ${
                formData.buildingAndPestInspection ? 'text-gray-800' : 'text-gray-400'
              }`}>
                $
              </div>
              <motion.input
                type="tel"
                placeholder="0"
                value={formData.buildingAndPestInspection ? formatCurrency(parseInt(formData.buildingAndPestInspection)).replace('$', '') : ''}
                onChange={(e) => {
                  // Remove all non-digit characters and update form data
                  const numericValue = e.target.value.replace(/[^\d]/g, '');
                  updateFormData('buildingAndPestInspection', numericValue);
                }}
                {...getInputFieldAnimation()}
                className="w-35 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
              />
            </div>
          </div>
        );


      default:
        return null;
    }
  };

  return (
    <div className="bg-base-100 rounded-lg overflow-hidden mt-15">
      <div className="flex">
        <AnimatePresence mode="wait">
          <motion.span
            key={`step-${isExiting ? 'exiting' : (formData.sellerQuestionsComplete ? 'complete' : currentStep)}`}
            {...getQuestionNumberAnimation(direction, 0.4)}
            className={`flex items-center text-xs -mt-93 md:-mt-93 lg:-mt-93 lg:text-sm lg:pt-15 font-extrabold mr-2 pt-14 whitespace-nowrap ${
              formData.sellerQuestionsComplete ? 'text-base-100' : 'text-primary'
            }`}
          >
            <span className="text-xs text-base-100">{formData.needsLoan === 'yes' ? '3' : '2'}</span>
            {formData.sellerQuestionsComplete ? (getStartingStepNumber() + getActualStepsShown() - 1) : getCurrentStepNumber()} 
            <span 
              className={`text-xs ${formData.sellerQuestionsComplete ? 'text-primary' : ''}`}
            >
              →
            </span>
          </motion.span>
        </AnimatePresence>
        <div className="pb-6 pb-24 md:pb-8 flex">
          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${isExiting ? 'exiting' : (formData.sellerQuestionsComplete ? 'complete' : currentStep)}`}
              {...getQuestionSlideAnimation(direction, false, 0.5, 0.3)}
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
            style={{ width: `${localCompletionState ? 100 : ((getActualStepPosition() - 1) / getActualStepsShown()) * 100}%` }}
          ></div>
        </div>
        
                 <div className="flex justify-between mx-auto mt-4">
           {localCompletionState ? (
             // Completion state: Back to last question and Next to final completion
             <AnimatePresence mode="wait">
               <motion.div
                 key={`completion-buttons-${buttonsExiting ? 'exiting' : 'visible'}`}
                 initial={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 20 }}
                 transition={{ duration: 0.4, ease: "easeInOut" }}
                 className="flex w-full"
               >
                 <motion.button
                   onClick={() => {
                     setDirection('backward');
                     // Small delay to ensure direction is set before state changes
                     setTimeout(() => {
                       setLocalCompletionState(false);
                       setCurrentStep(8);
                       updateFormData('sellerQuestionsComplete', false);
                     }, 10);
                   }}
                   {...getBackButtonAnimation()}
                   className="bg-primary px-6 py-3 rounded-full border border-primary font-medium hover:bg-primary hover:border-gray-700 hover:shadow-sm flex-shrink-0 cursor-pointer"
                 >
                   &lt;
                 </motion.button>
                 
                 <motion.button
                   onClick={() => {
                     // Trigger button exit animation first
                     setButtonsExiting(true);
                     // Then trigger content exit animation
                     setTimeout(() => {
                       setIsExiting(true);
                       setDirection('forward');
                     }, 100);
                     // Set final state after both animations complete
                     setTimeout(() => {
                       updateFormData('allFormsComplete', true);
                       updateFormData('showSummary', true);
                     }, 300);
                   }}
                   {...getNextButtonAnimation()}
                   className="flex-1 ml-4 px-6 py-3 bg-primary rounded-full border border-primary font-medium hover:bg-primary hover:border-gray-700 hover:shadow-sm cursor-pointer"
                 >
                   Complete
                 </motion.button>
               </motion.div>
             </AnimatePresence>
           ) : currentStep === 1 ? (
            // Step 1: Back to BuyerDetails and Next buttons
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
                Next
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
                {currentStep === totalSteps ? 'Add in other costs' : 'Next'}
              </motion.button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


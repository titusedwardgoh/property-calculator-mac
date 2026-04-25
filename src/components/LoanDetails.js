import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useFormNavigation from './shared/FormNavigation.js';
import { useFormStore } from '../stores/formStore';
import { getQuestionSlideAnimation, getQuestionNumberAnimation } from './shared/animations/questionAnimations';
import { getBackButtonAnimation, getNextButtonAnimation } from './shared/animations/buttonAnimations';
import { calculateGlobalProgress } from '../lib/progressCalculation';
import {
  useNetStateDuty,
  LoanDepositStep,
  LoanTypeStep,
  LoanTermStep,
  LoanRateStep,
  LoanLMIStep,
  LoanSettlementFeesStep,
  LoanEstablishmentFeeStep,
} from './shared/loanFieldSteps.jsx';

export default function LoanDetails() {
  const formData = useFormStore();
  const updateFormData = useFormStore(state => state.updateFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState('forward');
  const [isInitialEntry, setIsInitialEntry] = useState(true); // Track if we're on initial entry from BuyerDetails
  const [showCalculatingOverlay, setShowCalculatingOverlay] = useState(false);
  const [overlayPhase, setOverlayPhase] = useState('calculating'); // 'calculating' | 'done'
  const totalSteps = 7;

  // Calculate net state duty at component level
  const netStateDuty = useNetStateDuty(formData);

  // Calculate the starting step number based on WA and ACT selection
  const getStartingStepNumber = () => {
    const isWA = formData.selectedState === 'WA';
    const isACT = formData.selectedState === 'ACT';
    
    if (isWA) {
      // WA: PropertyDetails (6) + BuyerDetails starts at (7) + 7 steps = 14
      return 14;
    } else if (isACT) {
      // ACT: PropertyDetails (5) + BuyerDetails starts at (6) + 10 steps = 16
      return 16;
    } else {
      // Non-WA/ACT: PropertyDetails (5) + BuyerDetails starts at (6) + 7 steps = 13
      return 13;
    }
  };

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
    
    // Initialize the store with current step if this is the first call
    if (currentStep === 1) {
      updateFormData('loanDetailsActiveStep', currentStep);
    }
    
    if (currentStep < totalSteps) {
      setDirection('forward');
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        // Update the store with current step for progress tracking
        updateFormData('loanDetailsActiveStep', currentStep + 1);
      }, 150);
    } else if (currentStep === totalSteps) {
      // Show overlay (same as BuyerDetails) before completing
      setOverlayPhase('calculating');
      setShowCalculatingOverlay(true);
      setTimeout(() => setOverlayPhase('done'), 2500); // Sit tight for 2.5s, then done for 1s
      setTimeout(() => {
        setShowCalculatingOverlay(false);
        updateFormData('loanDetailsComplete', true);
        updateFormData('loanDetailsEverCompleted', true);
      }, 3500);
      
      // Log final form completion
      console.log('📊 Final Form Summary:', {
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
        // Loan Details (if applicable)
        loanDeposit: formData.loanDeposit,
        loanType: formData.loanType,
        loanTerm: formData.loanTerm,
        loanInterestOnlyPeriod: formData.loanInterestOnlyPeriod,
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
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection('backward');
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        // Update the store with current step for progress tracking
        updateFormData('loanDetailsActiveStep', currentStep - 1);
      }, 150);
    }
  };

  const handleBack = () => {
    setDirection('backward');
    // Go back to BuyerDetails last question
    updateFormData('buyerDetailsComplete', false);
    // Reset the navigation flags to ensure proper flow
    updateFormData('showLoanDetails', false);
    updateFormData('showSellerQuestions', false);
    // Set BuyerDetails to show the last question
    // For ACT: step 10 (savings question), for others: step 7 (savings question)
    const lastStep = formData.selectedState === 'ACT' ? 10 : 7;
    updateFormData('buyerDetailsCurrentStep', lastStep);
  };

  // Check if current step is valid
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        const depositAmount = parseInt(formData.loanDeposit) || 0;
        const propertyPrice = parseInt(formData.propertyPrice) || 0;
        const minimumDeposit = Math.round(propertyPrice * 0.05);
        
        const maximumDeposit = propertyPrice + netStateDuty;
        
        return depositAmount > 0 && 
               depositAmount >= minimumDeposit && 
               depositAmount <= maximumDeposit;
      case 2:
        return formData.loanType && formData.loanType.trim() !== '';
      case 3:
        const loanTermValid = formData.loanTerm && parseInt(formData.loanTerm) >= 1 && parseInt(formData.loanTerm) <= 30;
        if (formData.loanType === 'interest-only') {
          const interestOnlyPeriod = parseInt(formData.loanInterestOnlyPeriod) || 0;
          const loanTerm = parseInt(formData.loanTerm) || 0;
          return loanTermValid && 
                 formData.loanInterestOnlyPeriod && 
                 interestOnlyPeriod >= 1 && 
                 interestOnlyPeriod <= 5 &&
                 interestOnlyPeriod <= loanTerm;
        }
        return loanTermValid;
      case 4:
        return formData.loanRate && parseFloat(formData.loanRate) >= 0.01 && parseFloat(formData.loanRate) <= 20;
      case 5:
        return formData.loanLMI && formData.loanLMI.trim() !== '';
      case 6:
        return formData.loanSettlementFees && parseFloat(formData.loanSettlementFees) >= 0;
      case 7:
        return formData.loanEstablishmentFee && parseFloat(formData.loanEstablishmentFee) >= 0;
      default:
        return false;
    }
  };

  // Auto-advance on resume: only advance through steps that were already confirmed (user clicked Next)
  // Stop at the step where user left off, even if it has a pre-filled value
  useEffect(() => {
    if (formData.isResumingSurvey) {
      // If section is already complete, advance to next section (SellerQuestions)
      if (formData.loanDetailsComplete) {
        // Advance to SellerQuestions
        updateFormData('showSellerQuestions', true);
        // Only set sellerQuestionsActiveStep to 1 if it's not already set (user hasn't started SellerQuestions yet)
        // Don't overwrite existing progress in SellerQuestions
        if (!formData.sellerQuestionsActiveStep || formData.sellerQuestionsActiveStep === 1) {
          updateFormData('sellerQuestionsActiveStep', 1);
        }
        // Reset completion flag temporarily to allow transition
        updateFormData('loanDetailsComplete', false);
        // Stop resuming in this component - SellerQuestions will handle its own auto-advance
        setTimeout(() => {
          formData.setIsResumingSurvey(false);
        }, 200);
        return;
      }
      
      const activeStep = formData.loanDetailsActiveStep || 1;
      
      // Only auto-advance through steps that were already confirmed (before active step)
      if (currentStep < activeStep && isCurrentStepValid()) {
        // Auto-advance through confirmed steps
        const timer = setTimeout(() => {
          if (currentStep < totalSteps) {
            nextStep();
          } else {
            // Reached the end, mark as complete
            updateFormData('loanDetailsComplete', true);
          }
        }, 300); // Small delay to allow UI to render
        
        return () => clearTimeout(timer);
      } else if (currentStep === activeStep) {
        // Stop at the step where user left off - show it even if pre-filled
        // User must manually click Next to confirm pre-filled values
        setTimeout(() => {
          formData.setIsResumingSurvey(false);
        }, 200);
      } else {
        // Hit a question without an answer - stop resuming after 200ms delay
        setTimeout(() => {
          formData.setIsResumingSurvey(false);
        }, 200);
      }
    }
  }, [formData.isResumingSurvey, formData.loanDetailsComplete, formData.loanDetailsActiveStep, currentStep, isCurrentStepValid, nextStep, totalSteps, updateFormData]);

  // Progress calculation - memoized with step-based dependencies only
  const progressPercentage = useMemo(() => {
    return calculateGlobalProgress(formData, {})
  }, [
    // Step numbers
    currentStep,
    formData.loanDetailsActiveStep,
    // Completion flags
    formData.loanDetailsComplete,
    // Branching decisions
    formData.needsLoan,
    formData.selectedState,
    // NOT: typed fields
  ])

  // Use shared navigation hook
  useFormNavigation({
    currentStep,
    totalSteps,
    isCurrentStepValid,
    onNext: nextStep,
    onPrev: prevStep,
    onComplete: () => {
      if (formData.loanDetailsComplete) {
        // We're on the completion page, move to next section
        updateFormData('showSellerQuestions', true);
      } else {
        // Handle form completion
        updateFormData('loanDetailsComplete', true);
        updateFormData('loanDetailsEverCompleted', true);
      }
    },
    onBack: handleBack,
    isComplete: formData.loanDetailsComplete
  });

  // Initialize currentStep from loanDetailsActiveStep when resuming
  useEffect(() => {
    if (formData.isResumingSurvey && formData.loanDetailsActiveStep && formData.loanDetailsActiveStep !== currentStep) {
      setCurrentStep(formData.loanDetailsActiveStep);
      // Don't reset loanDetailsComplete here - let auto-advance useEffect handle it
    }
  }, [formData.isResumingSurvey, formData.loanDetailsActiveStep]);

  // Watch for loanDetailsCurrentStep flag from SellerQuestions
  useEffect(() => {
    if (formData.loanDetailsCurrentStep) {
      setCurrentStep(formData.loanDetailsCurrentStep);
      // Reset the flag
      updateFormData('loanDetailsCurrentStep', null);
      // Ensure we're not in completion state when going back to a specific question
      if (formData.loanDetailsComplete) {
        updateFormData('loanDetailsComplete', false);
      }
      // Don't reset showLoanDetails - we want to stay on this component
      // Only reset showSellerQuestions to ensure proper flow
      updateFormData('showSellerQuestions', false);
    }
  }, [formData.loanDetailsCurrentStep, updateFormData, formData.loanDetailsComplete]);

  // Update LVR when deposit amount or property price changes
  useEffect(() => {
    console.log('📊 Calculating LVR with:', {
      propertyPrice: formData.propertyPrice,
      loanDeposit: formData.loanDeposit,
      propertyPriceParsed: parseInt(formData.propertyPrice) || 0,
      loanDepositParsed: parseInt(formData.loanDeposit) || 0
    });
    formData.updateLVR();
    console.log('📊 LVR after update:', formData.LVR);
  }, [formData.loanDeposit, formData.propertyPrice, formData.updateLVR]);

  // Set default LMI selection based on LVR - updates automatically when LVR changes
  useEffect(() => {
    if (formData.LVR >= 0) {  // Changed from > 0 to >= 0 to handle LVR = 0 case
      const defaultLMI = formData.LVR >= 0.8 ? 'yes' : 'no';
      // Only update if it's different from current value
      if (formData.loanLMI !== defaultLMI) {
        updateFormData('loanLMI', defaultLMI);
      }
    }
  }, [formData.LVR, updateFormData]);

  // Update LMI cost when relevant fields change
  useEffect(() => {
    formData.updateLMI();
  }, [formData.loanLMI, formData.LVR, formData.propertyPrice, formData.selectedState, formData.updateLMI]);

  // Update loan repayments when relevant fields change
  useEffect(() => {
    formData.updateLoanRepayments();
  }, [formData.loanDeposit, formData.propertyPrice, formData.loanRate, formData.loanTerm, formData.loanType, formData.loanInterestOnlyPeriod, formData.loanLMI, formData.LMI_COST, formData.LMI_STAMP_DUTY, formData.updateLoanRepayments]);

  // Set default fees when user reaches relevant steps
  useEffect(() => {
    if (currentStep === 6 && !formData.loanSettlementFees) {
      updateFormData('loanSettlementFees', '200');
    }
    if (currentStep === 7 && !formData.loanEstablishmentFee) {
      updateFormData('loanEstablishmentFee', '500');
    }
  }, [currentStep, formData.loanSettlementFees, formData.loanEstablishmentFee, updateFormData]);

  const renderStep = () => {
    // Show completion message if form is complete
    if (formData.loanDetailsComplete) {
      return (
        <div className="flex flex-col mt-8 md:mt-0 pr-2">
          <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
            {formData.editingFromReview ? 'Review of Loan Details Complete' : 'Loan Details Complete'}
          </h2>
          <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
            {formData.editingFromReview ? 'There may be some additional questions to answer based on your changes' : "Now let's ask a few additional final questions..."}
          </p>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <LoanDepositStep
            depositValue={formData.loanDeposit}
            onDepositChange={(v) => updateFormData('loanDeposit', v)}
            formData={formData}
            netStateDuty={netStateDuty}
          />
        );

      case 2:
        return (
          <LoanTypeStep
            loanType={formData.loanType}
            onLoanTypeChange={(v) => updateFormData('loanType', v)}
          />
        );

      case 3:
        return (
          <LoanTermStep
            loanTerm={formData.loanTerm}
            onLoanTermChange={(v) => updateFormData('loanTerm', v)}
            loanType={formData.loanType}
            loanInterestOnlyPeriod={formData.loanInterestOnlyPeriod}
            onInterestOnlyPeriodChange={(v) => updateFormData('loanInterestOnlyPeriod', v)}
          />
        );

      case 4:
        return (
          <LoanRateStep
            loanRate={formData.loanRate}
            onLoanRateChange={(v) => updateFormData('loanRate', v)}
          />
        );

      case 5:
        return (
          <LoanLMIStep
            loanLMI={formData.loanLMI}
            onLoanLMIChange={(v) => updateFormData('loanLMI', v)}
            LVR={formData.LVR}
          />
        );

      case 6:
        return (
          <LoanSettlementFeesStep
            value={formData.loanSettlementFees}
            onChange={(v) => updateFormData('loanSettlementFees', v)}
          />
        );

      case 7:
        return (
          <LoanEstablishmentFeeStep
            value={formData.loanEstablishmentFee}
            onChange={(v) => updateFormData('loanEstablishmentFee', v)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {showCalculatingOverlay && (
        <div className="aurora-loading-overlay fixed inset-0 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="min-h-[2.5rem] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {overlayPhase === 'calculating' ? (
                  <motion.p
                    key="calculating"
                    initial={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="text-gray-600"
                  >
                    Calculating your on-going costs!
                  </motion.p>
                ) : (
                  <motion.p
                    key="done"
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="text-gray-600"
                  >
                    Success! Your on-going costs are ready!
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    <div className="bg-transparent rounded-lg overflow-visible mt-15">
      <div className="flex">
        <AnimatePresence mode="wait">
          <motion.span
            key={`step-${formData.loanDetailsComplete ? 'complete' : currentStep}`}
            {...getQuestionNumberAnimation(direction, 0.4)}
            className={`flex items-center text-xs -mt-93 md:-mt-93 lg:-mt-93 lg:text-sm lg:pt-15 font-extrabold mr-2 pt-14 whitespace-nowrap ${formData.loanDetailsComplete ? 'text-base-100' : 'text-primary'}`}
          >
            <span className="text-xs text-base-100">{formData.needsLoan === 'yes' ? '3' : '2'}</span>{formData.loanDetailsComplete ? (getStartingStepNumber() + totalSteps - 1) : (currentStep + getStartingStepNumber() - 1)} 
            <span className={`text-xs ${formData.loanDetailsComplete ? 'text-primary' : ''}`}>→</span>
          </motion.span>
        </AnimatePresence>
        <div className="flex pb-6 pb-24 md:pb-8">
          <div className="relative min-h-[20rem] overflow-visible">
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${formData.loanDetailsComplete ? 'complete' : currentStep}`}
                {...getQuestionSlideAnimation(direction, formData.loanDetailsComplete || (currentStep === 1 && isInitialEntry), 0.5, 0.3)}
                className="overflow-visible"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation - Fixed bottom on mobile, normal position on desktop */}
      <div className="md:pl-8 xl:text-lg fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto bg-transparent pt-0 pr-4 pb-4 pl-4 md:p-0 md:mt-8 md:px-6 md:pb-8 lg:mt-15 xl:mt-15">
        {/* Progress Bar - Now rendered on main page for medium+ screens */}
        <div className="block md:hidden w-full bg-gray-100 h-1 mb-4">
          <div 
            className="bg-primary h-1 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        <div className="flex justify-start mx-auto mt-4">
          {formData.loanDetailsComplete ? (
            // Completion state: Back to Q7 and Next to SellerQuestions
            <>
              <motion.button
                onClick={() => {
                  setDirection('backward');
                  updateFormData('loanDetailsComplete', false);
                  setCurrentStep(7);
                }}
                {...getBackButtonAnimation()}
                className="bg-primary px-6 py-3 rounded-full border border-primary font-medium hover:bg-primary hover:border-gray-700 hover:shadow-sm flex-shrink-0 cursor-pointer"
              >
                &lt;
              </motion.button>
              
              <motion.button
                onClick={() => {
                  if (formData.editingFromReview) {
                    updateFormData('showReviewPage', true);
                    updateFormData('editingFromReview', false);
                    return;
                  }
                  updateFormData('showSellerQuestions', true);
                }}
                {...getNextButtonAnimation()}
                className="flex-1 ml-4 px-6 py-3 bg-primary rounded-full border border-primary font-medium hover:bg-primary hover:border-gray-700 hover:shadow-sm cursor-pointer"
              >
                Next
              </motion.button>
            </>
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
                {currentStep === totalSteps ? 'Add in loan costs' : 'Next'}
              </motion.button>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

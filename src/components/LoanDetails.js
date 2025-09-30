import { useState, useEffect } from 'react';
import useFormNavigation from './shared/FormNavigation.js';
import { useFormStore } from '../stores/formStore';
import { formatCurrency } from '../states/shared/baseCalculations.js';

export default function LoanDetails() {
  const formData = useFormStore();
  const updateFormData = useFormStore(state => state.updateFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

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
      // Seller Questions
      councilRates: formData.councilRates,
      waterRates: formData.waterRates,
      constructionStarted: formData.constructionStarted,
      dutiableValue: formData.dutiableValue,
      bodyCorp: formData.bodyCorp,
      landTransferFee: formData.landTransferFee,
      legalFees: formData.legalFees,
      buildingAndPestInspection: formData.buildingAndPestInspection,
      sellerQuestion9: formData.sellerQuestion9
    });
    
    // Initialize the store with current step if this is the first call
    if (currentStep === 1) {
      updateFormData('loanDetailsActiveStep', currentStep);
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      // Update the store with current step for progress tracking
      updateFormData('loanDetailsActiveStep', currentStep + 1);
    } else if (currentStep === totalSteps) {
      // Form is complete
      updateFormData('loanDetailsComplete', true);
      updateFormData('loanDetailsEverCompleted', true);
      
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
        loanRate: formData.loanRate,
        loanLMI: formData.loanLMI,
        loanSettlementFees: formData.loanSettlementFees,
        loanEstablishmentFee: formData.loanEstablishmentFee,
        // Seller Questions
        councilRates: formData.councilRates,
        waterRates: formData.waterRates,
        constructionStarted: formData.constructionStarted,
        dutiableValue: formData.dutiableValue,
        bodyCorp: formData.bodyCorp,
        landTransferFee: formData.landTransferFee,
        legalFees: formData.legalFees,
        buildingAndPestInspection: formData.buildingAndPestInspection,
        sellerQuestion9: formData.sellerQuestion9
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Update the store with current step for progress tracking
      updateFormData('loanDetailsActiveStep', currentStep - 1);
    }
  };

  const handleBack = () => {
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
        return formData.loanDeposit && parseInt(formData.loanDeposit) > 0;
      case 2:
        return formData.loanType && formData.loanType.trim() !== '';
      case 3:
        return formData.loanTerm && parseInt(formData.loanTerm) >= 1 && parseInt(formData.loanTerm) <= 30;
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



  const renderStep = () => {
    // Show completion message if form is complete
    if (formData.loanDetailsComplete) {
      return (
        <div className="flex flex-col mt-12 pr-2">
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-base text-gray-800 mb-4 leading-tight">
            Loan Details Complete
          </h2>
          <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
            Now let&apos;s ask a few additional questions some of which you need to ask the seller...
          </p>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="flex flex-col mt-12 pr-2">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-base text-gray-800 mb-4 leading-tight">
              What is your deposit amount?
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              This will help us calculate your loan amount and LMI requirements
            </p>
            <div className="relative pr-8">
              <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none ${
                formData.loanDeposit ? 'text-gray-800' : 'text-gray-400'
              }`}>
                $
              </div>
              <input
                type="tel"
                placeholder="0"
                value={formData.loanDeposit ? formatCurrency(parseInt(formData.loanDeposit)).replace('$', '') : ''}
                onChange={(e) => {
                  // Remove all non-digit characters and update form data
                  const numericValue = e.target.value.replace(/[^\d]/g, '');
                  updateFormData('loanDeposit', numericValue);
                }}
                className="w-64 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none transition-all duration-200 hover:border-gray-300"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col mt-12 pr-2">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-base text-gray-800 mb-4 leading-tight">
              What type of loan do you need?
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              This affects your monthly payments and loan structure
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:flex gap-2 mb-8">
              {[
                { value: 'principal-and-interest', label: 'Principal and Interest', description: 'Pay both principal and interest each month' },
                { value: 'interest-only', label: 'Interest Only', description: 'Pay only interest for a set period' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFormData('loanType', option.value)}
                  className={`py-2 px-3 rounded-lg w-full md:w-[260px] border-2 flex flex-col items-start transition-all duration-200 hover:scale-105 ${
                    formData.loanType === option.value
                      ? 'border-gray-800 bg-secondary text-white shadow-lg'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-base font-medium mb-2 leading-none">{option.label}</div>
                  <div className={`text-xs leading-none text-left ${
                    formData.loanType === option.value
                      ? 'text-gray-300'
                      : 'text-gray-500'
                  }`}>{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col mt-12 pr-2">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-base text-gray-800 mb-4 leading-tight">
              How long do you want your mortgage for?
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              Enter the number of years for your loan (1-30 years)
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="30"
                step="1"
                placeholder="30"
                value={formData.loanTerm || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 1 && value <= 30) {
                    updateFormData('loanTerm', value.toString());
                  } else if (e.target.value === '') {
                    updateFormData('loanTerm', '');
                  }
                }}
                className="w-15 pl-4 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none transition-all duration-200 hover:border-gray-300 text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="pl-4 text-xl text-gray-500">
                years
              </span>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col mt-12 pr-2">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-base text-gray-800 mb-4 leading-tight">
              What is your interest rate are you paying?
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              Enter the annual interest rate percentage for your loan
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.01"
                max="20"
                step="0.01"
                placeholder="6"
                value={formData.loanRate || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow numbers with up to 2 decimal places
                  if (/^\d*\.?\d{0,2}$/.test(value)) {
                    updateFormData('loanRate', value);
                  }
                }}
                className="w-20 pl-2 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none transition-all duration-200 hover:border-gray-300 text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-xl text-gray-500">
                %
              </span>
            </div>
            {formData.loanRate && parseFloat(formData.loanRate) > 10 && (
              <p className="text-sm text-primary mt-2 italic">
                That feels like quite a high rate!
              </p>
            )}
          </div>
        );

      case 5:
        return (
          <div className="flex flex-col mt-12 pr-2">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-base text-gray-800 mb-4 leading-tight">
              Do you need Lenders Mortgage Insurance?
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              LMI is typically required when your deposit is less than 20% of the property value
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:flex gap-2 mb-8">
              {[
                { value: 'yes', label: 'Yes', description: 'I need LMI coverage' },
                { value: 'no', label: 'No', description: 'I don\'t need LMI coverage' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFormData('loanLMI', option.value)}
                  className={`py-2 px-3 rounded-lg w-full md:w-[260px] border-2 flex flex-col items-start transition-all duration-200 hover:scale-105 ${
                    formData.loanLMI === option.value
                      ? 'border-gray-800 bg-secondary text-white shadow-lg'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-base font-medium mb-2 leading-none">{option.label}</div>
                  <div className={`text-xs leading-none text-left ${
                    formData.loanLMI === option.value
                      ? 'text-gray-300'
                      : 'text-gray-500'
                  }`}>{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="flex flex-col mt-12 pr-2">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-base text-gray-800 mb-4 leading-tight">
              Banks usually charge a Settlement Fee
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              Fee charged by the bank for settlement processing
            </p>
            <div className="relative pr-8">
              <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none ${
                formData.loanSettlementFees ? 'text-gray-800' : 'text-gray-400'
              }`}>
                $
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="200"
                value={formData.loanSettlementFees || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value >= 0) {
                    updateFormData('loanSettlementFees', value.toString());
                  } else if (e.target.value === '') {
                    updateFormData('loanSettlementFees', '');
                  }
                }}
                className="w-30 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none transition-all duration-200 hover:border-gray-300"
              />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="flex flex-col mt-12 pr-2">
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-base text-gray-800 mb-4 leading-tight">
              Banks usually charge an Establishment Fee
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              Fee charged by the bank for setting up your loan
            </p>
            <div className="relative pr-8">
              <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none ${
                formData.loanEstablishmentFee ? 'text-gray-800' : 'text-gray-400'
              }`}>
                $
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="600"
                value={formData.loanEstablishmentFee || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value >= 0) {
                    updateFormData('loanEstablishmentFee', value.toString());
                  } else if (e.target.value === '') {
                    updateFormData('loanEstablishmentFee', '');
                  }
                }}
                className="w-30 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none transition-all duration-200 hover:border-gray-300"
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
        <span className={`flex items-center text-xs -mt-85 md:-mt-70 lg:-mt-68 lg:text-sm xl:text-xl lg:pt-15 xl:-mt-64 font-extrabold mr-2 pt-14 whitespace-nowrap ${formData.loanDetailsComplete ? 'text-base-100' : 'text-primary'}`}>
          <span className="text-xs text-base-100">{formData.needsLoan === 'yes' ? '3' : '2'}</span>{formData.loanDetailsComplete ? (getStartingStepNumber() + totalSteps - 1) : (currentStep + getStartingStepNumber() - 1)} 
          <span className={`text-xs ${formData.loanDetailsComplete ? 'text-primary' : ''}`}>→</span>
        </span>
        <div className="pb-6 pb-24 md:pb-8 flex">
          {/* Step Content */}
          <div className="h-80">
            {renderStep()}
          </div>
        </div>
      </div>

      {/* Navigation - Fixed bottom on mobile, normal position on desktop */}
      <div className="md:pl-8 xl:text-lg fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto bg-base-100 md:bg-transparent pt-0 pr-4 pb-4 pl-4 md:p-0 md:mt-8 md:px-6 md:pb-8 lg:mt-15 xl:mt-30">
        {/* Progress Bar - Now rendered on main page for medium+ screens */}
        <div className="block md:hidden w-full bg-gray-100 h-1 mb-4">
          <div 
            className="bg-primary h-1 transition-all duration-300"
            style={{ width: `${formData.loanDetailsComplete ? 100 : ((currentStep - 1) / totalSteps) * 100}%` }}
          ></div>
        </div>
        
        <div className="flex justify-start mx-auto mt-4">
          {formData.loanDetailsComplete ? (
            // Completion state: Back to Q7 and Next to SellerQuestions
            <>
              <button
                onClick={() => {
                  updateFormData('loanDetailsComplete', false);
                  setCurrentStep(7);
                }}
                className="bg-primary px-6 py-3 rounded-full border border-primary font-medium hover:bg-primary hover:border-gray-700 hover:shadow-sm flex-shrink-0 cursor-pointer"
              >
                &lt;
              </button>
              
              <button
                onClick={() => updateFormData('showSellerQuestions', true)}
                className="flex-1 ml-4 px-6 py-3 bg-primary rounded-full border border-primary font-medium hover:bg-primary hover:border-gray-700 hover:shadow-sm cursor-pointer"
              >
                Next
              </button>
            </>
          ) : currentStep === 1 ? (
            // Step 1: Back to BuyerDetails and Next buttons
            <>
              <button
                onClick={handleBack}
                className="bg-primary px-6 py-3 rounded-full border border-primary font-medium hover:bg-primary hover:border-gray-700 hover:shadow-sm flex-shrink-0 cursor-pointer"
              >
                &lt;
              </button>
              
              <button
                onClick={nextStep}
                disabled={!isCurrentStepValid()}
                className={`flex-1 ml-4 px-6 py-3 rounded-full border border-primary font-medium ${
                  !isCurrentStepValid()
                    ? 'border-primary-100 cursor-not-allowed bg-primary text-base-100'
                    : 'bg-primary hover:bg-primary hover:border-gray-700 hover:shadow-sm cursor-pointer'
                }`}
              >
                Next
              </button>
            </>
          ) : (
            // Step 2 onwards: Back and Next buttons
            <>
              <button
                onClick={prevStep}
                className="bg-primary px-6 py-3 rounded-full border border-primary font-medium hover:bg-primary hover:border-gray-700 hover:shadow-sm flex-shrink-0 cursor-pointer"
              >
                &lt;
              </button>
              
              <button
                onClick={nextStep}
                disabled={!isCurrentStepValid()}
                className={`flex-1 ml-4 px-6 py-3 bg-primary rounded-full border border-primary font-medium ${
                  !isCurrentStepValid()
                    ? 'border-primary-100 cursor-not-allowed bg-gray-50 text-base-100'
                    : 'text-secondary hover:bg-primary hover:border-gray-700 hover:shadow-sm cursor-pointer'
                }`}
              >
                {currentStep === totalSteps ? 'Add in loan costs' : 'Next'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

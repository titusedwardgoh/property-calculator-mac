import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../states/shared/baseCalculations.js';
import { useStateSelector } from '../states/useStateSelector.js';
import useFormNavigation from './shared/FormNavigation.js';
import { useFormStore } from '../stores/formStore';

export default function PropertyDetails() {
  const formData = useFormStore();
  const updateFormData = useFormStore(state => state.updateFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState('forward'); // 'forward' or 'backward'
  const [isComplete, setIsComplete] = useState(false);
  const totalSteps = 6; // Always 6 internal steps, but step 3 is skipped for non-WA
  const prevPropertyCategoryRef = useRef(formData.propertyCategory);
  const autocompleteRef = useRef(null);
  const autocompleteInputRef = useRef(null);
  
  // Calculate the display step number (what the user sees)
  const getDisplayStep = () => {
    if (formData.selectedState === 'WA') {
      return currentStep;
    } else {
      // For non-WA states, adjust step numbers to show sequentially
      if (currentStep >= 4) {
        return currentStep - 1; // Show 3, 4, 5 instead of 4, 5, 6
      }
      return currentStep;
    }
  };

  // Get the actual total steps for display (what user sees)
  const getDisplayTotalSteps = () => {
    return formData.selectedState === 'WA' ? 6 : 5;
  };
   
  // Get state-specific functions when state is selected
  const { stateFunctions } = useStateSelector(formData.selectedState || 'NSW');

  // Initialize Google Places Autocomplete
  const initializeAutocomplete = () => {
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places && autocompleteInputRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(autocompleteInputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'au' }, // Restrict to Australia
        fields: ['formatted_address', 'address_components', 'geometry'] // Request geometry data
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.formatted_address) {
          // Remove ", Australia" from the end of the address
          const cleanedAddress = place.formatted_address.replace(/, Australia$/, '');
          updateFormData('propertyAddress', cleanedAddress);
          
          // Parse address components for display
          const addressComponents = place.address_components;
          if (addressComponents) {
            // Extract street number and street name
            const streetNumber = addressComponents.find(c => c.types.includes('street_number'))?.long_name || '';
            const streetName = addressComponents.find(c => c.types.includes('route'))?.long_name || '';
            const suburb = addressComponents.find(c => c.types.includes('locality'))?.long_name || '';
            const state = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.short_name || '';
            const postcode = addressComponents.find(c => c.types.includes('postal_code'))?.long_name || '';
            
            // Store parsed components
            const streetAddress = [streetNumber, streetName].filter(Boolean).join(' ');
            const suburbPostcode = [suburb, state, postcode].filter(Boolean).join(' ');
            
            updateFormData('propertyStreetAddress', streetAddress);
            updateFormData('propertySuburbPostcode', suburbPostcode);
            
            // Auto-detect state
            const stateComponent = addressComponents.find(component => 
              component.types.includes('administrative_area_level_1')
            );
            if (stateComponent) {
              const stateCode = stateComponent.short_name;
              const stateMapping = {
                'NSW': 'NSW',
                'VIC': 'VIC', 
                'QLD': 'QLD',
                'SA': 'SA',
                'WA': 'WA',
                'TAS': 'TAS',
                'NT': 'NT',
                'ACT': 'ACT'
              };
              if (stateMapping[stateCode]) {
                updateFormData('selectedState', stateMapping[stateCode]);
                updateFormData('detectedState', stateMapping[stateCode]); // Store detected state
                if (stateCode === 'ACT') {
                  updateFormData('isACT', true);
                } else {
                  updateFormData('isACT', false);
                }
                
                // Auto-detect WA north/south if property is in WA
                if (stateCode === 'WA' && place.geometry && place.geometry.location) {
                  const latitude = place.geometry.location.lat();
                  const longitude = place.geometry.location.lng();
                  const isNorth = latitude > -26.0;
                  updateFormData('isWA', isNorth ? 'north' : 'south');
                  updateFormData('detectedWALocation', isNorth ? 'north' : 'south'); // Store detected location
                  
                  // Auto-detect metro/peel region (only for south of 26th parallel)
                  // Metro/Peel region is roughly: Perth metro area and Peel region (Mandurah area)
                  // Approximate boundaries: lat -33.5 to -31.5, long 115.5 to 116.5
                  if (!isNorth) {
                    const isMetro = latitude >= -33.5 && latitude <= -31.5 && longitude >= 115.5 && longitude <= 116.5;
                    updateFormData('isWAMetro', isMetro ? 'metro' : 'non-metro');
                    updateFormData('detectedWAMetro', isMetro ? 'metro' : 'non-metro'); // Store detected metro status
                  } else {
                    // North of 26th parallel is always non-metro
                    updateFormData('isWAMetro', 'non-metro');
                    updateFormData('detectedWAMetro', 'non-metro');
                  }
                }
              }
            }
          }
        }
      });
    }
  };

  // Initialize step from store when component mounts or when coming back from other forms
  useEffect(() => {
    if (formData.propertyDetailsCurrentStep && formData.propertyDetailsCurrentStep !== currentStep) {
      // Validate the step based on current state selection
      let validStep = formData.propertyDetailsCurrentStep;
      
      // If coming back to a step that doesn't exist for current state, adjust it
      if (formData.selectedState !== 'WA' && validStep === 3) {
        // Non-WA states skip step 3, so if we're trying to go to step 3, go to step 4 instead
        validStep = 4;
      }
      
      setCurrentStep(validStep);
      setIsComplete(false);
      
      // Update the store with the validated step
      if (validStep !== formData.propertyDetailsCurrentStep) {
        updateFormData('propertyDetailsCurrentStep', validStep);
      }
    }
  }, [formData.propertyDetailsCurrentStep, currentStep, isComplete, formData.propertyDetailsComplete, formData.selectedState, updateFormData]);

  // Watch for propertyDetailsCurrentStep flag from BuyerDetails
  useEffect(() => {
    if (formData.propertyDetailsCurrentStep && formData.propertyDetailsCurrentStep !== currentStep) {
      setCurrentStep(formData.propertyDetailsCurrentStep);
      // Update the active step for progress tracking
      updateFormData('propertyDetailsActiveStep', formData.propertyDetailsCurrentStep);
      // Reset the flag after using it
      updateFormData('propertyDetailsCurrentStep', null);
      setIsComplete(false);
      // Ensure we're not in completion state when going back to a specific question
      if (formData.propertyDetailsComplete) {
        updateFormData('propertyDetailsComplete', false);
      }
      // Also reset the form completion flag to ensure proper progress calculation
      if (formData.propertyDetailsFormComplete) {
        updateFormData('propertyDetailsFormComplete', false);
      }
    }
  }, [formData.propertyDetailsCurrentStep, updateFormData, currentStep, formData.propertyDetailsComplete, formData.propertyDetailsFormComplete]);



  // Watch for state changes and reset WA field if needed
  useEffect(() => {
    if (formData.selectedState !== 'WA' && formData.isWA) {
      updateFormData('isWA', '');
    }
    
    // If state changes, we may need to adjust the current step
    if (formData.propertyDetailsCurrentStep) {
      let adjustedStep = formData.propertyDetailsCurrentStep;
      
      if (formData.selectedState !== 'WA' && adjustedStep === 3) {
        // Non-WA states can't be on step 3, move to step 4
        adjustedStep = 4;
        updateFormData('propertyDetailsCurrentStep', adjustedStep);
        setCurrentStep(adjustedStep);
      } else if (formData.selectedState === 'WA' && adjustedStep === 4 && !formData.isWA) {
        // WA states on step 4 without WA selection, move to step 3
        adjustedStep = 3;
        updateFormData('propertyDetailsCurrentStep', adjustedStep);
        setCurrentStep(adjustedStep);
      }
    }
  }, [formData.selectedState, formData.isWA, formData.propertyDetailsCurrentStep, updateFormData]);

  // Watch for state changes and reset ACT field if needed
  useEffect(() => {
    if (formData.selectedState !== 'ACT' && formData.isACT) {
      updateFormData('isACT', false);
    }
  }, [formData.selectedState, formData.isACT, updateFormData]);

  // Load Google Maps script dynamically from API route
  useEffect(() => {
    const loadGoogleMapsScript = async () => {
      try {
        // Check if script already loaded
        if (window.google && window.google.maps && window.google.maps.places) {
          return;
        }

        // Fetch script URL from backend API
        const response = await fetch('/api/google-maps-config');
        const data = await response.json();
        
        if (data.scriptUrl) {
          // Create and load script
          const script = document.createElement('script');
          script.src = data.scriptUrl;
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        }
      } catch (error) {
        console.error('Failed to load Google Maps script:', error);
      }
    };

    loadGoogleMapsScript();
  }, []);

  // Initialize Google Places Autocomplete when component mounts and when on step 1
  useEffect(() => {
    if (currentStep === 1 && !formData.propertyStreetAddress) {
      // Wait for Google Maps API to load
      const checkGoogleMaps = () => {
        if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
          initializeAutocomplete();
        } else {
          setTimeout(checkGoogleMaps, 100);
        }
      };
      checkGoogleMaps();
    }
  }, [currentStep, formData.propertyStreetAddress]);

  // Watch for property category changes and reset property type if needed
  useEffect(() => {
    // Only reset property type if the category actually changed (not just navigation)
    if (prevPropertyCategoryRef.current && 
        prevPropertyCategoryRef.current !== formData.propertyCategory && 
        formData.propertyType) {
      updateFormData('propertyType', '');
    }
    // Update the ref to the current value
    prevPropertyCategoryRef.current = formData.propertyCategory;
  }, [formData.propertyCategory, formData.propertyType, updateFormData]);

  const nextStep = () => {
    
    // Log current form entries before proceeding
  
    console.log('📋 Current Form Entries:', {
      // Property Details
      propertyAddress: formData.propertyAddress,
      selectedState: formData.selectedState,
      isWA: formData.isWA,
      isWAMetro: formData.isWAMetro,
      propertyCategory: formData.propertyCategory,
      propertyType: formData.propertyType,
      propertyPrice: formData.propertyPrice,
      // Buyer Details
      buyerType: formData.buyerType,
      isPPR: formData.isPPR,
      isAustralianResident: formData.isAustralianResident,
      isFirstHomeBuyer: formData.isFirstHomeBuyer,
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
      sellerQuestion9: formData.sellerQuestion9
    });
    
    // Initialize the store with current step if this is the first call
    if (currentStep === 1) {
      updateFormData('propertyDetailsActiveStep', currentStep);
    }
    
    // Check if we're at the last step for the current state
    const isLastStep = currentStep === 6; // Both WA and non-WA end at internal step 6
    
    if (!isLastStep) {
      setDirection('forward');
      setIsTransitioning(true);
      setTimeout(() => {
        let nextStepNumber = currentStep + 1;
        
        // Skip WA question step if state is not WA
        if (currentStep === 2 && formData.selectedState !== 'WA') {
          nextStepNumber = 4; // Skip to property category step
        }
        
        setCurrentStep(nextStepNumber);
        // Update the store with current step for progress tracking
        updateFormData('propertyDetailsActiveStep', nextStepNumber);
        setIsTransitioning(false);
      }, 150);
    } else {
      // Form is complete - calculate stamp duty
      calculateAndLogStampDuty();
      setIsComplete(true);
      // Set a separate flag for UpfrontCosts (not the main navigation flag)
      updateFormData('propertyDetailsFormComplete', true);
      
      // Log final form completion
      
      console.log('📊 Final Form Summary:', {
        // Property Details
      propertyAddress: formData.propertyAddress,
      selectedState: formData.selectedState,
      isWA: formData.isWA,
      isWAMetro: formData.isWAMetro,
      propertyCategory: formData.propertyCategory,
      propertyType: formData.propertyType,
      propertyPrice: formData.propertyPrice,
      // Buyer Details
      buyerType: formData.buyerType,
      isPPR: formData.isPPR,
      isAustralianResident: formData.isAustralianResident,
      isFirstHomeBuyer: formData.isFirstHomeBuyer,
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
      sellerQuestion9: formData.sellerQuestion9
      });
    }
  };

  const goToBuyerDetails = () => {
    // Move to buyer details when user presses next
    updateFormData('propertyDetailsComplete', true);
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection('backward');
      setIsTransitioning(true);
      setTimeout(() => {
        let prevStepNumber = currentStep - 1;
        
        // Handle back navigation for non-WA states
        if (formData.selectedState !== 'WA') {
          if (currentStep === 6) {
            // From property price, go back to property type (step 5)
            prevStepNumber = 5;
          } else if (currentStep === 5) {
            // From property type, go back to property category (step 4)
            prevStepNumber = 4;
          } else if (currentStep === 4) {
            // From property category, go back to state selection (step 2)
            prevStepNumber = 2;
          }
        } else {
          // For WA states, normal back navigation
          if (currentStep === 4 && formData.selectedState === 'WA') {
            prevStepNumber = 3; // Go back to WA question
          }
        }
        
        setCurrentStep(prevStepNumber);
        // Update the store with current step for progress tracking
        updateFormData('propertyDetailsActiveStep', prevStepNumber);
        setIsTransitioning(false);
      }, 150);
    }
  };

  // Calculate stamp duty when form is complete
  const calculateAndLogStampDuty = () => {
    if (!stateFunctions) {
      return;
    }
    
    // Calculate stamp duty
    stateFunctions.calculateStampDuty(formData.propertyPrice, formData.selectedState);
  };

  // Check if current step is valid
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.propertyAddress && formData.propertyAddress.trim() !== '';
      case 2:
        return formData.selectedState && formData.selectedState.trim() !== '';
      case 3:
        return formData.selectedState === 'WA' ? (formData.isWA && formData.isWA.trim() !== '' && formData.isWAMetro && formData.isWAMetro.trim() !== '') : true;
      case 4:
        return formData.propertyCategory && formData.propertyCategory.trim() !== '';
      case 5:
        return formData.propertyType && formData.propertyType.trim() !== '';
      case 6:
        return formData.propertyPrice && formData.propertyPrice.trim() !== '';
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
    onComplete: goToBuyerDetails,
    onBack: null, // No back action for PropertyDetails
    isComplete
  });

  const renderStep = () => {
    // Show completion message if form is complete
    if (isComplete) {
      return (
        <div className="flex flex-col mt-12 md:mt-0 pr-2">
          <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
            Basic Property Details Complete
          </h2>
          <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
            Now a few questions about you... 
          </p>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="flex flex-col mt-12 md:mt-0 pr-2">
            <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
              What&apos;s the property address?
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              This helps us determine the state and provide accurate calculations
            </p>
            <div className="relative pr-8">
              {!formData.propertyStreetAddress ? (
                <input
                  ref={autocompleteInputRef}
                  type="text"
                  placeholder="Enter street address"
                  value={formData.propertyAddress || ''}
                  onChange={(e) => updateFormData('propertyAddress', e.target.value)}
                  className="w-full pl-4 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none transition-all duration-200 hover:border-gray-300"
                />
              ) : (
                <div className="w-full pl-4 pr-8 py-2 border-b-2 border-gray-200 rounded-none">
                  <div className="text-2xl text-gray-800 leading-tight">
                    {formData.propertyStreetAddress}
                  </div>
                  <div className="text-lg text-gray-600 mt-1">
                    {formData.propertySuburbPostcode}
                  </div>
                  <button
                    onClick={() => {
                      updateFormData('propertyAddress', '');
                      updateFormData('propertyStreetAddress', '');
                      updateFormData('propertySuburbPostcode', '');
                      updateFormData('detectedState', '');
                      updateFormData('detectedWALocation', '');
                      updateFormData('detectedWAMetro', '');
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 mt-2 underline"
                  >
                    Change address
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col mt-12 md:mt-0 pr-2">
            <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">  
              Which state is the property in?
            </h2>
            <p className={`lg:text-lg xl:text-xl lg:mb-20 leading-relaxed mb-8 ${
              formData.detectedState && formData.selectedState && formData.detectedState !== formData.selectedState
                ? ''
                : 'text-gray-500'
            }`} style={formData.detectedState && formData.selectedState && formData.detectedState !== formData.selectedState ? { color: '#f582ae' } : {}}>
              {formData.detectedState && formData.selectedState && formData.detectedState !== formData.selectedState
                ? `We think the property is in ${formData.detectedState} based on the address you entered`
                : 'Different states have different stamp duty rates and concessions'}
            </p>
            <div className=" relative pr-8">
              <div className="grid grid-cols-4 gap-3">
                {['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'].map((state) => (
                  <button
                    key={state}
                    onClick={() => {
                      updateFormData('selectedState', state);
                      // Set isACT flag when ACT is selected
                      if (state === 'ACT') {
                        updateFormData('isACT', true);
                      } else {
                        updateFormData('isACT', false);
                      }
                    }}
                    className={`px-3 py-2 text-base font-medium rounded-lg border-2 transition-all duration-200 text-center hover:scale-105 ${
                      formData.selectedState === state
                        ? 'border-gray-800 bg-secondary text-white shadow-lg'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        if (formData.selectedState === 'WA') {
          return (
            <div className="flex flex-col mt-12 md:mt-0 pr-2">
              <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
                Where is the Property
              </h2>
              <p className={`lg:text-lg xl:text-xl lg:mb-20 leading-relaxed mb-8 ${
                (formData.detectedWALocation && formData.isWA && formData.detectedWALocation !== formData.isWA) ||
                (formData.detectedWAMetro && formData.isWAMetro && formData.detectedWAMetro !== formData.isWAMetro)
                  ? ''
                  : 'text-gray-500'
              }`} style={(formData.detectedWALocation && formData.isWA && formData.detectedWALocation !== formData.isWA) ||
                (formData.detectedWAMetro && formData.isWAMetro && formData.detectedWAMetro !== formData.isWAMetro) ? { color: '#f582ae' } : {}}>
                {formData.detectedWALocation && formData.isWA && formData.detectedWALocation !== formData.isWA
                  ? `We think the property is ${formData.detectedWALocation} of the 26th parallel based on the address`
                  : formData.detectedWAMetro && formData.isWAMetro && formData.detectedWAMetro !== formData.isWAMetro
                  ? `We think the property is in the ${formData.detectedWAMetro === 'metro' ? 'Metro/Peel Region' : 'Non-Metro/Peel Region'} based on the address`
                  : 'Please select the region as this affects stamp duty calculations for WA'}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-8 lg:grid-cols-2">
                {[
                  { value: 'north', label: 'North' },
                  { value: 'south', label: 'South' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      updateFormData('isWA', option.value);
                      // Clear metro selection if switching to north
                      if (option.value === 'north' && formData.isWAMetro === 'metro') {
                        updateFormData('isWAMetro', '');
                      }
                    }}
                    className={`py-2 px-3 rounded-lg border-2 flex flex-col items-center lg:items-start transition-all duration-200 hover:scale-105 w-full ${
                      formData.isWA === option.value
                        ? 'border-gray-800 bg-secondary text-white shadow-lg'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-base font-medium mb-2 leading-none">{option.label}</div>
                    <div className={`text-xs leading-none text-center lg:text-left ${
                      formData.isWA === option.value
                        ? 'text-gray-400'
                        : 'text-gray-500'
                    }`}>of 26th parallel of South lat.</div>
                  </button>
                ))}
                
                {/* WA Metro/Non-Metro Selection */}
                {[
                  { value: 'metro', label: 'Metro/Peel Region' },
                  { value: 'non-metro', label: 'Non-Metro/Peel Region' }
                ].map((option) => {
                  const isDisabled = option.value === 'metro' && formData.isWA === 'north';
                  return (
                    <button
                      key={option.value}
                      onClick={() => !isDisabled && updateFormData('isWAMetro', option.value)}
                      disabled={isDisabled}
                      className={`py-2 px-3 rounded-lg border-2 flex flex-col items-center lg:items-start transition-all duration-200 w-full ${
                        isDisabled 
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : formData.isWAMetro === option.value
                            ? 'border-gray-800 bg-secondary text-white shadow-lg hover:scale-105'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:scale-105'
                      }`}
                      title={isDisabled ? "There are no metropolitan regions in the north" : ""}
                    >
                      <div className="text-base font-medium mb-2 leading-none">{option.label}</div>
                      <div className={`text-xs leading-none text-center lg:text-left ${
                        isDisabled
                          ? 'text-gray-300'
                          : formData.isWAMetro === option.value
                            ? 'text-gray-400'
                            : 'text-gray-500'
                      }`}>Check your local gov authority</div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }
        // If not WA, this step should not be reached, but handle gracefully
        return null;

        case 4:
          return (
            <div className="flex flex-col mt-12 md:mt-0 pr-2">
              <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
                What type of property is it?
              </h2>
              <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
                This affects your stamp duty concessions and ongoing costs
              </p>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                {[
                  { value: 'house', label: 'House' },
                  { value: 'apartment', label: 'Apartment' },
                  { value: 'townhouse', label: 'Townhouse' },
                  { value: 'land', label: 'Vacant Land' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateFormData('propertyCategory', option.value)}
                    className={`py-3 px-3 rounded-lg border-2 transition-all duration-200 flex justify-center w-32 hover:scale-105 ${
                      formData.propertyCategory === option.value
                        ? 'border-gray-800 bg-secondary text-white shadow-lg'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-base font-medium text-center">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>
          );

        case 5:
          return (
            <div className="flex flex-col mt-12 md:mt-0 pr-2">
              <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
                {formData.propertyCategory === 'land' 
                  ? 'Is this a house and land package?' 
                  : 'Is this property new or existing?'
                }
              </h2>
              <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
                {formData.propertyCategory === 'land' 
                  ? 'There are different concessions.' 
                  : 'New properties may have different concessions and costs'
                }
              </p>
              <div className={`grid gap-2 mb-8 ${
                formData.propertyCategory === 'land' ? 'grid-cols-1' : 'grid-cols-2'
              }`}>
                {(
                  formData.propertyCategory === 'land' 
                    ? [
                        { value: 'house-and-land', label: 'House and Land', description: 'As a package or intending to build' },
                        { value: 'vacant-land-only', label: 'Vacant Land Only', description: 'Not intending to build' }
                      ]
                    : [
                        { value: 'existing', label: 'Existing Property', description: 'Already built and lived in' },
                        { value: 'new', label: 'New Property', description: 'Recently built, never lived in' },
                        { value: 'off-the-plan', label: 'Off-the-Plan', description: 'Buying before construction' }
                      ]
                ).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateFormData('propertyType', option.value)}
                    className={`py-2 px-3 rounded-lg border-2 flex flex-col transition-all duration-200 hover:scale-105 max-w-[300px] ${
                      formData.propertyCategory === 'land' ? 'items-start' : 'items-center'
                    } ${
                      formData.propertyType === option.value
                        ? 'border-gray-800 bg-secondary text-white shadow-lg'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-base font-medium mb-2 leading-none">{option.label}</div>
                    <div className={`text-xs leading-none ${
                      formData.propertyType === option.value
                        ? 'text-gray-400'
                        : 'text-gray-500'
                    }`}>{option.description}</div>
                  </button>
                ))}
              </div>
            </div>
          );

        case 6:
          return (
            <div className="flex flex-col mt-12 md:mt-0 pr-2">
              <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
                What is the property&apos;s price?
              </h2>
              <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
                This will help us calculate your stamp duty and other costs
              </p>
              <div className="relative pr-8">
                <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none ${
                  formData.propertyPrice ? 'text-gray-800' : 'text-gray-400'
                }`}>
                  $
                </div>
                <input
                  type="tel"
                  placeholder="0"
                  value={formData.propertyPrice ? formatCurrency(parseInt(formData.propertyPrice)).replace('$', '') : ''}
                  onChange={(e) => {
                    // Remove all non-digit characters and update form data
                    const numericValue = e.target.value.replace(/[^\d]/g, '');
                    updateFormData('propertyPrice', numericValue);
                  }}
                  className="w-64 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:outline-none transition-all duration-200 hover:border-gray-300"
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
         <div className="flex items-center text-xs -mt-105 md:-mt-93 lg:-mt-93 lg:text-sm lg:pt-15 font-extrabold mr-2 pt-14 whitespace-nowrap relative overflow-hidden min-w-[3ch]">
           <span className="text-xs text-base-100">&nbsp;&nbsp;&nbsp;</span>
           <AnimatePresence mode="wait">
             <motion.span
               key={isComplete ? 'complete' : currentStep}
               initial={{ 
                 x: -30,
                 opacity: 0 
               }}
               animate={{ 
                 x: 0,
                 opacity: 1 
               }}
               exit={{ 
                 x: direction === 'forward' ? 30 : -30,
                 opacity: 0 
               }}
               transition={{ duration: 0.4 }}
               className={`flex items-center absolute ${isComplete ? 'text-base-100' : "text-primary"}`}
             >
               {isComplete ? getDisplayTotalSteps() : getDisplayStep()}
               <span className={`text-xs ${isComplete ? 'text-primary' : ""}`}>→</span>
             </motion.span>
           </AnimatePresence>
         </div>
        <div className="pb-6 pb-24 md:pb-8 flex">
          {/* Step Content */}
          <div className="h-100 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={isComplete ? 'complete' : currentStep}
                initial={{ 
                  y: isComplete ? 0 : (direction === 'forward' ? -50 : 50),
                  opacity: 0 
                }}
                animate={{ 
                  y: 0,
                  opacity: 1 
                }}
                exit={{ 
                  y: isComplete ? 0 : (direction === 'forward' ? 50 : -50),
                  opacity: 0 
                }}
                transition={{ 
                  duration: isComplete ? 0.5 : 0.3,
                  ease: "easeInOut"
                }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation - Fixed bottom on mobile, normal position on desktop */}
      <div className="md:pl-8 xl:text-lg fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto bg-base-100 md:bg-transparent pt-0 pr-4 pb-4 pl-4 md:p-0 md:mt-8 md:px-6 md:pb-8 lg:mt-15 xl:mt-30">
        {/* Progress Bar - Now rendered on main page for medium+ screens */}
        <div className="block md:hidden w-full bg-gray-100 h-1 mb-4 ">
          <div 
            className="bg-primary h-1 transition-all duration-300"
            style={{ width: `${isComplete ? 100 : ((getDisplayStep() - 1) / getDisplayTotalSteps()) * 100}%` }}
          ></div>
        </div>
        
        <div className="flex justify-start mx-auto mt-4">
          {isComplete ? (
            // Completion state: Back and Next buttons
            <>
              <button
                onClick={() => {
                  setIsComplete(false);
                  updateFormData('propertyDetailsFormComplete', false);
                }}
                className="bg-primary px-6 py-3 rounded-full border border-primary font-medium hover:bg-primary hover:border-gray-700 hover:shadow-sm flex-shrink-0 cursor-pointer"
              >
                &lt;
              </button>
              
              <button
                onClick={goToBuyerDetails}
                className="flex-1 ml-4 px-6 py-3 rounded-full border border-primary bg-primary hover:bg-primary hover:border-gray-700 hover:shadow-sm font-medium cursor-pointer"
              >
                Next
              </button>
            </>
          ) : currentStep === 1 ? (
            // Step 1: Full width OK button
            <button
              onClick={nextStep}
              disabled={!isCurrentStepValid()}
              className={`w-full px-6 py-3 rounded-full border border-primary font-medium ${
                !isCurrentStepValid()
                  ? 'border-primary-100 cursor-not-allowed bg-primary text-base-100'
                  : 'bg-primary hover:bg-primary hover:border-gray-700 hover:shadow-sm cursor-pointer'
              }`}
            >
              Next
            </button>
          ) : (
            // Step 2 onwards: Back and Next buttons with smooth transition
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
                                 {getDisplayStep() === getDisplayTotalSteps() ? 'Calculate stamp duty' : 'Next'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

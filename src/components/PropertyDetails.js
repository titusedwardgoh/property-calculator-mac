import { useState, useEffect, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../states/shared/baseCalculations.js';
import { useStateSelector } from '../states/useStateSelector.js';
import useFormNavigation from './shared/FormNavigation.js';
import { useFormStore } from '../stores/formStore';
import { getQuestionSlideAnimation, getQuestionNumberAnimation } from './shared/animations/questionAnimations';
import { getBackButtonAnimation, getNextButtonAnimation } from './shared/animations/buttonAnimations';
import { getInputButtonAnimation, getInputFieldAnimation } from './shared/animations/inputAnimations';
import { calculateGlobalProgress } from '../lib/progressCalculation';

export default function PropertyDetails() {
  const formData = useFormStore();
  const updateFormData = useFormStore(state => state.updateFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState('forward'); // 'forward' or 'backward'
  const [isComplete, setIsComplete] = useState(false);
  const isExecutingRef = useRef(false);
  const totalSteps = 6; // Always 6 internal steps, but step 3 is skipped for non-WA
  const prevPropertyCategoryRef = useRef(formData.propertyCategory);
  const autocompleteRef = useRef(null);
  const autocompleteInputRef = useRef(null);
  
  // Manual address entry state
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualAddress, setManualAddress] = useState({
    address: '',
    suburb: '',
    state: '',
    postcode: ''
  });
  const [showManualEntryButton, setShowManualEntryButton] = useState(false);
  const [hasValidAddress, setHasValidAddress] = useState(false);
  const [availableSuburbs, setAvailableSuburbs] = useState([]);
  const [isLoadingSuburbs, setIsLoadingSuburbs] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const scriptLoadingRef = useRef(false);
  const scriptLoadedRef = useRef(false);
  const placeChangedFiredRef = useRef(false); // Track if place_changed has fired
  
  // Clear propertyDetailsCurrentStep on mount to prevent interference with normal navigation
  useEffect(() => {
    if (formData.propertyDetailsCurrentStep) {
      updateFormData('propertyDetailsCurrentStep', null);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]); // Only run once on mount
  
  // Initialize local state from form data when resuming
  // This ensures hasValidAddress is set correctly when propertyAddress exists
  useEffect(() => {
    if (formData.isResumingSurvey && formData.propertyAddress && formData.propertyAddress.trim() !== '') {
      // When resuming, set hasValidAddress to true if address exists
      setHasValidAddress(true);
    }
    // Don't clear hasValidAddress here - let place_changed and onChange handlers manage it
    // This prevents the useEffect from interfering with Google Places validation
  }, [formData.isResumingSurvey]); // Only depend on isResumingSurvey, not propertyAddress

  // Initialize currentStep from propertyDetailsActiveStep when resuming
  useEffect(() => {
    if (formData.isResumingSurvey && formData.propertyDetailsActiveStep && formData.propertyDetailsActiveStep !== currentStep) {
      // Validate the step based on current state selection
      let validStep = formData.propertyDetailsActiveStep;
      
      // If the saved step doesn't exist for current state, adjust it
      if (formData.selectedState !== 'WA' && validStep === 3) {
        // Non-WA states skip step 3, so if we're trying to go to step 3, go to step 4 instead
        validStep = 4;
      }
      
      setCurrentStep(validStep);
      setIsComplete(false);
    }
  }, [formData.isResumingSurvey, formData.propertyDetailsActiveStep, formData.selectedState]);
  
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

  // Handle manual address entry
  const handleManualAddressChange = (field, value) => {
    // For postcode field, only allow numeric input
    if (field === 'postcode') {
      // Remove any non-numeric characters
      value = value.replace(/[^\d]/g, '');
    }
    
    setManualAddress(prev => ({
      ...prev,
      [field]: value
    }));

    // If postcode is being changed and it's 4 digits, fetch suburbs
    if (field === 'postcode' && /^\d{4}$/.test(value)) {
      fetchSuburbsForPostcode(value);
    } else if (field === 'postcode' && value.length !== 4) {
      // Clear suburbs if postcode is not 4 digits
      setAvailableSuburbs([]);
      setManualAddress(prev => ({ ...prev, suburb: '', state: '' }));
    }
  };

  // Get state from postcode based on Australian postcode ranges
  const getStateFromPostcode = (postcode) => {
    const code = parseInt(postcode);
    
    // NSW: 2000-2599, 2619-2899, 2921-2999
    if ((code >= 2000 && code <= 2599) || (code >= 2619 && code <= 2899) || (code >= 2921 && code <= 2999)) {
      return 'NSW';
    }
    // ACT: 2600-2618, 2900-2920
    if ((code >= 2600 && code <= 2618) || (code >= 2900 && code <= 2920)) {
      return 'ACT';
    }
    // VIC: 3000-3999
    if (code >= 3000 && code <= 3999) {
      return 'VIC';
    }
    // QLD: 4000-4999
    if (code >= 4000 && code <= 4999) {
      return 'QLD';
    }
    // SA: 5000-5799
    if (code >= 5000 && code <= 5799) {
      return 'SA';
    }
    // WA: 6000-6797
    if (code >= 6000 && code <= 6797) {
      return 'WA';
    }
    // TAS: 7000-7799
    if (code >= 7000 && code <= 7799) {
      return 'TAS';
    }
    // NT: 0800-0899, 0900-0999
    if ((code >= 800 && code <= 899) || (code >= 900 && code <= 999)) {
      return 'NT';
    }
    
    // Default to NSW if no match
    return 'NSW';
  };

  // Fetch suburbs for a given postcode
  const fetchSuburbsForPostcode = async (postcode) => {
    setIsLoadingSuburbs(true);
    try {
      const response = await fetch(`/api/validate-suburb?postcode=${postcode}`);
      const data = await response.json();
      
      if (response.ok && data.suburbs && data.suburbs.length > 0) {
        setAvailableSuburbs(data.suburbs);
        // Auto-select state if all suburbs are in the same state
        const states = [...new Set(data.suburbs.map(s => s.state))];
        if (states.length === 1) {
          setManualAddress(prev => ({ ...prev, state: states[0] }));
        }
      } else {
        // No suburbs found, auto-detect state from postcode
        setAvailableSuburbs([]);
        const detectedState = getStateFromPostcode(postcode);
        setManualAddress(prev => ({ ...prev, state: detectedState }));
      }
    } catch (error) {
      console.error('Error fetching suburbs:', error);
      setAvailableSuburbs([]);
      // Auto-detect state from postcode even on API error
      const detectedState = getStateFromPostcode(postcode);
      setManualAddress(prev => ({ ...prev, state: detectedState }));
    } finally {
      setIsLoadingSuburbs(false);
    }
  };

  // Validate manual address
  const validateManualAddress = () => {
    const { address, suburb, state, postcode } = manualAddress;
    return address.trim() !== '' && 
           suburb.trim() !== '' && 
           state.trim() !== '' && 
           postcode.trim() !== '' && 
           /^\d{4}$/.test(postcode.trim());
  };

  // Save manual address to form data
  const saveManualAddress = () => {
    if (validateManualAddress()) {
      const { address, suburb, state, postcode } = manualAddress;
      
      // Format the display to match Google API format
      const streetAddress = address.trim();
      const suburbPostcode = `${suburb}, ${state} ${postcode}`.trim();
      const fullAddress = `${streetAddress}, ${suburbPostcode}`;
      
      updateFormData('propertyAddress', fullAddress);
      updateFormData('propertyStreetAddress', streetAddress);
      updateFormData('propertySuburbPostcode', suburbPostcode);
      updateFormData('selectedState', state);
      
      setHasValidAddress(true);
    }
  };

  // Reset address validation when address is cleared
  const resetAddressValidation = () => {
    setHasValidAddress(false);
    setIsManualEntry(false);
    setManualAddress({
      address: '',
      suburb: '',
      state: '',
      postcode: ''
    });
    setAvailableSuburbs([]);
    setIsLoadingSuburbs(false);
  };

  // Initialize Google Places Autocomplete
  const initializeAutocomplete = () => {
    if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places && autocompleteInputRef.current) {
      // Clear existing autocomplete instance if it exists
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
      
      // Ensure the input is visible and properly rendered
      const input = autocompleteInputRef.current;
      if (!input.offsetParent) {
        // Input is not visible, retry after a short delay
        setTimeout(() => {
          if (autocompleteInputRef.current && autocompleteInputRef.current.offsetParent) {
            initializeAutocomplete();
          }
        }, 100);
        return;
      }
      
      autocompleteRef.current = new window.google.maps.places.Autocomplete(input, {
        types: ['address'],
        componentRestrictions: { country: 'au' }, // Restrict to Australia
        fields: ['formatted_address', 'address_components', 'geometry'] // Request geometry data
      });

      autocompleteRef.current.addListener('place_changed', () => {
        console.log('🔵 place_changed event fired');
        const place = autocompleteRef.current.getPlace();
        console.log('🔵 place object:', place);
        if (place.formatted_address) {
          console.log('🔵 place.formatted_address:', place.formatted_address);
          // Mark that place_changed has fired
          placeChangedFiredRef.current = true;
          console.log('🔵 Setting placeChangedFiredRef to true');
          
          // Use flushSync to ensure state update happens synchronously
          // This ensures hasValidAddress is set immediately before any other state updates
          flushSync(() => {
            console.log('🔵 Setting hasValidAddress to true via flushSync');
            setHasValidAddress(true);
          });
          console.log('🔵 hasValidAddress should now be true');
          
          // Remove ", Australia" from the end of the address
          const cleanedAddress = place.formatted_address.replace(/, Australia$/, '');
          updateFormData('propertyAddress', cleanedAddress);
          
          // Reset flag after a short delay
          setTimeout(() => {
            placeChangedFiredRef.current = false;
          }, 100);
          
          // Parse address components for display
          const addressComponents = place.address_components;
          if (addressComponents) {
            // Extract suburb, state, and postcode
            const suburb = addressComponents.find(c => c.types.includes('locality'))?.long_name || '';
            const state = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.short_name || '';
            const postcode = addressComponents.find(c => c.types.includes('postal_code'))?.long_name || '';
            
            // Create suburb/postcode string
            const suburbPostcode = [suburb, state, postcode].filter(Boolean).join(' ');
            
            // Extract street address by removing suburb/postcode from the full address
            // This preserves unit numbers and complex addresses
            let streetAddress = cleanedAddress;
            if (suburbPostcode) {
              // Remove the suburb/postcode part from the end
              const suburbPostcodeRegex = new RegExp(`,\\s*${suburbPostcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
              streetAddress = cleanedAddress.replace(suburbPostcodeRegex, '').trim();
            }
            
            updateFormData('propertyStreetAddress', streetAddress);
            updateFormData('propertySuburbPostcode', suburbPostcode);
            
            // hasValidAddress was already set to true at the start of this handler
            
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

  // This useEffect is ONLY for when navigating back from other components (BuyerDetails, etc.)
  // It should NOT interfere with normal forward/backward navigation within PropertyDetails
  // We check if propertyDetailsCurrentStep is explicitly set AND different from current step
  // AND make sure we're not in the middle of a transition (isTransitioning)
  useEffect(() => {
    if (formData.propertyDetailsCurrentStep && 
        formData.propertyDetailsCurrentStep !== currentStep && 
        !isTransitioning) {
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
  }, [formData.propertyDetailsCurrentStep, currentStep, isComplete, formData.propertyDetailsComplete, formData.selectedState, updateFormData, isTransitioning]);

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
        // Check if script already loaded or is currently loading
        if (scriptLoadedRef.current || scriptLoadingRef.current) {
          return;
        }

        // Check if Google Maps is already available globally
        if (window.__googleMapsLoaded || (window.google && window.google.maps && window.google.maps.places)) {
          scriptLoadedRef.current = true;
          return;
        }

        // Check if script tag already exists
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          scriptLoadedRef.current = true;
          return;
        }

        // Check global loading state to prevent multiple simultaneous loads
        if (window.__googleMapsLoading) {
          return;
        }

        window.__googleMapsLoading = true;
        scriptLoadingRef.current = true;

        // Fetch script URL from backend API
        const response = await fetch('/api/google-maps-config');
        const data = await response.json();
        
        if (data.scriptUrl) {
          // Create and load script
          const script = document.createElement('script');
          script.src = data.scriptUrl;
          script.async = true;
          script.defer = true;
          
          // Add load event listener
          script.onload = () => {
            scriptLoadedRef.current = true;
            scriptLoadingRef.current = false;
            window.__googleMapsLoading = false;
            window.__googleMapsLoaded = true;
            
            // Trigger autocomplete initialization if we're on step 1
            if (currentStep === 1 && !formData.propertyStreetAddress && autocompleteInputRef.current) {
              // Add a small delay for mobile devices
              setTimeout(() => {
                initializeAutocomplete();
              }, 200);
            }
          };
          
          script.onerror = () => {
            scriptLoadingRef.current = false;
            window.__googleMapsLoading = false;
            console.error('Failed to load Google Maps script');
          };
          
          document.head.appendChild(script);
        } else {
          scriptLoadingRef.current = false;
          window.__googleMapsLoading = false;
        }
      } catch (error) {
        console.error('Failed to load Google Maps script:', error);
        scriptLoadingRef.current = false;
        window.__googleMapsLoading = false;
      }
    };

    loadGoogleMapsScript();
  }, [currentStep, formData.propertyStreetAddress]);

  // Initialize Google Places Autocomplete when component mounts and when on step 1
  useEffect(() => {
    if (currentStep === 1 && !formData.propertyStreetAddress && !isManualEntry) {
      // Wait for Google Maps API to load AND for the input to be rendered
      const checkGoogleMaps = () => {
        if (typeof window !== 'undefined' && 
            (window.__googleMapsLoaded || (window.google && window.google.maps && window.google.maps.places)) && 
            autocompleteInputRef.current) {
          initializeAutocomplete();
        } else {
          // Increase timeout for mobile devices
          const timeout = window.innerWidth < 768 ? 200 : 100;
          setTimeout(checkGoogleMaps, timeout);
        }
      };
      
      // Add initial delay for mobile devices to ensure proper rendering
      const initialDelay = window.innerWidth < 768 ? 300 : 100;
      setTimeout(checkGoogleMaps, initialDelay);
    }
  }, [currentStep, formData.propertyStreetAddress, isManualEntry]);

  // Reinitialize autocomplete when switching back from manual entry
  useEffect(() => {
    if (currentStep === 1 && !isManualEntry && autocompleteInputRef.current) {
      // Longer delay for mobile devices to ensure proper rendering
      const delay = window.innerWidth < 768 ? 300 : 100;
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined' && 
            (window.__googleMapsLoaded || (window.google && window.google.maps && window.google.maps.places))) {
          initializeAutocomplete();
        }
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [isManualEntry, currentStep]);

  // Progress calculation - AFTER all Google Maps useEffects to prevent interference
  // Memoized with step-based dependencies only (NOT propertyAddress or other typed fields)
  const progressPercentage = useMemo(() => {
    return calculateGlobalProgress(formData, {})
  }, [
    // Use currentStep (local state)
    currentStep,
    formData.propertyDetailsComplete,
    formData.selectedState,
    formData.propertyType,
    // NOT: formData.propertyAddress, autocompleteRef, etc.
  ])

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

  // Update FIRB fee when relevant fields change
  useEffect(() => {
    formData.updateFIRBFee();
  }, [formData.propertyPrice, formData.propertyType, formData.isAustralianResident, formData.updateFIRBFee]);

  const nextStep = () => {
    // Prevent double-execution
    if (isExecutingRef.current) {
      return;
    }
    isExecutingRef.current = true;
    
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
      FIRBFee: formData.FIRBFee,
      sellerQuestion9: formData.sellerQuestion9
    });
    
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
        
        // Use flushSync to force immediate state update
        flushSync(() => {
          setCurrentStep(nextStepNumber);
          setIsTransitioning(false);
          isExecutingRef.current = false;
        });
        
        // Update the store with current step for progress tracking
        updateFormData('propertyDetailsActiveStep', nextStepNumber);
      }, 150);
    } else {
      // Form is complete - calculate stamp duty
      calculateAndLogStampDuty();
      setIsComplete(true);
      // Set a separate flag for UpfrontCosts (not the main navigation flag)
      updateFormData('propertyDetailsFormComplete', true);
      // Reset the executing ref
      isExecutingRef.current = false;
      
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
      FIRBFee: formData.FIRBFee,
      sellerQuestion9: formData.sellerQuestion9
      });
    }
  };

  const goToBuyerDetails = () => {
    // Move to buyer details when user presses next
    setDirection('forward');
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
        // For Google Places: require hasValidAddress to be true (set by place_changed event)
        // For manual entry: use validateManualAddress (already working)
        const isValid = hasValidAddress || (isManualEntry && validateManualAddress());
        console.log('🟡 isCurrentStepValid check - hasValidAddress:', hasValidAddress, ', isManualEntry:', isManualEntry, ', validateManualAddress():', isManualEntry ? validateManualAddress() : 'N/A', ', result:', isValid);
        return isValid;
      case 2:
        return formData.selectedState && formData.selectedState.trim() !== '';
      case 3:
        return formData.selectedState === 'WA' ? (formData.isWA && formData.isWA.trim() !== '' && formData.isWAMetro && formData.isWAMetro.trim() !== '') : true;
      case 4:
        return formData.propertyCategory && formData.propertyCategory.trim() !== '';
      case 5:
        return formData.propertyType && formData.propertyType.trim() !== '';
      case 6:
        return formData.propertyPrice && String(formData.propertyPrice).trim() !== '';
      default:
        return false;
    }
  };



  // Auto-advance on resume: only advance through steps that were already confirmed (user clicked Next)
  // Stop at the step where user left off, even if it has a pre-filled value
  useEffect(() => {
    if (formData.isResumingSurvey) {
      // If section is already complete, stop resuming immediately
      if (isComplete || formData.propertyDetailsComplete) {
        setTimeout(() => {
          formData.setIsResumingSurvey(false);
        }, 200);
        return;
      }
      
      const activeStep = formData.propertyDetailsActiveStep || 1;
      
      // Only auto-advance through steps that were already confirmed (before active step)
      if (currentStep < activeStep && isCurrentStepValid()) {
        // Auto-advance through confirmed steps
        const timer = setTimeout(() => {
          if (currentStep < totalSteps) {
            nextStep();
          } else {
            // Reached the end, mark as complete
            goToBuyerDetails();
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
  }, [formData.isResumingSurvey, formData.propertyDetailsActiveStep, formData.propertyDetailsComplete, currentStep, isComplete, isCurrentStepValid, nextStep, goToBuyerDetails, totalSteps, updateFormData]);

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
        <div className="flex flex-col mt-8 md:mt-0 pr-2">
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
          <div className="flex flex-col mt-8 md:mt-0 pr-2">
            <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
              What&apos;s the property address?
            </h2>
            <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
              This helps us determine the state and provide accurate calculations
            </p>
            <div className="relative pr-8">
              <AnimatePresence mode="wait">
                {!hasValidAddress ? (
                  <motion.div key="address-input">
                    {!isManualEntry ? (
                    <>
                      <motion.input
                        ref={autocompleteInputRef}
                        type="text"
                        placeholder="Enter street address"
                        value={formData.propertyAddress || ''}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          console.log('🟢 onChange fired - newValue:', newValue);
                          console.log('🟢 placeChangedFiredRef.current:', placeChangedFiredRef.current);
                          console.log('🟢 Current hasValidAddress:', hasValidAddress);
                          
                          // If place_changed just fired, don't reset - it's handling validation
                          if (placeChangedFiredRef.current) {
                            console.log('🟢 place_changed just fired, skipping onChange logic');
                            updateFormData('propertyAddress', newValue);
                            return;
                          }
                          
                          // Check if value looks formatted (has commas) - Google Places addresses have commas
                          const looksFormatted = newValue.includes(',') && newValue.trim().length > 10;
                          console.log('🟢 looksFormatted:', looksFormatted, '(has comma:', newValue.includes(','), ', length:', newValue.trim().length, ')');
                          
                          if (looksFormatted) {
                            // Value is formatted - set as valid immediately (Google Places selection)
                            console.log('🟢 Value looks formatted, setting hasValidAddress to true');
                            flushSync(() => {
                              setHasValidAddress(true);
                            });
                            console.log('🟢 hasValidAddress set to true');
                          } else if (newValue.length === 0) {
                            // Field cleared - reset validation
                            console.log('🟢 Field cleared, setting hasValidAddress to false');
                            setHasValidAddress(false);
                          } else if (!newValue.includes(',')) {
                            // No commas and not empty - likely trash input, reset validation
                            console.log('🟢 No commas detected, setting hasValidAddress to false (trash input)');
                            setHasValidAddress(false);
                          }
                          // If value has commas but place_changed hasn't fired yet, don't reset
                          // This handles the case where Google Places populates before place_changed fires
                          
                          updateFormData('propertyAddress', newValue);
                          
                          // Clear existing timeout
                          if (typingTimeout) {
                            clearTimeout(typingTimeout);
                          }
                          
                          // Hide manual entry button immediately when typing
                          setShowManualEntryButton(false);
                          
                          // Show manual entry button after user stops typing for 1 second
                          const newTimeout = setTimeout(() => {
                            setShowManualEntryButton(true);
                          }, 1000);
                          
                          setTypingTimeout(newTimeout);
                        }}
                        onFocus={(e) => {
                          // Only scroll on mobile devices
                          if (window.innerWidth < 768) { // md breakpoint
                            setTimeout(() => {
                              e.target.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'center' 
                              });
                            }, 300);
                          }
                          
                          // Ensure autocomplete is initialized on mobile focus
                          if (window.innerWidth < 768 && !autocompleteRef.current && 
                              typeof window !== 'undefined' && 
                              (window.__googleMapsLoaded || (window.google && window.google.maps && window.google.maps.places))) {
                            setTimeout(() => {
                              initializeAutocomplete();
                            }, 100);
                          }
                        }}
                        {...getInputFieldAnimation()}
                        className="w-full ml-1 pl-4 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
                      />
                      {formData.propertyAddress && !hasValidAddress && showManualEntryButton && (
                        <motion.button
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          onClick={() => setIsManualEntry(true)}
                          className="mt-4 text-sm text-primary hover:underline cursor-pointer"
                        >
                          Can&apos;t find address?
                        </motion.button>
                      )}
                    </>
                  ) : (
                    <motion.div 
                      className="space-y-2 md:space-y-4"
                      {...getQuestionSlideAnimation('forward', false, 0.3, 0.2)}
                    >
                      <motion.input
                        type="text"
                        placeholder="Address (123 Main Street)"
                        value={manualAddress.address}
                        onChange={(e) => handleManualAddressChange('address', e.target.value)}
                        {...getInputFieldAnimation()}
                        className="w-full pl-4 pr-4 py-2 text-xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
                      />
                      <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                        <motion.input
                          type="text"
                          placeholder="Postcode"
                          value={manualAddress.postcode}
                          onChange={(e) => handleManualAddressChange('postcode', e.target.value)}
                          maxLength="4"
                          {...getInputFieldAnimation()}
                          className="w-full md:w-36 pl-4 pr-4 py-2 text-xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
                        />
                        <div className="flex-1">
                          {availableSuburbs.length > 0 ? (
                            <select
                              value={manualAddress.suburb}
                              onChange={(e) => handleManualAddressChange('suburb', e.target.value)}
                              className="w-full pl-4 pr-4 py-2 text-xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300 bg-white"
                            >
                              <option value="">Select Suburb</option>
                              {availableSuburbs.map((suburb, index) => (
                                <option key={index} value={suburb.name}>
                                  {suburb.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <motion.input
                              type="text"
                              placeholder={isLoadingSuburbs ? "Loading suburbs..." : "Suburb"}
                              value={manualAddress.suburb}
                              onChange={(e) => handleManualAddressChange('suburb', e.target.value)}
                              disabled={isLoadingSuburbs}
                              {...getInputFieldAnimation()}
                              className="w-full pl-4 pr-4 py-2 text-xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <motion.button
                          onClick={saveManualAddress}
                          disabled={!validateManualAddress()}
                          {...getNextButtonAnimation(validateManualAddress())}
                          className={`px-6 py-3 rounded-full border border-primary font-medium flex-1 ${
                            validateManualAddress() 
                              ? 'bg-primary hover:bg-primary hover:border-gray-700 hover:shadow-sm cursor-pointer' 
                              : 'border-primary-100 cursor-not-allowed bg-primary text-base-100'
                          }`}
                        >
                          Save
                        </motion.button>
                        <motion.button
                          onClick={() => setIsManualEntry(false)}
                          {...getBackButtonAnimation()}
                          className="px-6 py-3 rounded-full border font-medium flex-1 bg-secondary text-base-100 border-gray-200 hover:shadow-sm cursor-pointer"
                        >
                          Back
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="confirmed-address"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="w-full pl-4 pr-8 py-2 border-b-2 border-gray-200 rounded-none"
                  >
                  <div className="text-2xl text-gray-800 leading-tight ">
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
                      resetAddressValidation();
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 mt-2 underline"
                  >
                    Change address
                  </button>
                </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col mt-8 md:mt-0 pr-2">
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
              <div className="grid grid-cols-4 gap-3 ml-1 md:ml-2">
                {['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'].map((state) => (
                  <motion.button
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
                    {...getInputButtonAnimation()}
                    className={`px-3 py-2 text-base font-medium rounded-lg border-2 text-center ${
                      formData.selectedState === state
                        ? 'border-gray-800 bg-secondary text-white shadow-lg'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {state}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        if (formData.selectedState === 'WA') {
          return (
            <div className="flex flex-col mt-8 md:mt-0 pr-2">
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
              <div className="grid grid-cols-2 gap-2 mb-8 lg:grid-cols-2 ml-1 md:ml-2">
                {[
                  { value: 'north', label: 'North' },
                  { value: 'south', label: 'South' }
                ].map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => {
                      updateFormData('isWA', option.value);
                      // Clear metro selection if switching to north
                      if (option.value === 'north' && formData.isWAMetro === 'metro') {
                        updateFormData('isWAMetro', '');
                      }
                    }}
                    {...getInputButtonAnimation()}
                    className={`py-2 px-3 rounded-lg border-2 flex flex-col items-center lg:items-start w-full ${
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
                  </motion.button>
                ))}
                
                {/* WA Metro/Non-Metro Selection */}
                {[
                  { value: 'metro', label: 'Metro/Peel Region' },
                  { value: 'non-metro', label: 'Non-Metro/Peel Region' }
                ].map((option) => {
                  const isDisabled = option.value === 'metro' && formData.isWA === 'north';
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => !isDisabled && updateFormData('isWAMetro', option.value)}
                      disabled={isDisabled}
                      {...(!isDisabled ? getInputButtonAnimation() : {})}
                      className={`py-2 px-3 rounded-lg border-2 flex flex-col items-center lg:items-start w-full ${
                        isDisabled 
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : formData.isWAMetro === option.value
                            ? 'border-gray-800 bg-secondary text-white shadow-lg'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
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
                    </motion.button>
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
            <div className="flex flex-col mt-8 md:mt-0 pr-2">
              <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
                What type of property is it?
              </h2>
              <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
                This affects your stamp duty concessions and ongoing costs
              </p>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 ml-1 md:ml-2">
                {[
                  { value: 'house', label: 'House' },
                  { value: 'apartment', label: 'Apartment' },
                  { value: 'townhouse', label: 'Townhouse' },
                  { value: 'land', label: 'Vacant Land' }
                ].map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => updateFormData('propertyCategory', option.value)}
                    {...getInputButtonAnimation()}
                    className={`py-3 px-3 rounded-lg border-2 flex justify-center w-32 ${
                      formData.propertyCategory === option.value
                        ? 'border-gray-800 bg-secondary text-white shadow-lg'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-base font-medium text-center">{option.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>
          );

        case 5:
          return (
            <div className="flex flex-col mt-8 md:mt-0 pr-2">
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
              <div className={`grid gap-2 mb-8 ml-1 md:ml-2 ${
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
                  <motion.button
                    key={option.value}
                    onClick={() => updateFormData('propertyType', option.value)}
                    {...getInputButtonAnimation()}
                    className={`py-2 px-3 rounded-lg border-2 flex flex-col max-w-[300px] ${
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
                  </motion.button>
                ))}
              </div>
            </div>
          );

        case 6:
          return (
            <div className="flex flex-col mt-8 md:mt-0 pr-2">
              <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
                What is the property&apos;s price?
              </h2>
              <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
                This will help us calculate your stamp duty and other costs
              </p>
              <div className="relative pr-8 ml-1">
                <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none ${
                  formData.propertyPrice ? 'text-gray-800' : 'text-gray-400'
                }`}>
                  $
                </div>
                <motion.input
                  type="tel"
                  placeholder="0"
                  value={formData.propertyPrice ? formatCurrency(parseInt(formData.propertyPrice)).replace('$', '') : ''}
                  onChange={(e) => {
                    // Remove all non-digit characters and update form data
                    const numericValue = e.target.value.replace(/[^\d]/g, '');
                    updateFormData('propertyPrice', numericValue);
                  }}
                  {...getInputFieldAnimation()}
                  className="w-50 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
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
         <div className="ml-2 md:ml-3 lg:ml-2 flex items-center text-xs -mt-113 md:-mt-113 lg:text-sm lg:pt-15 font-extrabold mr-2 pt-14 whitespace-nowrap relative overflow-hidden min-w-[3ch]">
           <span className="text-xs text-base-100">&nbsp;&nbsp;&nbsp;</span>
           <AnimatePresence mode="wait">
             <motion.span
               key={isComplete ? 'complete' : currentStep}
               {...getQuestionNumberAnimation(direction, 0.4)}
               className={`flex items-center absolute ${isComplete ? 'text-base-100' : "text-primary"}`}
             >
               {isComplete ? getDisplayTotalSteps() : getDisplayStep()}
               <span className={`text-xs ${isComplete ? 'text-primary' : ""}`}>→</span>
             </motion.span>
           </AnimatePresence>
         </div>
        <div className="pb-6 pb-24 md:pb-8 flex">
          {/* Step Content */}
          <div className="h-100 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={isComplete ? 'complete' : currentStep}
                {...getQuestionSlideAnimation(direction, isComplete, 0.5, 0.3)}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation - Fixed bottom on mobile, normal position on desktop */}
      <div className="md:pl-8 xl:text-lg fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto bg-base-100 md:bg-transparent pt-0 pr-4 pb-4 pl-4 md:p-0 md:-mt-16 md:px-6 md:pb-8 lg:-mt-9 xl:-mt-10">
        {/* Progress Bar - Now rendered on main page for medium+ screens */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="block md:hidden w-full bg-gray-100 h-1 mb-4"
        >
          <motion.div 
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-primary h-1 transition-all duration-300 origin-top"
            style={{ width: `${progressPercentage}%` }}
          ></motion.div>
        </motion.div>
        
        <div className="flex justify-start mx-auto mt-4">
          {isComplete ? (
            // Completion state: Back and Next buttons
            <>
              <motion.button
                onClick={() => {
                  setDirection('backward');
                  setIsComplete(false);
                  updateFormData('propertyDetailsFormComplete', false);
                  // Go back to the last question (step 6)
                  setCurrentStep(6);
                }}
                {...getBackButtonAnimation()}
                className="bg-primary px-6 py-3 rounded-full border border-primary font-medium hover:bg-primary hover:border-gray-700 hover:shadow-sm flex-shrink-0 cursor-pointer"
              >
                &lt;
              </motion.button>
              
              <motion.button
                onClick={goToBuyerDetails}
                {...getNextButtonAnimation()}
                className="flex-1 ml-4 px-6 py-3 rounded-full border border-primary bg-primary hover:bg-primary hover:border-gray-700 hover:shadow-sm font-medium cursor-pointer"
              >
                Next
              </motion.button>
            </>
          ) : currentStep === 1 ? (
            // Step 1: Full width OK button
            <motion.button
              onClick={nextStep}
              disabled={!isCurrentStepValid()}
              {...getNextButtonAnimation(isCurrentStepValid())}
              className={`w-full px-6 py-3 rounded-full border border-primary font-medium ${
                !isCurrentStepValid()
                  ? 'border-primary-100 cursor-not-allowed bg-primary text-base-100'
                  : 'bg-primary hover:bg-primary hover:border-gray-700 hover:shadow-sm cursor-pointer'
              }`}
            >
              Next
            </motion.button>
          ) : (
            // Step 2 onwards: Back and Next buttons with smooth transition
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
                                 {getDisplayStep() === getDisplayTotalSteps() ? 'Calculate stamp duty' : 'Next'}
              </motion.button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Dynamic Progress Calculation
 * 
 * Calculates completion percentage based on required fields for the user's specific path,
 * excluding fields that are skipped due to branching logic.
 */

/**
 * Check if a field value is considered "answered"
 * @param {*} value - The field value to check
 * @returns {boolean} True if the field has a valid answer
 */
export function isFieldAnswered(value) {
  // 0 is a valid answer (especially for fees)
  if (value === 0) return true
  
  // Check for null/undefined
  if (value === null || value === undefined) return false
  
  // Check for empty string
  if (typeof value === 'string' && value.trim() === '') return false
  
  // All other truthy values are valid
  return true
}

/**
 * Get the list of required field keys based on the current form state and branching decisions
 * This EXACTLY matches the conditional branching in each component's renderStep function
 * @param {Object} formData - The current form state from Zustand store
 * @returns {Array<string>} Array of field keys that must be filled for completion
 */
export function getRequiredFields(formData) {
  const requiredFields = []
  
  // Property Section - matches PropertyDetails renderStep
  requiredFields.push('propertyAddress', 'selectedState', 'propertyCategory', 'propertyType', 'propertyPrice')
  
  // WA-specific (matches PropertyDetails case 3)
  if (formData.selectedState === 'WA') {
    requiredFields.push('isWA', 'isWAMetro')
  }
  
  // Buyer Section - matches BuyerDetails renderStep
  requiredFields.push('buyerType', 'isPPR', 'isAustralianResident', 'isFirstHomeBuyer', 'savingsAmount', 'needsLoan')
  
  // ACT-specific (matches BuyerDetails cases 5, 6, 7, 8, 9, 10)
  // CRITICAL: For ACT, both ownedPropertyLast5Years (case 5) AND hasPensionCard (case 6) are required
  if (formData.selectedState === 'ACT') {
    requiredFields.push('ownedPropertyLast5Years', 'hasPensionCard', 'income', 'dependants')
  }
  
  // Non-ACT (matches BuyerDetails case 5)
  // Note: hasPensionCard is case 5 for non-ACT, but case 6 for ACT
  if (formData.selectedState !== 'ACT') {
    requiredFields.push('hasPensionCard')
  }
  
  // Loan Section - assume longest path by default (include loan fields unless explicitly opted out)
  // Only exclude loan fields if:
  // 1. needsLoan is explicitly and strictly equal to 'no' AND
  // 2. The user has confirmed this decision (passed the loan question step)
  // This prevents auto-suggested "no loan" from excluding fields before user confirms
  const isACT = formData.selectedState === 'ACT'
  const loanQuestionStep = isACT ? 10 : 7
  const hasConfirmedLoanDecision = formData.buyerDetailsComplete || 
                                   (formData.buyerDetailsActiveStep > loanQuestionStep)
  
  // Only exclude loan fields if user has confirmed they don't need a loan
  if (formData.needsLoan !== 'no' || !hasConfirmedLoanDecision) {
    requiredFields.push('loanDeposit', 'loanType', 'loanTerm', 'loanRate', 'loanLMI', 'loanSettlementFees', 'loanEstablishmentFee')
  }
  
  // Seller Section - matches SellerQuestions renderStep
  requiredFields.push('councilRates', 'waterRates', 'bodyCorp', 'landTransferFee', 'legalFees', 'buildingAndPestInspection')
  
  // Construction questions (matches SellerQuestions case 3)
  const shouldShowConstructionQuestions = formData.propertyType === 'off-the-plan' || formData.propertyType === 'house-and-land'
  if (shouldShowConstructionQuestions) {
    requiredFields.push('constructionStarted')
  }
  
  // Dutiable value (matches SellerQuestions case 4 EXACTLY)
  // Required for: house-and-land OR (off-the-plan AND VIC)
  // NOT required for: off-the-plan AND non-VIC (auto-set, question skipped)
  const isHouseAndLand = formData.propertyType === 'house-and-land'
  const isOffThePlanVIC = formData.propertyType === 'off-the-plan' && formData.selectedState === 'VIC'
  
  if (isHouseAndLand || isOffThePlanVIC) {
    requiredFields.push('dutiableValue')
  }
  
  return requiredFields
}

/**
 * Get the step number for a buyer detail field
 * @param {string} fieldKey - The field key
 * @param {Object} formData - The form data
 * @returns {number|null} The step number, or null if not a buyer detail field
 */
function getBuyerFieldStep(fieldKey, formData) {
  const isACT = formData.selectedState === 'ACT'
  
  const stepMap = {
    'buyerType': 1,
    'isPPR': 2,
    'isAustralianResident': 3,
    'isFirstHomeBuyer': 4,
  }
  
  if (isACT) {
    stepMap['ownedPropertyLast5Years'] = 5
    stepMap['hasPensionCard'] = 6
    stepMap['income'] = 7
    stepMap['dependants'] = 8
    stepMap['savingsAmount'] = 9
    stepMap['needsLoan'] = 10
  } else {
    stepMap['hasPensionCard'] = 5
    stepMap['savingsAmount'] = 6
    stepMap['needsLoan'] = 7
  }
  
  return stepMap[fieldKey] || null
}

/**
 * Check if a buyer detail field has been passed by the user
 * @param {string} fieldKey - The field key
 * @param {Object} formData - The form data
 * @returns {boolean} True if the user has passed this question
 */
function isBuyerFieldPastStep(fieldKey, formData) {
  // If buyer details are complete, all fields are considered passed
  if (formData.buyerDetailsComplete) {
    return true
  }
  
  const fieldStep = getBuyerFieldStep(fieldKey, formData)
  if (fieldStep === null) {
    return true // Not a buyer detail field, count normally
  }
  
  // Check if user has moved past this step
  const activeStep = formData.buyerDetailsActiveStep || 1
  return activeStep > fieldStep
}

/**
 * Get the step number (internal case) for a seller question field
 * @param {string} fieldKey - The field key
 * @param {Object} formData - The form data
 * @returns {number|null} The step number, or null if not a seller question field or not shown
 */
function getSellerFieldStep(fieldKey, formData) {
  const shouldShowConstructionQuestions = formData.propertyType === 'off-the-plan' || formData.propertyType === 'house-and-land'
  const isHouseAndLand = formData.propertyType === 'house-and-land'
  const isOffThePlanVIC = formData.propertyType === 'off-the-plan' && formData.selectedState === 'VIC'
  
  const stepMap = {
    'councilRates': 1,
    'waterRates': 2,
    'bodyCorp': 5,
    'landTransferFee': 6,
    'legalFees': 7,
    'buildingAndPestInspection': 8,
  }
  
  // Construction questions are only shown for off-the-plan or house-and-land
  if (shouldShowConstructionQuestions) {
    stepMap['constructionStarted'] = 3
    
    // Dutiable value is shown for house-and-land OR (off-the-plan AND VIC)
    if (isHouseAndLand || isOffThePlanVIC) {
      stepMap['dutiableValue'] = 4
    }
  }
  
  return stepMap[fieldKey] || null
}

/**
 * Check if a seller question field has been passed by the user
 * @param {string} fieldKey - The field key
 * @param {Object} formData - The form data
 * @returns {boolean} True if the user has passed this question
 */
function isSellerFieldPastStep(fieldKey, formData) {
  // If seller questions are complete, all fields are considered passed
  if (formData.sellerQuestionsComplete) {
    return true
  }
  
  const fieldStep = getSellerFieldStep(fieldKey, formData)
  if (fieldStep === null) {
    return true // Not a seller question field, count normally
  }
  
  // Check if user has moved past this step
  const activeStep = formData.sellerQuestionsActiveStep || 1
  return activeStep > fieldStep
}

/**
 * Get the step number for a property detail field
 * @param {string} fieldKey - The field key
 * @param {Object} formData - The form data
 * @returns {number|null} The step number, or null if not a property detail field
 */
function getPropertyFieldStep(fieldKey, formData) {
  const stepMap = {
    'propertyAddress': 1,
    'selectedState': 2,
    'propertyCategory': 4,
    'propertyType': 5,
    'propertyPrice': 6,
  }
  
  // WA-specific fields are on step 3
  if (formData.selectedState === 'WA') {
    stepMap['isWA'] = 3
    stepMap['isWAMetro'] = 3
  }
  
  return stepMap[fieldKey] || null
}

/**
 * Check if a property detail field has been passed by the user
 * @param {string} fieldKey - The field key
 * @param {Object} formData - The form data
 * @returns {boolean} True if the user has passed this question
 */
function isPropertyFieldPastStep(fieldKey, formData) {
  // If property details are complete, all fields are considered passed
  if (formData.propertyDetailsComplete) {
    return true
  }
  
  const fieldStep = getPropertyFieldStep(fieldKey, formData)
  if (fieldStep === null) {
    return true // Not a property detail field, count normally
  }
  
  // Check if user has moved past this step
  const activeStep = formData.propertyDetailsActiveStep || 1
  return activeStep > fieldStep
}

/**
 * Calculate global progress percentage based on required fields
 * @param {Object} formData - The current form state from Zustand store
 * @param {Object} options - Optional configuration
 * @param {Function} options.getSuggestedLoanDecision - Function to get suggested loan decision for edge case handling
 * @returns {number} Completion percentage (0-100)
 */
export function calculateGlobalProgress(formData, options = {}) {
  // Get the list of required fields for the current path
  const requiredFields = getRequiredFields(formData)
  
  // Count how many required fields have been filled
  let answeredCount = 0
  
  requiredFields.forEach(fieldKey => {
    // Special handling for needsLoan field (loan suggestion edge case)
    if (fieldKey === 'needsLoan') {
      const value = formData[fieldKey]
      const suggestedValue = options?.getSuggestedLoanDecision?.()
      
      if (isFieldAnswered(value)) {
        // Count as answered if:
        // 1. User explicitly changed it from suggestion, OR
        // 2. User is past the loan question step (implicit confirmation)
        const userChangedIt = suggestedValue && value !== suggestedValue
        const isACT = formData.selectedState === 'ACT'
        const isPastLoanQuestion = formData.buyerDetailsComplete || 
                                   (formData.buyerDetailsActiveStep > 7 && !isACT) ||
                                   (formData.buyerDetailsActiveStep > 10 && isACT)
        
        if (userChangedIt || isPastLoanQuestion) {
          answeredCount++
        }
      }
    } else {
      // Check if this is a property detail, buyer detail, or seller question field that needs step validation
      const isPropertyField = getPropertyFieldStep(fieldKey, formData) !== null
      const isBuyerField = getBuyerFieldStep(fieldKey, formData) !== null
      const isSellerField = getSellerFieldStep(fieldKey, formData) !== null
      const value = formData[fieldKey]
      
      if (isFieldAnswered(value)) {
        // For property detail fields, only count if user has passed that step
        if (isPropertyField) {
          if (isPropertyFieldPastStep(fieldKey, formData)) {
            answeredCount++
          }
        } else if (isBuyerField) {
          // For buyer detail fields, only count if user has passed that step
          if (isBuyerFieldPastStep(fieldKey, formData)) {
            answeredCount++
          }
        } else if (isSellerField) {
          // For seller question fields, only count if user has passed that step
          if (isSellerFieldPastStep(fieldKey, formData)) {
            answeredCount++
          }
        } else {
          // Normal field check (not a property detail, buyer detail, or seller question field)
          answeredCount++
        }
      }
    }
  })
  
  // Calculate percentage
  const totalRequired = requiredFields.length
  
  if (totalRequired === 0) {
    return 0
  }
  
  return Math.round((answeredCount / totalRequired) * 100)
}


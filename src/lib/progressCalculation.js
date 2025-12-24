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
  // Only exclude loan fields if needsLoan is explicitly and strictly equal to 'no'
  // This ensures progress never decreases - when user selects "no", denominator shrinks and progress leaps forward
  if (formData.needsLoan !== 'no') {
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
      // Normal field check
      const value = formData[fieldKey]
      if (isFieldAnswered(value)) {
        answeredCount++
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


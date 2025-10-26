import { useEffect, useRef, useCallback, useState } from 'react'
import { getSessionId, getDeviceId } from '../lib/sessionManager'
import { useStateSelector } from '../states/useStateSelector'

/**
 * Hook to sync form data with Supabase
 * @param {Object} formData - The current form state from Zustand
 * @param {Function} updateFormData - Function to update form data
 * @param {string} propertyId - Current property record ID (if exists)
 * @param {Function} setPropertyId - Function to set property record ID
 */
export function useSupabaseSync(formData, updateFormData, propertyId, setPropertyId) {
  const saveTimeoutRef = useRef(null)
  const isInitialMountRef = useRef(true)
  
  // Generate session ID once on mount (new session for each page load)
  const [sessionId] = useState(() => getSessionId())
  const [deviceId] = useState(() => getDeviceId())
  
  // Get state-specific functions once at component level
  const { stateFunctions } = useStateSelector(formData.selectedState || 'NSW')

  // Calculate completion percentage based on filled fields
  const calculateCompletionPercentage = useCallback((data) => {
    const sections = [
      'property_details',
      'buyer_details', 
      'loan_details',
      'seller_questions'
    ]
    
    let totalFields = 0
    let filledFields = 0
    
    sections.forEach(section => {
      const sectionData = data[section] || {}
      const sectionFields = Object.keys(sectionData)
      totalFields += sectionFields.length
      
      sectionFields.forEach(field => {
        const value = sectionData[field]
        if (value !== null && value !== undefined && value !== '') {
          filledFields++
        }
      })
    })
    
    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0
  }, [])

  // Determine current section based on form state
  const getCurrentSection = useCallback((data) => {
    if (data.showSummary) return 'summary'
    if (data.showSellerQuestions) return 'seller_questions'
    if (data.showLoanDetails) return 'loan_details'
    if (data.buyerDetailsComplete) return 'buyer_details'
    if (data.propertyDetailsComplete) return 'property_details'
    return 'property_details'
  }, [])

  // Organize form data into sections
  const organizeFormDataIntoSections = useCallback((data) => {
    return {
      property_details: {
        propertyAddress: data.propertyAddress || null,
        propertyStreetAddress: data.propertyStreetAddress || null,
        propertySuburbPostcode: data.propertySuburbPostcode || null,
        detectedState: data.detectedState || null,
        detectedWALocation: data.detectedWALocation || null,
        detectedWAMetro: data.detectedWAMetro || null,
        selectedState: data.selectedState || null,
        propertyType: data.propertyType || null,
        propertyCategory: data.propertyCategory || null,
        isWA: data.isWA || null,
        isWAMetro: data.isWAMetro || null,
        isACT: data.isACT || null,
        propertyDetailsComplete: data.propertyDetailsComplete || false,
        propertyDetailsFormComplete: data.propertyDetailsFormComplete || false,
        propertyDetailsCurrentStep: data.propertyDetailsCurrentStep || null,
        propertyDetailsActiveStep: data.propertyDetailsActiveStep || null
      },
      buyer_details: {
        buyerType: data.buyerType || null,
        isPPR: data.isPPR || null,
        isAustralianResident: data.isAustralianResident || null,
        isFirstHomeBuyer: data.isFirstHomeBuyer || null,
        ownedPropertyLast5Years: data.ownedPropertyLast5Years || null,
        hasPensionCard: data.hasPensionCard || null,
        needsLoan: data.needsLoan || null,
        savingsAmount: data.savingsAmount || null,
        income: data.income || null,
        dependants: data.dependants || null,
        buyerDetailsComplete: data.buyerDetailsComplete || false,
        buyerDetailsCurrentStep: data.buyerDetailsCurrentStep || null,
        buyerDetailsActiveStep: data.buyerDetailsActiveStep || null
      },
      loan_details: {
        loanDeposit: data.loanDeposit || null,
        loanType: data.loanType || null,
        loanTerm: data.loanTerm || null,
        loanInterestOnlyPeriod: data.loanInterestOnlyPeriod || null,
        loanRate: data.loanRate || null,
        loanLMI: data.loanLMI || null,
        loanSettlementFees: data.loanSettlementFees || null,
        loanEstablishmentFee: data.loanEstablishmentFee || null,
        loanDetailsComplete: data.loanDetailsComplete || false,
        loanDetailsEverCompleted: data.loanDetailsEverCompleted || false,
        loanDetailsCurrentStep: data.loanDetailsCurrentStep || null,
        loanDetailsActiveStep: data.loanDetailsActiveStep || null
      },
      seller_questions: {
        councilRates: data.councilRates || null,
        waterRates: data.waterRates || null,
        constructionStarted: data.constructionStarted || null,
        dutiableValue: data.dutiableValue || null,
        bodyCorp: data.bodyCorp || null,
        landTransferFee: data.landTransferFee || null,
        legalFees: data.legalFees || null,
        buildingAndPestInspection: data.buildingAndPestInspection || null,
        FIRBFee: data.FIRBFee || null,
        sellerQuestionsComplete: data.sellerQuestionsComplete || false,
        sellerQuestionsActiveStep: data.sellerQuestionsActiveStep || null
      },
      calculated_values: {
        LVR: data.LVR || 0,
        LMI_COST: data.LMI_COST || 0,
        LMI_STAMP_DUTY: data.LMI_STAMP_DUTY || 0,
        MONTHLY_LOAN_REPAYMENT: data.MONTHLY_LOAN_REPAYMENT || 0,
        ANNUAL_LOAN_REPAYMENT: data.ANNUAL_LOAN_REPAYMENT || 0,
        COUNCIL_RATES_MONTHLY: data.COUNCIL_RATES_MONTHLY || 0,
        WATER_RATES_MONTHLY: data.WATER_RATES_MONTHLY || 0,
        BODY_CORP_MONTHLY: data.BODY_CORP_MONTHLY || 0
      }
    }
  }, [stateFunctions])

  // Calculate grant and concession information for analytics
  const calculateGrantAndConcessionInfo = useCallback((data) => {
    // Only calculate when buyer details are complete
    if (!data.buyerDetailsComplete || !data.propertyDetailsComplete) {
      return {
        GRANT_ELIGIBLE: false,
        GRANT_AMOUNT: 0,
        GRANT_TYPE: null,
        CONCESSION_ELIGIBLE: false,
        CONCESSION_AMOUNT: 0,
        CONCESSION_TYPE: null
      }
    }

    // Use state functions from closure (from component level useStateSelector)
    if (!stateFunctions?.calculateUpfrontCosts) {
      return {
        GRANT_ELIGIBLE: false,
        GRANT_AMOUNT: 0,
        GRANT_TYPE: null,
        CONCESSION_ELIGIBLE: false,
        CONCESSION_AMOUNT: 0,
        CONCESSION_TYPE: null
      }
    }

    // Prepare buyer and property data
    const buyerData = {
      selectedState: data.selectedState,
      buyerType: data.buyerType,
      isPPR: data.isPPR,
      isAustralianResident: data.isAustralianResident,
      isFirstHomeBuyer: data.isFirstHomeBuyer,
      ownedPropertyLast5Years: data.ownedPropertyLast5Years,
      hasPensionCard: data.hasPensionCard,
      needsLoan: data.needsLoan,
      savingsAmount: data.savingsAmount,
      income: data.income,
      dependants: data.dependants,
      dutiableValue: data.dutiableValue,
      constructionStarted: data.constructionStarted,
      sellerQuestionsComplete: data.sellerQuestionsComplete
    }

    const propertyData = {
      propertyPrice: data.propertyPrice,
      propertyType: data.propertyType,
      propertyCategory: data.propertyCategory,
      isWA: data.isWA,
      isWAMetro: data.isWAMetro,
      isACT: data.isACT
    }

    // Calculate upfront costs to get grants and concessions
    try {
      const upfrontCosts = stateFunctions.calculateUpfrontCosts(
        buyerData,
        propertyData,
        data.selectedState
      )

      // Extract grant info
      let grantInfo = {
        GRANT_ELIGIBLE: false,
        GRANT_AMOUNT: 0,
        GRANT_TYPE: null
      }

      if (upfrontCosts.grants && upfrontCosts.grants.length > 0) {
        const grant = upfrontCosts.grants[0] // Take the first grant
        grantInfo = {
          GRANT_ELIGIBLE: grant.eligible || false,
          GRANT_AMOUNT: grant.amount || 0,
          GRANT_TYPE: grant.type || 'First Home Owners Grant'
        }
      }

      // Extract concession info
      let concessionInfo = {
        CONCESSION_ELIGIBLE: false,
        CONCESSION_AMOUNT: 0,
        CONCESSION_TYPE: null
      }

      if (upfrontCosts.concessions && upfrontCosts.concessions.length > 0) {
        const concession = upfrontCosts.concessions[0] // Take the first concession
        concessionInfo = {
          CONCESSION_ELIGIBLE: concession.eligible || false,
          CONCESSION_AMOUNT: concession.amount || 0,
          CONCESSION_TYPE: concession.type || 'Stamp Duty Concession'
        }
      }

      return { ...grantInfo, ...concessionInfo }
    } catch (error) {
      console.error('Error calculating grant/concession info:', error)
      return {
        GRANT_ELIGIBLE: false,
        GRANT_AMOUNT: 0,
        GRANT_TYPE: null,
        CONCESSION_ELIGIBLE: false,
        CONCESSION_AMOUNT: 0,
        CONCESSION_TYPE: null
      }
    }
  }, [])

  // Save data to Supabase via API route
  const saveToSupabase = useCallback(async (data) => {
    try {
      if (!sessionId || !deviceId) {
        console.log('No session/device ID available, skipping save')
        return
      }

      const sections = organizeFormDataIntoSections(data)
      const completionPercentage = calculateCompletionPercentage(sections)
      const currentSection = getCurrentSection(data)
      const completionStatus = completionPercentage === 100 ? 'complete' : 'in_progress'
      
      // Calculate grant and concession info for analytics
      const grantConcessionInfo = calculateGrantAndConcessionInfo(data)
      
      // Merge grant/concession info into calculated values
      const calculatedValuesWithGrants = {
        ...sections.calculated_values,
        ...grantConcessionInfo
      }

      const requestData = {
        action: 'save',
        sessionId,
        deviceId,
        userId: null, // For future: will be set when user logs in
        propertyId,
        data: {
          propertyPrice: data.propertyPrice,
          propertyAddress: data.propertyAddress,
          selectedState: data.selectedState,
          propertyDetails: sections.property_details,
          buyerDetails: sections.buyer_details,
          loanDetails: sections.loan_details,
          sellerQuestions: sections.seller_questions,
          calculatedValues: calculatedValuesWithGrants,
          completionStatus,
          completionPercentage,
          currentSection
        }
      }

      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save')
      }

      if (result.propertyId && result.propertyId !== propertyId) {
        setPropertyId(result.propertyId)
      }

      console.log('✅ Form data saved via API:', result.message)
    } catch (error) {
      console.error('❌ Error saving to Supabase:', error)
      // Don't throw error - allow form to continue working offline
    }
  }, [sessionId, deviceId, propertyId, setPropertyId, organizeFormDataIntoSections, calculateCompletionPercentage, getCurrentSection, calculateGrantAndConcessionInfo])

  // Load existing data from Supabase via API route
  const loadFromSupabase = useCallback(async () => {
    try {
      const sessionId = getSessionId()
      if (!sessionId) {
        console.log('No session ID available, skipping load')
        return
      }

      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'load',
          sessionId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load')
      }

      if (result.data) {
        const record = result.data
        setPropertyId(record.id)

        // Merge all sections back into form data
        const allSections = {
          ...record.property_details,
          ...record.buyer_details,
          ...record.loan_details,
          ...record.seller_questions,
          ...record.calculated_values
        }

        // Update form data with loaded values
        Object.entries(allSections).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            updateFormData(key, value)
          }
        })

        console.log('✅ Form data loaded via API:', result.message)
      }
    } catch (error) {
      console.error('❌ Error loading from Supabase:', error)
    }
  }, [updateFormData, setPropertyId])

  // Debounced save function
  const debouncedSave = useCallback((data) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveToSupabase(data)
    }, 500) // 500ms delay
  }, [saveToSupabase])

  // Auto-save when form data changes (but skip the very first render)
  useEffect(() => {
    if (isInitialMountRef.current) {
      // Skip save on initial mount
      isInitialMountRef.current = false
      return
    }
    
    // Auto-save on every subsequent change
    debouncedSave(formData)
  }, [formData, debouncedSave])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    saveToSupabase,
    loadFromSupabase
  }
}

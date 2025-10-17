import { create } from 'zustand'

export const useFormStore = create((set, get) => ({
  // Property Details
  propertyPrice: '',
  propertyAddress: '',
  propertyStreetAddress: '',
  propertySuburbPostcode: '',
  detectedState: '',
  detectedWALocation: '', // Detected north/south for WA based on 26th parallel
  detectedWAMetro: '', // Detected metro/non-metro for WA
  selectedState: '',
  propertyType: '',
  propertyCategory: '',
  isWA: '',
  isWAMetro: '', // New field for WA Metro/Non-Metro
  isACT: '', // New field for ACT
  propertyDetailsComplete: false,
  propertyDetailsFormComplete: false,
  propertyDetailsCurrentStep: 1,
  propertyDetailsActiveStep: 1,
  
  // Buyer Details
  buyerType: '',
  isPPR: '',
  isAustralianResident: '',
  isFirstHomeBuyer: '',
  ownedPropertyLast5Years: '', // New field for ACT property ownership question
  hasPensionCard: '',
  needsLoan: '',
  savingsAmount: '',
  income: '', // New field for ACT income question
  dependants: '', // New field for ACT dependants question
  buyerDetailsComplete: false,
  buyerDetailsCurrentStep: null,
  buyerDetailsActiveStep: 1,
  
  // Navigation flags
  showLoanDetails: false,
  showSellerQuestions: false,
  
  // Loan Details
  loanDeposit: '',
  loanType: '',
  loanTerm: '',
  loanInterestOnlyPeriod: '',
  loanRate: '',
  loanLMI: '',
  loanSettlementFees: '',
  loanEstablishmentFee: '',
  loanDetailsComplete: false,
  loanDetailsEverCompleted: false, // Track if loan details were ever completed
  loanDetailsCurrentStep: null,
  loanDetailsActiveStep: 1,
  
  // Seller Questions
  councilRates: '',
  waterRates: '',
  constructionStarted: '',
  dutiableValue: '',
  bodyCorp: '',
  landTransferFee: '',
  legalFees: '',
  buildingAndPestInspection: '',
  FIRBFee: '',
  sellerQuestionsComplete: false,
  sellerQuestionsActiveStep: 1,
  
  // Final completion
  allFormsComplete: false,
  showSummary: false,
  
  // Dropdown state management
  openDropdown: null, // 'upfront' or 'ongoing' or 'summary' or null
  
  // Upfront costs display state
  showUpfrontDropdown: false,
  showDepositInUpfront: false,
  showBankFeesInUpfront: false,
  
  // Calculated values
  LVR: 0, // Loan-to-Value Ratio: 1 - (deposit amount / property price)
  LMI_COST: 0, // Lenders Mortgage Insurance cost
  LMI_STAMP_DUTY: 0, // Stamp duty on LMI premium
  MONTHLY_LOAN_REPAYMENT: 0, // Monthly loan repayment amount
  ANNUAL_LOAN_REPAYMENT: 0, // Annual loan repayment amount
  
  // Monthly ongoing costs
  COUNCIL_RATES_MONTHLY: 0, // Monthly council rates
  WATER_RATES_MONTHLY: 0, // Monthly water rates
  BODY_CORP_MONTHLY: 0, // Monthly body corporate fees
  
  // LMI Rates
  LMI_RATES: {
    '80.01-81%': {
      '0-300K': 0.00475,
      '300K-500K': 0.00568,
      '500K-600K': 0.00904,
      '600K-750K': 0.00904,
      '750K-1M': 0.00913
    },
    '84.01-85%': {
      '0-300K': 0.00727,
      '300K-500K': 0.00969,
      '500K-600K': 0.01165,
      '600K-750K': 0.01333,
      '750K-1M': 0.01407
    },
    '88.01-89%': {
      '0-300K': 0.01295,
      '300K-500K': 0.01621,
      '500K-600K': 0.01948,
      '600K-750K': 0.02218,
      '750K-1M': 0.02395
    },
    '89.01-90%': {
      '0-300K': 0.01463,
      '300K-500K': 0.01873,
      '500K-600K': 0.02180,
      '600K-750K': 0.02367,
      '750K-1M': 0.02516
    },
    '90.01-91%': {
      '0-300K': 0.02013,
      '300K-500K': 0.02618,
      '500K-600K': 0.03513,
      '600K-750K': 0.03783,
      '750K-1M': 0.03820
    },
    '91.01-94%': {
      '0-300K': 0.02309,
      '300K-500K': 0.02982,
      '500K-600K': 0.03756,
      '600K-750K': 0.04198,
      '750K-1M': 0.04212
    },
    '94.01-95%': {
      '0-300K': 0.02609,
      '300K-500K': 0.03345,
      '500K-600K': 0.03998,
      '600K-750K': 0.04613,
      '750K-1M': 0.04603
    }
  },

  // LMI Stamp Duty Rates (percentage of LMI premium)
  LMI_STAMP_DUTY_RATES: {
    'VIC': 10,  // Victoria: 10%
    'QLD': 9,   // Queensland: 9%
    'SA': 11,   // South Australia: 11%
    'WA': 10,   // Western Australia: 10%
    'ACT': 10   // Australian Capital Territory: 10%
    // NSW, TAS, NT: No stamp duty on LMI
  },

  // FIRB Fees for Established Property
  FIRB_FEES_ESTABLISHED: {
    '0-75000': 13500,
    '75001-1000000': 45300,
    '1000001-2000000': 90900,
    '2000001-3000000': 181800,
    '3000001-4000000': 272700,
    '4000001-5000000': 363600,
    '5000001-6000000': 454500,
    '6000001-7000000': 545400,
    '7000001-8000000': 636300,
    '8000001-9000000': 727200,
    '9000001-10000000': 818100,
    '10000001-11000000': 909000,
    '11000001-12000000': 999900,
    '12000001-13000000': 1090800,
    '13000001-14000000': 1181700,
    '14000001-15000000': 1272600,
    '15000001-16000000': 1363500,
    '16000001-17000000': 1454400,
    '17000001-18000000': 1545300,
    '18000001-19000000': 1636200,
    '19000001-20000000': 1727100,
    '20000001-21000000': 1818000,
    '21000001-22000000': 1908900,
    '22000001-23000000': 1999800,
    '23000001-24000000': 2090700,
    '24000001-25000000': 2181600,
    '25000001-26000000': 2272500,
    '26000001-27000000': 2363400,
    '27000001-28000000': 2454300,
    '28000001-29000000': 2545200,
    '29000001-30000000': 2636100,
    '30000001-31000000': 2727000,
    '31000001-32000000': 2817900,
    '32000001-33000000': 2908800,
    '33000001-34000000': 2999700,
    '34000001-35000000': 3090600,
    '35000001-36000000': 3181500,
    '36000001-37000000': 3272400,
    '37000001-38000000': 3363300,
    '38000001-39000000': 3454200,
    '39000001-40000000': 3545100,
    '40000001+': 3615600
  },

  // FIRB Fees for New Property, Off-the-Plan, House-and-Land, and Vacant-Land-Only
  FIRB_FEES_NEW_PROPERTY: {
    '0-75000': 4500,
    '75001-1000000': 15100,
    '1000001-2000000': 30300,
    '2000001-3000000': 60600,
    '3000001-4000000': 90900,
    '4000001-5000000': 121200,
    '5000001-6000000': 151500,
    '6000001-7000000': 181800,
    '7000001-8000000': 212100,
    '8000001-9000000': 242400,
    '9000001-10000000': 272700,
    '10000001-11000000': 303000,
    '11000001-12000000': 333300,
    '12000001-13000000': 363600,
    '13000001-14000000': 393900,
    '14000001-15000000': 424200,
    '15000001-16000000': 454500,
    '16000001-17000000': 484800,
    '17000001-18000000': 515100,
    '18000001-19000000': 545400,
    '19000001-20000000': 575700,
    '20000001-21000000': 606000,
    '21000001-22000000': 636300,
    '22000001-23000000': 666600,
    '23000001-24000000': 696900,
    '24000001-25000000': 727200,
    '25000001-26000000': 757500,
    '26000001-27000000': 787800,
    '27000001-28000000': 818100,
    '28000001-29000000': 848400,
    '29000001-30000000': 878700,
    '30000001-31000000': 909000,
    '31000001-32000000': 939300,
    '32000001-33000000': 969600,
    '33000001-34000000': 999900,
    '34000001-35000000': 1030200,
    '35000001-36000000': 1060500,
    '36000001-37000000': 1090800,
    '37000001-38000000': 1121100,
    '38000001-39000000': 1151400,
    '39000001-40000000': 1181700,
    '40000001+': 1205200
  },
  
  // Actions to update state
  updateFormData: (field, value) => set((state) => ({ 
    ...state, 
    [field]: value 
  })),
  
  // Reset all form data
  resetForm: () => set({
    propertyPrice: '',
    propertyAddress: '',
    selectedState: '',
    propertyType: '',
    propertyCategory: '',
    isWA: '',
    isWAMetro: '', // New field for WA Metro/Non-Metro
    isACT: '', // New field for ACT
    buyerType: '',
    isPPR: '',
    isAustralianResident: '',
    isFirstHomeBuyer: '',
    ownedPropertyLast5Years: '', // New field for ACT property ownership question
    hasPensionCard: '',
    needsLoan: '',
    savingsAmount: '',
    income: '', // New field for ACT income question
    dependants: '', // New field for ACT dependants question
    propertyDetailsComplete: false,
    propertyDetailsFormComplete: false,
    propertyDetailsCurrentStep: 1,
    propertyDetailsActiveStep: 1,
    buyerDetailsComplete: false,
    buyerDetailsCurrentStep: null,
    buyerDetailsActiveStep: 1,
    showLoanDetails: false,
    showSellerQuestions: false,
    loanDeposit: '',
    loanType: '',
    loanTerm: '',
    loanInterestOnlyPeriod: '',
    loanRate: '',
    loanLMI: '',
    loanSettlementFees: '',
    loanEstablishmentFee: '',
    loanDetailsComplete: false,
    loanDetailsEverCompleted: false,
    loanDetailsCurrentStep: null,
    loanDetailsActiveStep: 1,
    LVR: 0,
    LMI_COST: 0,
    LMI_STAMP_DUTY: 0,
    MONTHLY_LOAN_REPAYMENT: 0,
    ANNUAL_LOAN_REPAYMENT: 0,
    COUNCIL_RATES_MONTHLY: 0,
    WATER_RATES_MONTHLY: 0,
    BODY_CORP_MONTHLY: 0,
    councilRates: '',
    waterRates: '',
    constructionStarted: '',
    dutiableValue: '',
    bodyCorp: '',
    landTransferFee: '',
    legalFees: '',
    buildingAndPestInspection: '',
    FIRBFee: '',
    sellerQuestionsComplete: false,
    sellerQuestionsActiveStep: 1,
    allFormsComplete: false,
    showSummary: false,
    openDropdown: null,
    showUpfrontDropdown: false,
    showDepositInUpfront: false,
    showBankFeesInUpfront: false,
  }),
  
  // Helper to get all current form data
  getFormData: () => get(),
  
  // Helper to check if a specific section is complete
  isSectionComplete: (section) => {
    const state = get()
    switch (section) {
      case 'property':
        return state.propertyDetailsComplete
      case 'buyer':
        return state.buyerDetailsComplete
      case 'loan':
        return state.loanDetailsComplete
      case 'seller':
        return state.sellerQuestionsComplete
      default:
        return false
    }
  },

  // Upfront costs display logic
  getUpfrontCostsDisplay: () => {
    const state = get()
    return {
      showDeposit: state.loanDetailsComplete && state.needsLoan === 'yes',
      showBankFees: state.loanDetailsComplete && state.needsLoan === 'yes',
      canShowDropdown: state.propertyDetailsFormComplete,
      isDropdownOpen: state.openDropdown === 'upfront'
    }
  },

  // Toggle upfront costs dropdown
  toggleUpfrontDropdown: () => {
    const state = get()
    if (state.openDropdown === 'upfront') {
      set({ openDropdown: null })
    } else {
      set({ openDropdown: 'upfront' })
    }
  },

  // Calculate LVR (Loan-to-Value Ratio)
  calculateLVR: () => {
    const state = get()
    const propertyPrice = parseInt(state.propertyPrice) || 0
    const depositAmount = parseInt(state.loanDeposit) || 0
    
    if (propertyPrice === 0) {
      return 0
    }
    
    const lvr = 1 - (depositAmount / propertyPrice)
    return Math.max(0, Math.min(1, lvr)) // Ensure LVR is between 0 and 1
  },

  // Update LVR when relevant fields change
  updateLVR: () => {
    const lvr = get().calculateLVR()
    set({ LVR: lvr })
  },

  // Calculate LMI cost
  calculateLMI: () => {
    const state = get()
    const propertyPrice = parseInt(state.propertyPrice) || 0
    const lvr = state.LVR
    
    if (propertyPrice === 0 || lvr === 0 || state.loanLMI !== 'yes') {
      return 0
    }
    
    // Find the correct LVR range
    let lvrRange = null
    if (lvr >= 0.8001 && lvr <= 0.81) lvrRange = '80.01-81%'
    else if (lvr >= 0.8401 && lvr <= 0.85) lvrRange = '84.01-85%'
    else if (lvr >= 0.8801 && lvr <= 0.89) lvrRange = '88.01-89%'
    else if (lvr >= 0.8901 && lvr <= 0.90) lvrRange = '89.01-90%'
    else if (lvr >= 0.9001 && lvr <= 0.91) lvrRange = '90.01-91%'
    else if (lvr >= 0.9101 && lvr <= 0.94) lvrRange = '91.01-94%'
    else if (lvr >= 0.9401 && lvr <= 0.95) lvrRange = '94.01-95%'
    
    if (!lvrRange) return 0
    
    // Find the correct property value range
    let valueRange = null
    if (propertyPrice <= 300000) valueRange = '0-300K'
    else if (propertyPrice <= 500000) valueRange = '300K-500K'
    else if (propertyPrice <= 600000) valueRange = '500K-600K'
    else if (propertyPrice <= 750000) valueRange = '600K-750K'
    else if (propertyPrice <= 1000000) valueRange = '750K-1M'
    
    if (!valueRange) return 0
    
    // Get the LMI rate
    const lmiRate = state.LMI_RATES[lvrRange]?.[valueRange]
    if (!lmiRate) return 0
    
    // Calculate LMI cost
    const loanAmount = propertyPrice * lvr
    const lmiCost = loanAmount * lmiRate
    
    return Math.round(lmiCost)
  },

  // Calculate LMI stamp duty
  calculateLMIStampDuty: () => {
    const state = get()
    const lmiCost = state.LMI_COST || 0
    const selectedState = state.selectedState
    
    // Only calculate if LMI exists and state applies stamp duty
    if (lmiCost === 0 || !state.LMI_STAMP_DUTY_RATES[selectedState]) {
      return 0
    }
    
    const rate = state.LMI_STAMP_DUTY_RATES[selectedState]
    return Math.round(lmiCost * (rate / 100))
  },

  // Calculate monthly ongoing costs from annual amounts
  calculateOngoingCosts: () => {
    const state = get()
    const councilRates = parseInt(state.councilRates) || 0
    const waterRates = parseInt(state.waterRates) || 0
    const bodyCorp = parseInt(state.bodyCorp) || 0
    
    return {
      councilRatesMonthly: Math.round(councilRates / 12),
      waterRatesMonthly: Math.round(waterRates / 12),
      bodyCorpMonthly: Math.round(bodyCorp / 12)
    }
  },

  // Update ongoing costs when relevant fields change
  updateOngoingCosts: () => {
    const ongoingCosts = get().calculateOngoingCosts()
    set({
      COUNCIL_RATES_MONTHLY: ongoingCosts.councilRatesMonthly,
      WATER_RATES_MONTHLY: ongoingCosts.waterRatesMonthly,
      BODY_CORP_MONTHLY: ongoingCosts.bodyCorpMonthly
    })
  },

  // Update LMI cost when relevant fields change
  updateLMI: () => {
    const state = get()
    const lmiCost = state.calculateLMI()
    const lmiStampDuty = state.calculateLMIStampDuty()
    
    // Calculate loan repayments with the new LMI cost and stamp duty
    const propertyPrice = parseInt(state.propertyPrice) || 0
    const depositAmount = parseInt(state.loanDeposit) || 0
    const newLmiCost = state.loanLMI === 'yes' ? lmiCost : 0
    const newLmiStampDuty = state.loanLMI === 'yes' ? lmiStampDuty : 0
    const loanAmount = propertyPrice + newLmiCost + newLmiStampDuty - depositAmount
    const interestRate = parseFloat(state.loanRate) || 0
    const loanTerm = parseInt(state.loanTerm) || 0
    const loanType = state.loanType
    const interestOnlyPeriod = parseInt(state.loanInterestOnlyPeriod) || 0
    
    let monthlyRepayment = 0
    let annualRepayment = 0
    
    if (loanAmount > 0 && interestRate > 0 && loanTerm > 0) {
      const monthlyRate = interestRate / 100 / 12
      
      if (loanType === 'interest-only') {
        monthlyRepayment = Math.round(loanAmount * monthlyRate)
      } else {
        if (monthlyRate === 0) {
          monthlyRepayment = loanAmount / (loanTerm * 12)
        } else {
          const numPayments = loanTerm * 12
          monthlyRepayment = Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                                       (Math.pow(1 + monthlyRate, numPayments) - 1))
        }
      }
      annualRepayment = monthlyRepayment * 12
    }
    
    set({ 
      LMI_COST: lmiCost,
      LMI_STAMP_DUTY: lmiStampDuty,
      MONTHLY_LOAN_REPAYMENT: monthlyRepayment,
      ANNUAL_LOAN_REPAYMENT: annualRepayment
    })
  },

  // Calculate monthly loan repayment
  calculateMonthlyRepayment: () => {
    const state = get()
    const propertyPrice = parseInt(state.propertyPrice) || 0
    const depositAmount = parseInt(state.loanDeposit) || 0
    const lmiCost = state.loanLMI === 'yes' ? (state.LMI_COST || 0) : 0
    const lmiStampDuty = state.loanLMI === 'yes' ? (state.LMI_STAMP_DUTY || 0) : 0
    // Loan amount includes LMI and LMI stamp duty: Property Price + LMI + LMI_Stamp_Duty - Deposit
    const loanAmount = propertyPrice + lmiCost + lmiStampDuty - depositAmount
    const interestRate = parseFloat(state.loanRate) || 0
    const loanTerm = parseInt(state.loanTerm) || 0
    const loanType = state.loanType
    const interestOnlyPeriod = parseInt(state.loanInterestOnlyPeriod) || 0
    
    if (loanAmount <= 0 || interestRate <= 0 || loanTerm <= 0) {
      return 0
    }
    
    const monthlyRate = interestRate / 100 / 12
    
    if (loanType === 'interest-only') {
      // Interest-only calculation - always show interest-only payment
      return Math.round(loanAmount * monthlyRate)
    } else {
      // Principal and interest calculation
      if (monthlyRate === 0) {
        return loanAmount / (loanTerm * 12)
      }
      
      const numPayments = loanTerm * 12
      const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                            (Math.pow(1 + monthlyRate, numPayments) - 1)
      
      return Math.round(monthlyPayment)
    }
  },

  // Calculate annual loan repayment
  calculateAnnualRepayment: () => {
    const state = get()
    const monthlyRepayment = state.calculateMonthlyRepayment()
    return monthlyRepayment * 12
  },

  // Update loan repayments when relevant fields change
  updateLoanRepayments: () => {
    const monthlyRepayment = get().calculateMonthlyRepayment()
    const annualRepayment = get().calculateAnnualRepayment()
    set({ 
      MONTHLY_LOAN_REPAYMENT: monthlyRepayment,
      ANNUAL_LOAN_REPAYMENT: annualRepayment
    })
  },

  // Calculate FIRB fee based on property type and value
  calculateFIRBFee: () => {
    const state = get()
    const propertyPrice = parseInt(state.propertyPrice) || 0
    const isAustralianResident = state.isAustralianResident
    const propertyType = state.propertyType
    
    // Only calculate if not Australian resident
    if (isAustralianResident === 'yes' || propertyPrice === 0) {
      return 0
    }
    
    // Determine which fee table to use based on property type
    let feeTable = null
    if (propertyType === 'existing') {
      feeTable = state.FIRB_FEES_ESTABLISHED
    } else if (['new', 'off-the-plan', 'house-and-land', 'vacant-land-only'].includes(propertyType)) {
      feeTable = state.FIRB_FEES_NEW_PROPERTY
    }
    
    if (!feeTable) {
      return 0
    }
    
    // Find the appropriate fee range
    for (const [range, fee] of Object.entries(feeTable)) {
      if (range === '40000001+') {
        return fee
      }
      
      const [min, max] = range.split('-').map(Number)
      if (propertyPrice >= min && propertyPrice <= max) {
        return fee
      }
    }
    
    return 0
  },

  // Update FIRB fee when relevant fields change
  updateFIRBFee: () => {
    const firbFee = get().calculateFIRBFee()
    set({ FIRBFee: firbFee })
  }
}))

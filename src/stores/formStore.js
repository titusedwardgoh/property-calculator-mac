import { create } from 'zustand'

export const useFormStore = create((set, get) => ({
  // Property Details
  propertyPrice: '',
  propertyAddress: '',
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
  sellerQuestionsComplete: false,
  sellerQuestionsActiveStep: 1,
  
  // Final completion
  allFormsComplete: false,
  
  // Dropdown state management
  openDropdown: null, // 'upfront' or 'ongoing' or null
  
  // Upfront costs display state
  showUpfrontDropdown: false,
  showDepositInUpfront: false,
  showBankFeesInUpfront: false,
  
  // Calculated values
  LVR: 0, // Loan-to-Value Ratio: 1 - (deposit amount / property price)
  LMI_COST: 0, // Lenders Mortgage Insurance cost
  
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
    '94.01-95%': {
      '0-300K': 0.02609,
      '300K-500K': 0.03345,
      '500K-600K': 0.03998,
      '600K-750K': 0.04613,
      '750K-1M': 0.04603
    }
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
    councilRates: '',
    waterRates: '',
    constructionStarted: '',
    dutiableValue: '',
    bodyCorp: '',
    landTransferFee: '',
    legalFees: '',
    buildingAndPestInspection: '',
    sellerQuestionsComplete: false,
    sellerQuestionsActiveStep: 1,
    allFormsComplete: false,
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

  // Update LMI cost when relevant fields change
  updateLMI: () => {
    const lmiCost = get().calculateLMI()
    set({ LMI_COST: lmiCost })
  }
}))

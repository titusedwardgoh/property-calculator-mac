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
  }
}))

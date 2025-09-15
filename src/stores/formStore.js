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
  }
}))

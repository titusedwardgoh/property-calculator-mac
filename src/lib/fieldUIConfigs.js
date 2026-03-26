/**
 * UI configuration for AdditionalQuestions and ReviewGapFiller inputs.
 * Each field has: type, label, title (question heading), description (subtitle),
 * and optionally options with descriptions for rich card-style toggles.
 */

export const fieldUIConfigs = {
  // --- Property fields ---
  selectedState: {
    type: 'select',
    label: 'State',
    title: 'Which state is the property in?',
    description: 'Different states have different stamp duty rates and concessions',
    options: [
      { value: 'NSW', label: 'NSW' },
      { value: 'VIC', label: 'VIC' },
      { value: 'QLD', label: 'QLD' },
      { value: 'SA', label: 'SA' },
      { value: 'WA', label: 'WA' },
      { value: 'TAS', label: 'TAS' },
      { value: 'ACT', label: 'ACT' },
      { value: 'NT', label: 'NT' },
    ],
  },
  propertyCategory: {
    type: 'select',
    label: 'Property Type',
    title: 'What type of property is it?',
    description: 'This affects your stamp duty concessions and ongoing costs',
    options: [
      { value: 'house', label: 'House' },
      { value: 'apartment', label: 'Apartment' },
      { value: 'townhouse', label: 'Townhouse' },
      { value: 'land', label: 'Vacant Land' },
    ],
  },
  propertyType: {
    type: 'select',
    label: 'New/Existing',
    title: 'Is this property new or existing?',
    description: 'New properties may have different concessions and costs',
    options: [
      { value: 'existing', label: 'Existing Property' },
      { value: 'new', label: 'New Property' },
      { value: 'off-the-plan', label: 'Off-the-Plan' },
      { value: 'house-and-land', label: 'House & Land' },
      { value: 'vacant-land-only', label: 'Vacant Land Only' },
    ],
  },
  propertyAddress: {
    type: 'text',
    label: 'Property Address',
    title: "What's the property address?",
    description: 'This helps us determine the state and provide accurate calculations',
  },
  propertyPrice: {
    type: 'currency',
    label: 'Purchase Price',
    title: "What is the property's price?",
    description: 'This will help us calculate your stamp duty and other costs',
  },
  isWA: {
    type: 'toggle',
    label: 'WA Region',
    title: 'Where is the property?',
    description: 'Please select the region as this affects stamp duty calculations for WA',
    options: [
      { value: 'north', label: 'North', description: 'of 26th parallel of South lat.' },
      { value: 'south', label: 'South', description: 'of 26th parallel of South lat.' },
    ],
  },
  isWAMetro: {
    type: 'toggle',
    label: 'Metro Area',
    title: 'Where is the property?',
    description: 'Please select the region as this affects stamp duty calculations for WA',
    options: [
      { value: 'metro', label: 'Metro/Peel Region', description: 'Perth metropolitan and Peel region' },
      { value: 'non-metro', label: 'Non-Metro/Peel Region', description: 'Outside metropolitan and Peel region' },
    ],
  },

  // --- Buyer fields ---
  buyerType: {
    type: 'toggle',
    label: 'Owner/Investor',
    title: 'Are you an Owner or Investor?',
    description: 'This affects your eligibility for concessions and grants',
    options: [
      { value: 'owner-occupier', label: 'Owner-Occupier', description: 'I will live in this property' },
      { value: 'investor', label: 'Investor', description: 'I will rent this property out' },
    ],
  },
  isPPR: {
    type: 'toggle',
    label: 'Principal Place of Residence',
    title: 'Will you live in this property?',
    description: 'This affects your eligibility for some concessions',
    options: [
      { value: 'yes', label: 'Yes', description: 'This will be my main home' },
      { value: 'no', label: 'No', description: 'This will not be my main home' },
    ],
  },
  isAustralianResident: {
    type: 'toggle',
    label: 'Australian Citizen/PR',
    title: 'Australian citizen or permanent resident?',
    description: 'Residents may have additional concessions and foreigners extra duties',
    options: [
      { value: 'yes', label: 'Yes', description: 'Australian citizen or permanent resident' },
      { value: 'no', label: 'No, I reside overseas', description: 'Foreign buyer' },
    ],
  },
  isFirstHomeBuyer: {
    type: 'toggle',
    label: 'First Home Buyer',
    title: 'Is this your first home purchase?',
    description: 'First home buyers may have additional concessions and grants.',
    options: [
      { value: 'yes', label: 'Yes', description: 'This is my first home purchase' },
      { value: 'no', label: 'No', description: 'I have owned property before' },
    ],
  },
  ownedPropertyLast5Years: {
    type: 'toggle',
    label: 'Owned Property (5yrs)',
    title: 'Have you owned any other property in the last 5 years?',
    description: 'This affects your eligibility for ACT Home Buyer Concession Scheme (HBCS).',
    options: [
      { value: 'yes', label: 'Yes', description: 'I have owned property in the last 5 years' },
      { value: 'no', label: 'No', description: 'I have not owned property in the last 5 years' },
    ],
  },
  hasPensionCard: {
    type: 'toggle',
    label: 'Pensioner Concession',
    title: 'Are you a holder of a pensioner card?',
    description: 'This may affect your eligibility for additional concessions and grants.',
    options: [
      { value: 'yes', label: 'Yes', description: 'I have a pension or concession card' },
      { value: 'no', label: 'No', description: 'I do not have a pension or concession card' },
    ],
  },
  savingsAmount: {
    type: 'currency',
    label: 'Available Savings',
    title: 'How much savings do you have?',
    description: 'You will need savings to cover the deposit and other upfront costs.',
  },
  needsLoan: {
    type: 'toggle',
    label: 'Loan Required',
    title: 'Do you need a loan to purchase?',
    description: 'This affects your loan calculations and costs.',
    options: [
      { value: 'yes', label: 'Yes', description: 'I need a loan to purchase' },
      { value: 'no', label: 'No', description: 'I will pay cash' },
    ],
  },
  income: {
    type: 'currency',
    label: 'Annual Income',
    title: 'What is your income?',
    description: 'In ACT the Home Buyer Concession Scheme (HBCS) is income tested.',
  },
  dependants: {
    type: 'number',
    label: 'Dependants',
    title: 'How many dependants do you have?',
    description: 'This affects your eligibility for the Home Buyer Concession Scheme (HBCS) in ACT.',
  },

  // --- Loan fields ---
  loanDeposit: {
    type: 'currency',
    label: 'Deposit Amount',
    title: 'What is your deposit amount?',
    description: 'The deposit you will put towards the property purchase.',
  },
  loanType: {
    type: 'toggle',
    label: 'Loan Type',
    title: 'What type of loan do you need?',
    description: 'This affects your monthly payments and loan structure',
    options: [
      { value: 'principal-and-interest', label: 'Principal and Interest', description: 'Pay both principal and interest each month' },
      { value: 'interest-only', label: 'Interest Only', description: 'Pay only interest for a set period' },
    ],
  },
  loanTerm: {
    type: 'number',
    label: 'Loan Term (years)',
    title: 'How long do you want your mortgage for?',
    description: 'Enter the number of years for your loan (1-30 years)',
  },
  loanRate: {
    type: 'number',
    label: 'Interest Rate (%)',
    title: 'What is your interest rate are you paying?',
    description: 'Enter the annual interest rate percentage for your loan',
  },
  loanLMI: {
    type: 'toggle',
    label: 'LMI Included',
    title: 'Do you need Lenders Mortgage Insurance?',
    description: 'LMI may apply depending on your loan-to-value ratio.',
    options: [
      { value: 'yes', label: 'Yes', description: 'I need LMI coverage' },
      { value: 'no', label: 'No', description: "I don't need LMI coverage" },
    ],
  },
  loanSettlementFees: {
    type: 'currency',
    label: 'Settlement Fees',
    title: 'Banks usually charge a Settlement Fee',
    description: 'Fee charged by the bank for settlement processing',
  },
  loanEstablishmentFee: {
    type: 'currency',
    label: 'Bank Establishment Fee',
    title: 'Banks usually charge an Establishment Fee',
    description: 'Fee charged by the bank for setting up your loan',
  },

  // --- Seller / ongoing cost fields ---
  councilRates: {
    type: 'currency',
    label: 'Annual Council Rates',
    title: 'Ask the seller: What are the annual council rates?',
    description: 'Below is an estimate only based on the property price',
  },
  waterRates: {
    type: 'currency',
    label: 'Annual Water Rates',
    title: 'Ask the seller: What are the annual water rates?',
    description: 'Annual water rates and service charges',
  },
  bodyCorp: {
    type: 'currency',
    label: 'Annual Body Corporate',
    title: 'Ask the seller: Is there body corporate or strata fees?',
    description: 'Annual body corporate or strata fees',
  },
  landTransferFee: {
    type: 'currency',
    label: 'Land Transfer Fee',
    title: 'What is the Land Transfer Fee?',
    description: 'Official registration of property ownership',
  },
  legalFees: {
    type: 'currency',
    label: 'Legal Fees',
    title: 'What is the cost for Legal & Conveyancing Services?',
    description: 'Professional legal services for property transfer',
  },
  buildingAndPestInspection: {
    type: 'currency',
    label: 'Building/Pest Inspection',
    title: 'What is the cost for Building and Pest Inspection?',
    description: 'Professional inspection of property condition and pest assessment',
  },
  constructionStarted: {
    type: 'toggle',
    label: 'Construction Started',
    title: 'Has construction already started on the property?',
    description: 'Determine if construction work has begun',
    options: [
      { value: 'yes', label: 'Yes', description: 'Construction has started' },
      { value: 'no', label: 'No', description: 'Construction has not started' },
    ],
  },
  dutiableValue: {
    type: 'currency',
    label: 'Dutiable Value',
    title: 'What is the dutiable value of the property?',
    description: 'The value used to calculate stamp duty and transfer duty',
  },
};

/**
 * Get config for a field key. Returns undefined if key not configured.
 * @param {string} key - Field key
 * @returns {Object|undefined} Config with type, label, title, description, and optionally options
 */
export function getFieldUIConfig(key) {
  return fieldUIConfigs[key];
}

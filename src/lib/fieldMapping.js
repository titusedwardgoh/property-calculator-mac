/**
 * Field Mapping Utility
 * 
 * Translation dictionary to map technical field keys to human-readable labels
 * and formatted values for use in Review Summary pages.
 */

// Field labels mapping
export const fieldLabels = {
  // Property fields
  propertyAddress: "Property Address",
  selectedState: "State",
  propertyCategory: "Category",
  propertyType: "Ownership Type",
  propertyPrice: "Purchase Price",
  isWA: "WA Region",
  isWAMetro: "Metro Area",
  
  // Buyer fields
  buyerType: "Buyer Entity",
  isPPR: "Primary Residence",
  isAustralianResident: "Residency Status",
  isFirstHomeBuyer: "First Home Buyer",
  savingsAmount: "Available Savings",
  needsLoan: "Finance Required",
  income: "Annual Income",
  dependants: "Dependants",
  ownedPropertyLast5Years: "Owned Property (5yrs)",
  hasPensionCard: "Pensioner Concession",
  
  // Loan fields
  loanDeposit: "Deposit Amount",
  loanType: "Loan Type",
  loanTerm: "Loan Term",
  loanRate: "Interest Rate",
  loanLMI: "LMI Included",
  loanSettlementFees: "Settlement Fees",
  loanEstablishmentFee: "Bank Establishment Fee",
  
  // Seller fields
  councilRates: "Council Rates",
  waterRates: "Water Rates",
  bodyCorp: "Body Corporate",
  landTransferFee: "Land Transfer Fee",
  legalFees: "Legal Fees",
  buildingAndPestInspection: "Building/Pest Inspection",
  constructionStarted: "Construction Started",
  dutiableValue: "Dutiable Value",
};

// Fields that should be formatted as currency
const currencyFields = new Set([
  'propertyPrice',
  'savingsAmount',
  'income',
  'loanDeposit',
  'councilRates',
  'waterRates',
  'bodyCorp',
  'landTransferFee',
  'legalFees',
  'buildingAndPestInspection',
  'dutiableValue',
  'loanSettlementFees',
  'loanEstablishmentFee',
]);

// Value mappings for specific fields
const valueMaps = {
  buyerType: {
    'owner-occupier': 'Owner-Occupier',
    'investor': 'Investor',
  },
  propertyCategory: {
    'house': 'House',
    'apartment': 'Apartment',
    'townhouse': 'Townhouse',
    'land': 'Vacant Land',
  },
  propertyType: {
    'existing': 'Existing Property',
    'new': 'New Property',
    'off-the-plan': 'Off-the-Plan',
    'house-and-land': 'House & Land',
    'vacant-land-only': 'Vacant Land Only',
  },
  loanType: {
    'principal-and-interest': 'Principal and Interest',
    'interest-only': 'Interest Only',
  },
  isWA: {
    'north': 'North',
    'south': 'South',
  },
  isWAMetro: {
    'metro': 'Metro',
    'non-metro': 'Non-Metro/Peel Region',
  },
};

/**
 * Format currency value using Australian dollar format
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted currency string (e.g., "$1,200")
 */
function formatCurrency(amount) {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return 'Not specified';
  }
  
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

/**
 * Format a field value for display in the Review Summary
 * @param {string} key - The field key
 * @param {*} value - The field value
 * @returns {string} Formatted value string
 */
export function formatFieldValue(key, value) {
  // Handle null, undefined, or empty string
  if (value === null || value === undefined || value === '') {
    return 'Not specified';
  }
  
  // Handle boolean/yes-no values
  if (value === true || value === 'yes') {
    return 'Yes';
  }
  if (value === false || value === 'no') {
    return 'No';
  }
  
  // Handle currency fields
  if (currencyFields.has(key)) {
    return formatCurrency(value);
  }
  
  // Handle value mappings
  if (valueMaps[key] && valueMaps[key][value]) {
    return valueMaps[key][value];
  }
  
  // Handle loanTerm - append " years"
  if (key === 'loanTerm') {
    const numTerm = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(numTerm)) {
      return `${numTerm} years`;
    }
  }
  
  // Handle loanRate - append "%"
  if (key === 'loanRate') {
    const numRate = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(numRate)) {
      return `${numRate}%`;
    }
  }
  
  // Fallback: return original value as string
  return String(value);
}

/**
 * Get human-readable label for a field key
 * @param {string} key - The field key
 * @returns {string} Human-readable label
 */
export function getFieldLabel(key) {
  // Return label from mapping if it exists
  if (fieldLabels[key]) {
    return fieldLabels[key];
  }
  
  // Fallback: format camelCase to "Camel Case"
  if (typeof key === 'string') {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
  
  // Final fallback: return key as-is
  return String(key);
}

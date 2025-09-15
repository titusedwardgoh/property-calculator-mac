// Utility functions shared across all states

// Format currency for display
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Estimate property price based on address and state
export const estimatePropertyPrice = (address, state, stateAverages) => {
  // Simplified price estimation based on state averages
  const basePrice = stateAverages[state] || 700000;
  
  // Add some randomness for demonstration
  return Math.round(basePrice * (0.8 + Math.random() * 0.4));
};

// Calculate percentage change
export const calculatePercentageChange = (oldValue, newValue) => {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

// Calculate compound growth
export const calculateCompoundGrowth = (principal, rate, years) => {
  return principal * Math.pow(1 + rate / 100, years);
};

// Calculate monthly to annual conversion
export const monthlyToAnnual = (monthlyAmount) => {
  return monthlyAmount * 12;
};

// Calculate annual to monthly conversion
export const annualToMonthly = (annualAmount) => {
  return annualAmount / 12;
};

// Calculate tax bracket
export const calculateTaxBracket = (income) => {
  if (income <= 18200) return { rate: 0, description: 'Tax-free threshold' };
  if (income <= 45000) return { rate: 19, description: '19% tax rate' };
  if (income <= 120000) return { rate: 32.5, description: '32.5% tax rate' };
  if (income <= 180000) return { rate: 37, description: '37% tax rate' };
  return { rate: 45, description: '45% tax rate' };
};

// Calculate effective tax rate
export const calculateEffectiveTaxRate = (income) => {
  const bracket = calculateTaxBracket(income);
  if (bracket.rate === 0) return 0;
  
  // Simplified calculation - in reality this would be more complex
  return bracket.rate;
};

// Calculate net income after tax
export const calculateNetIncome = (grossIncome) => {
  const effectiveRate = calculateEffectiveTaxRate(grossIncome);
  return grossIncome * (1 - effectiveRate / 100);
};

// Calculate debt-to-income ratio
export const calculateDebtToIncomeRatio = (monthlyDebtPayments, monthlyIncome) => {
  if (monthlyIncome === 0) return 0;
  return (monthlyDebtPayments / monthlyIncome) * 100;
};

// Calculate serviceability buffer
export const calculateServiceabilityBuffer = (monthlyIncome, monthlyExpenses, monthlyDebtPayments) => {
  const disposableIncome = monthlyIncome - monthlyExpenses - monthlyDebtPayments;
  const buffer = disposableIncome * 0.3; // 30% buffer
  return Math.max(0, buffer);
};

// Validate property price
export const validatePropertyPrice = (price) => {
  if (typeof price !== 'number' || isNaN(price)) return false;
  if (price < 0) return false;
  if (price > 10000000) return false; // $10M cap
  return true;
};

// Validate loan amount
export const validateLoanAmount = (loanAmount, propertyPrice) => {
  if (!validatePropertyPrice(propertyPrice)) return false;
  if (typeof loanAmount !== 'number' || isNaN(loanAmount)) return false;
  if (loanAmount < 0) return false;
  if (loanAmount > propertyPrice) return false;
  return true;
};

// Calculate loan-to-value ratio
export const calculateLVR = (loanAmount, propertyPrice) => {
  if (!validateLoanAmount(loanAmount, propertyPrice)) return 0;
  return (loanAmount / propertyPrice) * 100;
};

// Check if LMI is required
export const isLMIRequired = (loanAmount, propertyPrice) => {
  const lvr = calculateLVR(loanAmount, propertyPrice);
  return lvr > 80;
};

// Calculate minimum deposit required
export const calculateMinimumDeposit = (propertyPrice, targetLVR = 80) => {
  if (!validatePropertyPrice(propertyPrice)) return 0;
  return propertyPrice * (1 - targetLVR / 100);
};

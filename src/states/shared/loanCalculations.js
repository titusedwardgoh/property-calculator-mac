// Loan-related calculation functions shared across all states

// Monthly repayment calculation
export const calculateMonthlyRepayment = (principal, rate, years, repaymentType = 'principal-interest') => {
  const monthlyRate = rate / 100 / 12;
  
  if (monthlyRate === 0) return principal / (years * 12);
  
  // Interest only calculations
  if (repaymentType.startsWith('interest-only-')) {
    const interestOnlyYears = parseInt(repaymentType.split('-')[2]);
    const remainingYears = years - interestOnlyYears;
    
    if (remainingYears <= 0) {
      // If interest-only period is longer than or equal to loan term, calculate interest only
      return principal * monthlyRate;
    } else {
      // During interest-only period, pay only interest
      // The monthly payment is just the interest payment
      return principal * monthlyRate;
    }
  }
  
  // Principal and interest calculation (default)
  const numPayments = years * 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
};

// Total repayments calculation
export const calculateTotalRepayments = (principal, rate, years, repaymentType = 'principal-interest') => {
  const monthlyPayment = calculateMonthlyRepayment(principal, rate, years, repaymentType);
  
  if (repaymentType.startsWith('interest-only-')) {
    const interestOnlyYears = parseInt(repaymentType.split('-')[2]);
    const remainingYears = years - interestOnlyYears;
    
    if (remainingYears <= 0) {
      // If interest-only period is longer than or equal to loan term
      return monthlyPayment * years * 12;
    } else {
      // Calculate total for interest-only period + remaining principal and interest period
      const interestOnlyPayments = monthlyPayment * interestOnlyYears * 12;
      
      // For the remaining period, calculate principal and interest payments
      const remainingMonthlyRate = rate / 100 / 12;
      const remainingPayments = remainingYears * 12;
      const remainingMonthlyPayment = (principal * remainingMonthlyRate * Math.pow(1 + remainingMonthlyRate, remainingPayments)) / 
                                     (Math.pow(1 + remainingMonthlyRate, remainingPayments) - 1);
      const remainingTotal = remainingMonthlyPayment * remainingPayments;
      
      return interestOnlyPayments + remainingTotal;
    }
  }
  
  // Principal and interest calculation (default)
  return monthlyPayment * years * 12;
};

// LMI calculation
export const calculateLMI = (loanAmount, propertyPrice, upfrontCosts) => {
  // Calculate LVR including upfront costs
  const totalPropertyCost = propertyPrice + upfrontCosts;
  const lvr = (loanAmount / totalPropertyCost) * 100;
  
  // If LVR is 80% or below, no LMI required
  if (lvr <= 80) return 0;
  
  // If LVR is above 95% (deposit less than 5%), use the highest LMI rate
  let lvrBand;
  if (lvr > 95) {
    lvrBand = '94.01-95%'; // Use highest available rate
  } else if (lvr > 80 && lvr <= 81) {
    lvrBand = '80.01-81%';
  } else if (lvr > 81 && lvr <= 85) {
    lvrBand = '84.01-85%';
  } else if (lvr > 85 && lvr <= 89) {
    lvrBand = '88.01-89%';
  } else if (lvr > 89 && lvr <= 90) {
    lvrBand = '89.01-90%';
  } else if (lvr > 90 && lvr <= 91) {
    lvrBand = '90.01-91%';
  } else if (lvr > 91 && lvr <= 95) {
    lvrBand = '94.01-95%';
  } else {
    return 0; // Should not reach here
  }
  
  // Determine loan amount band
  let loanBand;
  if (loanAmount <= 300000) loanBand = '0-300K';
  else if (loanAmount <= 500000) loanBand = '300K-500K';
  else if (loanAmount <= 600000) loanBand = '500K-600K';
  else if (loanAmount <= 750000) loanBand = '600K-750K';
  else if (loanAmount <= 1000000) loanBand = '750K-1M';
  else return 0; // Loan too large for standard LMI
  
  // LMI rates table
  const lmiRates = {
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
  };
  
  const rate = lmiRates[lvrBand]?.[loanBand];
  if (!rate) return 0;
  
  return loanAmount * rate;
};

// Calculate loan-to-value ratio
export const calculateLVR = (loanAmount, propertyPrice, upfrontCosts = 0) => {
  const totalPropertyCost = propertyPrice + upfrontCosts;
  return (loanAmount / totalPropertyCost) * 100;
};

// Calculate required deposit
export const calculateRequiredDeposit = (propertyPrice, upfrontCosts = 0, targetLVR = 80) => {
  const totalPropertyCost = propertyPrice + upfrontCosts;
  const maxLoanAmount = totalPropertyCost * (targetLVR / 100);
  return totalPropertyCost - maxLoanAmount;
};

// Calculate stamp duty impact on loan amount
export const calculateStampDutyLoanImpact = (propertyPrice, stampDuty, targetLVR = 80) => {
  // Stamp duty reduces the amount available for deposit
  const totalCost = propertyPrice + stampDuty;
  const maxLoanAmount = totalCost * (targetLVR / 100);
  const requiredDeposit = totalCost - maxLoanAmount;
  
  // If stamp duty is high, it might require a larger deposit
  return {
    totalCost,
    maxLoanAmount,
    requiredDeposit,
    stampDutyImpact: stampDuty
  };
};

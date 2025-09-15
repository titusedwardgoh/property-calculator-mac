import { 
  ACT_STAMP_DUTY_RATES, 
  ACT_HBCS_MAX_CONCESSION,
  ACT_HBCS_INCOME_THRESHOLDS,
  ACT_HBCS_DUTY_BRACKETS
} from './constants.js';

export const calculateACTStampDuty = (propertyPrice, selectedState) => {
  // Only calculate if ACT is selected
  if (selectedState !== 'ACT') {
    return 0;
  }

  // Convert propertyPrice to number if it's a string
  const price = parseInt(propertyPrice) || 0;
  
  if (price <= 0) {
    return 0;
  }

  // Find the applicable rate bracket
  let applicableRate = null;
  for (const bracket of ACT_STAMP_DUTY_RATES) {
    if (price > bracket.min && price <= bracket.max) {
      applicableRate = bracket;
      break;
    }
  }

  if (!applicableRate) {
    return 0;
  }

  // Special case for properties over $1,455,000 - flat rate on total value
  if (price > 1455000) {
    return price * applicableRate.rate;
  }

  // Calculate stamp duty: (price - min) * rate + fixed fee
  const stampDuty = (price - applicableRate.min) * applicableRate.rate + applicableRate.fixedFee;

  return stampDuty;
};

// Check if buyer is eligible for HBCS
export const isACTHBCSEligible = (formData) => {
  // Must be ACT
  if (formData.selectedState !== 'ACT') {
    return false;
  }

  // Must be owner-occupier (not investor)
  if (formData.buyerType !== 'owner-occupier') {
    return false;
  }

  // Must be PPR
  if (formData.isPPR !== 'yes') {
    return false;
  }

  // Must not have owned property in the last 5 years
  if (formData.ownedPropertyLast5Years !== 'no') {
    return false;
  }

  // Income test - must have income and dependants data
  if (!formData.income || !formData.dependants) {
    return false;
  }

  const income = parseInt(formData.income) || 0;
  const dependants = parseInt(formData.dependants) || 0;
  
  // Cap dependants at 5+ for threshold lookup
  const dependantKey = Math.min(dependants, 5);
  const incomeThreshold = ACT_HBCS_INCOME_THRESHOLDS[dependantKey];
  
  // Income must be below threshold
  if (income >= incomeThreshold) {
    return false;
  }

  return true;
};

// Calculate HBCS duty amount
export const calculateACTHBCSDuty = (propertyPrice, formData) => {
  if (!isACTHBCSEligible(formData)) {
    return 0;
  }

  const price = parseInt(propertyPrice) || 0;
  
  if (price <= 0) {
    return 0;
  }

  // Find the applicable HBCS duty bracket
  for (const bracket of ACT_HBCS_DUTY_BRACKETS) {
    if (price > bracket.min && price <= bracket.max) {
      // Property ≤ $1,020,000: $0 duty
      if (bracket.duty === 0) {
        return 0;
      }
      
      // Property $1,020,001 - $1,454,999: $6.40 per $100 over $1,020,000
      if (bracket.rate && bracket.threshold) {
        const excessAmount = price - bracket.threshold;
        return excessAmount * bracket.rate;
      }
      
      // Property ≥ $1,455,000: $4.54 per $100 of total value
      if (bracket.rate && bracket.flatRate) {
        return price * bracket.rate;
      }
    }
  }

  return 0;
};

// Calculate HBCS concession amount
export const calculateACTHBCSConcession = (propertyPrice, formData) => {
  if (!isACTHBCSEligible(formData)) {
    return 0;
  }

  const baseStampDuty = calculateACTStampDuty(propertyPrice, formData.selectedState);
  const hbcsDuty = calculateACTHBCSDuty(propertyPrice, formData);
  
  const concession = baseStampDuty - hbcsDuty;
  
  // Cap at maximum concession amount
  return Math.min(concession, ACT_HBCS_MAX_CONCESSION);
};

// Main upfront costs calculation for ACT
export const calculateUpfrontCosts = (buyerData, propertyData, selectedState) => {
  // Only calculate if ACT is selected
  if (selectedState !== 'ACT') {
    return {
      stampDuty: { amount: 0, label: "Stamp Duty" },
      concessions: [],
      grants: [],
      foreignDuty: { amount: 0, applicable: false },
      netStateDuty: 0,
      totalUpfrontCosts: 0
    };
  }

  const price = parseInt(propertyData.propertyPrice) || 0;
  
  // Calculate base stamp duty
  const stampDutyAmount = calculateACTStampDuty(price, selectedState);
  
  // Calculate HBCS concession
  const hbcsConcessionAmount = calculateACTHBCSConcession(price, buyerData);
  const isHBCSEligible = isACTHBCSEligible(buyerData);
  
  // Prepare concessions arrays
  const concessions = [];
  const ineligibleConcessions = [];
  
  if (isHBCSEligible && hbcsConcessionAmount > 0) {
    concessions.push({
      type: 'Home Buyer Concession',
      amount: hbcsConcessionAmount,
      eligible: true,
      reason: 'Eligible for HBCS - income below threshold',
      details: {
        income: parseInt(buyerData.income) || 0,
        dependants: parseInt(buyerData.dependants) || 0,
        incomeThreshold: ACT_HBCS_INCOME_THRESHOLDS[Math.min(parseInt(buyerData.dependants) || 0, 5)],
        baseStampDuty: stampDutyAmount,
        hbcsDuty: calculateACTHBCSDuty(price, buyerData),
        concessionAmount: hbcsConcessionAmount,
        maxConcession: ACT_HBCS_MAX_CONCESSION
      }
    });
  } else if (buyerData.income && buyerData.dependants) {
    // User provided income/dependants but not eligible
    const income = parseInt(buyerData.income) || 0;
    const dependants = parseInt(buyerData.dependants) || 0;
    const incomeThreshold = ACT_HBCS_INCOME_THRESHOLDS[Math.min(dependants, 5)];
    
    let reason = 'Not eligible for HBCS';
    
    // Check specific reasons for ineligibility
    if (buyerData.ownedPropertyLast5Years !== 'no') {
      reason = 'Must not have owned any other property in the last 5 years';
    } else if (income >= incomeThreshold) {
      reason = `Income $${income.toLocaleString()} exceeds threshold of $${incomeThreshold.toLocaleString()} for ${dependants} dependent${dependants !== 1 ? 's' : ''}`;
    }
    
    
    ineligibleConcessions.push({
      type: 'Home Buyer Concession',
      amount: 0,
      eligible: false,
      reason: reason,
      details: {
        income: income,
        dependants: dependants,
        incomeThreshold: incomeThreshold,
        ownedPropertyLast5Years: buyerData.ownedPropertyLast5Years,
        baseStampDuty: stampDutyAmount
      }
    });
  }
  
  // Calculate net state duty (base stamp duty minus concessions)
  const totalConcessions = concessions.reduce((sum, concession) => sum + concession.amount, 0);
  const netStateDuty = Math.max(0, stampDutyAmount - totalConcessions);
  
  // Calculate total upfront costs (including property price if no loan needed)
  const propertyPrice = (buyerData.needsLoan === 'no') ? price : 0;
  const totalUpfrontCosts = netStateDuty + propertyPrice;
  
  return {
    stampDuty: { amount: stampDutyAmount, label: "Stamp Duty" },
    concessions: concessions,
    ineligibleConcessions: ineligibleConcessions,
    grants: [], // No grants implemented yet for ACT
    foreignDuty: { amount: 0, applicable: false }, // Foreign duty not implemented yet for ACT
    netStateDuty: netStateDuty,
    totalUpfrontCosts: totalUpfrontCosts
  };
};

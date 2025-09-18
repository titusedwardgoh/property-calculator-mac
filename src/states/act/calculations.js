import { 
  ACT_STAMP_DUTY_RATES, 
  ACT_HBCS_MAX_CONCESSION,
  ACT_HBCS_INCOME_THRESHOLDS,
  ACT_HBCS_DUTY_BRACKETS,
  ACT_OFF_THE_PLAN_EXEMPTION,
  ACT_PENSIONER_CONCESSION,
  ACT_OWNER_OCCUPIER_DUTY_RATES,
  ACT_OWNER_OCCUPIER_CONCESSION
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
      
      // Property ≥ $1,455,000: $4.54 per $100 of total value, less $35,238
      if (bracket.rate && bracket.flatRate) {
        return Math.max(0, price * bracket.rate - ACT_HBCS_MAX_CONCESSION);
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

  const price = parseInt(propertyPrice) || 0;
  const baseStampDuty = calculateACTStampDuty(propertyPrice, formData.selectedState);
  const hbcsDuty = calculateACTHBCSDuty(propertyPrice, formData);
  
  const concession = baseStampDuty - hbcsDuty;
  
  // Only cap at maximum concession amount for properties ≥ $1,455,000
  if (price >= 1455000) {
    return Math.min(concession, ACT_HBCS_MAX_CONCESSION);
  }
  
  return concession;
};

// Calculate Off the Plan Unit Duty Exemption
export const calculateACTOffThePlanExemption = (buyerData, propertyData, selectedState, stampDutyAmount) => {
  // 1. State validation
  if (selectedState !== 'ACT') {
    return { eligible: false, concessionAmount: 0, reason: 'Only available in ACT' };
  }

  // 2. Buyer type
  if (buyerData.buyerType !== 'owner-occupier') {
    return { eligible: false, concessionAmount: 0, reason: 'Must be owner-occupier' };
  }

  // 3. PPR requirement
  if (buyerData.isPPR !== 'yes') {
    return { eligible: false, concessionAmount: 0, reason: 'Must be Principal Place of Residence' };
  }

  // 4. Property type restriction
  if (propertyData.propertyType !== 'off-the-plan') {
    return { eligible: false, concessionAmount: 0, reason: 'Must be off-the-plan property' };
  }

  // 5. Property category restriction
  if (!ACT_OFF_THE_PLAN_EXEMPTION.PROPERTY_CATEGORY_RESTRICTIONS.includes(propertyData.propertyCategory)) {
    return { eligible: false, concessionAmount: 0, reason: 'Must be apartment or townhouse' };
  }

  // 6. Price validation
  const price = parseInt(propertyData.propertyPrice) || 0;
  if (price <= 0) {
    return { eligible: false, concessionAmount: 0, reason: 'Invalid property price' };
  }

  // 7. Price cap check
  if (price > ACT_OFF_THE_PLAN_EXEMPTION.PROPERTY_PRICE_CAP) {
    return { 
      eligible: false, 
      concessionAmount: 0, 
      reason: `Property price $${price.toLocaleString()} exceeds cap of $${ACT_OFF_THE_PLAN_EXEMPTION.PROPERTY_PRICE_CAP.toLocaleString()}` 
    };
  }

  // If all checks pass, full exemption
  return {
    eligible: true,
    concessionAmount: stampDutyAmount, // Full stamp duty exemption
    reason: 'Eligible for Off the Plan Unit Duty Exemption',
    details: {
      propertyPrice: price,
      baseStampDuty: stampDutyAmount,
      concessionalStampDuty: 0,
      concessionAmount: stampDutyAmount,
      netStampDuty: 0,
      propertyType: propertyData.propertyType,
      propertyCategory: propertyData.propertyCategory,
      priceCap: ACT_OFF_THE_PLAN_EXEMPTION.PROPERTY_PRICE_CAP
    }
  };
};

// Calculate ACT Pensioner Duty Concession
export const calculateACTPensionerConcession = (buyerData, propertyData, selectedState, stampDutyAmount) => {
  // 1. State validation
  if (selectedState !== 'ACT') {
    return { eligible: false, concessionAmount: 0, reason: 'Only available in ACT' };
  }

  // 2. Buyer type
  if (buyerData.buyerType !== 'owner-occupier') {
    return { eligible: false, concessionAmount: 0, reason: 'Must be owner-occupier' };
  }

  // 3. PPR requirement
  if (buyerData.isPPR !== 'yes') {
    return { eligible: false, concessionAmount: 0, reason: 'Must be Principal Place of Residence' };
  }

  // 4. Pensioner card requirement
  if (buyerData.hasPensionCard !== 'yes') {
    return { eligible: false, concessionAmount: 0, reason: 'Must have a pension or concession card' };
  }

  // 5. Price validation
  const price = parseInt(propertyData.propertyPrice) || 0;
  if (price <= 0) {
    return { eligible: false, concessionAmount: 0, reason: 'Invalid property price' };
  }

  // If all checks pass, calculate concession using same rates as HBCS
  const baseStampDuty = calculateACTStampDuty(price, selectedState);
  
  // Calculate pensioner duty using HBCS rates directly (not the HBCS function which checks eligibility)
  let pensionerDuty = 0;
  for (const bracket of ACT_HBCS_DUTY_BRACKETS) {
    if (price > bracket.min && price <= bracket.max) {
      // Property ≤ $1,020,000: $0 duty
      if (bracket.duty === 0) {
        pensionerDuty = 0;
        break;
      }
      
      // Property $1,020,001 - $1,454,999: $6.40 per $100 over $1,020,000
      if (bracket.rate && bracket.threshold) {
        const excessAmount = price - bracket.threshold;
        pensionerDuty = excessAmount * bracket.rate;
        break;
      }
      
      // Property ≥ $1,455,000: $4.54 per $100 of total value, less $35,238
      if (bracket.rate && bracket.flatRate) {
        pensionerDuty = Math.max(0, price * bracket.rate - ACT_HBCS_MAX_CONCESSION);
        break;
      }
    }
  }
  
  const concession = baseStampDuty - pensionerDuty;
  
  // Only cap at maximum concession amount for properties ≥ $1,455,000
  const finalConcession = price >= 1455000 ? Math.min(concession, ACT_HBCS_MAX_CONCESSION) : concession;

  return {
    eligible: true,
    concessionAmount: finalConcession,
    reason: 'Eligible for Pensioner Duty Concession',
    details: {
      propertyPrice: price,
      baseStampDuty: baseStampDuty,
      pensionerDuty: pensionerDuty,
      concessionAmount: finalConcession,
      netStampDuty: baseStampDuty - finalConcession,
      propertyType: propertyData.propertyType,
      maxConcession: ACT_HBCS_MAX_CONCESSION
    }
  };
};

// Calculate ACT Owner Occupier Duty (for Eligible Owner Occupier concession)
export const calculateACTOwnerOccupierDuty = (propertyPrice, selectedState) => {
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
  for (const bracket of ACT_OWNER_OCCUPIER_DUTY_RATES) {
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

// Calculate ACT Eligible Owner Occupier Concession
export const calculateACTOwnerOccupierConcession = (buyerData, propertyData, selectedState, stampDutyAmount) => {
  // 1. State validation
  if (selectedState !== 'ACT') {
    return { eligible: false, concessionAmount: 0, reason: 'Only available in ACT' };
  }

  // 2. Buyer type
  if (buyerData.buyerType !== 'owner-occupier') {
    return { eligible: false, concessionAmount: 0, reason: 'Must be owner-occupier' };
  }

  // 3. PPR requirement
  if (buyerData.isPPR !== 'yes') {
    return { eligible: false, concessionAmount: 0, reason: 'Must be Principal Place of Residence' };
  }

  // 4. Price validation
  const price = parseInt(propertyData.propertyPrice) || 0;
  if (price <= 0) {
    return { eligible: false, concessionAmount: 0, reason: 'Invalid property price' };
  }

  // If all checks pass, calculate concession
  const baseStampDuty = calculateACTStampDuty(price, selectedState);
  const ownerOccupierDuty = calculateACTOwnerOccupierDuty(price, selectedState);
  
  const concession = baseStampDuty - ownerOccupierDuty;

  return {
    eligible: true,
    concessionAmount: concession,
    reason: 'Eligible for Owner Occupier Concession',
    details: {
      propertyPrice: price,
      baseStampDuty: baseStampDuty,
      ownerOccupierDuty: ownerOccupierDuty,
      concessionAmount: concession,
      netStampDuty: baseStampDuty - concession,
      propertyType: propertyData.propertyType
    }
  };
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
  
  // Calculate Off the Plan exemption (highest priority)
  const offThePlanExemption = calculateACTOffThePlanExemption(buyerData, propertyData, selectedState, stampDutyAmount);
  
  // Calculate HBCS concession
  const hbcsConcessionAmount = calculateACTHBCSConcession(price, buyerData);
  const isHBCSEligible = isACTHBCSEligible(buyerData);
  
  // Calculate Pensioner concession
  const pensionerConcession = calculateACTPensionerConcession(buyerData, propertyData, selectedState, stampDutyAmount);
  
  // Calculate Owner Occupier concession
  const ownerOccupierConcession = calculateACTOwnerOccupierConcession(buyerData, propertyData, selectedState, stampDutyAmount);
  
  // Prepare concessions arrays
  const concessions = [];
  const ineligibleConcessions = [];
  const allConcessions = {};
  
  // Priority logic: Off the Plan Exemption > HBCS > Pensioner Concession > Owner Occupier Concession
  
  // Store all concession results for UI display
  allConcessions.offThePlanExemption = offThePlanExemption;
  allConcessions.hbcs = {
    eligible: isHBCSEligible,
    concessionAmount: hbcsConcessionAmount,
    reason: isHBCSEligible ? 'Eligible for HBCS - income below threshold' : 'Not eligible for HBCS'
  };
  allConcessions.pensioner = pensionerConcession;
  allConcessions.ownerOccupier = ownerOccupierConcession;
  
  if (offThePlanExemption.eligible) {
    // Off the Plan Exemption takes priority
    concessions.push({
      type: 'Off the Plan Exemption',
      amount: offThePlanExemption.concessionAmount,
      eligible: true,
      reason: offThePlanExemption.reason,
      details: offThePlanExemption.details
    });
    
    // Add HBCS to ineligible if it was also eligible
    if (isHBCSEligible && hbcsConcessionAmount > 0) {
      ineligibleConcessions.push({
        type: 'Home Buyer Concession',
        amount: hbcsConcessionAmount,
        eligible: false,
        reason: 'Off the Plan Exemption takes priority',
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
    }
    
    // Add Pensioner to ineligible if it was also eligible
    if (pensionerConcession.eligible) {
      ineligibleConcessions.push({
        type: 'Pensioner Concession',
        amount: pensionerConcession.concessionAmount,
        eligible: false,
        reason: 'Off the Plan Exemption takes priority',
        details: pensionerConcession.details
      });
    }
    
    // Add Owner Occupier to ineligible if it was also eligible
    if (ownerOccupierConcession.eligible) {
      ineligibleConcessions.push({
        type: 'Owner Occupier Concession',
        amount: ownerOccupierConcession.concessionAmount,
        eligible: false,
        reason: 'Off the Plan Exemption takes priority',
        details: ownerOccupierConcession.details
      });
    }
  } else if (isHBCSEligible && hbcsConcessionAmount > 0) {
    // HBCS takes priority over Pensioner and Owner Occupier
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
    
    // Add Pensioner to ineligible if it was also eligible
    if (pensionerConcession.eligible) {
      ineligibleConcessions.push({
        type: 'Pensioner Concession',
        amount: pensionerConcession.concessionAmount,
        eligible: false,
        reason: 'Home Buyer Concession takes priority',
        details: pensionerConcession.details
      });
    }
    
    // Add Owner Occupier to ineligible if it was also eligible
    if (ownerOccupierConcession.eligible) {
      ineligibleConcessions.push({
        type: 'Owner Occupier Concession',
        amount: ownerOccupierConcession.concessionAmount,
        eligible: false,
        reason: 'Home Buyer Concession takes priority',
        details: ownerOccupierConcession.details
      });
    }
  } else if (pensionerConcession.eligible) {
    // Pensioner takes priority over Owner Occupier
    concessions.push({
      type: 'Pensioner Concession',
      amount: pensionerConcession.concessionAmount,
      eligible: true,
      reason: pensionerConcession.reason,
      details: pensionerConcession.details
    });
    
    // Add Owner Occupier to ineligible if it was also eligible
    if (ownerOccupierConcession.eligible) {
      ineligibleConcessions.push({
        type: 'Owner Occupier Concession',
        amount: ownerOccupierConcession.concessionAmount,
        eligible: false,
        reason: 'Pensioner Concession takes priority',
        details: ownerOccupierConcession.details
      });
    }
  } else if (ownerOccupierConcession.eligible) {
    // Only Owner Occupier is eligible
    concessions.push({
      type: 'Owner Occupier Concession',
      amount: ownerOccupierConcession.concessionAmount,
      eligible: true,
      reason: ownerOccupierConcession.reason,
      details: ownerOccupierConcession.details
    });
  }
  
  // Always add ineligible concessions
  if (!offThePlanExemption.eligible) {
    ineligibleConcessions.push({
      type: 'Off the Plan Exemption',
      amount: 0,
      eligible: false,
      reason: offThePlanExemption.reason,
      details: offThePlanExemption.details
    });
  }
  
  if (!isHBCSEligible && buyerData.income && buyerData.dependants) {
    // User provided income/dependants but not eligible for HBCS
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
  
  if (!pensionerConcession.eligible && buyerData.hasPensionCard) {
    // User has pensioner card but not eligible for pensioner concession
    ineligibleConcessions.push({
      type: 'Pensioner Concession',
      amount: 0,
      eligible: false,
      reason: pensionerConcession.reason,
      details: pensionerConcession.details
    });
  }
  
  if (!ownerOccupierConcession.eligible && buyerData.buyerType === 'owner-occupier' && buyerData.isPPR === 'yes') {
    // User is owner-occupier PPR but not eligible for owner occupier concession
    ineligibleConcessions.push({
      type: 'Owner Occupier Concession',
      amount: 0,
      eligible: false,
      reason: ownerOccupierConcession.reason,
      details: ownerOccupierConcession.details
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
    allConcessions: allConcessions,
    grants: [], // No grants implemented yet for ACT
    foreignDuty: { amount: 0, applicable: false }, // Foreign duty not implemented yet for ACT
    netStateDuty: netStateDuty,
    totalUpfrontCosts: totalUpfrontCosts
  };
};

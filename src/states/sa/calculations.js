import { SA_STAMP_DUTY_RATES, SA_FIRST_HOME_OWNERS_GRANT, SA_FHOG_PROPERTY_CAP, SA_FOREIGN_BUYER_RATE } from './constants.js';

export const calculateSAStampDuty = (propertyPrice, selectedState) => {
  // Only calculate if SA is selected
  if (selectedState !== 'SA') {
    return 0;
  }

  // Convert propertyPrice to number if it's a string
  const price = parseInt(propertyPrice) || 0;
  
  if (price <= 0) {
    return 0;
  }

  // Find the applicable rate bracket
  let applicableRate = null;
  for (const bracket of SA_STAMP_DUTY_RATES) {
    if (price > bracket.min && price <= bracket.max) {
      applicableRate = bracket;
      break;
    }
  }

  if (!applicableRate) {
    return 0;
  }

  // Calculate stamp duty: (price - min) * rate + fixed fee
  const stampDuty = (price - applicableRate.min) * applicableRate.rate + applicableRate.fixedFee;

  return stampDuty;
};

/**
 * Calculate SA First Home Owners Grant
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'SA')
 * @returns {Object} - Grant result with amount and details
 */
export const calculateSAFirstHomeOwnersGrant = (buyerData, propertyData, selectedState) => {
  // Only calculate if SA is selected
  if (selectedState !== 'SA') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Not SA'
    };
  }

  const {
    buyerType,
    isPPR,
    isAustralianResident,
    isFirstHomeBuyer
  } = buyerData;

  const {
    propertyPrice,
    propertyType
  } = propertyData;

  // Convert propertyPrice to number if it's a string
  const price = parseInt(propertyPrice) || 0;

  // Check basic eligibility criteria
  if (buyerType !== 'owner-occupier') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Must be owner-occupier, not investor'
    };
  }

  if (isPPR !== 'yes') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Must be principal place of residence (PPR)'
    };
  }

  if (isAustralianResident !== 'yes') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Must be Australian resident, not foreign buyer'
    };
  }

  if (isFirstHomeBuyer !== 'yes') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Must be first home buyer'
    };
  }

  if (price <= 0) {
    return {
      eligible: false,
      amount: 0,
      reason: 'Invalid property price'
    };
  }

  // Check property price cap
  if (price > SA_FHOG_PROPERTY_CAP) {
    return {
      eligible: false,
      amount: 0,
      reason: `SA First Home Owners Grant only applies to properties valued at $${SA_FHOG_PROPERTY_CAP.toLocaleString()} or below. Your property is valued at $${price.toLocaleString()}`
    };
  }

  // Check property type - SA FHOG applies to new, off-the-plan, and house-and-land properties
  if (propertyType !== 'new' && propertyType !== 'off-the-plan' && propertyType !== 'house-and-land') {
    return {
      eligible: false,
      amount: 0,
      reason: 'SA First Home Owners Grant only applies to new, off-the-plan, and house-and-land properties'
    };
  }

  // All criteria met - eligible for full grant
  return {
    eligible: true,
    amount: SA_FIRST_HOME_OWNERS_GRANT,
    reason: 'Eligible for SA First Home Owners Grant',
    details: {
      propertyPrice: price,
      grantAmount: SA_FIRST_HOME_OWNERS_GRANT,
      propertyType: propertyType,
      priceCap: SA_FHOG_PROPERTY_CAP,
      note: 'Grant available for new, off-the-plan, and house-and-land properties'
    }
  };
};

/**
 * Calculate SA First Home Buyer Concession
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'SA')
 * @param {number} stampDutyAmount - Calculated stamp duty amount
 * @returns {Object} - Concession result with amount and details
 */
export const calculateSAFirstHomeBuyerConcession = (buyerData, propertyData, selectedState, stampDutyAmount) => {
  // Only calculate if SA is selected
  if (selectedState !== 'SA') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Not SA'
    };
  }

  const {
    buyerType,
    isPPR,
    isAustralianResident,
    isFirstHomeBuyer
  } = buyerData;

  const {
    propertyPrice,
    propertyType
  } = propertyData;

  // Convert propertyPrice to number if it's a string
  const price = parseInt(propertyPrice) || 0;

  // Check basic eligibility criteria
  if (buyerType !== 'owner-occupier') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Must be owner-occupier, not investor'
    };
  }

  if (isPPR !== 'yes') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Must be principal place of residence (PPR)'
    };
  }

  if (isAustralianResident !== 'yes') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Must be Australian resident, not foreign buyer'
    };
  }

  if (isFirstHomeBuyer !== 'yes') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Must be first home buyer'
    };
  }

  if (price <= 0) {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Invalid property price'
    };
  }

  // Check property type - SA First Home Buyer Concession applies to off-the-plan and house-and-land
  if (propertyType !== 'off-the-plan' && propertyType !== 'house-and-land') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'SA First Home Buyer Concession only applies to off-the-plan and house-and-land properties'
    };
  }

  // SA First Home Buyer Concession provides full stamp duty exemption ("No Stamp")
  const concessionAmount = stampDutyAmount;

  return {
    eligible: true,
    concessionAmount: concessionAmount,
    reason: 'Eligible for SA First Home Buyer Concession - Full exemption',
    details: {
      propertyPrice: price,
      baseStampDuty: stampDutyAmount,
      concessionAmount: concessionAmount,
      netStampDuty: 0,
      propertyType: propertyType,
      calculationMethod: 'No Stamp - Full exemption',
      exemptionType: 'Full stamp duty exemption for first home buyers on eligible property types'
    }
  };
};

/**
 * Calculate SA Foreign Buyer Duty
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'SA')
 * @returns {Object} - Foreign buyer duty result with amount and details
 */
export const calculateSAForeignBuyerDuty = (buyerData, propertyData, selectedState) => {
  // Only calculate if SA is selected
  if (selectedState !== 'SA') {
    return {
      applicable: false,
      amount: 0,
      reason: 'Foreign buyer duty only applies in SA',
      details: {}
    };
  }

  const { isAustralianResident } = buyerData;
  const { propertyPrice } = propertyData;
  const price = parseInt(propertyPrice) || 0;

  // Check if foreign buyer (isAustralianResident === 'no' means foreign buyer)
  if (isAustralianResident !== 'no') {
    return {
      applicable: false,
      amount: 0,
      reason: 'Australian resident - no foreign buyer duty',
      details: {}
    };
  }

  // Check if property price is valid
  if (price <= 0) {
    return {
      applicable: false,
      amount: 0,
      reason: 'Property price must be greater than $0',
      details: {}
    };
  }

  // Calculate foreign buyer duty: property price × 7%
  const foreignBuyerDuty = price * SA_FOREIGN_BUYER_RATE;

  return {
    applicable: true,
    amount: foreignBuyerDuty,
    reason: 'Foreign buyer duty applies (7% of property price)',
    details: {
      propertyPrice: price,
      rate: SA_FOREIGN_BUYER_RATE,
      calculation: `${price.toLocaleString()} × ${(SA_FOREIGN_BUYER_RATE * 100)}% = $${foreignBuyerDuty.toLocaleString()}`
    }
  };
};

/**
 * Calculate all upfront costs for SA
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'SA')
 * @returns {Object} - Complete upfront costs breakdown
 */
export const calculateUpfrontCosts = (buyerData, propertyData, selectedState) => {
  // Only calculate if SA is selected
  if (selectedState !== 'SA') {
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
  const stampDutyAmount = calculateSAStampDuty(price, selectedState);
  
  // Calculate first home buyer concession
  const concessionResult = calculateSAFirstHomeBuyerConcession(buyerData, propertyData, selectedState, stampDutyAmount);
  
  // Calculate first home owners grant
  const grantResult = calculateSAFirstHomeOwnersGrant(buyerData, propertyData, selectedState);
  
  // Calculate foreign buyer duty
  const foreignDutyResult = calculateSAForeignBuyerDuty(buyerData, propertyData, selectedState);
  
  // Calculate net state duty (stamp duty plus foreign duty minus concessions)
  const netStateDuty = stampDutyAmount + (foreignDutyResult.applicable ? foreignDutyResult.amount : 0) - (concessionResult.eligible ? concessionResult.concessionAmount : 0);
  
  // Calculate total upfront costs (including property price if no loan needed, minus grants)
  const propertyPrice = (buyerData.needsLoan === 'no') ? price : 0;
  const totalUpfrontCosts = netStateDuty + propertyPrice - (grantResult.eligible ? grantResult.amount : 0);
  
  return {
    stampDuty: { amount: stampDutyAmount, label: "Stamp Duty" },
    concessions: concessionResult.eligible ? [{
      type: 'First Home Buyer',
      amount: concessionResult.concessionAmount,
      eligible: true,
      reason: concessionResult.reason,
      showBothConcessions: false,
      firstHomeBuyerConcession: concessionResult
    }] : [],
    ineligibleConcessions: !concessionResult.eligible ? [{
      type: 'First Home Buyer',
      amount: 0,
      eligible: false,
      reason: concessionResult.reason,
      showBothConcessions: false,
      firstHomeBuyerConcession: concessionResult
    }] : [],
    grants: grantResult.eligible ? [grantResult] : [],
    foreignDuty: foreignDutyResult,
    netStateDuty: netStateDuty,
    totalUpfrontCosts: totalUpfrontCosts,
    // Include all concession and grant data for display purposes
    allConcessions: {
      firstHomeBuyer: concessionResult
    },
    allGrants: {
      firstHomeOwners: grantResult
    }
  };
};

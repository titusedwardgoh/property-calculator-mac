import { TAS_STAMP_DUTY_RATES, TAS_FIRST_HOME_OWNERS_GRANT, TAS_FHOG_PROPERTY_CAP, TAS_FIRST_HOME_DUTY_RELIEF, TAS_FOREIGN_BUYER_RATE } from './constants.js';

export const calculateTASStampDuty = (propertyPrice, selectedState) => {
  // Only calculate if TAS is selected
  if (selectedState !== 'TAS') {
    return 0;
  }

  // Convert propertyPrice to number if it's a string
  const price = parseInt(propertyPrice) || 0;
  
  if (price <= 0) {
    return 0;
  }

  // Find the applicable rate bracket
  let applicableRate = null;
  for (const bracket of TAS_STAMP_DUTY_RATES) {
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
 * Calculate TAS First Home Owners Grant eligibility and amount
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'TAS')
 * @returns {Object} - Eligibility result with amount and details
 */
export const calculateTASFirstHomeOwnersGrant = (buyerData, propertyData, selectedState) => {
  // Only calculate if TAS is selected
  if (selectedState !== 'TAS') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Not TAS'
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

  // Check property type eligibility - new, off-the-plan and house-and-land are eligible
  if (propertyType !== 'new' && propertyType !== 'off-the-plan' && propertyType !== 'house-and-land') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Only new, off-the-plan and house-and-land packages are eligible'
    };
  }

  // Check property price cap (effectively no cap based on criteria)
  if (price > TAS_FHOG_PROPERTY_CAP) {
    return {
      eligible: false,
      amount: 0,
      reason: `Property price $${price.toLocaleString()} exceeds cap of $${TAS_FHOG_PROPERTY_CAP.toLocaleString()}`
    };
  }

  // All criteria met - eligible for grant
  return {
    eligible: true,
    amount: TAS_FIRST_HOME_OWNERS_GRANT, // $10,000
    reason: 'Eligible for TAS First Home Owners Grant',
    details: {
      propertyType,
      propertyPrice: price,
      grantAmount: TAS_FIRST_HOME_OWNERS_GRANT
    }
  };
};

/**
 * Calculate TAS First Home Duty Relief (stamp duty concession)
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'TAS')
 * @param {number} stampDutyAmount - Full stamp duty amount payable
 * @returns {Object} - Concession result with amount and details
 */
export const calculateTASFirstHomeDutyRelief = (buyerData, propertyData, selectedState, stampDutyAmount) => {
  // Only calculate if TAS is selected
  if (selectedState !== 'TAS') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Not TAS'
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

  // Check property type eligibility - only existing properties are eligible
  if (propertyType !== 'existing') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Only existing properties are eligible for First Home Duty Relief'
    };
  }

  // Check property price cap
  if (price > TAS_FIRST_HOME_DUTY_RELIEF.PRICE_CAP) {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: `Property price $${price.toLocaleString()} exceeds cap of $${TAS_FIRST_HOME_DUTY_RELIEF.PRICE_CAP.toLocaleString()}`
    };
  }

  // All criteria met - eligible for full stamp duty exemption
  return {
    eligible: true,
    concessionAmount: stampDutyAmount, // Full stamp duty exemption
    reason: 'Eligible for TAS First Home Duty Relief (full stamp duty exemption)',
    details: {
      propertyType,
      propertyPrice: price,
      fullStampDuty: stampDutyAmount,
      concessionalStampDuty: 0, // No stamp duty payable
      concessionAmount: stampDutyAmount,
      priceCap: TAS_FIRST_HOME_DUTY_RELIEF.PRICE_CAP
    }
  };
};

/**
 * Calculate TAS Foreign Buyer Duty
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'TAS')
 * @returns {Object} - Foreign buyer duty result with amount and details
 */
export const calculateTASForeignBuyerDuty = (buyerData, propertyData, selectedState) => {
  // Only calculate if TAS is selected
  if (selectedState !== 'TAS') {
    return {
      applicable: false,
      amount: 0,
      reason: 'Not TAS'
    };
  }

  const {
    isAustralianResident
  } = buyerData;

  const {
    propertyPrice
  } = propertyData;

  // Convert propertyPrice to number if it's a string
  const price = parseInt(propertyPrice) || 0;

  // Check if foreign buyer duty applies
  if (isAustralianResident !== 'no') {
    return {
      applicable: false,
      amount: 0,
      reason: 'Australian resident - no foreign buyer duty'
    };
  }

  if (price <= 0) {
    return {
      applicable: false,
      amount: 0,
      reason: 'Invalid property price'
    };
  }

  // Calculate foreign buyer duty: property price × 8%
  const foreignBuyerDuty = price * TAS_FOREIGN_BUYER_RATE;

  return {
    applicable: true,
    amount: foreignBuyerDuty,
    reason: 'Foreign buyer duty applies (8% of property price)',
    details: {
      propertyPrice: price,
      rate: TAS_FOREIGN_BUYER_RATE,
      calculation: `${price.toLocaleString()} × ${(TAS_FOREIGN_BUYER_RATE * 100)}% = $${foreignBuyerDuty.toLocaleString()}`
    }
  };
};

/**
 * Calculate all upfront costs for TAS
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'TAS')
 * @returns {Object} - Complete upfront costs breakdown
 */
export const calculateUpfrontCosts = (buyerData, propertyData, selectedState) => {
  // Only calculate if TAS is selected
  if (selectedState !== 'TAS') {
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
  const stampDutyAmount = calculateTASStampDuty(price, selectedState);
  
  // Calculate first home duty relief concession
  const concessionResult = calculateTASFirstHomeDutyRelief(buyerData, propertyData, selectedState, stampDutyAmount);
  
  // Calculate foreign buyer duty
  const foreignDutyResult = calculateTASForeignBuyerDuty(buyerData, propertyData, selectedState);
  
  // Calculate first home owners grant
  const grantResult = calculateTASFirstHomeOwnersGrant(buyerData, propertyData, selectedState);
  
  // Calculate net state duty
  const netStateDuty = stampDutyAmount - (concessionResult.eligible ? concessionResult.concessionAmount : 0) + (foreignDutyResult.applicable ? foreignDutyResult.amount : 0);
  
  // Calculate total upfront costs (including property price if no loan needed)
  const propertyPrice = (buyerData.needsLoan === 'no') ? price : 0;
  const totalUpfrontCosts = netStateDuty + propertyPrice - (grantResult.eligible ? grantResult.amount : 0);
  
  return {
    stampDuty: { amount: stampDutyAmount, label: "Stamp Duty" },
    concessions: concessionResult.eligible ? [{
      type: 'First Home Duty Relief',
      amount: concessionResult.concessionAmount,
      eligible: concessionResult.eligible,
      reason: concessionResult.reason,
      showBothConcessions: false
    }] : [],
    grants: grantResult.eligible ? [grantResult] : [],
    foreignDuty: { 
      amount: foreignDutyResult.applicable ? foreignDutyResult.amount : 0, 
      applicable: foreignDutyResult.applicable 
    },
    netStateDuty: netStateDuty,
    totalUpfrontCosts: totalUpfrontCosts
  };
};

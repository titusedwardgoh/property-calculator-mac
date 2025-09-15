import { NT_STAMP_DUTY_FORMULA, NT_FOREIGN_BUYER_RATE, NT_STAMP_DUTY_RATES, NT_HOMEGROWN_TERRITORY_GRANT, NT_HOMEGROWN_GRANT_PROPERTY_CAP, NT_FRESHSTART_GRANT, NT_HOUSE_AND_LAND_CONCESSION } from './constants.js';

/**
 * Calculate NT stamp duty using the formula: (0.06571441 x V²) + 15V for properties up to $525,000
 * For properties over $525,000, standard percentage rates apply
 * where V = 1/1000 of the property value
 * @param {number} propertyPrice - The property price in dollars
 * @param {string} selectedState - The selected state (must be 'NT')
 * @returns {number} - The calculated stamp duty amount
 */
export const calculateNTStampDuty = (propertyPrice, selectedState) => {
  // Only calculate if NT is selected
  if (selectedState !== 'NT') {
    return 0;
  }

  // Convert propertyPrice to number if it's a string
  const price = parseInt(propertyPrice) || 0;
  
  if (price <= 0) {
    return 0;
  }

  // Find the applicable rate bracket
  let applicableRate = null;
  for (const bracket of NT_STAMP_DUTY_RATES) {
    if (price > bracket.min && price <= bracket.max) {
      applicableRate = bracket;
      break;
    }
  }

  if (!applicableRate) {
    return 0;
  }

  let stampDuty = 0;

  if (applicableRate.rate === 'formula') {
    // Use formula for properties up to $525,000
    // Calculate V (1/1000 of property value)
    const V = price / NT_STAMP_DUTY_FORMULA.V_DIVISOR;
    
    // Apply the formula: (0.06571441 x V²) + 15V
    stampDuty = (NT_STAMP_DUTY_FORMULA.COEFFICIENT * V * V) + (NT_STAMP_DUTY_FORMULA.LINEAR_TERM * V);
  } else {
    // Use percentage rate for properties over $525,000
    stampDuty = price * applicableRate.rate + (applicableRate.fixedFee || 0);
  }
  
  return Math.round(stampDuty * 100) / 100; // Round to 2 decimal places
};


/**
 * Calculate NT foreign buyer additional duty
 * @param {number} propertyPrice - The property price in dollars
 * @param {boolean} isForeignBuyer - Whether the buyer is a foreign buyer
 * @returns {number} - The additional duty amount
 */
export const calculateNTForeignBuyerDuty = (propertyPrice, isForeignBuyer) => {
  if (!isForeignBuyer) {
    return 0;
  }
  
  const price = parseInt(propertyPrice) || 0;
  return price * NT_FOREIGN_BUYER_RATE;
};

/**
 * Calculate total NT stamp duty including foreign buyer duty
 * @param {number} propertyPrice - The property price in dollars
 * @param {string} selectedState - The selected state
 * @param {boolean} isForeignBuyer - Whether the buyer is a foreign buyer
 * @returns {object} - Object containing breakdown of stamp duty calculation
 */
export const calculateNTTotalStampDuty = (propertyPrice, selectedState, isForeignBuyer = false) => {
  const baseStampDuty = calculateNTStampDuty(propertyPrice, selectedState);
  const foreignBuyerDuty = calculateNTForeignBuyerDuty(propertyPrice, isForeignBuyer);
  
  const totalStampDuty = baseStampDuty + foreignBuyerDuty;
  
  return {
    baseStampDuty,
    foreignBuyerDuty,
    totalStampDuty: Math.max(0, totalStampDuty),
    breakdown: {
      formula: `(${NT_STAMP_DUTY_FORMULA.COEFFICIENT} × V²) + (${NT_STAMP_DUTY_FORMULA.LINEAR_TERM} × V)`,
      V: (parseInt(propertyPrice) || 0) / NT_STAMP_DUTY_FORMULA.V_DIVISOR,
      explanation: `V = ${propertyPrice || 0} ÷ ${NT_STAMP_DUTY_FORMULA.V_DIVISOR} = ${((parseInt(propertyPrice) || 0) / NT_STAMP_DUTY_FORMULA.V_DIVISOR).toFixed(3)}`
    }
  };
};

/**
 * Calculate NT HomeGrown Territory Grant eligibility and amount
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'NT')
 * @returns {Object} - Eligibility result with amount and details
 */
export const calculateNTHomeGrownTerritoryGrant = (buyerData, propertyData, selectedState) => {
  // Only calculate if NT is selected
  if (selectedState !== 'NT') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Not NT',
      grantType: 'HomeGrown'
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
      reason: 'Must be owner-occupier, not investor',
      grantType: 'HomeGrown'
    };
  }

  if (isPPR !== 'yes') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Must be principal place of residence (PPR)',
      grantType: 'HomeGrown'
    };
  }

  if (isAustralianResident !== 'yes') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Must be Australian resident, not foreign buyer',
      grantType: 'HomeGrown'
    };
  }

  if (isFirstHomeBuyer !== 'yes') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Must be first home buyer',
      grantType: 'HomeGrown'
    };
  }

  // Check property type eligibility and determine grant amount
  let grantAmount = 0;
  let reason = '';

  if (propertyType === 'vacant-land-only') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Vacant land is not eligible for HomeGrown Territory Grant'
    };
  } else if (propertyType === 'new') {
    grantAmount = NT_HOMEGROWN_TERRITORY_GRANT.NEW;
    reason = 'Eligible for NT HomeGrown Territory Grant (New Property)';
  } else if (propertyType === 'off-the-plan') {
    grantAmount = NT_HOMEGROWN_TERRITORY_GRANT.OFF_THE_PLAN;
    reason = 'Eligible for NT HomeGrown Territory Grant (Off-The-Plan Property)';
  } else if (propertyType === 'house-and-land') {
    grantAmount = NT_HOMEGROWN_TERRITORY_GRANT.HOUSE_AND_LAND;
    reason = 'Eligible for NT HomeGrown Territory Grant (House and Land Package)';
  } else if (propertyType === 'existing') {
    grantAmount = NT_HOMEGROWN_TERRITORY_GRANT.EXISTING;
    reason = 'Eligible for NT HomeGrown Territory Grant (Existing Property)';
  } else {
    return {
      eligible: false,
      amount: 0,
      reason: 'Property type not eligible for HomeGrown Territory Grant'
    };
  }

  // Check property price cap (effectively no cap based on criteria)
  if (price > NT_HOMEGROWN_GRANT_PROPERTY_CAP) {
    return {
      eligible: false,
      amount: 0,
      reason: `Property price $${price.toLocaleString()} exceeds cap of $${NT_HOMEGROWN_GRANT_PROPERTY_CAP.toLocaleString()}`
    };
  }

  // All criteria met - eligible for grant
  return {
    eligible: true,
    amount: grantAmount,
    reason: reason,
    grantType: 'HomeGrown',
    details: {
      propertyType,
      propertyPrice: price,
      grantAmount: grantAmount
    }
  };
};

/**
 * Calculate NT FreshStart Grant eligibility and amount
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'NT')
 * @returns {Object} - Eligibility result with amount and details
 */
export const calculateNTFreshStartGrant = (buyerData, propertyData, selectedState) => {
  // Only calculate if NT is selected
  if (selectedState !== 'NT') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Not NT',
      grantType: 'FreshStart'
    };
  }

  const {
    buyerType,
    isPPR,
    isAustralianResident
  } = buyerData;

  const {
    propertyType
  } = propertyData;

  // Check basic eligibility criteria
  if (buyerType !== 'owner-occupier') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Must be owner-occupier, not investor',
      grantType: 'FreshStart'
    };
  }

  if (isPPR !== 'yes') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Must be principal place of residence (PPR)',
      grantType: 'FreshStart'
    };
  }

  if (isAustralianResident !== 'yes') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Foreign buyers are not eligible for FreshStart Grant',
      grantType: 'FreshStart'
    };
  }

  // Check property type eligibility
  if (!NT_FRESHSTART_GRANT.ELIGIBLE_PROPERTY_TYPES.includes(propertyType)) {
    return {
      eligible: false,
      amount: 0,
      reason: 'FreshStart Grant only applies to off-the-plan and house-and-land properties',
      grantType: 'FreshStart'
    };
  }

  // All criteria met - eligible for FreshStart Grant
  return {
    eligible: true,
    amount: NT_FRESHSTART_GRANT.AMOUNT,
    reason: 'Eligible for NT FreshStart Grant',
    grantType: 'FreshStart',
    details: {
      propertyType,
      grantAmount: NT_FRESHSTART_GRANT.AMOUNT
    }
  };
};

/**
 * Calculate NT House and Land Concession eligibility and amount
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'NT')
 * @param {number} stampDutyAmount - The base stamp duty amount
 * @returns {Object} - Eligibility result with amount and details
 */
export const calculateNTHouseAndLandConcession = (buyerData, propertyData, selectedState, stampDutyAmount) => {
  // Only calculate if NT is selected
  if (selectedState !== 'NT') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Not NT'
    };
  }

  const {
    buyerType,
    isPPR,
    isAustralianResident
  } = buyerData;

  const {
    propertyType
  } = propertyData;

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
      reason: 'Foreign buyers are not eligible for House and Land Concession'
    };
  }

  // Check property type eligibility
  if (!NT_HOUSE_AND_LAND_CONCESSION.ELIGIBLE_PROPERTY_TYPES.includes(propertyType)) {
    return {
      eligible: false,
      amount: 0,
      reason: 'House and Land Concession only applies to house-and-land packages'
    };
  }

  // All criteria met - eligible for full stamp duty concession
  return {
    eligible: true,
    amount: stampDutyAmount, // Full stamp duty relief
    reason: 'Eligible for NT House and Land Concession - Full stamp duty relief',
    details: {
      propertyType,
      concessionAmount: stampDutyAmount
    }
  };
};

/**
 * Calculate all upfront costs for NT
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'NT')
 * @returns {Object} - Complete upfront costs breakdown
 */
export const calculateUpfrontCosts = (buyerData, propertyData, selectedState) => {
  // Only calculate if NT is selected
  if (selectedState !== 'NT') {
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
  const stampDutyAmount = calculateNTStampDuty(price, selectedState);
  
  
  // Calculate house and land concession
  const houseAndLandConcessionResult = calculateNTHouseAndLandConcession(buyerData, propertyData, selectedState, stampDutyAmount);
  
  // Calculate foreign buyer duty
  const foreignDutyAmount = calculateNTForeignBuyerDuty(
    price, 
    buyerData.isAustralianResident === 'no'
  );
  
  // Calculate both grants
  const homeGrownGrantResult = calculateNTHomeGrownTerritoryGrant(buyerData, propertyData, selectedState);
  const freshStartGrantResult = calculateNTFreshStartGrant(buyerData, propertyData, selectedState);
  
  // Compare grants and select the higher amount
  let selectedGrant = null;
  let ineligibleGrants = [];
  
  if (homeGrownGrantResult.eligible && freshStartGrantResult.eligible) {
    // Both eligible - compare amounts
    if (homeGrownGrantResult.amount >= freshStartGrantResult.amount) {
      selectedGrant = homeGrownGrantResult;
      ineligibleGrants.push({
        ...freshStartGrantResult,
        reason: 'Only one grant can be applied - HomeGrown Territory Grant is higher'
      });
    } else {
      selectedGrant = freshStartGrantResult;
      ineligibleGrants.push({
        ...homeGrownGrantResult,
        reason: 'Only one grant can be applied - FreshStart Grant is higher'
      });
    }
  } else if (homeGrownGrantResult.eligible) {
    selectedGrant = homeGrownGrantResult;
    // Add FreshStart as ineligible if it's not eligible
    if (!freshStartGrantResult.eligible) {
      ineligibleGrants.push(freshStartGrantResult);
    }
  } else if (freshStartGrantResult.eligible) {
    selectedGrant = freshStartGrantResult;
    // Add HomeGrown as ineligible if it's not eligible
    if (!homeGrownGrantResult.eligible) {
      ineligibleGrants.push(homeGrownGrantResult);
    }
  } else {
    // Neither eligible - add both to ineligible
    ineligibleGrants.push(homeGrownGrantResult);
    ineligibleGrants.push(freshStartGrantResult);
  }
  
  // Calculate net state duty (including house and land concession)
  const totalConcessions = houseAndLandConcessionResult.eligible ? houseAndLandConcessionResult.amount : 0;
  const netStateDuty = stampDutyAmount - totalConcessions + foreignDutyAmount;
  
  // Calculate total upfront costs (including property price if no loan needed)
  const propertyPrice = (buyerData.needsLoan === 'no') ? price : 0;
  const totalUpfrontCosts = netStateDuty + propertyPrice - (selectedGrant ? selectedGrant.amount : 0);
  
  // Prepare grants array - only include eligible grants
  const grants = selectedGrant ? [selectedGrant] : [];
  
  // Prepare concessions array
  const concessions = [];
  if (houseAndLandConcessionResult.eligible) {
    concessions.push({
      type: 'House and Land',
      amount: houseAndLandConcessionResult.amount,
      eligible: true,
      reason: houseAndLandConcessionResult.reason,
      showBothConcessions: false
    });
  }

  // Prepare ineligible concessions array
  const ineligibleConcessions = [];
  if (!houseAndLandConcessionResult.eligible) {
    ineligibleConcessions.push({
      type: 'House and Land',
      amount: 0,
      eligible: false,
      reason: houseAndLandConcessionResult.reason,
      showBothConcessions: false
    });
  }

  return {
    stampDuty: { amount: stampDutyAmount, label: "Stamp Duty" },
    concessions: concessions,
    grants: grants,
    ineligibleGrants: ineligibleGrants,
    ineligibleConcessions: ineligibleConcessions,
    foreignDuty: { 
      amount: foreignDutyAmount, 
      applicable: buyerData.isAustralianResident === 'no' 
    },
    netStateDuty: netStateDuty,
    totalUpfrontCosts: totalUpfrontCosts
  };
};

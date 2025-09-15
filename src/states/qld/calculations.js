import { QLD_STAMP_DUTY_RATES, QLD_FIRST_HOME_OWNERS_GRANT, QLD_FHOG_PROPERTY_CAP, QLD_FIRST_HOME_OWNERS_GRANT_CONCESSION, QLD_HOME_CONCESSION_RATES, QLD_HOME_CONCESSION, QLD_FIRST_HOME_CONCESSION_BRACKETS, QLD_FIRST_HOME_CONCESSION, QLD_FIRST_HOME_NEW_CONCESSION, QLD_FIRST_HOME_VACANT_LAND_CONCESSION, QLD_FOREIGN_BUYER_RATE } from './constants.js';

export const calculateQLDStampDuty = (propertyPrice, selectedState) => {
  // Only calculate if QLD is selected
  if (selectedState !== 'QLD') {
    return 0;
  }

  // Convert propertyPrice to number if it's a string
  const price = parseInt(propertyPrice) || 0;
  
  if (price <= 0) {
    return 0;
  }

  // Find the applicable rate bracket
  let applicableRate = null;
  for (const bracket of QLD_STAMP_DUTY_RATES) {
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
 * Calculate QLD First Home Owners Grant
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'QLD')
 * @returns {Object} - Grant result with amount and details
 */
export const calculateQLDFirstHomeOwnersGrant = (buyerData, propertyData, selectedState) => {
  // Only calculate if QLD is selected
  if (selectedState !== 'QLD') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Not QLD'
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

  // QLD FHOG only applies to new properties
  if (propertyType !== 'new') {
    return {
      eligible: false,
      amount: 0,
      reason: 'QLD First Home Owners Grant only applies to new properties'
    };
  }

  // Check property price cap
  if (price > QLD_FHOG_PROPERTY_CAP) {
    return {
      eligible: false,
      amount: 0,
      reason: `QLD First Home Owners Grant only applies to properties valued at $${QLD_FHOG_PROPERTY_CAP.toLocaleString()} or below. Your property is valued at $${price.toLocaleString()}`
    };
  }

  // All criteria met - eligible for full grant
  return {
    eligible: true,
    amount: QLD_FIRST_HOME_OWNERS_GRANT,
    reason: 'Eligible for QLD First Home Owners Grant',
    details: {
      propertyPrice: price,
      grantAmount: QLD_FIRST_HOME_OWNERS_GRANT,
      propertyType: propertyType,
      priceCap: QLD_FHOG_PROPERTY_CAP,
      note: 'Grant available for new properties up to $750,000'
    }
  };
};

/**
 * Calculate QLD Home Concession
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'QLD')
 * @param {number} stampDutyAmount - Calculated stamp duty amount
 * @returns {Object} - Home concession result with amount and details
 */
export const calculateQLDHomeConcession = (buyerData, propertyData, selectedState, stampDutyAmount) => {
  // Only calculate if QLD is selected
  if (selectedState !== 'QLD') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Not QLD'
    };
  }

  const {
    buyerType,
    isPPR
  } = buyerData;

  const {
    propertyPrice
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

  if (price <= 0) {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Invalid property price'
    };
  }

  // Calculate stamp duty using home concession rates
  let homeConcessionStampDuty = 0;

  // Find the applicable rate bracket for home concession
  for (const bracket of QLD_HOME_CONCESSION_RATES) {
    if (price > bracket.min && price <= bracket.max) {
      homeConcessionStampDuty = (price - bracket.min) * bracket.rate + bracket.fixedFee;
      break;
    }
  }

  // Calculate concession amount (difference between base stamp duty and home concession stamp duty)
  const concessionAmount = Math.max(0, stampDutyAmount - homeConcessionStampDuty);

  return {
    eligible: true,
    concessionAmount: concessionAmount,
    reason: 'Eligible for QLD Home Concession',
    details: {
      propertyPrice: price,
      baseStampDuty: stampDutyAmount,
      homeConcessionStampDuty: homeConcessionStampDuty,
      concessionAmount: concessionAmount,
      netStampDuty: homeConcessionStampDuty
    }
  };
};

/**
 * Calculate QLD First Home Concession
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'QLD')
 * @param {number} stampDutyAmount - Calculated stamp duty amount
 * @returns {Object} - First home concession result with amount and details
 */
export const calculateQLDFirstHomeConcession = (buyerData, propertyData, selectedState, stampDutyAmount) => {
  // Only calculate if QLD is selected
  if (selectedState !== 'QLD') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Not QLD'
    };
  }

  const {
    buyerType,
    isPPR,
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

  if (isFirstHomeBuyer !== 'yes') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Must be first home buyer'
    };
  }

  // Check property type - only existing properties are eligible
  if (propertyType !== 'existing') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'First Home Concession only applies to existing properties'
    };
  }

  if (price <= 0) {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Invalid property price'
    };
  }

  // Check price cap
  if (price > QLD_FIRST_HOME_CONCESSION.PROPERTY_PRICE_CAP) {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: `Property price $${price.toLocaleString()} exceeds cap of $${QLD_FIRST_HOME_CONCESSION.PROPERTY_PRICE_CAP.toLocaleString()}`
    };
  }

  // Step 1: Calculate stamp duty using home concession rates
  let homeConcessionStampDuty = 0;
  for (const bracket of QLD_HOME_CONCESSION_RATES) {
    if (price > bracket.min && price <= bracket.max) {
      homeConcessionStampDuty = (price - bracket.min) * bracket.rate + bracket.fixedFee;
      break;
    }
  }

  // Step 2: Find the first home concession amount from brackets
  let firstHomeConcessionAmount = 0;
  for (const bracket of QLD_FIRST_HOME_CONCESSION_BRACKETS) {
    if (price >= bracket.min && price <= bracket.max) {
      firstHomeConcessionAmount = bracket.concession;
      break;
    }
  }

  // Step 3: Calculate the additional first home concession
  // This is the minimum of:
  // 1. The first home concession amount from brackets
  // 2. The home concession stamp duty (to avoid negative duty)
  const additionalFirstHomeConcession = Math.min(firstHomeConcessionAmount, homeConcessionStampDuty);

  // Step 4: Calculate total concession amount
  // This is the difference between base stamp duty and (home concession duty - additional first home concession)
  const netDutyAfterConcessions = Math.max(0, homeConcessionStampDuty - additionalFirstHomeConcession);
  const totalConcessionAmount = Math.max(0, stampDutyAmount - netDutyAfterConcessions);

  return {
    eligible: true,
    concessionAmount: totalConcessionAmount,
    reason: 'Eligible for QLD First Home Concession',
    details: {
      propertyPrice: price,
      baseStampDuty: stampDutyAmount,
      homeConcessionStampDuty: homeConcessionStampDuty,
      firstHomeConcessionAmount: firstHomeConcessionAmount,
      additionalFirstHomeConcession: additionalFirstHomeConcession,
      netDutyAfterConcessions: netDutyAfterConcessions,
      totalConcessionAmount: totalConcessionAmount,
      propertyType: propertyType,
      calculationMethod: 'Home concession rate minus first home concession amount'
    }
  };
};

/**
 * Calculate QLD First Home (New Concession)
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'QLD')
 * @param {number} stampDutyAmount - Calculated stamp duty amount
 * @returns {Object} - First home (new) concession result with amount and details
 */
export const calculateQLDFirstHomeNewConcession = (buyerData, propertyData, selectedState, stampDutyAmount) => {
  // Only calculate if QLD is selected
  if (selectedState !== 'QLD') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Not QLD'
    };
  }

  const {
    buyerType,
    isPPR,
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

  if (isFirstHomeBuyer !== 'yes') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Must be first home buyer'
    };
  }

  // Check property type - only new and off-the-plan properties are eligible
  if (propertyType !== 'new' && propertyType !== 'off-the-plan') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'First Home (New Concession) only applies to new and off-the-plan properties'
    };
  }

  if (price <= 0) {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Invalid property price'
    };
  }

  // No price caps for this concession
  // Full stamp duty exemption - "No Stamp"
  const concessionAmount = stampDutyAmount;

  return {
    eligible: true,
    concessionAmount: concessionAmount,
    reason: 'Eligible for QLD First Home (New Concession) - Full exemption',
    details: {
      propertyPrice: price,
      baseStampDuty: stampDutyAmount,
      concessionAmount: concessionAmount,
      netStampDuty: 0,
      propertyType: propertyType,
      calculationMethod: 'No Stamp - Full exemption',
      exemptionType: 'Full stamp duty exemption for first home buyers on new properties'
    }
  };
};

/**
 * Calculate QLD First Home (Vac Land) Concession
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'QLD')
 * @param {number} stampDutyAmount - Base stamp duty amount
 * @returns {Object} - Concession eligibility and amount
 */
export const calculateQLDFirstHomeVacantLandConcession = (buyerData, propertyData, selectedState, stampDutyAmount) => {
  // Only calculate if QLD is selected
  if (selectedState !== 'QLD') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'First Home (Vac Land) Concession only applies in QLD',
      details: {}
    };
  }

  const { buyerType, isPPR, isFirstHomeBuyer, isForeignBuyer } = buyerData;
  const { propertyPrice, propertyType } = propertyData;
  const price = parseInt(propertyPrice) || 0;

  // Check basic eligibility
  if (price <= 0) {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Property price must be greater than $0',
      details: {}
    };
  }

  if (buyerType !== 'owner-occupier') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Must be owner-occupier to qualify for First Home (Vac Land) Concession',
      details: {}
    };
  }

  if (isPPR !== 'yes') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Property must be for Principal Place of Residence (PPR)',
      details: {}
    };
  }

  if (isFirstHomeBuyer !== 'yes') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Must be first home buyer',
      details: {}
    };
  }

  // Check property type - must be house-and-land
  if (propertyType !== 'house-and-land') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'First Home (Vac Land) Concession only applies to house-and-land properties',
      details: {}
    };
  }

  // Calculate concession amount (full exemption)
  const concessionAmount = stampDutyAmount;

  return {
    eligible: true,
    concessionAmount: concessionAmount,
    reason: 'Eligible for QLD First Home (Vac Land) Concession - Full exemption',
    details: {
      propertyPrice: price,
      propertyType: propertyType,
      isOwnerOccupier: buyerType === 'owner-occupier',
      isPPR: isPPR,
      isFirstHomeBuyer: isFirstHomeBuyer,
      isForeignBuyer: isForeignBuyer,
      baseStampDuty: stampDutyAmount,
      concessionAmount: concessionAmount,
      netStampDuty: 0,
      propertyType: propertyType,
      calculationMethod: 'No Stamp - Full exemption',
      exemptionType: 'Full stamp duty exemption for first home buyers on vacant land'
    }
  };
};

/**
 * Calculate QLD Foreign Buyer Duty
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'QLD')
 * @returns {Object} - Foreign buyer duty result with amount and details
 */
export const calculateQLDForeignBuyerDuty = (buyerData, propertyData, selectedState) => {
  // Only calculate if QLD is selected
  if (selectedState !== 'QLD') {
    return {
      applicable: false,
      amount: 0,
      reason: 'Foreign buyer duty only applies in QLD',
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

  // Calculate foreign buyer duty: property price × 8%
  const foreignBuyerDuty = price * QLD_FOREIGN_BUYER_RATE;

  return {
    applicable: true,
    amount: foreignBuyerDuty,
    reason: 'Foreign buyer duty applies (8% of property price)',
    details: {
      propertyPrice: price,
      rate: QLD_FOREIGN_BUYER_RATE,
      calculation: `${price.toLocaleString()} × ${(QLD_FOREIGN_BUYER_RATE * 100)}% = $${foreignBuyerDuty.toLocaleString()}`
    }
  };
};

/**
 * Calculate all upfront costs for QLD
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'QLD')
 * @returns {Object} - Complete upfront costs breakdown
 */
export const calculateUpfrontCosts = (buyerData, propertyData, selectedState) => {
  // Only calculate if QLD is selected
  if (selectedState !== 'QLD') {
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
  const stampDutyAmount = calculateQLDStampDuty(price, selectedState);
  
  // Calculate home concession
  const homeConcession = calculateQLDHomeConcession(buyerData, propertyData, selectedState, stampDutyAmount);
  
  // Calculate first home concession
  const firstHomeConcession = calculateQLDFirstHomeConcession(buyerData, propertyData, selectedState, stampDutyAmount);
  
  // Calculate first home (new) concession
  const firstHomeNewConcession = calculateQLDFirstHomeNewConcession(buyerData, propertyData, selectedState, stampDutyAmount);
  
  // Calculate first home (vacant land) concession
  const firstHomeVacantLandConcession = calculateQLDFirstHomeVacantLandConcession(buyerData, propertyData, selectedState, stampDutyAmount);
  
  // Calculate first home owners grant
  const grantResult = calculateQLDFirstHomeOwnersGrant(buyerData, propertyData, selectedState);
  
  // Calculate foreign buyer duty
  const foreignDutyResult = calculateQLDForeignBuyerDuty(buyerData, propertyData, selectedState);
  
  // Determine which concession to apply
  let appliedConcession = null;
  let ineligibleConcessions = [];
  
  // Priority: First Home (New Concession) > First Home (Vac Land) Concession > First Home Concession > Home Concession
  if (firstHomeNewConcession.eligible) {
    appliedConcession = {
      type: 'First Home (New) Concession',
      amount: firstHomeNewConcession.concessionAmount,
      eligible: true,
      reason: firstHomeNewConcession.reason,
      showBothConcessions: false,
      homeConcession: homeConcession,
      firstHomeConcession: firstHomeConcession,
      firstHomeNewConcession: firstHomeNewConcession
    };
    
    // Add other concessions to ineligible if first home (new) concession is applied
    if (firstHomeVacantLandConcession.eligible) {
      ineligibleConcessions.push({
        type: 'First Home (Vac Land) Concession',
        amount: firstHomeVacantLandConcession.concessionAmount,
        eligible: false,
        reason: 'First Home (New) Concession takes priority (no stamp duty)',
        showBothConcessions: false,
        homeConcession: homeConcession,
        firstHomeConcession: firstHomeConcession,
        firstHomeNewConcession: firstHomeNewConcession,
        firstHomeVacantLandConcession: firstHomeVacantLandConcession
      });
    }
    
    if (firstHomeConcession.eligible) {
      ineligibleConcessions.push({
        type: 'First Home Concession',
        amount: firstHomeConcession.concessionAmount,
        eligible: false,
        reason: 'First Home (New) Concession takes priority (no stamp duty)',
        showBothConcessions: false,
        homeConcession: homeConcession,
        firstHomeConcession: firstHomeConcession,
        firstHomeNewConcession: firstHomeNewConcession
      });
    }
    
    if (homeConcession.eligible) {
      ineligibleConcessions.push({
        type: 'Home Concession',
        amount: homeConcession.concessionAmount,
        eligible: false,
        reason: 'First Home (New Concession) takes priority',
        showBothConcessions: false,
        homeConcession: homeConcession,
        firstHomeConcession: firstHomeConcession,
        firstHomeNewConcession: firstHomeNewConcession
      });
    }
  } else if (firstHomeVacantLandConcession.eligible) {
    appliedConcession = {
      type: 'First Home (Vac Land) Concession',
      amount: firstHomeVacantLandConcession.concessionAmount,
      eligible: true,
      reason: firstHomeVacantLandConcession.reason,
      showBothConcessions: false,
      homeConcession: homeConcession,
      firstHomeConcession: firstHomeConcession,
      firstHomeNewConcession: firstHomeNewConcession,
      firstHomeVacantLandConcession: firstHomeVacantLandConcession
    };
    
    // Add other concessions to ineligible if first home (vac land) concession is applied
    if (firstHomeConcession.eligible) {
      ineligibleConcessions.push({
        type: 'First Home Concession',
        amount: firstHomeConcession.concessionAmount,
        eligible: false,
        reason: 'First Home (Vac Land) Concession takes priority (no stamp duty)',
        showBothConcessions: false,
        homeConcession: homeConcession,
        firstHomeConcession: firstHomeConcession,
        firstHomeNewConcession: firstHomeNewConcession,
        firstHomeVacantLandConcession: firstHomeVacantLandConcession
      });
    }
    
    if (homeConcession.eligible) {
      ineligibleConcessions.push({
        type: 'Home Concession',
        amount: homeConcession.concessionAmount,
        eligible: false,
        reason: 'First Home (Vac Land) Concession takes priority',
        showBothConcessions: false,
        homeConcession: homeConcession,
        firstHomeConcession: firstHomeConcession,
        firstHomeNewConcession: firstHomeNewConcession,
        firstHomeVacantLandConcession: firstHomeVacantLandConcession
      });
    }
  } else if (firstHomeConcession.eligible) {
    appliedConcession = {
      type: 'First Home Concession',
      amount: firstHomeConcession.concessionAmount,
      eligible: true,
      reason: firstHomeConcession.reason,
      showBothConcessions: false,
      homeConcession: homeConcession,
      firstHomeConcession: firstHomeConcession,
      firstHomeNewConcession: firstHomeNewConcession,
      firstHomeVacantLandConcession: firstHomeVacantLandConcession
    };
    
    // Add other concessions to ineligible if first home concession is applied
    if (firstHomeVacantLandConcession.eligible) {
      ineligibleConcessions.push({
        type: 'First Home (Vac Land) Concession',
        amount: firstHomeVacantLandConcession.concessionAmount,
        eligible: false,
        reason: 'First Home Concession takes priority',
        showBothConcessions: false,
        homeConcession: homeConcession,
        firstHomeConcession: firstHomeConcession,
        firstHomeNewConcession: firstHomeNewConcession,
        firstHomeVacantLandConcession: firstHomeVacantLandConcession
      });
    }
    
    if (homeConcession.eligible) {
      ineligibleConcessions.push({
        type: 'Home Concession',
        amount: homeConcession.concessionAmount,
        eligible: false,
        reason: 'First Home Concession takes priority',
        showBothConcessions: false,
        homeConcession: homeConcession,
        firstHomeConcession: firstHomeConcession,
        firstHomeNewConcession: firstHomeNewConcession
      });
    }
  } else if (homeConcession.eligible) {
    appliedConcession = {
      type: 'Home Concession',
      amount: homeConcession.concessionAmount,
      eligible: true,
      reason: homeConcession.reason,
      showBothConcessions: false,
      homeConcession: homeConcession,
      firstHomeConcession: firstHomeConcession,
      firstHomeNewConcession: firstHomeNewConcession,
      firstHomeVacantLandConcession: firstHomeVacantLandConcession
    };
  }
  
  // Add ineligible concessions
  if (!firstHomeNewConcession.eligible) {
    ineligibleConcessions.push({
      type: 'First Home (New) Concession',
      amount: 0,
      eligible: false,
      reason: firstHomeNewConcession.reason,
      showBothConcessions: false,
      homeConcession: homeConcession,
      firstHomeConcession: firstHomeConcession,
      firstHomeNewConcession: firstHomeNewConcession
    });
  }
  
  if (!firstHomeConcession.eligible) {
    ineligibleConcessions.push({
      type: 'First Home Concession',
      amount: 0,
      eligible: false,
      reason: firstHomeConcession.reason,
      showBothConcessions: false,
      homeConcession: homeConcession,
      firstHomeConcession: firstHomeConcession,
      firstHomeNewConcession: firstHomeNewConcession
    });
  }
  
  if (!homeConcession.eligible && !firstHomeConcession.eligible && !firstHomeNewConcession.eligible) {
    ineligibleConcessions.push({
      type: 'Home Concession',
      amount: 0,
      eligible: false,
      reason: homeConcession.reason,
      showBothConcessions: false,
      homeConcession: homeConcession,
      firstHomeConcession: firstHomeConcession,
      firstHomeNewConcession: firstHomeNewConcession
    });
  }
  
  // Calculate net state duty (stamp duty plus foreign duty minus any concessions)
  const netStateDuty = stampDutyAmount + (foreignDutyResult.applicable ? foreignDutyResult.amount : 0) - (appliedConcession ? appliedConcession.amount : 0);
  
  // Calculate total upfront costs (including property price if no loan needed, minus grants)
  const propertyPrice = (buyerData.needsLoan === 'no') ? price : 0;
  const totalUpfrontCosts = netStateDuty + propertyPrice - (grantResult.eligible ? grantResult.amount : 0);
  
  return {
    stampDuty: { amount: stampDutyAmount, label: "Stamp Duty" },
    concessions: appliedConcession ? [appliedConcession] : [],
    ineligibleConcessions: ineligibleConcessions,
    grants: grantResult.eligible ? [grantResult] : [],
    foreignDuty: foreignDutyResult,
    netStateDuty: netStateDuty,
    totalUpfrontCosts: totalUpfrontCosts,
    // Include all concession data for display purposes
    allConcessions: {
      home: homeConcession,
      firstHome: firstHomeConcession,
      firstHomeNew: firstHomeNewConcession,
      firstHomeVacantLand: firstHomeVacantLandConcession
    },
    // Include all grant data for display purposes
    allGrants: {
      firstHomeOwners: grantResult
    }
  };
};

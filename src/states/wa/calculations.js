import { WA_STAMP_DUTY_RATES, WA_FIRST_HOME_OWNERS_GRANT, WA_FHOG_PROPERTY_CAP_SOUTH, WA_FHOG_PROPERTY_CAP_NORTH, WA_FHO_CONCESSION_CAP_METRO, WA_FHO_CONCESSION_CAP_NON_METRO, WA_FHO_CONCESSION_CAP_VACANT_LAND, WA_FHO_CONCESSION_RATE_METRO, WA_FHO_CONCESSION_RATE_NON_METRO, WA_FHO_CONCESSION_RATE_VACANT_LAND, WA_FHO_CONCESSION_THRESHOLD, WA_FHO_CONCESSION_THRESHOLD_VACANT_LAND, WA_OFF_THE_PLAN_CONCESSION_CAP, WA_OFF_THE_PLAN_PRE_CONSTRUCTION_FULL_CONCESSION_THRESHOLD, WA_OFF_THE_PLAN_PRE_CONSTRUCTION_PARTIAL_CONCESSION_THRESHOLD, WA_OFF_THE_PLAN_PRE_CONSTRUCTION_REDUCTION_RATE, WA_OFF_THE_PLAN_PRE_CONSTRUCTION_PARTIAL_CONCESSION_RATE, WA_OFF_THE_PLAN_UNDER_CONSTRUCTION_FULL_CONCESSION_THRESHOLD, WA_OFF_THE_PLAN_UNDER_CONSTRUCTION_PARTIAL_CONCESSION_THRESHOLD, WA_OFF_THE_PLAN_UNDER_CONSTRUCTION_REDUCTION_RATE, WA_OFF_THE_PLAN_UNDER_CONSTRUCTION_PARTIAL_CONCESSION_RATE, WA_OFF_THE_PLAN_UNDER_CONSTRUCTION_FULL_CONCESSION_RATE, WA_FOREIGN_BUYER_RATE } from './constants.js';

export const calculateWAStampDuty = (propertyPrice, selectedState) => {
  // Only calculate if WA is selected
  if (selectedState !== 'WA') {
    return 0;
  }

  // Convert propertyPrice to number if it's a string
  const price = parseInt(propertyPrice) || 0;
  
  if (price <= 0) {
    return 0;
  }

  // Find the applicable rate bracket
  let applicableRate = null;
  for (const bracket of WA_STAMP_DUTY_RATES) {
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
 * Calculate WA First Home Owners Grant
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'WA')
 * @returns {Object} - Grant result with amount and details
 */
export const calculateWAFirstHomeOwnersGrant = (buyerData, propertyData, selectedState) => {
  // Only calculate if WA is selected
  if (selectedState !== 'WA') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Not WA'
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
    propertyType,
    isWA,
    isWAMetro
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

  // Check WA region selection
  if (!isWA || (isWA !== 'north' && isWA !== 'south')) {
    return {
      eligible: false,
      amount: 0,
      reason: 'Please select North or South WA location'
    };
  }

  // Check WA metro selection
  if (!isWAMetro || (isWAMetro !== 'metro' && isWAMetro !== 'non-metro')) {
    return {
      eligible: false,
      amount: 0,
      reason: 'Please select Metro or Non-Metro location'
    };
  }

  // WA FHOG applies to new, off-the-plan, and house-and-land properties
  if (propertyType !== 'new' && propertyType !== 'off-the-plan' && propertyType !== 'house-and-land') {
    return {
      eligible: false,
      amount: 0,
      reason: 'WA First Home Owners Grant only applies to new, off-the-plan, and house-and-land properties'
    };
  }

  // Check property price cap based on WA region
  const priceCap = isWA === 'south' ? WA_FHOG_PROPERTY_CAP_SOUTH : WA_FHOG_PROPERTY_CAP_NORTH;
  const regionLabel = isWA === 'south' ? 'South WA' : 'North WA';
  
  if (price > priceCap) {
    return {
      eligible: false,
      amount: 0,
      reason: `WA First Home Owners Grant only applies to properties valued at $${priceCap.toLocaleString()} for this property's location. Your property is valued at $${price.toLocaleString()}`
    };
  }

  // All criteria met - eligible for full grant
  return {
    eligible: true,
    amount: WA_FIRST_HOME_OWNERS_GRANT,
    reason: `Eligible for WA First Home Owners Grant (${regionLabel})`,
    details: {
      propertyPrice: price,
      grantAmount: WA_FIRST_HOME_OWNERS_GRANT,
      propertyType: propertyType,
      priceCap: priceCap,
      region: regionLabel,
      metro: isWAMetro === 'metro' ? 'Metro' : 'Non-Metro',
      note: `Grant available for eligible properties up to $${priceCap.toLocaleString()} in ${regionLabel}`
    }
  };
};

/**
 * Calculate WA First Home Owner Concession
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'WA')
 * @param {number} stampDutyAmount - Calculated stamp duty amount
 * @returns {Object} - Concession result with amount and details
 */
export const calculateWAFirstHomeOwnerConcession = (buyerData, propertyData, selectedState, stampDutyAmount) => {
  // Only calculate if WA is selected
  if (selectedState !== 'WA') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Not WA'
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
    propertyType,
    isWA,
    isWAMetro
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

  // Check WA region selection
  if (!isWA || (isWA !== 'north' && isWA !== 'south')) {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Please select North or South WA location'
    };
  }

  // Check WA metro selection
  if (!isWAMetro || (isWAMetro !== 'metro' && isWAMetro !== 'non-metro')) {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Please select Metro or Non-Metro location'
    };
  }

  // Handle vacant land separately
  if (propertyType === 'vacant-land-only') {
    // Check vacant land price cap
    if (price > WA_FHO_CONCESSION_CAP_VACANT_LAND) {
      return {
        eligible: false,
        concessionAmount: 0,
        reason: `WA First Home Owner Concession for vacant land only applies to properties valued at $${WA_FHO_CONCESSION_CAP_VACANT_LAND.toLocaleString()} or below. Your property is valued at $${price.toLocaleString()}`
      };
    }

    // Calculate vacant land concession
    if (price <= WA_FHO_CONCESSION_THRESHOLD_VACANT_LAND) {
      // No duty payable - full concession
      return {
        eligible: true,
        concessionAmount: stampDutyAmount,
        reason: 'Eligible for WA First Home Owner Concession (Vacant Land) - Full exemption',
        details: {
          propertyPrice: price,
          baseStampDuty: stampDutyAmount,
          concessionAmount: stampDutyAmount,
          netStampDuty: 0,
          propertyType: propertyType,
          calculationMethod: 'Full exemption - no duty payable',
          exemptionType: 'Full stamp duty exemption for vacant land under $350,000'
        }
      };
    } else {
      // Between $350,000 and $450,000 - calculate duty at $15.39 per $100 over $350,000
      const excessAmount = price - WA_FHO_CONCESSION_THRESHOLD_VACANT_LAND;
      const concessionDuty = Math.ceil(excessAmount / 100) * WA_FHO_CONCESSION_RATE_VACANT_LAND;
      const concessionAmount = Math.max(0, stampDutyAmount - concessionDuty);

      return {
        eligible: true,
        concessionAmount: concessionAmount,
        reason: 'Eligible for WA First Home Owner Concession (Vacant Land)',
        details: {
          propertyPrice: price,
          baseStampDuty: stampDutyAmount,
          concessionDuty: concessionDuty,
          concessionAmount: concessionAmount,
          netStampDuty: concessionDuty,
          propertyType: propertyType,
          calculationMethod: `Duty at $${WA_FHO_CONCESSION_RATE_VACANT_LAND} per $100 over $${WA_FHO_CONCESSION_THRESHOLD_VACANT_LAND.toLocaleString()}`,
          exemptionType: 'Partial concession for vacant land between $350,000 and $450,000'
        }
      };
    }
  }

  // Handle all other property types
  const isMetro = isWAMetro === 'metro';
  const priceCap = isMetro ? WA_FHO_CONCESSION_CAP_METRO : WA_FHO_CONCESSION_CAP_NON_METRO;
  const regionLabel = isMetro ? 'Metro/Peel' : 'Non-Metro';

  // Check price cap
  if (price > priceCap) {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: `WA First Home Owner Concession only applies to properties valued at $${priceCap.toLocaleString()} or below in ${regionLabel} regions. Your property is valued at $${price.toLocaleString()}`
    };
  }

  // Calculate concession based on price ranges
  if (price <= WA_FHO_CONCESSION_THRESHOLD) {
    // No duty payable - full concession
    return {
      eligible: true,
      concessionAmount: stampDutyAmount,
      reason: `Eligible for WA First Home Owner Concession (${regionLabel}) - Full exemption`,
      details: {
        propertyPrice: price,
        baseStampDuty: stampDutyAmount,
        concessionAmount: stampDutyAmount,
        netStampDuty: 0,
        propertyType: propertyType,
        region: regionLabel,
        calculationMethod: 'Full exemption - no duty payable',
        exemptionType: `Full stamp duty exemption for properties under $${WA_FHO_CONCESSION_THRESHOLD.toLocaleString()}`
      }
    };
  } else {
    // Between $500,000 and price cap - calculate duty at concessional rate
    const excessAmount = price - WA_FHO_CONCESSION_THRESHOLD;
    const rate = isMetro ? WA_FHO_CONCESSION_RATE_METRO : WA_FHO_CONCESSION_RATE_NON_METRO;
    const concessionDuty = Math.ceil(excessAmount / 100) * rate;
    const concessionAmount = Math.max(0, stampDutyAmount - concessionDuty);

    return {
      eligible: true,
      concessionAmount: concessionAmount,
      reason: `Eligible for WA First Home Owner Concession (${regionLabel})`,
      details: {
        propertyPrice: price,
        baseStampDuty: stampDutyAmount,
        concessionDuty: concessionDuty,
        concessionAmount: concessionAmount,
        netStampDuty: concessionDuty,
        propertyType: propertyType,
        region: regionLabel,
        calculationMethod: `Duty at $${rate} per $100 over $${WA_FHO_CONCESSION_THRESHOLD.toLocaleString()}`,
        exemptionType: `Partial concession for properties between $${WA_FHO_CONCESSION_THRESHOLD.toLocaleString()} and $${priceCap.toLocaleString()} in ${regionLabel} regions`
      }
    };
  }
};

/**
 * Calculate WA Off-The-Plan Concession
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'WA')
 * @param {number} stampDutyAmount - Calculated stamp duty amount
 * @param {string} dutiableValue - Dutiable value from seller questions
 * @param {boolean} sellerQuestionsComplete - Whether seller questions are complete
 * @returns {Object} - Concession result with amount and details
 */
export const calculateWAOffThePlanConcession = (buyerData, propertyData, selectedState, stampDutyAmount, dutiableValue = 0, sellerQuestionsComplete = false, constructionStarted = 'no') => {
  // Only calculate if WA is selected
  if (selectedState !== 'WA') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Not WA'
    };
  }

  const {
    propertyType,
    propertyCategory
  } = propertyData;

  // Check property type requirement
  if (propertyType !== 'off-the-plan') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Must be off-the-plan property'
    };
  }

  // Check property category requirement
  if (propertyCategory !== 'townhouse' && propertyCategory !== 'apartment') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Must be townhouse or apartment'
    };
  }

  // If seller questions not complete, show as eligible but waiting
  if (!sellerQuestionsComplete) {
    return {
      eligible: true,
      concessionAmount: 0,
      reason: 'Eligible but concession will be calculated after seller questions',
      details: {
        waitingForSellerQuestions: true,
        propertyType: propertyType,
        propertyCategory: propertyCategory,
        note: 'Additional seller information required to calculate concession amount'
      }
    };
  }

  // Convert dutiable value to number
  const dutiableValueNum = parseInt(dutiableValue) || 0;

  if (dutiableValueNum <= 0) {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Invalid dutiable value'
    };
  }

  // Determine if construction has started
  const isUnderConstruction = constructionStarted === 'yes' || constructionStarted === true || constructionStarted === 'true';
  
  // Calculate concession based on dutiable value and construction status
  let concessionPercentage = 1.0; // Start with 100% for pre-construction
  let concessionAmount = 0;
  let calculationMethod = '';

  if (isUnderConstruction) {
    // Under Construction rates
    if (dutiableValueNum <= WA_OFF_THE_PLAN_UNDER_CONSTRUCTION_FULL_CONCESSION_THRESHOLD) {
      // $750,000 or less: 75% concession
      concessionPercentage = WA_OFF_THE_PLAN_UNDER_CONSTRUCTION_FULL_CONCESSION_RATE;
      calculationMethod = '75% concession (under construction)';
    } else if (dutiableValueNum < WA_OFF_THE_PLAN_UNDER_CONSTRUCTION_PARTIAL_CONCESSION_THRESHOLD) {
      // Between $750,000 and $850,000: reducing from 75% to 37.5%
      const excessAmount = dutiableValueNum - WA_OFF_THE_PLAN_UNDER_CONSTRUCTION_FULL_CONCESSION_THRESHOLD;
      const reductionAmount = (excessAmount / 100) * WA_OFF_THE_PLAN_UNDER_CONSTRUCTION_REDUCTION_RATE;
      concessionPercentage = Math.max(WA_OFF_THE_PLAN_UNDER_CONSTRUCTION_PARTIAL_CONCESSION_RATE, WA_OFF_THE_PLAN_UNDER_CONSTRUCTION_FULL_CONCESSION_RATE - reductionAmount);
      calculationMethod = `Reducing concession (${(concessionPercentage * 100).toFixed(2)}%) - under construction`;
    } else {
      // $850,000 or more: 37.5% concession
      concessionPercentage = WA_OFF_THE_PLAN_UNDER_CONSTRUCTION_PARTIAL_CONCESSION_RATE;
      calculationMethod = '37.5% concession (under construction)';
    }
  } else {
    // Pre-Construction rates
    if (dutiableValueNum <= WA_OFF_THE_PLAN_PRE_CONSTRUCTION_FULL_CONCESSION_THRESHOLD) {
      // $750,000 or less: 100% concession
      concessionPercentage = 1.0;
      calculationMethod = '100% concession (pre-construction)';
    } else if (dutiableValueNum < WA_OFF_THE_PLAN_PRE_CONSTRUCTION_PARTIAL_CONCESSION_THRESHOLD) {
      // Between $750,000 and $850,000: reducing from 100% to 50%
      const excessAmount = dutiableValueNum - WA_OFF_THE_PLAN_PRE_CONSTRUCTION_FULL_CONCESSION_THRESHOLD;
      const reductionAmount = (excessAmount / 100) * WA_OFF_THE_PLAN_PRE_CONSTRUCTION_REDUCTION_RATE;
      concessionPercentage = Math.max(WA_OFF_THE_PLAN_PRE_CONSTRUCTION_PARTIAL_CONCESSION_RATE, 1.0 - reductionAmount);
      calculationMethod = `Reducing concession (${(concessionPercentage * 100).toFixed(2)}%) - pre-construction`;
    } else {
      // $850,000 or more: 50% concession
      concessionPercentage = WA_OFF_THE_PLAN_PRE_CONSTRUCTION_PARTIAL_CONCESSION_RATE;
      calculationMethod = '50% concession (pre-construction)';
    }
  }

  // Calculate concession amount (percentage of stamp duty, capped at $50,000)
  concessionAmount = Math.min(stampDutyAmount * concessionPercentage, WA_OFF_THE_PLAN_CONCESSION_CAP);

  return {
    eligible: true,
    concessionAmount: concessionAmount,
    reason: 'Eligible for WA Off-The-Plan Concession',
    details: {
      propertyType: propertyType,
      propertyCategory: propertyCategory,
      dutiableValue: dutiableValueNum,
      baseStampDuty: stampDutyAmount,
      concessionPercentage: concessionPercentage,
      concessionAmount: concessionAmount,
      netStampDuty: stampDutyAmount - concessionAmount,
      cap: WA_OFF_THE_PLAN_CONCESSION_CAP,
      calculationMethod: calculationMethod,
      constructionStatus: isUnderConstruction ? 'Under Construction' : 'Pre-Construction',
      waitingForSellerQuestions: false
    }
  };
};

/**
 * Calculate WA Foreign Buyer Duty
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'WA')
 * @returns {Object} - Foreign buyer duty result with amount and details
 */
export const calculateWAForeignBuyerDuty = (buyerData, propertyData, selectedState) => {
  // Only calculate if WA is selected
  if (selectedState !== 'WA') {
    return {
      applicable: false,
      amount: 0,
      reason: 'Foreign buyer duty only applies in WA'
    };
  }

  const { isAustralianResident } = buyerData;
  const { propertyPrice } = propertyData;

  // Convert propertyPrice to number if it's a string
  const price = parseInt(propertyPrice) || 0;

  if (price <= 0) {
    return {
      applicable: false,
      amount: 0,
      reason: 'Invalid property price'
    };
  }

  // Check if foreign buyer duty applies
  if (isAustralianResident === 'yes') {
    return {
      applicable: false,
      amount: 0,
      reason: 'Australian resident - no foreign buyer duty'
    };
  }

  // Calculate foreign buyer duty: property price × 7%
  const foreignBuyerDuty = price * WA_FOREIGN_BUYER_RATE;

  return {
    applicable: true,
    amount: foreignBuyerDuty,
    reason: 'Foreign buyer duty applies (7% of property price)',
    details: {
      propertyPrice: price,
      rate: WA_FOREIGN_BUYER_RATE,
      calculation: `${price.toLocaleString()} × ${(WA_FOREIGN_BUYER_RATE * 100)}% = $${foreignBuyerDuty.toLocaleString()}`
    }
  };
};

/**
 * Calculate all upfront costs for WA
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'WA')
 * @returns {Object} - Complete upfront costs breakdown
 */
export const calculateUpfrontCosts = (buyerData, propertyData, selectedState) => {
  // Only calculate if WA is selected
  if (selectedState !== 'WA') {
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
  const stampDutyAmount = calculateWAStampDuty(price, selectedState);
  
  // Calculate first home owners grant
  const grantResult = calculateWAFirstHomeOwnersGrant(buyerData, propertyData, selectedState);
  
  // Calculate foreign buyer duty
  const foreignDutyResult = calculateWAForeignBuyerDuty(buyerData, propertyData, selectedState);
  
  // Calculate first home owner concession
  const concessionResult = calculateWAFirstHomeOwnerConcession(buyerData, propertyData, selectedState, stampDutyAmount);
  
  // Calculate off-the-plan concession
  const offThePlanConcessionResult = calculateWAOffThePlanConcession(
    buyerData, 
    propertyData, 
    selectedState, 
    stampDutyAmount, 
    buyerData.dutiableValue || 0, 
    buyerData.sellerQuestionsComplete || false,
    buyerData.constructionStarted || 'no'
  );
  
  // Calculate net state duty after First Home Owner concession
  const firstHomeOwnerConcessionAmount = concessionResult.eligible ? concessionResult.concessionAmount : 0;
  const netStampDutyAfterFHO = stampDutyAmount - firstHomeOwnerConcessionAmount;
  
  
  // Calculate Off-The-Plan concession as additional concession on net stamp duty plus foreign duty
  let offThePlanConcessionAmount = 0;
  if (offThePlanConcessionResult.eligible) {
    if (buyerData.sellerQuestionsComplete) {
      // Calculate base duty including foreign duty for concession calculation
      const baseDutyWithForeign = netStampDutyAfterFHO + (foreignDutyResult.applicable ? foreignDutyResult.amount : 0);
      
      // Recalculate Off-The-Plan concession based on base duty plus foreign duty
      const offThePlanConcessionRecalc = calculateWAOffThePlanConcession(
        buyerData, 
        propertyData, 
        selectedState, 
        baseDutyWithForeign, // Use base duty plus foreign duty for concession calculation
        buyerData.dutiableValue || 0, 
        true, // Force seller questions complete for recalculation
        buyerData.constructionStarted || 'no'
      );
      offThePlanConcessionAmount = offThePlanConcessionRecalc.concessionAmount;
    } else {
      // Use original calculation when seller questions not complete (will be 0 with tooltip)
      offThePlanConcessionAmount = offThePlanConcessionResult.concessionAmount;
    }
  }
  
  // Final net state duty (stamp duty plus foreign duty minus concessions)
  const netStateDuty = netStampDutyAfterFHO + (foreignDutyResult.applicable ? foreignDutyResult.amount : 0) - offThePlanConcessionAmount;
  
  // Calculate total upfront costs (including property price if no loan needed, minus grants)
  const propertyPrice = (buyerData.needsLoan === 'no') ? price : 0;
  const totalUpfrontCosts = netStateDuty + propertyPrice - (grantResult.eligible ? grantResult.amount : 0);
  
  // Build concessions array - show both if both are eligible
  const concessions = [];
  const ineligibleConcessions = [];
  
  
  // Add First Home Owner concession
  if (concessionResult.eligible) {
    concessions.push({
      type: 'First Home Owner',
      amount: concessionResult.concessionAmount,
      eligible: true,
      reason: concessionResult.reason,
      showBothConcessions: false,
      firstHomeOwnerConcession: concessionResult
    });
  } else {
    ineligibleConcessions.push({
      type: 'First Home Owner',
      amount: 0,
      eligible: false,
      reason: concessionResult.reason,
      showBothConcessions: false,
      firstHomeOwnerConcession: concessionResult
    });
  }
  
  // Add Off-The-Plan concession
  if (offThePlanConcessionResult.eligible) {
    concessions.push({
      type: 'Off-The-Plan',
      amount: offThePlanConcessionAmount, // Use recalculated amount
      eligible: true,
      reason: offThePlanConcessionResult.reason,
      showBothConcessions: false,
      offThePlanConcession: offThePlanConcessionResult
    });
  } else {
    ineligibleConcessions.push({
      type: 'Off-The-Plan',
      amount: 0,
      eligible: false,
      reason: offThePlanConcessionResult.reason,
      showBothConcessions: false,
      offThePlanConcession: offThePlanConcessionResult
    });
  }


  return {
    stampDuty: { amount: stampDutyAmount, label: "Stamp Duty" },
    concessions: concessions,
    ineligibleConcessions: ineligibleConcessions,
    grants: grantResult.eligible ? [grantResult] : [],
    foreignDuty: { 
      amount: foreignDutyResult.applicable ? foreignDutyResult.amount : 0, 
      applicable: foreignDutyResult.applicable 
    },
    netStateDuty: netStateDuty,
    totalUpfrontCosts: totalUpfrontCosts,
    // Include all concession and grant data for display purposes
    allConcessions: {
      firstHomeOwner: concessionResult,
      offThePlan: offThePlanConcessionResult
    },
    allGrants: {
      firstHomeOwners: grantResult
    }
  };
};

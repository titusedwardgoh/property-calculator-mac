import { NSW_STAMP_DUTY_RATES, NSW_FIRST_HOME_OWNERS_GRANT, NSW_FHOG_PROPERTY_CAP, NSW_FHOG_LAND_CAP, NSW_LAND_CONCESSIONAL_RATES, NSW_CONCESSIONAL_RATES, NSW_FOREIGN_BUYER_RATE } from './constants.js';

export const calculateNSWStampDuty = (propertyPrice, selectedState) => {
  // Only calculate if NSW is selected
  if (selectedState !== 'NSW') {
    return 0;
  }

  // Convert propertyPrice to number if it's a string
  const price = parseInt(propertyPrice) || 0;
  
  if (price <= 0) {
    return 0;
  }

  // Find the applicable rate bracket
  let applicableRate = null;
  for (const bracket of NSW_STAMP_DUTY_RATES) {
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
 * Calculate NSW First Home Owners Grant eligibility and amount
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'NSW')
 * @returns {Object} - Eligibility result with amount and details
 */
export const calculateNSWFirstHomeOwnersGrant = (buyerData, propertyData, selectedState) => {
  // Only calculate if NSW is selected
  if (selectedState !== 'NSW') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Not NSW'
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
    propertyCategory
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

  // Check property type eligibility - new properties, off-the-plan, and house and land are eligible
  if (propertyType !== 'new' && propertyType !== 'off-the-plan' && propertyType !== 'house-and-land') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Only new, off-the-plan and house and land packages are eligible'
    };
  }

  // Check property price caps based on property category
  let priceCap;
  if (propertyCategory === 'land') {
    // For land properties (including house and land packages)
    priceCap = NSW_FHOG_LAND_CAP; // $750,000
  } else {
    // For non-land properties (house, apartment, townhouse)
    priceCap = NSW_FHOG_PROPERTY_CAP; // $600,000
  }

  if (price > priceCap) {
    return {
      eligible: false,
      amount: 0,
      reason: `Property price $${price.toLocaleString()} exceeds cap of $${priceCap.toLocaleString()} for ${propertyCategory === 'land' ? 'land' : 'non-land'} properties`
    };
  }

  // All criteria met - eligible for grant
  return {
    eligible: true,
    amount: NSW_FIRST_HOME_OWNERS_GRANT, // $10,000
    reason: 'Eligible for NSW First Home Owners Grant',
    details: {
      propertyType,
      propertyCategory,
      priceCap,
      grantAmount: NSW_FIRST_HOME_OWNERS_GRANT
    }
  };
};

/**
 * Calculate NSW First Home Buyers Assistance Scheme stamp duty concession
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'NSW')
 * @param {number} stampDutyAmount - Full stamp duty amount payable
 * @returns {Object} - Concession result with amount and details
 */
export const calculateNSWFirstHomeBuyersAssistance = (buyerData, propertyData, selectedState, stampDutyAmount) => {
  // Only calculate if NSW is selected
  if (selectedState !== 'NSW') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Not NSW'
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

  // Check basic eligibility criteria (same as FHOG)
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

  // Check property type eligibility - all property types are eligible for First Home Buyers Assistance Scheme
  if (propertyType === 'vacant-land-only') {
    // Vacant land properties: $0-$450k concession
    let concessionAmount = 0;

    if (price <= 350000) {
      // Full stamp duty concession for properties $350k and below
      concessionAmount = stampDutyAmount;
    } else if (price > 350000 && price <= 450000) {
      // Partial concession using concessional rates for properties between $350k and $450k
      
      // Find the two nearest rates and interpolate between them
      const sortedRates = Object.entries(NSW_LAND_CONCESSIONAL_RATES)
        .sort(([a], [b]) => parseInt(a) - parseInt(b));
      
      let lowerPrice = 0;
      let lowerRate = 0;
      let upperPrice = 0;
      let upperRate = 0;
      
      // Find the two nearest rate thresholds
      for (let i = 0; i < sortedRates.length; i++) {
        const [ratePrice, rate] = sortedRates[i];
        const currentPrice = parseInt(ratePrice);
        
        if (price <= currentPrice) {
          // Found upper bound
          upperPrice = currentPrice;
          upperRate = rate;
          
          // Get lower bound (previous rate)
          if (i > 0) {
            const [prevPrice, prevRate] = sortedRates[i - 1];
            lowerPrice = parseInt(prevPrice);
            lowerRate = prevRate;
          }
          break;
        }
      }
      
      // Interpolate the rate between the two nearest values
      let applicableRate;
      if (lowerPrice > 0 && upperPrice > 0) {
        // Linear interpolation: rate = lowerRate + (upperRate - lowerRate) * (price - lowerPrice) / (upperPrice - lowerPrice)
        applicableRate = lowerRate + (upperRate - lowerRate) * (price - lowerPrice) / (upperPrice - lowerPrice);
      } else {
        // Fallback to the found rate if interpolation not possible
        applicableRate = upperRate;
      }
      
      // Calculate concessional stamp duty amount
      const concessionalAmount = price * applicableRate;
      
      // Concession is the difference between full stamp duty and concessional amount
      concessionAmount = Math.max(0, stampDutyAmount - concessionalAmount);
    } else {
      // No concession for properties above $450k
      concessionAmount = 0;
    }

    return {
      eligible: true,
      concessionAmount: concessionAmount,
      reason: concessionAmount > 0 
        ? 'Eligible for NSW First Home Buyers Assistance Scheme (Vacant Land)'
        : 'You are an eligible buyer but your property price is outside of the concession range',
      details: {
        propertyType,
        propertyPrice: price,
        fullStampDuty: stampDutyAmount,
        concessionalAmount: stampDutyAmount - concessionAmount,
        concessionAmount: concessionAmount
      }
    };
  } else {
    // Other property types: $0-$1M concession
    let concessionAmount = 0;

    if (price <= 800000) {
      // Full stamp duty concession for properties $800k and below
      concessionAmount = stampDutyAmount;
    } else if (price > 800000 && price < 1000000) {
      // Special case for $999,999
      if (price === 999999) {
        concessionAmount = 0.15;
      } else {
        // Partial concession using concessional rates for properties between $800k and $1M
        
        // Find the two nearest rates and interpolate between them
        const sortedRates = Object.entries(NSW_CONCESSIONAL_RATES)
          .sort(([a], [b]) => parseInt(a) - parseInt(b));
        
        let lowerPrice = 0;
        let lowerRate = 0;
        let upperPrice = 0;
        let upperRate = 0;
        
        // Find the two nearest rate thresholds
        for (let i = 0; i < sortedRates.length; i++) {
          const [ratePrice, rate] = sortedRates[i];
          const currentPrice = parseInt(ratePrice);
          
          if (price <= currentPrice) {
            // Found upper bound
            upperPrice = currentPrice;
            upperRate = rate;
            
            // Get lower bound (previous rate)
            if (i > 0) {
              const [prevPrice, prevRate] = sortedRates[i - 1];
              lowerPrice = parseInt(prevPrice);
              lowerRate = prevRate;
            }
            break;
          }
        }
        
        // Interpolate the rate between the two nearest values
        let applicableRate;
        if (lowerPrice > 0 && upperPrice > 0) {
          // Linear interpolation: rate = lowerRate + (upperRate - lowerRate) * (price - lowerPrice) / (upperPrice - lowerPrice)
          applicableRate = lowerRate + (upperRate - lowerRate) * (price - lowerPrice) / (upperPrice - lowerPrice);
        } else {
          // Fallback to the found rate if interpolation not possible
          applicableRate = upperRate;
        }
        
        // Calculate concessional stamp duty amount
        const concessionalAmount = price * applicableRate;
        
        // Concession is the difference between full stamp duty and concessional amount
        concessionAmount = Math.max(0, stampDutyAmount - concessionalAmount);
      }
    } else {
      // No concession for properties $1M and above
      concessionAmount = 0;
    }

    return {
      eligible: true,
      concessionAmount: concessionAmount,
      reason: concessionAmount > 0 
        ? 'Eligible for NSW First Home Buyers Assistance Scheme (Other Property Types)'
        : 'You are an eligible buyer but your property price is outside of the concession range',
      details: {
        propertyType,
        propertyPrice: price,
        fullStampDuty: stampDutyAmount,
        concessionalAmount: stampDutyAmount - concessionAmount,
        concessionAmount: concessionAmount
      }
    };
  }
};

/**
 * Calculate NSW Foreign Purchaser Duty
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'NSW')
 * @returns {Object} - Foreign purchaser duty result with amount and details
 */
export const calculateNSWForeignPurchaserDuty = (buyerData, propertyData, selectedState) => {
  // Only calculate if NSW is selected
  if (selectedState !== 'NSW') {
    return {
      applicable: false,
      amount: 0,
      reason: 'Not NSW'
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

  // Check if foreign purchaser duty applies
  if (isAustralianResident !== 'no') {
    return {
      applicable: false,
      amount: 0,
      reason: 'Australian resident - no foreign purchaser duty'
    };
  }

  if (price <= 0) {
    return {
      applicable: false,
      amount: 0,
      reason: 'Invalid property price'
    };
  }

  // Calculate foreign purchaser duty: property price × 9%
  const foreignPurchaserDuty = price * NSW_FOREIGN_BUYER_RATE;

  return {
    applicable: true,
    amount: foreignPurchaserDuty,
    reason: 'Foreign purchaser duty applies (9% of property price)',
    details: {
      propertyPrice: price,
      rate: NSW_FOREIGN_BUYER_RATE,
      calculation: `${price.toLocaleString()} × ${(NSW_FOREIGN_BUYER_RATE * 100)}% = $${foreignPurchaserDuty.toLocaleString()}`
    }
  };
};

/**
 * Calculate all upfront costs for NSW
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'NSW')
 * @returns {Object} - Complete upfront costs breakdown
 */
export const calculateUpfrontCosts = (buyerData, propertyData, selectedState) => {
  // Only calculate if NSW is selected
  if (selectedState !== 'NSW') {
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
  const stampDutyAmount = calculateNSWStampDuty(price, selectedState);
  
  // Calculate stamp duty concession
  const concessionResult = calculateNSWFirstHomeBuyersAssistance(buyerData, propertyData, selectedState, stampDutyAmount);
  
  // Calculate foreign purchaser duty
  const foreignDutyResult = calculateNSWForeignPurchaserDuty(buyerData, propertyData, selectedState);
  
  // Calculate first home owners grant
  const grantResult = calculateNSWFirstHomeOwnersGrant(buyerData, propertyData, selectedState);
  
  // Calculate net state duty
  const netStateDuty = stampDutyAmount + (foreignDutyResult.applicable ? foreignDutyResult.amount : 0) - (concessionResult.eligible ? concessionResult.concessionAmount : 0);
  
  // Calculate total upfront costs (including property price if no loan needed)
  const propertyPrice = (buyerData.needsLoan === 'no') ? price : 0;
  const totalUpfrontCosts = netStateDuty + propertyPrice - (grantResult.eligible ? grantResult.amount : 0);
  
  return {
    stampDuty: { amount: stampDutyAmount, label: "Stamp Duty" },
    concessions: concessionResult.eligible ? [{
      type: 'First Home Buyer',
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
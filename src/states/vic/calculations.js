import { VIC_STAMP_DUTY_RATES, VIC_FIRST_HOME_OWNERS_GRANT, VIC_FHOG_PROPERTY_CAP, VIC_FHOG_LAND_CAP, VIC_FOREIGN_BUYER_RATE, VIC_FHB_CONCESSIONAL_RATES, VIC_PPR_CONCESSIONAL_RATES, VIC_PENSIONER_CONCESSIONS, VIC_TEMP_OFF_THE_PLAN_CONCESSION } from './constants.js';

export const calculateVICStampDuty = (propertyPrice, selectedState) => {
  // Only calculate if VIC is selected
  if (selectedState !== 'VIC') {
    return 0;
  }

  // Convert propertyPrice to number if it's a string
  const price = parseInt(propertyPrice) || 0;
  
  if (price <= 0) {
    return 0;
  }

  let stampDuty = 0;

  // Progressive calculation based on VIC stamp duty structure
  if (price <= 25000) {
    // $0 - $25,000: 1.4% of the dutiable value
    stampDuty = price * 0.014;
  } else if (price <= 130000) {
    // >$25,000 - $130,000: $350 plus 2.4% of the dutiable value in excess of $25,000
    stampDuty = 350 + (price - 25000) * 0.024;
  } else if (price <= 960000) {
    // >$130,000 - $960,000: $2,870 plus 6% of the dutiable value in excess of $130,000
    stampDuty = 2870 + (price - 130000) * 0.06;
  } else if (price <= 2000000) {
    // >$960,000 - $2,000,000: 5.5% of the dutiable value
    stampDuty = price * 0.055;
  } else {
    // More than $2,000,000: $110,000 plus 6.5% of the dutiable value in excess of $2,000,000
    stampDuty = 110000 + (price - 2000000) * 0.065;
  }

  return Math.round(stampDuty * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate VIC First Home Owners Grant eligibility and amount
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'VIC')
 * @returns {Object} - Eligibility result with amount and details
 */
export const calculateVICFirstHomeOwnersGrant = (buyerData, propertyData, selectedState) => {
  // Only calculate if VIC is selected
  if (selectedState !== 'VIC') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Not VIC'
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

  // Check property type eligibility - new, off-the-plan, and house-and-land properties are eligible in VIC
  if (propertyType !== 'new' && propertyType !== 'off-the-plan' && propertyType !== 'house-and-land') {
    return {
      eligible: false,
      amount: 0,
      reason: 'Only new, off-the-plan and house and land packages are eligible for VIC First Home Owners Grant'
    };
  }

  // Check property price caps based on property category
  let priceCap;
  if (propertyCategory === 'land') {
    // For land properties (including house and land packages)
    priceCap = VIC_FHOG_LAND_CAP; // $750,000
  } else {
    // For non-land properties (house, apartment, townhouse)
    priceCap = VIC_FHOG_PROPERTY_CAP; // $750,000
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
    amount: VIC_FIRST_HOME_OWNERS_GRANT, // $10,000
    reason: 'Eligible for VIC First Home Owners Grant',
    details: {
      propertyType,
      propertyCategory,
      priceCap,
      grantAmount: VIC_FIRST_HOME_OWNERS_GRANT
    }
  };
};

/**
 * Calculate VIC Foreign Purchaser Duty
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'VIC')
 * @returns {Object} - Foreign purchaser duty result with amount and details
 */
export const calculateVICForeignPurchaserDuty = (buyerData, propertyData, selectedState) => {
  // Only calculate if VIC is selected
  if (selectedState !== 'VIC') {
    return {
      applicable: false,
      amount: 0,
      reason: 'Not VIC'
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

  // Calculate foreign purchaser duty: property price × 8%
  const foreignPurchaserDuty = price * VIC_FOREIGN_BUYER_RATE;

  return {
    applicable: true,
    amount: foreignPurchaserDuty,
    reason: 'Foreign purchaser duty applies (8% of property price)',
    details: {
      propertyPrice: price,
      rate: VIC_FOREIGN_BUYER_RATE,
      calculation: `${price.toLocaleString()} × ${(VIC_FOREIGN_BUYER_RATE * 100)}% = $${foreignPurchaserDuty.toLocaleString()}`
    }
  };
};

/**
 * Calculate VIC First Home Buyer Duty Concession
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'VIC')
 * @param {number} stampDutyAmount - Calculated stamp duty amount
 * @returns {Object} - Concession result with amount and details
 */
export const calculateVICFirstHomeBuyerDutyConcession = (buyerData, propertyData, selectedState, stampDutyAmount) => {
  // Only calculate if VIC is selected
  if (selectedState !== 'VIC') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Not VIC'
    };
  }

  const {
    buyerType,
    isPPR,
    isAustralianResident,
    isFirstHomeBuyer
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

  // VIC First Home Buyer Duty Concession applies to all property types
  let concessionAmount = 0;

  if (price < 600000) {
    // Full concession: property price below $600k
    concessionAmount = stampDutyAmount;
  } else if (price === 750000) {
    // Special case: property price exactly $750k - not eligible (at threshold)
    return {
      eligible: false,
      concessionAmount: 0,
      reason: `First Home Buyer concession only applies to properties valued below $750,000. Your property is valued at exactly $${price.toLocaleString()}`,
      details: {
        propertyPrice: price,
        stampDutyAmount: stampDutyAmount,
        concessionAmount: 0,
        netStampDuty: stampDutyAmount,
        threshold750k: true,
        note: 'Property price is at the $750k threshold'
      }
    };
  } else if (price > 750000) {
    // No concession: property price above $750k - not eligible
    return {
      eligible: false,
      concessionAmount: 0,
      reason: `First Home Buyer concession only applies to properties valued at $750,000 or below. Your property is valued at $${price.toLocaleString()}`,
      details: {
        propertyPrice: price,
        stampDutyAmount: stampDutyAmount,
        concessionAmount: 0,
        netStampDuty: stampDutyAmount,
        threshold750k: true,
        note: 'Property price exceeds $750k threshold'
      }
    };
  } else {
    // Partial concession: property price between $600k and $750k
    // Use interpolation with concessional rates
    const sortedRates = Object.entries(VIC_FHB_CONCESSIONAL_RATES)
      .sort(([a], [b]) => parseInt(a) - parseInt(b));
    
    let lowerPrice = 0;
    let lowerRate = 0;
    let upperPrice = 0;
    let upperRate = 0;
    
    for (let i = 0; i < sortedRates.length; i++) {
      const [ratePrice, rate] = sortedRates[i];
      const currentPrice = parseInt(ratePrice);
      
      if (price <= currentPrice) {
        upperPrice = currentPrice;
        upperRate = rate;
        
        if (i > 0) {
          const [prevPrice, prevRate] = sortedRates[i - 1];
          lowerPrice = parseInt(prevPrice);
          lowerRate = prevRate;
        }
        break;
      }
    }
    
    let applicableRate;
    if (lowerPrice > 0 && upperPrice > 0) {
      // Interpolate between two rates
      applicableRate = lowerRate + (upperRate - lowerRate) * (price - lowerPrice) / (upperPrice - lowerPrice);
    } else {
      // Use the upper rate directly
      applicableRate = upperRate;
    }
    
    // Calculate concessional amount using the interpolated rate
    const concessionalAmount = price * applicableRate; // Use decimal rate directly
    concessionAmount = Math.max(0, stampDutyAmount - concessionalAmount);
  }

  return {
    eligible: true,
    concessionAmount: concessionAmount,
    reason: 'Eligible for VIC First Home Buyer Duty Concession',
    details: {
      propertyPrice: price,
      stampDutyAmount: stampDutyAmount,
      concessionAmount: concessionAmount,
      netStampDuty: stampDutyAmount - concessionAmount,
      threshold600k: price < 600000,
      threshold750k: price >= 750000,
      partialConcession: price >= 600000 && price < 750000
    }
  };
};

/**
 * Calculate VIC PPR Duty Concession
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'VIC')
 * @param {number} stampDutyAmount - Calculated stamp duty amount
 * @returns {Object} - PPR concession result with amount and details
 */
export const calculateVICPPRConcession = (buyerData, propertyData, selectedState, stampDutyAmount) => {
  // Only calculate if VIC is selected
  if (selectedState !== 'VIC') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Not VIC'
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

  // Check basic eligibility criteria for PPR concession
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

  // Foreign buyers are eligible for PPR concession
  // No restriction on isAustralianResident

  // For first home buyers, we need to check if they're foreign
  // Foreign first home buyers can get PPR concession as a fallback
  // Australian first home buyers should use First Home Buyer Duty Concession instead
  if (isFirstHomeBuyer === 'yes' && isAustralianResident === 'yes') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Australian first home buyers should use First Home Buyer Duty Concession instead'
    };
  }

  // Check property type - PPR concession applies to all property types except vacant land
  if (propertyType === 'vacant-land-only') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'PPR concession does not apply to vacant land'
    };
  }

  if (price <= 0) {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Invalid property price'
    };
  }

  // PPR concession only applies to properties between $130,000 and $550,000
  if (price < 130000 || price > 550000) {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: `PPR concession only applies to properties valued between $130,000 and $550,000. Your property is valued at $${price.toLocaleString()}`
    };
  }

  // Calculate PPR concessional stamp duty
  let pprStampDuty = 0;
  
  if (price <= 440000) {
    // $130,000 to $440,000: $2,870 plus 5% of amount >$130,000
    pprStampDuty = 2870 + (price - 130000) * 0.05;
  } else {
    // $440,000 to $550,000: $18,370 plus 6% of amount >$440,000
    pprStampDuty = 18370 + (price - 440000) * 0.06;
  }

  // Calculate concession amount (difference between base stamp duty and PPR stamp duty)
  const concessionAmount = Math.max(0, stampDutyAmount - pprStampDuty);

  return {
    eligible: true,
    concessionAmount: concessionAmount,
    reason: 'Eligible for VIC PPR Duty Concession',
    details: {
      propertyPrice: price,
      baseStampDuty: stampDutyAmount,
      pprStampDuty: pprStampDuty,
      concessionAmount: concessionAmount,
      netStampDuty: pprStampDuty,
      pprRange: '130,000 - 550,000',
      applicableRate: price <= 440000 ? '5%' : '6%',
      fixedFee: price <= 440000 ? 2870 : 18370
    }
  };
};

/**
 * Calculate VIC Pensioner Duty Concession
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'VIC')
 * @param {number} stampDutyAmount - Calculated stamp duty amount
 * @param {number} dutiableValue - Dutiable value of the property (optional for off-the-plan)
 * @param {boolean} sellerQuestionsComplete - Whether seller questions are complete
 * @returns {Object} - Pensioner concession result with amount and details
 */
export const calculateVICPensionConcession = (buyerData, propertyData, selectedState, stampDutyAmount, dutiableValue = 0, sellerQuestionsComplete = false) => {
  // Only calculate if VIC is selected
  if (selectedState !== 'VIC') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Not VIC'
    };
  }

  const {
    buyerType,
    isPPR,
    hasPensionCard
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

  if (hasPensionCard !== 'yes') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Must have a pension or concession card'
    };
  }

  // Check property type - pensioner concession applies to all property types except vacant land
  if (propertyType === 'vacant-land-only') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Pensioner concession does not apply to vacant land'
    };
  }

  // For off-the-plan and house-and-land properties
  if (propertyType === 'off-the-plan' || propertyType === 'house-and-land') {
    // If seller questions not complete, show as eligible but $0 concession
    if (!sellerQuestionsComplete || dutiableValue <= 0) {
      return {
        eligible: true,
        concessionAmount: 0,
        reason: 'Eligible for VIC Pensioner Duty Concession (additional seller information required for calculation)',
        details: {
          propertyPrice: price,
          baseStampDuty: stampDutyAmount,
          pensionerStampDuty: 0,
          concessionAmount: 0,
          netStampDuty: stampDutyAmount,
          propertyType: propertyType,
          note: 'Additional seller information required for concession calculation'
        }
      };
    }
    
    // Seller questions complete - calculate based on dutiable value and property price
    const dutiable = parseInt(dutiableValue) || 0;
    
    if (dutiable <= 550000) {
      // Dutiable value ≤ $550k: Full pension concession (net stamp duty = 0), ignore property price
      return {
        eligible: true,
        concessionAmount: stampDutyAmount,
        reason: 'Eligible for VIC Pensioner Duty Concession (full concession - dutiable value ≤ $550k)',
        details: {
          propertyPrice: price,
          dutiableValue: dutiable,
          baseStampDuty: stampDutyAmount,
          pensionerStampDuty: 0,
          concessionAmount: stampDutyAmount,
          netStampDuty: 0,
          propertyType: propertyType,
          note: 'Full concession applies as dutiable value is ≤ $550k'
        }
      };
    } else if (price > 750000) {
      // Dutiable value > $550k AND property price > $750k: No pension concession
      return {
        eligible: false,
        concessionAmount: 0,
        reason: `Pensioner concession not available - dutiable value ($${dutiable.toLocaleString()}) > $550k and property price ($${price.toLocaleString()}) > $750k`,
        details: {
          propertyPrice: price,
          dutiableValue: dutiable,
          baseStampDuty: stampDutyAmount,
          pensionerStampDuty: stampDutyAmount,
          concessionAmount: 0,
          netStampDuty: stampDutyAmount,
          propertyType: propertyType,
          note: 'Both dutiable value and property price exceed thresholds'
        }
      };
    } else {
      // Dutiable value > $550k AND property price ≤ $750k: Calculate using FHO interpolation method on property price
      const sortedRates = Object.entries(VIC_FHB_CONCESSIONAL_RATES)
        .sort(([a], [b]) => parseInt(a) - parseInt(b));
      
      let lowerPrice = 0;
      let lowerRate = 0;
      let upperPrice = 0;
      let upperRate = 0;
      
      for (let i = 0; i < sortedRates.length; i++) {
        const [ratePrice, rate] = sortedRates[i];
        const currentPrice = parseInt(ratePrice);
        
        if (price <= currentPrice) {
          upperPrice = currentPrice;
          upperRate = rate;
          
          if (i > 0) {
            const [prevPrice, prevRate] = sortedRates[i - 1];
            lowerPrice = parseInt(prevPrice);
            lowerRate = prevRate;
          }
          break;
        }
      }
      
      let applicableRate;
      if (lowerPrice > 0 && upperPrice > 0) {
        // Interpolate between two rates
        applicableRate = lowerRate + (upperRate - lowerRate) * (price - lowerPrice) / (upperPrice - lowerPrice);
      } else {
        // Use the upper rate directly
        applicableRate = upperRate;
      }
      
      // Calculate concessional amount using the interpolated rate on property price
      const pensionerStampDuty = price * applicableRate;
      const concessionAmount = Math.max(0, stampDutyAmount - pensionerStampDuty);
      
      return {
        eligible: true,
        concessionAmount: concessionAmount,
        reason: 'Eligible for VIC Pensioner Duty Concession (partial concession - dutiable value > $550k, property price ≤ $750k)',
        details: {
          propertyPrice: price,
          dutiableValue: dutiable,
          baseStampDuty: stampDutyAmount,
          pensionerStampDuty: pensionerStampDuty,
          concessionAmount: concessionAmount,
          netStampDuty: stampDutyAmount - concessionAmount,
          propertyType: propertyType,
          applicableRate: applicableRate,
          note: 'Partial concession calculated using FHO interpolation method on property price'
        }
      };
    }
  }

  if (price <= 0) {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Invalid property price'
    };
  }

  // Pensioner concession only applies to properties up to $750,000
  if (price > 750000) {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: `Pensioner concession only applies to properties valued at $750,000 or below. Your property is valued at $${price.toLocaleString()}`
    };
  }

  let concessionAmount = 0;
  let pensionerStampDuty = 0;

  if (price <= 600000) {
    // Full concession: property price $600k or below
    // Concession amount equals the base stamp duty, net stamp duty will be 0
    concessionAmount = stampDutyAmount;
    pensionerStampDuty = 0;
  } else if (price <= 750000) {
    // Partial concession: property price between $600k and $750k
    // Use VIC_FHB_CONCESSIONAL_RATES to calculate the concessional stamp duty
    const sortedRates = Object.entries(VIC_FHB_CONCESSIONAL_RATES)
      .sort(([a], [b]) => parseInt(a) - parseInt(b));
    
    let lowerPrice = 0;
    let lowerRate = 0;
    let upperPrice = 0;
    let upperRate = 0;
    
    for (let i = 0; i < sortedRates.length; i++) {
      const [ratePrice, rate] = sortedRates[i];
      const currentPrice = parseInt(ratePrice);
      
      if (price <= currentPrice) {
        upperPrice = currentPrice;
        upperRate = rate;
        
        if (i > 0) {
          const [prevPrice, prevRate] = sortedRates[i - 1];
          lowerPrice = parseInt(prevPrice);
          lowerRate = prevRate;
        }
        break;
      }
    }
    
    let applicableRate;
    if (lowerPrice > 0 && upperPrice > 0) {
      // Interpolate between two rates
      applicableRate = lowerRate + (upperRate - lowerRate) * (price - lowerPrice) / (upperPrice - lowerPrice);
    } else {
      // Use the upper rate directly
      applicableRate = upperRate;
    }
    
    // Calculate concessional amount using the interpolated rate
    pensionerStampDuty = price * applicableRate;
    concessionAmount = Math.max(0, stampDutyAmount - pensionerStampDuty);
    
    // Special case for exactly $750k - show as eligible with $0 concession
    if (price === 750000) {
      concessionAmount = 0;
    }
  }

  return {
    eligible: true,
    concessionAmount: concessionAmount,
    reason: concessionAmount > 0
      ? 'Eligible for VIC Pensioner Duty Concession'
      : price === 750000
      ? 'Eligible for VIC Pensioner Duty Concession (at threshold - no concession amount)'
      : 'You are an eligible pensioner but your property price is outside of the concession range',
    details: {
      propertyPrice: price,
      baseStampDuty: stampDutyAmount,
      pensionerStampDuty: pensionerStampDuty,
      concessionAmount: concessionAmount,
      netStampDuty: stampDutyAmount - concessionAmount,
      threshold600k: price <= 600000,
      threshold750k: price <= 750000,
      fullConcession: price <= 600000,
      partialConcession: price > 600000 && price <= 750000
    }
  };
};

/**
 * Calculate VIC Temp Off-The-Plan Concession
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'VIC')
 * @param {number} stampDutyAmount - Calculated stamp duty amount
 * @param {number} dutiableValue - Dutiable value of the property (optional for early eligibility check)
 * @param {boolean} sellerQuestionsComplete - Whether seller questions are complete
 * @returns {Object} - Temp off-the-plan concession result with amount and details
 */
export const calculateVICTempOffThePlanConcession = (buyerData, propertyData, selectedState, stampDutyAmount, dutiableValue = 0, sellerQuestionsComplete = false) => {
  // Only calculate if VIC is selected
  if (selectedState !== 'VIC') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Not VIC'
    };
  }

  const {
    propertyPrice,
    propertyType,
    propertyCategory
  } = propertyData;

  // Convert propertyPrice to number if it's a string
  const price = parseInt(propertyPrice) || 0;
  const dutiable = parseInt(dutiableValue) || 0;

  // Check property type eligibility - must be off-the-plan
  if (propertyType !== 'off-the-plan') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Temp off-the-plan concession only applies to off-the-plan properties'
    };
  }

  // Check property category eligibility - must be apartment or townhouse
  if (propertyCategory !== 'apartment' && propertyCategory !== 'townhouse') {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: 'Temp off-the-plan concession only applies to apartment or townhouse properties'
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
  if (price > VIC_TEMP_OFF_THE_PLAN_CONCESSION.PROPERTY_PRICE_CAP) {
    return {
      eligible: false,
      concessionAmount: 0,
      reason: `Property price $${price.toLocaleString()} exceeds cap of $${VIC_TEMP_OFF_THE_PLAN_CONCESSION.PROPERTY_PRICE_CAP.toLocaleString()}`
    };
  }

  // If seller questions not complete, just return eligibility status
  if (!sellerQuestionsComplete || dutiable <= 0) {
    return {
      eligible: true,
      concessionAmount: 0,
      reason: 'Eligible for VIC Temp Off-The-Plan Concession (concession amount will be calculated after seller questions)',
      details: {
        propertyPrice: price,
        propertyType: propertyType,
        propertyCategory: propertyCategory,
        waitingForSellerQuestions: true
      }
    };
  }

  // Full calculation - seller questions are complete
  // Calculate stamp duty using dutiable value
  const stampDutyOnDutiableValue = calculateVICStampDuty(dutiable, selectedState);
  
  // Calculate temp concession using FHO concession rules but with dutiable value
  let tempConcessionAmount = 0;
  let tempConcessionType = 'Temp Off-The-Plan';
  
  // Check if buyer is eligible for FHO concession (using original property data)
  const firstHomeConcession = calculateVICFirstHomeBuyerDutyConcession(buyerData, propertyData, selectedState, stampDutyAmount);
  
  if (firstHomeConcession.eligible) {
    // Apply FHO concession rules to dutiable value
    if (dutiable <= 600000) {
      // Full concession: dutiable value below $600k - full exemption applies
      tempConcessionAmount = stampDutyAmount; // Full stamp duty on property price
      tempConcessionType = 'Temp Off-The-Plan (FHO rules, full exemption)';
    } else if (dutiable === 750000) {
      // Special case: dutiable value exactly $750k - eligible but no concession amount
      tempConcessionAmount = 0;
      tempConcessionType = 'Temp Off-The-Plan (FHO rules, at threshold)';
    } else if (dutiable > 750000) {
      // Dutiable value above $750k: concession is difference between property price and dutiable value stamp duty
      tempConcessionAmount = Math.max(0, stampDutyAmount - stampDutyOnDutiableValue);
      tempConcessionType = 'Temp Off-The-Plan (FHO rules, above threshold - base difference)';
    } else {
      // Partial concession: dutiable value between $600k and $750k
      // Use interpolation with concessional rates
      const sortedRates = Object.entries(VIC_FHB_CONCESSIONAL_RATES)
        .sort(([a], [b]) => parseInt(a) - parseInt(b));
      
      let lowerPrice = 0;
      let lowerRate = 0;
      let upperPrice = 0;
      let upperRate = 0;
      
      for (let i = 0; i < sortedRates.length; i++) {
        const [ratePrice, rate] = sortedRates[i];
        const currentPrice = parseInt(ratePrice);
        
        if (dutiable <= currentPrice) {
          upperPrice = currentPrice;
          upperRate = rate;
          
          if (i > 0) {
            const [prevPrice, prevRate] = sortedRates[i - 1];
            lowerPrice = parseInt(prevPrice);
            lowerRate = prevRate;
          }
          break;
        }
      }
      
      let applicableRate;
      if (lowerPrice > 0 && upperPrice > 0) {
        // Interpolate between two rates
        applicableRate = lowerRate + (upperRate - lowerRate) * (dutiable - lowerPrice) / (upperPrice - lowerPrice);
      } else {
        // Use the upper rate directly
        applicableRate = upperRate;
      }
      
      // Calculate concessional amount using the interpolated rate
      const concessionalAmount = dutiable * applicableRate;
      tempConcessionAmount = Math.max(0, stampDutyAmount - concessionalAmount);
      tempConcessionType = 'Temp Off-The-Plan (FHO rules, partial concession)';
    }
  } else {
    // Not eligible for FHO, check PPR concession eligibility
    const pprConcession = calculateVICPPRConcession(buyerData, propertyData, selectedState, stampDutyAmount);
    if (pprConcession.eligible) {
      // Apply PPR concession rules to dutiable value
      if (dutiable >= 130000 && dutiable <= 550000) {
        // Calculate PPR concessional stamp duty using dutiable value
        let pprStampDutyOnDutiableValue = 0;
        
        if (dutiable <= 440000) {
          // $130,000 to $440,000: $2,870 plus 5% of amount >$130,000
          pprStampDutyOnDutiableValue = 2870 + (dutiable - 130000) * 0.05;
        } else {
          // $440,000 to $550,000: $18,370 plus 6% of amount >$440,000
          pprStampDutyOnDutiableValue = 18370 + (dutiable - 440000) * 0.06;
        }
        
        tempConcessionAmount = Math.max(0, stampDutyOnDutiableValue - pprStampDutyOnDutiableValue);
        tempConcessionType = 'Temp Off-The-Plan (PPR rules)';
      } else {
        // Outside PPR range, no concession
        tempConcessionAmount = 0;
        tempConcessionType = 'Temp Off-The-Plan (PPR rules, outside range)';
      }
    } else {
      // Not eligible for FHO or PPR, use base stamp duty difference
      tempConcessionAmount = Math.max(0, stampDutyAmount - stampDutyOnDutiableValue);
      tempConcessionType = 'Temp Off-The-Plan (base difference)';
    }
  }

  // Now compare with other concessions calculated using property price
  let bestConcessionAmount = tempConcessionAmount;
  let bestConcessionType = tempConcessionType;
  let bestConcessionDetails = {
    propertyPrice: price,
    dutiableValue: dutiable,
    baseStampDuty: stampDutyAmount,
    stampDutyOnDutiableValue: stampDutyOnDutiableValue,
    tempConcessionAmount: tempConcessionAmount,
    netStampDuty: stampDutyAmount - tempConcessionAmount
  };

  // Compare with FHO concession using property price
  if (firstHomeConcession.eligible && firstHomeConcession.concessionAmount > bestConcessionAmount) {
    bestConcessionAmount = firstHomeConcession.concessionAmount;
    bestConcessionType = 'First Home Buyer (using property price)';
    bestConcessionDetails = {
      ...bestConcessionDetails,
      fhoConcessionOnPropertyPrice: firstHomeConcession.concessionAmount,
      appliedConcession: 'FHO'
    };
  }

  // Compare with PPR concession using property price (only if FHO not better)
  if (bestConcessionType === tempConcessionType) {
    const pprConcession = calculateVICPPRConcession(buyerData, propertyData, selectedState, stampDutyAmount);
    if (pprConcession.eligible && pprConcession.concessionAmount > bestConcessionAmount) {
      bestConcessionAmount = pprConcession.concessionAmount;
      bestConcessionType = 'PPR (using property price)';
      bestConcessionDetails = {
        ...bestConcessionDetails,
        pprConcessionOnPropertyPrice: pprConcession.concessionAmount,
        appliedConcession: 'PPR'
      };
    }
  }

  return {
    eligible: true,
    concessionAmount: bestConcessionAmount,
    reason: `Eligible for VIC Temp Off-The-Plan Concession (${bestConcessionType})`,
    details: {
      ...bestConcessionDetails,
      appliedConcessionType: bestConcessionType,
      propertyType: propertyType,
      propertyCategory: propertyCategory
    }
  };
};

/**
 * Calculate all upfront costs for VIC
 * @param {Object} buyerData - Buyer information
 * @param {Object} propertyData - Property information
 * @param {string} selectedState - Selected state (must be 'VIC')
 * @returns {Object} - Complete upfront costs breakdown
 */
export const calculateUpfrontCosts = (buyerData, propertyData, selectedState) => {
  // Only calculate if VIC is selected
  if (selectedState !== 'VIC') {
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
  const dutiableValue = parseInt(buyerData.dutiableValue) || 0;
  
  // Calculate base stamp duty
  const stampDutyAmount = calculateVICStampDuty(price, selectedState);
  
  // Calculate all concessions
  const firstHomeConcession = calculateVICFirstHomeBuyerDutyConcession(buyerData, propertyData, selectedState, stampDutyAmount);
  const pprConcession = calculateVICPPRConcession(buyerData, propertyData, selectedState, stampDutyAmount);
  const pensionerConcession = calculateVICPensionConcession(buyerData, propertyData, selectedState, stampDutyAmount, dutiableValue, buyerData.sellerQuestionsComplete);
  const tempOffThePlanConcession = calculateVICTempOffThePlanConcession(buyerData, propertyData, selectedState, stampDutyAmount, dutiableValue, buyerData.sellerQuestionsComplete);
  
  // Determine which concession to apply
  let appliedConcession = null;
  let showBothConcessions = false;
  let ineligibleConcessions = [];
  
  const isFirstHomeBuyerEligible = firstHomeConcession.eligible && buyerData.isFirstHomeBuyer === 'yes';
  const isPensionerEligible = pensionerConcession.eligible && buyerData.hasPensionCard === 'yes';
  const isTempOffThePlanEligible = tempOffThePlanConcession.eligible;
  
  // Priority order: Temp Off-The-Plan (only if calculated) > First Home Buyer + Pensioner > First Home Buyer > Pensioner > PPR
  if (isTempOffThePlanEligible && tempOffThePlanConcession.concessionAmount > 0) {
    // Temp Off-The-Plan concession takes priority only if it has a calculated amount
    appliedConcession = {
      type: 'Temp Off-The-Plan',
      amount: tempOffThePlanConcession.concessionAmount,
      eligible: true,
      reason: tempOffThePlanConcession.reason,
      showBothConcessions: false,
      firstHomeConcession: firstHomeConcession,
      pprConcession: pprConcession,
      pensionerConcession: pensionerConcession,
      tempOffThePlanConcession: tempOffThePlanConcession
    };
  } else if (isFirstHomeBuyerEligible && isPensionerEligible) {
    // User is eligible for both - apply the higher concession only
    if (firstHomeConcession.concessionAmount >= pensionerConcession.concessionAmount) {
      // First Home Buyer concession is higher or equal
      appliedConcession = {
        type: 'First Home Buyer',
        amount: firstHomeConcession.concessionAmount,
        eligible: true,
        reason: firstHomeConcession.reason,
        showBothConcessions: false,
        firstHomeConcession: firstHomeConcession,
        pprConcession: pprConcession,
        pensionerConcession: pensionerConcession,
        tempOffThePlanConcession: tempOffThePlanConcession
      };
      // Add the lower pensioner concession to ineligible
      ineligibleConcessions.push({
        type: 'Pensioner',
        amount: pensionerConcession.concessionAmount,
        eligible: false,
        reason: 'Only one concession can be applied',
        showBothConcessions: false,
        firstHomeConcession: firstHomeConcession,
        pprConcession: pprConcession,
        pensionerConcession: pensionerConcession,
        tempOffThePlanConcession: tempOffThePlanConcession
      });
    } else {
      // Pensioner concession is higher
      appliedConcession = {
        type: 'Pensioner',
        amount: pensionerConcession.concessionAmount,
        eligible: true,
        reason: pensionerConcession.reason,
        showBothConcessions: false,
        firstHomeConcession: firstHomeConcession,
        pprConcession: pprConcession,
        pensionerConcession: pensionerConcession,
        tempOffThePlanConcession: tempOffThePlanConcession
      };
      // Add the lower first home buyer concession to ineligible
      ineligibleConcessions.push({
        type: 'First Home Buyer',
        amount: firstHomeConcession.concessionAmount,
        eligible: false,
        reason: 'Only one concession can be applied',
        showBothConcessions: false,
        firstHomeConcession: firstHomeConcession,
        pprConcession: pprConcession,
        pensionerConcession: pensionerConcession,
        tempOffThePlanConcession: tempOffThePlanConcession
      });
    }
  } else if (isFirstHomeBuyerEligible) {
    appliedConcession = {
      type: 'First Home Buyer',
      amount: firstHomeConcession.concessionAmount,
      eligible: true,
      reason: firstHomeConcession.reason,
      showBothConcessions: false,
      firstHomeConcession: firstHomeConcession,
      pprConcession: pprConcession,
      pensionerConcession: pensionerConcession,
      tempOffThePlanConcession: tempOffThePlanConcession
    };
  } else if (isPensionerEligible) {
    appliedConcession = {
      type: 'Pensioner',
      amount: pensionerConcession.concessionAmount,
      eligible: true,
      reason: pensionerConcession.reason,
      showBothConcessions: false,
      firstHomeConcession: firstHomeConcession,
      pprConcession: pprConcession,
      pensionerConcession: pensionerConcession,
      tempOffThePlanConcession: tempOffThePlanConcession
    };
  } else if (pprConcession.eligible) {
    appliedConcession = {
      type: 'PPR',
      amount: pprConcession.concessionAmount,
      eligible: true,
      reason: pprConcession.reason,
      showBothConcessions: false,
      firstHomeConcession: firstHomeConcession,
      pprConcession: pprConcession,
      pensionerConcession: pensionerConcession,
      tempOffThePlanConcession: tempOffThePlanConcession
    };
  }
  
  // Handle cases where concessions are eligible but not applied due to priority rules
  // (e.g., pension concession for off-the-plan properties when Temp Off-The-Plan takes priority)
  if (buyerData.hasPensionCard === 'yes' && 
      buyerData.buyerType === 'owner-occupier' && 
      buyerData.isPPR === 'yes' && 
      propertyData.propertyType === 'off-the-plan' &&
      buyerData.sellerQuestionsComplete &&
      isTempOffThePlanEligible && 
      tempOffThePlanConcession.concessionAmount > 0) {
    
    // If Temp Off-The-Plan concession is applied, add pension concession to ineligible
    // regardless of whether pension concession is technically eligible or not
    ineligibleConcessions.push({
      type: 'Pensioner',
      amount: 0,
      eligible: false,
      reason: 'Only one concession can be applied',
      showBothConcessions: false,
      firstHomeConcession: firstHomeConcession,
      pprConcession: pprConcession,
      pensionerConcession: pensionerConcession,
      tempOffThePlanConcession: tempOffThePlanConcession
    });
  }
  
  // Calculate foreign purchaser duty
  const foreignDutyResult = calculateVICForeignPurchaserDuty(buyerData, propertyData, selectedState);
  
  // Calculate first home owners grant
  const grantResult = calculateVICFirstHomeOwnersGrant(buyerData, propertyData, selectedState);
  
  // Calculate net state duty
  const netStateDuty = stampDutyAmount + (foreignDutyResult.applicable ? foreignDutyResult.amount : 0) - (appliedConcession ? appliedConcession.amount : 0);
  
  // Calculate total upfront costs (including property price if no loan needed)
  const propertyPrice = (buyerData.needsLoan === 'no') ? price : 0;
  const totalUpfrontCosts = netStateDuty + propertyPrice - (grantResult.eligible ? grantResult.amount : 0);
  
  return {
    stampDuty: { amount: stampDutyAmount, label: "Stamp Duty" },
    concessions: appliedConcession ? [appliedConcession] : [],
    ineligibleConcessions: ineligibleConcessions,
    grants: grantResult.eligible ? [grantResult] : [],
    foreignDuty: { 
      amount: foreignDutyResult.applicable ? foreignDutyResult.amount : 0, 
      applicable: foreignDutyResult.applicable 
    },
    netStateDuty: netStateDuty,
    totalUpfrontCosts: totalUpfrontCosts,
    // Include all concession data for display purposes
    allConcessions: {
      firstHome: firstHomeConcession,
      ppr: pprConcession,
      pensioner: pensionerConcession,
      tempOffThePlan: tempOffThePlanConcession
    },
    // Always include temp concession in concessions array if eligible, even if not applied
    tempConcessionEligible: tempOffThePlanConcession.eligible
  };
};

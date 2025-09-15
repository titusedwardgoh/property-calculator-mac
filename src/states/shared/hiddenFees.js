// Hidden fees and additional costs calculations

// Legal and conveyancing fees
export const calculateLegalFees = (price, propertyType = 'existing') => {
  // Base fees by property type and service type
  const baseFees = {
    'existing': {
      conveyancer: {
        low: 800,
        medium: 1000,
        high: 1500
      },
      solicitor: {
        low: 1500,
        medium: 2000,
        high: 2500
      }
    },
    'off-the-plan': {
      conveyancer: {
        low: 1200,
        medium: 1500,
        high: 2000
      },
      solicitor: {
        low: 2000,
        medium: 2500,
        high: 3000
      }
    }
  };
  
  const fees = baseFees[propertyType] || baseFees.existing;
  
  // Determine fee tier based on property price
  let feeTier;
  if (price < 500000) feeTier = 'low';
  else if (price < 1000000) feeTier = 'medium';
  else feeTier = 'high';
  
  // Return average of conveyancer and solicitor fees
  const conveyancerFee = fees.conveyancer[feeTier];
  const solicitorFee = fees.solicitor[feeTier];
  
  return Math.round((conveyancerFee + solicitorFee) / 2);
};

// Building and pest inspection fees
export const calculateInspectionFees = (price, propertyCategory = 'house') => {
  let baseFee = 400;
  
  // Adjust based on property price
  if (price < 500000) baseFee = 400;
  else if (price < 1000000) baseFee = 600;
  else baseFee = 800;
  
  // Adjust based on property category
  if (propertyCategory === 'apartment') baseFee += 100; // More complex
  else if (propertyCategory === 'land') baseFee = 200; // Land survey only
  
  return baseFee;
};

// Council rates (annual)
export const calculateCouncilRates = (price, state = 'NSW') => {
  // Council rates vary by state and council area
  // Typically 0.3% to 0.6% of property value annually
  const stateRates = {
    'NSW': 0.004, // 0.4% average
    'VIC': 0.0035, // 0.35% average
    'QLD': 0.0045, // 0.45% average
    'SA': 0.003, // 0.3% average
    'WA': 0.004, // 0.4% average
    'TAS': 0.0035, // 0.35% average
    'NT': 0.004, // 0.4% average
    'ACT': 0.0045 // 0.45% average
  };
  
  const rate = stateRates[state] || 0.004;
  return Math.round(price * rate);
};

// Water rates (annual)
export const calculateWaterRates = (price, state = 'NSW') => {
  // Water rates vary by state and usage
  const stateRates = {
    'NSW': { base: 900, perMillion: 0.0001 },
    'VIC': { base: 800, perMillion: 0.00008 },
    'QLD': { base: 1000, perMillion: 0.00012 },
    'SA': { base: 850, perMillion: 0.00009 },
    'WA': { base: 950, perMillion: 0.00011 },
    'TAS': { base: 750, perMillion: 0.00007 },
    'NT': { base: 1100, perMillion: 0.00013 },
    'ACT': { base: 900, perMillion: 0.0001 }
  };
  
  const rate = stateRates[state] || stateRates['NSW'];
  return Math.round(rate.base + (price * rate.perMillion));
};

// Body corporate fees (annual)
export const calculateBodyCorporate = (price, propertyCategory, state = 'NSW') => {
  // Body corporate fees vary significantly by property type and location
  if (propertyCategory === 'house' || propertyCategory === 'land') {
    return 0; // Houses and land typically don't have body corporate
  }
  
  if (propertyCategory === 'apartment') {
    // Base fee plus per-unit cost
    const baseFee = 3000;
    const perUnitCost = price * 0.002; // 0.2% of property value
    return Math.round(baseFee + perUnitCost);
  }
  
  if (propertyCategory === 'townhouse') {
    // Townhouses have lower fees than apartments
    const baseFee = 2000;
    const perUnitCost = price * 0.001; // 0.1% of property value
    return Math.round(baseFee + perUnitCost);
  }
  
  return 0;
};

// Insurance costs (annual)
export const calculateInsuranceCosts = (price, propertyCategory, state = 'NSW') => {
  // Insurance varies by property type and location
  let baseRate = 0.002; // 0.2% base rate
  
  // Adjust for property category
  if (propertyCategory === 'apartment') baseRate = 0.0015; // Lower for apartments
  else if (propertyCategory === 'land') baseRate = 0.0005; // Much lower for land
  
  // Adjust for state (some states have higher insurance costs)
  const stateMultipliers = {
    'NSW': 1.0,
    'VIC': 1.1,
    'QLD': 1.2, // Higher due to natural disasters
    'SA': 1.0,
    'WA': 1.1,
    'TAS': 0.9, // Lower risk
    'NT': 1.3, // Higher due to cyclones
    'ACT': 1.0
  };
  
  const multiplier = stateMultipliers[state] || 1.0;
  return Math.round(price * baseRate * multiplier);
};

// Moving and removal costs
export const calculateMovingCosts = (propertyType, distance = 'local') => {
  const baseCosts = {
    'local': {
      'apartment': 800,
      'house': 1200,
      'land': 0
    },
    'interstate': {
      'apartment': 2500,
      'house': 4000,
      'land': 0
    }
  };
  
  return baseCosts[distance]?.[propertyType] || baseCosts.local[propertyType] || 0;
};

// Utility connection fees
export const calculateUtilityConnections = (propertyType, isNewProperty = false) => {
  let totalCost = 0;
  
  if (isNewProperty) {
    // New properties need utility connections
    totalCost += 500; // Electricity
    totalCost += 300; // Gas
    totalCost += 400; // Water
    totalCost += 200; // Internet
  } else {
    // Existing properties may have transfer fees
    totalCost += 100; // Electricity transfer
    totalCost += 80;  // Gas transfer
    totalCost += 120; // Water transfer
    totalCost += 50;  // Internet transfer
  }
  
  return totalCost;
};

// Calculate total hidden fees
export const calculateTotalHiddenFees = (price, propertyType, propertyCategory, state, isNewProperty = false) => {
  const legalFees = calculateLegalFees(price, propertyType);
  const inspectionFees = calculateInspectionFees(price, propertyCategory);
  const councilRates = calculateCouncilRates(price, state);
  const waterRates = calculateWaterRates(price, state);
  const bodyCorporate = calculateBodyCorporate(price, propertyCategory, state);
  const insurance = calculateInsuranceCosts(price, propertyCategory, state);
  const movingCosts = calculateMovingCosts(propertyCategory);
  const utilityConnections = calculateUtilityConnections(propertyCategory, isNewProperty);
  
  return {
    legalFees,
    inspectionFees,
    councilRates,
    waterRates,
    bodyCorporate,
    insurance,
    movingCosts,
    utilityConnections,
    total: legalFees + inspectionFees + councilRates + waterRates + bodyCorporate + insurance + movingCosts + utilityConnections
  };
};

// Calculate ongoing annual costs
export const calculateAnnualOngoingCosts = (price, propertyCategory, state) => {
  const councilRates = calculateCouncilRates(price, state);
  const waterRates = calculateWaterRates(price, state);
  const bodyCorporate = calculateBodyCorporate(price, propertyCategory, state);
  const insurance = calculateInsuranceCosts(price, propertyCategory, state);
  
  return {
    councilRates,
    waterRates,
    bodyCorporate,
    insurance,
    total: councilRates + waterRates + bodyCorporate + insurance
  };
};

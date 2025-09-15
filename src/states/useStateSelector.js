import { useState, useEffect } from 'react';

// Import state-specific functions
import { calculateNSWStampDuty, calculateNSWFirstHomeOwnersGrant, calculateNSWFirstHomeBuyersAssistance, calculateNSWForeignPurchaserDuty, calculateUpfrontCosts as calculateNSWUpfrontCosts } from './nsw/calculations.js';
import { calculateVICStampDuty, calculateVICFirstHomeOwnersGrant, calculateVICForeignPurchaserDuty, calculateVICFirstHomeBuyerDutyConcession, calculateVICPPRConcession, calculateVICPensionConcession, calculateVICTempOffThePlanConcession, calculateUpfrontCosts as calculateVICUpfrontCosts } from './vic/calculations.js';
import { calculateQLDStampDuty, calculateQLDFirstHomeOwnersGrant, calculateQLDHomeConcession, calculateQLDFirstHomeConcession, calculateQLDFirstHomeNewConcession, calculateQLDFirstHomeVacantLandConcession, calculateQLDForeignBuyerDuty, calculateUpfrontCosts as calculateQLDUpfrontCosts } from './qld/calculations.js';
import { calculateSAStampDuty, calculateSAFirstHomeOwnersGrant, calculateSAFirstHomeBuyerConcession, calculateSAForeignBuyerDuty, calculateUpfrontCosts as calculateSAUpfrontCosts } from './sa/calculations.js';
import { calculateWAStampDuty, calculateWAFirstHomeOwnersGrant, calculateWAFirstHomeOwnerConcession, calculateWAOffThePlanConcession, calculateWAForeignBuyerDuty, calculateUpfrontCosts as calculateWAUpfrontCosts } from './wa/calculations.js';
import { calculateTASStampDuty, calculateTASFirstHomeOwnersGrant, calculateTASFirstHomeDutyRelief, calculateTASForeignBuyerDuty, calculateUpfrontCosts as calculateTASUpfrontCosts } from './tas/calculations.js';
import { calculateACTStampDuty, calculateACTOffThePlanExemption, calculateUpfrontCosts as calculateACTUpfrontCosts } from './act/calculations.js';
import { calculateNTStampDuty, calculateNTHomeGrownTerritoryGrant, calculateNTFreshStartGrant, calculateNTHouseAndLandConcession, calculateUpfrontCosts as calculateNTUpfrontCosts } from './nt/calculations.js';

// Import shared functions only (these exist)
import { 
  calculateMonthlyRepayment, 
  calculateTotalRepayments, 
  calculateLMI
} from './shared/loanCalculations.js';

import { 
  calculateLegalFees,
  calculateInspectionFees,
  calculateCouncilRates,
  calculateWaterRates,
  calculateBodyCorporate
} from './shared/hiddenFees.js';

export const useStateSelector = (selectedState) => {
  // Use appropriate stamp duty function based on selected state
  const getStampDutyFunction = () => {
    switch (selectedState) {
      case 'NSW':
        return calculateNSWStampDuty;
      case 'VIC':
        return calculateVICStampDuty;
      case 'QLD':
        return calculateQLDStampDuty;
      case 'SA':
        return calculateSAStampDuty;
      case 'WA':
        return calculateWAStampDuty;
      case 'TAS':
        return calculateTASStampDuty;
      case 'ACT':
        return calculateACTStampDuty;
      case 'NT':
        return calculateNTStampDuty;
      default:
        return () => 0; // Placeholder for other states
    }
  };

  // Get NSW First Home Owners Grant function if NSW is selected
  const getNSWFirstHomeOwnersGrantFunction = () => {
    if (selectedState === 'NSW') {
      return calculateNSWFirstHomeOwnersGrant;
    }
    return null;
  };

  // Get VIC First Home Owners Grant function if VIC is selected
  const getVICFirstHomeOwnersGrantFunction = () => {
    if (selectedState === 'VIC') {
      return calculateVICFirstHomeOwnersGrant;
    }
    return null;
  };
  
  const stateFunctions = {
    calculateStampDuty: getStampDutyFunction(),
    calculateNSWFirstHomeOwnersGrant: getNSWFirstHomeOwnersGrantFunction(),
    calculateVICFirstHomeOwnersGrant: getVICFirstHomeOwnersGrantFunction(),
    calculateQLDFirstHomeOwnersGrant: selectedState === 'QLD' ? calculateQLDFirstHomeOwnersGrant : null,
    calculateSAFirstHomeOwnersGrant: selectedState === 'SA' ? calculateSAFirstHomeOwnersGrant : null,
    calculateSAFirstHomeBuyerConcession: selectedState === 'SA' ? calculateSAFirstHomeBuyerConcession : null,
    calculateSAForeignBuyerDuty: selectedState === 'SA' ? calculateSAForeignBuyerDuty : null,
    calculateTASFirstHomeOwnersGrant: selectedState === 'TAS' ? calculateTASFirstHomeOwnersGrant : null,
    calculateTASFirstHomeDutyRelief: selectedState === 'TAS' ? calculateTASFirstHomeDutyRelief : null,
    calculateTASForeignBuyerDuty: selectedState === 'TAS' ? calculateTASForeignBuyerDuty : null,
    calculateNTHomeGrownTerritoryGrant: selectedState === 'NT' ? calculateNTHomeGrownTerritoryGrant : null,
    calculateNTFreshStartGrant: selectedState === 'NT' ? calculateNTFreshStartGrant : null,
    calculateNTHouseAndLandConcession: selectedState === 'NT' ? calculateNTHouseAndLandConcession : null,
    calculateWAFirstHomeOwnersGrant: selectedState === 'WA' ? calculateWAFirstHomeOwnersGrant : null,
    calculateWAFirstHomeOwnerConcession: selectedState === 'WA' ? calculateWAFirstHomeOwnerConcession : null,
    calculateWAOffThePlanConcession: selectedState === 'WA' ? calculateWAOffThePlanConcession : null,
    calculateQLDHomeConcession: selectedState === 'QLD' ? calculateQLDHomeConcession : null,
    calculateQLDFirstHomeConcession: selectedState === 'QLD' ? calculateQLDFirstHomeConcession : null,
    calculateQLDFirstHomeNewConcession: selectedState === 'QLD' ? calculateQLDFirstHomeNewConcession : null,
    calculateQLDFirstHomeVacantLandConcession: selectedState === 'QLD' ? calculateQLDFirstHomeVacantLandConcession : null,
    calculateQLDForeignBuyerDuty: selectedState === 'QLD' ? calculateQLDForeignBuyerDuty : null,
    calculateNSWFirstHomeBuyersAssistance: selectedState === 'NSW' ? calculateNSWFirstHomeBuyersAssistance : null,
    calculateVICFirstHomeBuyerDutyConcession: selectedState === 'VIC' ? calculateVICFirstHomeBuyerDutyConcession : null,
    calculateVICPPRConcession: selectedState === 'VIC' ? calculateVICPPRConcession : null,
    calculateVICPensionConcession: selectedState === 'VIC' ? calculateVICPensionConcession : null,
    calculateVICTempOffThePlanConcession: selectedState === 'VIC' ? calculateVICTempOffThePlanConcession : null,
    calculateACTOffThePlanExemption: selectedState === 'ACT' ? calculateACTOffThePlanExemption : null,
    calculateNSWForeignPurchaserDuty: selectedState === 'NSW' ? calculateNSWForeignPurchaserDuty : null,
    calculateVICForeignPurchaserDuty: selectedState === 'VIC' ? calculateVICForeignPurchaserDuty : null,
    calculateWAForeignBuyerDuty: selectedState === 'WA' ? calculateWAForeignBuyerDuty : null,
    // New comprehensive upfront costs calculation
    calculateUpfrontCosts: selectedState === 'NSW' ? calculateNSWUpfrontCosts : 
                          selectedState === 'VIC' ? calculateVICUpfrontCosts :
                          selectedState === 'QLD' ? calculateQLDUpfrontCosts :
                          selectedState === 'SA' ? calculateSAUpfrontCosts :
                          selectedState === 'WA' ? calculateWAUpfrontCosts :
                          selectedState === 'TAS' ? calculateTASUpfrontCosts :
                          selectedState === 'ACT' ? calculateACTUpfrontCosts :
                          selectedState === 'NT' ? calculateNTUpfrontCosts : null,
    // Shared functions that exist
    calculateMonthlyRepayment,
    calculateTotalRepayments,
    calculateLMI,
    calculateLegalFees,
    calculateInspectionFees,
    calculateCouncilRates,
    calculateWaterRates,
    calculateBodyCorporate
  };
  
  const stateConstants = {
    stateAverage: selectedState === 'NSW' ? 1200000 : 
                 selectedState === 'VIC' ? 900000 : 
                 selectedState === 'QLD' ? 650000 : 
                 selectedState === 'SA' ? 600000 : 
                 selectedState === 'WA' ? 550000 : 
                 selectedState === 'TAS' ? 450000 : 
                 selectedState === 'ACT' ? 800000 : 
                 selectedState === 'NT' ? 500000 : 800000,
    pprRequirement: selectedState === 'NSW' ? 'Must live for 6 months within 12 months of settlement' : 
                   selectedState === 'VIC' ? 'Must live for 12 months within 12 months of settlement' : 
                   selectedState === 'QLD' ? 'Must live for 6 months within 12 months of settlement' :
                   selectedState === 'SA' ? 'Must live for 6 months within 12 months of settlement' :
                   selectedState === 'WA' ? 'Must live for 6 months within 12 months of settlement' :
                   selectedState === 'TAS' ? 'Must live for 6 months within 12 months of settlement' :
                   selectedState === 'ACT' ? 'Must live for 12 months within 12 months of settlement' :
                   selectedState === 'NT' ? 'Must live for 12 months within 12 months of settlement' :
                   'Placeholder requirement',
    foreignBuyerRate: selectedState === 'VIC' ? 0.08 : 
                     selectedState === 'QLD' ? 0.07 : 
                     selectedState === 'SA' ? 0.07 : 
                     selectedState === 'WA' ? 0.07 : 
                     selectedState === 'TAS' ? 0.08 : 
                     selectedState === 'ACT' ? 0.08 : 
                     selectedState === 'NT' ? 0.07 : 0.08,
    firstHomeOwnersGrant: selectedState === 'NSW' ? 10000 : 
                         selectedState === 'VIC' ? 10000 : 
                         selectedState === 'QLD' ? 30000 : 
                         selectedState === 'SA' ? 15000 : 
                         selectedState === 'WA' ? 10000 : 
                         selectedState === 'TAS' ? 10000 : 
                         selectedState === 'ACT' ? 7000 : 
                         selectedState === 'NT' ? 10000 : 10000
  };

  return {
    stateFunctions,
    stateConstants,
    isLoading: false
  };
};

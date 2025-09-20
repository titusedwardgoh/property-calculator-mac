import React from 'react';
import { calculateNTStampDuty } from './calculations.js';

// Reusable tooltip component for NT concessions
const ConcessionTooltip = ({ reason, children }) => (
  <span className="text-gray-600 text-sm md:text-xs lg:text-sm xl:text-lg text-red-600 relative group cursor-help" title={reason}>
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
      {reason}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
    </div>
  </span>
);

// NT-specific ineligible grants from results
const NTIneligibleGrants = ({ upfrontCosts }) => {
  if (!upfrontCosts.ineligibleGrants || upfrontCosts.ineligibleGrants.length === 0) {
    return null;
  }

  return (
    <>
      {upfrontCosts.ineligibleGrants.map((grant, index) => (
        <div key={index} className="flex justify-between items-center">
          <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
            {grant.grantType === 'FreshStart' ? 'FreshStart Grant' : 'HomeGrown Territory Grant'}
          </span>
          <ConcessionTooltip reason={grant.reason}>
            Not Eligible
          </ConcessionTooltip>
        </div>
      ))}
    </>
  );
};

// NT-specific ineligible concessions from results
const NTIneligibleConcessions = ({ upfrontCosts }) => {
  if (!upfrontCosts.ineligibleConcessions || upfrontCosts.ineligibleConcessions.length === 0) {
    return null;
  }

  return (
    <>
      {upfrontCosts.ineligibleConcessions.map((concession, index) => (
        <div key={`concession-${index}`} className="flex justify-between items-center">
          <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
            {concession.type === 'House and Land' ? 'House and Land Concession' : concession.type}
          </span>
          <ConcessionTooltip reason={concession.reason}>
            Not Eligible
          </ConcessionTooltip>
        </div>
      ))}
    </>
  );
};

// NT-specific fallback when no grants/concessions and no ineligible items from calculation
const NTFallbackItems = ({ upfrontCosts, formData, stateFunctions, calculateStampDuty }) => {
  // Only show fallback if no grants and no ineligible items from calculation
  if (upfrontCosts.grants.length > 0 || 
      (upfrontCosts.ineligibleGrants && upfrontCosts.ineligibleGrants.length > 0)) {
    return null;
  }

  const buyerData = {
    buyerType: formData.buyerType,
    isPPR: formData.isPPR,
    isAustralianResident: formData.isAustralianResident,
    isFirstHomeBuyer: formData.isFirstHomeBuyer,
    hasPensionCard: formData.hasPensionCard
  };
  
  const propertyData = {
    propertyPrice: formData.propertyPrice,
    propertyType: formData.propertyType,
    propertyCategory: formData.propertyCategory
  };
  
  const homeGrownResult = stateFunctions?.calculateNTHomeGrownTerritoryGrant ? 
    stateFunctions.calculateNTHomeGrownTerritoryGrant(buyerData, propertyData, formData.selectedState) : 
    { reason: 'Grant not available' };
    
  const freshStartResult = stateFunctions?.calculateNTFreshStartGrant ? 
    stateFunctions.calculateNTFreshStartGrant(buyerData, propertyData, formData.selectedState) : 
    { reason: 'Grant not available' };
    
  const houseAndLandResult = stateFunctions?.calculateNTHouseAndLandConcession ? 
    stateFunctions.calculateNTHouseAndLandConcession(buyerData, propertyData, formData.selectedState, calculateNTStampDuty(parseInt(formData.propertyPrice) || 0, formData.selectedState)) : 
    { reason: 'Concession not available' };

  return (
    <>
      <div className="flex justify-between items-center">
        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">HomeGrown Territory Grant</span>
        <ConcessionTooltip reason={homeGrownResult.reason}>
          Not Eligible
        </ConcessionTooltip>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">FreshStart Grant</span>
        <ConcessionTooltip reason={freshStartResult.reason}>
          Not Eligible
        </ConcessionTooltip>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">House and Land Concession</span>
        <ConcessionTooltip reason={houseAndLandResult.reason}>
          Not Eligible
        </ConcessionTooltip>
      </div>
    </>
  );
};

// Main NT component
export const NTIneligibleItems = ({ upfrontCosts, formData, stateFunctions, calculateStampDuty }) => {
  // Only show if NT is selected
  if (formData.selectedState !== 'NT') {
    return null;
  }

  return (
    <>
      <NTIneligibleGrants upfrontCosts={upfrontCosts} />
      <NTIneligibleConcessions upfrontCosts={upfrontCosts} />
      <NTFallbackItems 
        upfrontCosts={upfrontCosts} 
        formData={formData} 
        stateFunctions={stateFunctions}
        calculateStampDuty={calculateStampDuty}
      />
    </>
  );
};

// Helper function to check if NT has ineligible items to show
export const hasNTIneligibleItems = (upfrontCosts, formData) => {
  return formData.selectedState === 'NT' && (
    upfrontCosts.grants.length === 0 || 
    (upfrontCosts.ineligibleGrants && upfrontCosts.ineligibleGrants.length > 0) || 
    (upfrontCosts.ineligibleConcessions && upfrontCosts.ineligibleConcessions.length > 0)
  );
};

// Helper function to check if NT has actual items to display
export const hasNTActualItems = (upfrontCosts, formData) => {
  return formData.selectedState === 'NT' && (
    upfrontCosts.grants.length === 0 || 
    (upfrontCosts.ineligibleGrants && upfrontCosts.ineligibleGrants.length > 0) || 
    (upfrontCosts.ineligibleConcessions && upfrontCosts.ineligibleConcessions.length > 0)
  );
};

// Main NT state component that handles all NT-specific rendering
export const NTStateComponent = ({ upfrontCosts, formData, stateFunctions, calculateStampDuty }) => {
  if (formData.selectedState !== 'NT') {
    return null;
  }

  return (
    <NTIneligibleItems 
      upfrontCosts={upfrontCosts} 
      formData={formData} 
      stateFunctions={stateFunctions}
      calculateStampDuty={calculateStampDuty}
    />
  );
};

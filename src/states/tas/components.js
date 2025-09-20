import React from 'react';

// Reusable tooltip component for TAS concessions
const ConcessionTooltip = ({ reason, children }) => (
  <span className="text-gray-600 text-sm md:text-xs lg:text-sm xl:text-lg text-red-600 relative group cursor-help" title={reason}>
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
      {reason}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
    </div>
  </span>
);

// TAS-specific ineligible concessions component
const TASIneligibleConcessions = ({ upfrontCosts, formData, stateFunctions, calculateStampDuty }) => {
  if (formData.selectedState !== 'TAS' || upfrontCosts.concessions.length > 0) {
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
  
  const stampDutyAmount = calculateStampDuty();
  const concessionResult = stateFunctions?.calculateTASFirstHomeDutyRelief ? 
    stateFunctions.calculateTASFirstHomeDutyRelief(buyerData, propertyData, formData.selectedState, stampDutyAmount) : 
    { reason: 'Concession not available' };

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">First Home Duty Relief</span>
      <ConcessionTooltip reason={concessionResult.reason}>
        Not Eligible
      </ConcessionTooltip>
    </div>
  );
};

// TAS-specific ineligible grants component
const TASIneligibleGrants = ({ upfrontCosts, formData, stateFunctions }) => {
  if (formData.selectedState !== 'TAS' || upfrontCosts.grants.length > 0) {
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
  
  const grantResult = stateFunctions?.calculateTASFirstHomeOwnersGrant ? 
    stateFunctions.calculateTASFirstHomeOwnersGrant(buyerData, propertyData, formData.selectedState) : 
    { reason: 'Grant not available' };

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">First Home Owners Grant</span>
      <ConcessionTooltip reason={grantResult.reason}>
        Not Eligible
      </ConcessionTooltip>
    </div>
  );
};

// Main TAS ineligible items component
export const TASIneligibleItems = ({ upfrontCosts, formData, stateFunctions, calculateStampDuty }) => {
  // Only show if TAS is selected
  if (formData.selectedState !== 'TAS') {
    return null;
  }

  return (
    <>
      <TASIneligibleConcessions 
        upfrontCosts={upfrontCosts} 
        formData={formData} 
        stateFunctions={stateFunctions}
        calculateStampDuty={calculateStampDuty}
      />
      <TASIneligibleGrants 
        upfrontCosts={upfrontCosts} 
        formData={formData} 
        stateFunctions={stateFunctions}
      />
    </>
  );
};

// Helper function to check if TAS has ineligible items to show
export const hasTASIneligibleItems = (upfrontCosts, formData) => {
  return formData.selectedState === 'TAS' && upfrontCosts.grants.length === 0;
};

// Helper function to check if TAS has actual items to display
export const hasTASActualItems = (upfrontCosts, formData) => {
  return formData.selectedState === 'TAS' && (upfrontCosts.concessions.length === 0 || upfrontCosts.grants.length === 0);
};

// Main TAS state component that handles all TAS-specific rendering
export const TASStateComponent = ({ upfrontCosts, formData, stateFunctions, calculateStampDuty }) => {
  if (formData.selectedState !== 'TAS') {
    return null;
  }

  return (
    <TASIneligibleItems 
      upfrontCosts={upfrontCosts} 
      formData={formData} 
      stateFunctions={stateFunctions}
      calculateStampDuty={calculateStampDuty}
    />
  );
};

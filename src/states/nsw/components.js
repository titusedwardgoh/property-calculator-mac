import React from 'react';

// Reusable tooltip component for NSW concessions
const ConcessionTooltip = ({ reason, children }) => (
  <span className="text-gray-600 text-sm md:text-xs lg:text-sm xl:text-lg text-red-600 relative group cursor-help" title={reason}>
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
      {reason}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
    </div>
  </span>
);

// NSW-specific ineligible concessions component
const NSWIneligibleConcessions = ({ upfrontCosts, formData, stateFunctions, calculateStampDuty }) => {
  if (formData.selectedState !== 'NSW' || upfrontCosts.concessions.length > 0) {
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
  const concessionResult = stateFunctions?.calculateNSWFirstHomeBuyersAssistance ? 
    stateFunctions.calculateNSWFirstHomeBuyersAssistance(buyerData, propertyData, formData.selectedState, stampDutyAmount) : 
    { reason: 'Concession not available' };

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">Stamp Duty Concession</span>
      <ConcessionTooltip reason={concessionResult.reason}>
        Not Eligible
      </ConcessionTooltip>
    </div>
  );
};

// Main NSW ineligible items component
export const NSWIneligibleItems = ({ upfrontCosts, formData, stateFunctions, calculateStampDuty }) => {
  // Only show if NSW is selected
  if (formData.selectedState !== 'NSW') {
    return null;
  }

  return (
    <NSWIneligibleConcessions 
      upfrontCosts={upfrontCosts} 
      formData={formData} 
      stateFunctions={stateFunctions}
      calculateStampDuty={calculateStampDuty}
    />
  );
};

// Helper function to check if NSW has ineligible items to show
export const hasNSWIneligibleItems = (upfrontCosts, formData) => {
  return formData.selectedState === 'NSW' && upfrontCosts.concessions.length === 0;
};

// Helper function to check if NSW has actual items to display
export const hasNSWActualItems = (upfrontCosts, formData) => {
  return formData.selectedState === 'NSW' && upfrontCosts.concessions.length === 0;
};

// Main NSW state component that handles all NSW-specific rendering
export const NSWStateComponent = ({ upfrontCosts, formData, stateFunctions, calculateStampDuty }) => {
  if (formData.selectedState !== 'NSW') {
    return null;
  }

  return (
    <NSWIneligibleItems 
      upfrontCosts={upfrontCosts} 
      formData={formData} 
      stateFunctions={stateFunctions}
      calculateStampDuty={calculateStampDuty}
    />
  );
};

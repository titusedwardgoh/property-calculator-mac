import React from 'react';

// Reusable tooltip component for SA concessions
const ConcessionTooltip = ({ reason, children }) => (
  <span className="text-gray-600 text-sm md:text-xs lg:text-sm xl:text-lg text-red-600 relative group cursor-help" title={reason}>
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
      {reason}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
    </div>
  </span>
);

// SA-specific ineligible grants component
const SAIneligibleGrants = ({ upfrontCosts, formData }) => {
  if (formData.selectedState !== 'SA' || !upfrontCosts.allGrants || upfrontCosts.allGrants.firstHomeOwners.eligible) {
    return null;
  }

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">First Home Owners Grant</span>
      <ConcessionTooltip reason={upfrontCosts.allGrants.firstHomeOwners.reason}>
        Not Eligible
      </ConcessionTooltip>
    </div>
  );
};

// SA-specific ineligible concessions component
const SAIneligibleConcessions = ({ upfrontCosts, formData }) => {
  if (formData.selectedState !== 'SA' || !upfrontCosts.allConcessions || upfrontCosts.allConcessions.firstHomeBuyer.eligible) {
    return null;
  }

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">First Home Buyer Concession</span>
      <ConcessionTooltip reason={upfrontCosts.allConcessions.firstHomeBuyer.reason}>
        Not Eligible
      </ConcessionTooltip>
    </div>
  );
};

// Main SA component
export const SAIneligibleItems = ({ upfrontCosts, formData }) => {
  // Only show if SA is selected
  if (formData.selectedState !== 'SA') {
    return null;
  }

  return (
    <>
      <SAIneligibleGrants upfrontCosts={upfrontCosts} formData={formData} />
      <SAIneligibleConcessions upfrontCosts={upfrontCosts} formData={formData} />
    </>
  );
};

// Helper function to check if SA has ineligible items to show
export const hasSAIneligibleItems = (upfrontCosts, formData) => {
  return formData.selectedState === 'SA' && upfrontCosts.allConcessions;
};

// Helper function to check if SA has actual items to display
export const hasSAActualItems = (upfrontCosts, formData) => {
  return formData.selectedState === 'SA' && (
    (upfrontCosts.allGrants && !upfrontCosts.allGrants.firstHomeOwners.eligible) ||
    (upfrontCosts.allConcessions && !upfrontCosts.allConcessions.firstHomeBuyer.eligible)
  );
};

// Main SA state component that handles all SA-specific rendering
export const SAStateComponent = ({ upfrontCosts, formData }) => {
  if (formData.selectedState !== 'SA') {
    return null;
  }

  return (
    <SAIneligibleItems upfrontCosts={upfrontCosts} formData={formData} />
  );
};

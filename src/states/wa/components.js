import React from 'react';

// Reusable tooltip component for WA concessions
const ConcessionTooltip = ({ reason, children }) => (
  <span className="text-gray-600 text-sm md:text-xs lg:text-sm xl:text-lg text-red-600 relative group cursor-help" title={reason}>
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
      {reason}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
    </div>
  </span>
);

// WA-specific ineligible grants component
const WAIneligibleGrants = ({ upfrontCosts, formData }) => {
  if (formData.selectedState !== 'WA' || !upfrontCosts.allGrants || upfrontCosts.allGrants.firstHomeOwners.eligible) {
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

// WA-specific ineligible concessions from calculation results
const WAIneligibleConcessionsFromResults = ({ upfrontCosts }) => {
  if (!upfrontCosts.ineligibleConcessions || upfrontCosts.ineligibleConcessions.length === 0) {
    return null;
  }

  return (
    <>
      {upfrontCosts.ineligibleConcessions.map((concession, index) => (
        <div key={`ineligible-${index}`} className="flex justify-between items-center">
          <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
            {concession.type === 'First Home Owner' ? 'First Home Owner Concession' : 
             concession.type === 'Off-The-Plan' ? 'Off-The-Plan Concession' :
             concession.type === 'Home Buyer Concession' ? 'Home Buyer Concession' :
             `Stamp Duty Concession${concession.type ? ` (${concession.type})` : ''}`}
          </span>
          <ConcessionTooltip reason={concession.reason}>
            Not Eligible
          </ConcessionTooltip>
        </div>
      ))}
    </>
  );
};

// WA-specific individual concession checks
const WAIndividualConcessions = ({ upfrontCosts }) => (
  <>
    {/* Only show First Home Owner Concession if it's NOT eligible and not already in ineligibleConcessions */}
    {!upfrontCosts.allConcessions.firstHomeOwner.eligible && 
     !upfrontCosts.ineligibleConcessions?.some(c => c.type === 'First Home Owner') && (
      <div className="flex justify-between items-center">
        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">First Home Owner Concession</span>
        <ConcessionTooltip reason={upfrontCosts.allConcessions.firstHomeOwner.reason}>
          Not Eligible
        </ConcessionTooltip>
      </div>
    )}
  </>
);

// Main WA ineligible concessions component
export const WAIneligibleConcessions = ({ upfrontCosts, formData }) => {
  // Only show if WA is selected
  if (formData.selectedState !== 'WA') {
    return null;
  }

  return (
    <>
      <WAIneligibleGrants upfrontCosts={upfrontCosts} formData={formData} />
      {upfrontCosts.allConcessions && (
        <>
          <WAIneligibleConcessionsFromResults upfrontCosts={upfrontCosts} />
          <WAIndividualConcessions upfrontCosts={upfrontCosts} />
        </>
      )}
    </>
  );
};

// Helper function to check if WA has ineligible items to show
export const hasWAIneligibleItems = (upfrontCosts, formData) => {
  return formData.selectedState === 'WA' && upfrontCosts.allConcessions;
};

// Helper function to check if WA has actual items to display
export const hasWAActualItems = (upfrontCosts, formData) => {
  return formData.selectedState === 'WA' && (
    (upfrontCosts.allGrants && !upfrontCosts.allGrants.firstHomeOwners.eligible) ||
    (upfrontCosts.allConcessions && (
      (upfrontCosts.ineligibleConcessions && upfrontCosts.ineligibleConcessions.length > 0) ||
      !upfrontCosts.allConcessions.firstHomeOwner.eligible ||
      !upfrontCosts.allConcessions.offThePlan.eligible
    ))
  );
};

// Main WA state component that handles all WA-specific rendering
export const WAStateComponent = ({ upfrontCosts, formData }) => {
  if (formData.selectedState !== 'WA') {
    return null;
  }

  return (
    <WAIneligibleConcessions upfrontCosts={upfrontCosts} formData={formData} />
  );
};

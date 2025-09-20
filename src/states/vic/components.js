import React from 'react';

// Reusable tooltip component for VIC concessions
const ConcessionTooltip = ({ reason, children }) => (
  <span className="text-gray-600 text-sm md:text-xs lg:text-sm xl:text-lg text-red-600 relative group cursor-help" title={reason}>
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
      {reason}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
    </div>
  </span>
);

// VIC-specific ineligible concessions from calculation results
const VICIneligibleConcessionsFromResults = ({ upfrontCosts }) => {
  if (!upfrontCosts.ineligibleConcessions || upfrontCosts.ineligibleConcessions.length === 0) {
    return null;
  }

  return (
    <>
      {upfrontCosts.ineligibleConcessions.map((concession, index) => (
        <div key={`ineligible-${index}`} className="flex justify-between items-center">
          <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
            {concession.type === 'Pensioner' ? 'Pensioner Duty Concession' : 
             concession.type === 'First Home Buyer' ? 'First Home Buyer Concession' :
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

// VIC-specific individual concession checks
const VICIndividualConcessions = ({ upfrontCosts }) => (
  <>
    {/* Only show First Home Buyer Concession if it's NOT eligible */}
    {!upfrontCosts.allConcessions.firstHome.eligible && 
     !upfrontCosts.ineligibleConcessions?.some(c => c.type === 'First Home Buyer') && (
      <div className="flex justify-between items-center">
        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">First Home Buyer Concession</span>
        <ConcessionTooltip reason={upfrontCosts.allConcessions.firstHome.reason}>
          Not Eligible
        </ConcessionTooltip>
      </div>
    )}
    
    {/* Only show PPR Concession if it's NOT eligible */}
    {!upfrontCosts.allConcessions.ppr.eligible && (
      <div className="flex justify-between items-center">
        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">PPR Concession</span>
        <ConcessionTooltip reason={upfrontCosts.allConcessions.ppr.reason}>
          Not Eligible
        </ConcessionTooltip>
      </div>
    )}
    
    {/* Only show Pensioner Concession if it's NOT eligible */}
    {!upfrontCosts.allConcessions.pensioner.eligible && 
     !upfrontCosts.ineligibleConcessions?.some(c => c.type === 'Pensioner') && (
      <div className="flex justify-between items-center">
        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">Pensioner Duty Concession</span>
        <ConcessionTooltip reason={upfrontCosts.allConcessions.pensioner.reason}>
          Not Eligible
        </ConcessionTooltip>
      </div>
    )}
    
    {/* Only show Temp Off-The-Plan Concession if it's NOT eligible */}
    {!upfrontCosts.allConcessions.tempOffThePlan.eligible && (
      <div className="flex justify-between items-center">
        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">Temp Off-The-Plan Concession</span>
        <ConcessionTooltip reason={upfrontCosts.allConcessions.tempOffThePlan.reason}>
          Not Eligible
        </ConcessionTooltip>
      </div>
    )}
  </>
);

// Main VIC ineligible concessions component
export const VICIneligibleConcessions = ({ upfrontCosts, formData }) => {
  // Only show if VIC is selected and has allConcessions data
  if (formData.selectedState !== 'VIC' || !upfrontCosts.allConcessions) {
    return null;
  }

  return (
    <>
      <VICIneligibleConcessionsFromResults upfrontCosts={upfrontCosts} />
      <VICIndividualConcessions upfrontCosts={upfrontCosts} />
    </>
  );
};

// Helper function to check if VIC has ineligible items to show
export const hasVICIneligibleItems = (upfrontCosts, formData) => {
  return formData.selectedState === 'VIC' && upfrontCosts.allConcessions;
};

// Helper function to check if VIC has actual items to display
export const hasVICActualItems = (upfrontCosts, formData) => {
  return formData.selectedState === 'VIC' && upfrontCosts.allConcessions && (
    (upfrontCosts.ineligibleConcessions && upfrontCosts.ineligibleConcessions.length > 0) ||
    !upfrontCosts.allConcessions.firstHome.eligible ||
    !upfrontCosts.allConcessions.ppr.eligible ||
    !upfrontCosts.allConcessions.pensioner.eligible ||
    !upfrontCosts.allConcessions.tempOffThePlan.eligible
  );
};

// Main VIC state component that handles all VIC-specific rendering
export const VICStateComponent = ({ upfrontCosts, formData }) => {
  if (formData.selectedState !== 'VIC') {
    return null;
  }

  return (
    <VICIneligibleConcessions upfrontCosts={upfrontCosts} formData={formData} />
  );
};

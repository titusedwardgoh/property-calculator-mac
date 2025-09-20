import React from 'react';

// Reusable tooltip component for QLD concessions
const ConcessionTooltip = ({ reason, children }) => (
  <span className="text-gray-600 text-sm md:text-xs lg:text-sm xl:text-lg text-red-600 relative group cursor-help" title={reason}>
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
      {reason}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
    </div>
  </span>
);

// QLD-specific ineligible concessions from calculation results
const QLDIneligibleConcessionsFromResults = ({ upfrontCosts }) => {
  if (!upfrontCosts.ineligibleConcessions || upfrontCosts.ineligibleConcessions.length === 0) {
    return null;
  }

  return (
    <>
      {upfrontCosts.ineligibleConcessions.map((concession, index) => (
        <div key={`ineligible-${index}`} className="flex justify-between items-center">
          <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
            {concession.type === 'Home Concession' ? 'Home Concession' : 
             concession.type === 'First Home Concession' ? 'First Home Concession' :
             concession.type === 'First Home (New) Concession' ? 'First Home (New) Concession' :
             concession.type === 'First Home (Vac Land) Concession' ? 'First Home (Vac Land) Concession' :
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

// QLD-specific individual concession checks
const QLDIndividualConcessions = ({ upfrontCosts }) => (
  <>
    {/* Only show First Home (New) Concession if it's NOT eligible */}
    {!upfrontCosts.allConcessions.firstHomeNew.eligible && 
     !upfrontCosts.ineligibleConcessions?.some(c => c.type === 'First Home (New) Concession') && (
      <div className="flex justify-between items-center">
        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">First Home (New) Concession</span>
        <ConcessionTooltip reason={upfrontCosts.allConcessions.firstHomeNew.reason}>
          Not Eligible
        </ConcessionTooltip>
      </div>
    )}
    
    {/* Only show First Home (Vac Land) Concession if it's NOT eligible */}
    {!upfrontCosts.allConcessions.firstHomeVacantLand.eligible && 
     !upfrontCosts.ineligibleConcessions?.some(c => c.type === 'First Home (Vac Land) Concession') && (
      <div className="flex justify-between items-center">
        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">First Home (Vac Land) Concession</span>
        <ConcessionTooltip reason={upfrontCosts.allConcessions.firstHomeVacantLand.reason}>
          Not Eligible
        </ConcessionTooltip>
      </div>
    )}
    
    {/* Only show First Home Concession if it's NOT eligible */}
    {!upfrontCosts.allConcessions.firstHome.eligible && 
     !upfrontCosts.ineligibleConcessions?.some(c => c.type === 'First Home Concession') && (
      <div className="flex justify-between items-center">
        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">First Home Concession</span>
        <ConcessionTooltip reason={upfrontCosts.allConcessions.firstHome.reason}>
          Not Eligible
        </ConcessionTooltip>
      </div>
    )}
    
    {/* Only show Home Concession if it's NOT eligible */}
    {!upfrontCosts.allConcessions.home.eligible && 
     !upfrontCosts.ineligibleConcessions?.some(c => c.type === 'Home Concession') && (
      <div className="flex justify-between items-center">
        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">Home Concession</span>
        <ConcessionTooltip reason={upfrontCosts.allConcessions.home.reason}>
          Not Eligible
        </ConcessionTooltip>
      </div>
    )}
  </>
);

// Main QLD ineligible concessions component
export const QLDIneligibleConcessions = ({ upfrontCosts, formData }) => {
  // Only show if QLD is selected and has allConcessions data
  if (formData.selectedState !== 'QLD' || !upfrontCosts.allConcessions) {
    return null;
  }

  return (
    <>
      <QLDIneligibleConcessionsFromResults upfrontCosts={upfrontCosts} />
      <QLDIndividualConcessions upfrontCosts={upfrontCosts} />
    </>
  );
};

// Helper function to check if QLD has ineligible items to show
export const hasQLDIneligibleItems = (upfrontCosts, formData) => {
  return formData.selectedState === 'QLD' && upfrontCosts.allConcessions;
};

// Helper function to check if QLD has actual items to display
export const hasQLDActualItems = (upfrontCosts, formData) => {
  return formData.selectedState === 'QLD' && upfrontCosts.allConcessions && (
    (upfrontCosts.ineligibleConcessions && upfrontCosts.ineligibleConcessions.length > 0) ||
    !upfrontCosts.allConcessions.home.eligible ||
    !upfrontCosts.allConcessions.firstHome.eligible ||
    !upfrontCosts.allConcessions.firstHomeNew.eligible ||
    !upfrontCosts.allConcessions.firstHomeVacantLand.eligible
  );
};

// Main QLD state component that handles all QLD-specific rendering
export const QLDStateComponent = ({ upfrontCosts, formData }) => {
  if (formData.selectedState !== 'QLD') {
    return null;
  }

  return (
    <QLDIneligibleConcessions upfrontCosts={upfrontCosts} formData={formData} />
  );
};

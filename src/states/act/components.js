import React from 'react';

// ACT-specific UI components for UpfrontCosts

export const ACTIneligibleConcessions = ({ upfrontCosts, formData }) => {
  // Only show if ACT is selected and there are ineligible concessions
  if (formData.selectedState !== 'ACT' || !upfrontCosts.ineligibleConcessions || upfrontCosts.ineligibleConcessions.length === 0) {
    return null;
  }

  return (
    <>
      {upfrontCosts.ineligibleConcessions.map((concession, index) => (
        <div key={`ineligible-${index}`} className="flex justify-between items-center">
          <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
            {concession.type === 'Home Buyer Concession' ? 'Home Buyer Concession' : 
             concession.type === 'Off the Plan Exemption' ? 'Off the Plan Exemption' : 
             concession.type === 'Pensioner Concession' ? 'Pensioner Concession' :
             concession.type === 'Owner Occupier Concession' ? 'Owner Occupier Concession' : concession.type}
          </span>
          <span className="text-gray-600 text-sm md:text-xs lg:text-sm xl:text-lg text-red-600 relative group cursor-help" title={concession.reason}>
            Not Eligible
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
              {concession.reason}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </span>
        </div>
      ))}
    </>
  );
};

// Helper function to check if ACT has ineligible items to show
export const hasACTIneligibleItems = (upfrontCosts, formData) => {
  return formData.selectedState === 'ACT' && 
         upfrontCosts.ineligibleConcessions && 
         upfrontCosts.ineligibleConcessions.length > 0;
};

// Main ACT state component that handles all ACT-specific rendering
export const ACTStateComponent = ({ upfrontCosts, formData }) => {
  if (formData.selectedState !== 'ACT') {
    return null;
  }

  return (
    <ACTIneligibleConcessions upfrontCosts={upfrontCosts} formData={formData} />
  );
};

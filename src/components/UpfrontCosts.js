import { useState, useEffect } from 'react';
import { useStateSelector } from '../states/useStateSelector.js';
import { formatCurrency } from '../states/shared/baseCalculations.js';
import { calculateNTStampDuty } from '../states/nt/calculations.js';

import { useFormStore } from '../stores/formStore';

export default function UpfrontCosts() {
    const formData = useFormStore();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if PropertyDetails form is actually complete (after pressing Complete button)
  const isPropertyComplete = formData.propertyDetailsFormComplete;

  // Get state-specific functions when state is selected
  const { stateFunctions } = useStateSelector(formData.selectedState || 'NSW');

  // Close expanded state when formData changes (navigation occurs)
  useEffect(() => {
    setIsExpanded(false);
  }, [formData]);

  const toggleExpanded = () => {
    if (isPropertyComplete) {
      setIsExpanded(!isExpanded);
    }
  };

  // Calculate stamp duty when property details are complete
  const calculateStampDuty = () => {
    if (!stateFunctions || !formData.propertyPrice || !formData.selectedState || !formData.propertyType) {
      return 0;
    }
    
    const stampDuty = stateFunctions.calculateStampDuty(formData.propertyPrice, formData.selectedState);
    return stampDuty;
  };

  // Calculate all upfront costs using the new comprehensive function
  const calculateAllUpfrontCosts = () => {
    
    if (!formData.buyerDetailsComplete || !stateFunctions?.calculateUpfrontCosts) {
      // Return basic stamp duty calculation when buyer details not complete
      // But check for temp off-the-plan concession if property details are complete
      if (formData.propertyDetailsFormComplete && formData.selectedState === 'VIC' && stateFunctions?.calculateVICTempOffThePlanConcession) {
        const buyerData = {
          selectedState: formData.selectedState || '',
          buyerType: formData.buyerType || '',
          isPPR: formData.isPPR || '',
          isAustralianResident: formData.isAustralianResident || '',
          isFirstHomeBuyer: formData.isFirstHomeBuyer || '',
          ownedPropertyLast5Years: formData.ownedPropertyLast5Years || '',
          hasPensionCard: formData.hasPensionCard || '',
          needsLoan: formData.needsLoan || '',
          savingsAmount: formData.savingsAmount || '',
          income: formData.income || '',
          dependants: formData.dependants || '',
          dutiableValue: formData.dutiableValue || '',
          sellerQuestionsComplete: formData.sellerQuestionsComplete || false
        };

        const propertyData = {
          propertyPrice: formData.propertyPrice,
          propertyType: formData.propertyType,
          propertyCategory: formData.propertyCategory,
          isWA: formData.isWA,
          isWAMetro: formData.isWAMetro,
          isACT: formData.isACT
        };

        const stampDutyAmount = calculateStampDuty();
        const tempConcession = stateFunctions.calculateVICTempOffThePlanConcession(
          buyerData, 
          propertyData, 
          formData.selectedState, 
          stampDutyAmount, 
          formData.dutiableValue || 0, 
          formData.sellerQuestionsComplete || false
        );

        // If temp concession is eligible, show it
        if (tempConcession.eligible) {
          return {
            stampDuty: { amount: stampDutyAmount, label: "Stamp Duty" },
            concessions: [{
              type: 'Temp Off-The-Plan',
              amount: tempConcession.concessionAmount,
              eligible: true,
              reason: tempConcession.reason,
              showBothConcessions: false,
              tempOffThePlanConcession: tempConcession
            }],
            grants: [],
            foreignDuty: { amount: 0, applicable: false },
            netStateDuty: stampDutyAmount - tempConcession.concessionAmount,
            totalUpfrontCosts: stampDutyAmount - tempConcession.concessionAmount,
            allConcessions: {
              tempOffThePlan: tempConcession
            }
          };
        }
      }

      return {
        stampDuty: { amount: calculateStampDuty(), label: "Stamp Duty" },
        concessions: [],
        grants: [],
        foreignDuty: { amount: 0, applicable: false },
        netStateDuty: calculateStampDuty(),
        totalUpfrontCosts: calculateStampDuty()
      };
    }

    const buyerData = {
      selectedState: formData.selectedState,
      buyerType: formData.buyerType,
      isPPR: formData.isPPR,
      isAustralianResident: formData.isAustralianResident,
      isFirstHomeBuyer: formData.isFirstHomeBuyer,
      ownedPropertyLast5Years: formData.ownedPropertyLast5Years,
      hasPensionCard: formData.hasPensionCard,
      needsLoan: formData.needsLoan,
      savingsAmount: formData.savingsAmount,
      income: formData.income,
      dependants: formData.dependants,
      dutiableValue: formData.dutiableValue,
      constructionStarted: formData.constructionStarted,
      sellerQuestionsComplete: formData.sellerQuestionsComplete
    };

    const propertyData = {
      propertyPrice: formData.propertyPrice,
      propertyType: formData.propertyType,
      propertyCategory: formData.propertyCategory,
      isWA: formData.isWA,
      isWAMetro: formData.isWAMetro,
      isACT: formData.isACT
    };

    return stateFunctions.calculateUpfrontCosts(buyerData, propertyData, formData.selectedState);
  };

  return (
    <div className="relative">
      <div 
        onClick={toggleExpanded}
        className={`bg-secondary rounded-lg shadow-lg px-6 py-4 ${isPropertyComplete ? 'cursor-pointer hover:shadow-xl transition-shadow duration-200' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-lg lg:text-xl xl:text-2xl font-medium text-base-100">Upfront Costs</h3>
          </div>
          <div className="text-right">
            <div className="text-lg lg:text-xl xl:text-2xl font-semibold text-base-100">
              {isPropertyComplete ? formatCurrency(calculateAllUpfrontCosts().totalUpfrontCosts) : '$0'}
            </div>
          </div>
        </div>
      </div>
      
            {/* Dropdown overlay - appears above the component without pushing content down */}
      {isExpanded && isPropertyComplete && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-10">
          <div className="space-y-3">
            {(() => {
              const upfrontCosts = calculateAllUpfrontCosts();
              
              return (
                <>
                  {/* Show Property Price first if BuyerDetails complete and no loan needed */}
                  {formData.buyerDetailsComplete && formData.needsLoan === 'no' && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">Property Price</span>
                      <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl font-medium">
                        {formatCurrency(parseInt(formData.propertyPrice) || 0)}
                      </span>
                    </div>
                  )}
                  
                  {/* Stamp Duty */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">Stamp Duty</span>
                    <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl font-medium">
                      {formatCurrency(upfrontCosts.stampDuty.amount)}
                    </span>
                  </div>
                  
                  {/* Concessions */}
                  {(() => {
                    // Add temp concession to concessions array if eligible but not already applied
                    let concessionsToShow = [...upfrontCosts.concessions];
                    
                    if (upfrontCosts.tempConcessionEligible && 
                        upfrontCosts.allConcessions?.tempOffThePlan && 
                        !concessionsToShow.some(c => c.type === 'Temp Off-The-Plan')) {
                      concessionsToShow.push({
                        type: 'Temp Off-The-Plan',
                        amount: upfrontCosts.allConcessions.tempOffThePlan.concessionAmount,
                        eligible: true,
                        reason: upfrontCosts.allConcessions.tempOffThePlan.reason,
                        showBothConcessions: false,
                        tempOffThePlanConcession: upfrontCosts.allConcessions.tempOffThePlan
                      });
                    }
                    
                    return concessionsToShow;
                  })().map((concession, index) => (
                    <div key={index}>
                      {/* Main concession */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">
                          {concession.type === 'Pensioner' ? 'Pensioner Duty Concession' : 
                           concession.type === 'First Home Buyer' ? 'First Home Buyer Concession' :
                           concession.type === 'First Home Owner' ? 'First Home Owner Concession' :
                           concession.type === 'First Home Duty Relief' ? 'First Home Duty Relief' :
                           concession.type === 'Off-The-Plan' ? 'Off-The-Plan Concession' :
                           concession.type === 'Off the Plan Exemption' ? 'Off the Plan Exemption' :
                           concession.type === 'Temp Off-The-Plan' ? 'Temp Off-The-Plan Concession' :
                           concession.type === 'Home Concession' ? 'Home Concession' :
                           concession.type === 'First Home Concession' ? 'First Home Concession' :
                           concession.type === 'First Home (New) Concession' ? 'First Home (New) Concession' :
                           concession.type === 'First Home (Vac Land) Concession' ? 'First Home (Vac Land) Concession' :
                           concession.type === 'House and Land' ? 'House and Land Concession' :
                           concession.type === 'Home Buyer Concession' ? 'Home Buyer Concession' :
                           `Stamp Duty Concession${concession.type ? ` (${concession.type})` : ''}`}
                        </span>
                        <span className={`text-md md:text-sm lg:text-base xl:text-xl font-medium ${concession.amount > 0 ? 'text-green-600' : 'text-gray-600'} ${concession.amount === 0 || concession.type === 'First Home (Vac Land) Concession' ? 'relative group cursor-help' : ''}`} title={
                          concession.amount === 0 ? 
                            (concession.reason ? 
                              concession.reason :
                              concession.type === 'Pensioner' && concession.pensionerConcession && concession.pensionerConcession.reason && concession.pensionerConcession.reason.includes('additional seller information') ? 
                                'You are eligible but additional information is required to calculate your concession' : 
                                concession.type === 'Temp Off-The-Plan' && concession.tempOffThePlanConcession && concession.tempOffThePlanConcession.details && concession.tempOffThePlanConcession.details.waitingForSellerQuestions ?
                                'You are eligible but concession amount will be calculated after seller questions' :
                                concession.type === 'Off-The-Plan' && concession.offThePlanConcession && concession.offThePlanConcession.details && concession.offThePlanConcession.details.waitingForSellerQuestions ?
                                'You are eligible but concession will be calculated after seller questions' :
                                'You are eligible but the concession amount is 0 at this property price') :
                            (concession.type === 'First Home (Vac Land) Concession' ? 'Assumes you are buying a house-and-land package to build your first home' : '')
                        }>
                          {concession.amount > 0 ? `-${formatCurrency(concession.amount)}` : formatCurrency(concession.amount)}
                          {(concession.amount === 0 || concession.type === 'First Home (Vac Land) Concession') && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                              {concession.reason ? 
                                concession.reason :
                                concession.type === 'Pensioner' && concession.pensionerConcession && concession.pensionerConcession.reason && concession.pensionerConcession.reason.includes('additional seller information') ? 
                                  'You are eligible but additional information is required to calculate your concession' : 
                                  concession.type === 'Temp Off-The-Plan' && concession.tempOffThePlanConcession && concession.tempOffThePlanConcession.details && concession.tempOffThePlanConcession.details.waitingForSellerQuestions ?
                                  'You are eligible but concession amount will be calculated after seller questions' :
                                  concession.type === 'Off-The-Plan' && concession.offThePlanConcession && concession.offThePlanConcession.details && concession.offThePlanConcession.details.waitingForSellerQuestions ?
                                  'You are eligible but concession will be calculated after seller questions' :
                                  concession.type === 'First Home (Vac Land) Concession' ?
                                  'Assumes you are buying a house-and-land package to build your first home' :
                                  'You are eligible but the concession amount is 0 at this property price'}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                            </div>
                          )}
                        </span>
                      </div>
                      
                      {/* Second concession if user is eligible for both */}
                      {concession.showBothConcessions && (
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">
                            {concession.type === 'Pensioner' ? 'First Home Buyer Duty Concession' : 'Pensioner Duty Concession'}
                          </span>
                          <span className="text-md md:text-sm lg:text-base xl:text-xl font-medium text-gray-600 relative group cursor-help" title={
                            concession.amount > 0 ? 'Only one concession can be applied' : 
                            concession.pensionerConcession && concession.pensionerConcession.reason && concession.pensionerConcession.reason.includes('additional seller information') ? 'You are eligible but additional information is required to calculate your concession' :
                            'You are eligible but the concession amount is 0 at this property price'
                          }>
                            $0
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                              {concession.amount > 0 ? 'Only one concession can be applied' : 
                               concession.pensionerConcession && concession.pensionerConcession.reason && concession.pensionerConcession.reason.includes('additional seller information') ? 'You are eligible but additional information is required to calculate your concession' :
                               'You are eligible but the concession amount is 0 at this property price'}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Foreign Purchaser Duty */}
                  {upfrontCosts.foreignDuty.applicable && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">Foreign Purchaser Duty</span>
                      <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl font-medium text-red-600">
                        {formatCurrency(upfrontCosts.foreignDuty.amount)}
                      </span>
                    </div>
                  )}
                  
                  {/* Net State Duty - show if there are concessions or foreign duty */}
                  {(upfrontCosts.concessions.length > 0 || upfrontCosts.foreignDuty.applicable) && (
                    <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                      <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl font-semibold">Net State Duty</span>
                      <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl font-semibold">
                        {formatCurrency(upfrontCosts.netStateDuty)}
                      </span>
                    </div>
                  )}
                  
                  {/* Grants */}
                  {upfrontCosts.grants.map((grant, index) => {
                    // Determine grant label based on state and grant type
                    let grantLabel = 'First Home Owners Grant';
                    if (formData.selectedState === 'NT') {
                      // Check if this is a FreshStart Grant by looking at the reason or amount
                      if (grant.reason && grant.reason.includes('FreshStart')) {
                        grantLabel = 'FreshStart Grant';
                      } else if (grant.amount === 30000) {
                        // FreshStart Grant is always $30,000
                        grantLabel = 'FreshStart Grant';
                      } else {
                        grantLabel = 'HomeGrown Territory Grant';
                      }
                    }
                    
                    return (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">
                          {grantLabel}
                        </span>
                        <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl font-medium text-green-600">
                          -{formatCurrency(grant.amount)}
                        </span>
                      </div>
                    );
                  })}
                  
                  {/* Show Ineligible Grants/Concessions below Net State Duty */}
                  {formData.buyerDetailsComplete && (formData.selectedState === 'NSW' || formData.selectedState === 'VIC' || formData.selectedState === 'QLD' || formData.selectedState === 'SA' || formData.selectedState === 'WA' || formData.selectedState === 'TAS' || formData.selectedState === 'NT' || formData.selectedState === 'ACT') && (() => {
                    // Collect all ineligible items first
                    const ineligibleItems = [];
                    
                    // Check if we have any ineligible items to show
                    const hasIneligibleItems = 
                      (upfrontCosts.concessions.length === 0) ||
                      (formData.selectedState !== 'ACT' && upfrontCosts.grants.length === 0) ||
                      (formData.selectedState === 'VIC' && upfrontCosts.allConcessions) ||
                      (formData.selectedState === 'WA' && upfrontCosts.allConcessions) ||
                      (formData.selectedState === 'QLD' && upfrontCosts.allConcessions) ||
                      (formData.selectedState === 'SA' && upfrontCosts.allConcessions) ||
                      (formData.selectedState === 'TAS' && upfrontCosts.grants.length === 0) ||
                      (formData.selectedState === 'NT' && (upfrontCosts.grants.length === 0 || (upfrontCosts.ineligibleGrants && upfrontCosts.ineligibleGrants.length > 0) || (upfrontCosts.ineligibleConcessions && upfrontCosts.ineligibleConcessions.length > 0))) ||
                      (formData.selectedState === 'ACT' && (upfrontCosts.ineligibleConcessions && upfrontCosts.ineligibleConcessions.length > 0));
                    
                    
                    if (!hasIneligibleItems) return null;
                    
                    // Only show the section if there are actual items to display
                    const hasActualItems = 
                      (formData.selectedState === 'VIC' && upfrontCosts.allConcessions && (
                        (upfrontCosts.ineligibleConcessions && upfrontCosts.ineligibleConcessions.length > 0) ||
                        !upfrontCosts.allConcessions.firstHome.eligible ||
                        !upfrontCosts.allConcessions.ppr.eligible ||
                        !upfrontCosts.allConcessions.pensioner.eligible ||
                        !upfrontCosts.allConcessions.tempOffThePlan.eligible
                      )) ||
                      (formData.selectedState === 'QLD' && upfrontCosts.allConcessions && (
                        (upfrontCosts.ineligibleConcessions && upfrontCosts.ineligibleConcessions.length > 0) ||
                        !upfrontCosts.allConcessions.home.eligible ||
                        !upfrontCosts.allConcessions.firstHome.eligible ||
                        !upfrontCosts.allConcessions.firstHomeNew.eligible ||
                        !upfrontCosts.allConcessions.firstHomeVacantLand.eligible
                      )) ||
                      (formData.selectedState === 'SA' && upfrontCosts.allGrants && (
                        !upfrontCosts.allGrants.firstHomeOwners.eligible
                      )) ||
                      (formData.selectedState === 'SA' && upfrontCosts.allConcessions && (
                        !upfrontCosts.allConcessions.firstHomeBuyer.eligible
                      )) ||
                      (formData.selectedState === 'WA' && upfrontCosts.allGrants && (
                        !upfrontCosts.allGrants.firstHomeOwners.eligible
                      )) ||
                      (formData.selectedState === 'WA' && upfrontCosts.allConcessions && (
                        (upfrontCosts.ineligibleConcessions && upfrontCosts.ineligibleConcessions.length > 0) ||
                        !upfrontCosts.allConcessions.firstHomeOwner.eligible ||
                        !upfrontCosts.allConcessions.offThePlan.eligible
                      )) ||
                      (formData.selectedState === 'NSW' && upfrontCosts.concessions.length === 0) ||
                      (formData.selectedState === 'TAS' && (upfrontCosts.concessions.length === 0 || upfrontCosts.grants.length === 0)) ||
                      (formData.selectedState === 'NT' && (upfrontCosts.grants.length === 0 || (upfrontCosts.ineligibleGrants && upfrontCosts.ineligibleGrants.length > 0) || (upfrontCosts.ineligibleConcessions && upfrontCosts.ineligibleConcessions.length > 0))) ||
                      (formData.selectedState === 'ACT' && (upfrontCosts.ineligibleConcessions && upfrontCosts.ineligibleConcessions.length > 0)) ||
                      (formData.selectedState !== 'ACT' && upfrontCosts.grants.length === 0);
                    
                    
                    if (!hasActualItems) return null;
                    
                    return (
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <div className="text-sm text-gray-500 mb-2">State Grants and Concessions:</div>
                        
                        <div className="space-y-3">
                          {/* Show ineligible concessions for VIC */}
                          {formData.selectedState === 'VIC' && upfrontCosts.allConcessions && (
                            <>
                              {/* Show ineligible concessions from calculation results (e.g., when both FHO and Pensioner are eligible but only higher one is applied) */}
                              {upfrontCosts.ineligibleConcessions && upfrontCosts.ineligibleConcessions.map((concession, index) => (
                                <div key={`ineligible-${index}`} className="flex justify-between items-center">
                                  <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">
                                    {concession.type === 'Pensioner' ? 'Pensioner Duty Concession' : 
                                     concession.type === 'First Home Buyer' ? 'First Home Buyer Concession' :
                                     concession.type === 'Home Buyer Concession' ? 'Home Buyer Concession' :
                                     `Stamp Duty Concession${concession.type ? ` (${concession.type})` : ''}`}
                                  </span>
                                  <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={concession.reason}>
                                    Not Eligible
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                      {concession.reason}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </span>
                                </div>
                              ))}
                              
                              {/* Only show First Home Buyer Concession if it's NOT eligible */}
                              {!upfrontCosts.allConcessions.firstHome.eligible && 
                               !upfrontCosts.ineligibleConcessions?.some(c => c.type === 'First Home Buyer') && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">First Home Buyer Concession</span>
                                  <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={upfrontCosts.allConcessions.firstHome.reason}>
                                    Not Eligible
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                      {upfrontCosts.allConcessions.firstHome.reason}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </span>
                                </div>
                              )}
                              {/* Only show PPR Concession if it's NOT eligible */}
                              {!upfrontCosts.allConcessions.ppr.eligible && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">PPR Concession</span>
                                  <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={upfrontCosts.allConcessions.ppr.reason}>
                                    Not Eligible
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                      {upfrontCosts.allConcessions.ppr.reason}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </span>
                                </div>
                              )}
                              {/* Only show Pensioner Concession if it's NOT eligible */}
                              {!upfrontCosts.allConcessions.pensioner.eligible && 
                               !upfrontCosts.ineligibleConcessions?.some(c => c.type === 'Pensioner') && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">Pensioner Duty Concession</span>
                                  <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={upfrontCosts.allConcessions.pensioner.reason}>
                                    Not Eligible
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                      {upfrontCosts.allConcessions.pensioner.reason}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </span>
                                </div>
                              )}
                              {/* Only show Temp Off-The-Plan Concession if it's NOT eligible */}
                              {!upfrontCosts.allConcessions.tempOffThePlan.eligible && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">Temp Off-The-Plan Concession</span>
                                  <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={upfrontCosts.allConcessions.tempOffThePlan.reason}>
                                    Not Eligible
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                      {upfrontCosts.allConcessions.tempOffThePlan.reason}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* Show ineligible concessions for QLD */}
                          {formData.selectedState === 'QLD' && upfrontCosts.allConcessions && (
                            <>
                              {/* Show ineligible concessions from calculation results */}
                              {upfrontCosts.ineligibleConcessions && upfrontCosts.ineligibleConcessions.map((concession, index) => (
                                <div key={`ineligible-${index}`} className="flex justify-between items-center">
                                  <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">
                                    {concession.type === 'Home Concession' ? 'Home Concession' : 
                                     concession.type === 'First Home Concession' ? 'First Home Concession' :
                                     concession.type === 'First Home (New) Concession' ? 'First Home (New) Concession' :
                                     concession.type === 'First Home (Vac Land) Concession' ? 'First Home (Vac Land) Concession' :
                                     concession.type === 'Home Buyer Concession' ? 'Home Buyer Concession' :
                                     `Stamp Duty Concession${concession.type ? ` (${concession.type})` : ''}`}
                                  </span>
                                  <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={concession.reason}>
                                    Not Eligible
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                      {concession.reason}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </span>
                                </div>
                              ))}
                              
                              {/* Only show First Home (New) Concession if it's NOT eligible */}
                              {!upfrontCosts.allConcessions.firstHomeNew.eligible && 
                               !upfrontCosts.ineligibleConcessions?.some(c => c.type === 'First Home (New) Concession') && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">First Home (New) Concession</span>
                                  <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={upfrontCosts.allConcessions.firstHomeNew.reason}>
                                    Not Eligible
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                      {upfrontCosts.allConcessions.firstHomeNew.reason}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </span>
                                </div>
                              )}
                              
                              {/* Only show First Home (Vac Land) Concession if it's NOT eligible */}
                              {!upfrontCosts.allConcessions.firstHomeVacantLand.eligible && 
                               !upfrontCosts.ineligibleConcessions?.some(c => c.type === 'First Home (Vac Land) Concession') && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">First Home (Vac Land) Concession</span>
                                  <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={upfrontCosts.allConcessions.firstHomeVacantLand.reason}>
                                    Not Eligible
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                      {upfrontCosts.allConcessions.firstHomeVacantLand.reason}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </span>
                                </div>
                              )}
                              
                              {/* Only show First Home Concession if it's NOT eligible */}
                              {!upfrontCosts.allConcessions.firstHome.eligible && 
                               !upfrontCosts.ineligibleConcessions?.some(c => c.type === 'First Home Concession') && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">First Home Concession</span>
                                  <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={upfrontCosts.allConcessions.firstHome.reason}>
                                    Not Eligible
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                      {upfrontCosts.allConcessions.firstHome.reason}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </span>
                                </div>
                              )}
                              
                              {/* Only show Home Concession if it's NOT eligible */}
                              {!upfrontCosts.allConcessions.home.eligible && 
                               !upfrontCosts.ineligibleConcessions?.some(c => c.type === 'Home Concession') && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">Home Concession</span>
                                  <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={upfrontCosts.allConcessions.home.reason}>
                                    Not Eligible
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                      {upfrontCosts.allConcessions.home.reason}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* Show ineligible grants and concessions for SA */}
                          {formData.selectedState === 'SA' && upfrontCosts.allGrants && !upfrontCosts.allGrants.firstHomeOwners.eligible && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">First Home Owners Grant</span>
                              <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={upfrontCosts.allGrants.firstHomeOwners.reason}>
                                Not Eligible
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                  {upfrontCosts.allGrants.firstHomeOwners.reason}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                </div>
                              </span>
                            </div>
                          )}
                          
                          {/* Show ineligible concessions for SA */}
                          {formData.selectedState === 'SA' && upfrontCosts.allConcessions && !upfrontCosts.allConcessions.firstHomeBuyer.eligible && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">First Home Buyer Concession</span>
                              <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={upfrontCosts.allConcessions.firstHomeBuyer.reason}>
                                Not Eligible
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                  {upfrontCosts.allConcessions.firstHomeBuyer.reason}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                </div>
                              </span>
                            </div>
                          )}
                          
                          {/* Show ineligible grants for WA */}
                          {formData.selectedState === 'WA' && upfrontCosts.allGrants && !upfrontCosts.allGrants.firstHomeOwners.eligible && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">First Home Owners Grant</span>
                              <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={upfrontCosts.allGrants.firstHomeOwners.reason}>
                                Not Eligible
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                  {upfrontCosts.allGrants.firstHomeOwners.reason}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                </div>
                              </span>
                            </div>
                          )}
                          
                          {/* Show ineligible concessions for WA */}
                          {formData.selectedState === 'WA' && upfrontCosts.allConcessions && (
                            <>
                              {/* Show ineligible concessions from calculation results */}
                              {upfrontCosts.ineligibleConcessions && upfrontCosts.ineligibleConcessions.map((concession, index) => (
                                <div key={`ineligible-${index}`} className="flex justify-between items-center">
                                  <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">
                                    {concession.type === 'First Home Owner' ? 'First Home Owner Concession' : 
                                     concession.type === 'Off-The-Plan' ? 'Off-The-Plan Concession' :
                                     concession.type === 'Home Buyer Concession' ? 'Home Buyer Concession' :
                                     `Stamp Duty Concession${concession.type ? ` (${concession.type})` : ''}`}
                                  </span>
                                  <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={concession.reason}>
                                    Not Eligible
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                      {concession.reason}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </span>
                                </div>
                              ))}
                              
                              {/* Only show First Home Owner Concession if it's NOT eligible and not already in ineligibleConcessions */}
                              {!upfrontCosts.allConcessions.firstHomeOwner.eligible && 
                               !upfrontCosts.ineligibleConcessions?.some(c => c.type === 'First Home Owner') && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">First Home Owner Concession</span>
                                  <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={upfrontCosts.allConcessions.firstHomeOwner.reason}>
                                    Not Eligible
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                      {upfrontCosts.allConcessions.firstHomeOwner.reason}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* Show ineligible concessions for TAS */}
                          {formData.selectedState === 'TAS' && upfrontCosts.concessions.length === 0 && (() => {
                            // Get the reason for ineligibility
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
                                <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">First Home Duty Relief</span>
                                <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={concessionResult.reason}>
                                  Not Eligible
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                    {concessionResult.reason}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                  </div>
                                </span>
                              </div>
                            );
                          })()}
                          
                          {/* Show ineligible grants for TAS */}
                          {formData.selectedState === 'TAS' && upfrontCosts.grants.length === 0 && (() => {
                            // Get the reason for ineligibility
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
                                <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">First Home Owners Grant</span>
                                <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={grantResult.reason}>
                                  Not Eligible
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                    {grantResult.reason}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                  </div>
                                </span>
                              </div>
                            );
                          })()}
                          
                          {/* Show ineligible grants and concessions for NT */}
                          {formData.selectedState === 'NT' && (() => {
                            // Show ineligible grants from the new ineligibleGrants array
                            const ineligibleItems = [];
                            
                            if (upfrontCosts.ineligibleGrants && upfrontCosts.ineligibleGrants.length > 0) {
                              ineligibleItems.push(...upfrontCosts.ineligibleGrants.map((grant, index) => (
                                <div key={index} className="flex justify-between items-center">
                                  <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">
                                    {grant.grantType === 'FreshStart' ? 'FreshStart Grant' : 'HomeGrown Territory Grant'}
                                  </span>
                                  <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={grant.reason}>
                                    Not Eligible
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                      {grant.reason}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </span>
                                </div>
                              )));
                            }
                            
                            // Show ineligible concessions from the new ineligibleConcessions array
                            if (upfrontCosts.ineligibleConcessions && upfrontCosts.ineligibleConcessions.length > 0) {
                              ineligibleItems.push(...upfrontCosts.ineligibleConcessions.map((concession, index) => (
                                <div key={`concession-${index}`} className="flex justify-between items-center">
                                  <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">
                                    {concession.type === 'House and Land' ? 'House and Land Concession' : concession.type}
                                  </span>
                                  <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={concession.reason}>
                                    Not Eligible
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                      {concession.reason}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </span>
                                </div>
                              )));
                            }
                            
                            return ineligibleItems;
                            
                            // If no grants at all and no ineligible grants from calculation, show both as ineligible
                            if (upfrontCosts.grants.length === 0 && (!upfrontCosts.ineligibleGrants || upfrontCosts.ineligibleGrants.length === 0)) {
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
                                    <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">HomeGrown Territory Grant</span>
                                    <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={homeGrownResult.reason}>
                                      Not Eligible
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                        {homeGrownResult.reason}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                      </div>
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">FreshStart Grant</span>
                                    <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={freshStartResult.reason}>
                                      Not Eligible
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                        {freshStartResult.reason}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                      </div>
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">House and Land Concession</span>
                                    <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={houseAndLandResult.reason}>
                                      Not Eligible
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                        {houseAndLandResult.reason}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                      </div>
                                    </span>
                                  </div>
                                </>
                              );
                            }
                            
                            return null;
                          })()}
                          
                          {/* Show ineligible Stamp Duty Concession for NSW */}
                          {formData.selectedState === 'NSW' && upfrontCosts.concessions.length === 0 && (() => {
                            // Get the reason for ineligibility
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
                                <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">Stamp Duty Concession</span>
                                <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={concessionResult.reason}>
                                  Not Eligible
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                    {concessionResult.reason}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                  </div>
                                </span>
                              </div>
                            );
                          })()}
                          
                          {/* Show ineligible concessions for ACT */}
                          {formData.selectedState === 'ACT' && upfrontCosts.ineligibleConcessions && upfrontCosts.ineligibleConcessions.length > 0 && (
                            <>
                              {upfrontCosts.ineligibleConcessions.map((concession, index) => (
                                <div key={`ineligible-${index}`} className="flex justify-between items-center">
                                  <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">
                                    {concession.type === 'Home Buyer Concession' ? 'Home Buyer Concession' : 
                                     concession.type === 'Off the Plan Exemption' ? 'Off the Plan Exemption' : concession.type}
                                  </span>
                                  <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={concession.reason}>
                                    Not Eligible
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                      {concession.reason}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                  </span>
                                </div>
                              ))}
                            </>
                          )}
                          
                          {/* Show ineligible First Home Owners Grant */}
                          {upfrontCosts.grants.length === 0 && formData.selectedState !== 'SA' && formData.selectedState !== 'WA' && formData.selectedState !== 'TAS' && formData.selectedState !== 'NT' && formData.selectedState !== 'ACT' && (() => {
                            // Get the reason for ineligibility
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
                            const grantResult = formData.selectedState === 'NSW' && stateFunctions?.calculateNSWFirstHomeOwnersGrant ? 
                              stateFunctions.calculateNSWFirstHomeOwnersGrant(buyerData, propertyData, formData.selectedState) :
                              formData.selectedState === 'VIC' && stateFunctions?.calculateVICFirstHomeOwnersGrant ?
                              stateFunctions.calculateVICFirstHomeOwnersGrant(buyerData, propertyData, formData.selectedState) :
                              formData.selectedState === 'QLD' && stateFunctions?.calculateQLDFirstHomeOwnersGrant ?
                              stateFunctions.calculateQLDFirstHomeOwnersGrant(buyerData, propertyData, formData.selectedState) :
                              { reason: 'Grant not available' };
                            
                            return (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-800 text-md md:text-sm lg:text-base xl:text-xl">First Home Owners Grant</span>
                                <span className="text-gray-600 text-md md:text-sm lg:text-base xl:text-xl text-red-600 relative group cursor-help" title={grantResult.reason}>
                                  Not Eligible
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                    {grantResult.reason}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                  </div>
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })()}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

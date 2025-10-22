import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStateSelector } from '../states/useStateSelector.js';
import { formatCurrency } from '../states/shared/baseCalculations.js';
import { calculateNTStampDuty } from '../states/nt/calculations.js';
import { ACTStateComponent, hasACTIneligibleItems } from '../states/act/components.js';
import { VICStateComponent, hasVICIneligibleItems, hasVICActualItems } from '../states/vic/components.js';
import { QLDStateComponent, hasQLDIneligibleItems, hasQLDActualItems } from '../states/qld/components.js';
import { WAStateComponent, hasWAIneligibleItems, hasWAActualItems } from '../states/wa/components.js';
import { SAStateComponent, hasSAIneligibleItems, hasSAActualItems } from '../states/sa/components.js';
import { NTStateComponent, hasNTIneligibleItems, hasNTActualItems } from '../states/nt/components.js';
import { TASStateComponent, hasTASIneligibleItems, hasTASActualItems } from '../states/tas/components.js';
import { NSWStateComponent, hasNSWIneligibleItems, hasNSWActualItems } from '../states/nsw/components.js';
import { ChevronDown } from 'lucide-react';

import { useFormStore } from '../stores/formStore';

export default function UpfrontCosts() {
    const formData = useFormStore();
  const [hasJiggledOnBuyerComplete, setHasJiggledOnBuyerComplete] = useState(false);
  const [hasJiggledOnLoanComplete, setHasJiggledOnLoanComplete] = useState(false);
  const [hasJiggledOnSellerComplete, setHasJiggledOnSellerComplete] = useState(false);
  
  // Get state-specific functions when state is selected
  const { stateFunctions } = useStateSelector(formData.selectedState || 'NSW');

  // Get display state from form store
  const displayState = formData.getUpfrontCostsDisplay();
  
  // Trigger jiggle when BuyerDetails complete (only once)
  useEffect(() => {
    if (formData.buyerDetailsComplete && !hasJiggledOnBuyerComplete) {
      setHasJiggledOnBuyerComplete(true);
    }
  }, [formData.buyerDetailsComplete]);

  // Trigger jiggle when LoanDetails complete (only once)
  useEffect(() => {
    if (formData.loanDetailsComplete && !hasJiggledOnLoanComplete) {
      setHasJiggledOnLoanComplete(true);
    }
  }, [formData.loanDetailsComplete]);

  // Trigger jiggle when SellerQuestions complete (only once)
  useEffect(() => {
    if (formData.sellerQuestionsComplete && !hasJiggledOnSellerComplete) {
      setHasJiggledOnSellerComplete(true);
    }
  }, [formData.sellerQuestionsComplete]);

  // Close dropdown when navigating between form sections
  useEffect(() => {
    if (formData.openDropdown === 'upfront') {
      formData.updateFormData('openDropdown', null);
    }
  }, [
    formData.propertyDetailsCurrentStep,
    formData.propertyDetailsActiveStep,
    formData.buyerDetailsCurrentStep,
    formData.buyerDetailsActiveStep,
    formData.loanDetailsCurrentStep,
    formData.loanDetailsActiveStep,
    formData.sellerQuestionsActiveStep,
    formData.showLoanDetails,
    formData.showSellerQuestions,
    formData.propertyDetailsComplete,
    formData.buyerDetailsComplete,
    formData.loanDetailsComplete,
    formData.sellerQuestionsComplete
  ]);

  // Show invisible placeholder when not available yet to prevent layout shift
  if (!displayState.canShowDropdown) {
    return (
      <div className="invisible" aria-hidden="true">
        <div className="bg-secondary rounded-lg shadow-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-md lg:text-lg xl:text-xl font-medium text-base-100">Upfront Costs</h3>
          </div>
        </div>
      </div>
    );
  }

  const toggleExpanded = () => {
    if (displayState.canShowDropdown) {
      formData.toggleUpfrontDropdown();
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
          const baseTotal = stampDutyAmount - tempConcession.concessionAmount;
          const depositAmount = (formData.loanDetailsComplete && formData.needsLoan === 'yes') ? (parseInt(formData.loanDeposit) || 0) : 0;
          const settlementFee = (formData.loanDetailsComplete && formData.needsLoan === 'yes') ? (parseInt(formData.loanSettlementFees) || 0) : 0;
          const establishmentFee = (formData.loanDetailsComplete && formData.needsLoan === 'yes') ? (parseInt(formData.loanEstablishmentFee) || 0) : 0;
          
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
            totalUpfrontCosts: baseTotal + depositAmount + settlementFee + establishmentFee,
            allConcessions: {
              tempOffThePlan: tempConcession
            }
          };
        }
      }

      const stampDutyAmount = calculateStampDuty();
      const depositAmount = (formData.loanDetailsComplete && formData.needsLoan === 'yes') ? (parseInt(formData.loanDeposit) || 0) : 0;
      const settlementFee = (formData.loanDetailsComplete && formData.needsLoan === 'yes') ? (parseInt(formData.loanSettlementFees) || 0) : 0;
      const establishmentFee = (formData.loanDetailsComplete && formData.needsLoan === 'yes') ? (parseInt(formData.loanEstablishmentFee) || 0) : 0;
      
      return {
        stampDuty: { amount: stampDutyAmount, label: "Stamp Duty" },
        concessions: [],
        grants: [],
        foreignDuty: { amount: 0, applicable: false },
        netStateDuty: stampDutyAmount,
        totalUpfrontCosts: stampDutyAmount + depositAmount + settlementFee + establishmentFee
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

    const upfrontCostsResult = stateFunctions.calculateUpfrontCosts(buyerData, propertyData, formData.selectedState);
    
    // Add FIRB fee to base total if applicable
    const firbFee = parseInt(formData.FIRBFee) || 0;
    upfrontCostsResult.totalUpfrontCosts += firbFee;
    
    // Add loan-related amounts to total if loan details are currently complete
    if (formData.loanDetailsComplete && formData.needsLoan === 'yes') {
      const depositAmount = parseInt(formData.loanDeposit) || 0;
      const settlementFee = parseInt(formData.loanSettlementFees) || 0;
      const establishmentFee = parseInt(formData.loanEstablishmentFee) || 0;
      
      // Add seller question costs if seller questions are complete
      let additionalCosts = 0;
      if (formData.sellerQuestionsComplete) {
        additionalCosts += parseInt(formData.landTransferFee) || 0;
        additionalCosts += parseInt(formData.legalFees) || 0;
        additionalCosts += parseInt(formData.buildingAndPestInspection) || 0;
      }
      
      return {
        ...upfrontCostsResult,
        totalUpfrontCosts: upfrontCostsResult.totalUpfrontCosts + depositAmount + settlementFee + establishmentFee + additionalCosts
      };
    }
    
    // Add seller question costs if seller questions are complete but no loan
    if (formData.sellerQuestionsComplete) {
      const landTransferFee = parseInt(formData.landTransferFee) || 0;
      const legalFees = parseInt(formData.legalFees) || 0;
      const buildingAndPest = parseInt(formData.buildingAndPestInspection) || 0;
      const additionalCosts = landTransferFee + legalFees + buildingAndPest;
      
      return {
        ...upfrontCostsResult,
        totalUpfrontCosts: upfrontCostsResult.totalUpfrontCosts + additionalCosts
      };
    }
    
    return upfrontCostsResult;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        opacity: { duration: 0.5 },
        y: { duration: 0.3 }
      }}
    >
      <div className="relative">
      <motion.div 
        onClick={toggleExpanded}
        animate={(hasJiggledOnBuyerComplete || hasJiggledOnLoanComplete || hasJiggledOnSellerComplete) ? {
          x: [0, -4, 4, -4, 4, 0],
          rotate: [0, -0.1, 0.1, -0.1, 0.1, 0]
        } : {}}
        transition={{ duration: 0.5 }}
        onAnimationComplete={() => {
          setHasJiggledOnBuyerComplete(false);
          setHasJiggledOnLoanComplete(false);
          setHasJiggledOnSellerComplete(false);
        }}
        className={`bg-secondary rounded-lg shadow-lg px-4 py-3 ${displayState.canShowDropdown ? 'cursor-pointer hover:shadow-xl transition-shadow duration-200' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-md lg:text-lg xl:text-xl font-medium text-base-100">Upfront Costs</h3>
          </div>
          <div className="text-right">
            <AnimatePresence>
              {displayState.canShowDropdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown 
                    size={20} 
                    className={`text-base-100 transition-transform duration-200 ${displayState.isDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
      
            {/* Dropdown overlay - appears above the component without pushing content down */}
      <AnimatePresence>
        {displayState.isDropdownOpen && displayState.canShowDropdown && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              duration: 0.3,
              ease: "easeInOut"
            }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 px-4 z-10 max-h-120 overflow-y-auto"
          >
            <div className="space-y-3 py-1">
            {(() => {
              const upfrontCosts = calculateAllUpfrontCosts();
              
              return (
                <>
                  <div className="text-xs text-gray-500 mb-0 pt-2">Total Estimated Upfront Costs:</div>
                  {/* Show Property Price first if BuyerDetails complete and no loan needed */}
                  {formData.buyerDetailsComplete && formData.needsLoan === 'no' && (
                    <div className={`flex justify-between items-center pt-2 ${formData.sellerQuestionsComplete ? 'pb-0' : ''}`}>
                      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">Property Price</span>
                      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                        {formatCurrency(parseInt(formData.propertyPrice) || 0)}
                      </span>
                    </div>
                  )}
                  
                  {/* Show Deposit if loan details are currently complete */}
                  {displayState.showDeposit && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">Deposit</span>
                      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                        {formatCurrency(parseInt(formData.loanDeposit) || 0)}
                      </span>
                    </div>
                  )}
                  
                  {/* Show Bank Settlement Fee if loan details are currently complete */}
                  {displayState.showBankFees && (
                    <div className="flex justify-between items-center -mt-3">
                      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">Bank Settlement Fee</span>
                      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                        {formatCurrency(parseInt(formData.loanSettlementFees) || 0)}
                      </span>
                    </div>
                  )}
                  
                  {/* Show Loan Establishment Fee if loan details are currently complete */}
                  {displayState.showBankFees && (
                    <div className="flex justify-between items-center -mt-3">
                      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">Loan Establishment Fee</span>
                      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                        {formatCurrency(parseInt(formData.loanEstablishmentFee) || 0)}
                      </span>
                    </div>
                  )}
                  
                  {/* Land Transfer Fee, Legal and Conveyancing, Building and Pest - show when seller questions are complete */}
                  {formData.sellerQuestionsComplete && (() => {
                    const hasLandTransfer = parseInt(formData.landTransferFee) > 0;
                    const hasLegalFees = parseInt(formData.legalFees) > 0;
                    const hasBuildingPest = parseInt(formData.buildingAndPestInspection) > 0;
                    
                    return (
                      <>
                        {/* Land Transfer Fee */}
                        {hasLandTransfer && (
                          <div className="flex justify-between items-center -mt-0">
                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">Land Transfer Fee</span>
                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                              {formatCurrency(parseInt(formData.landTransferFee) || 0)}
                            </span>
                          </div>
                        )}
                        
                        {/* Legal and Conveyancing */}
                        {hasLegalFees && (
                          <div className={`flex justify-between items-center ${hasLandTransfer ? '-mt-3' : '-mt-0'}`}>
                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">Legal and Conveyancing</span>
                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                              {formatCurrency(parseInt(formData.legalFees) || 0)}
                            </span>
                          </div>
                        )}
                        
                        {/* Building and Pest Inspection */}
                        {hasBuildingPest && (
                          <div className={`flex justify-between items-center ${hasLandTransfer || hasLegalFees ? '-mt-3' : '-mt-0'}`}>
                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">Building and Pest Inspection</span>
                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                              {formatCurrency(parseInt(formData.buildingAndPestInspection) || 0)}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  
                  {/* Stamp Duty */}
                  <div className={`flex justify-between items-center ${(upfrontCosts.concessions.length > 0 || upfrontCosts.foreignDuty.applicable) ? 'mt-2' : 'mt-2'}`}>
                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">Stamp Duty</span>
                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
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
                    <div key={index} className="-mt-3">
                      {/* Main concession */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                          {concession.type === 'Pensioner' ? 'Pensioner Duty Concession' : 
                           concession.type === 'First Home Buyer' ? 'First Home Buyer Concession' :
                           concession.type === 'First Home Owner' ? 'First Home Owner Concession' :
                           concession.type === 'First Home Duty Relief' ? 'First Home Duty Relief' :
                           concession.type === 'Off-The-Plan' ? 'Off-The-Plan Concession' :
                           concession.type === 'Off the Plan Exemption' ? 'Off the Plan Exemption' :
                           concession.type === 'Pensioner Concession' ? 'Pensioner Concession' :
                           concession.type === 'Owner Occupier Concession' ? 'Owner Occupier Concession' :
                           concession.type === 'Temp Off-The-Plan' ? 'Temp Off-The-Plan Concession' :
                           concession.type === 'Home Concession' ? 'Home Concession' :
                           concession.type === 'First Home Concession' ? 'First Home Concession' :
                           concession.type === 'First Home (New) Concession' ? 'First Home (New) Concession' :
                           concession.type === 'First Home (Vac Land) Concession' ? 'First Home (Vac Land) Concession' :
                           concession.type === 'House and Land' ? 'House and Land Concession' :
                           concession.type === 'Home Buyer Concession' ? 'Home Buyer Concession' :
                           `Stamp Duty Concession${concession.type ? ` (${concession.type})` : ''}`}
                        </span>
                        <span className={`text-sm md:text-xs lg:text-sm xl:text-lg font-medium ${concession.amount > 0 ? 'text-green-600' : 'text-gray-600'} ${concession.amount === 0 || concession.type === 'First Home (Vac Land) Concession' ? 'relative group cursor-help' : ''}`} title={
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
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
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
                          <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                            {concession.type === 'Pensioner' ? 'First Home Buyer Duty Concession' : 'Pensioner Duty Concession'}
                          </span>
                          <span className="text-sm md:text-xs lg:text-sm xl:text-lg font-medium text-gray-600 relative group cursor-help" title={
                            concession.amount > 0 ? 'Only one concession can be applied' : 
                            concession.pensionerConcession && concession.pensionerConcession.reason && concession.pensionerConcession.reason.includes('additional seller information') ? 'You are eligible but additional information is required to calculate your concession' :
                            'You are eligible but the concession amount is 0 at this property price'
                          }>
                            $0
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
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
                    <div className="flex justify-between items-center -mt-3">
                      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">Foreign Purchaser Duty</span>
                      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium text-red-600">
                        {formatCurrency(upfrontCosts.foreignDuty.amount)}
                      </span>
                    </div>
                  )}
                  
                  {/* Net State Duty - show if there are concessions or foreign duty */}
                  {(upfrontCosts.concessions.length > 0 || upfrontCosts.foreignDuty.applicable) && (
                    <div className="flex justify-between items-center border-t border-gray-200 pt-2 -mt-2 pb-2">
                      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">Net State Duty</span>
                      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                        {formatCurrency(upfrontCosts.netStateDuty)}
                      </span>
                    </div>
                  )}
                  
                  {/* FIRB Application Fee - show if applicable */}
                  {formData.buyerDetailsComplete && formData.isAustralianResident === 'no' && formData.FIRBFee && parseInt(formData.FIRBFee) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">FIRB Application Fee</span>
                      <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                        {formatCurrency(parseInt(formData.FIRBFee))}
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
                      <div key={index} className="flex justify-between items-center -mt-2">
                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                          {grantLabel}
                        </span>
                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium text-green-600">
                          -{formatCurrency(grant.amount)}
                        </span>
                      </div>
                    );
                  })}
                  
                  {/* Total Upfront Costs - moved above state grants and concessions */}
                  <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-3">
                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-semibold">
                      Total Upfront Costs
                    </span>
                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-semibold">
                      {formatCurrency(upfrontCosts.totalUpfrontCosts)}
                    </span>
                  </div>
                  
                  {/* Show Ineligible Grants/Concessions below Total */}
                  {formData.buyerDetailsComplete && (formData.selectedState === 'NSW' || formData.selectedState === 'VIC' || formData.selectedState === 'QLD' || formData.selectedState === 'SA' || formData.selectedState === 'WA' || formData.selectedState === 'TAS' || formData.selectedState === 'NT' || formData.selectedState === 'ACT') && (() => {
                    // Collect all ineligible items first
                    const ineligibleItems = [];
                    
                    // Check if we have any ineligible items to show
                    const hasIneligibleItems = 
                      (upfrontCosts.concessions.length === 0) ||
                      (formData.selectedState !== 'ACT' && upfrontCosts.grants.length === 0) ||
                      hasVICIneligibleItems(upfrontCosts, formData) ||
                      hasWAIneligibleItems(upfrontCosts, formData) ||
                      hasQLDIneligibleItems(upfrontCosts, formData) ||
                      hasSAIneligibleItems(upfrontCosts, formData) ||
                      hasTASIneligibleItems(upfrontCosts, formData) ||
                      hasNTIneligibleItems(upfrontCosts, formData) ||
                      hasACTIneligibleItems(upfrontCosts, formData);
                    
                    
                    if (!hasIneligibleItems) return null;
                    
                    // Only show the section if there are actual items to display
                    const hasActualItems = 
                      hasVICActualItems(upfrontCosts, formData) ||
                      hasQLDActualItems(upfrontCosts, formData) ||
                      hasSAActualItems(upfrontCosts, formData) ||
                      hasWAActualItems(upfrontCosts, formData) ||
                      hasNSWActualItems(upfrontCosts, formData) ||
                      hasTASActualItems(upfrontCosts, formData) ||
                      hasNTActualItems(upfrontCosts, formData) ||
                      hasACTIneligibleItems(upfrontCosts, formData) ||
                      (formData.selectedState !== 'ACT' && upfrontCosts.grants.length === 0);
                    
                    
                    if (!hasActualItems) return null;
                    
                    return (
                      <div className="border-t border-gray-200 pt-1 -mt-1">
                        <div className="text-xs text-gray-500 mb-3 mt-4">Other State Grants and Concessions:</div>
                        
                        <div className="space-y-3">
                          {/* Show ineligible concessions for VIC */}
                          <div className="-mt-2">
                            <VICStateComponent upfrontCosts={upfrontCosts} formData={formData} />
                          </div>
                          
                          {/* Show ineligible concessions for QLD */}
                          <div className="-mt-2">
                            <QLDStateComponent upfrontCosts={upfrontCosts} formData={formData} />
                          </div>
                          
                          {/* Show ineligible grants and concessions for SA */}
                          <div className="-mt-2">
                            <SAStateComponent upfrontCosts={upfrontCosts} formData={formData} />
                          </div>
                          
                          {/* Show ineligible grants and concessions for WA */}
                          <div className="-mt-2">
                            <WAStateComponent upfrontCosts={upfrontCosts} formData={formData} />
                          </div>
                          
                          {/* Show ineligible concessions and grants for TAS */}
                          <div className="-mt-2">
                            <TASStateComponent 
                              upfrontCosts={upfrontCosts} 
                              formData={formData} 
                              stateFunctions={stateFunctions}
                              calculateStampDuty={calculateStampDuty}
                            />
                          </div>
                          
                          {/* Show ineligible grants and concessions for NT */}
                          <div className="-mt-2">
                            <NTStateComponent 
                              upfrontCosts={upfrontCosts} 
                              formData={formData} 
                              stateFunctions={stateFunctions}
                              calculateStampDuty={calculateStampDuty}
                            />
                          </div>
                          
                          {/* Show ineligible Stamp Duty Concession for NSW */}
                          <div className="-mt-2">
                            <NSWStateComponent 
                              upfrontCosts={upfrontCosts} 
                              formData={formData} 
                              stateFunctions={stateFunctions}
                              calculateStampDuty={calculateStampDuty}
                            />
                          </div>
                          
                          {/* Show ineligible concessions for ACT */}
                          <div className="-mt-2">
                            <ACTStateComponent upfrontCosts={upfrontCosts} formData={formData} />
                          </div>
                          
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
                              <div className="flex justify-between items-center -mt-3 mb-1">
                                <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">First Home Owners Grant</span>
                                <span className="text-gray-600 text-sm md:text-xs lg:text-sm xl:text-lg text-red-600 relative group cursor-help" title={grantResult.reason}>
                                  Not Eligible
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </motion.div>
  );
}

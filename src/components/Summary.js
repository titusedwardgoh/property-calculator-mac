"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useFormStore } from '../stores/formStore';
import { formatCurrency } from '../states/shared/baseCalculations.js';
import { useStateSelector } from '../states/useStateSelector.js';

export default function Summary() {
    const formData = useFormStore();
    const [isExpanded, setIsExpanded] = useState(false);

    // Get state-specific functions when state is selected
    const { stateFunctions } = useStateSelector(formData.selectedState || 'NSW');

    // Sync with shared dropdown state
    useEffect(() => {
        setIsExpanded(formData.openDropdown === 'summary');
    }, [formData.openDropdown]);

    // Only render when summary should be shown
    if (!formData.showSummary) {
        return null;
    }

    // Calculate stamp duty (same as UpfrontCosts)
    const calculateStampDuty = () => {
        if (!stateFunctions || !formData.propertyPrice || !formData.selectedState || !formData.propertyType) {
            return 0;
        }
        
        const stampDuty = stateFunctions.calculateStampDuty(formData.propertyPrice, formData.selectedState);
        return stampDuty;
    };

    // Calculate all upfront costs using the exact same logic as UpfrontCosts component
    const calculateAllUpfrontCosts = () => {
        if (!formData.buyerDetailsComplete || !stateFunctions?.calculateUpfrontCosts) {
            // Return basic stamp duty calculation when buyer details not complete
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

    // Get upfront costs using the same calculation as UpfrontCosts
    const getUpfrontCosts = () => {
        try {
            const upfrontCosts = calculateAllUpfrontCosts();
            return upfrontCosts?.totalUpfrontCosts || 0;
        } catch (error) {
            console.error('Error calculating upfront costs:', error);
            return 0;
        }
    };

    // Calculate monthly ongoing costs
    const getMonthlyOngoingCosts = () => {
        const propertyCosts = (formData.COUNCIL_RATES_MONTHLY || 0) + 
                             (formData.WATER_RATES_MONTHLY || 0) + 
                             (formData.BODY_CORP_MONTHLY || 0);
        const loanCosts = formData.needsLoan === 'yes' ? (formData.MONTHLY_LOAN_REPAYMENT || 0) : 0;
        return propertyCosts + loanCosts;
    };

    // Calculate loan amount
    const getLoanAmount = () => {
        const propertyPrice = parseInt(formData.propertyPrice) || 0;
        const deposit = parseInt(formData.loanDeposit) || 0;
        return propertyPrice - deposit;
    };

    const toggleExpanded = () => {
        if (isExpanded) {
            // Close this dropdown
            formData.updateFormData('openDropdown', null);
        } else {
            // Close other dropdown first, then open this one
            formData.updateFormData('openDropdown', 'summary');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
                opacity: 1, 
                y: 0
            }}
            transition={{ 
                opacity: { duration: 0.5 },
                y: { duration: 0.3 }
            }}
            className="bg-primary rounded-lg shadow-lg px-4 py-3 cursor-pointer hover:shadow-xl transition-shadow duration-200 relative"
            onClick={toggleExpanded}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <h3 className="text-md lg:text-lg xl:text-xl font-medium text-base-100">Summary</h3>
                </div>
                <div className="text-right">
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ChevronDown 
                                size={20} 
                                className={`text-base-100 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Dropdown Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ 
                            height: { duration: 0.3, ease: "easeInOut" },
                            opacity: { duration: 0.2 }
                        }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 px-4 z-10 max-h-120 overflow-y-auto"
                    >
                        <div className="space-y-4 py-3">
                            {/* Section 1: Property Details */}
                            <div className="space-y-0.5">
                                <div className="text-xs text-gray-500 font-medium">Property Details</div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                        Address
                                    </span>
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium text-right max-w-xs">
                                        {formData.propertyStreetAddress || 'Not specified'}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                        Suburb
                                    </span>
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                        {(() => {
                                            if (!formData.propertySuburbPostcode) return 'Not specified';
                                            
                                            // Try comma split first
                                            const commaSplit = formData.propertySuburbPostcode.split(',');
                                            if (commaSplit.length > 1) {
                                                return commaSplit[0].trim();
                                            }
                                            
                                            // If no comma, try to extract suburb from "Suburb State Postcode" format
                                            const parts = formData.propertySuburbPostcode.trim().split(' ');
                                            if (parts.length >= 3) {
                                                // Remove last two parts (state and postcode) to get suburb
                                                return parts.slice(0, -2).join(' ');
                                            }
                                            
                                            return formData.propertySuburbPostcode;
                                        })()}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                        State
                                    </span>
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                        {formData.selectedState || 'Not specified'}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                        Postcode
                                    </span>
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                        {(() => {
                                            if (!formData.propertySuburbPostcode) return 'Not specified';
                                            
                                            // Try comma split first
                                            const commaSplit = formData.propertySuburbPostcode.split(',');
                                            if (commaSplit.length > 1) {
                                                return commaSplit[1].trim();
                                            }
                                            
                                            // If no comma, try to extract postcode from "Suburb State Postcode" format
                                            const parts = formData.propertySuburbPostcode.trim().split(' ');
                                            if (parts.length >= 3) {
                                                // Last part should be postcode
                                                return parts[parts.length - 1];
                                            }
                                            
                                            return 'Not specified';
                                        })()}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                        Property Type
                                    </span>
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                        {formData.propertyType === 'existing' ? 'Existing' : 
                                         formData.propertyType === 'off-the-plan' ? 'Off-the-Plan' : 
                                         'Not specified'}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                        Category
                                    </span>
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                        {formData.propertyCategory === 'house' ? 'House' :
                                         formData.propertyCategory === 'apartment' ? 'Apartment' :
                                         formData.propertyCategory === 'townhouse' ? 'Townhouse' :
                                         formData.propertyCategory === 'unit' ? 'Unit' :
                                         'Not specified'}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                        Property Price
                                    </span>
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                        {formatCurrency(parseInt(formData.propertyPrice) || 0)}
                                    </span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-200"></div>

                            {/* Section 2: Buyer Information */}
                            <div className="space-y-0.5">
                                <div className="text-xs text-gray-500 font-medium">Buyer Information</div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                        Buyer Type
                                    </span>
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                        {formData.buyerType === 'owner-occupier' ? 'Owner-Occupier' :
                                         formData.buyerType === 'investor' ? 'Investor' :
                                         'Not specified'}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                        Principal Place of Residence
                                    </span>
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                        {formData.isPPR === 'yes' ? 'Yes' :
                                         formData.isPPR === 'no' ? 'No' :
                                         'Not specified'}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                        Residency Status
                                    </span>
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                        {formData.isAustralianResident === 'yes' ? 'Australian Resident' :
                                         formData.isAustralianResident === 'no' ? 'Foreign Resident' :
                                         'Not specified'}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                        First Home Buyer
                                    </span>
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                        {formData.isFirstHomeBuyer === 'yes' ? 'Yes' : 
                                         formData.isFirstHomeBuyer === 'no' ? 'No' : 
                                         'Not specified'}
                                    </span>
                                </div>
                                
                                {/* Only show "Owned Property (Last 5 Years)" if it was asked (ACT residents only) */}
                                {formData.isACT && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                            Owned Property (Last 5 Years)
                                        </span>
                                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                            {formData.ownedPropertyLast5Years === 'yes' ? 'Yes' :
                                             formData.ownedPropertyLast5Years === 'no' ? 'No' :
                                             'Not specified'}
                                        </span>
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                        Pensioner
                                    </span>
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                        {formData.hasPensionCard === 'yes' ? 'Yes' :
                                         formData.hasPensionCard === 'no' ? 'No' :
                                         'Not specified'}
                                    </span>
                                </div>
                                
                                {/* Only show "Income" if it was asked (ACT residents only) */}
                                {formData.isACT && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                            Income
                                        </span>
                                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                            {formData.income ? `$${parseInt(formData.income).toLocaleString()}` : 'Not specified'}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Only show "Dependants" if it was asked (ACT residents only) */}
                                {formData.isACT && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                            Dependants
                                        </span>
                                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                            {formData.dependants ? formData.dependants : 'Not specified'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-200"></div>

                            {/* Section 3: Grants and Concessions */}
                            <div className="space-y-0.5">
                                <div className="text-xs text-gray-500 font-medium">Eligible Grants and Concessions</div>
                                
                                {(() => {
                                    // Get upfront costs to access grants and concessions
                                    const upfrontCosts = calculateAllUpfrontCosts();
                                    
                                    // Combine all eligible grants and concessions
                                    const appliedConcessions = upfrontCosts?.concessions || [];
                                    const appliedGrants = upfrontCosts?.grants || [];
                                    const allEligible = [...appliedConcessions, ...appliedGrants];
                                    
                                    
                                    return (
                                        <>
                                            {allEligible.length > 0 ? (
                                                allEligible.map((item, index) => {
                                                    // Determine item name - use same logic as UpfrontCosts
                                                    let itemName = item.type || 'Grant/Concession';
                                                    
                                                    // If it's a grant (no type property), determine the label
                                                    if (!item.type && item.eligible) {
                                                        if (formData.selectedState === 'NT') {
                                                            // Check if this is a FreshStart Grant by looking at the reason or amount
                                                            if (item.reason && item.reason.includes('FreshStart')) {
                                                                itemName = 'FreshStart Grant';
                                                            } else if (item.amount === 30000) {
                                                                // FreshStart Grant is always $30,000
                                                                itemName = 'FreshStart Grant';
                                                            } else {
                                                                itemName = 'HomeGrown Territory Grant';
                                                            }
                                                        } else {
                                                            // Default to First Home Owners Grant for other states
                                                            itemName = 'First Home Owners Grant';
                                                        }
                                                    }
                                                    
                                                    return (
                                                        <div key={index} className="flex justify-between items-center">
                                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                                {itemName}
                                                            </span>
                                                            <span className="text-green-600 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                                -{formatCurrency(item.amount || 0)}
                                                            </span>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-gray-500 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                    No grants or concessions applicable
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-200"></div>

                            {/* Section 4: Financial Summary */}
                            <div className="space-y-0.5">
                                <div className="text-xs text-gray-500 font-medium">Financial Summary</div>
                                
                                {/* Upfront Costs Subheading */}
                                <div className="text-xs text-gray-600 font-medium mt-2">Upfront Costs:</div>
                                
                                {/* Property Price */}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                        Property Price
                                    </span>
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                        {formatCurrency(parseInt(formData.propertyPrice) || 0)}
                                    </span>
                                </div>
                                
                                {/* Other Upfront Costs (excluding property price) */}
                                {(() => {
                                    const upfrontCosts = calculateAllUpfrontCosts();
                                    const propertyPrice = parseInt(formData.propertyPrice) || 0;
                                    const otherUpfrontCosts = (upfrontCosts?.totalUpfrontCosts || 0) - propertyPrice;
                                    
                                    if (otherUpfrontCosts > 0) {
                                        return (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                    Other Upfront Costs
                                                </span>
                                                <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                    {formatCurrency(otherUpfrontCosts)}
                                                </span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                                
                                {/* Total Upfront Costs */}
                                <div className="flex justify-between items-center border-t border-gray-200 pt-1">
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-semibold">
                                        Total Upfront Costs
                                    </span>
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-semibold">
                                        {formatCurrency(getUpfrontCosts())}
                                    </span>
                                </div>
                                
                                {/* Savings Amount */}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                        Available Savings
                                    </span>
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                        {formatCurrency(parseInt(formData.savingsAmount) || 0)}
                                    </span>
                                </div>
                                
                                {/* Divider */}
                                <div className="border-t border-gray-200"></div>
                                
                                {/* Savings Analysis */}
                                {(() => {
                                    const totalUpfront = getUpfrontCosts();
                                    const savings = parseInt(formData.savingsAmount) || 0;
                                    const shortfall = totalUpfront - savings;
                                    
                                    if (shortfall > 0) {
                                        return (
                                            <div className="flex justify-between items-center">
                                                <span className="text-red-600 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                    Shortfall
                                                </span>
                                                <span className="text-red-600 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                    {formatCurrency(shortfall)}
                                                </span>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="flex justify-between items-center">
                                                <span className="text-green-600 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                    Sufficient Savings
                                                </span>
                                                <span className="text-green-600 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                    {formatCurrency(savings - totalUpfront)} remaining
                                                </span>
                                            </div>
                                        );
                                    }
                                })()}
                                
                                {/* Ongoing Costs Subheading */}
                                <div className="text-xs text-gray-600 font-medium mt-2">Ongoing Costs:</div>
                                
                                {/* Monthly Ongoing Costs */}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                        Monthly Ongoing Costs
                                    </span>
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                        {formatCurrency(getMonthlyOngoingCosts())}
                                    </span>
                                </div>
                                
                                {/* Annual Ongoing Costs */}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                        Annual Ongoing Costs
                                    </span>
                                    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                        {formatCurrency(getMonthlyOngoingCosts() * 12)}
                                    </span>
                                </div>
                            </div>

                            {/* Section 5: Loan Details (conditional) */}
                            {formData.needsLoan === 'yes' && (
                                <>
                                    <div className="border-t border-gray-200"></div>
                                    
                                    <div className="space-y-2">
                                        <div className="text-xs text-gray-500 font-medium">Loan Details</div>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                Loan Amount
                                            </span>
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                {formatCurrency(getLoanAmount())}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                Deposit Amount
                                            </span>
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                {formatCurrency(parseInt(formData.loanDeposit) || 0)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                Interest Rate
                                            </span>
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                {formData.loanRate ? `${formData.loanRate}%` : 'Not specified'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                Loan Term
                                            </span>
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                {formData.loanTerm ? `${formData.loanTerm} years` : 'Not specified'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                Loan Type
                                            </span>
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                {formData.loanType === 'principal-and-interest' ? 'Principal & Interest' :
                                                 formData.loanType === 'interest-only' ? 'Interest Only' :
                                                 'Not specified'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                Monthly Repayment
                                            </span>
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                {formatCurrency(formData.MONTHLY_LOAN_REPAYMENT || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

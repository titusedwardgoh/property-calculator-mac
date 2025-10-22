import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStateSelector } from '../states/useStateSelector.js';
import { formatCurrency } from '../states/shared/baseCalculations.js';
import { useFormStore } from '../stores/formStore';
import { ChevronDown } from 'lucide-react'

export default function OngoingCosts() {
    const formData = useFormStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasJiggledOnSellerComplete, setHasJiggledOnSellerComplete] = useState(false);
    
    // Update ongoing costs when relevant fields change
    useEffect(() => {
        formData.updateOngoingCosts();
    }, [formData.councilRates, formData.waterRates, formData.bodyCorp, formData.updateOngoingCosts]);
    
    // Check if PropertyDetails form is actually complete (after pressing Complete button)
    const isPropertyComplete = formData.propertyDetailsFormComplete;
    const buyerDetailsComplete = formData.buyerDetailsComplete;
    const needsLoan = formData.needsLoan;
    const loanDetailsComplete = formData.loanDetailsComplete;
    const showSellerQuestions = formData.showSellerQuestions;
    const sellerQuestionsComplete = formData.sellerQuestionsComplete;

    // Get state-specific functions when state is selected
    const { stateFunctions } = useStateSelector(formData.selectedState || 'NSW');

    // Determine if ongoing costs should be available
    const shouldShowOngoingCosts = () => {
        if (!isPropertyComplete || !buyerDetailsComplete) return false;
        
        // If loan is required, show after loan details complete
        if (needsLoan === 'yes') {
            return loanDetailsComplete;
        }
        
        // If no loan, only show after seller questions complete (when we have data)
        return sellerQuestionsComplete;
    };

    const canShowDropdown = shouldShowOngoingCosts();

    // Trigger jiggle when SellerQuestions complete (only once) AND OngoingCosts is already visible
    // This prevents jiggle when OngoingCosts first appears during seller questions complete (no loan case)
    useEffect(() => {
        if (formData.sellerQuestionsComplete && !hasJiggledOnSellerComplete && canShowDropdown) {
            // Only jiggle if OngoingCosts was already visible (loan case) before seller questions complete
            const wasAlreadyVisible = formData.needsLoan === 'yes' && formData.loanDetailsComplete;
            if (wasAlreadyVisible) {
                setHasJiggledOnSellerComplete(true);
            }
        }
    }, [formData.sellerQuestionsComplete, canShowDropdown, formData.needsLoan, formData.loanDetailsComplete]);

    // Close dropdown when navigating between form sections
    useEffect(() => {
        if (formData.openDropdown === 'ongoing') {
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

    // Sync with shared dropdown state
    useEffect(() => {
        setIsExpanded(formData.openDropdown === 'ongoing');
    }, [formData.openDropdown]);

    // Show invisible placeholder when not available yet to prevent layout shift
    if (!canShowDropdown) {
        return (
            <div className="invisible" aria-hidden="true">
                <div className="bg-secondary rounded-lg shadow-lg px-4 py-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-md lg:text-lg xl:text-xl font-medium text-base-100">Ongoing Costs</h3>
                    </div>
                </div>
            </div>
        );
    }

    const toggleExpanded = () => {
        if (canShowDropdown) {
            if (isExpanded) {
                // Close this dropdown
                formData.updateFormData('openDropdown', null);
            } else {
                // Close other dropdown first, then open this one
                formData.updateFormData('openDropdown', 'ongoing');
            }
        }
    };

    // Get ongoing costs
    const getOngoingCosts = () => {
        if (!canShowDropdown) {
            return {
                totalOngoingCosts: 0,
                costs: []
            };
        }

        // No costs to display yet
        return {
            totalOngoingCosts: 0,
            costs: []
        };
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
                animate={hasJiggledOnSellerComplete ? {
                    x: [0, 4, -4, 4, -4, 0],
                    rotate: [0, 0.1, -0.1, 0.1, -0.1, 0]
                } : {}}
                transition={{ duration: 0.5 }}
                onAnimationComplete={() => {
                    setHasJiggledOnSellerComplete(false);
                }}
                className={`bg-secondary rounded-lg shadow-lg px-4 py-3 ${canShowDropdown ? 'cursor-pointer hover:shadow-xl transition-shadow duration-200' : ''}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <h3 className="text-md lg:text-lg xl:text-xl font-medium text-base-100">Ongoing Costs</h3>
                    </div>
                    <div className="text-right">
                        <AnimatePresence>
                            {canShowDropdown && (
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
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
            
            {/* Dropdown overlay - appears above the component without pushing content down */}
            <AnimatePresence>
                {isExpanded && canShowDropdown && (
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
                        <div className="space-y-3 py-3">
                        {(() => {
                            const hasLoan = loanDetailsComplete && needsLoan === 'yes' && formData.MONTHLY_LOAN_REPAYMENT > 0;
                            const showCosts = hasLoan || sellerQuestionsComplete;
                            
                            if (!showCosts) {
                                return <div className="text-xs text-gray-500 mb-3">No ongoing costs calculated yet.</div>;
                            }
                            
                            // Reusable components for property costs
                            const renderAnnualPropertyCosts = () => (
                                <>
                                    {formData.sellerQuestionsComplete && formData.councilRates > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                Council Rates
                                            </span>
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                {formatCurrency(parseInt(formData.councilRates) || 0)}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {formData.sellerQuestionsComplete && formData.waterRates > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                Water Rates
                                            </span>
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                {formatCurrency(parseInt(formData.waterRates) || 0)}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {formData.sellerQuestionsComplete && formData.bodyCorp > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                Body Corporate
                                            </span>
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                {formatCurrency(parseInt(formData.bodyCorp) || 0)}
                                            </span>
                                        </div>
                                    )}
                                </>
                            );
                            
                            const renderMonthlyPropertyCosts = () => (
                                <>
                                    {formData.sellerQuestionsComplete && formData.COUNCIL_RATES_MONTHLY > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                Council Rates
                                            </span>
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                {formatCurrency(formData.COUNCIL_RATES_MONTHLY)}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {formData.sellerQuestionsComplete && formData.WATER_RATES_MONTHLY > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                Water Rates
                                            </span>
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                {formatCurrency(formData.WATER_RATES_MONTHLY)}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {formData.sellerQuestionsComplete && formData.BODY_CORP_MONTHLY > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                Body Corporate
                                            </span>
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                {formatCurrency(formData.BODY_CORP_MONTHLY)}
                                            </span>
                                        </div>
                                    )}
                                </>
                            );
                            
                            return (
                                <>
                                    <div className="text-xs text-gray-500 mb-2 pt-2">
                                        {hasLoan && formData.loanType === 'interest-only' && formData.loanInterestOnlyPeriod ? 
                                            `Total Estimated Ongoing Costs During Interest Only Period (${formData.loanInterestOnlyPeriod} ${parseInt(formData.loanInterestOnlyPeriod) === 1 ? 'year' : 'years'}):` : 
                                            'Total Estimated Ongoing Costs:'
                                        }
                                    </div>
                                    
                                    {/* Monthly Section */}
                                    <div className="mb-6">
                                        {hasLoan && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                    Loan Repayment
                                                </span>
                                                <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                    {formatCurrency(formData.MONTHLY_LOAN_REPAYMENT)}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {renderMonthlyPropertyCosts()}
                                        
                                        <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2 pb-2 border-b border-gray-200">
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-semibold">
                                                Total Monthly Ongoing Costs
                                            </span>
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-semibold">
                                                {formatCurrency(
                                                    (hasLoan ? formData.MONTHLY_LOAN_REPAYMENT : 0) + 
                                                    (formData.sellerQuestionsComplete ? formData.COUNCIL_RATES_MONTHLY : 0) + 
                                                    (formData.sellerQuestionsComplete ? formData.WATER_RATES_MONTHLY : 0) + 
                                                    (formData.sellerQuestionsComplete ? formData.BODY_CORP_MONTHLY : 0)
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Annual Section */}
                                    <div>
                                        {hasLoan && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                                    Loan Repayment
                                                </span>
                                                <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                    {formatCurrency(formData.ANNUAL_LOAN_REPAYMENT)}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {renderAnnualPropertyCosts()}
                                        
                                        <div className={`flex justify-between items-center border-t border-gray-200 pt-2 mt-2 ${hasLoan ? 'pb-2' : 'pb-2'}`}>
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-semibold">
                                                Total Annual Ongoing Costs
                                            </span>
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-semibold">
                                                {formatCurrency(
                                                    (hasLoan ? formData.ANNUAL_LOAN_REPAYMENT : 0) + 
                                                    (formData.sellerQuestionsComplete ? (parseInt(formData.councilRates) || 0) : 0) + 
                                                    (formData.sellerQuestionsComplete ? (parseInt(formData.waterRates) || 0) : 0) + 
                                                    (formData.sellerQuestionsComplete ? (parseInt(formData.bodyCorp) || 0) : 0)
                                                )}
                                            </span>
                                        </div>
                                    </div>
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

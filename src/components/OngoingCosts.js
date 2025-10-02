import { useState, useEffect } from 'react';
import { useStateSelector } from '../states/useStateSelector.js';
import { formatCurrency } from '../states/shared/baseCalculations.js';
import { useFormStore } from '../stores/formStore';
import { ChevronDown } from 'lucide-react';

export default function OngoingCosts() {
    const formData = useFormStore();
    const [isExpanded, setIsExpanded] = useState(false);
    
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
        
        // If no loan but seller questions required, show after seller questions complete
        if (showSellerQuestions) {
            return sellerQuestionsComplete;
        }
        
        // If no loan and no seller questions, show after buyer details complete
        return true;
    };

    const canShowDropdown = shouldShowOngoingCosts();

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
        <div className="relative">
            <div 
                onClick={toggleExpanded}
                className={`bg-secondary rounded-lg shadow-lg px-4 py-3 ${canShowDropdown ? 'cursor-pointer hover:shadow-xl transition-shadow duration-200' : ''}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <h3 className="text-md lg:text-lg xl:text-xl font-medium text-base-100">Ongoing Costs</h3>
                    </div>
                    <div className="text-right">
                        {canShowDropdown && (
                            <ChevronDown 
                                size={20} 
                                className={`text-base-100 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                        )}
                    </div>
                </div>
            </div>
            
            {/* Dropdown overlay - appears above the component without pushing content down */}
            {isExpanded && canShowDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 px-4 py-3 z-10">
                    <div className="space-y-3">
                        {loanDetailsComplete && needsLoan === 'yes' && formData.MONTHLY_LOAN_REPAYMENT > 0 ? (
                            <>
                                <div className="text-xs text-gray-500 mb-3">Ongoing Costs:</div>
                                
                                {/* Monthly Section */}
                                <div className="mb-6">
                                    {/* Monthly Loan Repayment */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                            Monthly Loan Repayment
                                        </span>
                                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                            {formatCurrency(formData.MONTHLY_LOAN_REPAYMENT)}
                                        </span>
                                    </div>
                                    
                                    {/* Monthly Total */}
                                    <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2 pb-2 border-b border-gray-200">
                                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-semibold">
                                            Total Monthly Ongoing Costs
                                        </span>
                                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-semibold">
                                            {formatCurrency(formData.MONTHLY_LOAN_REPAYMENT)}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Annual Section */}
                                <div>
                                    {/* Annual Loan Repayment */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">
                                            Annual Loan Repayment
                                        </span>
                                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                            {formatCurrency(formData.ANNUAL_LOAN_REPAYMENT)}
                                        </span>
                                    </div>
                                    
                                    {/* Annual Total */}
                                    <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2 pb-2 border-b border-gray-200">
                                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-semibold">
                                            Total Annual Ongoing Costs
                                        </span>
                                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-semibold">
                                            {formatCurrency(formData.ANNUAL_LOAN_REPAYMENT)}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-xs text-gray-500 mb-3">No ongoing costs calculated yet.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

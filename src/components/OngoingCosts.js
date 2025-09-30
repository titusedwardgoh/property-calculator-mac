import { useState, useEffect } from 'react';
import { useStateSelector } from '../states/useStateSelector.js';
import { formatCurrency } from '../states/shared/baseCalculations.js';
import { useFormStore } from '../stores/formStore';

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

    // Close expanded state when formData changes (navigation occurs)
    useEffect(() => {
        setIsExpanded(false);
    }, [formData]);

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

    // Get ongoing costs (placeholder for now)
    const getOngoingCosts = () => {
        if (!canShowDropdown) {
            return {
                totalOngoingCosts: 0,
                costs: []
            };
        }

        // Placeholder costs for testing dropdown functionality
        const costs = [
            {
                type: 'Council Rates',
                amount: 2500,
                description: 'Annual council rates (placeholder)'
            },
            {
                type: 'Water Rates',
                amount: 1200,
                description: 'Annual water and sewerage rates (placeholder)'
            },
            {
                type: 'Home Insurance',
                amount: 1800,
                description: 'Annual home and contents insurance (placeholder)'
            },
            {
                type: 'Maintenance',
                amount: 3000,
                description: 'Annual maintenance and repairs (placeholder)'
            }
        ];

        const totalOngoingCosts = costs.reduce((sum, cost) => sum + cost.amount, 0);

        return {
            totalOngoingCosts,
            costs
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
                        <div className="text-md lg:text-lg xl:text-xl font-semibold text-base-100">
                            {canShowDropdown ? formatCurrency(getOngoingCosts().totalOngoingCosts) : '$0'}
                        </div>
                        <div className="text-xs text-base-100 opacity-75"></div>
                    </div>
                </div>
            </div>
            
            {/* Dropdown overlay - appears above the component without pushing content down */}
            {isExpanded && canShowDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 px-4 py-3 z-10">
                    <div className="space-y-3">
                        {(() => {
                            const ongoingCosts = getOngoingCosts();
                            
                            return (
                                <>
                                    <div className="text-xs text-gray-500 mb-3">Estimated Annual Ongoing Costs:</div>
                                    
                                    {/* Individual cost items */}
                                    {ongoingCosts.costs.map((cost, index) => (
                                        <div key={index} className="flex justify-between items-center">
                                            <span 
                                                className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg relative group cursor-help" 
                                                title={cost.description}
                                            >
                                                {cost.type}
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none max-w-xs z-20">
                                                    {cost.description}
                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                                </div>
                                            </span>
                                            <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
                                                {formatCurrency(cost.amount)}
                                            </span>
                                        </div>
                                    ))}
                                    
                                    {/* Total */}
                                    <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-3">
                                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-semibold">Total Annual Ongoing Costs</span>
                                        <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-semibold">
                                            {formatCurrency(ongoingCosts.totalOngoingCosts)}
                                        </span>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}

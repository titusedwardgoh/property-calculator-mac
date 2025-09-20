import { useState, useEffect } from 'react';
import { useStateSelector } from '../states/useStateSelector.js';
import { formatCurrency } from '../states/shared/baseCalculations.js';
import { useFormStore } from '../stores/formStore';

export default function OngoingCosts() {
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

    // Calculate ongoing costs
    const calculateAllOngoingCosts = () => {
        if (!formData.propertyDetailsFormComplete) {
            return {
                totalOngoingCosts: 0,
                costs: []
            };
        }

        const propertyPrice = parseInt(formData.propertyPrice) || 0;
        const costs = [];

        // Council Rates - estimated at 0.5% of property value per year
        const councilRates = propertyPrice * 0.005;
        costs.push({
            type: 'Council Rates',
            amount: councilRates,
            description: 'Estimated annual council rates (0.5% of property value)'
        });

        // Water Rates - estimated at $800-1500 per year
        const waterRates = 1200;
        costs.push({
            type: 'Water Rates',
            amount: waterRates,
            description: 'Estimated annual water and sewerage rates'
        });

        // Insurance - estimated at 0.3% of property value per year
        const insurance = propertyPrice * 0.003;
        costs.push({
            type: 'Home Insurance',
            amount: insurance,
            description: 'Estimated annual home and contents insurance (0.3% of property value)'
        });

        // Strata Fees (for units/apartments)
        if (formData.propertyType === 'unit' || formData.propertyType === 'apartment') {
            const strataFees = 3000; // Estimated $3000 per year
            costs.push({
                type: 'Strata Fees',
                amount: strataFees,
                description: 'Estimated annual strata/body corporate fees'
            });
        }

        // Property Management (if investment property)
        if (formData.isPPR === 'no') {
            const propertyManagement = propertyPrice * 0.006; // 6% of annual rent (assuming 6% rental yield)
            costs.push({
                type: 'Property Management',
                amount: propertyManagement,
                description: 'Estimated annual property management fees (6% of rental income)'
            });
        }

        // Maintenance and Repairs - estimated at 1% of property value per year
        const maintenance = propertyPrice * 0.01;
        costs.push({
            type: 'Maintenance & Repairs',
            amount: maintenance,
            description: 'Estimated annual maintenance and repair costs (1% of property value)'
        });

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
                className={`bg-secondary rounded-lg shadow-lg px-4 py-3 ${isPropertyComplete ? 'cursor-pointer hover:shadow-xl transition-shadow duration-200' : ''}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <h3 className="text-md lg:text-lg xl:text-xl font-medium text-base-100">Ongoing Costs</h3>
                    </div>
                    <div className="text-right">
                        <div className="text-md lg:text-lg xl:text-xl font-semibold text-base-100">
                            {isPropertyComplete ? formatCurrency(calculateAllOngoingCosts().totalOngoingCosts) : '$0'}
                        </div>
                        <div className="text-xs text-base-100 opacity-75"></div>
                    </div>
                </div>
            </div>
            
            {/* Dropdown overlay - appears above the component without pushing content down */}
            {isExpanded && isPropertyComplete && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 px-4 py-3 z-10">
                    <div className="space-y-3">
                        {(() => {
                            const ongoingCosts = calculateAllOngoingCosts();
                            
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
                                    
                                    {/* Disclaimer */}
                                    <div className="border-t border-gray-200 pt-3 mt-3">
                                        <div className="text-xs text-gray-500">
                                            <strong>Disclaimer:</strong> These are estimated costs based on typical property expenses. 
                                            Actual costs may vary significantly based on location, property condition, local rates, 
                                            and personal circumstances. Please consult with local professionals for accurate estimates.
                                        </div>
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

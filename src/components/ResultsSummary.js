"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, DollarSign, Download, Mail, Edit, Plus, ArrowRight, Loader2, CheckCircle2, ChevronDown, User, Landmark, Award, Info, Receipt } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '../states/shared/baseCalculations.js';
import { formatFieldValue } from '../lib/fieldMapping.js';
import { buildResultsSummary } from '../lib/resultsSummary/buildResultsSummary';
import { setPendingSurveyLink } from '../lib/pendingSurveyLink';
import { resetSessionAndForm } from '../lib/sessionManager';

export default function ResultsSummary({
    formData,
    stateFunctions,
    user,
    router,
    propertyId,
    onEmailPDF,
    isEmailingPDF,
    showEmailSuccess,
    emailSuccessData,
    setShowReviewOverlay,
    setOriginalLoadedState,
}) {
    const [isPropertyCardExpanded, setIsPropertyCardExpanded] = useState(false);
    const [isBuyerCardExpanded, setIsBuyerCardExpanded] = useState(false);
    const [isLoanCardExpanded, setIsLoanCardExpanded] = useState(false);
    const [isOtherCostsCardExpanded, setIsOtherCostsCardExpanded] = useState(false);
    const [isUpfrontCostsExpanded, setIsUpfrontCostsExpanded] = useState(false);
    const [isOngoingCostsExpanded, setIsOngoingCostsExpanded] = useState(false);
    const [isMonthlyOutflowExpanded, setIsMonthlyOutflowExpanded] = useState(false);
    const [isAnnualizedCostExpanded, setIsAnnualizedCostExpanded] = useState(false);
    const [isMobileOngoingCosts, setIsMobileOngoingCosts] = useState(false);
    const [isGrantsCardExpanded, setIsGrantsCardExpanded] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 639px)');
        const update = () => setIsMobileOngoingCosts(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    const monthlyOutflowExpanded = isMobileOngoingCosts ? isMonthlyOutflowExpanded : isOngoingCostsExpanded;
    const annualizedCostExpanded = isMobileOngoingCosts ? isAnnualizedCostExpanded : isOngoingCostsExpanded;

    const toggleMonthlyOutflow = () => {
        if (isMobileOngoingCosts) {
            setIsMonthlyOutflowExpanded((prev) => !prev);
        } else {
            setIsOngoingCostsExpanded((prev) => !prev);
        }
    };

    const toggleAnnualizedCost = () => {
        if (isMobileOngoingCosts) {
            setIsAnnualizedCostExpanded((prev) => !prev);
        } else {
            setIsOngoingCostsExpanded((prev) => !prev);
        }
    };

    const {
        totalPurchaseCost,
        appliedConcessions,
        appliedGrants,
        grantsConcessionsTotal,
        hasLoan,
        grossStampDutyAmount,
        grantsAndConcessionsList,
        monthlyCashFlow,
        annualOperatingCost,
        propertyDisplayAddress,
        propertyDisplayPrice,
        buyerTypeDisplay,
        buyerSavingsAmount,
        buyerSavingsShortfall,
        buyerDetailRows,
        loanTypeDisplay,
        loanAmountDisplay,
        loanDetailRows,
        loanLmiDisplay,
        loanLvrDisplay,
        settlementOtherCostsTotal,
        annualOtherCostsTotal,
        otherCostsDetailRows,
    } = buildResultsSummary(formData, stateFunctions);

    const getGrantsAndConcessionsList = () => grantsAndConcessionsList;

    return (
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key="all-forms-complete"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                                className="mt-8 md:mt-4 w-full"
                                            >
                                                <div className="max-w-6xl mx-auto space-y-6">
                                                    {/* Page Intro Text */}
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                                                        className="text-center mb-2 md:pt-4"
                                                    >
                                                        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-secondary leading-tight">
                                                            Results Summary
                                                        </h2>
                                                    </motion.div>

                                                    <div className="flex flex-col lg:grid lg:grid-cols-12 lg:items-stretch gap-6">
                                                        {/* Right column on desktop: reference info */}
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                                                            className="w-full lg:col-span-5 order-2 lg:h-full"
                                                        >
                                                            <div className="bg-base-200 border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm h-full flex flex-col justify-start gap-4">
                                                        {/* Property summary */}
                                                            <div
                                                                className="flex flex-col gap-4 bg-[#fef6e4]/45 border border-[#fef6e4] rounded-xl p-5 cursor-pointer hover:bg-[#fef6e4]/70 transition-all duration-200 select-none shadow-sm shrink-0"
                                                                onClick={() => setIsPropertyCardExpanded(!isPropertyCardExpanded)}
                                                            >
                                                                {/* Card Header Row */}
                                                                <div className="flex flex-col gap-3">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="p-2.5 bg-white rounded-lg border border-[#fef6e4] shadow-sm shrink-0">
                                                                            <Home className="w-5 h-5 text-primary" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Property Address</span>
                                                                            <p className="text-sm lg:text-base font-bold text-secondary mt-0.5 break-words">
                                                                                {propertyDisplayAddress}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 w-full justify-between">
                                                                        <div>
                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Property Price</span>
                                                                            <p className="text-xl lg:text-2xl font-black text-secondary mt-0.5 tracking-tight">
                                                                                {formatCurrency(propertyDisplayPrice)}
                                                                            </p>
                                                                        </div>
                                                                        <div className="p-1.5 hover:bg-black/5 rounded-full transition-colors shrink-0">
                                                                            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isPropertyCardExpanded ? 'rotate-180' : ''}`} />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Expanded Details Row */}
                                                                <AnimatePresence initial={false}>
                                                                    {isPropertyCardExpanded && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: "auto", opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                            className="overflow-hidden border-t border-[#fef6e4] pt-4 mt-2"
                                                                            onClick={(e) => e.stopPropagation()} // Prevent collapse on detail click
                                                                        >
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm text-secondary">
                                                                                {/* State */}
                                                                                <div>
                                                                                    <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">State</span>
                                                                                    <p className="font-semibold text-secondary mt-0.5">{formData.selectedState || 'Not specified'}</p>
                                                                                </div>

                                                                                {/* New/Existing (propertyType) */}
                                                                                <div>
                                                                                    <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">New/Existing</span>
                                                                                    <p className="font-semibold text-secondary mt-0.5">{formatFieldValue('propertyType', formData.propertyType)}</p>
                                                                                </div>

                                                                                {/* Property Type (propertyCategory) */}
                                                                                <div>
                                                                                    <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Property Type</span>
                                                                                    <p className="font-semibold text-secondary mt-0.5">{formatFieldValue('propertyCategory', formData.propertyCategory)}</p>
                                                                                </div>

                                                                                {/* Construction Started (conditional) */}
                                                                                {(formData.propertyType === 'off-the-plan' || formData.propertyType === 'house-and-land') && formData.constructionStarted && (
                                                                                    <div>
                                                                                        <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Construction Started</span>
                                                                                        <p className="font-semibold text-secondary mt-0.5">{formatFieldValue('constructionStarted', formData.constructionStarted)}</p>
                                                                                    </div>
                                                                                )}

                                                                                {/* Dutiable Value (conditional) */}
                                                                                {formData.dutiableValue && (
                                                                                    <div>
                                                                                        <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Dutiable Value</span>
                                                                                        <p className="font-semibold text-secondary mt-0.5">{formatFieldValue('dutiableValue', formData.dutiableValue)}</p>
                                                                                    </div>
                                                                                )}

                                                                                {/* WA Specific Fields */}
                                                                                {formData.selectedState === 'WA' && (
                                                                                    <>
                                                                                        {formData.isWA && (
                                                                                            <div>
                                                                                                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">WA Region</span>
                                                                                                <p className="font-semibold text-secondary mt-0.5">{formatFieldValue('isWA', formData.isWA)}</p>
                                                                                            </div>
                                                                                        )}
                                                                                        {formData.isWAMetro && (
                                                                                            <div>
                                                                                                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Metro Area</span>
                                                                                                <p className="font-semibold text-secondary mt-0.5">{formatFieldValue('isWAMetro', formData.isWAMetro)}</p>
                                                                                            </div>
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>

                                                        {/* Buyer summary */}
                                                            <div
                                                                className="flex flex-col gap-4 bg-[#fef6e4]/45 border border-[#fef6e4] rounded-xl p-5 cursor-pointer hover:bg-[#fef6e4]/70 transition-all duration-200 select-none shadow-sm shrink-0"
                                                                onClick={() => setIsBuyerCardExpanded(!isBuyerCardExpanded)}
                                                            >
                                                                <div className="flex flex-col gap-3">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="p-2.5 bg-white rounded-lg border border-[#fef6e4] shadow-sm shrink-0">
                                                                            <User className="w-5 h-5 text-primary" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Buyer Type</span>
                                                                            <p className="text-sm lg:text-base font-bold text-secondary mt-0.5">
                                                                                {buyerTypeDisplay}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 w-full justify-between">
                                                                        <div>
                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Available Savings</span>
                                                                            <p className="text-xl lg:text-2xl font-black text-secondary mt-0.5 tracking-tight">
                                                                                {formatCurrency(buyerSavingsAmount)}
                                                                            </p>
                                                                        </div>
                                                                        <div className="p-1.5 hover:bg-black/5 rounded-full transition-colors shrink-0">
                                                                            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isBuyerCardExpanded ? 'rotate-180' : ''}`} />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <AnimatePresence initial={false}>
                                                                    {isBuyerCardExpanded && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: "auto", opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                            className="overflow-hidden border-t border-[#fef6e4] pt-4 mt-2"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm text-secondary">
                                                                                {buyerDetailRows.map(({ key, label, value }) => (
                                                                                    <div key={key}>
                                                                                        <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
                                                                                        <p className="font-semibold text-secondary mt-0.5">{value}</p>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>

                                                        {/* Loan summary */}
                                                                <div
                                                                    className="flex flex-col gap-4 bg-[#fef6e4]/45 border border-[#fef6e4] rounded-xl p-5 cursor-pointer hover:bg-[#fef6e4]/70 transition-all duration-200 select-none shadow-sm shrink-0"
                                                                    onClick={() => setIsLoanCardExpanded(!isLoanCardExpanded)}
                                                                >
                                                                    <div className="flex flex-col gap-3">
                                                                        <div className="flex items-center gap-3 min-w-0">
                                                                            <div className="p-2.5 bg-white rounded-lg border border-[#fef6e4] shadow-sm shrink-0">
                                                                                <Landmark className="w-5 h-5 text-primary" />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Loan Type</span>
                                                                                <p className="text-sm lg:text-base font-bold text-secondary mt-0.5">
                                                                                    {hasLoan ? loanTypeDisplay : 'N/A'}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 w-full justify-between">
                                                                            <div>
                                                                                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Loan Amount</span>
                                                                                <p className="text-xl lg:text-2xl font-black text-secondary mt-0.5 tracking-tight">
                                                                                    {hasLoan ? formatCurrency(loanAmountDisplay) : 'N/A'}
                                                                                </p>
                                                                            </div>
                                                                            <div className="p-1.5 hover:bg-black/5 rounded-full transition-colors shrink-0">
                                                                                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isLoanCardExpanded ? 'rotate-180' : ''}`} />
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <AnimatePresence initial={false}>
                                                                        {isLoanCardExpanded && (
                                                                            <motion.div
                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                animate={{ height: "auto", opacity: 1 }}
                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                                className="overflow-hidden border-t border-[#fef6e4] pt-4 mt-2"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm text-secondary">
                                                                                    {loanDetailRows.map(({ key, label, value }) => (
                                                                                        <div key={key}>
                                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
                                                                                            <p className="font-semibold text-secondary mt-0.5">{value}</p>
                                                                                        </div>
                                                                                    ))}
                                                                                    {(loanLmiDisplay !== null) && (
                                                                                        <div>
                                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">LMI Premium</span>
                                                                                            <p className="font-semibold text-secondary mt-0.5">
                                                                                                {loanLmiDisplay}
                                                                                            </p>
                                                                                        </div>
                                                                                    )}
                                                                                    {(loanLvrDisplay !== null) && (
                                                                                        <div>
                                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">LVR (ex LMI)</span>
                                                                                            <p className="font-semibold text-secondary mt-0.5">
                                                                                                {loanLvrDisplay}
                                                                                            </p>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>

                                                        {/* Other costs summary */}
                                                            <div
                                                                className="flex flex-col gap-4 bg-[#fef6e4]/45 border border-[#fef6e4] rounded-xl p-5 cursor-pointer hover:bg-[#fef6e4]/70 transition-all duration-200 select-none shadow-sm shrink-0"
                                                                onClick={() => setIsOtherCostsCardExpanded(!isOtherCostsCardExpanded)}
                                                            >
                                                                <div className="flex flex-col gap-3">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="p-2.5 bg-white rounded-lg border border-[#fef6e4] shadow-sm shrink-0">
                                                                            <Receipt className="w-5 h-5 text-primary" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Other Costs</span>
                                                                            <p className="text-sm lg:text-base font-bold text-secondary mt-0.5">
                                                                                At settlement fees
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 w-full justify-between">
                                                                        <div>
                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Settlement Total</span>
                                                                            <p className="text-xl lg:text-2xl font-black text-secondary mt-0.5 tracking-tight">
                                                                                {formatCurrency(settlementOtherCostsTotal)}
                                                                            </p>
                                                                            {annualOtherCostsTotal > 0 && (
                                                                                <p className="text-xs text-gray-500 mt-1">
                                                                                    {formatCurrency(annualOtherCostsTotal)}/yr in ongoing rates
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <div className="p-1.5 hover:bg-black/5 rounded-full transition-colors shrink-0">
                                                                            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isOtherCostsCardExpanded ? 'rotate-180' : ''}`} />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <AnimatePresence initial={false}>
                                                                    {isOtherCostsCardExpanded && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: "auto", opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                            className="overflow-hidden border-t border-[#fef6e4] pt-4 mt-2"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm text-secondary">
                                                                                {otherCostsDetailRows.map(({ key, label, value }) => (
                                                                                    <div key={key}>
                                                                                        <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
                                                                                        <p className="font-semibold text-secondary mt-0.5">{value}</p>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>

                                                            </div>
                                                        </motion.div>

                                                        {/* Left column on desktop: financial summary */}
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                                                            className="w-full lg:col-span-7 order-1 lg:h-full"
                                                        >
                                                            <div className="bg-base-200 border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">

                                                        {/* Settlement Section */}
                                                        <div className="space-y-6">
                                                            <div>
                                                                <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-0.5">At Settlement</h3>
                                                                <h4 className="text-xl font-bold text-secondary">Upfront Costs</h4>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                {/* Hero: Net Upfront Costs */}
                                                                <div
                                                                    onClick={() => setIsUpfrontCostsExpanded(!isUpfrontCostsExpanded)}
                                                                    className={`md:col-span-3 border-2 border-primary bg-[#E29578]/5 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 hover:shadow-md select-none ${isUpfrontCostsExpanded ? 'pb-4' : 'min-h-[130px]'}`}
                                                                >
                                                                    <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 pointer-events-none text-primary">
                                                                        <DollarSign className="w-36 h-36" />
                                                                    </div>
                                                                    <div className="flex items-center justify-between w-full mb-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="p-1.5 bg-primary rounded-lg text-white">
                                                                                <DollarSign className="w-4 h-4" />
                                                                            </div>
                                                                            <span className="text-xs font-bold uppercase tracking-wider text-primary">Net Upfront Costs</span>
                                                                        </div>
                                                                        <div className="p-1.5 hover:bg-black/5 rounded-full transition-colors shrink-0">
                                                                            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isUpfrontCostsExpanded ? 'rotate-180' : ''}`} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col justify-between">
                                                                        <p className="text-3xl md:text-4xl font-black tracking-tight text-secondary">
                                                                            {formatCurrency(totalPurchaseCost)}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 mt-1">Total cash required at settlement after grants and concessions</p>
                                                                    </div>

                                                                    <AnimatePresence initial={false}>
                                                                        {isUpfrontCostsExpanded && (
                                                                            <motion.div
                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                animate={{ height: "auto", opacity: 1 }}
                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                                className="overflow-hidden border-t border-primary/20 pt-4 mt-4"
                                                                                onClick={(e) => e.stopPropagation()} // Prevent collapse on detail click
                                                                            >
                                                                                <div className="space-y-2 text-sm text-secondary">
                                                                                    {(() => {
                                                                                        const activeConcessions = appliedConcessions.filter(c => c.amount > 0);
                                                                                        const concessionsTotal = activeConcessions.reduce((sum, c) => sum + c.amount, 0);
                                                                                        const hasConcessions = activeConcessions.length > 0;
                                                                                        const netStampDutyVal = Math.max(0, grossStampDutyAmount - concessionsTotal);

                                                                                        const activeGrants = appliedGrants.filter(g => g.amount > 0);
                                                                                        const grantsTotal = activeGrants.reduce((sum, g) => sum + g.amount, 0);
                                                                                        const hasGrants = activeGrants.length > 0;
                                                                                        const totalBeforeGrants = totalPurchaseCost + grantsTotal;

                                                                                        const depositVal = hasLoan
                                                                                            ? (parseInt(formData.loanDeposit) || 0)
                                                                                            : (parseInt(formData.propertyPrice) || 0);

                                                                                        const bankSettlementFee = hasLoan ? (parseInt(formData.loanSettlementFees) || 0) : 0;
                                                                                        const loanEstablishmentFee = hasLoan ? (parseInt(formData.loanEstablishmentFee) || 0) : 0;
                                                                                        const bankLoanFeesSubtotal = bankSettlementFee + loanEstablishmentFee;

                                                                                        const landTransferFee = formData.sellerQuestionsComplete ? (parseInt(formData.landTransferFee) || 0) : 0;
                                                                                        const legalFees = formData.sellerQuestionsComplete ? (parseInt(formData.legalFees) || 0) : 0;
                                                                                        const buildingAndPestFee = formData.sellerQuestionsComplete ? (parseInt(formData.buildingAndPestInspection) || 0) : 0;
                                                                                        const firbFee = (formData.buyerDetailsComplete && formData.isAustralianResident === 'no')
                                                                                            ? (parseInt(formData.FIRBFee) || 0)
                                                                                            : 0;
                                                                                        const otherCostsSubtotal = landTransferFee + legalFees + buildingAndPestFee + firbFee;

                                                                                        const getConcessionLabel = (type) => {
                                                                                            switch (type) {
                                                                                                case 'Pensioner': return 'Pensioner Duty Concession';
                                                                                                case 'First Home Buyer': return 'First Home Buyer Concession';
                                                                                                case 'First Home Owner': return 'First Home Owner Concession';
                                                                                                case 'First Home Duty Relief': return 'First Home Duty Relief';
                                                                                                case 'Off-The-Plan': return 'Off-The-Plan Concession';
                                                                                                case 'Off the Plan Exemption': return 'Off the Plan Exemption';
                                                                                                case 'Pensioner Concession': return 'Pensioner Concession';
                                                                                                case 'Owner Occupier Concession': return 'Owner Occupier Concession';
                                                                                                case 'Temp Off-The-Plan': return 'Temp Off-The-Plan Concession';
                                                                                                case 'Home Concession': return 'Home Concession';
                                                                                                case 'First Home Concession': return 'First Home Concession';
                                                                                                case 'First Home (New) Concession': return 'First Home (New) Concession';
                                                                                                case 'First Home (Vac Land) Concession': return 'First Home (Vac Land) Concession';
                                                                                                case 'House and Land': return 'House and Land Concession';
                                                                                                case 'Home Buyer Concession': return 'Home Buyer Concession';
                                                                                                default: return `Stamp Duty Concession${type ? ` (${type})` : ''}`;
                                                                                            }
                                                                                        };

                                                                                        return (
                                                                                            <div className="divide-y divide-primary/10">
                                                                                                {/* 1. Deposit or Property Price */}
                                                                                                <div className="flex justify-between items-center py-2 text-secondary font-medium">
                                                                                                    <span>{hasLoan ? 'Deposit' : 'Property Price'}</span>
                                                                                                    <span className="font-bold">{formatCurrency(depositVal)}</span>
                                                                                                </div>

                                                                                                {/* 2. Stamp Duty (Gross) & Concessions & Net State Duty */}
                                                                                                {hasConcessions ? (
                                                                                                    <div className="py-2 space-y-1">
                                                                                                        <div className="flex justify-between items-center text-sm text-gray-500 pl-4">
                                                                                                            <span>Stamp Duty (Gross)</span>
                                                                                                            <span className="font-medium pr-12">{formatCurrency(grossStampDutyAmount)}</span>
                                                                                                        </div>
                                                                                                        {activeConcessions.map((c, i) => (
                                                                                                            <div key={i} className="flex justify-between items-center text-sm pl-4">
                                                                                                                <span className="text-gray-500">{getConcessionLabel(c.type)}</span>
                                                                                                                <span className="font-semibold text-green-600 pr-12">-{formatCurrency(c.amount)}</span>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                        <div className="flex justify-between items-center py-1 pt-1.5 border-t border-dashed border-primary/10 font-semibold text-secondary">
                                                                                                            <span>Net State Duty</span>
                                                                                                            <span className="font-bold">{formatCurrency(netStampDutyVal)}</span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <div className="flex justify-between items-center py-2 text-secondary font-medium">
                                                                                                        <span>Stamp Duty</span>
                                                                                                        <span className="font-bold">{formatCurrency(grossStampDutyAmount)}</span>
                                                                                                    </div>
                                                                                                )}

                                                                                                {/* 3. Bank & Loan Fees */}
                                                                                                {(() => {
                                                                                                    const hasSettlement = bankSettlementFee > 0;
                                                                                                    const hasEstablishment = loanEstablishmentFee > 0;
                                                                                                    if (hasSettlement && hasEstablishment) {
                                                                                                        return (
                                                                                                            <div className="py-2 space-y-1">
                                                                                                                <div className="flex justify-between items-center text-sm text-gray-500 pl-4">
                                                                                                                    <span>Bank Settlement Fee</span>
                                                                                                                    <span className="font-medium pr-12">{formatCurrency(bankSettlementFee)}</span>
                                                                                                                </div>
                                                                                                                <div className="flex justify-between items-center text-sm text-gray-500 pl-4">
                                                                                                                    <span>Loan Establishment Fee</span>
                                                                                                                    <span className="font-medium pr-12">{formatCurrency(loanEstablishmentFee)}</span>
                                                                                                                </div>
                                                                                                                <div className="flex justify-between items-center py-1 pt-1.5 border-t border-dashed border-primary/10 font-semibold text-secondary">
                                                                                                                    <span>Bank &amp; Loan Fees</span>
                                                                                                                    <span className="font-bold">{formatCurrency(bankLoanFeesSubtotal)}</span>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        );
                                                                                                    } else if (hasSettlement) {
                                                                                                        return (
                                                                                                            <div className="flex justify-between items-center py-2 text-secondary font-medium">
                                                                                                                <span>Bank Settlement Fee</span>
                                                                                                                <span className="font-bold">{formatCurrency(bankSettlementFee)}</span>
                                                                                                            </div>
                                                                                                        );
                                                                                                    } else if (hasEstablishment) {
                                                                                                        return (
                                                                                                            <div className="flex justify-between items-center py-2 text-secondary font-medium">
                                                                                                                <span>Loan Establishment Fee</span>
                                                                                                                <span className="font-bold">{formatCurrency(loanEstablishmentFee)}</span>
                                                                                                            </div>
                                                                                                        );
                                                                                                    }
                                                                                                    return null;
                                                                                                })()}

                                                                                                {/* 4. Other Costs (seller questions + FIRB) */}
                                                                                                {(() => {
                                                                                                    const activeOtherCosts = [
                                                                                                        { label: 'Land Transfer Fee', amount: landTransferFee },
                                                                                                        { label: 'Legal and Conveyancing', amount: legalFees },
                                                                                                        { label: 'Building and Pest Inspection', amount: buildingAndPestFee },
                                                                                                        { label: 'FIRB Application Fee', amount: firbFee },
                                                                                                    ].filter(item => item.amount > 0);

                                                                                                    if (activeOtherCosts.length > 1) {
                                                                                                        return (
                                                                                                            <div className="py-2 space-y-1">
                                                                                                                {activeOtherCosts.map((item, idx) => (
                                                                                                                    <div key={idx} className="flex justify-between items-center text-sm text-gray-500 pl-4">
                                                                                                                        <span>{item.label}</span>
                                                                                                                        <span className="font-medium pr-12">{formatCurrency(item.amount)}</span>
                                                                                                                    </div>
                                                                                                                ))}
                                                                                                                <div className="flex justify-between items-center py-1 pt-1.5 border-t border-dashed border-primary/10 font-semibold text-secondary">
                                                                                                                    <span>Other Costs</span>
                                                                                                                    <span className="font-bold">{formatCurrency(otherCostsSubtotal)}</span>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        );
                                                                                                    } else if (activeOtherCosts.length === 1) {
                                                                                                        return (
                                                                                                            <div className="flex justify-between items-center py-2 text-secondary font-medium">
                                                                                                                <span>{activeOtherCosts[0].label}</span>
                                                                                                                <span className="font-bold">{formatCurrency(activeOtherCosts[0].amount)}</span>
                                                                                                            </div>
                                                                                                        );
                                                                                                    }
                                                                                                    return null;
                                                                                                })()}

                                                                                                {/* 5. Grants and Final Totals */}
                                                                                                <div className="pt-2">
                                                                                                    {hasGrants ? (
                                                                                                        <>
                                                                                                            <div className="flex justify-between items-center py-2 font-bold text-secondary">
                                                                                                                <span>Total (before grants)</span>
                                                                                                                <span>{formatCurrency(totalBeforeGrants)}</span>
                                                                                                            </div>
                                                                                                            {activeGrants.map((g, i) => (
                                                                                                                <div key={i} className="flex justify-between items-center py-1 text-sm pl-4">
                                                                                                                    <span className="text-gray-500">{g.label || 'First Home Owners Grant'}</span>
                                                                                                                    <span className="font-semibold text-green-600 pr-12">-{formatCurrency(g.amount)}</span>
                                                                                                                </div>
                                                                                                            ))}
                                                                                                            <div className="flex justify-between items-center py-2 pt-3 border-t border-primary/20 font-black text-lg text-secondary">
                                                                                                                <span>Total Upfront Costs</span>
                                                                                                                <span>{formatCurrency(totalPurchaseCost)}</span>
                                                                                                            </div>
                                                                                                        </>
                                                                                                    ) : (
                                                                                                        <div className="flex justify-between items-center py-2 font-black text-lg text-secondary">
                                                                                                            <span>Total Upfront Costs</span>
                                                                                                            <span>{formatCurrency(totalPurchaseCost)}</span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                    <div className="pt-3 mt-2 border-t border-primary/20 space-y-2">
                                                                                                        <div className="flex justify-between items-center py-1">
                                                                                                            <span className="text-gray-600">Available Savings</span>
                                                                                                            <span className="font-semibold text-secondary">{formatCurrency(buyerSavingsAmount)}</span>
                                                                                                        </div>
                                                                                                        {buyerSavingsShortfall > 0 ? (
                                                                                                            <div className="flex justify-between items-center py-1">
                                                                                                                <span className="text-red-600 font-medium">Shortfall</span>
                                                                                                                <span className="text-red-600 font-semibold">{formatCurrency(buyerSavingsShortfall)}</span>
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <div className="flex justify-between items-center py-1">
                                                                                                                <span className="text-green-600 font-medium">Remaining After Costs</span>
                                                                                                                <span className="text-green-600 font-semibold">{formatCurrency(buyerSavingsAmount - totalPurchaseCost)}</span>
                                                                                                            </div>
                                                                                                        )}
                                                                                                        {buyerSavingsAmount > totalPurchaseCost && hasLoan && (
                                                                                                            <p className="text-xs text-gray-600 italic bg-white/60 rounded-lg px-3 py-2 mt-2 border border-primary/10">
                                                                                                                You have more savings than required upfront. Consider increasing your deposit to reduce interest payments.
                                                                                                            </p>
                                                                                                        )}
                                                                                                        {buyerSavingsShortfall > 0 && (
                                                                                                            <p className="text-xs text-red-600 italic bg-red-50/50 rounded-lg px-3 py-2 mt-2 border border-red-200/60">
                                                                                                                {hasLoan ? (
                                                                                                                    "You have a savings shortfall. Consider reducing your deposit to lower upfront cash required, or look for a lower-priced property."
                                                                                                                ) : (
                                                                                                                    "You have a savings shortfall. Consider obtaining a home loan to cover the gap, or look for a lower-priced property."
                                                                                                                )}
                                                                                                            </p>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Ongoing Ownership Section */}
                                                        <div className="space-y-6 pt-6 md:pt-4 border-t border-gray-100">
                                                            <div>
                                                                <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-0.5">Post-Settlement</h3>
                                                                <h4 className="text-xl font-bold text-secondary">Ongoing Costs</h4>
                                                            </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                {/* Monthly Outflow Component */}
                                                                <div
                                                                    className="bg-base-200 border border-gray-100 rounded-xl p-5 flex flex-col justify-between relative cursor-pointer select-none"
                                                                    onClick={toggleMonthlyOutflow}
                                                                >
                                                                    <div>
                                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Monthly Outflow</span>
                                                                            <div className="p-1 hover:bg-black/5 rounded-full transition-colors shrink-0">
                                                                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${monthlyOutflowExpanded ? 'rotate-180' : ''}`} />
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-2xl md:text-3xl font-black text-secondary mb-2">
                                                                            {formatCurrency(monthlyCashFlow)}<span className="text-xs font-normal text-gray-400"> /mo</span>
                                                                        </p>
                                                                        <AnimatePresence initial={false}>
                                                                            {monthlyOutflowExpanded && (
                                                                                <motion.div
                                                                                    initial={{ height: 0, opacity: 0 }}
                                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                                    exit={{ height: 0, opacity: 0 }}
                                                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                                    className="overflow-hidden mb-2"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                >
                                                                                    <div className="space-y-1.5 text-sm border-t border-gray-100 pt-3">
                                                                                        {hasLoan && (formData.MONTHLY_LOAN_REPAYMENT || 0) > 0 && (
                                                                                            <div className="flex justify-between items-center">
                                                                                                <span className="text-gray-600 pl-4">Loan Repayment</span>
                                                                                                <span className="font-semibold text-secondary pr-4">{formatCurrency(formData.MONTHLY_LOAN_REPAYMENT)}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {formData.sellerQuestionsComplete && (formData.COUNCIL_RATES_MONTHLY || 0) > 0 && (
                                                                                            <div className="flex justify-between items-center">
                                                                                                <span className="text-gray-600 pl-4">Council Rates</span>
                                                                                                <span className="font-semibold text-secondary pr-4">{formatCurrency(formData.COUNCIL_RATES_MONTHLY)}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {formData.sellerQuestionsComplete && (formData.WATER_RATES_MONTHLY || 0) > 0 && (
                                                                                            <div className="flex justify-between items-center">
                                                                                                <span className="text-gray-600 pl-4">Water Rates</span>
                                                                                                <span className="font-semibold text-secondary pr-4">{formatCurrency(formData.WATER_RATES_MONTHLY)}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {formData.sellerQuestionsComplete && (formData.BODY_CORP_MONTHLY || 0) > 0 && (
                                                                                            <div className="flex justify-between items-center">
                                                                                                <span className="text-gray-600 pl-4">Body Corporate</span>
                                                                                                <span className="font-semibold text-secondary pr-4">{formatCurrency(formData.BODY_CORP_MONTHLY)}</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </motion.div>
                                                                            )}
                                                                        </AnimatePresence>
                                                                    </div>
                                                                    <p className="text-[11px] text-gray-500 italic bg-gray-50/50 p-2 rounded border border-gray-100/30">
                                                                        Includes council rates, water rates, body corporate fees, and loan repayments.
                                                                    </p>
                                                                </div>

                                                                {/* Annual Operating Cost Component */}
                                                                <div
                                                                    className="bg-base-200 border border-gray-100 rounded-xl p-5 flex flex-col justify-between relative cursor-pointer select-none"
                                                                    onClick={toggleAnnualizedCost}
                                                                >
                                                                    <div>
                                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Annualized Cost</span>
                                                                            <div className="p-1 hover:bg-black/5 rounded-full transition-colors shrink-0">
                                                                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${annualizedCostExpanded ? 'rotate-180' : ''}`} />
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-2xl md:text-3xl font-black text-secondary mb-2">
                                                                            {formatCurrency(annualOperatingCost)}<span className="text-xs font-normal text-gray-400"> /yr</span>
                                                                        </p>
                                                                        <AnimatePresence initial={false}>
                                                                            {annualizedCostExpanded && (
                                                                                <motion.div
                                                                                    initial={{ height: 0, opacity: 0 }}
                                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                                    exit={{ height: 0, opacity: 0 }}
                                                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                                    className="overflow-hidden mb-2"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                >
                                                                                    <div className="space-y-1.5 text-sm border-t border-gray-100 pt-3">
                                                                                        {hasLoan && (formData.ANNUAL_LOAN_REPAYMENT || 0) > 0 && (
                                                                                            <div className="flex justify-between items-center">
                                                                                                <span className="text-gray-600 pl-4">Loan Repayment</span>
                                                                                                <span className="font-semibold text-secondary pr-4">{formatCurrency(formData.ANNUAL_LOAN_REPAYMENT)}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {formData.sellerQuestionsComplete && (parseInt(formData.councilRates) || 0) > 0 && (
                                                                                            <div className="flex justify-between items-center">
                                                                                                <span className="text-gray-600 pl-4">Council Rates</span>
                                                                                                <span className="font-semibold text-secondary pr-4">{formatCurrency(parseInt(formData.councilRates))}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {formData.sellerQuestionsComplete && (parseInt(formData.waterRates) || 0) > 0 && (
                                                                                            <div className="flex justify-between items-center">
                                                                                                <span className="text-gray-600 pl-4">Water Rates</span>
                                                                                                <span className="font-semibold text-secondary pr-4">{formatCurrency(parseInt(formData.waterRates))}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {formData.sellerQuestionsComplete && (parseInt(formData.bodyCorp) || 0) > 0 && (
                                                                                            <div className="flex justify-between items-center">
                                                                                                <span className="text-gray-600 pl-4">Body Corporate</span>
                                                                                                <span className="font-semibold text-secondary pr-4">{formatCurrency(parseInt(formData.bodyCorp))}</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </motion.div>
                                                                            )}
                                                                        </AnimatePresence>
                                                                    </div>
                                                                    <p className="text-[11px] text-gray-500 italic bg-gray-50/50 p-2 rounded border border-gray-100/30">
                                                                        Annualised council rates, water rates, body corporate fees, and loan repayments.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Grants and Concessions collapsible card */}
                                                        <div className="pt-6 border-t border-gray-100">
                                                            <div
                                                                className="flex flex-col gap-4 bg-[#fef6e4]/45 border border-[#fef6e4] rounded-xl p-5 cursor-pointer hover:bg-[#fef6e4]/70 transition-all duration-200 select-none shadow-sm"
                                                                onClick={() => setIsGrantsCardExpanded(!isGrantsCardExpanded)}
                                                            >
                                                                {/* Card Header Row */}
                                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="p-2.5 bg-white rounded-lg border border-[#fef6e4] shadow-sm shrink-0">
                                                                            <Award className="w-5 h-5 text-primary" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Grants and Concessions</span>
                                                                            <p className="text-base md:text-lg font-bold text-secondary mt-0.5 break-words">
                                                                                {(() => {
                                                                                    const list = getGrantsAndConcessionsList();
                                                                                    const eligibleCount = list.filter(x => x.eligible).length;
                                                                                    return eligibleCount > 0 
                                                                                        ? `Eligible for ${eligibleCount} benefit${eligibleCount > 1 ? 's' : ''}` 
                                                                                        : 'No eligible benefits';
                                                                                })()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 sm:pl-4 shrink-0 justify-between sm:justify-end">
                                                                        <div className="sm:text-right">
                                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Saved</span>
                                                                            <p className="text-2xl md:text-3xl font-black text-secondary mt-0.5 tracking-tight">
                                                                                {formatCurrency(grantsConcessionsTotal)}
                                                                            </p>
                                                                        </div>
                                                                        <div className="p-1.5 hover:bg-black/5 rounded-full transition-colors shrink-0">
                                                                            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isGrantsCardExpanded ? 'rotate-180' : ''}`} />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Expanded Details Row */}
                                                                <AnimatePresence initial={false}>
                                                                    {isGrantsCardExpanded && (
                                                                        <motion.div
                                                                            initial={{ height: 0, opacity: 0 }}
                                                                            animate={{ height: "auto", opacity: 1 }}
                                                                            exit={{ height: 0, opacity: 0 }}
                                                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                            className="overflow-hidden border-t border-[#fef6e4] pt-4 mt-2"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <div className="space-y-3 pt-2">
                                                                                <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Grants &amp; Concessions Breakdown</span>
                                                                                {(() => {
                                                                                    const list = getGrantsAndConcessionsList();
                                                                                    const eligibleConcessions = list.filter(x => x.eligible && x.type === 'concession');
                                                                                    if (eligibleConcessions.length > 1) {
                                                                                        return (
                                                                                            <div className="flex gap-2.5 p-3.5 mb-3 rounded-lg border border-amber-200 bg-amber-500/5 text-xs text-amber-900 leading-normal">
                                                                                                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                                                                <div>
                                                                                                    <span className="font-semibold">Note on concessions:</span> You are eligible for multiple stamp duty concessions. However, state rules dictate that only one concession can be applied per property transaction (typically the one yielding the highest benefit). This has been automatically applied to your total savings calculation.
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    return null;
                                                                                })()}
                                                                                <div className="grid grid-cols-1 gap-3">
                                                                                    {getGrantsAndConcessionsList().map((item, idx) => (
                                                                                        <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-lg border border-[#fef6e4] bg-white/40">
                                                                                            <div className="flex items-center justify-between gap-4">
                                                                                                <span className="font-semibold text-secondary text-sm md:text-base">{item.name}</span>
                                                                                                {item.eligible ? (
                                                                                                    <span className="text-green-600 font-bold text-sm md:text-base">
                                                                                                        -{formatCurrency(item.amount)}
                                                                                                    </span>
                                                                                                ) : (
                                                                                                    <span className="text-gray-400 font-medium text-xs md:text-sm">
                                                                                                        Ineligible
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                            <div className="flex items-center gap-2">
                                                                                                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${item.eligible ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                                                                                                    {item.eligible ? 'Eligible' : 'Ineligible'}
                                                                                                </span>
                                                                                                <span className="text-xs text-gray-500">{item.reason}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                    {getGrantsAndConcessionsList().length === 0 && (
                                                                                        <p className="text-sm text-gray-500 italic text-center py-4">No grants or concessions available for this state.</p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        </div>

                                                            </div>
                                                        </motion.div>
                                                    </div>

                                                    {/* CTA Action Buttons */}
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
                                                    >
                                                        {showEmailSuccess ? (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="flex flex-col gap-4"
                                                            >
                                                                <div className="bg-emerald-50/30 border-2 border-emerald-100 rounded-xl p-6 text-center">
                                                                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                                                                    <h3 className="text-lg font-bold text-secondary mb-1">Check your inbox!</h3>
                                                                    <p className="text-sm text-gray-600 mb-4">Your detailed property report has been dispatched to {emailSuccessData?.email}</p>

                                                                    {emailSuccessData?.testingMode && (
                                                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left">
                                                                            <p className="text-xs text-yellow-800 font-semibold mb-1">📝 Developer Runtime Notice:</p>
                                                                            <p className="text-[11px] text-yellow-700">{emailSuccessData?.reminder || 'Resend validation protocol pending.'}</p>
                                                                        </div>
                                                                    )}

                                                                    {!user && (
                                                                        emailSuccessData?.emailExists ? (
                                                                            <>
                                                                                <p className="text-xs text-gray-500 mb-4">An identified account vector exists for this address. Sign in to sync your calculation sheets.</p>
                                                                                <Link href={`/login?email=${encodeURIComponent(emailSuccessData.email)}&next=/calculator`} className="inline-block">
                                                                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-secondary hover:bg-secondary/90 text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider text-xs shadow-sm transition-colors mx-auto cursor-pointer">
                                                                                        Sign In to Your Account
                                                                                    </motion.button>
                                                                                </Link>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <p className="text-xs text-gray-500 mb-4">Want to track these properties over long horizons? Open a persistent record track.</p>
                                                                                <Link href={`/signup?email=${encodeURIComponent(emailSuccessData.email)}`} className="inline-block">
                                                                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider text-xs shadow-sm transition-colors mx-auto cursor-pointer">
                                                                                        Create My Account
                                                                                    </motion.button>
                                                                                </Link>
                                                                            </>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        ) : (
                                                            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    className="flex items-center cursor-pointer justify-center gap-2 min-h-12 bg-primary hover:bg-primary/95 text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider text-xs shadow-sm transition-all duration-150 w-full sm:w-auto"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                    Download Full PDF Report
                                                                </motion.button>

                                                                <motion.button
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={onEmailPDF}
                                                                    disabled={isEmailingPDF}
                                                                    className="flex items-center cursor-pointer justify-center gap-2 min-h-12 bg-base-200 border-2 border-secondary text-secondary hover:bg-secondary/5 px-6 py-3 rounded-full font-bold uppercase tracking-wider text-xs shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                                                                >
                                                                    {isEmailingPDF ? (
                                                                        <>
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                            Sending...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Mail className="w-4 h-4" />
                                                                            Email Me These Results
                                                                        </>
                                                                    )}
                                                                </motion.button>
                                                            </div>
                                                        )}
                                                    </motion.div>

                                                    {/* Action Control: Edit and Reset Summary Row */}
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                                                        className="flex flex-col sm:flex-row gap-3 justify-center items-center"
                                                    >
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => {
                                                                setShowReviewOverlay(true);
                                                                setTimeout(() => {
                                                                    formData.setShowReviewPage(true);
                                                                    window.scrollTo(0, 0);
                                                                    setShowReviewOverlay(false);
                                                                }, 2000);
                                                            }}
                                                            className="flex items-center cursor-pointer justify-center gap-2 min-h-12 bg-white border-2 border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-full font-medium shadow-sm transition-colors text-sm w-full sm:w-auto"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Review/Edit All Answers
                                                        </motion.button>

                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => {
                                                                setOriginalLoadedState(null);
                                                                resetSessionAndForm(formData.resetForm);
                                                            }}
                                                            className="flex items-center cursor-pointer justify-center gap-2 min-h-12 bg-white border-2 border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-full font-medium shadow-sm transition-colors text-sm w-full sm:w-auto"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                            Start New Survey
                                                        </motion.button>
                                                    </motion.div>

                                                    {/* Dashboard / Auth Navigation Link Button */}
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                                                        className="flex justify-center pt-2"
                                                    >
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => {
                                                                if (user) {
                                                                    const targetUrl = '/dashboard';
                                                                    if (typeof window !== 'undefined' && window.__navigationWarning) {
                                                                        const canNavigate = window.__navigationWarning.checkNavigation(targetUrl);
                                                                        if (canNavigate) router.push(targetUrl);
                                                                    } else {
                                                                        router.push(targetUrl);
                                                                    }
                                                                    return;
                                                                }
                                                                if (propertyId) {
                                                                    setPendingSurveyLink(propertyId, '/calculator');
                                                                }
                                                                router.push('/login?returnTo=calculator');
                                                            }}
                                                            className="flex items-center cursor-pointer justify-center gap-2 min-h-12 bg-secondary hover:bg-secondary-focus text-white px-6 py-3 rounded-full font-medium shadow-sm transition-colors text-sm w-full sm:w-auto"
                                                        >
                                                            {user ? (
                                                                <>
                                                                    <Home className="w-4 h-4" />
                                                                    Exit to My Dashboard
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Mail className="w-4 h-4" />
                                                                    Log in to Save Progress
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </>
                                                            )}
                                                        </motion.button>
                                                    </motion.div>
                                                </div>
                                            </motion.div>
                                        </AnimatePresence>
    );
}

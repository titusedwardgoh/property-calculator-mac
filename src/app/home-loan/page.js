"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    Percent,
    Calendar,
    CircleDollarSign,
    Calculator,
    ArrowRight,
    Wallet,
    Zap,
    Shield,
} from 'lucide-react';
import { calculateMonthlyRepayment } from '@/states/shared/loanCalculations';
import { formatCurrency } from '@/states/shared/baseCalculations';

const miniCalculators = [
    {
        id: 'loan-repayments',
        label: 'Loan Repayments',
        description: 'Estimate your monthly repayments from amount, rate, and term.',
        icon: Calculator,
    },
    {
        id: 'borrowing-power',
        label: 'Borrowing Power',
        description: 'Work out how much you could afford to borrow based on your repayments.',
        icon: Wallet,
    },
    {
        id: 'lmi-calculator',
        label: 'LMI Calculator',
        description: 'Estimate lenders mortgage insurance when your deposit is under 20%.',
        icon: Shield,
    },
    {
        id: 'loan-term',
        label: 'Loan Term',
        description: 'See how extra repayments can cut interest and reduce your loan term.',
        icon: Zap,
    },
];

const featureCards = [
    {
        title: "Rate Is Only One Input",
        description: "Monthly repayments depend on loan size, term, and repayment type — not just the advertised rate.",
        icon: Percent,
    },
    {
        title: "Term Changes Everything",
        description: "A longer loan can lower the monthly bill while increasing what you repay overall. See both sides clearly.",
        icon: Calendar,
    },
    {
        title: "The Number Banks Don't Show You",
        description: "Stamp duty, LMI, legal fees, and settlement extras sit outside most bank repayment tools.",
        icon: CircleDollarSign,
    }
];

const FREQUENCY_OPTIONS = [
    { value: 'monthly', label: 'Monthly', periodsPerYear: 12 },
    { value: 'fortnightly', label: 'Fortnightly', periodsPerYear: 26 },
    { value: 'weekly', label: 'Weekly', periodsPerYear: 52 },
];
const LOAN_TYPE_OPTIONS = [
    { value: 'principal-interest', label: 'Principal and interest', interestOnlyYears: 0 },
    { value: 'interest-only-1', label: 'Interest only 1 year', interestOnlyYears: 1 },
    { value: 'interest-only-2', label: 'Interest only 2 years', interestOnlyYears: 2 },
    { value: 'interest-only-3', label: 'Interest only 3 years', interestOnlyYears: 3 },
    { value: 'interest-only-4', label: 'Interest only 4 years', interestOnlyYears: 4 },
    { value: 'interest-only-5', label: 'Interest only 5 years', interestOnlyYears: 5 },
];
const RATE_STRESS_INCREASE = 2;

const STATE_OPTIONS = [
    { value: 'NSW', label: 'New South Wales' },
    { value: 'VIC', label: 'Victoria' },
    { value: 'QLD', label: 'Queensland' },
    { value: 'SA', label: 'South Australia' },
    { value: 'WA', label: 'Western Australia' },
    { value: 'TAS', label: 'Tasmania' },
    { value: 'NT', label: 'Northern Territory' },
    { value: 'ACT', label: 'Australian Capital Territory' },
];

const LMI_DEPOSIT_SCENARIOS = [5, 10, 15, 20];

const LMI_RATES = {
    '80.01-81%': {
        '0-300K': 0.00475,
        '300K-500K': 0.00568,
        '500K-600K': 0.00904,
        '600K-750K': 0.00904,
        '750K-1M': 0.00913,
    },
    '84.01-85%': {
        '0-300K': 0.00727,
        '300K-500K': 0.00969,
        '500K-600K': 0.01165,
        '600K-750K': 0.01333,
        '750K-1M': 0.01407,
    },
    '88.01-89%': {
        '0-300K': 0.01295,
        '300K-500K': 0.01621,
        '500K-600K': 0.01948,
        '600K-750K': 0.02218,
        '750K-1M': 0.02395,
    },
    '89.01-90%': {
        '0-300K': 0.01463,
        '300K-500K': 0.01873,
        '500K-600K': 0.02180,
        '600K-750K': 0.02367,
        '750K-1M': 0.02516,
    },
    '90.01-91%': {
        '0-300K': 0.02013,
        '300K-500K': 0.02618,
        '500K-600K': 0.03513,
        '600K-750K': 0.03783,
        '750K-1M': 0.03820,
    },
    '91.01-94%': {
        '0-300K': 0.02309,
        '300K-500K': 0.02982,
        '500K-600K': 0.03756,
        '600K-750K': 0.04198,
        '750K-1M': 0.04212,
    },
    '94.01-95%': {
        '0-300K': 0.02609,
        '300K-500K': 0.03345,
        '500K-600K': 0.03998,
        '600K-750K': 0.04613,
        '750K-1M': 0.04603,
    },
};

const LMI_STAMP_DUTY_RATES = {
    VIC: 10,
    QLD: 9,
    SA: 11,
    WA: 10,
    ACT: 10,
};

const inputClassName =
    'w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white text-gray-900';

function getLmiLvrBand(lvr) {
    if (lvr >= 0.8001 && lvr <= 0.81) return '80.01-81%';
    if (lvr >= 0.8401 && lvr <= 0.85) return '84.01-85%';
    if (lvr >= 0.8801 && lvr <= 0.89) return '88.01-89%';
    if (lvr >= 0.8901 && lvr <= 0.90) return '89.01-90%';
    if (lvr >= 0.9001 && lvr <= 0.91) return '90.01-91%';
    if (lvr >= 0.9101 && lvr <= 0.94) return '91.01-94%';
    if (lvr >= 0.9401 && lvr <= 0.95) return '94.01-95%';
    return null;
}

function getLmiValueBand(propertyPrice) {
    if (propertyPrice <= 300000) return '0-300K';
    if (propertyPrice <= 500000) return '300K-500K';
    if (propertyPrice <= 600000) return '500K-600K';
    if (propertyPrice <= 750000) return '600K-750K';
    if (propertyPrice <= 1000000) return '750K-1M';
    return null;
}

function calculateLmiPremium(propertyPrice, lvr) {
    if (propertyPrice <= 0 || lvr <= 0.8 || lvr > 0.95) return 0;

    const lvrBand = getLmiLvrBand(lvr);
    const valueBand = getLmiValueBand(propertyPrice);
    if (!lvrBand || !valueBand) return 0;

    const rate = LMI_RATES[lvrBand]?.[valueBand];
    if (!rate) return 0;

    return Math.round(propertyPrice * lvr * rate);
}

function calculateLmiStampDuty(premium, stateCode) {
    const dutyRate = LMI_STAMP_DUTY_RATES[stateCode];
    if (!dutyRate || premium <= 0) return 0;
    return Math.round(premium * (dutyRate / 100));
}

function buildLmiAxisTicks(yMax) {
    if (yMax <= 0) return [0];
    const roughStep = yMax / 4;
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const normalized = roughStep / magnitude;
    let step;
    if (normalized <= 1) step = magnitude;
    else if (normalized <= 2) step = 2 * magnitude;
    else if (normalized <= 5) step = 5 * magnitude;
    else step = 10 * magnitude;

    const ticks = [];
    for (let value = 0; value <= yMax + 0.0001; value += step) {
        ticks.push(value);
    }
    return ticks;
}

function formatLmiAxisLabel(value) {
    if (value >= 1000) {
        const thousands = value / 1000;
        return Number.isInteger(thousands) ? `$${thousands}K` : `$${thousands.toFixed(1)}K`;
    }
    return formatCurrency(value);
}

function formatRepayTime(totalMonths) {
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const parts = [];

    if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
    return parts.join(' ') || 'Less than 1 month';
}

const REPAY_SOONER_MAX_YEARS = 100;
const REPAY_SOONER_UNREPAYABLE_HORIZON_YEARS = 30;

function calculatePayoffFromPayment(principal, rate, payment, periodsPerYear) {
    const periodicRate = rate / 100 / periodsPerYear;
    if (principal <= 0 || payment <= 0) return null;

    let balance = principal;
    let totalPaid = 0;
    let periods = 0;
    const maxPeriods = periodsPerYear * REPAY_SOONER_MAX_YEARS;

    while (balance > 0.5 && periods < maxPeriods) {
        const interest = balance * periodicRate;
        const principalPaid = payment - interest;
        if (principalPaid <= 0) {
            // Repayment never covers the interest charged, so the balance will not reduce.
            return { repaid: false, totalMonths: null, totalPaid: 0, principalReduced: 0 };
        }
        const applied = Math.min(principalPaid, balance);
        totalPaid += interest + applied;
        balance -= applied;
        periods += 1;
    }

    const repaid = balance <= 0.5;

    return {
        repaid,
        totalMonths: repaid ? Math.max(1, Math.round((periods / periodsPerYear) * 12)) : null,
        totalPaid: Math.round(totalPaid),
        principalReduced: Math.round(principal - balance),
    };
}

function buildRepaySoonerScenario(principal, rate, interestOnlyYears, payment, frequencyOption) {
    const payoff = calculatePayoffFromPayment(
        principal,
        rate,
        payment,
        frequencyOption.periodsPerYear
    );
    if (!payoff) return null;

    const interestOnlyPaid = principal * (rate / 100) * interestOnlyYears;
    const shared = {
        rate,
        principal: Math.round(principal),
        interestOnlyYears,
        periodPayment: Math.round(payment),
        frequencyLabel: frequencyOption.label.toLowerCase(),
    };

    if (!payoff.repaid) {
        // Stressed scenario that never clears: illustrate the cost over a long horizon and flag it.
        const horizonPeriods = REPAY_SOONER_UNREPAYABLE_HORIZON_YEARS * frequencyOption.periodsPerYear;
        const total = Math.round(interestOnlyPaid + payment * horizonPeriods);
        const principalReduced = Math.max(0, payoff.principalReduced || 0);
        return {
            ...shared,
            principal: principalReduced,
            totalMonths: null,
            timeLabel: `Beyond ${REPAY_SOONER_UNREPAYABLE_HORIZON_YEARS} years`,
            total,
            totalInterest: Math.round(total - principalReduced),
            repayable: false,
        };
    }

    const total = interestOnlyPaid + payoff.totalPaid;
    const totalMonths = interestOnlyYears * 12 + payoff.totalMonths;

    return {
        ...shared,
        totalMonths,
        timeLabel: formatRepayTime(totalMonths),
        total: Math.round(total),
        totalInterest: Math.round(total - principal),
        repayable: true,
    };
}

function calculateAmortisingPayment(principal, rate, years, periodsPerYear) {
    if (periodsPerYear === 12) {
        return calculateMonthlyRepayment(principal, rate, years, 'principal-interest');
    }

    const numberOfPayments = years * periodsPerYear;
    const periodicRate = rate / 100 / periodsPerYear;
    if (periodicRate === 0) {
        return principal / numberOfPayments;
    }

    return (
        principal
        * periodicRate
        * Math.pow(1 + periodicRate, numberOfPayments)
    ) / (Math.pow(1 + periodicRate, numberOfPayments) - 1);
}

function calculatePrincipalFromPayment(payment, rate, years, periodsPerYear, interestOnlyYears) {
    const periodicRate = rate / 100 / periodsPerYear;

    if (interestOnlyYears > 0) {
        if (periodicRate === 0) return 0;
        return payment / periodicRate;
    }

    const numberOfPayments = years * periodsPerYear;
    if (periodicRate === 0) {
        return payment * numberOfPayments;
    }

    const factor = Math.pow(1 + periodicRate, numberOfPayments);
    return payment * (factor - 1) / (periodicRate * factor);
}

function buildScenario(principal, rate, years, frequencyOption, loanTypeOption) {
    const periodsPerYear = frequencyOption.periodsPerYear;
    const interestOnlyYears = loanTypeOption.interestOnlyYears;
    const periodicRate = rate / 100 / periodsPerYear;
    const remainingYears = years - interestOnlyYears;

    const periodPayment = interestOnlyYears > 0
        ? principal * periodicRate
        : calculateAmortisingPayment(principal, rate, years, periodsPerYear);
    const postInterestOnlyPayment = interestOnlyYears > 0
        ? calculateAmortisingPayment(principal, rate, remainingYears, periodsPerYear)
        : null;
    const total = interestOnlyYears > 0
        ? (
            periodPayment * interestOnlyYears * periodsPerYear
            + postInterestOnlyPayment * remainingYears * periodsPerYear
        )
        : periodPayment * years * periodsPerYear;
    const totalInterest = Math.max(0, total - principal);

    return {
        rate,
        years,
        principal: Math.round(principal),
        interestOnlyYears,
        remainingYears,
        periodPayment: Math.round(periodPayment),
        postInterestOnlyPayment: postInterestOnlyPayment
            ? Math.round(postInterestOnlyPayment)
            : null,
        total: Math.round(total),
        totalInterest: Math.round(totalInterest),
        frequencyLabel: frequencyOption.label.toLowerCase(),
    };
}

function buildBorrowingScenario(payment, rate, years, frequencyOption, loanTypeOption) {
    const principal = calculatePrincipalFromPayment(
        payment,
        rate,
        years,
        frequencyOption.periodsPerYear,
        loanTypeOption.interestOnlyYears
    );
    return buildScenario(principal, rate, years, frequencyOption, loanTypeOption);
}

function formatAxisLabel(value, yMax, ticks) {
    if (yMax >= 1_000_000) {
        const millions = value / 1_000_000;
        const needsDecimal = ticks.some((tick) => !Number.isInteger(tick / 1_000_000));
        return needsDecimal ? `${millions.toFixed(1)}M` : `${millions}M`;
    }
    if (value >= 1_000 || yMax >= 1_000) {
        const thousands = value / 1_000;
        const needsDecimal = ticks.some((tick) => !Number.isInteger(tick / 1_000));
        return needsDecimal ? `${thousands.toFixed(1)}K` : `${thousands}K`;
    }
    return String(Math.round(value));
}

function buildAxisTicks(yMax) {
    let step;
    if (yMax < 1_000_000) {
        step = 200_000;
    } else if (yMax < 3_000_000) {
        step = 500_000;
    } else {
        step = Math.max(1_000_000, Math.round(yMax / 5 / 1_000_000) * 1_000_000);
    }

    const ticks = [];
    for (let value = 0; value <= yMax + 0.0001; value += step) {
        ticks.push(value);
    }
    return ticks;
}

function TotalRepaymentsChart({ base, stress, mode = 'repayment' }) {
    const [hover, setHover] = useState(null);
    const yMax = Math.max(base.total, stress.total) * 1.3;
    const ticks = buildAxisTicks(yMax);
    const isBorrowing = mode === 'borrowing';

    const scenarios = [
        {
            id: 'base',
            title: 'Mortgage details',
            scenario: base,
            principalColor: '#c45c3e',
            interestColor: '#f0b5a0',
        },
        {
            id: 'stress',
            title: `If interest rate goes up by ${RATE_STRESS_INCREASE.toFixed(2)}%`,
            scenario: stress,
            principalColor: '#4b5563',
            interestColor: '#d1d5db',
        },
    ];

    return (
        <div className="flex h-full min-h-[28rem] flex-col rounded-2xl border border-gray-200 bg-gray-50 p-5 md:p-6">
            <h3 className="shrink-0 text-lg font-bold text-gray-900">Total repayments</h3>

            <div className="mt-5 flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-[14rem] flex-1 gap-2 sm:gap-3">
                    <div className="relative w-10 shrink-0 self-stretch text-right text-xs text-gray-400">
                        {ticks.map((tick) => (
                            <span
                                key={tick}
                                className="absolute right-0 translate-y-1/2 leading-none"
                                style={{ bottom: `${(tick / yMax) * 100}%` }}
                            >
                                {formatAxisLabel(tick, yMax, ticks)}
                            </span>
                        ))}
                    </div>

                    <div className="relative min-w-0 flex-1">
                        {ticks.map((tick) => (
                            <div
                                key={tick}
                                className="absolute inset-x-0 border-t border-gray-200"
                                style={{ bottom: `${(tick / yMax) * 100}%` }}
                            />
                        ))}

                        <div className="absolute inset-0 flex items-end justify-around px-2">
                            {scenarios.map(({ id, title, scenario, principalColor, interestColor }, index) => {
                                const totalHeightPct = (scenario.total / yMax) * 100;
                                const principalPctOfTotal = scenario.total > 0
                                    ? (scenario.principal / scenario.total) * 100
                                    : 0;
                                const interestPctOfTotal = 100 - principalPctOfTotal;

                                return (
                                    <div key={id} className="relative flex h-full w-full max-w-[7.5rem] flex-col items-center justify-end">
                                        {hover?.id === id && hover.part === 'interest' ? (
                                            <span
                                                className="pointer-events-none absolute left-1/2 z-30 w-max -translate-x-1/2 rounded-md border border-primary/40 bg-white px-3 py-2 text-xs font-medium text-gray-800 shadow-md"
                                                style={{ bottom: `calc(${totalHeightPct}% + 2.1rem)` }}
                                            >
                                                Interest: {formatCurrency(scenario.totalInterest)}
                                                <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-primary/40" />
                                            </span>
                                        ) : null}
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.5, delay: 0.35 + index * 0.12, ease: 'easeOut' }}
                                            className="absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-sm font-semibold text-gray-900"
                                            style={{ bottom: `calc(${totalHeightPct}% + 0.35rem)` }}
                                        >
                                            {formatCurrency(scenario.total)}
                                        </motion.p>

                                        <motion.div
                                            initial={{ scaleY: 0 }}
                                            animate={{ scaleY: 1 }}
                                            transition={{ duration: 1.8, delay: index * 0.15, ease: [0.33, 1, 0.68, 1] }}
                                            className="relative flex w-14 origin-bottom flex-col-reverse overflow-visible sm:w-16"
                                            style={{ height: `${totalHeightPct}%` }}
                                        >
                                            <button
                                                type="button"
                                                aria-label={`${title} principal ${formatCurrency(scenario.principal)}`}
                                                className="relative w-full cursor-pointer rounded-b-md transition-opacity hover:opacity-90"
                                                style={{
                                                    height: `${principalPctOfTotal}%`,
                                                    backgroundColor: principalColor,
                                                }}
                                                onMouseEnter={() => setHover({ id, part: 'principal' })}
                                                onMouseLeave={() => setHover(null)}
                                                onFocus={() => setHover({ id, part: 'principal' })}
                                                onBlur={() => setHover(null)}
                                            >
                                                {hover?.id === id && hover.part === 'principal' ? (
                                                    <span className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-max -translate-x-1/2 -translate-y-1/2 rounded-md border border-primary/40 bg-white px-3 py-2 text-xs font-medium text-gray-800 shadow-md">
                                                        Principal: {formatCurrency(scenario.principal)}
                                                    </span>
                                                ) : null}
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={`${title} interest ${formatCurrency(scenario.totalInterest)}`}
                                                className="relative w-full cursor-pointer rounded-t-md transition-opacity hover:opacity-90"
                                                style={{
                                                    height: `${interestPctOfTotal}%`,
                                                    backgroundColor: interestColor,
                                                }}
                                                onMouseEnter={() => setHover({ id, part: 'interest' })}
                                                onMouseLeave={() => setHover(null)}
                                                onFocus={() => setHover({ id, part: 'interest' })}
                                                onBlur={() => setHover(null)}
                                            />
                                        </motion.div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex min-h-[4.5rem] shrink-0 justify-around px-2 pl-12 sm:pl-14">
                    {scenarios.map(({ id, title, scenario }, index) => (
                        <motion.div
                            key={id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 + index * 0.12, ease: 'easeOut' }}
                            className="w-full max-w-[7.5rem] text-center"
                        >
                            <p className="text-sm font-semibold text-gray-900 leading-snug">{title}</p>
                            {isBorrowing ? (
                                <p className="mt-1 text-xs text-gray-600">
                                    Borrow <span className="font-semibold text-gray-900">{formatCurrency(scenario.principal)}</span>
                                </p>
                            ) : scenario.interestOnlyYears > 0 ? (
                                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                                    Pay <span className="font-semibold text-gray-900">{formatCurrency(scenario.periodPayment)}</span> {scenario.frequencyLabel}
                                    {' '}for the first {scenario.interestOnlyYears} {scenario.interestOnlyYears === 1 ? 'year' : 'years'}
                                </p>
                            ) : (
                                <p className="mt-1 text-xs text-gray-600">
                                    Repay <span className="font-semibold text-gray-900">{formatCurrency(scenario.periodPayment)}</span> {scenario.frequencyLabel}
                                </p>
                            )}
                            <p className="mt-0.5 text-xs text-gray-500">
                                {scenario.rate}% for {scenario.years} years
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MortgageCalculatorPanel({ mode }) {
    const isBorrowing = mode === 'borrowing';
    const idPrefix = isBorrowing ? 'borrow' : 'repay';

    const [loanAmount, setLoanAmount] = useState('');
    const [affordableRepayment, setAffordableRepayment] = useState('');
    const [loanType, setLoanType] = useState('principal-interest');
    const [interestRate, setInterestRate] = useState('');
    const [frequency, setFrequency] = useState('monthly');
    const [loanTerm, setLoanTerm] = useState('');

    const amount = isBorrowing ? affordableRepayment : loanAmount;
    const setAmount = isBorrowing ? setAffordableRepayment : setLoanAmount;

    const [appliedValues, setAppliedValues] = useState({
        loanAmount: '',
        affordableRepayment: '',
        loanType: 'principal-interest',
        interestRate: '',
        frequency: 'monthly',
        loanTerm: '',
    });

    const commitCalculation = () => {
        setAppliedValues((prev) => ({
            ...prev,
            ...(isBorrowing
                ? { affordableRepayment: amount }
                : { loanAmount: amount }),
            loanType,
            interestRate,
            frequency,
            loanTerm,
        }));
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
            commitCalculation();
        }
    };

    const result = useMemo(() => {
        const appliedAmount = isBorrowing
            ? appliedValues.affordableRepayment
            : appliedValues.loanAmount;
        const amountValue = parseInt(String(appliedAmount).replace(/[^\d]/g, ''), 10) || 0;
        const rate = parseFloat(String(appliedValues.interestRate)) || 0;
        const years = parseInt(String(appliedValues.loanTerm).replace(/[^\d]/g, ''), 10) || 0;
        const frequencyOption = FREQUENCY_OPTIONS.find((option) => option.value === appliedValues.frequency)
            || FREQUENCY_OPTIONS[0];
        const loanTypeOption = LOAN_TYPE_OPTIONS.find((option) => option.value === appliedValues.loanType)
            || LOAN_TYPE_OPTIONS[0];

        if (
            amountValue <= 0
            || rate <= 0
            || years < 1
            || years > 30
            || loanTypeOption.interestOnlyYears >= years
        ) {
            return null;
        }

        if (isBorrowing) {
            const base = buildBorrowingScenario(amountValue, rate, years, frequencyOption, loanTypeOption);
            const stress = buildBorrowingScenario(
                amountValue,
                rate + RATE_STRESS_INCREASE,
                years,
                frequencyOption,
                loanTypeOption
            );
            return { base, stress };
        }

        const base = buildScenario(amountValue, rate, years, frequencyOption, loanTypeOption);
        const stress = buildScenario(
            amountValue,
            rate + RATE_STRESS_INCREASE,
            years,
            frequencyOption,
            loanTypeOption
        );

        return { base, stress };
    }, [appliedValues, isBorrowing]);

    const handleReset = () => {
        if (isBorrowing) {
            setAffordableRepayment('');
        } else {
            setLoanAmount('');
        }
        setLoanType('principal-interest');
        setInterestRate('');
        setFrequency('monthly');
        setLoanTerm('');
        setAppliedValues((prev) => ({
            ...prev,
            ...(isBorrowing ? { affordableRepayment: '' } : { loanAmount: '' }),
            loanType: 'principal-interest',
            interestRate: '',
            frequency: 'monthly',
            loanTerm: '',
        }));
    };

    const handleFrequencyChange = (value) => {
        setFrequency(value);
        setAppliedValues((prev) => ({ ...prev, frequency: value }));
    };

    const handleLoanTypeChange = (value) => {
        setLoanType(value);
        setAppliedValues((prev) => ({ ...prev, loanType: value }));
    };

    const handleLoanTermChange = (value) => {
        const digitsOnly = value.replace(/[^\d]/g, '');
        if (digitsOnly === '') {
            setLoanTerm('');
            return;
        }

        const nextValue = Math.min(30, parseInt(digitsOnly, 10));
        if (nextValue >= 1) {
            setLoanTerm(String(nextValue));
            const selectedLoanType = LOAN_TYPE_OPTIONS.find((option) => option.value === loanType);
            if (selectedLoanType?.interestOnlyYears >= nextValue) {
                setLoanType('principal-interest');
                setAppliedValues((prev) => ({ ...prev, loanType: 'principal-interest' }));
            }
        }
    };

    const resultValue = isBorrowing
        ? result?.base.principal
        : result?.base.periodPayment;
    const resultKey = isBorrowing
        ? result?.base.principal
        : `${result?.base.periodPayment}-${result?.base.frequencyLabel}`;

    return (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch">
            <div className="flex flex-1 flex-col">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {isBorrowing
                        ? 'How much can I afford to borrow?'
                        : 'How much will my loan repayments be?'}
                </h2>
                <div className="mt-4 h-1 w-16 rounded-full bg-primary" />

                <h3 className="mt-6 text-lg font-semibold text-gray-900">Loan details</h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor={`${idPrefix}-amount`} className="mb-1.5 block text-sm font-semibold text-gray-700">
                            {isBorrowing ? 'Affordable repayment' : 'Amount borrowed'}
                        </label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                                id={`${idPrefix}-amount`}
                                type="text"
                                inputMode="numeric"
                                placeholder={isBorrowing ? '3000' : '600000'}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
                                onBlur={commitCalculation}
                                onKeyDown={handleInputKeyDown}
                                className={`${inputClassName} pl-7`}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor={`${idPrefix}-loan-type`} className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Loan type
                        </label>
                        <select
                            id={`${idPrefix}-loan-type`}
                            value={loanType}
                            onChange={(e) => handleLoanTypeChange(e.target.value)}
                            className={`${inputClassName} cursor-pointer`}
                        >
                            {LOAN_TYPE_OPTIONS.map((option) => {
                                const numericTerm = parseInt(loanTerm, 10) || 0;
                                const isUnavailable = numericTerm > 0
                                    && option.interestOnlyYears >= numericTerm;

                                return (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                        disabled={isUnavailable}
                                    >
                                        {option.label}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div>
                        <label htmlFor={`${idPrefix}-rate`} className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Interest rate
                        </label>
                        <div className="relative">
                            <input
                                id={`${idPrefix}-rate`}
                                type="text"
                                inputMode="decimal"
                                placeholder="6.00"
                                value={interestRate}
                                onChange={(e) => setInterestRate(e.target.value.replace(/[^\d.]/g, ''))}
                                onBlur={commitCalculation}
                                onKeyDown={handleInputKeyDown}
                                className={`${inputClassName} pr-10`}
                                required
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                        </div>
                    </div>

                    <div>
                        <label htmlFor={`${idPrefix}-frequency`} className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Repayment frequency
                        </label>
                        <select
                            id={`${idPrefix}-frequency`}
                            value={frequency}
                            onChange={(e) => handleFrequencyChange(e.target.value)}
                            className={`${inputClassName} cursor-pointer`}
                        >
                            {FREQUENCY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor={`${idPrefix}-term`} className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Length of loan
                        </label>
                        <div className="relative">
                            <input
                                id={`${idPrefix}-term`}
                                type="text"
                                inputMode="numeric"
                                placeholder="30"
                                value={loanTerm}
                                onChange={(e) => handleLoanTermChange(e.target.value)}
                                onBlur={commitCalculation}
                                onKeyDown={handleInputKeyDown}
                                className={`${inputClassName} pr-14`}
                                required
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                years
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 rounded-2xl border border-primary/20 bg-gray-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-500">
                                {isBorrowing
                                    ? 'You can afford to borrow'
                                    : result?.base.interestOnlyYears
                                        ? 'Your interest-only repayments will be'
                                        : 'Your repayments will be'}
                            </p>
                            <p className="mt-1 flex min-h-[2.25rem] items-baseline gap-1.5 text-gray-900">
                                {result ? (
                                    <>
                                        <motion.span
                                            key={resultKey}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.9, ease: 'easeOut' }}
                                            className="text-3xl font-bold"
                                        >
                                            {formatCurrency(resultValue)}
                                        </motion.span>
                                        {!isBorrowing ? (
                                            <span className="text-sm font-medium text-gray-500">
                                                /{result.base.frequencyLabel}
                                            </span>
                                        ) : null}
                                    </>
                                ) : (
                                    <span className="text-3xl font-bold text-gray-300">—</span>
                                )}
                            </p>
                            <p className="mt-2 min-h-[3.5rem] max-w-sm text-xs leading-relaxed text-gray-500">
                                {!isBorrowing && result?.base.interestOnlyYears ? (
                                    <>
                                        You&apos;ll pay this for the first{' '}
                                        {result.base.interestOnlyYears}{' '}
                                        {result.base.interestOnlyYears === 1 ? 'year' : 'years'}.
                                        After that, repayments rise to{' '}
                                        <strong className="font-semibold text-gray-700">
                                            {formatCurrency(result.base.postInterestOnlyPayment)}
                                            /{result.base.frequencyLabel}
                                        </strong>{' '}
                                        for the remaining {result.base.remainingYears}{' '}
                                        {result.base.remainingYears === 1 ? 'year' : 'years'}.
                                    </>
                                ) : isBorrowing && result?.base.interestOnlyYears ? (
                                    <>
                                        Based on an interest-only repayment of{' '}
                                        <strong className="font-semibold text-gray-700">
                                            {formatCurrency(result.base.periodPayment)}
                                            /{result.base.frequencyLabel}
                                        </strong>{' '}
                                        for the first {result.base.interestOnlyYears}{' '}
                                        {result.base.interestOnlyYears === 1 ? 'year' : 'years'}.
                                        After that, repayments would rise to{' '}
                                        <strong className="font-semibold text-gray-700">
                                            {formatCurrency(result.base.postInterestOnlyPayment)}
                                            /{result.base.frequencyLabel}
                                        </strong>.
                                    </>
                                ) : result ? (
                                    isBorrowing
                                        ? 'This is an estimate of how much you could borrow based on the repayment you entered.'
                                        : 'This is an estimate based on the loan details you entered.'
                                ) : (
                                    isBorrowing
                                        ? 'Enter your affordable repayment and loan details to see how much you could borrow.'
                                        : 'Enter your loan details to see estimated repayments.'
                                )}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="shrink-0 cursor-pointer rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-primary hover:text-primary"
                        >
                            Reset
                        </button>
                    </div>

                    <div className="mt-5 border-t border-gray-200 pt-4">
                        <p className="mb-3 text-xs text-gray-500">
                            Repayments are only half the story. Don&apos;t forget stamp duty and other fees.
                        </p>
                        <Link
                            href="/calculator"
                            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-secondary transition-all hover:bg-primary/90 hover:shadow-md"
                        >
                            Get a full picture of all your other Costs
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>

            <div className="flex min-h-[28rem] flex-1 flex-col">
                {result ? (
                    <TotalRepaymentsChart
                        key={`${mode}-${result.base.total}-${result.stress.total}`}
                        base={result.base}
                        stress={result.stress}
                        mode={mode}
                    />
                ) : (
                    <div className="flex h-full min-h-[28rem] flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 text-center text-sm text-gray-500">
                        {isBorrowing
                            ? 'Enter loan details to see a borrowing power comparison chart.'
                            : 'Enter mortgage details to see a total repayments comparison chart.'}
                    </div>
                )}
            </div>
        </div>
    );
}

function LmiDepositChart({ propertyPrice, stateCode }) {
    const [hover, setHover] = useState(null);

    const scenarios = LMI_DEPOSIT_SCENARIOS.map((depositPct) => {
        const lvr = 1 - depositPct / 100;
        const premium = calculateLmiPremium(propertyPrice, lvr);
        const stampDuty = calculateLmiStampDuty(premium, stateCode);
        return {
            depositPct,
            lvr,
            premium,
            stampDuty,
            total: premium + stampDuty,
        };
    });

    const yMax = Math.max(...scenarios.map((s) => s.premium), 1) * 1.15;
    const ticks = buildLmiAxisTicks(yMax);

    return (
        <div className="flex h-full min-h-[28rem] flex-col rounded-2xl border border-gray-200 bg-gray-50 p-5 md:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Visualisation</p>
            <h3 className="mt-1 shrink-0 text-lg font-bold text-gray-900">LMI Cost by Deposit Amount</h3>

            <div className="mt-5 flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-[14rem] flex-1 gap-2 sm:gap-3">
                    <div className="relative w-12 shrink-0 self-stretch text-right text-xs text-gray-400">
                        {ticks.map((tick) => (
                            <span
                                key={tick}
                                className="absolute right-0 translate-y-1/2 leading-none"
                                style={{ bottom: `${(tick / yMax) * 100}%` }}
                            >
                                {formatLmiAxisLabel(tick)}
                            </span>
                        ))}
                    </div>

                    <div className="relative min-w-0 flex-1">
                        {ticks.map((tick) => (
                            <div
                                key={tick}
                                className="absolute inset-x-0 border-t border-gray-200"
                                style={{ bottom: `${(tick / yMax) * 100}%` }}
                            />
                        ))}

                        <div className="absolute inset-0 flex items-end justify-around px-1 sm:px-2">
                            {scenarios.map((scenario, index) => {
                                const heightPct = (scenario.premium / yMax) * 100;
                                const isHovered = hover === scenario.depositPct;

                                return (
                                    <div
                                        key={scenario.depositPct}
                                        className="relative flex h-full w-full max-w-[4.5rem] flex-col items-center justify-end"
                                    >
                                        {isHovered ? (
                                            <span
                                                className="pointer-events-none absolute left-1/2 z-30 w-max -translate-x-1/2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 shadow-md"
                                                style={{ bottom: `calc(${Math.max(heightPct, 8)}% + 0.5rem)` }}
                                            >
                                                <span className="block">Deposit: {scenario.depositPct}%</span>
                                                <span className="mt-0.5 block">
                                                    LMI Premium: {formatCurrency(scenario.premium)}
                                                </span>
                                            </span>
                                        ) : null}

                                        <motion.button
                                            type="button"
                                            aria-label={`${scenario.depositPct}% deposit LMI ${formatCurrency(scenario.premium)}`}
                                            initial={{ scaleY: 0 }}
                                            animate={{ scaleY: 1 }}
                                            transition={{ duration: 1.8, delay: index * 0.1, ease: [0.33, 1, 0.68, 1] }}
                                            className={`w-10 origin-bottom cursor-pointer rounded-t-md sm:w-12 ${
                                                isHovered ? 'bg-secondary' : 'bg-secondary/90'
                                            } ${scenario.premium <= 0 ? 'min-h-0' : ''}`}
                                            style={{
                                                height: scenario.premium > 0 ? `${heightPct}%` : '2px',
                                                backgroundColor: scenario.premium > 0
                                                    ? (isHovered ? '#453F3C' : '#5c5551')
                                                    : '#d1d5db',
                                            }}
                                            onMouseEnter={() => setHover(scenario.depositPct)}
                                            onMouseLeave={() => setHover(null)}
                                            onFocus={() => setHover(scenario.depositPct)}
                                            onBlur={() => setHover(null)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex shrink-0 justify-around px-1 pl-12 sm:px-2 sm:pl-14">
                    {scenarios.map((scenario) => (
                        <div key={scenario.depositPct} className="w-full max-w-[4.5rem] text-center">
                            <p className="text-sm font-semibold text-gray-900">{scenario.depositPct}%</p>
                        </div>
                    ))}
                </div>

                <p className="mt-4 text-center text-xs text-gray-500">
                    At 20% deposit (80% LVR), LMI is usually avoided on standard loans
                </p>
            </div>
        </div>
    );
}

function LmiCalculatorPanel() {
    const [propertyPrice, setPropertyPrice] = useState('');
    const [borrowAmount, setBorrowAmount] = useState('');
    const [stateCode, setStateCode] = useState('NSW');

    const [appliedValues, setAppliedValues] = useState({
        propertyPrice: '',
        borrowAmount: '',
        stateCode: 'NSW',
    });

    const commitCalculation = () => {
        setAppliedValues({
            propertyPrice,
            borrowAmount,
            stateCode,
        });
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
            commitCalculation();
        }
    };

    const handleStateChange = (value) => {
        setStateCode(value);
        setAppliedValues((prev) => ({ ...prev, stateCode: value }));
    };

    const result = useMemo(() => {
        const price = parseInt(String(appliedValues.propertyPrice).replace(/[^\d]/g, ''), 10) || 0;
        const borrow = parseInt(String(appliedValues.borrowAmount).replace(/[^\d]/g, ''), 10) || 0;

        if (price <= 0 || borrow <= 0 || borrow > price) {
            return null;
        }

        const lvr = borrow / price;
        const depositPct = (1 - lvr) * 100;
        const premium = calculateLmiPremium(price, lvr);
        const stampDuty = calculateLmiStampDuty(premium, appliedValues.stateCode);

        return {
            price,
            borrow,
            lvr,
            depositPct,
            premium,
            stampDuty,
            total: premium + stampDuty,
        };
    }, [appliedValues]);

    const handleReset = () => {
        setPropertyPrice('');
        setBorrowAmount('');
        setStateCode('NSW');
        setAppliedValues({
            propertyPrice: '',
            borrowAmount: '',
            stateCode: 'NSW',
        });
    };

    return (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch">
            <div className="flex flex-1 flex-col">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    How much LMI will I pay?
                </h2>
                <div className="mt-4 h-1 w-16 rounded-full bg-primary" />

                <h3 className="mt-6 text-lg font-semibold text-gray-900">Property & loan details</h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="lmi-property-price" className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Property price
                        </label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                                id="lmi-property-price"
                                type="text"
                                inputMode="numeric"
                                placeholder="800000"
                                value={propertyPrice}
                                onChange={(e) => setPropertyPrice(e.target.value.replace(/[^\d]/g, ''))}
                                onBlur={commitCalculation}
                                onKeyDown={handleInputKeyDown}
                                className={`${inputClassName} pl-7`}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="lmi-borrow-amount" className="mb-1.5 block text-sm font-semibold text-gray-700">
                            How much are you planning to borrow?
                        </label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                                id="lmi-borrow-amount"
                                type="text"
                                inputMode="numeric"
                                placeholder="720000"
                                value={borrowAmount}
                                onChange={(e) => setBorrowAmount(e.target.value.replace(/[^\d]/g, ''))}
                                onBlur={commitCalculation}
                                onKeyDown={handleInputKeyDown}
                                className={`${inputClassName} pl-7`}
                                required
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="lmi-state" className="mb-1.5 block text-sm font-semibold text-gray-700">
                            State
                        </label>
                        <select
                            id="lmi-state"
                            value={stateCode}
                            onChange={(e) => handleStateChange(e.target.value)}
                            className={`${inputClassName} cursor-pointer`}
                        >
                            {STATE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-8 flex flex-1 flex-col rounded-2xl border border-primary/20 bg-gray-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-500">Your estimated LMI will be</p>
                            <p className="mt-1 flex min-h-[2.25rem] items-baseline gap-1.5 text-gray-900">
                                {result ? (
                                    <motion.span
                                        key={result.total}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.9, ease: 'easeOut' }}
                                        className="text-3xl font-bold"
                                    >
                                        {formatCurrency(result.total)}
                                    </motion.span>
                                ) : (
                                    <span className="text-3xl font-bold text-gray-300">—</span>
                                )}
                            </p>
                            <p className="mt-2 text-xs leading-relaxed text-gray-500">
                                {result ? (
                                    result.premium <= 0 ? (
                                        <>
                                            At about {result.depositPct.toFixed(1)}% deposit ({(result.lvr * 100).toFixed(1)}% LVR),
                                            LMI is usually not required on standard loans.
                                        </>
                                    ) : (
                                        <>
                                            Based on a {result.depositPct.toFixed(1)}% deposit ({(result.lvr * 100).toFixed(1)}% LVR).
                                        </>
                                    )
                                ) : (
                                    'Enter a property price and loan amount to estimate your LMI.'
                                )}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="shrink-0 cursor-pointer rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-primary hover:text-primary"
                        >
                            Reset
                        </button>
                    </div>

                    <div className="mt-3.5 space-y-3 border-t border-gray-200 py-3">
                        <div>
                            <p className="text-sm text-gray-500">LMI Premium</p>
                            <p className="mt-0.5 text-xl font-semibold text-gray-900">
                                {result ? formatCurrency(result.premium) : '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Stamp Duty on LMI</p>
                            <p className="mt-0.5 text-xl font-semibold text-gray-900">
                                {result ? formatCurrency(result.stampDuty) : '—'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-auto border-t border-gray-200 pt-4">
                        <p className="mb-3 text-xs text-gray-500">
                            LMI is only one upfront cost. Don&apos;t forget stamp duty and other fees.
                        </p>
                        <Link
                            href="/calculator"
                            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-secondary transition-all hover:bg-primary/90 hover:shadow-md"
                        >
                            Get a full picture of all your other Costs
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>

            <div className="flex min-h-[28rem] flex-1 flex-col">
                {result ? (
                    <LmiDepositChart
                        key={`${result.price}-${appliedValues.stateCode}`}
                        propertyPrice={result.price}
                        stateCode={appliedValues.stateCode}
                    />
                ) : (
                    <div className="flex h-full min-h-[28rem] flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 text-center text-sm text-gray-500">
                        Enter a property price and loan amount to see LMI across deposit levels.
                    </div>
                )}
            </div>
        </div>
    );
}

function RepaySoonerChart({ base, stress }) {
    const [hover, setHover] = useState(null);
    const yMax = Math.max(base.total, stress?.total || 0) * 1.3;
    const ticks = buildAxisTicks(yMax);
    const scenarios = [
        {
            id: 'base',
            title: 'Mortgage details',
            scenario: base,
            principalColor: '#c45c3e',
            interestColor: '#f0b5a0',
        },
        stress
            ? {
                id: 'stress',
                title: `If interest rate goes up by ${RATE_STRESS_INCREASE.toFixed(2)}%`,
                scenario: stress,
                principalColor: '#4b5563',
                interestColor: '#d1d5db',
            }
            : null,
    ].filter(Boolean);

    return (
        <div className="flex h-full min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
            <div className="bg-secondary px-5 py-3 text-sm text-white md:px-6">
                Time to repay: <span className="font-semibold">{base.timeLabel}</span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-5 md:p-6">
                <h3 className="shrink-0 text-lg font-bold text-gray-900">Total repayments</h3>

                <div className="mt-5 flex min-h-0 flex-1 flex-col">
                    <div className="flex min-h-[14rem] flex-1 gap-2 sm:gap-3">
                        <div className="relative w-10 shrink-0 self-stretch text-right text-xs text-gray-400">
                            {ticks.map((tick) => (
                                <span
                                    key={tick}
                                    className="absolute right-0 translate-y-1/2 leading-none"
                                    style={{ bottom: `${(tick / yMax) * 100}%` }}
                                >
                                    {formatAxisLabel(tick, yMax, ticks)}
                                </span>
                            ))}
                        </div>

                        <div className="relative min-w-0 flex-1">
                            {ticks.map((tick) => (
                                <div
                                    key={tick}
                                    className="absolute inset-x-0 border-t border-gray-200"
                                    style={{ bottom: `${(tick / yMax) * 100}%` }}
                                />
                            ))}

                            <div className="absolute inset-0 flex items-end justify-around px-2">
                                {scenarios.map((item, index) => {
                                    const { id, title, scenario, principalColor, interestColor } = item;
                                    const totalHeight = (scenario.total / yMax) * 100;
                                    const principalHeight = (scenario.principal / scenario.total) * 100;
                                    const interestHeight = 100 - principalHeight;

                                    return (
                                        <div
                                            key={id}
                                            className="relative flex h-full w-full max-w-[7.5rem] flex-col items-center justify-end"
                                        >
                                            <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.5, delay: 0.35 + index * 0.12 }}
                                                className="absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-sm font-semibold text-gray-900"
                                                style={{ bottom: `calc(${totalHeight}% + 0.35rem)` }}
                                            >
                                                {formatCurrency(scenario.total)}
                                            </motion.p>

                                            <motion.div
                                                initial={{ scaleY: 0 }}
                                                animate={{ scaleY: 1 }}
                                                transition={{
                                                    duration: 1.8,
                                                    delay: index * 0.15,
                                                    ease: [0.33, 1, 0.68, 1],
                                                }}
                                                className="relative flex w-14 origin-bottom flex-col-reverse sm:w-16"
                                                style={{ height: `${totalHeight}%` }}
                                            >
                                                <button
                                                    type="button"
                                                    aria-label={`${title} principal ${formatCurrency(scenario.principal)}`}
                                                    className="relative w-full cursor-pointer rounded-b-md"
                                                    style={{
                                                        height: `${principalHeight}%`,
                                                        backgroundColor: principalColor,
                                                    }}
                                                    onMouseEnter={() => setHover({ id, part: 'principal' })}
                                                    onMouseLeave={() => setHover(null)}
                                                    onFocus={() => setHover({ id, part: 'principal' })}
                                                    onBlur={() => setHover(null)}
                                                >
                                                    {hover?.id === id && hover.part === 'principal' ? (
                                                        <span className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-max -translate-x-1/2 -translate-y-1/2 rounded-md border border-primary/40 bg-white px-3 py-2 text-xs font-medium text-gray-800 shadow-md">
                                                            Principal: {formatCurrency(scenario.principal)}
                                                        </span>
                                                    ) : null}
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`${title} interest ${formatCurrency(scenario.totalInterest)}`}
                                                    className="relative w-full cursor-pointer rounded-t-md"
                                                    style={{
                                                        height: `${interestHeight}%`,
                                                        backgroundColor: interestColor,
                                                    }}
                                                    onMouseEnter={() => setHover({ id, part: 'interest' })}
                                                    onMouseLeave={() => setHover(null)}
                                                    onFocus={() => setHover({ id, part: 'interest' })}
                                                    onBlur={() => setHover(null)}
                                                >
                                                    {hover?.id === id && hover.part === 'interest' ? (
                                                        <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2 rounded-md border border-primary/40 bg-white px-3 py-2 text-xs font-medium text-gray-800 shadow-md">
                                                            Interest: {formatCurrency(scenario.totalInterest)}
                                                        </span>
                                                    ) : null}
                                                </button>
                                            </motion.div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 flex min-h-[5rem] shrink-0 justify-around px-2 pl-12 sm:pl-14">
                        {scenarios.map(({ id, title, scenario }) => (
                            <div key={id} className="w-full max-w-[8rem] text-center">
                                <p className="text-sm font-semibold leading-snug text-gray-900">{title}</p>
                                <p className="mt-1 text-xs text-gray-600">{scenario.timeLabel}</p>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    {formatCurrency(scenario.periodPayment)} per {scenario.frequencyLabel} at {scenario.rate}%
                                </p>
                                {scenario.repayable === false ? (
                                    <p className="mt-1 text-xs font-medium text-red-500">
                                        Stressed case — unlikely to be repaid
                                    </p>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function RepaySoonerPanel() {
    const [amountOwing, setAmountOwing] = useState('');
    const [loanType, setLoanType] = useState('principal-interest');
    const [interestRate, setInterestRate] = useState('');
    const [extraRepayment, setExtraRepayment] = useState('');
    const [frequency, setFrequency] = useState('monthly');
    const [appliedValues, setAppliedValues] = useState({
        amountOwing: '',
        loanType: 'principal-interest',
        interestRate: '',
        extraRepayment: '',
        frequency: 'monthly',
    });

    const commitCalculation = () => {
        setAppliedValues({
            amountOwing,
            loanType,
            interestRate,
            extraRepayment,
            frequency,
        });
    };

    const handleInputKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.currentTarget.blur();
            commitCalculation();
        }
    };

    const handleLoanTypeChange = (value) => {
        setLoanType(value);
        setAppliedValues((current) => ({ ...current, loanType: value }));
    };

    const handleFrequencyChange = (value) => {
        setFrequency(value);
        setAppliedValues((current) => ({ ...current, frequency: value }));
    };

    const result = useMemo(() => {
        const principal = parseInt(String(appliedValues.amountOwing).replace(/[^\d]/g, ''), 10) || 0;
        const rate = parseFloat(String(appliedValues.interestRate)) || 0;
        const payment = parseInt(String(appliedValues.extraRepayment).replace(/[^\d]/g, ''), 10) || 0;
        const frequencyOption = FREQUENCY_OPTIONS.find(
            (option) => option.value === appliedValues.frequency
        ) || FREQUENCY_OPTIONS[0];
        const loanTypeOption = LOAN_TYPE_OPTIONS.find(
            (option) => option.value === appliedValues.loanType
        ) || LOAN_TYPE_OPTIONS[0];

        if (principal <= 0 || rate <= 0 || payment <= 0) return null;

        const base = buildRepaySoonerScenario(
            principal,
            rate,
            loanTypeOption.interestOnlyYears,
            payment,
            frequencyOption
        );
        const stress = buildRepaySoonerScenario(
            principal,
            rate + RATE_STRESS_INCREASE,
            loanTypeOption.interestOnlyYears,
            payment,
            frequencyOption
        );

        if (!base) return { error: 'payment-too-low' };
        return {
            base,
            stress,
            stressUnrepayable: !!stress && stress.repayable === false,
            interestOnlyYears: loanTypeOption.interestOnlyYears,
        };
    }, [appliedValues]);

    const reset = () => {
        setAmountOwing('');
        setLoanType('principal-interest');
        setInterestRate('');
        setExtraRepayment('');
        setFrequency('monthly');
        setAppliedValues({
            amountOwing: '',
            loanType: 'principal-interest',
            interestRate: '',
            extraRepayment: '',
            frequency: 'monthly',
        });
    };

    const hasResult = result && !result.error;

    return (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch">
            <div className="flex flex-1 flex-col">
                <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                    How long will it take to repay my loan?
                </h2>
                <div className="mt-4 h-1 w-16 rounded-full bg-primary" />
                <h3 className="mt-6 text-lg font-semibold text-gray-900">Loan details</h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="sooner-amount" className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Amount owing
                        </label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                                id="sooner-amount"
                                type="text"
                                inputMode="numeric"
                                placeholder="500000"
                                value={amountOwing}
                                onChange={(event) => setAmountOwing(event.target.value.replace(/[^\d]/g, ''))}
                                onBlur={commitCalculation}
                                onKeyDown={handleInputKeyDown}
                                className={`${inputClassName} pl-7`}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="sooner-type" className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Loan type
                        </label>
                        <select
                            id="sooner-type"
                            value={loanType}
                            onChange={(event) => handleLoanTypeChange(event.target.value)}
                            className={`${inputClassName} cursor-pointer`}
                        >
                            {LOAN_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="sooner-rate" className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Interest rate
                        </label>
                        <div className="relative">
                            <input
                                id="sooner-rate"
                                type="text"
                                inputMode="decimal"
                                placeholder="6.00"
                                value={interestRate}
                                onChange={(event) => setInterestRate(event.target.value.replace(/[^\d.]/g, ''))}
                                onBlur={commitCalculation}
                                onKeyDown={handleInputKeyDown}
                                className={`${inputClassName} pr-10`}
                                required
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="sooner-extra" className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Repayments
                        </label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                                id="sooner-extra"
                                type="text"
                                inputMode="numeric"
                                placeholder="3000"
                                value={extraRepayment}
                                onChange={(event) => setExtraRepayment(event.target.value.replace(/[^\d]/g, ''))}
                                onBlur={commitCalculation}
                                onKeyDown={handleInputKeyDown}
                                className={`${inputClassName} pl-7`}
                                required
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="sooner-frequency" className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Repayment frequency
                        </label>
                        <select
                            id="sooner-frequency"
                            value={frequency}
                            onChange={(event) => handleFrequencyChange(event.target.value)}
                            className={`${inputClassName} cursor-pointer`}
                        >
                            {FREQUENCY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-8 flex flex-1 flex-col rounded-2xl border border-primary/20 bg-gray-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-500">Time to repay</p>
                            <p className="mt-1 min-h-[2.25rem] text-gray-900">
                                {hasResult ? (
                                    <motion.span
                                        key={result.base.timeLabel}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.9, ease: 'easeOut' }}
                                        className="text-3xl font-bold"
                                    >
                                        {result.base.timeLabel}
                                    </motion.span>
                                ) : (
                                    <span className="text-3xl font-bold text-gray-300">—</span>
                                )}
                            </p>
                            <p className="mt-2 min-h-[3.5rem] max-w-sm text-xs leading-relaxed text-gray-500">
                                {result?.error
                                    ? 'Your repayment must be higher than the interest charged each period for the loan balance to reduce.'
                                    : hasResult
                                        ? `Based on repayments of ${formatCurrency(result.base.periodPayment)} ${result.base.frequencyLabel}. Total repayments ${formatCurrency(result.base.total)}.${result.stressUnrepayable ? ` At ${(result.base.rate + RATE_STRESS_INCREASE).toFixed(2)}% this repayment would not cover the interest — this is a stressed case and the loan would be very unlikely to ever be repaid.` : ''}`
                                        : 'Enter your amount owing and repayments to see how quickly the loan could be repaid.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={reset}
                            className="shrink-0 cursor-pointer rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-primary hover:text-primary"
                        >
                            Reset
                        </button>
                    </div>

                    {loanType !== 'principal-interest' ? (
                        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                            Assumption: extra repayments start only after the interest-only period ends and the loan converts to principal and interest. During the interest-only period, principal does not reduce.
                        </p>
                    ) : null}

                    <div className="mt-auto border-t border-gray-200 pt-4">
                        <p className="mb-3 text-xs text-gray-500">
                            Paying extra can shorten your loan, but stamp duty and other purchase costs still apply.
                        </p>
                        <Link
                            href="/calculator"
                            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-secondary transition-all hover:bg-primary/90 hover:shadow-md"
                        >
                            Get a full picture of all your other Costs
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>

            <div className="flex min-h-[28rem] flex-1 flex-col">
                {hasResult ? (
                    <RepaySoonerChart
                        key={`${result.base.total}-${result.stress?.total ?? 'none'}`}
                        base={result.base}
                        stress={result.stress}
                    />
                ) : (
                    <div className="flex h-full min-h-[28rem] flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 text-center text-sm text-gray-500">
                        Enter loan details to see how long repayment could take.
                    </div>
                )}
            </div>
        </div>
    );
}

export default function HomeLoanPage() {
    const { scrollY } = useScroll();
    const parallaxY = useTransform(scrollY, [0, 3000], [0, -200]);
    const [activeCalculator, setActiveCalculator] = useState('loan-repayments');

    const selectCalculator = (id) => {
        setActiveCalculator(id);
        document
            .getElementById('loan-calculators')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="min-h-screen bg-base-200">
            <motion.div
                className="fixed inset-0 z-0 pointer-events-none hidden md:block"
                style={{
                    y: parallaxY,
                    backgroundImage: "url('/test14.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                }}
                aria-hidden="true"
            />
            <div
                className="fixed inset-0 z-0 pointer-events-none md:hidden"
                style={{
                    backgroundImage: "url('/test14.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                }}
                aria-hidden="true"
            />

            <main className="relative">
                <section className="relative z-10 w-full bg-base-200">
                    <div className="container mx-auto px-4 py-16 md:py-24 lg:py-20">
                        <div className="grid md:grid-cols-12 gap-12 items-center">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="md:col-span-6 space-y-6 text-center md:text-left"
                            >
                                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                                    Try Our Quick Home Loan Calculators
                                </h1>
                                <p className="text-lg md:text-xl text-gray-600">
                                Use our calculators to get quick figures on your home loan. For a complete breakdown of true out-of-pocket costs at settlement, try our full calculator.
                                </p>
                                <div className="flex justify-center md:justify-start">
                                    <Link
                                        href="/calculator"
                                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-secondary px-8 py-3.5 rounded-full font-medium text-base hover:shadow-lg transition-all duration-200"
                                    >
                                        Full Calculator
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                                className="md:col-span-6 bg-white border border-gray-200 rounded-3xl shadow-xl p-4 md:p-5"
                            >
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:h-[15.5rem]">
                                    {miniCalculators.map((tool) => {
                                        const Icon = tool.icon;
                                        return (
                                            <button
                                                key={tool.id}
                                                type="button"
                                                onClick={() => selectCalculator(tool.id)}
                                                className="group flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 text-left transition-all duration-200 hover:border-primary/50 hover:bg-primary/[0.04] hover:shadow-sm md:h-full md:items-center"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="block text-sm font-semibold text-gray-900 group-hover:text-primary">
                                                        {tool.label}
                                                    </span>
                                                    <p className="mt-1 text-xs leading-snug text-gray-500">
                                                        {tool.description}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                <section className="relative z-10 w-full pt-16 pb-12">
                    <div className="absolute inset-0 z-0 bg-white/20 backdrop-blur-md" aria-hidden="true" />
                    <div className="relative z-10 container mx-auto px-4 pt-8">
                        <div className="grid gap-8 md:grid-cols-3">
                            {featureCards.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                                        className="rounded-2xl border border-white/80 bg-base-200 p-8 shadow-lg backdrop-blur-sm text-center md:text-left"
                                    >
                                        <div className="flex flex-col md:flex-row items-center md:items-center justify-center md:justify-start gap-2 md:gap-3 mb-3">
                                            <Icon className="w-6 h-6 text-primary shrink-0" />
                                            <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                                        </div>
                                        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section id="loan-calculators" className="relative z-10 w-full scroll-mt-24 bg-base-200 py-12">
                    <div className="relative z-10 container mx-auto px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="rounded-3xl border border-gray-200 bg-white shadow-lg p-6 md:p-8"
                        >
                            <div
                                role="tablist"
                                aria-label="Home loan calculators"
                                className="mb-8 grid grid-cols-2 overflow-hidden rounded-xl border border-gray-300 md:grid-cols-4"
                            >
                                {miniCalculators.map((tool, index) => {
                                    const isActive = activeCalculator === tool.id;

                                    return (
                                        <button
                                            key={tool.id}
                                            type="button"
                                            role="tab"
                                            aria-selected={isActive}
                                            onClick={() => setActiveCalculator(tool.id)}
                                            className={`cursor-pointer px-3 py-3.5 text-center text-sm font-semibold transition-colors md:px-4 md:py-4 md:text-base ${
                                                isActive
                                                    ? 'bg-primary text-secondary'
                                                    : 'bg-white text-gray-900 hover:bg-primary/10'
                                            } ${index % 2 === 0 ? 'border-r border-gray-300' : ''} ${
                                                index < 2 ? 'border-b border-gray-300 md:border-b-0' : ''
                                            } ${index < 3 ? 'md:border-r md:border-gray-300' : ''}`}
                                        >
                                            {tool.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div
                                className={
                                    activeCalculator === 'loan-repayments' || activeCalculator === 'borrowing-power'
                                        ? ''
                                        : 'hidden'
                                }
                            >
                                <MortgageCalculatorPanel
                                    mode={activeCalculator === 'borrowing-power' ? 'borrowing' : 'repayment'}
                                />
                            </div>
                            <div className={activeCalculator === 'lmi-calculator' ? '' : 'hidden'}>
                                <LmiCalculatorPanel />
                            </div>
                            <div className={activeCalculator === 'loan-term' ? '' : 'hidden'}>
                                <RepaySoonerPanel />
                            </div>
                        </motion.div>
                    </div>
                </section>

                <section className="relative z-10 w-full pt-12 pb-8">
                    <div className="absolute inset-0 z-0 bg-white/45 backdrop-blur-md" aria-hidden="true" />
                    <div className="relative z-10 container mx-auto px-4">
                        <div className="rounded-2xl border border-primary/40 bg-white/90 backdrop-blur-sm px-8 py-6">
                            <h3 className="text-primary font-semibold mb-2">Regulatory disclaimer</h3>
                            <p className="text-gray-800 text-sm leading-relaxed">
                                Proppers gives estimates only. Always confirm loan rates, fees, and product terms with your lender or broker before you commit.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

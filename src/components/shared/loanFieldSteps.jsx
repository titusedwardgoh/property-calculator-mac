"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useStateSelector } from "../../states/useStateSelector.js";
import { formatCurrency } from "../../states/shared/baseCalculations.js";
import { getInputFieldAnimation, getInputButtonAnimation } from "./animations/inputAnimations.js";
import QuestionInfoTooltip from "./QuestionInfoTooltip.jsx";
import { QUESTION_TOOLTIPS } from "../../lib/questionTooltips.js";

export const LOAN_GAP_FIELD_KEYS = [
  "loanDeposit",
  "loanType",
  "loanTerm",
  "loanRate",
  "loanLMI",
  "loanSettlementFees",
  "loanEstablishmentFee",
];

export function useNetStateDuty(formData) {
  const { stateFunctions } = useStateSelector(formData.selectedState);
  return useMemo(() => {
    if (
      formData.buyerDetailsComplete &&
      formData.selectedState &&
      stateFunctions?.calculateUpfrontCosts
    ) {
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
        sellerQuestionsComplete: formData.sellerQuestionsComplete,
      };

      const propertyData = {
        propertyPrice: formData.propertyPrice,
        propertyType: formData.propertyType,
        propertyCategory: formData.propertyCategory,
        isWA: formData.isWA,
        isWAMetro: formData.isWAMetro,
        isACT: formData.isACT,
      };

      const upfrontCostsResult = stateFunctions.calculateUpfrontCosts(
        buyerData,
        propertyData,
        formData.selectedState
      );
      return upfrontCostsResult.netStateDuty || 0;
    }
    return 0;
  }, [
    formData.buyerDetailsComplete,
    formData.selectedState,
    formData.buyerType,
    formData.isPPR,
    formData.isAustralianResident,
    formData.isFirstHomeBuyer,
    formData.ownedPropertyLast5Years,
    formData.hasPensionCard,
    formData.needsLoan,
    formData.savingsAmount,
    formData.income,
    formData.dependants,
    formData.dutiableValue,
    formData.constructionStarted,
    formData.sellerQuestionsComplete,
    formData.propertyPrice,
    formData.propertyType,
    formData.propertyCategory,
    formData.isWA,
    formData.isWAMetro,
    formData.isACT,
    stateFunctions,
  ]);
}

export function isLoanDepositValid(depositValue, formData, netStateDuty) {
  const depositAmount = parseInt(String(depositValue ?? ""), 10) || 0;
  const propertyPrice = parseInt(formData.propertyPrice, 10) || 0;
  const minimumDeposit = Math.round(propertyPrice * 0.05);
  const maximumDeposit = propertyPrice + netStateDuty;
  return (
    depositAmount > 0 &&
    depositAmount >= minimumDeposit &&
    depositAmount <= maximumDeposit
  );
}

export function isLoanTermValid(loanTerm, loanType, loanInterestOnlyPeriod) {
  const loanTermValid =
    loanTerm &&
    parseInt(String(loanTerm), 10) >= 1 &&
    parseInt(String(loanTerm), 10) <= 30;
  if (loanType === "interest-only") {
    const interestOnlyPeriod = parseInt(String(loanInterestOnlyPeriod ?? ""), 10) || 0;
    const term = parseInt(String(loanTerm), 10) || 0;
    const ioRaw = loanInterestOnlyPeriod;
    return (
      loanTermValid &&
      ioRaw &&
      ioRaw !== "-" &&
      interestOnlyPeriod >= 1 &&
      interestOnlyPeriod <= 5 &&
      interestOnlyPeriod <= term
    );
  }
  return !!loanTermValid;
}

export function isLoanRateValid(loanRate) {
  if (loanRate === "" || loanRate == null) return false;
  const n = parseFloat(String(loanRate));
  return !isNaN(n) && n >= 0.01 && n <= 20;
}

export function LoanDepositStep({ depositValue, onDepositChange, formData, netStateDuty }) {
  const propertyPrice = parseInt(formData.propertyPrice, 10) || 0;
  const minimumDeposit = Math.round(propertyPrice * 0.05);
  const depositAmount = parseInt(String(depositValue ?? ""), 10) || 0;
  const savingsAmount = parseInt(formData.savingsAmount, 10) || 0;
  const formattedPropertyPrice = propertyPrice.toLocaleString("en-AU");
  const formattedMinimumDeposit = minimumDeposit.toLocaleString("en-AU");

  return (
    <div className="flex flex-col mt-8 md:mt-0 pr-2">
      <h2 className="mb-4 text-3xl font-base leading-tight text-gray-800 lg:text-4xl">
        What is your deposit amount?
        {" "}
        <QuestionInfoTooltip ariaLabel="Help: deposit amount">
          {QUESTION_TOOLTIPS.loanDeposit}
        </QuestionInfoTooltip>
      </h2>
      <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
        {`You will need a minimum of $${formattedMinimumDeposit} which is 5% of the Property's Price of $${formattedPropertyPrice}`}
      </p>
      <div className="relative pr-8">
        <div
          className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none ${
            depositValue ? "text-gray-800" : "text-gray-400"
          }`}
        >
          $
        </div>
        <motion.input
          type="tel"
          placeholder="0"
          value={
            depositValue
              ? formatCurrency(parseInt(String(depositValue).replace(/[^\d]/g, ""), 10) || 0).replace("$", "")
              : ""
          }
          onChange={(e) => {
            const numericValue = e.target.value.replace(/[^\d]/g, "");
            onDepositChange(numericValue);
          }}
          {...getInputFieldAnimation()}
          className={`w-50 pl-8 pr-8 py-2 text-2xl border-b-2 rounded-none focus:outline-none hover:border-gray-300 ${
            depositAmount > 0 && depositAmount < minimumDeposit
              ? "border-primary focus:border-primary"
              : "border-gray-200 focus:border-secondary"
          }`}
        />
      </div>
      {depositAmount > 0 && depositAmount < minimumDeposit && (
        <p className="text-primary text-sm mt-2">
          Deposit must be at least ${formattedMinimumDeposit} (5% of property price)
        </p>
      )}
      {depositAmount > 0 &&
        propertyPrice > 0 &&
        depositAmount > propertyPrice + netStateDuty && (
          <p className="text-sm text-primary mt-2 italic">
            Deposit cannot exceed the Property + state duty
          </p>
        )}
      {depositAmount > 0 &&
        savingsAmount > 0 &&
        depositAmount > savingsAmount && (
          <p className="text-sm text-primary mt-2 italic">
            Are you sure? You mentioned you only have $
            {savingsAmount.toLocaleString("en-AU")} of savings
          </p>
        )}
    </div>
  );
}

const LOAN_TYPE_OPTIONS = [
  {
    value: "principal-and-interest",
    label: "Principal and Interest",
    description: "Pay both principal and interest each month",
  },
  {
    value: "interest-only",
    label: "Interest Only",
    description: "Pay only interest for a set period",
  },
];

export function LoanTypeStep({ loanType, onLoanTypeChange }) {
  return (
    <div className="flex flex-col mt-8 md:mt-0 pr-2">
      <h2 className="mb-4 text-3xl font-base leading-tight text-gray-800 lg:text-4xl">
        What type of loan do you need?
        {" "}
        <QuestionInfoTooltip ariaLabel="Help: loan type">
          {QUESTION_TOOLTIPS.loanType}
        </QuestionInfoTooltip>
      </h2>
      <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
        This affects your monthly payments and loan structure
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:flex gap-2 mb-8">
        {LOAN_TYPE_OPTIONS.map((option) => (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => onLoanTypeChange(option.value)}
            {...getInputButtonAnimation()}
            className={`py-2 px-3 cursor-pointer rounded-lg w-full md:w-[260px] border-2 flex flex-col items-start ${
              loanType === option.value
                ? "border-gray-800 bg-secondary text-white shadow-lg"
                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="text-base font-medium mb-2 leading-none">{option.label}</div>
            <div
              className={`text-xs leading-none text-left ${
                loanType === option.value ? "text-gray-300" : "text-gray-500"
              }`}
            >
              {option.description}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export function LoanTermStep({
  loanTerm,
  onLoanTermChange,
  loanType,
  loanInterestOnlyPeriod,
  onInterestOnlyPeriodChange,
}) {
  const interestOnlyPeriod = parseInt(String(loanInterestOnlyPeriod ?? ""), 10) || 0;
  const term = parseInt(String(loanTerm ?? ""), 10) || 0;
  const ioInvalid = interestOnlyPeriod > 0 && interestOnlyPeriod > term;

  return (
    <div className="flex flex-col mt-8 md:mt-0 pr-2">
      <h2 className="mb-4 text-3xl font-base leading-tight text-gray-800 lg:text-4xl">
        How long is your mortgage for?
        {" "}
        <QuestionInfoTooltip ariaLabel="Help: loan term">
          {QUESTION_TOOLTIPS.loanTerm}
        </QuestionInfoTooltip>
      </h2>
      <p className="lg:text-lg xl:text-xl lg:mb-10 text-gray-500 leading-relaxed mb-8">
        Enter the number of years for your loan (1-30 years)
      </p>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <motion.input
            type="number"
            min="1"
            max="30"
            step="1"
            placeholder="30"
            value={loanTerm || ""}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (value >= 1 && value <= 30) {
                onLoanTermChange(value.toString());
              } else if (e.target.value === "") {
                onLoanTermChange("");
              }
            }}
            {...getInputFieldAnimation()}
            className="w-15 pl-4 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300 text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="pl-4 text-xl text-gray-500">years</span>
        </div>

        {loanType === "interest-only" && (
          <div className="flex items-center gap-2">
            <select
              value={loanInterestOnlyPeriod || "-"}
              onChange={(e) => onInterestOnlyPeriodChange(e.target.value)}
              className={`px-3 py-2 text-2xl border-b-2 rounded-none focus:outline-none transition-all duration-200 hover:border-gray-300 text-left bg-base ${
                ioInvalid ? "border-primary focus:border-primary" : "border-gray-200 focus:border-secondary"
              }`}
            >
              <option value="-"> </option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            <span className="pl-4 text-xl text-gray-500">years interest-only period</span>
          </div>
        )}
      </div>

      {loanType === "interest-only" && ioInvalid && (
        <p className="text-primary text-sm mt-2">
          Interest-only period cannot exceed loan term ({term} years)
        </p>
      )}
    </div>
  );
}

export function LoanRateStep({ loanRate, onLoanRateChange }) {
  return (
    <div className="flex flex-col mt-8 md:mt-0 pr-2">
      <h2 className="mb-4 text-3xl font-base leading-tight text-gray-800 lg:text-4xl">
        What is your interest rate are you paying?
        {" "}
        <QuestionInfoTooltip ariaLabel="Help: interest rate">
          {QUESTION_TOOLTIPS.loanRate}
        </QuestionInfoTooltip>
      </h2>
      <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
        Enter the annual interest rate percentage for your loan
      </p>
      <div className="flex items-center gap-2">
        <motion.input
          type="number"
          min="0.01"
          max="20"
          step="0.01"
          placeholder="6"
          value={loanRate || ""}
          onChange={(e) => {
            const value = e.target.value;
            if (/^\d*\.?\d{0,2}$/.test(value)) {
              onLoanRateChange(value);
            }
          }}
          onBlur={(e) => {
            const value = e.target.value;
            if (value && !isNaN(parseFloat(value))) {
              onLoanRateChange(parseFloat(value).toFixed(2));
            }
          }}
          {...getInputFieldAnimation()}
          className="w-19 pl-2 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300 text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xl text-gray-500">%</span>
      </div>
      {loanRate && parseFloat(String(loanRate)) > 10 && (
        <p className="text-sm text-primary mt-2 italic">That feels like quite a high rate!</p>
      )}
    </div>
  );
}

export function LoanLMIStep({ loanLMI, onLoanLMIChange, LVR }) {
  const lvr = LVR ?? 0;
  const lvrPercentage = Math.round(lvr * 100);
  const sub =
    lvr < 0.8
      ? "You are unlikely to need LMI as your Loan-to-Value ratio is less than 80%"
      : `You would typically need LMI as your Loan-to-Value ratio is ${lvrPercentage}%`;

  return (
    <div className="flex flex-col mt-8 md:mt-0 pr-2">
      <h2 className="mb-4 text-3xl font-base leading-tight text-gray-800 lg:text-4xl">
        Do you need Lenders Mortgage Insurance?
        {" "}
        <QuestionInfoTooltip ariaLabel="Help: Lenders Mortgage Insurance">
          {QUESTION_TOOLTIPS.loanLMI}
        </QuestionInfoTooltip>
      </h2>
      <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">{sub}</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:flex gap-2 mb-8">
        {[
          { value: "yes", label: "Yes", description: "I need LMI coverage" },
          { value: "no", label: "No", description: "I don't need LMI coverage" },
        ].map((option) => (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => onLoanLMIChange(option.value)}
            {...getInputButtonAnimation()}
            className={`py-2 px-3 rounded-lg w-full md:w-[260px] border-2 flex flex-col items-start ${
              loanLMI === option.value
                ? "border-gray-800 bg-secondary text-white shadow-lg"
                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="text-base font-medium mb-2 leading-none">{option.label}</div>
            <div
              className={`text-xs leading-none text-left ${
                loanLMI === option.value ? "text-gray-300" : "text-gray-500"
              }`}
            >
              {option.description}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export function LoanSettlementFeesStep({ value, onChange }) {
  return (
    <div className="flex flex-col mt-8 md:mt-0 pr-2">
      <h2 className="mb-4 text-3xl font-base leading-tight text-gray-800 lg:text-4xl">
        Banks usually charge a Settlement Fee
        {" "}
        <QuestionInfoTooltip ariaLabel="Help: settlement fee">
          {QUESTION_TOOLTIPS.loanSettlementFees}
        </QuestionInfoTooltip>
      </h2>
      <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
        Fee charged by the bank for settlement processing
      </p>
      <div className="relative pr-8">
        <div
          className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none ${
            value ? "text-gray-800" : "text-gray-400"
          }`}
        >
          $
        </div>
        <motion.input
          type="tel"
          placeholder="200"
          value={
            value
              ? formatCurrency(parseInt(String(value).replace(/[^\d]/g, ""), 10) || 0).replace("$", "")
              : ""
          }
          onChange={(e) => {
            const numericValue = e.target.value.replace(/[^\d]/g, "");
            onChange(numericValue);
          }}
          {...getInputFieldAnimation()}
          className="w-31 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
        />
      </div>
    </div>
  );
}

export function LoanEstablishmentFeeStep({ value, onChange }) {
  return (
    <div className="flex flex-col mt-8 md:mt-0 pr-2">
      <h2 className="mb-4 text-3xl font-base leading-tight text-gray-800 lg:text-4xl">
        Banks usually charge an Establishment Fee
        {" "}
        <QuestionInfoTooltip ariaLabel="Help: establishment fee">
          {QUESTION_TOOLTIPS.loanEstablishmentFee}
        </QuestionInfoTooltip>
      </h2>
      <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
        Fee charged by the bank for setting up your loan
      </p>
      <div className="relative pr-8">
        <div
          className={`absolute left-0 top-1/2 transform -translate-y-1/2 text-2xl pointer-events-none ${
            value ? "text-gray-800" : "text-gray-400"
          }`}
        >
          $
        </div>
        <motion.input
          type="tel"
          placeholder="600"
          value={
            value
              ? formatCurrency(parseInt(String(value).replace(/[^\d]/g, ""), 10) || 0).replace("$", "")
              : ""
          }
          onChange={(e) => {
            const numericValue = e.target.value.replace(/[^\d]/g, "");
            onChange(numericValue);
          }}
          {...getInputFieldAnimation()}
          className="w-31 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
        />
      </div>
    </div>
  );
}

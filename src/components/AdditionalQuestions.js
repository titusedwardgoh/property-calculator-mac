"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useFormNavigation from "./shared/FormNavigation.js";
import { useFormStore } from "../stores/formStore";
import { getFieldUIConfig } from "../lib/fieldUIConfigs";
import { formatCurrency } from "../states/shared/baseCalculations";
import { isFieldAnswered } from "../lib/progressCalculation";
import {
  LOAN_GAP_FIELD_KEYS,
  useNetStateDuty,
  LoanDepositStep,
  LoanTypeStep,
  LoanTermStep,
  LoanRateStep,
  LoanLMIStep,
  LoanSettlementFeesStep,
  LoanEstablishmentFeeStep,
  isLoanDepositValid,
  isLoanTermValid,
  isLoanRateValid,
} from "./shared/loanFieldSteps.jsx";
import {
  getQuestionSlideAnimation,
  getQuestionNumberAnimation,
} from "./shared/animations/questionAnimations";
import {
  getBackButtonAnimation,
  getNextButtonAnimation,
} from "./shared/animations/buttonAnimations";
import {
  getInputFieldAnimation,
  getInputButtonAnimation,
} from "./shared/animations/inputAnimations";

export default function AdditionalQuestions() {
  const formData = useFormStore();
  const updateFormData = useFormStore((s) => s.updateFormData);
  const updateLVR = useFormStore((s) => s.updateLVR);
  const netStateDuty = useNetStateDuty(formData);
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState("forward");
  const [showEntryOverlay, setShowEntryOverlay] = useState(true);
  const [draftValue, setDraftValue] = useState(null);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [completionPhase, setCompletionPhase] = useState("adding");

  const fields = formData.additionalQuestionsFields || [];
  const totalSteps = fields.length;

  const currentFieldKey = fields[currentStep - 1];

  useEffect(() => {
    const timer = setTimeout(() => setShowEntryOverlay(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showCompletionOverlay) return;
    const t1 = setTimeout(() => setCompletionPhase("complete"), 2000);
    const t2 = setTimeout(() => {
      // If we collected loan fields, mark loan complete and run derived calculations
      const state = useFormStore.getState();
      const hadLoanFields = (state.additionalQuestionsFields || []).some((k) =>
        LOAN_GAP_FIELD_KEYS.includes(k)
      );
      if (hadLoanFields) {
        updateFormData('loanDetailsComplete', true);
        updateFormData('loanDetailsEverCompleted', true);
        state.updateLVR?.();
        state.updateLMI?.();
        state.updateLoanRepayments?.();
      }
      updateFormData("showAdditionalQuestions", false);
      updateFormData("additionalQuestionsFields", []);
      updateFormData("additionalQuestionsStep", 1);
      updateFormData("showSummary", true);
      updateFormData("editingFromReview", false);
      setShowCompletionOverlay(false);
    }, 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [showCompletionOverlay, updateFormData]);

  const storedValueForCurrentField = currentFieldKey
    ? formData[currentFieldKey]
    : undefined;

  useEffect(() => {
    if (currentFieldKey) {
      setDraftValue(
        storedValueForCurrentField !== undefined &&
          storedValueForCurrentField !== null
          ? storedValueForCurrentField
          : ""
      );
    }
  }, [currentFieldKey, storedValueForCurrentField]);

  useEffect(() => {
    updateLVR();
  }, [formData.loanDeposit, formData.propertyPrice, updateLVR]);

  useEffect(() => {
    if (currentFieldKey === "loanSettlementFees" && !formData.loanSettlementFees) {
      updateFormData("loanSettlementFees", "200");
    }
    if (currentFieldKey === "loanEstablishmentFee" && !formData.loanEstablishmentFee) {
      updateFormData("loanEstablishmentFee", "500");
    }
  }, [
    currentFieldKey,
    formData.loanSettlementFees,
    formData.loanEstablishmentFee,
    updateFormData,
  ]);

  useEffect(() => {
    if (fields.length === 0) {
      updateFormData("showAdditionalQuestions", false);
      updateFormData("additionalQuestionsFields", []);
    }
  }, [fields.length, updateFormData]);

  const config = currentFieldKey ? getFieldUIConfig(currentFieldKey) : null;
  const value = draftValue !== null ? draftValue : (formData[currentFieldKey] ?? "");

  const saveAndAdvance = (nextStepNum) => {
    if (currentFieldKey) {
      updateFormData(currentFieldKey, draftValue !== null ? draftValue : formData[currentFieldKey]);
    }
    if (nextStepNum <= totalSteps) {
      setDirection("forward");
      setTimeout(() => {
        setCurrentStep(nextStepNum);
        updateFormData("additionalQuestionsStep", nextStepNum);
      }, 150);
    } else {
      setCompletionPhase("adding");
      setShowCompletionOverlay(true);
    }
  };

  const saveAndGoBack = (prevStepNum) => {
    if (currentFieldKey) {
      updateFormData(currentFieldKey, draftValue !== null ? draftValue : formData[currentFieldKey]);
    }
    setDirection("backward");
    setTimeout(() => {
      setCurrentStep(prevStepNum);
      updateFormData("additionalQuestionsStep", prevStepNum);
    }, 150);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      saveAndAdvance(currentStep + 1);
    } else {
      saveAndAdvance(totalSteps + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      saveAndGoBack(currentStep - 1);
    }
  };

  const handleBack = () => {
    updateFormData("showAdditionalQuestions", false);
    updateFormData("additionalQuestionsFields", []);
    updateFormData("additionalQuestionsStep", 1);
  };

  const isCurrentStepValid = () => {
    if (!currentFieldKey) return false;
    const val = draftValue !== null ? draftValue : formData[currentFieldKey];
    if (LOAN_GAP_FIELD_KEYS.includes(currentFieldKey)) {
      switch (currentFieldKey) {
        case "loanDeposit":
          return isLoanDepositValid(val, formData, netStateDuty);
        case "loanType":
          return val && String(val).trim() !== "";
        case "loanTerm":
          return isLoanTermValid(
            val,
            formData.loanType,
            formData.loanInterestOnlyPeriod
          );
        case "loanRate":
          return isLoanRateValid(val);
        case "loanLMI":
          return val && String(val).trim() !== "";
        case "loanSettlementFees":
          return (
            val !== "" &&
            val != null &&
            !Number.isNaN(parseFloat(val)) &&
            parseFloat(val) >= 0
          );
        case "loanEstablishmentFee":
          return (
            val !== "" &&
            val != null &&
            !Number.isNaN(parseFloat(val)) &&
            parseFloat(val) >= 0
          );
        default:
          return false;
      }
    }
    return isFieldAnswered(val);
  };

  useFormNavigation({
    currentStep,
    totalSteps,
    isCurrentStepValid,
    onNext: nextStep,
    onPrev: prevStep,
    onBack: handleBack,
  });

  if (fields.length === 0 || !config) return null;

  const hasOptionDescriptions = config.options?.some((opt) => opt.description);

  const renderInput = () => {
    if (config.type === "toggle") {
      if (hasOptionDescriptions) {
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:flex gap-2 mb-8">
            {(config.options || []).map((opt) => (
              <motion.button
                key={opt.value}
                onClick={() => setDraftValue(opt.value)}
                {...getInputButtonAnimation()}
                className={`py-2 px-3 cursor-pointer rounded-lg w-full md:w-[260px] border-2 flex flex-col items-start ${
                  value === opt.value
                    ? "border-gray-800 bg-secondary text-white shadow-lg"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="text-base font-medium mb-2 leading-none">
                  {opt.label}
                </div>
                <div
                  className={`text-xs leading-none text-left ${
                    value === opt.value ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {opt.description}
                </div>
              </motion.button>
            ))}
          </div>
        );
      }
      return (
        <div className="grid grid-cols-2 gap-2 mb-8 lg:grid-cols-2 ml-1 md:ml-2">
          {(config.options || []).map((opt) => (
            <motion.button
              key={opt.value}
              onClick={() => setDraftValue(opt.value)}
              {...getInputButtonAnimation()}
              className={`py-2 px-3 rounded-lg border-2 flex flex-col items-center lg:items-start w-full ${
                value === opt.value
                  ? "border-gray-800 bg-secondary text-white shadow-lg cursor-pointer"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
              }`}
            >
              <div className="text-base font-medium mb-2 leading-none">
                {opt.label}
              </div>
            </motion.button>
          ))}
        </div>
      );
    }

    if (config.type === "select") {
      return (
        <div className="grid grid-cols-2 gap-2 mb-8 lg:grid-cols-2 ml-1 md:ml-2">
          {(config.options || []).map((opt) => (
            <motion.button
              key={opt.value}
              onClick={() => setDraftValue(opt.value)}
              {...getInputButtonAnimation()}
              className={`py-2 px-3 rounded-lg border-2 flex flex-col items-center lg:items-start w-full ${
                value === opt.value
                  ? "border-gray-800 bg-secondary text-white shadow-lg cursor-pointer"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
              }`}
            >
              <div className="text-base font-medium leading-none">
                {opt.label}
              </div>
            </motion.button>
          ))}
        </div>
      );
    }

    if (config.type === "currency") {
      return (
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
            placeholder="0"
            value={
              value
                ? formatCurrency(parseInt(value)).replace("$", "")
                : ""
            }
            onChange={(e) => {
              const numericValue = e.target.value.replace(/[^\d]/g, "");
              setDraftValue(numericValue);
            }}
            {...getInputFieldAnimation()}
            className="w-50 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
          />
        </div>
      );
    }

    if (config.type === "number") {
      return (
        <div className="relative pr-8">
          <motion.input
            type="tel"
            placeholder="0"
            min={currentFieldKey === "dependants" ? 0 : undefined}
            value={value !== "" && value != null ? value : ""}
            onChange={(e) => {
              if (currentFieldKey === "loanRate") {
                const v = e.target.value;
                if (v === "") {
                  setDraftValue("");
                  return;
                }
                const n = parseFloat(v);
                if (!isNaN(n)) setDraftValue(String(n));
              } else {
                const numericValue = e.target.value.replace(/[^\d]/g, "");
                setDraftValue(numericValue);
              }
            }}
            {...getInputFieldAnimation()}
            className="w-32 pl-8 pr-8 py-2 text-2xl border-b-2 border-gray-200 rounded-none focus:border-secondary focus:outline-none hover:border-gray-300"
          />
        </div>
      );
    }

    if (config.type === "text") {
      return (
        <motion.input
          type="text"
          value={value != null ? value : ""}
          onChange={(e) => setDraftValue(e.target.value)}
          placeholder="Enter address"
          {...getInputFieldAnimation()}
          className="w-full max-w-md mt-4 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary"
        />
      );
    }

    return null;
  };

  const isLoanField = LOAN_GAP_FIELD_KEYS.includes(currentFieldKey);

  const renderLoanField = () => {
    switch (currentFieldKey) {
      case "loanDeposit":
        return (
          <LoanDepositStep
            depositValue={value}
            onDepositChange={setDraftValue}
            formData={formData}
            netStateDuty={netStateDuty}
          />
        );
      case "loanType":
        return (
          <LoanTypeStep loanType={value} onLoanTypeChange={setDraftValue} />
        );
      case "loanTerm":
        return (
          <LoanTermStep
            loanTerm={value}
            onLoanTermChange={setDraftValue}
            loanType={formData.loanType}
            loanInterestOnlyPeriod={formData.loanInterestOnlyPeriod}
            onInterestOnlyPeriodChange={(v) =>
              updateFormData("loanInterestOnlyPeriod", v)
            }
          />
        );
      case "loanRate":
        return (
          <LoanRateStep loanRate={value} onLoanRateChange={setDraftValue} />
        );
      case "loanLMI":
        return (
          <LoanLMIStep
            loanLMI={value}
            onLoanLMIChange={setDraftValue}
            LVR={formData.LVR}
          />
        );
      case "loanSettlementFees":
        return (
          <LoanSettlementFeesStep value={value} onChange={setDraftValue} />
        );
      case "loanEstablishmentFee":
        return (
          <LoanEstablishmentFeeStep value={value} onChange={setDraftValue} />
        );
      default:
        return null;
    }
  };

  if (showEntryOverlay) {
    return (
      <div className="fixed inset-0 bg-base-100 backdrop-blur-lg z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">A few more questions...</p>
        </div>
      </div>
    );
  }

  if (showCompletionOverlay) {
    return (
      <div className="fixed inset-0 bg-base-100 backdrop-blur-lg z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="min-h-[2.5rem] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {completionPhase === "adding" ? (
                <motion.p
                  key="adding"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-gray-600"
                >
                  Hang on, adding in new information..
                </motion.p>
              ) : (
                <motion.p
                  key="complete"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-gray-600"
                >
                  Survey complete!
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-base-100 rounded-lg overflow-hidden mt-15">
      <div className="flex">
        <AnimatePresence mode="wait">
          <motion.span
            key={`step-${currentStep}`}
            {...getQuestionNumberAnimation(direction, 0.4)}
            className="flex items-center text-xs -mt-93 md:-mt-93 lg:-mt-93 lg:text-sm lg:pt-15 font-extrabold mr-2 pt-14 whitespace-nowrap text-primary"
          >
            {currentStep}
            <span className="text-xs">→</span>
          </motion.span>
        </AnimatePresence>
        <div className="pb-6 pb-24 md:pb-8 flex">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${currentStep}`}
              {...getQuestionSlideAnimation(direction, false, 0.5, 0.3)}
              className="h-80"
            >
              {isLoanField ? (
                renderLoanField()
              ) : (
                <div className="flex flex-col mt-8 md:mt-0 pr-2">
                  <h2 className="text-3xl lg:text-4xl font-base text-gray-800 mb-4 leading-tight">
                    {config.title || config.label}
                  </h2>
                  <p className="lg:text-lg xl:text-xl lg:mb-20 text-gray-500 leading-relaxed mb-8">
                    {config.description ||
                      "Please provide this information to complete your report."}
                  </p>
                  {renderInput()}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="md:pl-8 xl:text-lg fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto bg-base-100 md:bg-transparent pt-0 pr-4 pb-4 pl-4 md:p-0 md:mt-8 md:px-6 md:pb-8 lg:mt-15 xl:mt-15">
        <div className="flex justify-start mx-auto mt-4">
          {currentStep === 1 ? (
            <>
              <motion.button
                onClick={handleBack}
                {...getBackButtonAnimation()}
                className="bg-primary px-6 py-3 rounded-full border border-primary font-medium hover:bg-primary hover:border-gray-700 hover:shadow-sm flex-shrink-0 cursor-pointer"
              >
                &lt;
              </motion.button>
              <motion.button
                onClick={nextStep}
                disabled={!isCurrentStepValid()}
                {...getNextButtonAnimation(isCurrentStepValid())}
                className={`flex-1 ml-4 px-6 py-3 rounded-full border border-primary font-medium ${
                  !isCurrentStepValid()
                    ? "border-primary-100 cursor-not-allowed bg-primary text-base-100"
                    : "bg-primary hover:bg-primary hover:border-gray-700 hover:shadow-sm cursor-pointer"
                }`}
              >
                Next
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                onClick={prevStep}
                {...getBackButtonAnimation()}
                className="bg-primary px-6 py-3 rounded-full border border-primary font-medium hover:bg-primary hover:border-gray-700 hover:shadow-sm flex-shrink-0 cursor-pointer"
              >
                &lt;
              </motion.button>
              <motion.button
                onClick={nextStep}
                disabled={!isCurrentStepValid()}
                {...getNextButtonAnimation(isCurrentStepValid())}
                className={`flex-1 ml-4 px-6 py-3 bg-primary rounded-full border border-primary font-medium ${
                  !isCurrentStepValid()
                    ? "border-primary-100 cursor-not-allowed bg-gray-50 text-base-100"
                    : "text-secondary hover:bg-primary hover:border-gray-700 hover:shadow-sm cursor-pointer"
                }`}
              >
                {currentStep === totalSteps ? "Done" : "Next"}
              </motion.button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

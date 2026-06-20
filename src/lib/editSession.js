/**
 * Fields snapshotted when editing a completed survey from Results.
 * Includes answers, completion flags, and calculated values needed for Results display.
 */
export const EDIT_SESSION_SNAPSHOT_KEYS = [
  // Property
  'propertyPrice',
  'propertyAddress',
  'propertyStreetAddress',
  'propertySuburbPostcode',
  'detectedState',
  'detectedWALocation',
  'detectedWAMetro',
  'selectedState',
  'propertyType',
  'propertyCategory',
  'isWA',
  'isWAMetro',
  'isACT',
  'propertyDetailsComplete',
  'propertyDetailsFormComplete',
  'propertyDetailsCurrentStep',
  'propertyDetailsActiveStep',
  // Buyer
  'buyerType',
  'isPPR',
  'isAustralianResident',
  'isFirstHomeBuyer',
  'ownedPropertyLast5Years',
  'hasPensionCard',
  'needsLoan',
  'savingsAmount',
  'income',
  'dependants',
  'buyerDetailsComplete',
  'buyerDetailsCurrentStep',
  'buyerDetailsActiveStep',
  // Loan
  'loanDeposit',
  'loanType',
  'loanTerm',
  'loanInterestOnlyPeriod',
  'loanRate',
  'loanLMI',
  'loanSettlementFees',
  'loanEstablishmentFee',
  'loanDetailsComplete',
  'loanDetailsEverCompleted',
  'loanDetailsCurrentStep',
  'loanDetailsActiveStep',
  'showLoanDetails',
  // Seller
  'councilRates',
  'waterRates',
  'constructionStarted',
  'dutiableValue',
  'bodyCorp',
  'landTransferFee',
  'legalFees',
  'buildingAndPestInspection',
  'FIRBFee',
  'sellerQuestionsComplete',
  'sellerQuestionsActiveStep',
  'showSellerQuestions',
  // Calculated
  'LVR',
  'LMI_COST',
  'LMI_STAMP_DUTY',
  'MONTHLY_LOAN_REPAYMENT',
  'ANNUAL_LOAN_REPAYMENT',
  'COUNCIL_RATES_MONTHLY',
  'WATER_RATES_MONTHLY',
  'BODY_CORP_MONTHLY',
  // Survey completion / UI flags needed for Results
  'allFormsComplete',
  'showSummary',
  'showReviewPage',
  'editingFromReview',
  'showAdditionalQuestions',
  'additionalQuestionsFields',
  'additionalQuestionsStep',
];

export function captureEditSessionSnapshot(state) {
  const snapshot = {};
  EDIT_SESSION_SNAPSHOT_KEYS.forEach((key) => {
    const value = state[key];
    if (Array.isArray(value)) {
      snapshot[key] = [...value];
    } else if (value !== undefined) {
      snapshot[key] = value;
    }
  });
  return snapshot;
}

export function applyEditSessionSnapshot(snapshot) {
  const patch = {};
  EDIT_SESSION_SNAPSHOT_KEYS.forEach((key) => {
    if (!(key in snapshot)) return;
    const value = snapshot[key];
    if (Array.isArray(value)) {
      patch[key] = [...value];
    } else {
      patch[key] = value;
    }
  });
  patch.editSessionActive = false;
  patch.editSessionSnapshot = null;
  patch.editingFromReview = false;
  patch.showAdditionalQuestions = false;
  patch.additionalQuestionsFields = [];
  patch.additionalQuestionsStep = 1;
  patch.allFormsComplete = true;
  patch.showSummary = true;
  return patch;
}

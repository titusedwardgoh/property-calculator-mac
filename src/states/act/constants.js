// ACT-specific constants and rates
export const ACT_STAMP_DUTY_RATES = [
  { min: 0, max: 200000, rate: 0.012, fixedFee: 0 }, // $1.20 per $100 = 1.2% up to $200,000
  { min: 200000, max: 300000, rate: 0.022, fixedFee: 2400 }, // $2,400 + $2.20 per $100 over $200,000
  { min: 300000, max: 500000, rate: 0.034, fixedFee: 4600 }, // $4,600 + $3.40 per $100 over $300,000
  { min: 500000, max: 750000, rate: 0.0432, fixedFee: 11400 }, // $11,400 + $4.32 per $100 over $500,000
  { min: 750000, max: 1000000, rate: 0.059, fixedFee: 22200 }, // $22,200 + $5.90 per $100 over $750,000
  { min: 1000000, max: 1455000, rate: 0.064, fixedFee: 36950 }, // $36,950 + $6.40 per $100 over $1,000,000
  { min: 1455000, max: Infinity, rate: 0.0454, fixedFee: 0 } // Flat rate of $4.54 per $100 for total transaction value
];

// ACT HBCS duty calculation brackets (effective 1 July 2025)
export const ACT_HBCS_DUTY_BRACKETS = [
  { min: 0, max: 1020000, duty: 0 }, // $0 duty for properties ≤ $1,020,000
  { min: 1020000, max: 1455000, rate: 0.064, threshold: 1020000 }, // $6.40 per $100 over $1,020,000
  { min: 1455000, max: Infinity, rate: 0.0454, flatRate: true } // $4.54 per $100 of total value
];

export const ACT_FOREIGN_BUYER_RATE = 0.08; // 8% additional duty for foreign buyers
export const ACT_STATE_AVERAGE = 800000;

// HBCS (Home Buyer Concession Scheme) constants
export const ACT_HBCS_MAX_CONCESSION = 35238; // Maximum concession amount

// HBCS income thresholds based on number of dependents (effective 1 July 2024)
export const ACT_HBCS_INCOME_THRESHOLDS = {
  0: 250000,   // 0 dependents
  1: 254600,   // 1 dependent
  2: 259200,   // 2 dependents
  3: 263800,   // 3 dependents
  4: 268400,   // 4 dependents
  5: 273000    // 5+ dependents
};

// QLD-specific constants and rates
export const QLD_STAMP_DUTY_RATES = [
  { min: 0, max: 5000, rate: 0, fixedFee: 0 }, // Not more than $5,000 - Nil
  { min: 5000, max: 75000, rate: 0.015, fixedFee: 0 }, // $1.50 for each $100 over $5,000 = 1.5%
  { min: 75000, max: 540000, rate: 0.035, fixedFee: 1050 }, // $1,050 + $3.50 for each $100 over $75,000
  { min: 540000, max: 1000000, rate: 0.045, fixedFee: 17325 }, // $17,325 + $4.50 for each $100 over $540,000
  { min: 1000000, max: Infinity, rate: 0.0575, fixedFee: 38025 } // $38,025 + $5.75 for each $100 over $1,000,000
];

// QLD Home Concession rates (reduced rates for homes)
// Based on: https://qro.qld.gov.au/duties/transfer-duty/concessions/homes/home-concession/
export const QLD_HOME_CONCESSION_RATES = [
  { min: 0, max: 350000, rate: 0.01, fixedFee: 0 }, // $1.00 per $100 = 1% on first $350,000
  { min: 350000, max: 540000, rate: 0.035, fixedFee: 3500 }, // $3,500 + $3.50 per $100 over $350,000
  { min: 540000, max: 1000000, rate: 0.045, fixedFee: 10150 }, // $10,150 + $4.50 per $100 over $540,000
  { min: 1000000, max: Infinity, rate: 0.0575, fixedFee: 30850 } // $30,850 + $5.75 per $100 over $1,000,000
];

// QLD first home buyer concession brackets (contracts signed on or after 9 June 2024)
export const QLD_FIRST_HOME_CONCESSION_BRACKETS = [
  { min: 0, max: 709999.99, concession: 17350 },
  { min: 710000, max: 719999.99, concession: 15615 },
  { min: 720000, max: 729999.99, concession: 13880 },
  { min: 730000, max: 739999.99, concession: 12145 },
  { min: 740000, max: 749999.99, concession: 10410 },
  { min: 750000, max: 759999.99, concession: 8675 },
  { min: 760000, max: 769999.99, concession: 6940 },
  { min: 770000, max: 779999.99, concession: 5205 },
  { min: 780000, max: 789999.99, concession: 3470 },
  { min: 790000, max: 799999.99, concession: 1735 },
  { min: 800000, max: Infinity, concession: 0 } // $800,000 or more: Nil
];

export const QLD_FOREIGN_BUYER_RATE = 0.08;
export const QLD_STATE_AVERAGE = 650000;
export const QLD_FIRST_HOME_OWNERS_GRANT = 30000; // $30,000 for contracts signed between 20 Nov 2023 and 30 Jun 2026
export const QLD_FHOG_PROPERTY_CAP = 750000;
export const QLD_FHOG_LAND_CAP = 750000;

// QLD First Home Owners Grant Concession
export const QLD_FIRST_HOME_OWNERS_GRANT_CONCESSION = {
  AVAILABLE: true,
  DESCRIPTION: "Queensland First Home Owners Grant - $30,000 for new properties",
  REQUIREMENTS: "Must be owner-occupier, PPR, Australian resident, first home buyer, new property only",
  PROPERTY_PRICE_CAP: 750000,
  PROPERTY_TYPE_RESTRICTIONS: ['new'], // Only new properties
  AMOUNT: 30000
};

// QLD-specific concessions and requirements
export const QLD_FIRST_HOME_BUYER_CONCESSION = {
  REQUIREMENTS: {
    MUST_BE_PPR: true,
    MUST_BE_FIRST_HOME_BUYER: true,
    PROPERTY_TYPE: 'existing' // Only for existing properties
  },
  NEW_OFF_PLAN_EXEMPTION: true, // New/off-the-plan properties get full exemption
  DESCRIPTION: "First home buyer concessions available for PPR properties regardless of citizenship"
};

// QLD PPR requirements
export const QLD_PPR_REQUIREMENT = 'Must live for 6 months within 12 months of settlement';

// QLD vacant land concession
export const QLD_VACANT_LAND_CONCESSION = {
  AVAILABLE: true,
  DESCRIPTION: "If claimed, stamp duty is $0 with no price caps for Queensland vacant land purchases",
  REQUIREMENTS: "Must be land with build cost and claimVacantLandConcession must be true"
};

// QLD Home Concession
export const QLD_HOME_CONCESSION = {
  AVAILABLE: true,
  DESCRIPTION: "Home concession provides reduced stamp duty rates for owner-occupier PPR properties",
  REQUIREMENTS: "Must be owner-occupier with PPR, all property types, no price caps",
  PROPERTY_TYPE_RESTRICTIONS: ['all'],
  FOREIGN_BUYER_ELIGIBLE: true
};

// QLD First Home Concession
export const QLD_FIRST_HOME_CONCESSION = {
  AVAILABLE: true,
  DESCRIPTION: "First home concession provides additional stamp duty reduction for first home buyers on existing properties",
  REQUIREMENTS: "Must be owner-occupier with PPR, first home buyer, existing properties only, price cap $800k",
  PROPERTY_PRICE_CAP: 800000,
  PROPERTY_TYPE_RESTRICTIONS: ['existing'],
  FOREIGN_BUYER_ELIGIBLE: true,
  CALCULATION_METHOD: "Home concession rate minus first home concession amount"
};

// QLD First Home (New Concession)
export const QLD_FIRST_HOME_NEW_CONCESSION = {
  AVAILABLE: true,
  DESCRIPTION: "First home (new) concession provides full stamp duty exemption for first home buyers on new and off-the-plan properties",
  REQUIREMENTS: "Must be owner-occupier with PPR, first home buyer, new/off-the-plan/house-and-land properties only, no price caps",
  PROPERTY_TYPE_RESTRICTIONS: ['new', 'off-the-plan', 'house-and-land'],
  FOREIGN_BUYER_ELIGIBLE: true,
  CALCULATION_METHOD: "No Stamp - Full exemption"
};
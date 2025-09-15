// TAS-specific constants and rates
export const TAS_STAMP_DUTY_RATES = [
  { min: 0, max: 3000, rate: 0, fixedFee: 50 }, // $50 for properties up to $3,000
  { min: 3000, max: 25000, rate: 0.0175, fixedFee: 50 }, // $50 + $1.75 for every $100 over $3,000
  { min: 25000, max: 75000, rate: 0.0225, fixedFee: 435 }, // $435 + $2.25 for every $100 over $25,000
  { min: 75000, max: 200000, rate: 0.035, fixedFee: 1560 }, // $1,560 + $3.50 for every $100 over $75,000
  { min: 200000, max: 375000, rate: 0.04, fixedFee: 5935 }, // $5,935 + $4.00 for every $100 over $200,000
  { min: 375000, max: 725000, rate: 0.0425, fixedFee: 12935 }, // $12,935 + $4.25 for every $100 over $375,000
  { min: 725000, max: Infinity, rate: 0.045, fixedFee: 27810 } // $27,810 + $4.50 for every $100 over $725,000
];


export const TAS_FOREIGN_BUYER_RATE = 0.08; // 8% additional duty for foreign buyers
export const TAS_STATE_AVERAGE = 450000;
export const TAS_FIRST_HOME_OWNERS_GRANT = 10000; // $10,000 for eligible first home buyers
export const TAS_FHOG_PROPERTY_CAP = 999999999; // No price cap (effectively unlimited)

// TAS First Home Duty Relief (stamp duty concession)
export const TAS_FIRST_HOME_DUTY_RELIEF = {
  AVAILABLE: true,
  DESCRIPTION: "First Home Duty Relief - full stamp duty exemption for eligible first home buyers",
  REQUIREMENTS: {
    MUST_BE_OWNER_OCCUPIER: true,
    MUST_BE_PPR: true,
    MUST_BE_AUSTRALIAN_RESIDENT: true,
    MUST_BE_FIRST_HOME_BUYER: true,
    PROPERTY_TYPE: 'existing', // Only existing properties
    MAX_PRICE: 750000 // Up to $750,000
  },
  CONCESSION_TYPE: 'full_exemption', // No stamp duty payable
  PRICE_CAP: 750000
};

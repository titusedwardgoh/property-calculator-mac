// SA-specific constants and rates
export const SA_STAMP_DUTY_RATES = [
  { min: 0, max: 12000, rate: 0.01, fixedFee: 0 }, // $1.00 for every $100 = 1%
  { min: 12000, max: 30000, rate: 0.02, fixedFee: 120 }, // $120 + $2.00 for every $100 over $12,000
  { min: 30000, max: 50000, rate: 0.03, fixedFee: 480 }, // $480 + $3.00 for every $100 over $30,000
  { min: 50000, max: 100000, rate: 0.035, fixedFee: 1080 }, // $1,080 + $3.50 for every $100 over $50,000
  { min: 100000, max: 200000, rate: 0.04, fixedFee: 2830 }, // $2,830 + $4.00 for every $100 over $100,000
  { min: 200000, max: 250000, rate: 0.0425, fixedFee: 6830 }, // $6,830 + $4.25 for every $100 over $200,000
  { min: 250000, max: 300000, rate: 0.0475, fixedFee: 8955 }, // $8,955 + $4.75 for every $100 over $250,000
  { min: 300000, max: 500000, rate: 0.05, fixedFee: 11330 }, // $11,330 + $5.00 for every $100 over $300,000
  { min: 500000, max: Infinity, rate: 0.055, fixedFee: 21330 } // $21,330 + $5.50 for every $100 over $500,000
];

// SA first home buyer concession brackets (contracts signed on or after 15 June 2024)
export const SA_FIRST_HOME_CONCESSION_BRACKETS = [
  { min: 0, max: 650000, concession: 21000 }, // Full concession up to $650,000
  { min: 650000, max: 700000, concession: 15750 }, // $15,750 concession
  { min: 700000, max: 750000, concession: 10500 }, // $10,500 concession
  { min: 750000, max: 800000, concession: 5250 }, // $5,250 concession
  { min: 800000, max: Infinity, concession: 0 } // No concession for $800,000 or more
];

export const SA_FOREIGN_BUYER_RATE = 0.07; // 7% additional duty for foreign buyers
export const SA_STATE_AVERAGE = 600000;
export const SA_FIRST_HOME_OWNERS_GRANT = 15000; // $15,000 for eligible first home buyers
export const SA_FHOG_PROPERTY_CAP = 9999999999; 
export const SA_FHO_CONCESSION_PROPERTY_CAP = 9999999999; 

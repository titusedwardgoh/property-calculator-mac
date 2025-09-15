// WA-specific constants and rates
export const WA_STAMP_DUTY_RATES = [
  { min: 0, max: 120000, rate: 0.019, fixedFee: 0 }, // $1.90 per $100 = 1.9%
  { min: 120000, max: 150000, rate: 0.0285, fixedFee: 2280 }, // $2,280 + $2.85 per $100 over $120,000
  { min: 150000, max: 360000, rate: 0.038, fixedFee: 3135 }, // $3,135 + $3.80 per $100 over $150,000
  { min: 360000, max: 725000, rate: 0.0475, fixedFee: 11115 }, // $11,115 + $4.75 per $100 over $360,000
  { min: 725000, max: Infinity, rate: 0.0515, fixedFee: 28453 } // $28,453 + $5.15 per $100 over $725,000
];

// WA first home buyer concession brackets (contracts signed on or after 1 July 2024)
export const WA_FIRST_HOME_CONCESSION_BRACKETS = [
  { min: 0, max: 400000, concession: 100000 }, // Full concession up to $400,000
  { min: 400000, max: 450000, concession: 75000 }, // $75,000 concession
  { min: 450000, max: 500000, concession: 50000 }, // $50,000 concession
  { min: 500000, max: 550000, concession: 25000 }, // $25,000 concession
  { min: 550000, max: Infinity, concession: 0 } // No concession for $550,000 or more
];

export const WA_FOREIGN_BUYER_RATE = 0.07; // 7% additional duty for foreign buyers
export const WA_STATE_AVERAGE = 550000;
export const WA_FIRST_HOME_OWNERS_GRANT = 10000; // $10,000 for eligible first home buyers
export const WA_FHOG_PROPERTY_CAP_SOUTH = 750000; // $750k cap for South WA
export const WA_FHOG_PROPERTY_CAP_NORTH = 1000000; // $1M cap for North WA

// WA First Home Owner Concession caps
export const WA_FHO_CONCESSION_CAP_METRO = 700000; // $700k cap for Metro/Peel regions
export const WA_FHO_CONCESSION_CAP_NON_METRO = 750000; // $750k cap for Non-Metro regions
export const WA_FHO_CONCESSION_CAP_VACANT_LAND = 450000; // $450k cap for vacant land

// WA First Home Owner Concession rates
export const WA_FHO_CONCESSION_RATE_METRO = 13.63; // $13.63 per $100 for Metro/Peel regions
export const WA_FHO_CONCESSION_RATE_NON_METRO = 11.89; // $11.89 per $100 for Non-Metro regions
export const WA_FHO_CONCESSION_RATE_VACANT_LAND = 15.39; // $15.39 per $100 for vacant land

// WA First Home Owner Concession thresholds
export const WA_FHO_CONCESSION_THRESHOLD = 500000; // $500k threshold for general properties
export const WA_FHO_CONCESSION_THRESHOLD_VACANT_LAND = 350000; // $350k threshold for vacant land

// WA Off-The-Plan Concession (21 March 2025 - 30 June 2026)
export const WA_OFF_THE_PLAN_CONCESSION_CAP = 50000; // $50k cap for all scenarios

// Pre-Construction (construction not started)
export const WA_OFF_THE_PLAN_PRE_CONSTRUCTION_FULL_CONCESSION_THRESHOLD = 750000; // $750k threshold for 100% concession
export const WA_OFF_THE_PLAN_PRE_CONSTRUCTION_PARTIAL_CONCESSION_THRESHOLD = 850000; // $850k threshold for 50% concession
export const WA_OFF_THE_PLAN_PRE_CONSTRUCTION_REDUCTION_RATE = 0.0005; // 0.05% reduction per $100 over $750k
export const WA_OFF_THE_PLAN_PRE_CONSTRUCTION_PARTIAL_CONCESSION_RATE = 0.5; // 50% concession for $850k+

// Under Construction (construction started)
export const WA_OFF_THE_PLAN_UNDER_CONSTRUCTION_FULL_CONCESSION_THRESHOLD = 750000; // $750k threshold for 75% concession
export const WA_OFF_THE_PLAN_UNDER_CONSTRUCTION_PARTIAL_CONCESSION_THRESHOLD = 850000; // $850k threshold for 37.5% concession
export const WA_OFF_THE_PLAN_UNDER_CONSTRUCTION_REDUCTION_RATE = 0.000375; // 0.0375% reduction per $100 over $750k
export const WA_OFF_THE_PLAN_UNDER_CONSTRUCTION_PARTIAL_CONCESSION_RATE = 0.375; // 37.5% concession for $850k+
export const WA_OFF_THE_PLAN_UNDER_CONSTRUCTION_FULL_CONCESSION_RATE = 0.75; // 75% concession for $750k and under


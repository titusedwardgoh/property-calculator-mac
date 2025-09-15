// NT-specific constants and rates
// NT uses a formula-based calculation for properties up to $525,000: (0.06571441 x V²) + 15V where V = 1/1000 of property value
// For properties over $525,000, standard percentage rates apply
export const NT_STAMP_DUTY_FORMULA = {
  COEFFICIENT: 0.06571441, // Coefficient for V² term
  LINEAR_TERM: 15, // Coefficient for V term
  V_DIVISOR: 1000, // Divisor to convert property value to V
  MAX_FORMULA_VALUE: 525000 // Maximum value for formula calculation
};

// NT stamp duty rates - formula for properties up to $525,000, then percentage rates
export const NT_STAMP_DUTY_RATES = [
  { min: 0, max: 525000, rate: 'formula', description: 'Formula-based calculation: (0.06571441 × V²) + 15V' },
  { min: 525000, max: 3000000, rate: 0.0495, fixedFee: 0, description: '4.95% of dutiable value' },
  { min: 3000000, max: 5000000, rate: 0.0575, fixedFee: 0, description: '5.75% of dutiable value' },
  { min: 5000000, max: Infinity, rate: 0.0595, fixedFee: 0, description: '5.95% of dutiable value' }
];

export const NT_FOREIGN_BUYER_RATE = 0.00; // 7% additional duty for foreign buyers
export const NT_STATE_AVERAGE = 500000;
// NT HomeGrown Territory Grant (First Home Owners Grant)
export const NT_HOMEGROWN_TERRITORY_GRANT = {
  NEW: 50000, // $50,000 for new properties
  OFF_THE_PLAN: 50000, // $50,000 for off-the-plan properties
  HOUSE_AND_LAND: 50000, // $50,000 for house-and-land packages
  EXISTING: 10000, // $10,000 for existing properties
  VACANT_LAND: 0 // Not eligible
};
export const NT_HOMEGROWN_GRANT_PROPERTY_CAP = 999999999; // No price cap (effectively unlimited)

// NT FreshStart Grant
export const NT_FRESHSTART_GRANT = {
  AMOUNT: 30000, // $30,000 for eligible properties
  ELIGIBLE_PROPERTY_TYPES: ['off-the-plan', 'house-and-land'], // Only off-the-plan and house-and-land
  DESCRIPTION: "FreshStart Grant - $30,000 for off-the-plan and house-and-land packages"
};

// NT House and Land Concession
export const NT_HOUSE_AND_LAND_CONCESSION = {
  ELIGIBLE_PROPERTY_TYPES: ['house-and-land'], // Only house-and-land packages
  DESCRIPTION: "House and Land Concession - Full stamp duty relief for house-and-land packages"
};


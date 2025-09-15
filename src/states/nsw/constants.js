// NSW-specific constants and rates

export const NSW_STAMP_DUTY_RATES = [
  { min: 0, max: 17000, rate: 0.0125, fixedFee: 20 },
  { min: 17000, max: 37000, rate: 0.015, fixedFee: 212 },
  { min: 37000, max: 99000, rate: 0.0175, fixedFee: 512 },
  { min: 99000, max: 372000, rate: 0.035, fixedFee: 1597 },
  { min: 372000, max: 1240000, rate: 0.045, fixedFee: 11152 },
  { min: 1240000, max: Infinity, rate: 0.055, fixedFee: 50212 }
];

export const NSW_FOREIGN_BUYER_RATE = 0.09;

export const NSW_STATE_AVERAGE = 1200000;

export const NSW_FIRST_HOME_OWNERS_GRANT = 10000;

// NSW First Home Buyer Concessions
export const NSW_FHOG_PROPERTY_CAP = 600000; // For non-land properties
export const NSW_FHOG_LAND_CAP = 750000; // For land properties (including build cost)

// NSW Land-specific concessional rates for properties between $350k and $450k
export const NSW_LAND_CONCESSIONAL_RATES = {
  350000: 0.0000, 350001: 0.0001, 355000: 0.0020, 360000: 0.0039, 365000: 0.0057,
  370000: 0.0075, 375000: 0.0093, 380000: 0.0112, 385000: 0.0130, 390000: 0.0147,
  395000: 0.0164, 400000: 0.0181, 405000: 0.0197, 410000: 0.0212, 415000: 0.0228,
  420000: 0.0243, 425000: 0.0257, 430000: 0.0272, 435000: 0.0286, 440000: 0.0299,
  445000: 0.0313, 450000: 0.0326
};

// NSW Concessional rates for properties between $800k and $1M
export const NSW_CONCESSIONAL_RATES = {
  805000: 0.001224, 810000: 0.002433, 815000: 0.003627, 820000: 0.004806, 825000: 0.005972,
  830000: 0.007123, 835000: 0.008260, 840000: 0.009384, 845000: 0.010494, 850000: 0.011592,
  855000: 0.012676, 860000: 0.013748, 865000: 0.014808, 870000: 0.015855, 875000: 0.016891,
  880000: 0.017915, 885000: 0.018927, 890000: 0.019927, 895000: 0.020917, 900000: 0.021896,
  905000: 0.022863, 910000: 0.023820, 915000: 0.024767, 920000: 0.025703, 925000: 0.026630,
  930000: 0.027546, 935000: 0.028453, 940000: 0.029349, 945000: 0.030240, 950000: 0.031115,
  955000: 0.031984, 960000: 0.032843, 965000: 0.033694, 970000: 0.034536, 975000: 0.035370,
  980000: 0.036195, 985000: 0.037011, 990000: 0.037820, 995000: 0.038620, 999999: 0.039412
};

// NSW PPR Requirements
export const NSW_PPR_REQUIREMENT = 'Must live for 6 months within 12 months of settlement';

// NSW Land Transfer Fee
export const NSW_LAND_TRANSFER_FEE = 155; // Standard transfer fee ~$155 incl. GST

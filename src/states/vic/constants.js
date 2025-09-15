// VIC-specific constants and rates
export const VIC_STAMP_DUTY_RATES = [
  { min: 0, max: 25000, rate: 0.014, fixedFee: 0 },
  { min: 25000, max: 130000, rate: 0.024, fixedFee: 350 },
  { min: 130000, max: 960000, rate: 0.06, fixedFee: 2870 },
  { min: 960000, max: 2000000, rate: 0.055, fixedFee: 0 },
  { min: 2000000, max: Infinity, rate: 0.065, fixedFee: 110000 }
];

export const VIC_FOREIGN_BUYER_RATE = 0.08;

export const VIC_FHB_CONCESSIONAL_RATES = {
  600000: 0.000000, 600005: 0.000002, 605000: 0.001727, 610000: 0.003461, 615000: 0.005198,
  620000: 0.006939, 625000: 0.008685, 630000: 0.010435, 635000: 0.012187, 640000: 0.013945,
  645000: 0.015707, 650000: 0.017471, 655000: 0.019240, 660000: 0.021012, 665000: 0.022786,
  670000: 0.024566, 675000: 0.026348, 680000: 0.028132, 685000: 0.029921, 690000: 0.031713,
  695000: 0.033506, 700000: 0.035304, 705000: 0.037105, 710000: 0.038907, 715000: 0.040713,
  720000: 0.042522, 725000: 0.044332, 730000: 0.046147, 735000: 0.047963, 740000: 0.049781,
  745000: 0.051603, 749999: 0.053425, 750000: 0.053427
};

// VIC PPR Concessional Rates for Principal Place of Residence
export const VIC_PPR_CONCESSIONAL_RATES = [
  { min: 130000, max: 440000, rate: 0.05, fixedFee: 2870},
  { min: 440000, max: 550000, rate: 0.06, fixedFee: 18370}
];

export const VIC_STATE_AVERAGE = 900000;
export const VIC_FIRST_HOME_OWNERS_GRANT = 10000;
export const VIC_FHOG_PROPERTY_CAP = 750000;
export const VIC_FHOG_LAND_CAP = 750000;

// VIC-specific concessions and requirements
export const VIC_FIRST_HOME_BUYER_CONCESSION = {
  EXEMPTION_THRESHOLD: 600000,
  PARTIAL_CONCESSION_THRESHOLD: 750000,
  REQUIREMENTS: {
    MUST_BE_PPR: true,
    MUST_BE_FIRST_HOME_BUYER: true
  }
};

// VIC PPR requirements
export const VIC_PPR_REQUIREMENT = 'Must live for 12 months within 12 months of settlement';

// VIC Pensioner Duty Concession
export const VIC_PENSIONER_CONCESSIONS = {
  AVAILABLE: true,
  DESCRIPTION: "Pensioner duty concession available for eligible pensioners in VIC",
  REQUIREMENTS: "Must be owner-occupier with PPR, can be foreign buyer or first home buyer, all property types except vacant land",
  PROPERTY_PRICE_CAP: 750000,
  FULL_CONCESSION_THRESHOLD: 600000,
  PARTIAL_CONCESSION_THRESHOLD: 750000,
  PROPERTY_TYPE_RESTRICTIONS: ['all-except-vacant-land']
};

// VIC Temp Off-The-Plan Concession
export const VIC_TEMP_OFF_THE_PLAN_CONCESSION = {
  AVAILABLE: true,
  DESCRIPTION: "Temporary off-the-plan concession available for eligible buyers in VIC",
  REQUIREMENTS: "Must be off-the-plan property with apartment or townhouse category",
  PROPERTY_PRICE_CAP: 999999999,
  PROPERTY_TYPE_RESTRICTIONS: ['off-the-plan'],
  PROPERTY_CATEGORY_RESTRICTIONS: ['apartment', 'townhouse']
};

// VIC-specific fees
export const VIC_LAND_TRANSFER_FEE_UNIT = 16.81;
export const VIC_STANDARD_TRANSFER_FEE_UNITS = 7; // Average for standard transfer

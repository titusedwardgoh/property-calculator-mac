# Concession Implementation Guide

This guide outlines the rules, patterns, and implementation steps for adding new state-specific concessions to the Real Estate Dashboard.

## Table of Contents
1. [File Structure Overview](#file-structure-overview)
2. [Concession Function Pattern](#concession-function-pattern)
3. [Integration Steps](#integration-steps)
4. [UI Display Logic](#ui-display-logic)
5. [Priority and Conflict Resolution](#priority-and-conflict-resolution)
6. [Common Patterns](#common-patterns)

## File Structure Overview

### Core Files That Need Updates:
- `src/states/[state]/calculations.js` - Main calculation logic
- `src/states/[state]/constants.js` - Concession constants and rates
- `src/states/useStateSelector.js` - Function imports and exposure
- `src/components/UpfrontCosts.js` - UI display (requires state-specific handling)

### Data Flow:
```
Form Data → useStateSelector → State Functions → Calculations → UI Display
```

## Concession Function Pattern

### Standard Function Signature:
```javascript
export const calculate[STATE][CONCESSION_NAME]Concession = (buyerData, propertyData, selectedState, stampDutyAmount) => {
  // Returns: { eligible: boolean, concessionAmount: number, reason: string, details: object }
}
```

### Required Return Object Structure:
```javascript
{
  eligible: true/false,
  concessionAmount: number,
  reason: "Human readable explanation",
  details: {
    propertyPrice: number,
    baseStampDuty: number,
    concessionalStampDuty: number,
    concessionAmount: number,
    netStampDuty: number,
    // Additional concession-specific details
  }
}
```

## Integration Steps

### 1. Add Constants (constants.js)
```javascript
// [STATE] [CONCESSION_NAME] Concession
export const [STATE]_[CONCESSION_NAME]_CONCESSION = {
  AVAILABLE: true,
  DESCRIPTION: "Description of concession",
  REQUIREMENTS: "Eligibility requirements",
  PROPERTY_PRICE_CAP: number,
  PROPERTY_TYPE_RESTRICTIONS: ['property-type'],
  FULL_CONCESSION_THRESHOLD: number,
  PARTIAL_CONCESSION_THRESHOLD: number
};

// Concessional rates if needed
export const [STATE]_[CONCESSION_NAME]_CONCESSIONAL_RATES = {
  price1: rate1,
  price2: rate2
};
```

### 2. Create Calculation Function (calculations.js)
- Import constants at top of file
- Add function following standard pattern
- Include all eligibility checks
- Implement calculation logic
- Handle special cases (off-the-plan, house-and-land)

### 3. Update calculateUpfrontCosts Function (calculations.js)
- Add new concession calculation
- Update concession priority logic
- Include in `allConcessions` object for UI display
- **CRITICAL**: Add ineligible concessions to `ineligibleConcessions` array when not eligible

### 4. Update useStateSelector.js
- Add import: `calculate[STATE][CONCESSION_NAME]Concession`
- Add to stateFunctions object: `calculate[STATE][CONCESSION_NAME]Concession: selectedState === '[STATE]' ? calculate[STATE][CONCESSION_NAME]Concession : null`

### 5. Update UpfrontCosts.js (UI Component)
- Add state-specific handling in the ineligible concessions section
- Update `hasActualItems` logic to include new state
- Add concession display logic for the new state

## UI Display Logic

### Automatic Display Features:
- Concessions appear in dropdown when eligible
- Ineligible concessions show in "State Grants and Concessions" section
- Tooltips explain eligibility reasons
- Special handling for $0 concessions with explanations

### UI Integration Points:
- `upfrontCosts.concessions` - Array of eligible concessions
- `upfrontCosts.ineligibleConcessions` - Array of ineligible concessions (with reasons)
- `upfrontCosts.allConcessions` - Object with all concession results
- Tooltip system for explaining $0 concessions
- Color coding (green for savings, red for ineligible)

### UI State-Specific Requirements:
- Each state needs specific handling in `UpfrontCosts.js`
- Must update `hasActualItems` logic to include new state
- Must add concession display logic in the ineligible section
- Follow existing patterns for VIC/NSW/QLD

### UI Label Handling:
- **Main concessions display**: Update concession type mapping in main concessions section
- **Ineligible concessions display**: Update concession type mapping in ineligible section
- **Clean labels**: Use simple names like "Home Concession" instead of "Stamp Duty Concession (Home Concession)"
- **Consistent naming**: Ensure both main and ineligible sections use same label logic

## Priority and Conflict Resolution

### Current VIC Concession Priority:
1. **First Home Buyer + Pensioner** - Show both, apply first home buyer
2. **First Home Buyer Only** - Apply first home buyer
3. **Pensioner Only** - Apply pensioner
4. **PPR Only** - Apply PPR
5. **None** - No concessions

### Current QLD Concession Priority:
1. **First Home Concession** - Takes priority over Home Concession
2. **Home Concession** - Applied if First Home Concession not eligible
3. **None** - No concessions

### Adding New Concessions:
- Determine priority order
- Update `calculateUpfrontCosts` logic
- Handle multiple eligible scenarios
- Ensure only one concession is applied (unless showing both)
- **CRITICAL**: Always add ineligible concessions to `ineligibleConcessions` array
- **CRITICAL**: When higher priority concession is applied, add lower priority eligible concessions to ineligible array with reason "X takes priority"

## Common Patterns

### Critical: Ineligible Concessions Pattern
**ALWAYS** add ineligible concessions to the `ineligibleConcessions` array in `calculateUpfrontCosts`:

```javascript
if (concession.eligible) {
  appliedConcession = {
    type: 'Concession Name',
    amount: concession.concessionAmount,
    eligible: true,
    reason: concession.reason,
    // ... other properties
  };
} else {
  // CRITICAL: Add to ineligible concessions
  ineligibleConcessions.push({
    type: 'Concession Name',
    amount: 0,
    eligible: false,
    reason: concession.reason,
    // ... other properties
  });
}
```

This ensures ineligible concessions appear in the UI with proper explanations.

### Priority Handling Pattern:
When implementing priority logic, handle both eligible and ineligible cases:

```javascript
// Priority: Higher Concession > Lower Concession
if (higherConcession.eligible) {
  appliedConcession = {
    type: 'Higher Concession',
    amount: higherConcession.concessionAmount,
    eligible: true,
    reason: higherConcession.reason,
    // ... other properties
  };
  
  // Add lower concession to ineligible if it was also eligible
  if (lowerConcession.eligible) {
    ineligibleConcessions.push({
      type: 'Lower Concession',
      amount: lowerConcession.concessionAmount,
      eligible: false,
      reason: 'Higher Concession takes priority',
      // ... other properties
    });
  }
} else if (lowerConcession.eligible) {
  appliedConcession = {
    type: 'Lower Concession',
    amount: lowerConcession.concessionAmount,
    eligible: true,
    reason: lowerConcession.reason,
    // ... other properties
  };
}

// Always add ineligible concessions
if (!higherConcession.eligible) {
  ineligibleConcessions.push({
    type: 'Higher Concession',
    amount: 0,
    eligible: false,
    reason: higherConcession.reason,
    // ... other properties
  });
}
```

### Eligibility Checks (Standard Order):
1. State validation (`selectedState !== '[STATE]'`)
2. Buyer type (`buyerType !== 'owner-occupier'`)
3. PPR requirement (`isPPR !== 'yes'`)
4. Residency status (`isAustralianResident !== 'yes'`)
5. First home buyer status (`isFirstHomeBuyer !== 'yes'`)
6. Property type restrictions
7. Property category restrictions
8. Price validation (`price <= 0`)
9. Price cap checks

### Calculation Patterns:

#### Full Concession:
```javascript
if (price <= FULL_THRESHOLD) {
  concessionAmount = stampDutyAmount;
  concessionalStampDuty = 0;
}
```

#### Partial Concession (with rates):
```javascript
else if (price <= PARTIAL_THRESHOLD) {
  // Use interpolation with concessional rates
  const sortedRates = Object.entries(CONCESSIONAL_RATES).sort(([a], [b]) => parseInt(a) - parseInt(b));
  // Interpolation logic...
  concessionalStampDuty = price * applicableRate;
  concessionAmount = Math.max(0, stampDutyAmount - concessionalStampDuty);
}
```

#### Concessional Rate Calculation (Alternative Pattern):
```javascript
// Calculate stamp duty using concessional rates directly
let concessionalStampDuty = 0;
for (const bracket of CONCESSIONAL_RATES) {
  if (price > bracket.min && price <= bracket.max) {
    concessionalStampDuty = (price - bracket.min) * bracket.rate + bracket.fixedFee;
    break;
  }
}
const concessionAmount = Math.max(0, stampDutyAmount - concessionalStampDuty);
```

#### Layered Concession Calculation (QLD First Home Pattern):
```javascript
// Step 1: Calculate base concession (e.g., Home Concession)
let baseConcessionalStampDuty = 0;
for (const bracket of BASE_CONCESSIONAL_RATES) {
  if (price > bracket.min && price <= bracket.max) {
    baseConcessionalStampDuty = (price - bracket.min) * bracket.rate + bracket.fixedFee;
    break;
  }
}

// Step 2: Find additional concession amount from brackets
let additionalConcessionAmount = 0;
for (const bracket of ADDITIONAL_CONCESSION_BRACKETS) {
  if (price >= bracket.min && price <= bracket.max) {
    additionalConcessionAmount = bracket.concession;
    break;
  }
}

// Step 3: Calculate additional concession (min to avoid negative duty)
const additionalConcession = Math.min(additionalConcessionAmount, baseConcessionalStampDuty);

// Step 4: Calculate total concession
const netDutyAfterConcessions = Math.max(0, baseConcessionalStampDuty - additionalConcession);
const totalConcessionAmount = Math.max(0, stampDutyAmount - netDutyAfterConcessions);
```

#### Special Cases:
```javascript
// Off-the-plan properties
if (propertyType === 'off-the-plan' || propertyType === 'house-and-land') {
  return {
    eligible: true,
    concessionAmount: 0,
    reason: 'Eligible but additional seller information required',
    details: { /* ... */ }
  };
}
```

### Property Type Handling:
- `'new'` - Newly built properties
- `'off-the-plan'` - Off-the-plan purchases
- `'house-and-land'` - House and land packages
- `'existing'` - Existing properties
- `'vacant-land-only'` - Vacant land

### Buyer Data Fields:
- `buyerType` - 'owner-occupier' or 'investor'
- `isPPR` - 'yes' or 'no'
- `isAustralianResident` - 'yes' or 'no'
- `isFirstHomeBuyer` - 'yes' or 'no'
- `hasPensionCard` - 'yes' or 'no'

### Property Data Fields:
- `propertyPrice` - String or number
- `propertyType` - Property type string
- `propertyCategory` - 'land' or 'non-land'

## Testing Checklist

### Test Scenarios:
- [ ] Property price below threshold (full concession)
- [ ] Property price between thresholds (partial concession)
- [ ] Property price above threshold (no concession)
- [ ] Invalid buyer type (not eligible)
- [ ] Invalid property type (not eligible)
- [ ] Off-the-plan properties (special case)
- [ ] Multiple eligible concessions (priority logic)
- [ ] Edge cases (exact threshold amounts)

### UI Verification:
- [ ] Concession appears in dropdown when eligible
- [ ] Ineligible concession shows in bottom section
- [ ] Tooltips work correctly
- [ ] $0 concessions have proper explanations
- [ ] Color coding is correct
- [ ] State-specific UI handling added to UpfrontCosts.js
- [ ] hasActualItems logic updated for new state

## Example Implementation

### For VICTempOffThePlanConcession:

1. **Constants**: Add to `vic/constants.js`
2. **Function**: Create `calculateVICTempOffThePlanConcession` in `vic/calculations.js`
3. **Integration**: Update `calculateUpfrontCosts` in `vic/calculations.js`
4. **Exposure**: Add to `useStateSelector.js`
5. **UI**: Add state-specific handling to `UpfrontCosts.js` (if new state)
6. **Testing**: Verify with off-the-plan properties

### For QLDHomeConcession:

1. **Constants**: Add to `qld/constants.js`
2. **Function**: Create `calculateQLDHomeConcession` in `qld/calculations.js`
3. **Integration**: Update `calculateUpfrontCosts` in `qld/calculations.js`
4. **Exposure**: Add to `useStateSelector.js`
5. **UI**: Add QLD-specific handling to `UpfrontCosts.js`
6. **Testing**: Verify with owner-occupier PPR properties

### For QLDFirstHomeConcession:

1. **Constants**: Add to `qld/constants.js` (uses existing brackets)
2. **Function**: Create `calculateQLDFirstHomeConcession` in `qld/calculations.js`
3. **Integration**: Update `calculateUpfrontCosts` with priority logic (First Home > Home)
4. **Exposure**: Add to `useStateSelector.js`
5. **UI**: Add First Home Concession to QLD-specific handling in `UpfrontCosts.js`
6. **Testing**: Verify with first home buyer + existing properties

**Note**: The UI requires state-specific handling in `UpfrontCosts.js` for proper display of ineligible concessions.

---

*This guide should be referenced when implementing any new state-specific concessions to ensure consistency and proper integration.*

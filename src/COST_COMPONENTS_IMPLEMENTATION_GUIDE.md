# Cost Components Implementation Guide

## Overview
This guide explains how to add new items to the UpfrontCosts and OngoingCosts components using the centralized form store state management pattern.

## Architecture

### Form Store State Management
The cost components use centralized state management through `formStore.js` to avoid `useEffect` conflicts and infinite loops.

### Key Components
- **UpfrontCosts.js** - Displays one-time costs (deposits, fees, stamp duty)
- **OngoingCosts.js** - Displays recurring costs (loan repayments, insurance)
- **formStore.js** - Centralized state management

## Adding New Items to UpfrontCosts

### Step 1: Add State to Form Store

In `src/stores/formStore.js`, add new state variables:

```javascript
// Add to initial state
newItemName: '', // e.g., 'inspectionFee', 'legalFees', etc.

// Add to resetFormData function
newItemName: '',
```

### Step 2: Update Display Logic

In `src/stores/formStore.js`, modify the `getUpfrontCostsDisplay()` function:

```javascript
getUpfrontCostsDisplay: () => {
  const state = get()
  return {
    showDeposit: state.loanDetailsComplete && state.needsLoan === 'yes',
    showBankFees: state.loanDetailsComplete && state.needsLoan === 'yes',
    showNewItem: state.someCondition && state.anotherCondition, // Add your conditions
    canShowDropdown: state.propertyDetailsFormComplete,
    isDropdownOpen: state.openDropdown === 'upfront'
  }
}
```

### Step 3: Update Calculation Logic

In `src/components/UpfrontCosts.js`, modify the `calculateAllUpfrontCosts()` function:

```javascript
const calculateAllUpfrontCosts = () => {
  // ... existing code ...
  
  // Add new item calculation
  const newItemAmount = displayState.showNewItem ? (parseInt(formData.newItemName) || 0) : 0;
  
  // Add to total calculation
  const totalUpfrontCosts = baseTotal + depositAmount + settlementFee + establishmentFee + newItemAmount;
  
  return {
    // ... existing properties ...
    newItemAmount,
    totalUpfrontCosts
  };
};
```

### Step 4: Add Display in Component

In `src/components/UpfrontCosts.js`, add the new item to the dropdown:

```javascript
{/* New Item */}
{displayState.showNewItem && (
  <div className="flex justify-between items-center">
    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">New Item Name</span>
    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
      {formatCurrency(parseInt(formData.newItemName) || 0)}
    </span>
  </div>
)}
```

## Adding New Items to OngoingCosts

### Step 1: Add State to Form Store

In `src/stores/formStore.js`, add new state variables:

```javascript
// Add to initial state
newOngoingItem: '', // e.g., 'monthlyInsurance', 'strataFees', etc.

// Add to resetFormData function
newOngoingItem: '',
```

### Step 2: Update Display Logic

In `src/stores/formStore.js`, add a new function for ongoing costs:

```javascript
// Ongoing costs display logic
getOngoingCostsDisplay: () => {
  const state = get()
  return {
    showNewOngoingItem: state.someCondition && state.anotherCondition, // Add your conditions
    canShowDropdown: state.propertyDetailsFormComplete && 
                    (state.loanDetailsComplete || state.sellerQuestionsComplete),
    isDropdownOpen: state.openDropdown === 'ongoing'
  }
}
```

### Step 3: Update Calculation Logic

In `src/components/OngoingCosts.js`, modify the calculation function:

```javascript
const calculateOngoingCosts = () => {
  // ... existing code ...
  
  // Add new ongoing item calculation
  const newOngoingItemAmount = displayState.showNewOngoingItem ? (parseInt(formData.newOngoingItem) || 0) : 0;
  
  // Add to total calculation
  const totalOngoingCosts = baseTotal + newOngoingItemAmount;
  
  return {
    // ... existing properties ...
    newOngoingItemAmount,
    totalOngoingCosts
  };
};
```

### Step 4: Add Display in Component

In `src/components/OngoingCosts.js`, add the new item to the dropdown:

```javascript
{/* New Ongoing Item */}
{displayState.showNewOngoingItem && (
  <div className="flex justify-between items-center">
    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">New Ongoing Item Name</span>
    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
      {formatCurrency(parseInt(formData.newOngoingItem) || 0)}
    </span>
  </div>
)}
```

## Conditional Display Patterns

### Common Conditions

```javascript
// Show when loan is needed and completed
showItem: state.loanDetailsComplete && state.needsLoan === 'yes'

// Show when property details are complete
showItem: state.propertyDetailsFormComplete

// Show when buyer details are complete
showItem: state.buyerDetailsComplete

// Show when seller questions are complete
showItem: state.sellerQuestionsComplete

// Show when specific form field has value
showItem: state.someField && state.someField !== ''

// Show when multiple conditions are met
showItem: state.condition1 && state.condition2 && state.condition3
```

### State-Specific Conditions

```javascript
// Show only for specific states
showItem: state.selectedState === 'NSW' && state.someCondition

// Show based on property type
showItem: state.propertyType === 'apartment' && state.someCondition

// Show based on property price range
showItem: parseInt(state.propertyPrice) > 500000 && state.someCondition
```

## Navigation and Dropdown Management

### Automatic Dropdown Closing

Both components automatically close when navigating between form sections:

```javascript
// In both UpfrontCosts.js and OngoingCosts.js
useEffect(() => {
  if (formData.openDropdown === 'upfront' || formData.openDropdown === 'ongoing') {
    formData.updateFormData('openDropdown', null);
  }
}, [
  formData.propertyDetailsCurrentStep,
  formData.buyerDetailsCurrentStep, 
  formData.loanDetailsCurrentStep,
  formData.sellerQuestionsActiveStep
]);
```

### Mutual Exclusivity

Only one dropdown can be open at a time:

```javascript
// In formStore.js
toggleUpfrontDropdown: () => {
  const state = get()
  if (state.openDropdown === 'upfront') {
    set({ openDropdown: null })
  } else {
    set({ openDropdown: 'upfront' })
  }
}

toggleOngoingDropdown: () => {
  const state = get()
  if (state.openDropdown === 'ongoing') {
    set({ openDropdown: null })
  } else {
    set({ openDropdown: 'ongoing' })
  }
}
```

## Best Practices

### 1. State Management
- Always add new state to both initial state and `resetFormData` function
- Use descriptive variable names
- Group related state variables together

### 2. Display Logic
- Keep all display logic in form store functions
- Use computed properties for complex conditions
- Avoid inline conditionals in components

### 3. Calculations
- Always include new items in total calculations
- Handle empty/undefined values with `|| 0`
- Use consistent formatting with `formatCurrency`

### 4. Component Structure
- Keep components focused on rendering
- Move business logic to form store
- Use consistent styling classes

### 5. Testing
- Test with different form completion states
- Test navigation between sections
- Test dropdown open/close functionality
- Test mutual exclusivity between dropdowns

## Common Pitfalls to Avoid

### 1. Infinite Loops
- Don't call `updateFormData` in `useEffect` that depends on `formData`
- Use separate `useEffect` for navigation changes
- Keep state updates simple and predictable

### 2. State Synchronization
- Don't use local state for dropdown management
- Always use form store for shared state
- Keep state updates atomic

### 3. Conditional Rendering
- Don't duplicate conditions across components
- Use form store functions for display logic
- Keep conditions simple and readable

### 4. Calculation Errors
- Always handle undefined/null values
- Include all items in totals
- Use consistent number parsing

## Example: Adding Inspection Fees

Here's a complete example of adding inspection fees to UpfrontCosts:

### 1. Form Store (`formStore.js`)

```javascript
// Add to initial state
inspectionFee: '',

// Add to resetFormData
inspectionFee: '',

// Update getUpfrontCostsDisplay
getUpfrontCostsDisplay: () => {
  const state = get()
  return {
    showDeposit: state.loanDetailsComplete && state.needsLoan === 'yes',
    showBankFees: state.loanDetailsComplete && state.needsLoan === 'yes',
    showInspectionFee: state.propertyDetailsFormComplete, // Always show when property complete
    canShowDropdown: state.propertyDetailsFormComplete,
    isDropdownOpen: state.openDropdown === 'upfront'
  }
}
```

### 2. UpfrontCosts Component

```javascript
// Update calculateAllUpfrontCosts
const inspectionFeeAmount = displayState.showInspectionFee ? (parseInt(formData.inspectionFee) || 0) : 0;

// Add to total
const totalUpfrontCosts = baseTotal + depositAmount + settlementFee + establishmentFee + inspectionFeeAmount;

// Add to return object
return {
  // ... existing properties ...
  inspectionFeeAmount,
  totalUpfrontCosts
};

// Add to dropdown display
{/* Inspection Fee */}
{displayState.showInspectionFee && (
  <div className="flex justify-between items-center">
    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg">Inspection Fee</span>
    <span className="text-gray-800 text-sm md:text-xs lg:text-sm xl:text-lg font-medium">
      {formatCurrency(parseInt(formData.inspectionFee) || 0)}
    </span>
  </div>
)}
```

This pattern ensures clean, maintainable code that follows the established architecture and avoids common pitfalls.

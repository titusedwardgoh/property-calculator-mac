import { useFormStore } from '@/stores/formStore';
import { buildResultsSummary } from './buildResultsSummary';

export const MIN_LOAN_DEPOSIT_PERCENT = 0.05;

export function getMinimumLoanDeposit(propertyPrice) {
    const price = parseInt(propertyPrice, 10) || 0;
    if (price <= 0) return 0;
    return Math.ceil(price * MIN_LOAN_DEPOSIT_PERCENT);
}

export function canReduceDepositForShortfall(formData) {
    if (formData.needsLoan !== 'yes') return false;
    const currentDeposit = parseInt(formData.loanDeposit, 10) || 0;
    const minDeposit = getMinimumLoanDeposit(formData.propertyPrice);
    return currentDeposit > minDeposit;
}

const DEPOSIT_DERIVED_FIELDS = [
    'loanDeposit',
    'LVR',
    'loanLMI',
    'LMI_COST',
    'LMI_STAMP_DUTY',
    'MONTHLY_LOAN_REPAYMENT',
    'ANNUAL_LOAN_REPAYMENT',
];

function snapshotDepositFields(state) {
    const snapshot = {};
    DEPOSIT_DERIVED_FIELDS.forEach((key) => {
        snapshot[key] = state[key];
    });
    return snapshot;
}

function restoreDepositFields(snapshot) {
    useFormStore.setState(snapshot);
    const state = useFormStore.getState();
    state.updateLMI?.();
    state.updateLoanRepayments?.();
}

/** Apply deposit + derived loan fields using the same rules as Loan Details. */
export function applyDepositToForm(depositAmount) {
    const propertyPrice = parseInt(useFormStore.getState().propertyPrice, 10) || 0;
    const minDeposit = getMinimumLoanDeposit(propertyPrice);
    const deposit = Math.max(minDeposit, Math.round(depositAmount));
    useFormStore.setState({ loanDeposit: String(deposit) });

    const state = useFormStore.getState();
    state.updateLVR?.();
    const loanLMI = state.LVR >= 0.8 ? 'yes' : 'no';
    useFormStore.setState({ loanLMI });
    state.updateLMI?.();
    state.updateLoanRepayments?.();
    state.updateOngoingCosts?.();

    return deposit;
}

function shortfallForDeposit(depositAmount, stateFunctions) {
    const backup = snapshotDepositFields(useFormStore.getState());

    try {
        applyDepositToForm(depositAmount);
        const summary = buildResultsSummary(useFormStore.getState(), stateFunctions);
        return {
            shortfall: summary.buyerSavingsShortfall,
            totalPurchaseCost: summary.totalPurchaseCost,
        };
    } finally {
        restoreDepositFields(backup);
    }
}

/**
 * Search lower deposit values to minimize savings shortfall.
 * Only reduces deposit (never increases). Uses the real calc pipeline incl. LMI bands.
 */
export function findBestDepositForShortfall(formData, stateFunctions) {
    if (formData.needsLoan !== 'yes') return null;

    const currentDeposit = parseInt(formData.loanDeposit, 10) || 0;
    const minDeposit = getMinimumLoanDeposit(formData.propertyPrice);
    const currentShortfall = buildResultsSummary(formData, stateFunctions).buyerSavingsShortfall;

    if (currentShortfall <= 0 || currentDeposit <= minDeposit) return null;

    let best = { deposit: currentDeposit, shortfall: currentShortfall };

    const evaluateRange = (min, max, step) => {
        for (let deposit = min; deposit <= max; deposit += step) {
            const { shortfall } = shortfallForDeposit(deposit, stateFunctions);
            if (shortfall < best.shortfall) {
                best = { deposit, shortfall };
            }
        }
    };

    evaluateRange(minDeposit, currentDeposit, 1000);
    evaluateRange(
        Math.max(minDeposit, best.deposit - 2000),
        Math.min(currentDeposit, best.deposit + 2000),
        250
    );
    evaluateRange(
        Math.max(minDeposit, best.deposit - 500),
        Math.min(currentDeposit, best.deposit + 500),
        50
    );
    evaluateRange(
        Math.max(minDeposit, best.deposit - 100),
        Math.min(currentDeposit, best.deposit + 100),
        1
    );

    const improved = best.shortfall < currentShortfall;

    return {
        improved,
        deposit: best.deposit,
        shortfall: best.shortfall,
        previousShortfall: currentShortfall,
        cleared: best.shortfall <= 0,
        lmiRequired: (() => {
            const backup = snapshotDepositFields(useFormStore.getState());
            try {
                applyDepositToForm(best.deposit);
                return useFormStore.getState().loanLMI === 'yes';
            } finally {
                restoreDepositFields(backup);
            }
        })(),
    };
}

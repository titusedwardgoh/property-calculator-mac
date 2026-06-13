import { formatCurrency } from '../../states/shared/baseCalculations.js';
import { formatFieldValue, fieldLabels } from '../fieldMapping.js';

export function buildResultsSummary(formData, stateFunctions) {
    const buyerData = {
        selectedState: formData.selectedState,
        buyerType: formData.buyerType,
        isPPR: formData.isPPR,
        isAustralianResident: formData.isAustralianResident,
        isFirstHomeBuyer: formData.isFirstHomeBuyer,
        ownedPropertyLast5Years: formData.ownedPropertyLast5Years,
        hasPensionCard: formData.hasPensionCard,
        needsLoan: formData.needsLoan,
        savingsAmount: formData.savingsAmount,
        income: formData.income,
        dependants: formData.dependants,
        dutiableValue: formData.dutiableValue,
        constructionStarted: formData.constructionStarted,
        sellerQuestionsComplete: formData.sellerQuestionsComplete,
    };

    const propertyData = {
        propertyPrice: formData.propertyPrice,
        propertyType: formData.propertyType,
        propertyCategory: formData.propertyCategory,
        isWA: formData.isWA,
        isWAMetro: formData.isWAMetro,
        isACT: formData.isACT,
    };

    const calculateStampDuty = () => {
        if (!stateFunctions || !formData.propertyPrice || !formData.selectedState || !formData.propertyType) {
            return 0;
        }
        return stateFunctions.calculateStampDuty(formData.propertyPrice, formData.selectedState);
    };

    const calculateAllUpfrontCosts = () => {
        if (!formData.buyerDetailsComplete || !stateFunctions?.calculateUpfrontCosts) {
            const stampDutyAmount = calculateStampDuty();
            const depositAmount = (formData.loanDetailsComplete && formData.needsLoan === 'yes') ? (parseInt(formData.loanDeposit) || 0) : 0;
            const settlementFee = (formData.loanDetailsComplete && formData.needsLoan === 'yes') ? (parseInt(formData.loanSettlementFees) || 0) : 0;
            const establishmentFee = (formData.loanDetailsComplete && formData.needsLoan === 'yes') ? (parseInt(formData.loanEstablishmentFee) || 0) : 0;

            return {
                stampDuty: { amount: stampDutyAmount, label: 'Stamp Duty' },
                concessions: [],
                grants: [],
                foreignDuty: { amount: 0, applicable: false },
                netStateDuty: stampDutyAmount,
                totalUpfrontCosts: stampDutyAmount + depositAmount + settlementFee + establishmentFee,
            };
        }

        const upfrontCostsResult = stateFunctions.calculateUpfrontCosts(buyerData, propertyData, formData.selectedState);

        const firbFee = parseInt(formData.FIRBFee) || 0;
        upfrontCostsResult.totalUpfrontCosts += firbFee;

        if (formData.loanDetailsComplete && formData.needsLoan === 'yes') {
            const depositAmount = parseInt(formData.loanDeposit) || 0;
            const settlementFee = parseInt(formData.loanSettlementFees) || 0;
            const establishmentFee = parseInt(formData.loanEstablishmentFee) || 0;

            let additionalCosts = 0;
            if (formData.sellerQuestionsComplete) {
                additionalCosts += parseInt(formData.landTransferFee) || 0;
                additionalCosts += parseInt(formData.legalFees) || 0;
                additionalCosts += parseInt(formData.buildingAndPestInspection) || 0;
            }

            return {
                ...upfrontCostsResult,
                totalUpfrontCosts: upfrontCostsResult.totalUpfrontCosts + depositAmount + settlementFee + establishmentFee + additionalCosts,
            };
        }

        if (formData.sellerQuestionsComplete) {
            const landTransferFee = parseInt(formData.landTransferFee) || 0;
            const legalFees = parseInt(formData.legalFees) || 0;
            const buildingAndPest = parseInt(formData.buildingAndPestInspection) || 0;
            const additionalCosts = landTransferFee + legalFees + buildingAndPest;

            return {
                ...upfrontCostsResult,
                totalUpfrontCosts: upfrontCostsResult.totalUpfrontCosts + additionalCosts,
            };
        }

        return upfrontCostsResult;
    };

    const getMonthlyOngoingCosts = () => {
        const propertyCosts = (formData.COUNCIL_RATES_MONTHLY || 0) +
            (formData.WATER_RATES_MONTHLY || 0) +
            (formData.BODY_CORP_MONTHLY || 0);
        const loanCosts = formData.needsLoan === 'yes' ? (formData.MONTHLY_LOAN_REPAYMENT || 0) : 0;
        return propertyCosts + loanCosts;
    };

    const getAnnualOngoingCosts = () => {
        const hasLoanForAnnual = formData.loanDetailsComplete && formData.needsLoan === 'yes';
        return (hasLoanForAnnual ? (formData.ANNUAL_LOAN_REPAYMENT || 0) : 0) +
            (formData.sellerQuestionsComplete ? (parseInt(formData.councilRates) || 0) : 0) +
            (formData.sellerQuestionsComplete ? (parseInt(formData.waterRates) || 0) : 0) +
            (formData.sellerQuestionsComplete ? (parseInt(formData.bodyCorp) || 0) : 0);
    };

    const upfrontCosts = calculateAllUpfrontCosts();
    const stampDuty = calculateStampDuty();
    const totalPurchaseCost = upfrontCosts?.totalUpfrontCosts || 0;
    const appliedConcessions = upfrontCosts?.concessions || [];
    const appliedGrants = upfrontCosts?.grants || [];
    const grantsConcessionsTotal = [...appliedConcessions, ...appliedGrants].reduce((sum, item) => sum + (item.amount || 0), 0);
    const estimatedNetUpfront = totalPurchaseCost - grantsConcessionsTotal;

    const hasLoan = formData.loanDetailsComplete && formData.needsLoan === 'yes';
    const depositOrPriceAmount = hasLoan
        ? (parseInt(formData.loanDeposit) || 0)
        : (parseInt(formData.propertyPrice) || 0);
    const grossStampDutyAmount = upfrontCosts?.stampDuty?.amount ?? stampDuty;

    const grantsAndConcessionsList = (() => {
        if (!stateFunctions || !formData.selectedState) return [];

        const list = [];
        const state = formData.selectedState;

        const addItem = (name, type, calcFn, takesDuty = false) => {
            if (!calcFn) return;
            try {
                const result = takesDuty
                    ? calcFn(buyerData, propertyData, state, grossStampDutyAmount, formData.dutiableValue, formData.sellerQuestionsComplete)
                    : calcFn(buyerData, propertyData, state);

                const isEligible = result.eligible || false;
                const amt = result.amount ?? result.concessionAmount ?? 0;
                const reason = result.reason || '';

                list.push({
                    name,
                    type,
                    eligible: isEligible,
                    amount: amt,
                    reason,
                });
            } catch (e) {
                console.error(`Error calculating ${name}:`, e);
            }
        };

        if (state === 'NSW') {
            addItem('NSW First Home Owners Grant', 'grant', stateFunctions.calculateNSWFirstHomeOwnersGrant);
            addItem('NSW First Home Buyers Assistance Scheme', 'concession', stateFunctions.calculateNSWFirstHomeBuyersAssistance, true);
        } else if (state === 'VIC') {
            addItem('VIC First Home Owners Grant', 'grant', stateFunctions.calculateVICFirstHomeOwnersGrant);
            addItem('VIC First Home Buyer Duty Concession', 'concession', stateFunctions.calculateVICFirstHomeBuyerDutyConcession, true);
            addItem('VIC PPR Duty Concession', 'concession', stateFunctions.calculateVICPPRConcession, true);
            addItem('VIC Pensioner Duty Concession', 'concession', stateFunctions.calculateVICPensionConcession, true);
            addItem('VIC Temp Off-The-Plan Concession', 'concession', stateFunctions.calculateVICTempOffThePlanConcession, true);
        } else if (state === 'QLD') {
            addItem('QLD First Home Owners Grant', 'grant', stateFunctions.calculateQLDFirstHomeOwnersGrant);
            addItem('QLD Home Concession', 'concession', stateFunctions.calculateQLDHomeConcession, true);
            addItem('QLD First Home Concession', 'concession', stateFunctions.calculateQLDFirstHomeConcession, true);
            addItem('QLD First Home New Concession', 'concession', stateFunctions.calculateQLDFirstHomeNewConcession, true);
            addItem('QLD First Home Vacant Land Concession', 'concession', stateFunctions.calculateQLDFirstHomeVacantLandConcession, true);
        } else if (state === 'SA') {
            addItem('SA First Home Owners Grant', 'grant', stateFunctions.calculateSAFirstHomeOwnersGrant);
            addItem('SA First Home Buyer Concession', 'concession', stateFunctions.calculateSAFirstHomeBuyerConcession, true);
        } else if (state === 'WA') {
            addItem('WA First Home Owners Grant', 'grant', stateFunctions.calculateWAFirstHomeOwnersGrant);
            addItem('WA First Home Owner Concession', 'concession', stateFunctions.calculateWAFirstHomeOwnerConcession, true);
            addItem('WA Off-The-Plan Concession', 'concession', stateFunctions.calculateWAOffThePlanConcession, true);
        } else if (state === 'TAS') {
            addItem('TAS First Home Owners Grant', 'grant', stateFunctions.calculateTASFirstHomeOwnersGrant);
            addItem('TAS First Home Duty Relief', 'concession', stateFunctions.calculateTASFirstHomeDutyRelief, true);
        } else if (state === 'ACT') {
            addItem('ACT Off-The-Plan Exemption', 'concession', stateFunctions.calculateACTOffThePlanExemption, true);
            addItem('ACT Pensioner Concession', 'concession', stateFunctions.calculateACTPensionerConcession, true);
            addItem('ACT Owner Occupier Concession', 'concession', stateFunctions.calculateACTOwnerOccupierConcession, true);
        } else if (state === 'NT') {
            addItem('NT Home-Grown Territory Grant', 'grant', stateFunctions.calculateNTHomeGrownTerritoryGrant);
            addItem('NT Fresh Start Grant', 'grant', stateFunctions.calculateNTFreshStartGrant);
            addItem('NT House and Land Concession', 'concession', stateFunctions.calculateNTHouseAndLandConcession, true);
        }

        return list;
    })();

    let otherCostsAmount = 0;
    if (hasLoan) {
        otherCostsAmount += parseInt(formData.loanSettlementFees) || 0;
        otherCostsAmount += parseInt(formData.loanEstablishmentFee) || 0;
    }
    if (formData.sellerQuestionsComplete) {
        otherCostsAmount += parseInt(formData.landTransferFee) || 0;
        otherCostsAmount += parseInt(formData.legalFees) || 0;
        otherCostsAmount += parseInt(formData.buildingAndPestInspection) || 0;
    }
    if (formData.buyerDetailsComplete && formData.isAustralianResident === 'no' && formData.FIRBFee) {
        otherCostsAmount += parseInt(formData.FIRBFee) || 0;
    }

    const monthlyCashFlow = getMonthlyOngoingCosts();
    const annualOperatingCost = getAnnualOngoingCosts();

    const propertyDisplayAddress =
        formData.propertyAddress?.trim() ||
        [formData.propertyStreetAddress, formData.propertySuburbPostcode]
            .filter(Boolean)
            .join(', ') ||
        'Not specified';
    const propertyDisplayPrice = parseInt(formData.propertyPrice) || 0;
    const buyerTypeDisplay = formatFieldValue('buyerType', formData.buyerType);
    const buyerSavingsAmount = parseInt(formData.savingsAmount) || 0;
    const buyerSavingsShortfall = totalPurchaseCost - buyerSavingsAmount;
    const buyerDetailRows = [
        'isPPR',
        'isAustralianResident',
        'isFirstHomeBuyer',
        ...(formData.isACT ? ['ownedPropertyLast5Years'] : []),
        'hasPensionCard',
        ...(formData.isACT ? ['income', 'dependants'] : []),
        'needsLoan',
    ].map((key) => ({
        key,
        label: fieldLabels[key] || key,
        value: formatFieldValue(key, formData[key]),
    }));

    const loanTypeDisplay = formatFieldValue('loanType', formData.loanType);
    const loanAmountDisplay = (() => {
        const propertyPrice = parseInt(formData.propertyPrice) || 0;
        const deposit = parseInt(formData.loanDeposit) || 0;
        const lmiCost = formData.loanLMI === 'yes' ? (formData.LMI_COST || 0) : 0;
        const lmiStampDuty = formData.loanLMI === 'yes' ? (formData.LMI_STAMP_DUTY || 0) : 0;
        return propertyPrice + lmiCost + lmiStampDuty - deposit;
    })();
    const loanDetailRowKeys = [
        'loanDeposit',
        'loanTerm',
        'loanRate',
        'loanLMI',
        'loanSettlementFees',
        'loanEstablishmentFee',
    ];
    const loanDetailRows = loanDetailRowKeys.map((key) => ({
        key,
        label: fieldLabels[key] || key,
        value: hasLoan ? formatFieldValue(key, formData[key]) : 'N/A',
    }));
    if (hasLoan && formData.loanType === 'interest-only' && formData.loanInterestOnlyPeriod) {
        loanDetailRows.push({
            key: 'loanInterestOnlyPeriod',
            label: 'Interest-Only Period',
            value: `${formData.loanInterestOnlyPeriod} years`,
        });
    } else if (!hasLoan) {
        loanDetailRows.push({
            key: 'loanInterestOnlyPeriod',
            label: 'Interest-Only Period',
            value: 'N/A',
        });
    }
    const loanLmiDisplay = hasLoan && formData.loanLMI === 'yes' && (formData.LMI_COST > 0 || formData.LMI_STAMP_DUTY > 0)
        ? formatCurrency((formData.LMI_COST || 0) + (formData.LMI_STAMP_DUTY || 0))
        : (hasLoan ? null : 'N/A');
    const loanLvrDisplay = hasLoan && formData.LVR != null && formData.LVR !== ''
        ? `${(Number(formData.LVR) * 100).toFixed(1)}%`
        : (hasLoan ? null : 'N/A');

    const landTransferFeeAmount = formData.sellerQuestionsComplete ? (parseInt(formData.landTransferFee) || 0) : 0;
    const legalFeesAmount = formData.sellerQuestionsComplete ? (parseInt(formData.legalFees) || 0) : 0;
    const buildingAndPestAmount = formData.sellerQuestionsComplete ? (parseInt(formData.buildingAndPestInspection) || 0) : 0;
    const firbFeeAmount = (formData.buyerDetailsComplete && formData.isAustralianResident === 'no')
        ? (parseInt(formData.FIRBFee) || 0)
        : 0;
    const councilRatesAmount = formData.sellerQuestionsComplete ? (parseInt(formData.councilRates) || 0) : 0;
    const waterRatesAmount = formData.sellerQuestionsComplete ? (parseInt(formData.waterRates) || 0) : 0;
    const bodyCorpAmount = formData.sellerQuestionsComplete ? (parseInt(formData.bodyCorp) || 0) : 0;
    const settlementOtherCostsTotal = landTransferFeeAmount + legalFeesAmount + buildingAndPestAmount + firbFeeAmount;
    const annualOtherCostsTotal = councilRatesAmount + waterRatesAmount + bodyCorpAmount;
    const otherCostsDetailRows = [
        { key: 'landTransferFee', label: fieldLabels.landTransferFee || 'Land Transfer Fee', value: formatCurrency(landTransferFeeAmount) },
        { key: 'legalFees', label: fieldLabels.legalFees || 'Legal Fees', value: formatCurrency(legalFeesAmount) },
        { key: 'buildingAndPestInspection', label: fieldLabels.buildingAndPestInspection || 'Building and Pest Inspection', value: formatCurrency(buildingAndPestAmount) },
        ...(firbFeeAmount > 0 || formData.isAustralianResident === 'no'
            ? [{ key: 'FIRBFee', label: fieldLabels.FIRBFee || 'FIRB Application Fee', value: formatCurrency(firbFeeAmount) }]
            : []),
        { key: 'councilRates', label: fieldLabels.councilRates || 'Annual Council Rates', value: `${formatCurrency(councilRatesAmount)}/yr` },
        { key: 'waterRates', label: fieldLabels.waterRates || 'Annual Water Rates', value: `${formatCurrency(waterRatesAmount)}/yr` },
        { key: 'bodyCorp', label: fieldLabels.bodyCorp || 'Annual Body Corporate', value: `${formatCurrency(bodyCorpAmount)}/yr` },
    ];

    const calculations = {
        upfrontCosts,
        ongoingCosts: {
            monthly: monthlyCashFlow,
            annual: annualOperatingCost,
        },
        stampDuty,
    };

    return {
        buyerData,
        propertyData,
        upfrontCosts,
        stampDuty,
        totalPurchaseCost,
        appliedConcessions,
        appliedGrants,
        grantsConcessionsTotal,
        estimatedNetUpfront,
        hasLoan,
        depositOrPriceAmount,
        grossStampDutyAmount,
        grantsAndConcessionsList,
        otherCostsAmount,
        monthlyCashFlow,
        annualOperatingCost,
        propertyDisplayAddress,
        propertyDisplayPrice,
        buyerTypeDisplay,
        buyerSavingsAmount,
        buyerSavingsShortfall,
        buyerDetailRows,
        loanTypeDisplay,
        loanAmountDisplay,
        loanDetailRows,
        loanLmiDisplay,
        loanLvrDisplay,
        landTransferFeeAmount,
        legalFeesAmount,
        buildingAndPestAmount,
        firbFeeAmount,
        councilRatesAmount,
        waterRatesAmount,
        bodyCorpAmount,
        settlementOtherCostsTotal,
        annualOtherCostsTotal,
        otherCostsDetailRows,
        calculations,
    };
}

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Helper function to format currency (matching the frontend format)
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '$0';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1f2937',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
    borderBottom: '2px solid #3b82f6',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingVertical: 4,
  },
  label: {
    width: '50%',
    color: '#6b7280',
    fontWeight: 'medium',
  },
  value: {
    width: '50%',
    color: '#111827',
    fontWeight: 'bold',
  },
  summaryBox: {
    backgroundColor: '#eff6ff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 5,
    border: '1px solid #3b82f6',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e40af',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  costBreakdown: {
    marginTop: 10,
    paddingLeft: 10,
  },
  costItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    fontSize: 9,
  },
  costLabel: {
    color: '#4b5563',
  },
  costAmount: {
    color: '#111827',
    fontWeight: 'bold',
  },
  divider: {
    borderBottom: '1px solid #e5e7eb',
    marginVertical: 15,
  },
});

const SurveyPDFDocument = ({ formData, calculations }) => {
  const {
    upfrontCosts = {},
    ongoingCosts = {},
    stampDuty = 0,
  } = calculations || {};

  const totalPurchaseCost = upfrontCosts?.totalUpfrontCosts || 0;
  const grantsConcessionsTotal = (upfrontCosts?.concessions || []).concat(upfrontCosts?.grants || []).reduce((sum, item) => sum + (item.amount || 0), 0);
  const estimatedNetUpfront = totalPurchaseCost - grantsConcessionsTotal;
  const monthlyCashFlow = ongoingCosts?.monthly || 0;
  const annualOperatingCost = ongoingCosts?.annual || 0;

  // Property details
  const propertyAddress = formData?.propertyAddress || 'Not specified';
  const propertyType = formData?.propertyType || 'Not specified';
  const propertyPrice = formData?.propertyPrice || 0;
  const selectedState = formData?.selectedState || 'Not specified';

  // Buyer details
  const buyerType = formData?.buyerType || 'Not specified';
  const isPPR = formData?.isPPR === 'yes' ? 'Yes' : 'No';
  const isAustralianResident = formData?.isAustralianResident === 'yes' ? 'Yes' : 'No';
  const isFirstHomeBuyer = formData?.isFirstHomeBuyer === 'yes' ? 'Yes' : 'No';
  const needsLoan = formData?.needsLoan === 'yes' ? 'Yes' : 'No';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <Text style={styles.title}>Property Purchase Summary</Text>

        {/* Property Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Property Address:</Text>
            <Text style={styles.value}>{propertyAddress}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>State:</Text>
            <Text style={styles.value}>{selectedState}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Property Type:</Text>
            <Text style={styles.value}>{propertyType}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Purchase Price:</Text>
            <Text style={styles.value}>{formatCurrency(propertyPrice)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Buyer Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buyer Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Buyer Type:</Text>
            <Text style={styles.value}>{buyerType}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Principal Place of Residence:</Text>
            <Text style={styles.value}>{isPPR}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Australian Resident:</Text>
            <Text style={styles.value}>{isAustralianResident}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>First Home Buyer:</Text>
            <Text style={styles.value}>{isFirstHomeBuyer}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Needs Loan:</Text>
            <Text style={styles.value}>{needsLoan}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Settlement Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settlement Summary</Text>
          
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Total Purchase Cost</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalPurchaseCost)}</Text>
          </View>

          {grantsConcessionsTotal > 0 && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Minus Total Grants & Concessions</Text>
              <Text style={styles.summaryValue}>{formatCurrency(grantsConcessionsTotal)}</Text>
              {upfrontCosts?.concessions && upfrontCosts.concessions.length > 0 && (
                <View style={styles.costBreakdown}>
                  {upfrontCosts.concessions.map((item, index) => (
                    <View key={`concession-${index}`} style={styles.costItem}>
                      <Text style={styles.costLabel}>{item.label || 'Concession'}:</Text>
                      <Text style={styles.costAmount}>{formatCurrency(item.amount || 0)}</Text>
                    </View>
                  ))}
                </View>
              )}
              {upfrontCosts?.grants && upfrontCosts.grants.length > 0 && (
                <View style={styles.costBreakdown}>
                  {upfrontCosts.grants.map((item, index) => (
                    <View key={`grant-${index}`} style={styles.costItem}>
                      <Text style={styles.costLabel}>{item.label || 'Grant'}:</Text>
                      <Text style={styles.costAmount}>{formatCurrency(item.amount || 0)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Estimated Net Upfront Cost</Text>
            <Text style={styles.summaryValue}>{formatCurrency(estimatedNetUpfront)}</Text>
          </View>

          {/* Cost Breakdown */}
          {upfrontCosts?.stampDuty && (
            <View style={styles.costBreakdown}>
              <Text style={styles.costLabel}>Stamp Duty:</Text>
              <Text style={styles.costAmount}>{formatCurrency(upfrontCosts.stampDuty.amount || stampDuty)}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Ongoing Ownership Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ongoing Ownership</Text>
          
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Monthly Cash Flow</Text>
            <Text style={styles.summaryValue}>{formatCurrency(monthlyCashFlow)} /mo</Text>
            <Text style={styles.costLabel}>*Includes: IPI, Strata Fees</Text>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Annual Operating Cost</Text>
            <Text style={styles.summaryValue}>{formatCurrency(annualOperatingCost)} /yr</Text>
            <Text style={styles.costLabel}>*Includes: Rates, insurance, Maintenance</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.divider, { marginTop: 30 }]} />
        <Text style={{ fontSize: 8, color: '#9ca3af', textAlign: 'center', marginTop: 10 }}>
          Generated on {new Date().toLocaleDateString('en-AU', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </Page>
    </Document>
  );
};

export default SurveyPDFDocument;


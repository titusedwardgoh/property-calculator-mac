"use client";

import React from 'react';
import { ArrowLeft, Calculator, Shield, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Calculator</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Australian Property Calculator</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your comprehensive tool for calculating all costs associated with Australian property investment
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <Calculator className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Comprehensive Calculations</h3>
            <p className="text-gray-600">
              Calculate stamp duty, LMI, loan repayments, and all associated costs with precision.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">State-Specific Rates</h3>
            <p className="text-gray-600">
              Accurate calculations based on current stamp duty rates for all Australian states and territories.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Investment Planning</h3>
            <p className="text-gray-600">
              Plan your property investment with detailed breakdowns of upfront and ongoing costs.
            </p>
          </div>
        </div>

        {/* About Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <div className="prose prose-lg max-w-none text-gray-600 space-y-4">
            <p>
              The Australian Property Calculator was created to help property investors and homebuyers 
              make informed decisions by providing accurate, comprehensive cost calculations for 
              Australian real estate transactions.
            </p>
            <p>
              We understand that buying property in Australia involves numerous costs beyond the 
              purchase price. Our calculator takes into account:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Stamp duty calculations for all states and territories</li>
              <li>First home buyer concessions and exemptions</li>
              <li>Lenders Mortgage Insurance (LMI) premiums</li>
              <li>Legal and conveyancing fees</li>
              <li>Building and pest inspection costs</li>
              <li>Land transfer and mortgage registration fees</li>
              <li>Monthly loan repayments and total interest</li>
            </ul>
            <p>
              Our goal is to provide transparency in the property buying process, helping you 
              understand the true cost of your investment and plan accordingly.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Disclaimer</h3>
          <p className="text-yellow-700">
            This calculator provides estimates based on current rates and regulations. 
            Actual costs may vary. We recommend consulting with qualified professionals 
            such as mortgage brokers, conveyancers, and financial advisors for specific advice.
          </p>
        </div>
      </div>
    </div>
  );
} 
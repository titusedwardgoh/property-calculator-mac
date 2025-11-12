"use client";

import { motion } from 'framer-motion';
import { FileText, Scale } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-base-200">
      <main className="pb-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex items-center justify-center mb-6"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary">
                <Scale className="w-8 h-8" />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6"
            >
              Terms of Service
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-12"
            >
              These terms of use and our Privacy Policy form the basis on which you may access and use PropWiz and our property calculator service.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="text-sm text-gray-500"
            >
              Last updated: January 2025
            </motion.p>
          </div>
        </section>

        {/* Terms Content */}
        <section className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="bg-base-100 border border-base-200 rounded-3xl shadow-sm p-8 md:p-12 space-y-8"
            >
              {/* Introduction */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you browse or otherwise access any content or data on our website or use our property calculator service (together called &quot;our Platform&quot; in these terms), you agree to be bound by these terms.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  These terms of use and our Privacy Policy form the basis on which you may access and use PropWiz, including our website and property calculator service.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  PropWiz reserves the right to change any or all of our terms of use or other conditions for using our Platform at any time by publishing the new terms or conditions on our website. Your use of our Platform constitutes your acceptance of those terms. Should you object to any of our terms of use or other notices on our Platform, your sole option is to immediately cease your use of our Platform.
                </p>
              </div>

              {/* Platform Availability */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Platform Availability</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We do not warrant that content, links, or subdomains contained on, or associated with our website will be available and accessible to you at all times. We may change the path or location of a link or sub-domain, or redirect content contained within a link or subdomain on our website at any time without prior notice to you.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  We do not warrant that any links that you forward will remain constant at the time that you forward or share them, as they are subject to change at any time without notice to you.
                </p>
              </div>

              {/* Disclaimer of Advice */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Disclaimer of Advice</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Information on our Platform and in any PropWiz publication should not be regarded as a substitute for professional legal, financial, or real estate advice.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  PropWiz is responsible for maintaining our Platform and makes no warranty as to the accuracy or reliability of the information contained therein (including, but not limited to, any content or information generated on our Platform by or on behalf of PropWiz, and any Third Party Content on our website).
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Our property calculator provides estimates based on current rates and regulations. Actual costs may vary, and we recommend consulting with qualified professionals such as mortgage brokers, conveyancers, and financial advisors for specific advice.
                </p>
              </div>

              {/* Restrictions on Use */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Restrictions on Use of Our Platform</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  In accessing or using our Platform you agree that you will not:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>use any automated device, software, process or means to access, retrieve, scrape, or index our Platform or any content on our website;</li>
                  <li>use any device, software, process or means to interfere or attempt to interfere with the proper working of our website;</li>
                  <li>undertake any action that will impose a burden or make excessive traffic demands on our infrastructure that we deem, in our sole discretion, to be unreasonable or disproportionate site usage;</li>
                  <li>use or index any content or data on our Platform for purposes of:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>constructing or populating a searchable database of properties,</li>
                      <li>building a database of property information, or</li>
                      <li>constructing or populating a property data or property insights product;</li>
                    </ul>
                  </li>
                  <li>transmit spam, chain letters, contests, junk email, surveys, or other mass messaging, whether commercial in nature or not;</li>
                  <li>use our Platform or any content from our Platform in any manner which is, in our sole discretion, not reasonable and/or not for the purpose which it is made available;</li>
                  <li>violate the rights of any person, including copyright, trade secret, privacy right, or any other intellectual property or proprietary right;</li>
                  <li>pose as any person or entity or attempt to solicit money, passwords or personal information from any person;</li>
                  <li>act in violation of any Term of Use or other condition imposed by us or any applicable law;</li>
                  <li>reproduce, republish, retransmit, modify, adapt, distribute, translate, create derivative works or adaptations of, publicly display, sell, trade, or in any way exploit our Platform or any content on our website, except as expressly authorised by us; or</li>
                  <li>transmit or attempt to transmit any computer viruses, worms, defects, Trojan horses or other items of a destructive nature.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to exercise whatever means we deem necessary to prevent unauthorised access to or use of our website, including, but not limited to, instituting technological barriers, or reporting your conduct to any person or entity.
                </p>
              </div>

              {/* Copyright */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Copyright</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  The subject matter on and accessible from our Platform and publications is protected by copyright. Apart from fair dealing permitted by the Copyright Act 1968, PropWiz grants visitors to the site permission to download copyright material only for private and non-commercial purposes.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  For reproduction or use of PropWiz copyright material beyond such use, written permission must be obtained directly from PropWiz or the relevant copyright owner. If given, permission will be subject to the requirement that the copyright owner&apos;s name and interest in the material be acknowledged when the material is reproduced or quoted, in whole or in part.
                </p>
              </div>

              {/* Third Party Links */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Third Party Links and Advertising</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Our Platform may include advertisements, hyperlinks and pointers to websites operated by third parties. Those third party websites do not form part of our Platform and are not under the control of or the responsibility of PropWiz. When you link to those websites you leave our Platform and do so entirely at your own risk.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  PropWiz and its related entities make no warranty as to the accuracy or reliability of the information contained on any third party websites, and PropWiz and its related entities, directors, officers and agents disclaim all liability and responsibility for any direct or indirect loss or damage which may be suffered by you through relying on anything contained on or omitted from such third party websites. A display of advertising does not imply an endorsement or recommendation by PropWiz.
                </p>
              </div>

              {/* Calculator Results */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Property Calculator Results</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you use our property calculator service, you acknowledge and agree that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>All calculations and estimates provided are of a general nature only, based on historical data and current rates;</li>
                  <li>Calculations will not take into account the potential impact of external factors (such as changes in the economy, future planned infrastructure, regulation, environment or the property market) which may affect the actual costs;</li>
                  <li>Calculator results should not be regarded as advice or relied upon by you or any other person;</li>
                  <li>We recommend that you seek professional advice before making any property decisions;</li>
                  <li>Actual costs may vary from the estimates provided;</li>
                  <li>We do not act as an agent for you or any real estate professional in providing calculator results;</li>
                  <li>Rates and regulations may change, and we do not guarantee that our calculator reflects the most current information at all times.</li>
                </ul>
              </div>

              {/* Further Warranties */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Further Warranties</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You represent and warrant that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>your use of our Platform will comply at all times with these terms and any directions we make to you in relation to your use of our Platform from time to time;</li>
                  <li>you will make sure that you keep any username and password by which you access PropWiz confidential and secure at all times (if applicable); and</li>
                  <li>you accept all liability for any unauthorised use of any username and password issued except for unauthorised use resulting from any negligent act or omission legally attributable to PropWiz.</li>
                </ul>
              </div>

              {/* Indemnity */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Indemnity</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You agree to indemnify and hold PropWiz and its affiliates (and their officers, agents, partners and employees) (collectively, &quot;those indemnified&quot;) harmless against any and all loss, liability, claim or demand (including reasonable attorneys&apos; fees) arising out of any third party claim against those indemnified in connection with your use of our Platform, other than to the extent that such loss, liability, claim or demand was caused by PropWiz&apos;s fraud, gross negligence or wilful default.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  We will notify you within a reasonable period of any third party claim giving rise to a claim for indemnification and will take reasonable steps to mitigate any loss or damage. To the extent that we caused or contributed to any loss, your liability will be reduced proportionately.
                </p>
              </div>

              {/* Policy for Linking */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Policy for Linking to Our Website</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You may only link to content on our Platform if we consent. If we do allow you to link to our Platform, it is on condition that you do not:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>attribute a link to PropWiz content as being a link to your own or someone else&apos;s content (for example, use your own logo to link to our content);</li>
                  <li>attribute a link to our site and then link somewhere else;</li>
                  <li>frame our content in such a way as to present it as your own or as belonging to anyone other than us or our licensors; or</li>
                  <li>link to our content as part of a website that aggregates property listings and/or information or competes with us in any manner.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to require that you do not link to our content and we may exercise this right by giving notice to you. We reserve complete discretion in relation to our exercise of this right, which may be due to the matters or circumstances above, or any other matter or circumstance we consider is reasonable.
                </p>
              </div>

              {/* Limitation of Liability */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Limitation of Liability</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Certain rights and remedies may be available under the Competition and Consumer Act 2010 (Cth) and similar legislation of other States or Territories. Nothing in these Terms and Conditions has the effect of limiting, excluding, restricting or modifying those rights and remedies, and all provisions of these Terms and Conditions are subject to those rights and remedies.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  TO THE EXTENT PERMITTED BY LAW, NEITHER PARTY SHALL BE LIABLE TO THE OTHER PARTY, OR ANY THIRD PARTY FOR ANY INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOSS OF REVENUE, LOSS OF GOODWILL, LOSS OF CUSTOMERS, LOSS OF CAPITAL, DOWNTIME COSTS, LOSS OF PROFIT, LOSS OF OR DAMAGE TO REPUTATION, LOSS UNDER OR IN RELATION TO ANY OTHER CONTRACT, LOSS OF DATA, LOSS OF USE OF DATA, LOSS OF ANTICIPATED SAVINGS OR BENEFITS SUFFERED OR INCURRED BY OR AWARDED AGAINST THEM UNDER OR IN ANY WAY CONNECTED WITH THIS AGREEMENT OR THE WEBSITE, EXCEPT WHERE SUCH DAMAGES, LOSS OR COSTS:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>arises from that party&apos;s fraud, criminal conduct or wilful misconduct, or</li>
                  <li>is the subject of an indemnity provided under these Terms of Use.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  THE AGGREGATE LIABILITY OF EACH PARTY AND THEIR RELATED ENTITIES FOR LOSS, DAMAGES AND COSTS WHICH ARE NOT EXCLUDED UNDER THE CLAUSE ABOVE WILL AT ALL TIMES BE LIMITED TO $100.00, EXCEPT WHERE SUCH DAMAGES, LOSS OR COSTS:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>arises from that party&apos;s fraud, criminal conduct or wilful misconduct, or</li>
                  <li>is the subject of an indemnity provided under these Terms of Use.</li>
                </ul>
              </div>

              {/* Jurisdiction */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Jurisdiction</h2>
                <p className="text-gray-700 leading-relaxed">
                  Your use of our Platform, these terms, our Privacy Policy and all of our legal terms and notices will be governed by and construed in accordance with the laws of Victoria, Australia and by using our Platform you irrevocably and unconditionally submit to the jurisdiction of the courts of that State.
                </p>
              </div>

              {/* Contact Information */}
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mt-8">
                <div className="flex items-start gap-4">
                  <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Questions About These Terms?</h3>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      If you have any questions about these Terms of Service, please contact us at support@propwiz.com.au
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}


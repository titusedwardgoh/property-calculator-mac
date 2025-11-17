"use client";

import { motion } from 'framer-motion';
import { Shield, FileText } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-base-200">
      <main className="pb-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex items-center justify-center mb-6"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary">
                <Shield className="w-8 h-8" />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6"
            >
              Privacy Policy
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-12"
            >
              This Privacy Policy explains how PropWiz manages your personal information and protects your privacy when you use our property calculator service.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="text-sm text-gray-500"
            >
              Last updated: January 2025
            </motion.p>
          </div>
        </section>

        {/* Privacy Policy Content */}
        <section className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="bg-base-100 border border-base-200 rounded-3xl shadow-sm p-8 md:p-12 space-y-8"
            >
              {/* Introduction */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  This Privacy Policy (Policy) explains how PropWiz manages your personal information. By accessing our website or using our property calculator service, you consent to the terms of this Policy, including consenting to us collecting, using and disclosing your personal information as set out in this Policy.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Whether you are new to PropWiz or a long-time user, please take the time to get to know our privacy practices.
                </p>
              </div>

              {/* Who we are */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Who We Are</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  PropWiz is a free property cost calculator service designed to help Australians understand the true costs associated with property purchases. We provide comprehensive calculations for stamp duty, LMI, loan repayments, and all associated expenses for properties across Australia.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Our service is designed to be simple, accurate, and completely free to use—no account required.
                </p>
              </div>

              {/* Application of Privacy Policy */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Application of Privacy Policy</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  PropWiz operates in Australia and is bound by the Australian Privacy Principles and the Australian <em>Privacy Act 1988</em> (Cth) (Australian Privacy Laws).
                </p>
                <p className="text-gray-700 leading-relaxed">
                  To the extent any personal information we collect relates to an EU resident or a California resident, each of the EU General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA) respectively apply.
                </p>
              </div>

              {/* How to Contact Us */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How to Contact Us</h2>
                <p className="text-gray-700 leading-relaxed mb-2">
                  If you have any questions about this Privacy Policy or our privacy practices, you can contact us at:
                </p>
                <div className="bg-base-200 rounded-lg p-4 mt-4">
                  <p className="text-gray-700 font-medium mb-1">Privacy Officer</p>
                  <p className="text-gray-600">PropWiz</p>
                  <p className="text-gray-600">Email: privacy@propwiz.com.au</p>
                </div>
              </div>

              {/* What Information We Collect */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. What Information We Collect</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.1 What is Personal Information</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  In this Policy, the term &apos;personal information&apos; has the meaning given to it in the Privacy Act. In general terms, it is any information that can be used to identify an individual. This may include their name, contact details, property information, and financial information.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.2 Information You Provide</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  When you use our property calculator, we may collect:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li><strong>Property Information:</strong> Property address, property type, purchase price, and property details you enter into the calculator</li>
                  <li><strong>Buyer Information:</strong> Buyer type (first home buyer, investor, etc.), residency status, and other details relevant to calculating costs</li>
                  <li><strong>Loan Information:</strong> Loan amount, deposit amount, interest rate, and loan term if applicable</li>
                  <li><strong>Contact Information:</strong> If you contact us, we may collect your name, email address, and any other information you provide in your message</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.3 Information We Collect Automatically</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  When you visit our website, we may automatically collect:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li><strong>Usage Data:</strong> Information about how you use our website, including pages visited, time spent on pages, and interactions with our calculator</li>
                  <li><strong>Device Information:</strong> Browser type, device type, operating system, and IP address</li>
                  <li><strong>Location Information:</strong> General location information based on your IP address (we do not collect precise location data)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.4 Cookies and Tracking</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use cookies and similar tracking technologies to improve your experience, analyse usage patterns, and provide personalised content. You can manage cookie preferences through your browser settings. Please note that blocking cookies may affect your browsing experience.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  The usage data we collect is generally not personally identifiable, but if it is linked to personal information, we will treat it as personal information in accordance with this Policy.
                </p>
              </div>

              {/* How We Use Your Information */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. How We Use Your Information</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We use your personal information for the following purposes:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>To provide and improve our property calculator service</li>
                  <li>To calculate property costs, stamp duty, LMI, and other expenses based on your inputs</li>
                  <li>To respond to your enquiries and provide customer support</li>
                  <li>To analyse usage patterns and improve our website functionality</li>
                  <li>To comply with legal obligations and protect our rights</li>
                  <li>To prevent fraud and ensure the security of our service</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  We do not use your personal information for marketing purposes without your explicit consent.
                </p>
              </div>

              {/* Who We Share Your Information With */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Who We Share Your Information With</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We may disclose your personal information to third parties in the following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li><strong>Service Providers:</strong> We may share information with third-party service providers who help us operate our website, such as web hosting providers, analytics services, and IT support</li>
                  <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or government regulation</li>
                  <li><strong>Protection of Rights:</strong> We may disclose information to protect our rights, property, or safety, or that of our users</li>
                  <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  We do not sell your personal information to third parties for marketing purposes.
                </p>
              </div>

              {/* Data Storage and Security */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Storage and Security</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We take reasonable steps to protect your personal information from unauthorised access, use, modification, or disclosure. This includes:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>Using secure servers and encryption where appropriate</li>
                  <li>Implementing access controls and authentication measures</li>
                  <li>Regularly reviewing and updating our security practices</li>
                  <li>Training our staff on privacy and security practices</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.
                </p>
              </div>

              {/* Your Rights */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Your Rights</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">9.1 Accessing Your Personal Information</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You may request access to personal information we hold about you by contacting us. We will respond to your request within a reasonable period and will not charge for simply making a request. We may ask you to verify your identity before providing access.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">9.2 Correcting Your Personal Information</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We take reasonable steps to ensure that the personal information we collect is accurate, complete, and up-to-date. If you believe that personal information we hold about you is incorrect, incomplete, or inaccurate, you may request us to amend it.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">9.3 Deleting Your Personal Information</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You may contact us to request that we delete information that we hold about you. We will respond to your request within a reasonable period, subject to any legal obligations we may have to retain certain information.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">9.4 Complaints</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you believe your privacy has been breached or have any feedback, questions, or concerns about our Privacy Policy or privacy practices, please contact us. We will investigate your complaint and respond within a reasonable time.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  If you are not satisfied with the outcome of your complaint, you may contact the Office of the Australian Information Commissioner at <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-focus underline">www.oaic.gov.au</a> or by calling 1300 363 992.
                </p>
              </div>

              {/* Information Transfers */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Information Transfers</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We may disclose your personal information to entities located overseas, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>Our data hosting and cloud-based IT service providers</li>
                  <li>Third-party analytics and service providers</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  We take reasonable steps to ensure that overseas recipients of your personal information do not breach the privacy obligations relating to your personal information.
                </p>
              </div>

              {/* Changes to This Policy */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Policy</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We may, from time to time, review and update this Privacy Policy, including taking account of new or amended laws, new technology, and/or changes to our operations. All personal information held by us will be governed by the most recent updated Privacy Policy.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Any updated versions of this Privacy Policy will be posted on our website. We encourage you to review this Policy periodically to stay informed about how we protect your personal information.
                </p>
              </div>

              {/* Links to Other Websites */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Links to Other Websites</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our website may contain links to other websites operated by third parties. We make no representations or warranties in relation to the privacy practices of any third party website and we are not responsible for the privacy policies or the content of any third party website. Third party websites are responsible for informing you about their own privacy practices.
                </p>
              </div>

              {/* Contact Information */}
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mt-8">
                <div className="flex items-start gap-4">
                  <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Questions About This Policy?</h3>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      If you have any questions about this Privacy Policy or our privacy practices, please contact us at privacy@propwiz.com.au
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


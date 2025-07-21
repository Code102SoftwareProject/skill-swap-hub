"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const TermsOfService = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Terms Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using SkillSwap Hub ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Platform Description</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              SkillSwap Hub is a peer-to-peer skill exchange platform that connects users who want to learn skills with those who can teach them. Our platform facilitates:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Skill exchange sessions between users</li>
              <li>Matching users based on their teaching and learning preferences</li>
              <li>Communication tools for coordinating skill exchanges</li>
              <li>Progress tracking and review systems</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Account Security</h3>
                <p className="text-gray-700 leading-relaxed">
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Accurate Information</h3>
                <p className="text-gray-700 leading-relaxed">
                  You agree to provide accurate, current, and complete information about yourself and your skills. Misrepresentation of skills or qualifications is prohibited.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Professional Conduct</h3>
                <p className="text-gray-700 leading-relaxed">
                  You agree to maintain professional and respectful behavior in all interactions with other users. Harassment, discrimination, or inappropriate conduct is strictly prohibited.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Skill Exchange Guidelines</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Skill exchanges should be conducted in good faith with genuine intent to teach and learn</li>
              <li>Users should honor their commitments to scheduled sessions</li>
              <li>Both parties are expected to actively participate in the learning process</li>
              <li>Sessions should be conducted in appropriate and safe environments</li>
              <li>Users should provide constructive feedback and reviews</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Prohibited Activities</h2>
            <p className="text-gray-700 leading-relaxed mb-4">The following activities are strictly prohibited:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Using the platform for commercial purposes without authorization</li>
              <li>Sharing contact information to bypass the platform's communication system</li>
              <li>Requesting or offering monetary compensation for skill exchanges</li>
              <li>Posting false, misleading, or fraudulent information</li>
              <li>Violating any applicable laws or regulations</li>
              <li>Attempting to hack, disrupt, or compromise the platform's security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Content and Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Users retain ownership of the content they create and share on the platform. However, by using SkillSwap Hub, you grant us a limited license to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Display your profile information to facilitate matches</li>
              <li>Store and process your data as outlined in our Privacy Policy</li>
              <li>Use aggregated, anonymized data for platform improvement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Platform Availability</h2>
            <p className="text-gray-700 leading-relaxed">
              While we strive to maintain continuous service, SkillSwap Hub may experience occasional downtime for maintenance, updates, or due to circumstances beyond our control. We do not guarantee uninterrupted access to the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              SkillSwap Hub serves as a platform to connect users but is not responsible for the quality, safety, or outcomes of skill exchanges. Users participate in skill exchanges at their own risk. We are not liable for any damages, injuries, or losses that may occur during or as a result of skill exchange activities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Account Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms, engage in inappropriate behavior, or compromise the safety and integrity of the platform. Users may also delete their accounts at any time through their account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms of Service from time to time. Users will be notified of significant changes via email or through the platform. Continued use of the platform after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:support@skillswaphub.com" className="text-blue-600 hover:text-blue-800">
                support@skillswaphub.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from the use of this platform shall be resolved through appropriate legal channels.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <Link
            href="/privacy"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            View Privacy Policy
          </Link>
          <Link
            href="/register"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            Back to Registration
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Privacy Policy Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              At SkillSwap Hub, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our skill exchange platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Personal Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Full name and professional title</li>
                  <li>Email address and phone number</li>
                  <li>Profile picture/avatar</li>
                  <li>Skills, qualifications, and experience details</li>
                  <li>Location and availability preferences</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Usage Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Session participation and progress data</li>
                  <li>Messages and communications within the platform</li>
                  <li>Reviews and ratings you give or receive</li>
                  <li>Search queries and matching preferences</li>
                  <li>Device information and IP addresses</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Technical Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Browser type and version</li>
                  <li>Operating system and device information</li>
                  <li>Access times and pages visited</li>
                  <li>Referring website addresses</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Create and manage your user account</li>
              <li>Match you with suitable skill exchange partners</li>
              <li>Facilitate communication between users</li>
              <li>Track session progress and completion</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Improve our platform and user experience</li>
              <li>Send important notifications and updates</li>
              <li>Verify skills and maintain platform quality</li>
              <li>Prevent fraud and maintain platform security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell, trade, or rent your personal information to third parties. We only share your information in the following circumstances:
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">With Other Users</h3>
                <p className="text-gray-700 leading-relaxed">
                  Your profile information, skills, and reviews are visible to other users to facilitate skill matching and exchanges. You control what information is displayed in your public profile.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Service Providers</h3>
                <p className="text-gray-700 leading-relaxed">
                  We may share data with trusted third-party service providers who help us operate the platform (hosting, analytics, email services, etc.). These providers are bound by confidentiality agreements.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Legal Requirements</h3>
                <p className="text-gray-700 leading-relaxed">
                  We may disclose information when required by law, court order, or to protect the rights and safety of our users and the platform.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement robust security measures to protect your personal information:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Encryption of sensitive data in transit and at rest</li>
              <li>Secure password hashing and authentication</li>
              <li>Regular security audits and updates</li>
              <li>Access controls limiting who can view your data</li>
              <li>Secure hosting infrastructure with monitoring</li>
              <li>Regular data backups and recovery procedures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain information for legitimate business purposes, legal compliance, or fraud prevention for a limited period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Privacy Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Access and review your personal information</li>
              <li>Update or correct inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Control your profile visibility settings</li>
              <li>Opt-out of non-essential communications</li>
              <li>Download a copy of your data</li>
              <li>Object to certain data processing activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Remember your login status and preferences</li>
              <li>Analyze platform usage and performance</li>
              <li>Personalize your experience</li>
              <li>Prevent fraud and enhance security</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              You can control cookie settings through your browser preferences, though some features may not function properly without cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Third-Party Links</h2>
            <p className="text-gray-700 leading-relaxed">
              Our platform may contain links to external websites or services. We are not responsible for the privacy practices of these third-party sites. We encourage you to review their privacy policies before sharing any personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              SkillSwap Hub is not intended for users under 18 years of age. We do not knowingly collect personal information from minors. If we discover that we have collected information from someone under 18, we will delete it immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. International Users</h2>
            <p className="text-gray-700 leading-relaxed">
              If you are accessing SkillSwap Hub from outside your home country, please note that your information may be transferred to, stored, and processed in countries where our servers are located. We ensure appropriate safeguards are in place for international data transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Policy Updates</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. We will notify users of significant changes via email or through the platform. Your continued use of SkillSwap Hub after policy updates constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong>{" "}
                <a href="mailto:privacy@skillswaphub.com" className="text-blue-600 hover:text-blue-800">
                  privacy@skillswaphub.com
                </a>
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Support:</strong>{" "}
                <a href="mailto:support@skillswaphub.com" className="text-blue-600 hover:text-blue-800">
                  support@skillswaphub.com
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <Link
            href="/terms"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            View Terms of Service
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

export default PrivacyPolicy;
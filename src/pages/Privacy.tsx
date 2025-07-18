import React from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Eye,
  Users,
  FileText,
  Mail,
  MapPin,
} from "lucide-react";
import { siteConfig } from '../config/siteConfig';

const Privacy: React.FC = () => {
  const sections = [
    {
      id: "information-collect",
      title: "1. Information We Collect",
      icon: FileText,
      content: (
        <div>
          <p className="mb-4">
            We collect several types of information from and about users of our
            website and services, including:
          </p>
          <div className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                Personal Data
              </h4>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                <li>
                  Contact information (name, email address, postal address,
                  phone number)
                </li>
                <li>
                  Account information (username, password, profile details)
                </li>
                <li>
                  Educational information (course progress, assessment results,
                  certificates earned)
                </li>
                <li>
                  User-generated content (forum posts, project submissions,
                  comments)
                </li>
              </ul>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Usage Data
              </h4>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                <li>IP address, browser type and version</li>
                <li>Pages visited, time spent on pages</li>
                <li>Device information (type, operating system)</li>
                <li>Course viewing history and interactions</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "how-collect",
      title: "2. How We Collect Information",
      icon: Eye,
      content: (
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Direct interactions:</strong> Information you provide when
            creating an account, purchasing courses, filling out forms, or
            communicating with us.
          </li>
          <li>
            <strong>Automated technologies:</strong> We automatically collect
            certain data when you visit our website using cookies, web beacons,
            and similar technologies.
          </li>
          <li>
            <strong>Third parties:</strong> We may receive information about you
            from third parties such as payment processors, analytics providers,
            and social media platforms.
          </li>
        </ul>
      ),
    },
    {
      id: "how-use",
      title: "3. How We Use Your Information",
      icon: Users,
      content: (
        <div className="grid md:grid-cols-2 gap-4">
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide and maintain our services</li>
            <li>To process and complete transactions</li>
            <li>To create and manage your account</li>
            <li>To personalize your learning experience</li>
            <li>To track your progress and issue certificates</li>
          </ul>
          <ul className="list-disc pl-6 space-y-2">
            <li>To communicate with you about courses and updates</li>
            <li>To improve our website, products, and services</li>
            <li>To respond to your inquiries and provide support</li>
            <li>To detect and prevent fraudulent activities</li>
            <li>To comply with legal obligations</li>
          </ul>
        </div>
      ),
    },
    {
      id: "sharing",
      title: "4. Sharing Your Information",
      icon: Shield,
      content: (
        <div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">We Share With:</h4>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Service providers (payment processing, hosting)</li>
                <li>Business partners for collaborative services</li>
                <li>Legal authorities when required by law</li>
                <li>Business transfers (mergers, acquisitions)</li>
              </ul>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                We Never:
              </h4>
              <ul className="list-disc pl-6 space-y-1 text-sm text-green-700 dark:text-green-300">
                <li>Sell your personal information</li>
                <li>Share data without your consent</li>
                <li>Use data for unauthorized purposes</li>
                <li>Compromise your privacy</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "security",
      title: "5. Data Security",
      icon: Lock,
      content: (
        <div>
          <p className="mb-4">
            We implement comprehensive security measures to protect your
            personal information:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Lock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                Encryption
              </h4>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                End-to-end encryption for all data transmission
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-semibold text-green-800 dark:text-green-200">
                Secure Servers
              </h4>
              <p className="text-sm text-green-600 dark:text-green-300">
                Protected infrastructure with regular monitoring
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Eye className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <h4 className="font-semibold text-purple-800 dark:text-purple-200">
                Regular Audits
              </h4>
              <p className="text-sm text-purple-600 dark:text-purple-300">
                Continuous security assessments and updates
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-orange-500" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Privacy Policy
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            Your privacy is important to us at ROBOSTAAN
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: January 11, 2025
          </p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-xl mb-8"
        >
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
            At ROBOSTAAN, we respect your privacy and are committed to
            protecting your personal data. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you
            visit our website or use our robotics learning services.
          </p>
        </motion.div>

        {/* Main Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.section
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {section.title}
                </h2>
              </div>
              <div className="text-gray-700 dark:text-gray-300">
                {section.content}
              </div>
            </motion.section>
          ))}

          {/* Data Rights Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                6. Your Data Protection Rights
              </h2>
            </div>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Depending on your location, you may have the following rights
              regarding your personal data:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Right to access your personal data</li>
                <li>Right to rectify inaccurate or incomplete data</li>
                <li>Right to erasure (the "right to be forgotten")</li>
                <li>Right to restrict processing</li>
              </ul>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
                <li>Rights related to automated decision-making</li>
                <li>Right to withdraw consent</li>
              </ul>
            </div>
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-orange-800 dark:text-orange-200">
                To exercise these rights, please contact us at{" "}
                <a
                  href="mailto:privacy@robostaan.com"
                  className="font-semibold underline hover:text-orange-600"
                >
                  privacy@robostaan.com
                </a>
              </p>
            </div>
          </motion.section>

          {/* Additional Sections */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              7. Children's Privacy
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              Our services are not intended for children under 13 years of age.
              We do not knowingly collect personal information from children
              under 13. If you are a parent or guardian and believe that your
              child has provided us with personal information, please contact
              us.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              8. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the "Last updated" date. We encourage you to review
              this Privacy Policy periodically.
            </p>
          </motion.section>

          {/* Contact Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white"
          >
            <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please
              contact us:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Email</p>
                  <p className="text-orange-100">privacy@robostaan.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Address</p>
                  <p className="text-orange-100">
                    Jaipur, Rajasthan, India
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Back to Top */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="text-center mt-12"
        >
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <span>Back to Top</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Shield, Users, AlertTriangle, Mail,MapPin } from 'lucide-react';
import { siteConfig } from '../config/siteConfig';

const Terms: React.FC = () => {
  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      icon: FileText,
      content: (
        <div>
          <p className="mb-4">
            By accessing and using ROBOSTAAN ("the Platform"), you accept and agree to be bound by the terms 
            and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <p className="text-orange-800 dark:text-orange-200">
              <strong>Important:</strong> These terms constitute a legally binding agreement between you and ROBOSTAAN.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'services',
      title: '2. Description of Services',
      icon: Users,
      content: (
        <div>
          <p className="mb-4">ROBOSTAAN provides:</p>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="list-disc pl-6 space-y-2">
              <li>Online robotics courses and tutorials</li>
              <li>Educational blog content and resources</li>
              <li>Interactive learning experiences</li>
              <li>Community forums and discussions</li>
            </ul>
            <ul className="list-disc pl-6 space-y-2">
              <li>Progress tracking and certificates</li>
              <li>Project-based learning opportunities</li>
              <li>Expert instructor guidance</li>
              <li>Technical support and assistance</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'user-conduct',
      title: '3. User Conduct',
      icon: Shield,
      content: (
        <div>
          <p className="mb-4">You agree to use ROBOSTAAN responsibly and in accordance with these guidelines:</p>
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Acceptable Use</h4>
              <ul className="list-disc pl-6 space-y-1 text-green-700 dark:text-green-300">
                <li>Use the platform for educational purposes</li>
                <li>Respect other users and instructors</li>
                <li>Provide accurate information</li>
                <li>Follow community guidelines</li>
              </ul>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Prohibited Activities</h4>
              <ul className="list-disc pl-6 space-y-1 text-red-700 dark:text-red-300">
                <li>Sharing copyrighted content without permission</li>
                <li>Harassment or inappropriate behavior</li>
                <li>Attempting to hack or disrupt services</li>
                <li>Creating multiple accounts to circumvent restrictions</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
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
            <FileText className="w-8 h-8 text-orange-500" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Terms of Service
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            Please read these terms carefully before using ROBOSTAAN
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
          className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl mb-8"
        >
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
            Welcome to ROBOSTAAN! These Terms of Service ("Terms") govern your use of our robotics 
            learning platform and services. By using our platform, you agree to these terms.
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

          {/* Additional Sections */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                4. Limitation of Liability
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              ROBOSTAAN shall not be liable for any indirect, incidental, special, consequential, 
              or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
              or other intangible losses.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200">
                <strong>Disclaimer:</strong> The platform is provided "as is" without warranties of any kind, 
                either express or implied.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              5. Modifications to Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We reserve the right to modify these terms at any time. We will notify users of any 
              significant changes via email or platform notifications. Continued use of the platform 
              after changes constitutes acceptance of the new terms.
            </p>
          </motion.section>

          {/* Contact Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white"
          >
            <h2 className="text-2xl font-bold mb-4">6. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Email</p>
                  <p className="text-orange-100">{siteConfig.contact.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Address</p>
                  <p className="text-orange-100">{siteConfig.contact.address.city}, {siteConfig.contact.address.state}, {siteConfig.contact.address.country}</p>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Back to Top */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-center mt-12"
        >
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <span>Back to Top</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;
import React from 'react';
import { motion } from 'framer-motion';
import { Cookie, Settings, Eye, Shield, Mail, Phone, MapPin } from 'lucide-react';

const Cookies: React.FC = () => {
  const cookieTypes = [
    {
      name: 'Essential Cookies',
      icon: Shield,
      color: 'green',
      description: 'These cookies are necessary for the website to function and cannot be switched off.',
      examples: ['Authentication tokens', 'Security preferences', 'Language settings', 'Session management']
    },
    {
      name: 'Analytics Cookies',
      icon: Eye,
      color: 'blue',
      description: 'These cookies help us understand how visitors interact with our website.',
      examples: ['Page views', 'User behavior', 'Performance metrics', 'Error tracking']
    },
    {
      name: 'Functional Cookies',
      icon: Settings,
      color: 'purple',
      description: 'These cookies enable enhanced functionality and personalization.',
      examples: ['User preferences', 'Course progress', 'Theme settings', 'Personalized content']
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
      purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

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
            <Cookie className="w-8 h-8 text-orange-500" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Cookie Policy
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            How ROBOSTAAN uses cookies to enhance your experience
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">What are Cookies?</h2>
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
            Cookies are small text files that are stored on your device when you visit our website. 
            They help us provide you with a better experience by remembering your preferences and 
            understanding how you use our platform.
          </p>
        </motion.div>

        {/* Cookie Types */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Types of Cookies We Use</h2>
          <div className="space-y-6">
            {cookieTypes.map((type, index) => (
              <motion.div
                key={type.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className={`border rounded-xl p-6 ${getColorClasses(type.color)}`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <type.icon className="w-6 h-6" />
                  <h3 className="text-xl font-bold">{type.name}</h3>
                </div>
                <p className="mb-4">{type.description}</p>
                <div>
                  <h4 className="font-semibold mb-2">Examples:</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    {type.examples.map((example, idx) => (
                      <li key={idx}>{example}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Cookie Management */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Managing Your Cookies</h2>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Browser Settings</h3>
              <p className="text-blue-700 dark:text-blue-300">
                You can control and delete cookies through your browser settings. Most browsers allow you to:
              </p>
              <ul className="list-disc pl-6 mt-2 text-blue-700 dark:text-blue-300">
                <li>View what cookies are stored</li>
                <li>Delete cookies individually or all at once</li>
                <li>Block cookies from specific sites</li>
                <li>Block all cookies</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Important Note</h3>
              <p className="text-yellow-700 dark:text-yellow-300">
                Disabling certain cookies may affect the functionality of our website and your user experience. 
                Essential cookies are required for the platform to work properly.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Third-Party Cookies */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Third-Party Cookies</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            We may use third-party services that set their own cookies. These include:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Analytics Services</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Google Analytics</li>
                <li>Usage tracking</li>
                <li>Performance monitoring</li>
              </ul>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Content Delivery</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Video hosting services</li>
                <li>Font providers</li>
                <li>Image optimization</li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Updates */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Updates to This Policy</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We may update this Cookie Policy from time to time to reflect changes in our practices or 
            for other operational, legal, or regulatory reasons. We will notify you of any material 
            changes by posting the updated policy on our website.
          </p>
        </motion.section>

        {/* Contact Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white"
        >
          <h2 className="text-2xl font-bold mb-4">Questions About Cookies?</h2>
          <p className="mb-4">
            If you have any questions about our use of cookies, please contact us:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5" />
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-orange-100">robostaan@gmail.com</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5" />
              <div>
                <p className="font-semibold">Phone</p>
                <p className="text-orange-100">+91-XXXXXXXXXX</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5" />
              <div>
                <p className="font-semibold">Address</p>
                <p className="text-orange-100">Jaipur, Rajasthan, India</p>
              </div>
            </div>
          </div>
        </motion.section>

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

export default Cookies;
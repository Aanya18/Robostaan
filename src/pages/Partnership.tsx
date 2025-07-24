import React from 'react';
import { motion } from 'framer-motion';
import { Handshake, Building, Users, Target } from 'lucide-react';
import SEOHead from '../components/SEO/SEOHead';
import { siteConfig, urlHelpers } from '../config/siteConfig';

const Partnership: React.FC = () => (
  <>
    <SEOHead
      title="Partnership | ROBOSTAAN"
      description="Join our partnership program and collaborate with us to advance robotics education and innovation. Discover exciting opportunities for mutual growth."
      keywords={["robotics partnership", "collaboration", "business partnership", "technology alliance", "innovation network"]}
      image={siteConfig.seo.defaultImage}
      url={urlHelpers.fullUrl('/partnership')}
      type="website"
    />
    <div className="min-h-screen bg-white dark:bg-gray-900 py-6 px-2 sm:py-8 sm:px-4">
      <div className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Partnership Opportunities
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Join us in shaping the future of robotics education and innovation through strategic partnerships.
          </p>
        </motion.div>

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 sm:p-8 text-center text-white mb-8 mx-2 sm:mx-0"
        >
          <div className="max-w-4xl mx-auto">
            <Handshake className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl font-bold mb-3">Partnership Program Coming Soon!</h2>
            <p className="text-base mb-6 opacity-90">
              Exciting partnership opportunities are being developed for collaboration!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center mb-2">
                  <Building className="w-5 h-5 mr-2" />
                  <h3 className="font-semibold">Corporate Partners</h3>
                </div>
                <p className="text-sm opacity-90">Strategic industry alliances</p>
              </div>
              
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center mb-2">
                  <Users className="w-5 h-5 mr-2" />
                  <h3 className="font-semibold">Educational Institutions</h3>
                </div>
                <p className="text-sm opacity-90">Academic collaborations</p>
              </div>
              
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center mb-2">
                  <Target className="w-5 h-5 mr-2" />
                  <h3 className="font-semibold">Innovation Partners</h3>
                </div>
                <p className="text-sm opacity-90">Joint R&D projects</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </>
);

export default Partnership; 
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, MapPin, Clock } from 'lucide-react';
import SEOHead from '../components/SEO/SEOHead';
import { siteConfig, urlHelpers } from '../config/siteConfig';

const Events: React.FC = () => (
  <>
    <SEOHead
      title="Events | ROBOSTAAN"
      description="Join our exciting robotics events, workshops, and community meetups. Learn, network, and grow with fellow robotics enthusiasts."
      keywords={["robotics events", "workshops", "meetups", "community", "technology events", "STEM", "networking"]}
      image={siteConfig.seo.defaultImage}
      url={urlHelpers.fullUrl('/events')}
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
            Our Events
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Join us for exciting robotics events, workshops, and community meetups that inspire and educate.
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
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl font-bold mb-3">Exciting Events Coming Soon!</h2>
            <p className="text-base mb-6 opacity-90">
              Amazing robotics events, workshops, and meetups are in the works!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center mb-2">
                  <Users className="w-5 h-5 mr-2" />
                  <h3 className="font-semibold">Workshops</h3>
                </div>
                <p className="text-sm opacity-90">Hands-on learning sessions</p>
              </div>
              
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center mb-2">
                  <MapPin className="w-5 h-5 mr-2" />
                  <h3 className="font-semibold">Meetups</h3>
                </div>
                <p className="text-sm opacity-90">Community networking</p>
              </div>
              
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center mb-2">
                  <Clock className="w-5 h-5 mr-2" />
                  <h3 className="font-semibold">Competitions</h3>
                </div>
                <p className="text-sm opacity-90">Skill showcases</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </>
);

export default Events; 
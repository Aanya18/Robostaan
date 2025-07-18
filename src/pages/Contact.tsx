import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { siteConfig } from '../config/siteConfig';
import emailjs from 'emailjs-com';
import { AnimatePresence } from 'framer-motion';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (status !== 'idle') {
      const timer = setTimeout(() => {
        setStatus('idle');
        setStatusMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setStatusMessage('');
    setLoading(true);
    try {
      // Send email via EmailJS
      await emailjs.send(
        siteConfig.services.emailjs.serviceId,
        siteConfig.services.emailjs.templateId,
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message
        },
        siteConfig.services.emailjs.publicKey
      );
      setStatus('success');
      setStatusMessage("Thank you for your message! We'll get back to you soon.");
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      setStatus('error');
      setStatusMessage('Failed to send message. Please try again later.');
      console.error('EmailJS error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Get In Touch
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Have a question or want to learn more about our robotics programs? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Send us a Message
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Status Message */}
              <AnimatePresence>
                {status === 'success' && (
                  <motion.div
                    key={status}
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="w-full max-w-lg mx-auto mb-4 p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 shadow-xl flex flex-col items-center text-center"
                    role="alert"
                  >
                    <span className="flex items-center justify-center w-14 h-14 rounded-full bg-green-500 shadow-lg mb-3 animate-pop">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </span>
                    <span className="text-xl font-bold text-green-900 mb-1">Message Sent!</span>
                    <span className="text-green-800 text-base font-medium mb-1">{statusMessage}</span>
                    <span className="text-green-700 text-sm opacity-80">We'll get back to you soon. Thank you for reaching out!</span>
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div
                    key={status}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.4, type: 'spring' }}
                    className="rounded-xl px-4 py-3 mb-2 text-base font-semibold flex items-center space-x-2 shadow-md bg-gradient-to-r from-red-100 to-red-200 text-red-900 border border-red-300"
                    role="alert"
                  >
                    <svg className="w-6 h-6 text-red-500 animate-shake" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    <span>{statusMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Tell us about your inquiry..."
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.97 }}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                type="submit"
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold shadow-lg hover:bg-orange-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <span className="relative flex h-6 w-6 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-30"></span>
                    <span className="relative inline-flex rounded-full h-6 w-6 border-4 border-white border-t-transparent border-b-transparent animate-spin animate-pulse" style={{ borderTopColor: '#f97316', borderBottomColor: '#fff' }}></span>
                  </span>
                ) : (
                  <Send className="w-5 h-5" />
                )}
                <span className="tracking-wide text-base">{loading ? 'Sending...' : 'Send Message'}</span>
              </motion.button>
            </form>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
              <div className="flex items-center mb-6">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-orange-600 text-white mr-4">
                  {/* Email icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12l-4-4-4 4m8 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" /></svg>
                </span>
                <div>
                  <div className="font-semibold">Email</div>
                  <div>robostaan@gmail.com</div>
                </div>
              </div>
              <div className="flex items-center mb-6">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-orange-600 text-white mr-4">
                  {/* Location icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 0c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z" /></svg>
                </span>
                <div>
                  <div className="font-semibold">Address</div>
                  <div>Jaipur, Rajasthan, India</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Linkedin } from 'lucide-react';
import Newsletter from '../Features/Newsletter';
import { siteConfig, urlHelpers } from '../../config/siteConfig';
import logo  from  '../../assets/logo.png'

const Footer: React.FC = () => {

  const socialLinks = [
    { icon: Twitter, href: siteConfig.social.twitter, label: 'Twitter' },
    { icon: Linkedin, href: siteConfig.social.linkedin, label: 'LinkedIn' },
    { icon: Youtube, href: siteConfig.social.youtube, label: 'YouTube' },
    { icon: Facebook, href: siteConfig.social.facebook, label: 'Facebook' },
    { icon: Instagram, href: siteConfig.social.instagram, label: 'Instagram' }
  ];

  const quickLinks = siteConfig.navigation.main;
  const footerLinks = siteConfig.navigation.footer;

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center"
              >
                <img src={logo} alt="logo" className='w-10 h-10' />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-xl font-bold">{siteConfig.name}</span>
                <span className="text-sm text-orange-500">{siteConfig.tagline}</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm">
              {siteConfig.description}
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.2 }}
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path || '/'}
                    className="text-gray-400 hover:text-orange-500 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={siteConfig.social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-orange-500 transition-colors text-sm"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-orange-500 transition-colors text-sm"
                >
                  Tutorials
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-orange-500 transition-colors text-sm"
                >
                  Community
                </a>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-400 hover:text-orange-500 transition-colors text-sm"
                >
                  Support
                </Link>
              </li>
            </ul>
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Contact Info</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>robostaan@gmail.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <Newsletter />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-400">© ROBOSTAAN. All rights reserved.</div>
          <div className="flex space-x-6 mt-4 md:mt-0 text-sm text-gray-400">
            {footerLinks
              .filter(link => link.name !== 'Projects' && link.name !== 'Support')
              .map((link) => (
                <Link key={link.name} to={link.path || '/'} className="hover:text-orange-400 transition-colors">
                  {link.name}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
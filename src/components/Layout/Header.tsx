import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Settings, Moon, Sun, AlertTriangle, BookOpen, GraduationCap, Code, Images, Calendar, Handshake } from 'lucide-react';
import { useAuth } from '../Auth/AuthProvider';
import { useApp } from '../../context/AppContext';
import SearchBar from '../Features/SearchBar';
import UserProfile from '../Features/UserProfile';
import { siteConfig } from '../../config/siteConfig';
import logo  from  '../../assets/logo.png'

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // New state for search modal
  const { darkMode, toggleDarkMode } = useApp();
  const { user, authError, loading: authLoading } = useAuth();
  const location = useLocation();

  const navItems = siteConfig.navigation.main;

  const isActive = (path: string) => location.pathname === path;

  // Icon mapping function
  const getIcon = (iconName: string) => {
    const icons = {
      BookOpen,
      GraduationCap,
      Code,
      Images,
      Calendar,
      Handshake
    };
    return icons[iconName as keyof typeof icons];
  };

  return (
    <header className="fixed top-0 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50 border-b border-gray-200 dark:border-gray-700">
      {/* Auth Error Banner */}
      {authError && (
        <div className="bg-red-500 text-white px-4 py-2 text-center text-sm">
          <div className="flex items-center justify-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{authError}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-8 h-8 rounded-full flex items-center justify-center"
            >
              <img src={logo} alt="logo" className='w-8 h-8' />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 dark:text-white">{siteConfig.name}</span>
              <span className="text-xs text-orange-500 -mt-1">{siteConfig.tagline}</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              item.dropdown ? (
                <div key={item.name} className="relative group" tabIndex={0}>
                  <button
                    className={`text-sm font-medium transition-colors flex items-center focus:outline-none ${
                      isActive('/' + (item.children[0]?.path?.split('/')[1] || ''))
                        ? 'text-orange-500'
                        : 'text-gray-700 dark:text-gray-100'
                    } hover:text-orange-500`}
                    tabIndex={-1}
                  >
                    {item.name}
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <div
                    className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-all duration-300 z-50"
                    tabIndex={-1}
                  >
                    {item.children.map((child: any) => {
                      const IconComponent = child.icon ? getIcon(child.icon) : null;
                      return (
                        <Link
                          key={child.path || child.name}
                          to={typeof child.path === 'string' ? child.path : '/'}
                          className="group/item flex items-center px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-500 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {IconComponent && (
                            <IconComponent className="w-5 h-5 mr-3 text-gray-400 group-hover/item:text-orange-500 transition-colors duration-200" />
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover/item:text-orange-500 transition-colors duration-200">
                              {child.name}
                            </span>
                            {child.description && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 group-hover/item:text-orange-400 transition-colors duration-200">
                                {child.description}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors hover:text-orange-500 ${
                    isActive(item.path)
                      ? 'text-orange-500'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {item.name}
                </Link>
              )
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Show search icon on md+ screens */}
            <div className="hidden md:block">
              <SearchBar onClick={() => setIsSearchOpen(true)} />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className="hidden md:inline-flex p-2 text-gray-700 dark:text-gray-300 hover:text-orange-500 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>

            {authLoading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            ) : user ? (
              <UserProfile />
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 text-orange-500 border border-orange-500 rounded-lg font-medium hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                  >
                    Sign In
                  </motion.button>
                </Link>
                <Link to="/signup">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    Sign Up
                  </motion.button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 dark:text-gray-300"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="px-4 py-2 pb-8 space-y-1">
              {/* Mobile Dark/Light Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-center p-2 mb-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-orange-500 transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5 mr-2" /> : <Moon className="w-5 h-5 mr-2" />}
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </motion.button>
              
              {navItems.map((item) => (
                item.dropdown ? (
                  <div key={item.name} className="mb-4">
                    <div className="px-3 py-2 font-medium text-base text-gray-700 dark:text-gray-300">{item.name}</div>
                    <div className="pl-2">
                      {item.children.map((child: any) => {
                        const IconComponent = child.icon ? getIcon(child.icon) : null;
                        return (
                          <Link
                            key={child.path || child.name}
                            to={typeof child.path === 'string' ? child.path : '/'}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 mb-1 ${
                              isActive(child.path)
                                ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                : 'text-gray-700 dark:text-gray-300 hover:text-orange-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            {IconComponent && (
                              <IconComponent className={`w-5 h-5 mr-3 transition-colors duration-200 ${
                                isActive(child.path) 
                                  ? 'text-orange-500' 
                                  : 'text-gray-400 group-hover:text-orange-500'
                              }`} />
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {child.name}
                              </span>
                              {child.description && (
                                <span className={`text-sm transition-colors duration-200 ${
                                  isActive(child.path)
                                    ? 'text-orange-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {child.description}
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive(item.path)
                        ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-orange-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              ))}
              
              {/* Move SearchBar below Contact button for mobile */}
              <div className="mt-4">
                <SearchBar mobileButton onClick={() => {
                  setIsMenuOpen(false);
                  setTimeout(() => setIsSearchOpen(true), 50);
                }} />
              </div>
              
              {!user && (
                <div className="pt-4 space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 text-center text-orange-500 border border-orange-500 rounded-lg font-medium hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 text-center bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
      {/* Render search modal at root level */}
      {isSearchOpen && (
        <SearchBar isModalOpen={isSearchOpen} onCloseModal={() => setIsSearchOpen(false)} />
      )}
    </header>
  );
};

export default Header;
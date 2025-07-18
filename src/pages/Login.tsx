import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Settings, ArrowRight, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { getSupabaseConnection } from '../lib/supabaseConnection';
import { useApp } from '../context/AppContext';
import { useAuth } from '../components/Auth/AuthProvider';
import { siteConfig } from '../config/siteConfig';
import logo from '../assets/logo.png';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkMessage, setMagicLinkMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refreshData } = useApp();
  const { authError } = useAuth();

  // Demo credentials from centralized config
  const demoCredentials = siteConfig.auth.demoAccounts;

  useEffect(() => {
    // Check connection status using the new connection manager
    const checkConnection = async () => {
      try {
        const connection = getSupabaseConnection();
        await connection.executeWithRetry(async (client) => {
          const { data, error } = await client.from('blogs').select('id').limit(1);
          if (error) {
            throw error;
          }
          return data;
        });
        setConnectionStatus('connected');
      } catch (err) {
        setConnectionStatus('error');
      }
    };

    checkConnection();

    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const connection = getSupabaseConnection();
        await connection.executeWithRetry(async (client) => {
          const { data: { user } } = await client.auth.getUser();
          if (user) {
            navigate('/');
          }
          return user;
        });
      } catch (err) {
        console.error('Error checking user:', err);
      }
    };
    
    if (connectionStatus === 'connected') {
      checkUser();
    }
  }, [navigate, connectionStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (connectionStatus === 'error') {
      setError('Authentication service is currently unavailable. Please try again later.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const connection = getSupabaseConnection();
      const { data, error } = await connection.executeWithRetry(async (client) => {
        return await client.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account before signing in.');
        } else {
          setError('Login failed. Please try again later.');
        }
        return;
      }

      if (data.user) {
        // Create or update user profile using the connection manager
        await connection.executeWithRetry(async (client) => {
          const { error: profileError } = await client
            .from('user_profiles')
            .upsert({
              user_id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name,
              role: formData.email === siteConfig.auth.superAdminEmail ? 'admin' : 'user'
            });

          if (profileError) console.error('Profile error:', profileError);
          return profileError;
        });
        
        await refreshData();
        navigate('/');
      }
    } catch (error: any) {
      setError('Connection error. Please check your internet connection and try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setMagicLinkMessage(null);
    if (!formData.email) {
      setMagicLinkMessage('Please enter your email address.');
      return;
    }
    setMagicLinkLoading(true);
    try {
      const connection = getSupabaseConnection();
      const { error } = await connection.executeWithRetry(async (client) => {
        return await client.auth.signInWithOtp({ email: formData.email });
      });
      if (error) {
        setMagicLinkMessage('Failed to send magic link. Please try again.');
      } else {
        setMagicLinkMessage('Magic link sent! Check your email to log in.');
      }
    } catch (err) {
      setMagicLinkMessage('Failed to send magic link. Please try again.');
    } finally {
      setMagicLinkLoading(false);
    }
  };

  const handleDemoLogin = (credentials: typeof demoCredentials[0]) => {
    setFormData({
      email: credentials.email,
      password: credentials.password
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex justify-center">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center"
            >
              <img src={logo} alt="ROBOSTAAN logo" className="w-12 h-12 rounded-full object-contain" />
            </motion.div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Sign in to your {siteConfig.name} account
          </p>
        </motion.div>

        {/* Connection Status */}
        {connectionStatus === 'checking' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center space-x-2 text-orange-600 dark:text-orange-400"
          >
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
            <span className="text-sm">Connecting to {siteConfig.name}...</span>
          </motion.div>
        )}

        {connectionStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center space-x-2 text-red-600 dark:text-red-400"
          >
            <WifiOff className="w-4 h-4" />
            <span className="text-sm">Connection failed. Please check your internet.</span>
          </motion.div>
        )}

        {/* Auth Error */}
        {authError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{authError}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800"
                  placeholder="Enter your email"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-800"
                  placeholder="Enter your password"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || connectionStatus === 'error'}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                Sign In
              </>
            )}
          </motion.button>

          {/* Magic Link Login */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={!formData.email || magicLinkLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-orange-500 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {magicLinkLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
              ) : (
                'Login with Magic Link'
              )}
            </button>
            {magicLinkMessage && (
              <div className="mt-2 text-sm text-orange-600 dark:text-orange-400">{magicLinkMessage}</div>
            )}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-orange-500 hover:text-orange-400 transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </motion.form>

        {/* Demo Accounts */}
        {/* {siteConfig.features.demoAccounts && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8"
          >
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Try our demo accounts:
              </p>
              <div className="space-y-2">
                {demoCredentials.map((credential, index) => (
                  <motion.button
                    key={credential.email}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    onClick={() => handleDemoLogin(credential)}
                    className="w-full flex items-center justify-between p-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="text-left">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {credential.role}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {credential.description}
                      </p>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {credential.email}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )} */}
      </div>
    </div>
  );
};

export default Login;
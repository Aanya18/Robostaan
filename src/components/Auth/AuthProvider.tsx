import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseConnection } from '../../lib/supabaseConnection';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  role: 'user' | 'admin' | 'instructor';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isInstructor: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const connection = getSupabaseConnection();

  // Cache profile data in localStorage to persist across refreshes
  const cacheProfile = (profileData: UserProfile | null) => {
    if (profileData) {
      localStorage.setItem('user_profile', JSON.stringify(profileData));
    } else {
      localStorage.removeItem('user_profile');
    }
  };

  const getCachedProfile = (): UserProfile | null => {
    try {
      const cached = localStorage.getItem('user_profile');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error parsing cached profile:', error);
      localStorage.removeItem('user_profile');
      return null;
    }
  };

  // Clear all auth-related data from localStorage
  const clearAuthData = () => {
    // Clear profile cache
    localStorage.removeItem('user_profile');
    
    // Clear all possible Supabase auth tokens
    const authKeys = [
      'sb-juoyqkqmzshnidszqlaz-auth-token',
      'supabase.auth.token',
      'sb-auth-token',
      'sb-juoyqkqmzshnidszqlaz-auth-token-code-verifier',
      'sb-juoyqkqmzshnidszqlaz-auth-token-refresh-token'
    ];
    
    authKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear all localStorage items that start with 'sb-'
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });

    // Clear sessionStorage as well
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  const fetchUserProfile = async (userId: string, retries = 3): Promise<UserProfile | null> => {
    try {
      const { data, error } = await connection.executeWithRetry(async (client) => {
        return await client
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
      });

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create one
          const { data: userData } = await connection.executeWithRetry(async (client) => {
            return await client.auth.getUser();
          });
          
          if (userData.user) {
            const newProfile = {
              user_id: userData.user.id,
              email: userData.user.email || '',
              full_name: userData.user.user_metadata?.full_name || '',
              role: 'user' as const
            };

            const { data: createdProfile, error: createError } = await connection.executeWithRetry(async (client) => {
              return await client
                .from('user_profiles')
                .insert([newProfile])
                .select()
                .single();
            });

            if (!createError && createdProfile) {
              setProfile(createdProfile);
              cacheProfile(createdProfile);
              return createdProfile;
            }
          }
          return null;
        }

        console.error('Error fetching profile:', error);
        if (retries > 0) {
          // Retry after a short delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchUserProfile(userId, retries - 1);
        }
        return null;
      }

      if (data) {
        setProfile(data);
        cacheProfile(data);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchUserProfile(userId, retries - 1);
      }
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;
    let initializationTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        // Set a timeout to prevent infinite loading
        initializationTimeout = setTimeout(() => {
          if (mounted) {
            console.warn('Auth initialization timeout, setting loading to false');
            setLoading(false);
          }
        }, 20000); // 20 second timeout

        // First, try to get cached profile for immediate UI update
        const cachedProfile = getCachedProfile();
        if (cachedProfile) {
          setProfile(cachedProfile);
        }

        // Get current session with timeout
        connection.executeWithRetry(async (client) => {
          const { data: { session } } = await client.auth.getSession();
          if (session?.user) {
            if (mounted) {
              setUser(session.user);
              // Fetch fresh profile data with timeout
              const profilePromise = fetchUserProfile(session.user.id);
              const profileTimeoutPromise = new Promise((resolve) => 
                setTimeout(() => resolve(null), 10000)
              );
              
              Promise.race([profilePromise, profileTimeoutPromise]).then(profile => {
                if (mounted) {
                  setProfile(profile as UserProfile | null);
                }
              });
            }
          } else {
            // No session, clear cached data
            if (mounted) {
              setUser(null);
              setProfile(null);
              cacheProfile(null);
            }
          }
          return session;
        });
              } catch (error: any) {
          if (mounted) {
            console.error('Auth initialization error:', error);
            // Don't show error for timeout, just proceed
            if (!error.message?.includes('timeout')) {
              setAuthError('Authentication error occurred.');
            }
          }
      } finally {
        if (mounted) {
          clearTimeout(initializationTimeout);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    connection.executeWithRetry(async (client) => {
      const { data: { subscription } } = client.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;

          try {
            setAuthError(null);
            
            if (event === 'SIGNED_OUT') {
              // Handle sign out
              setUser(null);
              setProfile(null);
              clearAuthData();
            } else if (session?.user) {
              setUser(session.user);
              // Fetch profile for the authenticated user
              await fetchUserProfile(session.user.id);
            }
          } catch (error) {
            console.error('Auth state change error:', error);
            setAuthError('Authentication error occurred.');
          }
        }
      );

      return subscription;
    });

    return () => {
      mounted = false;
      clearTimeout(initializationTimeout);
    };
  }, [connection]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const { data, error } = await connection.executeWithRetry(async (client) => {
        return await client
          .from('user_profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .select()
          .single();
      });

      if (error) throw error;
      if (data) {
        setProfile(data);
        cacheProfile(data);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await connection.executeWithRetry(async (client) => {
        return await client.auth.signOut();
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Admin access only for users with admin role
  const isAdmin = profile?.role === 'admin';
  const isInstructor = profile?.role === 'instructor' || profile?.role === 'admin';

  const value: AuthContextType = {
    user,
    profile,
    loading,
    authError,
    signOut,
    isAdmin,
    isInstructor,
    updateProfile,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
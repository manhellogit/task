import { useState, useEffect, useCallback, useRef } from 'react';
import { usersApi} from '../services/api';
import type { BackendUser } from '../services/api';
export interface User {
  email: string;
  username: string;
  clientId: number;
  userId: string;
  joinedAt: Date;
}

export const useEmailAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authKey, setAuthKey] = useState(0);
  const initialized = useRef(false); // Prevent multiple initializations

  // Force component re-render
  const forceUpdate = useCallback(() => {
    setAuthKey(prev => prev + 1);
  }, []);

  // Check for existing user on mount - ONLY ONCE
  useEffect(() => {
    if (initialized.current) return; // Prevent multiple initializations
    initialized.current = true;
    
    console.log('🔍 useEmailAuth - Initializing (ONCE)...');
    
    const checkSavedUser = () => {
      try {
        const savedUser = localStorage.getItem('cadmus-user');
        
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          console.log('👤 Found saved user:', parsedUser.email);
          
          setUser(parsedUser);
          setIsAuthenticated(true);
          return true;
        } else {
          console.log('👤 No saved user found');
          setUser(null);
          setIsAuthenticated(false);
          return false;
        }
      } catch (error) {
        console.error('❌ Failed to parse saved user:', error);
        localStorage.removeItem('cadmus-user');
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    };

    checkSavedUser();
    setLoading(false);
  }, []); // Empty dependency array - run only once

  const loginWithEmail = useCallback(async (email: string): Promise<boolean> => {
    try {
      // call backend to create/fetch the user
      const backendUser: BackendUser = await usersApi.login(email.trim().toLowerCase());

      // Map backend payload to existing User shape (keep the app unchanged)
      const newUser: User = {
        email: backendUser.email,
        username: backendUser.username,
        clientId: backendUser.clientId,
        userId: backendUser.userId,
        joinedAt: new Date(), // local session timestamp
      };

      localStorage.setItem('cadmus-user', JSON.stringify(newUser));
      setUser(newUser);
      setIsAuthenticated(true);
      forceUpdate();
      return true;
    } catch (err) {
      console.error('❌ Login failed:', err);
      setIsAuthenticated(false);
      return false;
    }
  }, [forceUpdate]);

  const logout = useCallback(() => {
    console.log('👋 Logging out user:', user?.email);
    
    // Clear localStorage first
    localStorage.removeItem('cadmus-user');
    
    // Clear all content data too
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cadmus-content-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Update state
    setUser(null);
    setIsAuthenticated(false);
    
    // Force re-render
    forceUpdate();
    
    console.log('✅ Logout completed');
  }, [user?.email, forceUpdate]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('cadmus-user', JSON.stringify(updated));
      console.log('📝 Updated user:', updated.email);
      return updated;
    });
  }, []);

  // Debug log whenever auth state changes
  useEffect(() => {
    console.log('🔍 Auth State Changed:', { 
      hasUser: !!user, 
      isAuthenticated, 
      loading,
      email: user?.email,
      authKey 
    });
  }, [user, isAuthenticated, loading, authKey]);

  return {
    user,
    isAuthenticated,
    loading,
    loginWithEmail,
    logout,
    updateUser,
    authKey
  };
};

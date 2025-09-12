import { useState, useEffect } from 'react';

interface User {
  clientId: number;
  username?: string;
  userId?: string;
}

export const usePersistedUser = () => {
  const [user, setUser] = useState<User | null>(null);

  // Initialize user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('cadmus-user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        console.log('👤 Restored user from localStorage:', parsedUser);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        // Create new user if parsing fails
        createNewUser();
      }
    } else {
      // No saved user, create new one
      createNewUser();
    }
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('cadmus-user', JSON.stringify(user));
      console.log('💾 Saved user to localStorage:', user);
    }
  }, [user]);

  const createNewUser = () => {
    const newUser: User = {
      clientId: Math.floor(Math.random() * 0xFFFFFFFF),
      username: `User_${Math.random().toString(36).substr(2, 6)}`,
      userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    };
    setUser(newUser);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const clearUser = () => {
    localStorage.removeItem('cadmus-user');
    setUser(null);
  };

  return {
    user,
    updateUser,
    clearUser,
    createNewUser
  };
};

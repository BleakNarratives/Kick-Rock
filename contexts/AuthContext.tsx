import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { loginUser as loginService, logoutUser as logoutService, registerUser as registerService, getCurrentUser as getCurrentUserService } from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  register: (username: string, password: string) => boolean;
  logout: () => void;
  isLoadingAuth: boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const refreshUser = useCallback(() => {
    setIsLoadingAuth(true);
    const user = getCurrentUserService();
    setCurrentUser(user);
    setIsLoadingAuth(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = (username: string, password: string): boolean => {
    const user = loginService(username, password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const register = (username: string, password: string): boolean => {
    const success = registerService(username, password);
    if (success) {
      // Auto-login after registration
      return login(username, password);
    }
    return false;
  };

  const logout = () => {
    logoutService();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, isLoadingAuth, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER_CUSTOMER: User = {
  id: 'user-cust-123',
  email: 'customer@peakpulse.com',
  name: 'Valued Customer',
  avatarUrl: 'https://placehold.co/100x100.png?text=VC',
  roles: ['customer'],
};

const MOCK_USER_ADMIN: User = {
  id: 'user-admin-456',
  email: 'admin@peakpulse.com',
  name: 'Peak Pulse Admin',
  avatarUrl: 'https://placehold.co/100x100.png?text=AD',
  roles: ['admin', 'customer'], // Admins are also customers
};

const MOCK_USER_AFFILIATE: User = {
  id: 'user-aff-789',
  email: 'affiliate@peakpulse.com',
  name: 'Influencer One',
  avatarUrl: 'https://placehold.co/100x100.png?text=IO',
  roles: ['affiliate', 'customer'], // Affiliates are also customers
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem('isAuthenticated');
      const storedUserEmail = localStorage.getItem('userEmail');
      if (storedAuth === 'true' && storedUserEmail) {
        let mockUserToSet = MOCK_USER_CUSTOMER; // Default
        if (storedUserEmail === MOCK_USER_ADMIN.email) mockUserToSet = MOCK_USER_ADMIN;
        else if (storedUserEmail === MOCK_USER_AFFILIATE.email) mockUserToSet = MOCK_USER_AFFILIATE;
        else if (storedUserEmail === MOCK_USER_CUSTOMER.email) mockUserToSet = MOCK_USER_CUSTOMER;
        
        setIsAuthenticated(true);
        setUser(mockUserToSet); 
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    // Mock authentication logic
    let userToLogin: User | null = null;
    if (email === MOCK_USER_ADMIN.email && pass === 'password') {
      userToLogin = MOCK_USER_ADMIN;
    } else if (email === MOCK_USER_AFFILIATE.email && pass === 'password') {
      userToLogin = MOCK_USER_AFFILIATE;
    } else if (email === MOCK_USER_CUSTOMER.email && pass === 'password') { // Generic customer login
      userToLogin = MOCK_USER_CUSTOMER;
    } else if (pass === 'password') { // Allow any email with 'password' for easier testing
       userToLogin = { ...MOCK_USER_CUSTOMER, email, name: email.split('@')[0] };
    }


    if (userToLogin) {
      try {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', userToLogin.email); // Store email to re-identify user type
        setIsAuthenticated(true);
        setUser(userToLogin);
        setIsLoading(false);
        // Redirect to dashboard or intended page
        const intendedPath = pathname === '/login' || pathname === '/register' ? '/account/dashboard' : pathname;
        router.push(intendedPath);
        return true;
      } catch (error) {
        console.error("Failed to set localStorage:", error);
        setIsLoading(false);
        return false;
      }
    }
    setIsLoading(false);
    return false;
  }, [router, pathname]);

  const logout = useCallback(() => {
    setIsLoading(true);
    try {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userEmail');
    } catch (error) {
      console.error("Failed to remove from localStorage:", error);
    }
    setIsAuthenticated(false);
    setUser(null);
    setIsLoading(false);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

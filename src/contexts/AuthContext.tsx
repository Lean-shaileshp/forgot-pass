import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { initialUsers } from '@/data/initialData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (roles: User['role'][]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo credentials for mock auth
const DEMO_CREDENTIALS: Record<string, { password: string; userId: string }> = {
  'admin@logistics.com': { password: 'admin123', userId: '1' },
  'staff1@logistics.com': { password: 'staff123', userId: '2' },
  'driver1@logistics.com': { password: 'driver123', userId: '3' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const savedUser = localStorage.getItem('logistics_auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('logistics_auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const credentials = DEMO_CREDENTIALS[email.toLowerCase()];
    if (!credentials) {
      return { success: false, error: 'Invalid email address' };
    }

    if (credentials.password !== password) {
      return { success: false, error: 'Invalid password' };
    }

    const users = JSON.parse(localStorage.getItem('logistics_users') || JSON.stringify(initialUsers)) as User[];
    const foundUser = users.find(u => u.id === credentials.userId);

    if (!foundUser) {
      return { success: false, error: 'User account not found' };
    }

    if (foundUser.status !== 'active') {
      return { success: false, error: 'Account is inactive. Please contact administrator.' };
    }

    setUser(foundUser);
    localStorage.setItem('logistics_auth_user', JSON.stringify(foundUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('logistics_auth_user');
  };

  const hasRole = (roles: User['role'][]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Role-based access control helper
export const ROLE_PERMISSIONS: Record<User['role'], string[]> = {
  super_admin: ['*'],
  admin: ['dashboard', 'customers', 'offices', 'pickups', 'dockets', 'manifests', 'inscan', 'drs', 'pod', 'products', 'suppliers', 'warehouses', 'purchase_orders', 'grn', 'sales_orders', 'billing', 'reports'],
  office_staff: ['dashboard', 'customers', 'pickups', 'dockets', 'manifests', 'inscan', 'drs', 'pod', 'billing'],
  driver: ['dashboard', 'drs', 'pod'],
  customer: ['dashboard', 'dockets', 'pickups'],
};

export function canAccess(role: User['role'], module: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes('*') || permissions.includes(module);
}

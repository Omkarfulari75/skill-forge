import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../api/auth';

interface AuthContextType {
  user: User | null;
  selectedCourseId: number | null;
  login: (userData: User) => void;
  logout: () => void;
  selectCourse: (courseId: number) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedCourseId = localStorage.getItem('selectedCourseId');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
    if (savedCourseId) {
      setSelectedCourseId(Number(savedCourseId));
    }
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setSelectedCourseId(null);
    localStorage.removeItem('user');
    localStorage.removeItem('selectedCourseId');
  };

  const selectCourse = (courseId: number) => {
    setSelectedCourseId(courseId);
    localStorage.setItem('selectedCourseId', courseId.toString());
  };

  return (
    <AuthContext.Provider value={{ user, selectedCourseId, login, logout, selectCourse, loading }}>
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

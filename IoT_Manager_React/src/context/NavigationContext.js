import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LoadingSpinner from '../shared/LoadingSpinner';

const NavigationContext = createContext();

export function NavigationProvider({ children }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const location = useLocation();

  useEffect(() => {
    setIsNavigating(true);
    setLoadingText('Loading page...');

    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location]);

  const setNavigationLoading = (loading, text = 'Loading...') => {
    setIsNavigating(loading);
    setLoadingText(text);
  };

  return (
    <NavigationContext.Provider value={{ isNavigating, loadingText, setNavigationLoading }}>
      {children}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center space-x-3">
              <LoadingSpinner size="small" text="" />
              <span className="text-sm font-medium text-gray-700">{loadingText}</span>
            </div>
          </div>
        </div>
      )}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

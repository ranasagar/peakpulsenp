
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';

const AUTO_HIDE_TIMEOUT_MS = 3000; // Hide after 3 seconds of inactivity
const LOCAL_STORAGE_KEY = 'peakPulseAutoHideMenuEnabled';

interface AutoHideMenuContextType {
  isAutoHideEnabled: boolean;
  toggleAutoHideEnabled: () => void;
  areMenusHiddenActually: boolean; // Renamed to avoid conflict if consumer also uses areMenusHidden
}

const AutoHideMenuContext = createContext<AutoHideMenuContextType | undefined>(undefined);

export const AutoHideMenuProvider = ({ children }: { children: ReactNode }) => {
  const [isAutoHideEnabled, setIsAutoHideEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const storedPreference = localStorage.getItem(LOCAL_STORAGE_KEY);
      return storedPreference ? JSON.parse(storedPreference) : true; // Default to enabled
    }
    return true;
  });

  const [areMenusHiddenActually, setAreMenusHiddenActually] = useState<boolean>(false);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(isAutoHideEnabled));
    }
  }, [isAutoHideEnabled]);

  const resetActivityTimer = useCallback(() => {
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }
    
    setAreMenusHiddenActually(false); // Always show on activity

    if (isAutoHideEnabled) {
      activityTimerRef.current = setTimeout(() => {
        // Check again if still enabled before hiding
        if (isAutoHideEnabled) {
            setAreMenusHiddenActually(true);
        }
      }, AUTO_HIDE_TIMEOUT_MS);
    }
  }, [isAutoHideEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const events: (keyof WindowEventMap)[] = ['mousemove', 'scroll', 'mousedown', 'touchstart', 'keydown'];

    const handleActivity = () => {
      resetActivityTimer();
    };

    if (isAutoHideEnabled) {
      events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));
      resetActivityTimer(); // Initial call to set visibility correctly
    } else {
      // If auto-hide is disabled, ensure menus are always visible and clear any timer
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
      setAreMenusHiddenActually(false);
    }

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
    };
  }, [isAutoHideEnabled, resetActivityTimer]);

  const toggleAutoHideEnabled = () => {
    setIsAutoHideEnabled(prev => {
      const newState = !prev;
      if (!newState) { // If disabling auto-hide
        setAreMenusHiddenActually(false); // Ensure menus are visible
        if (activityTimerRef.current) {
          clearTimeout(activityTimerRef.current);
        }
      } else { // If enabling auto-hide
        resetActivityTimer(); // Start the timer logic
      }
      return newState;
    });
  };

  return (
    <AutoHideMenuContext.Provider value={{ isAutoHideEnabled, toggleAutoHideEnabled, areMenusHiddenActually }}>
      {children}
    </AutoHideMenuContext.Provider>
  );
};

export const useAutoHideMenu = (): AutoHideMenuContextType => {
  const context = useContext(AutoHideMenuContext);
  if (context === undefined) {
    throw new Error('useAutoHideMenu must be used within an AutoHideMenuProvider');
  }
  return context;
};

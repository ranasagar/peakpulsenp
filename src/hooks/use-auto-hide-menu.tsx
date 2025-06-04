
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';

const AUTO_HIDE_TIMEOUT_MS = 3000; // Hide menus after 3 seconds of inactivity
const AUTO_SCROLL_TO_TOP_DELAY_MS = 10000; // Scroll to top 10 seconds AFTER menus have hidden
const LOCAL_STORAGE_KEY = 'peakPulseAutoHideMenuEnabled';

interface AutoHideMenuContextType {
  isAutoHideEnabled: boolean;
  toggleAutoHideEnabled: () => void;
  areMenusHiddenActually: boolean;
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
  const scrollToTopTimerRef = useRef<NodeJS.Timeout | null>(null); // New timer for scrolling

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(isAutoHideEnabled));
    }
  }, [isAutoHideEnabled]);

  const clearAllTimers = useCallback(() => {
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
      activityTimerRef.current = null;
    }
    if (scrollToTopTimerRef.current) {
      clearTimeout(scrollToTopTimerRef.current);
      scrollToTopTimerRef.current = null;
    }
  }, []);

  const resetActivityTimer = useCallback(() => {
    clearAllTimers(); // Clear both menu hide and scroll-to-top timers

    setAreMenusHiddenActually(false); // Always show on activity

    if (isAutoHideEnabled) {
      activityTimerRef.current = setTimeout(() => {
        if (isAutoHideEnabled) { // Double check, in case it was disabled during timeout
            setAreMenusHiddenActually(true);
            // When menus hide, start the timer for scrolling to top
            scrollToTopTimerRef.current = setTimeout(() => {
                if (isAutoHideEnabled && areMenusHiddenActuallyRef.current) { // Check if menus are still hidden and feature enabled
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, AUTO_SCROLL_TO_TOP_DELAY_MS);
        }
      }, AUTO_HIDE_TIMEOUT_MS);
    }
  }, [isAutoHideEnabled, clearAllTimers]);

  // Ref to keep track of the latest value of areMenusHiddenActually for the timer callback
  const areMenusHiddenActuallyRef = useRef(areMenusHiddenActually);
  useEffect(() => {
    areMenusHiddenActuallyRef.current = areMenusHiddenActually;
  }, [areMenusHiddenActually]);


  useEffect(() => {
    if (typeof window === 'undefined') return;

    const events: (keyof WindowEventMap)[] = ['mousemove', 'scroll', 'mousedown', 'touchstart', 'keydown'];

    const handleActivity = () => {
      resetActivityTimer();
    };

    if (isAutoHideEnabled) {
      events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));
      resetActivityTimer(); 
    } else {
      clearAllTimers();
      setAreMenusHiddenActually(false); // Ensure menus are visible if auto-hide is off
    }

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearAllTimers();
    };
  }, [isAutoHideEnabled, resetActivityTimer, clearAllTimers]);

  const toggleAutoHideEnabled = () => {
    setIsAutoHideEnabled(prev => {
      const newState = !prev;
      if (!newState) { 
        clearAllTimers();
        setAreMenusHiddenActually(false); 
      } else { 
        resetActivityTimer(); 
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

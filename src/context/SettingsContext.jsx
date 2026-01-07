import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// Default Settings (User starts here)
const DEFAULT_SETTINGS = {
  // Visuals
  blurLevel: 20,           
  focusMode: true,        // Default is ON (Clean)
  settingsTheme: 'dark',   
  
  // Clock Standard
  clockShow: true,
  clockFormat: '12h',  
  dateShow: true,
  clockColor: '#ffffff',
  clockSize: 150,                   
  clockPosition: { x: 50, y: 50 },  

  // --- NEW FEATURES (ADDED) ---
  clockColorMinutes: null, // Important: Start as null (Unified color)
  clockLayout: 'horizontal',
  clockFont: 'Outfit',
  hoursOpacity: 1,
  minutesOpacity: 1,
};

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isDragMode, setIsDragMode] = useState(false); 
  
  // Loading State: vital to prevent "Flicker" of default settings
  const [loading, setLoading] = useState(true);
  
  // Safety Lock: Don't save until we have finished loading!
  const isLoadedRef = useRef(false);

  // 1. Load Data (Run once on start)
  useEffect(() => {
    const loadData = async () => {
      try {
        let saved = null;
        
        // Try loading from Chrome Storage
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
           const result = await chrome.storage.local.get(['zenSettings']);
           saved = result.zenSettings;
           console.log("Loaded from Chrome Storage:", saved);
        } 
        // Fallback to LocalStorage (for localhost testing)
        else {
           const local = localStorage.getItem('zenSettings');
           if (local) {
             saved = JSON.parse(local);
             console.log("Loaded from LocalStorage:", saved);
           }
        }

        if (saved) {
           // Merge defaults with saved data
           // This ensures new features don't break old saves
           const merged = { ...DEFAULT_SETTINGS, ...saved };
           setSettings(merged);
        }
      } catch (e) {
        console.error("Error loading settings:", e);
      } finally {
        setLoading(false);
        isLoadedRef.current = true; // Unlock saving
      }
    };
    loadData();
  }, []);

  // 2. Auto-Save (Run whenever settings change)
  useEffect(() => {
    if (!isLoadedRef.current) return; // Block saves during loading

    const save = async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          await chrome.storage.local.set({ zenSettings: settings });
          // Optional: Verify it saved
          // console.log("Settings Saved to Chrome:", settings);
        } else {
          localStorage.setItem('zenSettings', JSON.stringify(settings));
          // console.log("Settings Saved to LocalStorage:", settings);
        }
      } catch (err) {
        console.error("Save Failed:", err);
      }
    };
    
    // Debounce slightly to prevent spamming storage
    const timer = setTimeout(save, 500);
    return () => clearTimeout(timer);
  }, [settings]);

  const updateSettings = (newValues) => {
    setSettings(prev => ({ ...prev, ...newValues }));
  };

  const getClockColor = () => {
    // Focus Mode override handled here if needed, otherwise return main color
    return settings.focusMode ? '#ffffff' : settings.clockColor;
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      loading,
      isDragMode,
      setIsDragMode,
      getClockColor 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
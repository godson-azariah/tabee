import { useState, useEffect } from 'react';

export const useSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialChar, setInitialChar] = useState('');
  const [history, setHistory] = useState([]);

  // 1. Load History on Mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['searchHistory'], (result) => {
        if (result.searchHistory) setHistory(result.searchHistory);
      });
    }
  }, []);

  // 2. Save History Function
  const addToHistory = (term) => {
    // Remove duplicates, add to top, limit to 20 items
    const newHistory = [term, ...history.filter(h => h !== term)].slice(0, 20);
    setHistory(newHistory);
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ searchHistory: newHistory });
    }
  };

  // 3. Clear History Function
  const clearHistory = () => {
    setHistory([]);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove('searchHistory');
    }
  };

  // 4. Global Keyboard Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Stop if search is already open
      if (isOpen) return;

      // Stop if user is typing in a real input (like Settings inputs)
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      // Stop for special keys (Ctrl, Alt, Enter, etc)
      if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;

      // Trigger only on Alphanumeric keys (A-Z, 0-9)
      // We explicitly exclude Space (' ') to avoid accidental triggers when pausing video
      if (/^[a-zA-Z0-9]$/.test(e.key)) {
        setInitialChar(e.key); // Capture the first letter (e.g., 'y')
        setIsOpen(true);       // Open the overlay
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen]);

  return { 
    isOpen, 
    setIsOpen, 
    initialChar, 
    history, 
    addToHistory,
    clearHistory
  };
};
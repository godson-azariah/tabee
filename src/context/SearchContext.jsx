import React, { createContext, useContext, useState, useEffect } from 'react';

const SearchContext = createContext();

export const useSearch = () => useContext(SearchContext);

export const SearchProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialChar, setInitialChar] = useState(''); 
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // 1. Load History
  useEffect(() => {
    const saved = localStorage.getItem('zenSearchHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse search history", e);
      }
    }
  }, []);

  // 2. Add to History
  const addToHistory = (term) => {
    if (!term) return;
    setHistory(prev => {
      const newHistory = [term, ...prev.filter(h => h !== term)].slice(0, 5);
      localStorage.setItem('zenSearchHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // 3. FETCH SUGGESTIONS (Clean Version)
  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data && data[1]) {
        setSuggestions(data[1]);
      }
    } catch (err) {
      // Silently fail if permissions are missing (prevents console spam)
    }
  };

  // 4. Keyboard Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (isOpen) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9]/)) {
        setInitialChar(e.key);
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen]);

  return (
    <SearchContext.Provider value={{ 
      isOpen, 
      setIsOpen, 
      initialChar, 
      history, 
      addToHistory,
      suggestions,      
      fetchSuggestions, 
      setSuggestions    
    }}>
      {children}
    </SearchContext.Provider>
  );
};
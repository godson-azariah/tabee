import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, X, Clock, Sparkles } from 'lucide-react';
import { useSearch } from '../context/SearchContext';

export const SearchOverlay = () => {
  const { 
    isOpen, 
    setIsOpen, 
    initialChar, 
    history, 
    addToHistory, 
    suggestions, 
    fetchSuggestions,
    setSuggestions 
  } = useSearch();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);

  // 1. Initialize
  useEffect(() => {
    if (isOpen) {
      setQuery(initialChar);
      fetchSuggestions(initialChar);
      setSelectedIndex(-1);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
        }
      }, 10);
    } else {
      setQuery('');
      setSuggestions([]);
    }
  }, [isOpen, initialChar]);

  // 2. Handle Typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen && query) fetchSuggestions(query);
    }, 200); 
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // 3. Search Action
  const handleSearch = (textToSearch) => {
    if (!textToSearch.trim()) return;
    addToHistory(textToSearch);
    setIsOpen(false);
    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(textToSearch)}`;
  };

  // 4. Keyboard Navigation
  const handleKeyDown = (e) => {
    e.stopPropagation();
    const activeList = (query && suggestions.length > 0) ? suggestions : history;

    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && activeList[selectedIndex]) {
        handleSearch(activeList[selectedIndex]);
      } else {
        handleSearch(query);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < activeList.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
    }
  };

  const showSuggestions = query && suggestions.length > 0;
  const showHistory = !query && history.length > 0;
  const displayList = showSuggestions ? suggestions : (showHistory ? history : []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          // UPGRADE 1: Deep Creamy Blur (40px)
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(40px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[30vh] bg-black/40"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-full max-w-2xl relative px-4" 
            onClick={e => e.stopPropagation()}
          >
            {/* --- THE GLOSSY PILL --- */}
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative group"
            >
              {/* UPGRADE 2: The "Premium Glass" CSS */}
              <div className="flex items-center w-full h-16 px-6 
                bg-gradient-to-b from-white/10 to-black/40 
                backdrop-blur-3xl 
                border border-white/15 
                rounded-full 
                shadow-[0_20px_40px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.15)]
                transition-all duration-300 
                group-focus-within:border-white/30 
                group-focus-within:shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.3),0_0_30px_rgba(255,255,255,0.05)]"
              >
                
                <Search className="w-5 h-5 text-white/50 mr-4 drop-shadow-md" />
                
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent text-xl font-light text-white outline-none placeholder-white/20 drop-shadow-sm"
                  placeholder="Type to search..."
                  autoComplete="off"
                />
                
                {query && (
                  <button 
                    onClick={() => {
                      setQuery('');
                      setSuggestions([]);
                      inputRef.current?.focus();
                    }}
                    className="p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                )}
              </div>

              {/* --- DROPDOWN LIST --- */}
              {displayList.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 10, scale: 1 }}
                  // UPGRADE 3: Matching Frosted Glass for the List
                  className="absolute top-full left-4 right-4 mt-2 py-2 
                    bg-black/60 backdrop-blur-3xl 
                    border border-white/10 
                    rounded-2xl 
                    shadow-2xl overflow-hidden"
                >
                  <div className="px-4 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                    {showSuggestions ? (
                      <><Sparkles className="w-3 h-3" /> Suggestions</>
                    ) : (
                      <><Clock className="w-3 h-3" /> Recent</>
                    )}
                  </div>
                  
                  {displayList.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleSearch(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center px-4 py-3 cursor-pointer transition-all duration-200 ${
                        index === selectedIndex ? 'bg-white/10 pl-6' : 'hover:bg-white/5'
                      }`}
                    >
                      {showSuggestions ? (
                        <Search className={`w-3 h-3 mr-3 ${index === selectedIndex ? 'text-white' : 'text-white/30'}`} />
                      ) : (
                        <Clock className={`w-3 h-3 mr-3 ${index === selectedIndex ? 'text-white' : 'text-white/30'}`} />
                      )}
                      
                      <span className={`text-sm ${index === selectedIndex ? 'text-white' : 'text-white/60'}`}>
                        {item}
                      </span>
                      
                      {index === selectedIndex && (
                        <ArrowRight className="w-3 h-3 ml-auto text-white/50" />
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
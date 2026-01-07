import React from 'react';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { SearchProvider } from './context/SearchContext';
import { Wallpaper } from './components/Wallpaper';
import { HeroSection } from './components/HeroSection';
import { Settings } from './components/Settings';
import { SearchOverlay } from './components/SearchOverlay';

// Inner Component to handle Loading Logic
const AppContent = () => {
  const { loading } = useSettings();

  // 🛑 STOP: Show NOTHING until settings are fully loaded
  // This prevents the "Flash of Default Settings"
  if (loading) {
    return <div className="fixed inset-0 bg-black" />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Wallpaper />
      <HeroSection />
      <Settings />
      <SearchOverlay />
    </div>
  );
};

// Main App Wrapper
function App() {
  return (
    <SettingsProvider>
      <SearchProvider>
        <AppContent />
      </SearchProvider>
    </SettingsProvider>
  );
}

export default App;
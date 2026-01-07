import { useState, useEffect } from 'react';

export const useThemeColor = () => {
  const [browserColor, setBrowserColor] = useState('#000000');

  useEffect(() => {
    // Check if we are in the extension environment
    if (typeof chrome !== 'undefined' && chrome.theme) {
      
      // 1. Get the current theme
      chrome.theme.getCurrent((theme) => {
        if (theme && theme.colors && theme.colors.frame) {
          // Chrome returns colors as [r, g, b] array
          const [r, g, b] = theme.colors.frame;
          setBrowserColor(`rgb(${r}, ${g}, ${b})`);
        }
      });

      // 2. (Optional) Listen for theme changes if user changes Chrome settings
      // We skip this for minimal MVP, usually fetch-on-mount is enough.
    }
  }, []);

  return browserColor;
};
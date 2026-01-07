import React, { useEffect, useState, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { getWallpaper } from '../lib/db';

export const Wallpaper = () => {
  const { settings } = useSettings();
  const browserColor = useThemeColor();
  
  const [media, setMedia] = useState(null); 
  const videoRef = useRef(null);

  // 1. Load Custom Wallpaper from DB
  useEffect(() => {
    let active = true;

    const loadMedia = async () => {
      try {
        const file = await getWallpaper();
        if (file && active) {
          const url = URL.createObjectURL(file);
          const type = file.type.startsWith('video') ? 'video' : 'image';
          
          setMedia(prev => {
            if (prev?.url) URL.revokeObjectURL(prev.url);
            return { url, type };
          });
        }
      } catch (err) {
        console.error("Failed to load wallpaper:", err);
      }
    };

    loadMedia();

    return () => { active = false; };
  }, []); // Run once on mount

  // 2. Battery Saver
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!videoRef.current) return;
      if (document.hidden) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {}); 
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [media]);

  // 3. Render Logic
  // CASE A: Focus Mode is ON -> Show Solid Color
  if (settings.focusMode) {
    return (
      <div 
        className="fixed inset-0 z-0 transition-colors duration-500 ease-in-out"
        style={{ backgroundColor: browserColor }}
      />
    );
  }

  // CASE B: Focus Mode is OFF -> Show Wallpaper (or Fallback to Black)
  return (
    <div className="fixed inset-0 z-0 bg-black overflow-hidden">
      <div 
        className="absolute inset-0 transition-all duration-700 ease-out gpu"
        style={{ 
          filter: `blur(${settings.blurLevel}px) brightness(${100 - (settings.blurLevel / 2)}%)`,
          transform: 'scale(1.02)'
        }}
      >
        {media?.type === 'video' ? (
          <video
            ref={videoRef}
            src={media.url}
            autoPlay
            loop
            muted
            className="w-full h-full object-cover"
          />
        ) : media?.type === 'image' ? (
          <img 
            src={media.url} 
            alt="Wallpaper" 
            className="w-full h-full object-cover"
          />
        ) : (
          // Fallback if they turned off Focus Mode but haven't uploaded anything
          <div className="w-full h-full bg-[#111] flex items-center justify-center">
             <div className="text-white/20 font-light text-sm tracking-widest uppercase">
                Upload a Wallpaper in Settings
             </div>
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
    </div>
  );
};
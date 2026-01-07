import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import { useTime } from '../hooks/useTime';
import { Check } from 'lucide-react';

export const HeroSection = () => {
  const { settings, updateSettings, isDragMode, setIsDragMode, getClockColor } = useSettings();
  const { formatTime, formatDate, getAmPm } = useTime();
  
  const dragRef = useRef(null);
  const constraintsRef = useRef(null);

  if (!settings) return null;
  
  const xPos = settings.clockPosition?.x ?? 50;
  const yPos = settings.clockPosition?.y ?? 50;
  const size = settings.clockSize || 150;

  const hoursOpacity = settings.hoursOpacity ?? 1;
  const minutesOpacity = settings.minutesOpacity ?? 1;
  const layout = settings.clockLayout || 'horizontal';
  const font = settings.clockFont || 'Outfit';

  const handleDragEnd = (event, info) => {
    if (!dragRef.current) return;
    
    const rect = dragRef.current.getBoundingClientRect();
    const centerX = rect.left + (rect.width / 2);
    const centerY = rect.top + (rect.height / 2);
    
    const newX = (centerX / window.innerWidth) * 100;
    const newY = (centerY / window.innerHeight) * 100;
    
    updateSettings({ clockPosition: { x: newX, y: newY } });
  };

  if (!settings.clockShow && !isDragMode) return null;

  const timeString = formatTime(settings.clockFormat === '24h');
  const [rawHours, minutesStr] = timeString.split(':');
  const hoursStr = rawHours.padStart(2, '0');
  
  // COLOR LOGIC
  const baseColor = settings.clockColor || '#ffffff';
  // If clockColorMinutes is null, it falls back to baseColor (Both mode)
  const minutesColor = settings.clockColorMinutes || baseColor;

  const is12h = settings.clockFormat === '12h';

  const getTextStyle = (opacityVal, colorToUse) => ({
    fontFamily: `"${font}", sans-serif`,
    WebkitTextStroke: `2px ${colorToUse}`, 
    color: `color-mix(in srgb, ${colorToUse}, transparent ${100 - (opacityVal * 100)}%)`
  });

  return (
    <>
      <div ref={constraintsRef} className="absolute inset-0 pointer-events-none" />

      <div 
        style={{ 
          position: 'absolute', left: `${xPos}%`, top: `${yPos}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: isDragMode ? 50 : 10, pointerEvents: isDragMode ? 'auto' : 'none', 
        }}
      >
        <motion.div
          ref={dragRef}
          key={`${isDragMode}-${xPos}-${yPos}`} 
          dragConstraints={constraintsRef}
          drag={isDragMode}
          dragMomentum={false}
          dragElastic={0} 
          onDragEnd={handleDragEnd}
          
          className={`flex flex-col items-center justify-center select-none 
            ${isDragMode ? 'cursor-move ring-2 ring-white/50 rounded-xl bg-white/5 backdrop-blur-sm' : ''}
            ${isDragMode ? 'p-8' : ''} 
            ${(isDragMode && is12h && layout === 'horizontal') ? 'px-16' : ''}
          `}
        >
          <div className="flex flex-col items-center">
            
            {/* TIME ROW */}
            <div 
              className={`flex ${layout === 'vertical' ? 'flex-col items-center gap-2 leading-[0.85]' : 'flex-row items-baseline gap-6 leading-none'}`}
              style={{ fontSize: `${size}px` }}
            >
              {/* Hours - Inherits Base Color */}
              <span 
                className="font-[800] tracking-tighter lining-nums tabular-nums"
                style={getTextStyle(hoursOpacity, baseColor)}
              >
                {hoursStr}
              </span>

              {/* Separator */}
              {layout === 'horizontal' && (
                <span 
                  className="relative -top-[0.05em] opacity-80" 
                  style={{ color: baseColor, fontFamily: font }}
                >
                  :
                </span>
              )}

              {/* Minutes - Uses minutesColor (which might be override or base) */}
              <div className="relative">
                <span 
                  className="font-[800] tracking-tighter lining-nums tabular-nums block"
                  style={getTextStyle(minutesOpacity, minutesColor)}
                >
                  {minutesStr}
                </span>

                {/* AM/PM - Inherits Base Color */}
                {is12h && (
                  <span 
                    className="absolute top-0 left-full ml-3 text-[0.2em] font-bold tracking-wide whitespace-nowrap"
                    style={{ 
                      color: baseColor, opacity: 0.6, fontFamily: font, marginTop: '0.15em' 
                    }}
                  >
                    {getAmPm()}
                  </span>
                )}
              </div>
            </div>

            {/* Date - Inherits Base Color */}
            {settings.dateShow && (
              <div 
                className="mt-6 text-center"
                style={{ 
                  color: baseColor, fontFamily: font, fontSize: `${Math.max(12, size * 0.12)}px`,
                  letterSpacing: '0.3em', opacity: 0.8, fontWeight: 500, textTransform: 'uppercase',
                }}
              >
                {formatDate()}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isDragMode && (
          <motion.div
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-auto"
          >
            <button
              onClick={() => setIsDragMode(false)}
              className="flex items-center gap-3 px-8 py-3 bg-white text-black rounded-full font-bold shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform"
            >
              <Check className="w-5 h-5" /> Save Position
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
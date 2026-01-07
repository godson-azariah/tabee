import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings as SettingsIcon, X, Upload, Type, 
  Move, Moon, Sun, Pipette, Clock, Image as ImageIcon, RotateCcw
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { saveWallpaper } from '../lib/db';

const CLOCK_FONTS = [
  { name: 'Outfit', value: 'Outfit' },
  { name: 'Modern', value: 'Space Grotesk' },
  { name: 'Condensed', value: 'Oswald' },
  { name: 'Tech', value: 'JetBrains Mono' },
  { name: 'Artistic', value: 'Syne' },
  { name: 'Retro', value: 'Righteous' },
  { name: 'Classic', value: 'Inter' },
];

const PRESET_COLORS = [
  { name: 'Pure White', value: '#ffffff' },
  { name: 'Cream', value: '#f5f5dc' },
  { name: 'Gold', value: '#ffd700' },
  { name: 'Rose Gold', value: '#b76e79' },
  { name: 'Silver', value: '#c0c0c0' },
  { name: 'Matte Black', value: '#1a1a1a' },
];

// --- Color Helpers ---
const rgbToHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) h = s = 0; 
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hexToRgb = (hex) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]); g = parseInt("0x" + hex[2] + hex[2]); b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]); g = parseInt("0x" + hex[3] + hex[4]); b = parseInt("0x" + hex[5] + hex[6]);
  }
  return { r, g, b };
};

const parseColorToHsla = (str) => {
  if (!str) return { h: 0, s: 0, l: 100, a: 1 };
  str = str.trim().toLowerCase();
  if (str.startsWith('#')) {
    const { r, g, b } = hexToRgb(str);
    const { h, s, l } = rgbToHsl(r, g, b);
    return { h, s, l, a: 1 };
  }
  if (str.startsWith('hsl')) {
    const nums = str.match(/[\d.]+/g)?.map(Number);
    if (!nums) return { h: 0, s: 0, l: 100, a: 1 };
    return { h: nums[0]||0, s: nums[1]||0, l: nums[2]||0, a: nums[3]!==undefined ? nums[3] : 1 };
  }
  if (str.startsWith('rgb')) {
    const nums = str.match(/[\d.]+/g)?.map(Number);
    if (!nums) return { h: 0, s: 0, l: 100, a: 1 };
    const { h, s, l } = rgbToHsl(nums[0], nums[1], nums[2]);
    return { h, s, l, a: nums[3] !== undefined ? nums[3] : 1 };
  }
  return { h: 0, s: 0, l: 100, a: 1 };
};

export const Settings = () => {
  const { settings, updateSettings, setIsDragMode } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('clock'); 
  const [uploading, setUploading] = useState(false);
  
  const [colorTarget, setColorTarget] = useState('both'); // 'both' | 'minutes'
  const [hsla, setHsla] = useState({ h: 0, s: 100, l: 100, a: 1 });
  
  const fileInputRef = useRef(null);
  const isDark = settings.settingsTheme === 'dark';

  // 1. Determine active color string
  const currentColorString = colorTarget === 'minutes' 
    ? (settings.clockColorMinutes || settings.clockColor) 
    : settings.clockColor;

  // 2. Sync Slider with Store (with lag prevention)
  useEffect(() => {
    const parsed = parseColorToHsla(currentColorString || '#ffffff');
    if (
      Math.abs(parsed.h - hsla.h) > 1 || 
      Math.abs(parsed.s - hsla.s) > 1 || 
      Math.abs(parsed.l - hsla.l) > 1 ||
      Math.abs(parsed.a - hsla.a) > 0.05
    ) {
      setHsla(parsed);
    }
  }, [currentColorString, colorTarget]);

  const updateColor = (newHsla) => {
    setHsla(newHsla); 
    const colorString = `hsla(${newHsla.h}, ${newHsla.s}%, ${newHsla.l}%, ${newHsla.a})`;
    
    if (colorTarget === 'both') {
      updateSettings({ 
        clockColor: colorString,
        clockColorMinutes: null // Clear override
      });
    } else {
      updateSettings({ 
        clockColorMinutes: colorString // Set override
      });
    }
  };

  const handleEyedropper = async () => {
    if (!window.EyeDropper) return alert("Browser not supported");
    setIsOpen(false); 
    await new Promise(r => setTimeout(r, 300)); 
    try {
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open(); 
      updateColor(parseColorToHsla(result.sRGBHex));
    } catch (e) {} finally { setIsOpen(true); }
  };

  const resetMinutes = () => {
    updateSettings({ clockColorMinutes: null });
  };

  const panelClass = isDark ? 'bg-black/80 border-white/10 text-white' : 'bg-white/80 border-black/5 text-black';
  const itemBg = isDark ? 'bg-white/5 hover:bg-white/10 border-white/5' : 'bg-black/5 hover:bg-black/10 border-black/5';
  const sliderClass = "w-full h-3 rounded-full appearance-none outline-none cursor-grab active:cursor-grabbing touch-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125";

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try { await saveWallpaper(file); window.location.reload(); } 
    catch (err) { console.error(err); } 
    finally { setUploading(false); }
  };

  const toggleTheme = () => updateSettings({ settingsTheme: isDark ? 'light' : 'dark' });

  const ToggleItem = ({ label, value, onChange, subLabel }) => (
    <div 
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer select-none transition-colors ${itemBg}`}
    >
      <div>
        <div className="text-sm font-medium">{label}</div>
        {subLabel && <div className="text-xs opacity-50">{subLabel}</div>}
      </div>
      <div className={`w-12 h-6 rounded-full relative transition-colors ${value ? (isDark ? 'bg-white' : 'bg-black') : 'bg-gray-500/30'}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 ${value ? 'left-7' : 'left-1'} ${isDark ? 'bg-black' : 'bg-white'}`} />
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 p-4 rounded-full shadow-2xl transition-all duration-300 z-40 group backdrop-blur-md border border-white/10 ${isDark ? 'bg-black/40 text-white hover:bg-white hover:text-black' : 'bg-white/40 text-black hover:bg-black hover:text-white'} hover:scale-110`}
      >
        <SettingsIcon className="w-6 h-6 transition-transform duration-500 group-hover:rotate-90" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`fixed top-0 right-0 h-full w-full max-w-[420px] backdrop-blur-2xl border-l z-50 shadow-2xl flex flex-col ${panelClass}`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/10' : 'border-black/5'}`}>
                <h2 className="text-xl font-light">Configuration</h2>
                <div className="flex gap-2">
                  <button onClick={toggleTheme} className={`p-2 rounded-full border ${itemBg}`}>{isDark ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}</button>
                  <button onClick={() => setIsOpen(false)} className={`p-2 rounded-full border ${itemBg}`}><X className="w-4 h-4"/></button>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-6 pt-6 pb-2">
                <div className={`flex p-1 rounded-2xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-white/20 border-black/5'}`}>
                  <button onClick={() => setActiveTab('clock')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all flex flex-col items-center gap-1 ${activeTab === 'clock' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : 'opacity-50 hover:opacity-100'}`}>
                    <Clock className="w-4 h-4" /> Clock
                  </button>
                  <button onClick={() => setActiveTab('wallpaper')} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all flex flex-col items-center gap-1 ${activeTab === 'wallpaper' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : 'opacity-50 hover:opacity-100'}`}>
                    <ImageIcon className="w-4 h-4" /> Wallpaper
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                {/* === CLOCK TAB === */}
                {activeTab === 'clock' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    
                    {/* Position Button */}
                    <button 
                      onClick={() => { setIsOpen(false); setIsDragMode(true); }} 
                      className={`w-full py-4 rounded-xl border border-dashed flex items-center justify-center gap-3 transition-all ${isDark ? 'border-white/20 hover:border-white' : 'border-black/20 hover:border-black'}`}
                    >
                      <Move className="w-4 h-4" /> <span className="text-sm font-medium">Reposition Clock</span>
                    </button>

                    {/* Color Studio */}
                    <div className={`p-5 rounded-2xl border space-y-5 ${itemBg}`}>
                      <div className="flex items-center justify-between">
                         <label className="text-xs font-bold opacity-60">Color Studio</label>
                         <button onClick={handleEyedropper} className="p-2 rounded hover:bg-white/10"><Pipette className="w-4 h-4"/></button>
                      </div>

                      {/* TARGET SELECTOR */}
                      <div className={`flex p-1 rounded-lg border ${isDark ? 'bg-black/20 border-white/5' : 'bg-white/20 border-black/5'}`}>
                        <button 
                          onClick={() => setColorTarget('both')} 
                          className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${colorTarget === 'both' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : 'opacity-50 hover:opacity-100'}`}
                        >
                          Both
                        </button>
                        <button 
                          onClick={() => setColorTarget('minutes')} 
                          className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${colorTarget === 'minutes' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : 'opacity-50 hover:opacity-100'}`}
                        >
                          Minutes
                        </button>
                      </div>

                      {/* Presets */}
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map(c => (
                          <button key={c.name} onClick={() => updateColor(parseColorToHsla(c.value))} className="w-6 h-6 rounded-full border border-white/20" style={{backgroundColor: c.value}} />
                        ))}
                      </div>

                      {/* Sliders */}
                      <input type="range" min="0" max="360" value={hsla.h} onChange={(e) => updateColor({ ...hsla, h: Number(e.target.value) })} className={sliderClass} style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }} />
                      <input type="range" min="0" max="100" value={hsla.s} onChange={(e) => updateColor({ ...hsla, s: Number(e.target.value) })} className={sliderClass} style={{ background: `linear-gradient(to right, hsl(${hsla.h}, 0%, ${hsla.l}%), hsl(${hsla.h}, 100%, ${hsla.l}%))` }} />
                      <input type="range" min="0" max="100" value={hsla.l} onChange={(e) => updateColor({ ...hsla, l: Number(e.target.value) })} className={sliderClass} style={{ background: `linear-gradient(to right, black, hsl(${hsla.h}, ${hsla.s}%, 50%), white)` }} />
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold opacity-40 uppercase w-12">Opacity</span>
                        <input type="range" min="0" max="1" step="0.01" value={hsla.a} onChange={(e) => updateColor({ ...hsla, a: Number(e.target.value) })} className={sliderClass} style={{ background: `linear-gradient(to right, transparent, ${currentColorString})` }} />
                      </div>

                      {/* RESET BUTTON */}
                      {colorTarget === 'minutes' && settings.clockColorMinutes && (
                        <button 
                          onClick={resetMinutes}
                          className={`w-full py-2 flex items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-black'}`}
                        >
                          <RotateCcw className="w-3 h-3" /> Reset Minutes to match Hours
                        </button>
                      )}
                    </div>

                    <ToggleItem 
                      label="Vertical Layout" 
                      subLabel={settings.clockLayout === 'vertical' ? 'Stacked Time' : 'Standard Line'}
                      value={settings.clockLayout === 'vertical'}
                      onChange={(val) => updateSettings({ clockLayout: val ? 'vertical' : 'horizontal' })}
                    />

                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-bold opacity-50 block">Typography Style</label>
                      <div className="grid grid-cols-2 gap-2">
                        {CLOCK_FONTS.map((f) => (
                          <button
                            key={f.value}
                            onClick={() => updateSettings({ clockFont: f.value })}
                            className={`p-3 rounded-xl border text-sm text-center transition-all ${
                              (settings.clockFont || 'Outfit') === f.value
                                ? (isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black')
                                : `${itemBg} opacity-60 hover:opacity-100`
                            }`}
                            style={{ fontFamily: f.value }}
                          >
                            {f.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border ${itemBg}`}>
                      <div className="flex justify-between text-xs font-medium mb-3 opacity-60"><span>Size</span><span>{settings.clockSize}px</span></div>
                      <input type="range" min="50" max="400" value={settings.clockSize} onChange={(e) => updateSettings({ clockSize: Number(e.target.value) })} className={`${sliderClass} bg-white/10`} />
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => updateSettings({ clockFormat: settings.clockFormat === '12h' ? '24h' : '12h' })} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${settings.clockFormat === '24h' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : `${itemBg} border-transparent opacity-60 hover:opacity-100`}`}>{settings.clockFormat === '24h' ? '24H' : '12H'}</button>
                      <button onClick={() => updateSettings({ dateShow: !settings.dateShow })} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${settings.dateShow ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : `${itemBg} border-transparent opacity-60 hover:opacity-100`}`}>DATE</button>
                    </div>

                    <section className={`p-4 rounded-2xl border space-y-4 ${itemBg}`}>
                       <label className="text-[10px] uppercase font-bold opacity-50 flex items-center gap-2">
                         <Type className="w-3 h-3" /> Wireframe Opacity
                       </label>
                       <div>
                         <div className="flex justify-between text-xs opacity-70 mb-1"><span>Hours Fill</span> <span>{Math.round((settings.hoursOpacity ?? 1) * 100)}%</span></div>
                         <input type="range" min="0" max="1" step="0.1" value={settings.hoursOpacity ?? 1} onChange={e => updateSettings({ hoursOpacity: parseFloat(e.target.value) })} className={`${sliderClass} bg-white/20`} />
                       </div>
                       <div>
                         <div className="flex justify-between text-xs opacity-70 mb-1"><span>Minutes Fill</span> <span>{Math.round((settings.minutesOpacity ?? 1) * 100)}%</span></div>
                         <input type="range" min="0" max="1" step="0.1" value={settings.minutesOpacity ?? 1} onChange={e => updateSettings({ minutesOpacity: parseFloat(e.target.value) })} className={`${sliderClass} bg-white/20`} />
                       </div>
                    </section>
                  </div>
                )}

                {/* === WALLPAPER TAB === */}
                {activeTab === 'wallpaper' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <ToggleItem 
                      label="Focus Mode" 
                      subLabel={settings.focusMode ? 'Elements Hidden' : 'All Visible'}
                      value={settings.focusMode}
                      onChange={(val) => updateSettings({ focusMode: val })}
                    />
                    <div className="w-full h-px bg-white/10 my-2" />
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/mp4,video/webm" onChange={handleFileChange} />
                    <div className="space-y-2">
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className={`w-full py-8 rounded-xl border border-dashed flex flex-col items-center justify-center transition-all group ${isDark ? 'border-white/20 hover:border-white/50' : 'border-black/20 hover:border-black/50'}`}>
                        <Upload className="w-8 h-8 mb-2 opacity-50 group-hover:opacity-100" />
                        <span className="text-sm font-medium opacity-60">{uploading ? 'Processing...' : 'Upload New Wallpaper'}</span>
                        </button>
                        <p className="text-[10px] text-center opacity-40">Supported: JPG, PNG, GIF, MP4, WEBM (Max 50MB)</p>
                    </div>
                    <div className={`p-4 rounded-2xl border ${itemBg}`}>
                      <div className="flex justify-between text-xs font-medium mb-3 opacity-60"><span>Blur Intensity</span><span>{settings.blurLevel * 2}%</span></div>
                      <input type="range" min="0" max="50" value={settings.blurLevel} onChange={(e) => updateSettings({ blurLevel: Number(e.target.value) })} className={`${sliderClass} bg-white/10`} />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
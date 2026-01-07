import { useState, useEffect } from 'react';

export const useTime = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Time (e.g., "10:45")
  const formatTime = (is24Hour) => {
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    if (!is24Hour) {
      hours = hours % 12 || 12; // Convert 0 to 12
    } else {
      hours = hours.toString().padStart(2, '0');
    }
    
    return `${hours}:${minutes}`;
  };

  // Format Date (e.g., "MONDAY, JAN 05")
  const formatDate = () => {
    const options = { weekday: 'long', month: 'short', day: '2-digit' };
    return now.toLocaleDateString('en-US', options).toUpperCase();
  };

  // Get AM/PM (for 12h mode)
  const getAmPm = () => {
    return now.getHours() >= 12 ? 'PM' : 'AM';
  };

  return { 
    time: now, 
    formatTime, 
    formatDate,
    getAmPm 
  };
};
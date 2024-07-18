import React, { createContext, useState, useContext } from 'react';

const ScreenReaderContext = createContext();

export const useScreenReader = () => {
  return useContext(ScreenReaderContext);
};

export const ScreenReaderProvider = ({ children }) => {
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  const toggleScreenReader = () => {
    setScreenReaderEnabled(!screenReaderEnabled);
    // Logic to enable or disable the screen reader functionality
    if (!screenReaderEnabled) {
      console.log('Screen reader enabled');
    } else {
      console.log('Screen reader disabled');
    }
  };

  return (
    <ScreenReaderContext.Provider value={{ screenReaderEnabled, toggleScreenReader }}>
      {children}
    </ScreenReaderContext.Provider>
  );
};

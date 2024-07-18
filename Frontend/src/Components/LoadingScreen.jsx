// LoadingScreen.jsx
import React, { useState, useEffect } from 'react';
import { useDarkMode } from './DarkModeContext';
import logo from "../images/logo.png";

const LoadingScreen = () => {
  const { darkMode } = useDarkMode();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => (prevProgress < 100 ? prevProgress + 10 : 100));
    }, 200); // Adjust the interval duration as needed

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center justify-center h-screen ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
      <div className="flex flex-col items-center">
        <div className='flex mb-4 flex-grow animate-pulse items-center justify-center'>
            <p className={`  text-xl md:text-3xl  font-extrabold ${darkMode ?'text-white' : 'text:white'}`} >MailFend</p>

        <img src={logo} alt="Logo" className="h-10 md:h-18  " />

        </div>
  
        <div className="w-64 bg-gray-200 rounded-full">
          <div
            className={`bg-blue-500 text-xs leading-none py-1 text-center text-white rounded-full`}
            style={{ width: `${progress}%` }}
          >
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

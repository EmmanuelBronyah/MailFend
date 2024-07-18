import React from 'react';
import logo from '../images/logo.png';
import { useDarkMode } from './DarkModeContext';
import { useScreenReader } from './ScreenReaderContext';
import { Brightness4, Brightness7, Hearing, HearingDisabled } from '@mui/icons-material';

const Navbar = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { screenReaderEnabled, toggleScreenReader } = useScreenReader();

  return (
    <nav className={`bg-black overflow-hidden flex-col md:flex-row px-4 transition-all duration-300 text-center p-2 shadow-lg flex items-center justify-between`}>
      <div className="flex items-center">
        <h1 className="text-white flex text-base md:text-lg items-center">
          MailFend
          <img className="md:h-10 h-7 ml-2" src={logo} alt="Logo" />
        </h1>
      </div>
      <div className="text-white flex-col md:flex-row space-y-2 md:space-y-0 flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <button onClick={toggleScreenReader} className="focus:outline-none text-white flex items-center">
            <span className="text-sm ml-1">{screenReaderEnabled ? 'Screen Reader On' : 'Screen Reader Off'}</span>
            {screenReaderEnabled ? <Hearing style={{ color: 'lightgreen' }} /> : <HearingDisabled style={{ color: 'coral' }} />}
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-white">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          <button onClick={toggleDarkMode} className="focus:outline-none text-white">
            {darkMode ? <Brightness7 style={{ color: 'yellow' }} /> : <Brightness4 style={{ color: 'gray' }} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

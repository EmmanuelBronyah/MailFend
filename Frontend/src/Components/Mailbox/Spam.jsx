import React from 'react';
import { Report } from '@mui/icons-material';
import { useDarkMode } from '../DarkModeContext';

const Spam = ({ activeMailbox, setActiveMailbox }) => {
  const { darkMode } = useDarkMode();

  return (
    <li
      onClick={() => setActiveMailbox('Spam')}
      className={`flex items-center p-2 cursor-pointer ${
        activeMailbox === 'Spam'
          ? 'bg-blue-500 text-white'
          : `${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-200 text-black'}`
      } ${activeMailbox === 'Spam' && 'text-black'}`}
    >
      <Report className="mr-2" />
      Spam
    </li>
  );
};

export default Spam;

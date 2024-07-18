import React from 'react';
import { Star } from '@mui/icons-material';
import { useDarkMode } from '../DarkModeContext';

const Starred = ({ activeMailbox, setActiveMailbox }) => {
  const { darkMode } = useDarkMode();
  const isActive = activeMailbox === 'Starred';

  return (
    <li
      className={`flex items-center p-2 cursor-pointer rounded-md ${
        isActive ? 'bg-blue-500 text-white' : darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
      } ${darkMode ? 'text-white' : 'text-black'}`}
      onClick={() => setActiveMailbox('Starred')}
    >
      <Star className={`mr-2 ${isActive ? 'text-white' : darkMode ? 'text-white' : 'text-gray-800'}`} />
      <span className="">Starred</span>
    </li>
  );
};

export default Starred;

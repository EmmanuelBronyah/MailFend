import React from 'react';
import { Delete } from '@mui/icons-material';
import { useDarkMode } from '../DarkModeContext';

const Trash = ({ activeMailbox, setActiveMailbox }) => {
  const { darkMode } = useDarkMode();

  return (
    <li
      onClick={() => setActiveMailbox('Trash')}
      className={`flex items-center p-2 cursor-pointer ${
        activeMailbox === 'Trash'
          ? 'bg-blue-500 text-white'
          : `${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-200 text-black'}`
      } ${activeMailbox === 'Trash' && 'text-black'}`}
    >
      <Delete className="mr-2" />
      Trash
    </li>
  );
};

export default Trash;

import React from 'react';
import { Drafts as DraftsIcon } from '@mui/icons-material';
import { useDarkMode } from '../DarkModeContext';

const Drafts = ({ activeMailbox, setActiveMailbox }) => {
  const { darkMode } = useDarkMode();
  const isActive = activeMailbox === 'Drafts';

  return (
    <li
      className={`flex items-center p-2 cursor-pointer rounded-md ${
        isActive ? 'bg-blue-500 text-white' : darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
      } ${darkMode ? 'hover:text-black' : 'hover:text-gray-700'}`}
      onClick={() => setActiveMailbox('Drafts')}
    >
      <DraftsIcon />
      <span className="ml-2">Drafts</span>
    </li>
  );
};

export default Drafts;

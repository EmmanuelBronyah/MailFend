// Mailbox/Sent.jsx
import React from 'react';
import { Send as SentIcon } from '@mui/icons-material';
import { useDarkMode } from '../DarkModeContext';

const Sent = ({ activeMailbox, setActiveMailbox }) => {
  const { darkMode } = useDarkMode();
  const isActive = activeMailbox === 'Sent';

  return (
    <li
      className={`flex items-center p-2 cursor-pointer rounded-md ${
        isActive ? 'bg-blue-500 text-white' : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
      }`}
      onClick={setActiveMailbox}
    >
      <SentIcon className="mr-2" />
      <span>Sent</span>
    </li>
  );
};

export default Sent;

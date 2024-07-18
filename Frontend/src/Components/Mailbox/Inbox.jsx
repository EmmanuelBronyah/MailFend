// Mailbox/Inbox.jsx
import React from 'react';
import { Inbox as InboxIcon } from '@mui/icons-material';
import { useDarkMode } from '../DarkModeContext';

const Inbox = ({ activeMailbox, setActiveMailbox }) => {
  const { darkMode } = useDarkMode();
  const isActive = activeMailbox === 'Inbox';

  return (
    <li
      className={`flex items-center p-2 cursor-pointer rounded-md ${
        isActive ? 'bg-blue-500 text-white' : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
      }`}
      onClick={setActiveMailbox}
    >
      <InboxIcon className="mr-2" />
      <span>Inbox</span>
    </li>
  );
};

export default Inbox;

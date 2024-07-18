import React, { useState } from 'react';
import Inbox from './Mailbox/Inbox';
import Starred from './Mailbox/Starred';
import Sent from './Mailbox/Sent';
import Drafts from './Mailbox/Drafts';
import Spam from './Mailbox/Spam';
import Trash from './Mailbox/Trash';
import ComposeButton from './Compose';
import { useDarkMode } from './DarkModeContext';

const Sidebar = ({ onComposeClick, setCurrentMailbox }) => {
  const { darkMode } = useDarkMode();
  const [activeMailbox, setActiveMailbox] = useState('Inbox');

  const handleMailboxClick = (mailbox) => {
    setActiveMailbox(mailbox);
    setCurrentMailbox(mailbox);
  };

  return (
    <div className={`h-full md:w-60 w-full md:h-screen shadow-md p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'} min-w-max`}>
      <ComposeButton onComposeClick={onComposeClick} />
      <ul className="mt-4 space-y-2">
        <Inbox activeMailbox={activeMailbox} setActiveMailbox={() => handleMailboxClick('Inbox')} />
        <Starred activeMailbox={activeMailbox} setActiveMailbox={() => handleMailboxClick('Starred')} />
        <Sent activeMailbox={activeMailbox} setActiveMailbox={() => handleMailboxClick('Sent')} />
        <Drafts activeMailbox={activeMailbox} setActiveMailbox={() => handleMailboxClick('Drafts')} />
        <Spam activeMailbox={activeMailbox} setActiveMailbox={() => handleMailboxClick('Spam')} />
        <Trash activeMailbox={activeMailbox} setActiveMailbox={() => handleMailboxClick('Trash')} />
      </ul>
    </div>
  );
};

export default Sidebar;

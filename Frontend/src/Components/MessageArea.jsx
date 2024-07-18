import React, { useState } from 'react';
import { useDarkMode } from './DarkModeContext';
import { Delete as DeleteIcon, Star as StarIcon, StarBorder as StarBorderIcon } from '@mui/icons-material';
import { Inbox, LocalOffer, People } from '@mui/icons-material';

const sampleEmails = [
  {
    id: 2,
    mailbox: 'Inbox',
    category: 'Primary',
    sender: 'John Doe',
    subject: 'Meeting Reminder',
    snippet: 'Don\'t forget about our meeting tomorrow at 10am.',
    time: '9:30 AM',
    starred: false,
  },
  {
    id: 1,
    mailbox: 'Inbox',
    category: 'Primary',
    sender: 'John Doe',
    subject: 'Meeting Reminder',
    snippet: 'Don\'t forget about our meeting tomorrow at 10am.',
    time: '9:30 AM',
    starred: false,
  },
  {
    id: 2,
    mailbox: 'Inbox',
    category: 'Promotions',
    sender: 'Jane Smith',
    subject: 'Project Update',
    snippet: 'Here is the latest update on the project.',
    time: '8:45 AM',
    starred: false,
  },
  {
    id: 3,
    mailbox: 'Inbox',
    category: 'Social',
    sender: 'Alice Johnson',
    subject: 'New Event',
    snippet: 'You are invited to a new event.',
    time: '7:30 AM',
    starred: true,
  },
];

const MessageArea = ({ currentMailbox }) => {
  const { darkMode } = useDarkMode();
  const [emails, setEmails] = useState(sampleEmails);
  const [activeTab, setActiveTab] = useState('Primary');

  const handleStarToggle = (emailId) => {
    setEmails((prevEmails) =>
      prevEmails.map((email) =>
        email.id === emailId ? { ...email, starred: !email.starred } : email
      )
    );
  };

  const handleDelete = (emailId) => {
    setEmails((prevEmails) =>
      prevEmails.map((email) =>
        email.id === emailId ? { ...email, mailbox: 'Trash' } : email
      )
    );
  };

  const handlePermanentDelete = (emailId) => {
    setEmails((prevEmails) => prevEmails.filter((email) => email.id !== emailId));
  };

  const filteredEmails = emails.filter((email) => {
    if (currentMailbox === 'Inbox') {
      return email.mailbox === 'Inbox';
    } else if (currentMailbox === 'Starred') {
      return email.starred;
    } else if (currentMailbox === 'Trash') {
      return email.mailbox === 'Trash';
    } else {
      return email.mailbox === currentMailbox;
    }
  });

  const groupedEmails = (category) => filteredEmails.filter((email) => email.category === category);

  const renderEmails = (emailsToRender) => (
    emailsToRender.length === 0 ? (
      <p>No messages in {currentMailbox}.</p>
    ) : (
      emailsToRender.map((email) => (
        <div key={email.id} className="border-b border-gray-300 p-4 flex justify-between items-center">
          <div>
            <h3 className="font-bold">{email.sender}</h3>
            <p className="text-sm text-gray-500">{email.subject}</p>
            <p className="text-sm">{email.snippet}</p>
            <span className="text-xs text-gray-400">{email.time}</span>
          </div>
          <div className="flex items-center">
            <button onClick={() => handleStarToggle(email.id)} className="mr-2">
              {email.starred ? <StarIcon className="text-yellow-500" style={{ fontSize: 24 }} /> : <StarBorderIcon className="text-gray-500" style={{ fontSize: 24 }} />}
            </button>
            {currentMailbox === 'Trash' ? (
              <button onClick={() => handlePermanentDelete(email.id)} className="mr-2">
                <DeleteIcon className="text-red-500" style={{ fontSize: 24 }} />
              </button>
            ) : (
              <button onClick={() => handleDelete(email.id)} className="mr-2">
                <DeleteIcon className="text-red-500" style={{ fontSize: 24 }} />
              </button>
            )}
          </div>
        </div>
      ))
    )
  );

  return (
    <div className={`flex-1 p-4 shadow-md transition-all duration-300 overflow-auto ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'}`}>
      {currentMailbox === 'Inbox' && (
        <div>
          <div className="mb-4 flex md:flex-row justify-between space-y-2 md:space-y-0 flex-col">
            <div className={`cursor-pointer flex items-center ${activeTab === 'Primary' && 'border-b-2 border-blue-500'}`} onClick={() => setActiveTab('Primary')}>
              <Inbox className="mr-2" style={{ color: 'blue' }} />
              <h2 className="font-bold text-lg">Primary</h2>
            </div>
            <div className={`cursor-pointer flex items-center ${activeTab === 'Promotions' && 'border-b-2 border-green-500'}`} onClick={() => setActiveTab('Promotions')}>
              <LocalOffer className="mr-2" style={{ color: 'green' }} />
              <h2 className="font-bold text-lg">Promotions</h2>
            </div>
            <div className={`cursor-pointer flex items-center ${activeTab === 'Social' && 'border-b-2 border-red-500'}`} onClick={() => setActiveTab('Social')}>
              <People className="mr-2" style={{ color: 'red' }} />
              <h2 className="font-bold text-lg">Social</h2>
            </div>
          </div>
          <div>
            {activeTab === 'Primary' && renderEmails(groupedEmails('Primary'))}
            {activeTab === 'Promotions' && renderEmails(groupedEmails('Promotions'))}
            {activeTab === 'Social' && renderEmails(groupedEmails('Social'))}
          </div>
        </div>
      )}
      {currentMailbox !== 'Inbox' && renderEmails(filteredEmails)}
    </div>
  );
};

export default MessageArea;

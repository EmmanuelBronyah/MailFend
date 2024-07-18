// components/Message.jsx
import React from 'react';
import { IconButton } from '@mui/material';
import { Star, StarBorder, Delete } from '@mui/icons-material';
import { useDarkMode } from './DarkModeContext';

const Message = ({ message, onStarToggle, onDelete }) => {
  const { darkMode } = useDarkMode();

  return (
    <div className={`p-4 mb-2 border rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-bold">{message.subject}</h4>
          <p>{message.sender}</p>
        </div>
        <div>
          <IconButton onClick={() => onStarToggle(message.id)}>
            {message.starred ? <Star className="text-yellow-500" /> : <StarBorder className={`${darkMode ? 'text-white' : 'text-black'}`} />}
          </IconButton>
          {onDelete && (
            <IconButton onClick={() => onDelete(message.id)}>
              <Delete className={`${darkMode ? 'text-white' : 'text-black'}`} />
            </IconButton>
          )}
        </div>
      </div>
      <p>{message.body}</p>
    </div>
  );
};

export default Message;

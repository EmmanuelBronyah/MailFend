import React from 'react';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useDarkMode } from './DarkModeContext';

const ComposeButton = ({ onComposeClick }) => {
  const { darkMode } = useDarkMode();

  return (
    <div className="compose-button-container mb-4">
      <Button 
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        className={`w-full md:w-auto ${darkMode ? 'bg-gray-700 text-white' : 'bg-blue-500 text-white'}`}
        onClick={onComposeClick}
      >
        Compose
      </Button>
    </div>
  );
};

export default ComposeButton;

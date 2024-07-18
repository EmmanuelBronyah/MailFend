import React from 'react';
import { Search, FilterList } from '@mui/icons-material';
import { useDarkMode } from './DarkModeContext';

const SearchBar = () => {
  const { darkMode } = useDarkMode();

  return (
    <div className={`p-3 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} flex items-center justify-center`}>
      <div className={`flex w-full max-w-4xl items-center py-2 px-4 shadow-md rounded-full ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
        <Search className={`cursor-pointer ${darkMode ? 'text-white' : 'text-black'}`} />
        <input
          type="text"
          placeholder="Search mail"
          className={`ml-2 bg-transparent focus:outline-none ${darkMode ? 'text-white' : 'text-black'} flex-grow`}
        />
        <FilterList className={`cursor-pointer ${darkMode ? 'text-white' : 'text-black'}`} />
      </div>
    </div>
  );
};

export default SearchBar;

import React, { useState } from 'react';
import { useDarkMode } from './DarkModeContext';
import { Button, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';

const ComposeArea = ({ onClose }) => {
  const { darkMode } = useDarkMode();
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);

  const handleAttachment = (e) => {
    const files = Array.from(e.target.files);
    setAttachments([...attachments, ...files]);
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className={`fixed bottom-0 right-0 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} shadow-lg rounded-t-lg w-full md:w-1/2 lg:w-1/3 p-4 transition-all duration-300`}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">New Message</h2>
        <IconButton onClick={onClose} className={`text-${darkMode ? 'white' : 'black'}`}>
          <CloseIcon />
        </IconButton>
      </div>
      <div className="flex flex-col space-y-2">
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="To"
          className={`p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'} focus:outline-none`}
        />
        <input
          type="email"
          value={cc}
          onChange={(e) => setCc(e.target.value)}
          placeholder="Cc"
          className={`p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'} focus:outline-none`}
        />
        <input
          type="email"
          value={bcc}
          onChange={(e) => setBcc(e.target.value)}
          placeholder="Bcc"
          className={`p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'} focus:outline-none`}
        />
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className={`p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'} focus:outline-none`}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Compose email"
          rows="6"
          className={`p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'} focus:outline-none resize-none`}
        />
        <div className="flex items-center space-x-2">
          <label htmlFor="file-upload" className="flex items-center cursor-pointer">
            <AttachFileIcon className={`${darkMode ? 'text-white' : 'text-black'}`} />
            <input
              id="file-upload"
              type="file"
              multiple
              onChange={handleAttachment}
              className="hidden"
            />
            <span className="ml-1">Attach files</span>
          </label>
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center space-x-1">
              <span className="text-sm truncate">{file.name}</span>
              <IconButton size="small" onClick={() => handleRemoveAttachment(index)}>
                <CloseIcon className={`${darkMode ? 'text-white' : 'text-black'}`} />
              </IconButton>
            </div>
          ))}
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="contained" className={`bg-red-500 text-white`} onClick={onClose}>Discard</Button>
          <Button variant="contained" className={`bg-blue-500 text-white`}>Send</Button>
        </div>
      </div>
    </div>
  );
};

export default ComposeArea;

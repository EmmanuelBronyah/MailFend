import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import MessageArea from './MessageArea';
import ComposeArea from './ComposeArea';
import SearchBar from './Search';
import LoadingScreen from './LoadingScreen';
import { useScreenReader } from './ScreenReaderContext'; // Import the useScreenReader hook
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'; // Import SpeechRecognition
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

const HomePage = () => {
  const { screenReaderEnabled } = useScreenReader(); // Use the useScreenReader hook
  const navigate = useNavigate(); // Initialize useNavigate
  const { transcript, resetTranscript } = useSpeechRecognition(); // Initialize SpeechRecognition
  const [isComposing, setIsComposing] = useState(false);
  const [currentMailbox, setCurrentMailbox] = useState('Inbox');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (screenReaderEnabled) {
      
      announceSequence();
    } else {
    
      stopSpeaking();
    }
  }, [screenReaderEnabled]);

  const announceSequence = () => {
    
    speak("Welcome to MailFend's homepage. What would you like to do?", () => {
      
      speak("You can say one of the following options: Inbox, Starred, Sent, Drafts, Spam, Trash, or Compose a message.", startListeningForResponse);
    });
  };

  const startListeningForResponse = () => {
    setTimeout(() => {
      SpeechRecognition.startListening({ continuous: true });
    }, 1000); 
  };

  useEffect(() => {
    if (transcript) {
      const lowerTranscript = transcript.toLowerCase();
      if (lowerTranscript.includes('inbox')) {
        navigateTo('inbox');
      } else if (lowerTranscript.includes('starred')) {
        navigateTo('starred');
      } else if (lowerTranscript.includes('sent')) {
        navigateTo('sent');
      } else if (lowerTranscript.includes('drafts')) {
        navigateTo('drafts');
      } else if (lowerTranscript.includes('spam')) {
        navigateTo('spam');
      } else if (lowerTranscript.includes('trash')) {
        navigateTo('trash');
      } else if (lowerTranscript.includes('compose')) {
        navigateTo('compose');
      } else {
        speak("I didn't catch that. Please say one of the following: Inbox, Starred, Sent, Drafts, Spam, Trash, or Compose a message.", startListeningForResponse);
      }
    }
  }, [transcript, navigate]);

  const navigateTo = (page) => {
    stopSpeaking();
    SpeechRecognition.stopListening();
    resetTranscript();
    speak(`Navigating to ${page}.`, () => {
      if (page === 'compose') {
        setIsComposing(true);
      } else {
        setCurrentMailbox(page.charAt(0).toUpperCase() + page.slice(1));
      }
    });
  };

  const speak = (text, callback) => {
    const speechSynthesis = window.speechSynthesis;
    if (!speechSynthesis) {
      console.error("SpeechSynthesis API is not supported in this browser.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    
    
    const voices = speechSynthesis.getVoices();
    const defaultVoice = voices[0];
    utterance.voice = defaultVoice;
    
    utterance.rate = 1; 
    utterance.onend = callback;
    speechSynthesis.speak(utterance);

    
    console.log(`Speaking: "${text}" with voice: "${utterance.voice.name}"`);
  };

  const stopSpeaking = () => {
    const speechSynthesis = window.speechSynthesis;
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex transition-all duration-500 flex-col md:flex-row h-screen">
      <Sidebar onComposeClick={() => setIsComposing(true)} setCurrentMailbox={setCurrentMailbox} />
      <div className="flex-1 flex flex-col relative">
        <SearchBar />
        <MessageArea currentMailbox={currentMailbox} />
        {isComposing && (
          <div className="fixed inset-0 flex items-end justify-center md:items-center md:justify-center bg-black bg-opacity-50 z-10">
            <ComposeArea onClose={() => setIsComposing(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;

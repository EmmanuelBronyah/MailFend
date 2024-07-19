import React, { useState, useEffect } from "react";
import { Button, Modal } from "@mui/material";
import LoginPage from "./LoginPage"; // Import your LoginPage component here
import integration from "../images/integration.png";
import heroicon from "../images/heroicon.svg";
import voice from "../images/voice.png";
import friendly from "../images/friendly.png";
import gmail from "../images/gmail.png";
import logo from "../images/logo.png";
import { ArrowForward } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useDarkMode } from "./DarkModeContext";
import { useScreenReader } from "./ScreenReaderContext"; // Import the useScreenReader hook
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate for redirection
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition"; // Import SpeechRecognition
import "./Styles/LandingPage.css"; // Import the CSS file for animations
import api from "../api";

const Landing = () => {
  const { darkMode } = useDarkMode();
  const { screenReaderEnabled } = useScreenReader(); // Use the useScreenReader hook
  const [open, setOpen] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate
  const { transcript, resetTranscript } = useSpeechRecognition(); // Initialize SpeechRecognition

  const handleSignIn = async () => {
    try {
      const res = await api.get("/api/login/");
      // Handle successful login, store the token, etc.
      console.log(`AUTHORIZATION URL -> ${res.data.auth_url}`);
      window.location.href = res.data.auth_url;
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (screenReaderEnabled) {
      announceSequence();
    } else {
      stopSpeaking();
    }
  }, [screenReaderEnabled]);

  const announceSequence = () => {
    speak(
      "Welcome to MailFend, an assistive email management app that caters to visually impaired users in a better way.",
      () => {
        speak(
          "Navigate Email with Ease: MailFend. Voice-Activated Email Management. Seamless Integration with Gmail. AI-powered Email Management.",
          () => {
            speak(
              "Do you want to log in? Please say 'yes' or 'no'.",
              startListeningForResponse
            );
          }
        );
      }
    );
  };

  const startListeningForResponse = () => {
    setTimeout(() => {
      SpeechRecognition.startListening({ continuous: true });
    }, 1000); // Add a delay before starting to listen to avoid catching noise
  };

  useEffect(() => {
    if (transcript.toLowerCase().includes("yes")) {
      stopSpeaking();
      SpeechRecognition.stopListening();
      speak("Logging you in.", () => {
        setTimeout(() => navigate("home"), 3000);
      });
    } else if (transcript.toLowerCase().includes("no")) {
      stopSpeaking();
      SpeechRecognition.stopListening();
      speak("Okay, let me know if you need any help.");
    } else if (transcript) {
      stopSpeaking();
      SpeechRecognition.stopListening();
      speak(
        "I didn't catch that. Please say 'yes' to log in or 'no' to stay on this page.",
        startListeningForResponse
      );
    }
  }, [transcript, navigate]);

  const speak = (text, callback) => {
    const speechSynthesis = window.speechSynthesis;
    if (!speechSynthesis) {
      console.error("SpeechSynthesis API is not supported in this browser.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);

    // Revert to the default voice
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

  return (
    <>
      <div
        className={`flex transition-all duration-300 flex-col min-h-screen items-center text-center justify-center ${
          darkMode ? "bg-slate-950 text-white" : "text-black bg-slate-100"
        }`}
        id="main-content"
        tabIndex={-1}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="md:text-[32px] text-[25px] items-center justify-center flex-col md:flex-row md:flex font-bold">
            <span className={`${darkMode ? "text-white" : "text-blue-500"}`}>
              Navigate Email with Ease:{" "}
            </span>
            <span className="flex ml-2 items-center justify-center">
              MailFend
              <img
                className="md:h-10 h-7 ml-2"
                src={logo}
                alt="MailFend Logo"
              />
            </span>
          </div>
          <img
            className="mt-12 h-24 md:h-44"
            src={heroicon}
            alt="Vector Image"
          />
        </div>

        <div className="mt-12 flex p-10 md:p-0 items-center justify-center ">
          <div
            className={`${darkMode ? "bg-slate-950 text-white" : "text-black"}`}
          >
            <div className="flex space-y-4 flex-col">
              <div
                className={`card ${
                  darkMode
                    ? "dark-mode"
                    : "bg-gradient-to-r from-blue-300 to-cyan-300"
                } flex items-center p-4 rounded-lg shadow-xs`}
              >
                <div className="mr-4 rounded-full">
                  <img className="h-6 md:h-12" src={voice} alt="Voice Icon" />
                </div>
                <div>
                  <p className="text-sm md:text-[16px] font-bold">
                    Voice-Activated Email Management
                  </p>
                </div>
              </div>
              <div
                className={`card ${
                  darkMode
                    ? "dark-mode"
                    : "bg-gradient-to-r from-blue-300 to-cyan-300"
                } flex items-center p-4 rounded-lg shadow-xs`}
              >
                <div className="mr-4 rounded-full">
                  <img
                    className="h-6 md:h-12"
                    src={integration}
                    alt="Integration Icon"
                  />
                </div>
                <div>
                  <p className="text-sm md:text-[16px] font-bold">
                    Seamless Integration with Gmail
                  </p>
                </div>
              </div>
              <div
                className={`card ${
                  darkMode
                    ? "dark-mode"
                    : "bg-gradient-to-r from-blue-300 to-cyan-300"
                } flex items-center p-4 rounded-lg shadow-xs`}
              >
                <div className="mr-4 rounded-full">
                  <img
                    className="h-6 md:h-12"
                    src={friendly}
                    alt="Friendly Icon"
                  />
                </div>
                <div>
                  <p className="text-sm md:text-[16px] font-bold">
                    AI-powered Email Management
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Link to="home">
          <div className="fixed animate-bounce md:bottom-1/2 bottom-1/3 right-0">
            <button
              type="button"
              data-twe-ripple-init
              data-twe-ripple-color="light"
              className="flex items-center justify-center rounded bg-[#1da1f2] md:text-[14px] p-1 md:p-2 text-xs font-bold uppercase leading-normal text-white shadow-md transition duration-150 ease-in-out hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg"
              aria-label="Login with Gmail"
              onClick={handleSignIn}
            >
              <img className="h-4 mr-2 md:h-6" src={gmail} alt="Gmail Logo" />
              Login With Gmail
            </button>
          </div>
        </Link>
      </div>
    </>
  );
};

export default Landing;

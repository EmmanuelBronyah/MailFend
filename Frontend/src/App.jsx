import React from 'react';
import './App.css';
import Navbar from './Components/Navbar';
import Landing from './Components/LandingPage';
import LoginPage from './Components/LoginPage';
import HomePage from './Components/HomePage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './Components/ProtectedRoute';
import { DarkModeProvider } from './Components/DarkModeContext';
import { ScreenReaderProvider } from './Components/ScreenReaderContext';

function App() {
  return (
    <DarkModeProvider>
      <ScreenReaderProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="home" element={<HomePage />} />
            <Route
              path="home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </ScreenReaderProvider>
    </DarkModeProvider>
  );
}

export default App;

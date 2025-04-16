import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  const { selectedLanguage, setSelectedLanguage, availableLanguages, beginnerMode, setBeginnerMode, voicePreference, setVoicePreference } = useLanguage();

  return (
    <div>
      <h1>Welcome to Language App</h1>
      <div className="language-selector">
        <label htmlFor="language-select">Select Language: </label>
        <select 
          id="language-select"
          value={selectedLanguage.code}
          onChange={(e) => {
            const language = availableLanguages.find(lang => lang.code === e.target.value);
            setSelectedLanguage(language);
          }}
        >
          {availableLanguages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
      <div className="language-selector">
        <label htmlFor="beginner-mode">Beginner Mode: </label>
        <select 
          id="beginner-mode"
          value={beginnerMode ? "On" : "Off"}
          onChange={(e) => setBeginnerMode(e.target.value === "On")}
        >
          <option value="Off">Off</option>
          <option value="On">On</option>
        </select>
      </div>
      <div className="language-selector">
        <label htmlFor="voice-preference">Voice Preference: </label>
        <select 
          id="voice-preference"
          value={voicePreference}
          onChange={(e) => setVoicePreference(e.target.value)}
        >
          <option value="Female">Female</option>
          <option value="Male">Male</option>
        </select>
      </div>
      <Link to="/learn" className="shiny-button">
        Choose Words
      </Link>
    </div>
  );
}

export default Home; 
import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

const AVAILABLE_LANGUAGES = [
  { code: 'zh', name: 'Chinese' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'es', name: 'Spanish' }
];

export function LanguageProvider({ children }) {
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const saved = localStorage.getItem('selectedLanguage');
    return saved ? JSON.parse(saved) : AVAILABLE_LANGUAGES[0];
  });

  const [beginnerMode, setBeginnerMode] = useState(() => {
    const saved = localStorage.getItem('beginnerMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [voicePreference, setVoicePreference] = useState(() => {
    const saved = localStorage.getItem('voicePreference');
    return saved || 'Female';
  });

  const [speechRecognition, setSpeechRecognition] = useState(() => {
    const saved = localStorage.getItem('speechRecognition');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('selectedLanguage', JSON.stringify(selectedLanguage));
    localStorage.setItem('beginnerMode', JSON.stringify(beginnerMode));
    localStorage.setItem('voicePreference', voicePreference);
    localStorage.setItem('speechRecognition', JSON.stringify(speechRecognition));
  }, [selectedLanguage, beginnerMode, voicePreference, speechRecognition]);

  return (
    <LanguageContext.Provider value={{ 
      selectedLanguage, 
      setSelectedLanguage,
      availableLanguages: AVAILABLE_LANGUAGES,
      beginnerMode,
      setBeginnerMode,
      voicePreference,
      setVoicePreference,
      speechRecognition,
      setSpeechRecognition
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
} 
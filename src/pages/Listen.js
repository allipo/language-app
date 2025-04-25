import React, { useState, useEffect, useRef } from 'react';
import { useGroup } from '../context/GroupContext';
import { useLanguage } from '../context/LanguageContext';
import TextToSpeechService from '../services/textToSpeechService';
import FadeTransition from '../components/FadeTransition';
import FadeIn from '../components/FadeIn';
import './Listen.css';

function Listen() {
  const { selectedGroup, groupImageUrl, groupWords } = useGroup();
  const { selectedLanguage, voicePreference } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [shouldTransition, setShouldTransition] = useState(false);
  const [hideContent, setHideContent] = useState(false);
  const [showDoneButton, setShowDoneButton] = useState(false);
  const tts = new TextToSpeechService();
  const backgroundAudioRef = useRef(null);
  const doneButtonTimeoutRef = useRef(null);

  useEffect(() => {
    if (selectedGroup?.backgroundSound) {
      backgroundAudioRef.current = new Audio(selectedGroup.backgroundSound);
      backgroundAudioRef.current.loop = true;
      backgroundAudioRef.current.volume = 0.2; // Set volume to 20%
    }
    return () => {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current = null;
      }
    };
  }, [selectedGroup]);

  useEffect(() => {
    if (isPlaying) {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.play();
      }
      if (currentWordIndex === -1) {
        // Create a single string with group name and all words
        const allWords = groupWords.map(word => {
          const wordWithArticle = word.article ? `${word.article} ${word.word}` : word.word;
          return selectedLanguage.code === 'ja' && word.kana ? word.kana : wordWithArticle;
        }).join('. ');
        
        const fullText = `${selectedGroup.name}. ${allWords}.`;
        
        tts.speak(fullText, { 
          lang: `${selectedLanguage.code}-${selectedLanguage.code.toUpperCase()}`,
          voicePreference: voicePreference,
          rate: 0.7 // Slow down the speech rate
        }, () => {
          setIsPlaying(false);
          setHideContent(true);
          setTimeout(() => {
            setShouldTransition(true);
          }, 500);
        }, (error) => {
          console.error('Error speaking text:', error);
          setIsPlaying(false);
        });
      }
    } else {
      tts.stop();
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
      }
    }
  }, [isPlaying, currentWordIndex, selectedLanguage]);

  useEffect(() => {
    if (isPlaying) {
      setShowDoneButton(false);
      doneButtonTimeoutRef.current = setTimeout(() => {
        setShowDoneButton(true);
      }, 10000);
    } else {
      if (doneButtonTimeoutRef.current) {
        clearTimeout(doneButtonTimeoutRef.current);
      }
      setShowDoneButton(false);
    }
    return () => {
      if (doneButtonTimeoutRef.current) {
        clearTimeout(doneButtonTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  const handleDoneClick = () => {
    setIsPlaying(false);
    setHideContent(true);
    setTimeout(() => {
      setShouldTransition(true);
    }, 500);
  };

  if (!selectedGroup) {
    return (
      <div className="listen-page">
        <h1>Listen</h1>
        <p>Please select a word group from the Learn page first!</p>
      </div>
    );
  }

  return (
    <FadeTransition isActive={shouldTransition} targetPath="/guess">
      <FadeIn>
        <div className="listen-page">
          <div className="group-info">
            {!hideContent && (
              <div className="play-button-container">
                <img 
                  src={isPlaying ? "/icons/pause-icon.svg" : "/icons/play-icon.svg"}
                  alt={isPlaying ? "Pause" : "Play"} 
                  className="play-icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                />
                {showDoneButton && (
                  <button 
                    className="done-button"
                    onClick={handleDoneClick}
                  >
                    Done
                  </button>
                )}
              </div>
            )}
            <img 
              src={groupImageUrl} 
              alt={selectedGroup.name} 
              className="group-image"
              onError={(e) => {
                console.error('Failed to load group image:', groupImageUrl);
                e.target.onerror = null;
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
              }}
            />
          </div>
        </div>
      </FadeIn>
    </FadeTransition>
  );
}

export default Listen; 
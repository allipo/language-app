import React, { useEffect, useState } from 'react';
import { useGroup } from '../context/GroupContext';
import { useLanguage } from '../context/LanguageContext';
import TextToSpeechService from '../services/textToSpeechService';
import FadeIn from '../components/FadeIn';
import FadeTransition from '../components/FadeTransition';
import './Listen.css';

function Listen() {
  const { selectedGroup, groupImageUrl, groupWords } = useGroup();
  const { selectedLanguage, voicePreference } = useLanguage();
  const ttsService = new TextToSpeechService();
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [shuffledWords, setShuffledWords] = useState([]);
  const [spokenWords, setSpokenWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shouldTransition, setShouldTransition] = useState(false);

  useEffect(() => {
    if (groupWords) {
      const shuffled = [...groupWords].sort(() => Math.random() - 0.5);
      setShuffledWords(shuffled);
      setSpokenWords([...groupWords].sort(() => Math.random() - 0.5));
    }
  }, [groupWords]);

  useEffect(() => {
    if (selectedGroup) {
      const timer = setTimeout(() => {
        ttsService.speak(selectedGroup.name, {
          lang: selectedLanguage.code,
          rate: 0.8
        });
        setTimeout(() => {
          setShowPlayIcon(true);
        }, 2000);
      }, 1500);

      return () => {
        clearTimeout(timer);
        ttsService.stop();
      };
    }
  }, [selectedGroup, selectedLanguage]);

  const handlePlayClick = () => {
    if (spokenWords.length > 0) {
      setIsPlaying(true);
      const textToSpeak = selectedLanguage.code === 'ja' && spokenWords[currentWordIndex].kana 
        ? spokenWords[currentWordIndex].kana 
        : spokenWords[currentWordIndex].word;
      ttsService.speak(textToSpeak, {
        lang: selectedLanguage.code,
        rate: 0.8
      });
    }
  };

  const handleWordClick = (clickedWord) => {
    if (!isPlaying) return;
    
    if (clickedWord._id === spokenWords[currentWordIndex]._id) {
      // Correct word selected
      if (currentWordIndex < spokenWords.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
        const textToSpeak = selectedLanguage.code === 'ja' && spokenWords[currentWordIndex + 1].kana 
          ? spokenWords[currentWordIndex + 1].kana 
          : spokenWords[currentWordIndex + 1].word;
        ttsService.speak(textToSpeak, {
          lang: selectedLanguage.code,
          rate: 0.8
        });
      } else {
        // Game completed
        setIsPlaying(false);
        setCurrentWordIndex(0);
        setShouldTransition(true);
      }
    }
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
          <div className="listen-group-info">
            <div className="listen-image-container">
              <img 
                src={groupImageUrl} 
                alt={selectedGroup.name} 
                className="listen-group-image"
                onError={(e) => {
                  console.error('Failed to load group image:', groupImageUrl);
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                }}
              />
              <div className="listen-group-name-card">
                {!showPlayIcon && <h2 className="listen-group-name">{selectedGroup.name}</h2>}
                {showPlayIcon && (
                  <img 
                    src="/icons/play-icon.svg" 
                    alt="Play" 
                    className="listen-play-icon"
                    onClick={handlePlayClick}
                    style={{ cursor: 'pointer' }}
                  />
                )}
              </div>
            </div>
            <div className="listen-words-container">
              {shuffledWords.map((word) => (
                <div 
                  key={word._id} 
                  className={`listen-word-item ${isPlaying ? 'clickable' : ''}`}
                  onClick={() => handleWordClick(word)}
                >
                  {(selectedLanguage.code === 'ja' || selectedLanguage.code === 'zh') && word.romajiPinyin ? word.romajiPinyin : word.word}
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>
    </FadeTransition>
  );
}

export default Listen; 
import React, { useState, useEffect } from 'react';
import { useGroup } from '../context/GroupContext';
import { useLanguage } from '../context/LanguageContext';
import styles from './Definition.module.css';
import TextToSpeechService from '../services/textToSpeechService';
import FadeTransition from '../components/FadeTransition';
import FadeIn from '../components/FadeIn';

function Definition() {
  const { groupWords, selectedGroup } = useGroup();
  const { selectedLanguage, beginnerMode, voicePreference } = useLanguage();
  const [matches, setMatches] = useState(() => {
    const savedMatches = localStorage.getItem(`matches_${selectedGroup?._id}`);
    return savedMatches ? JSON.parse(savedMatches) : {};
  });
  const [shouldTransition, setShouldTransition] = useState(false);
  const [shuffledDefinitions, setShuffledDefinitions] = useState([]);
  const [showingTranslation, setShowingTranslation] = useState({});
  const [selectedWord, setSelectedWord] = useState(null);
  const tts = new TextToSpeechService();
  
  // Check if all words are matched
  const allWordsMatched = Object.keys(matches).length === groupWords.length;
  
  useEffect(() => {
    const definitions = [...groupWords]
      .map(word => beginnerMode ? word.translatedDefinition : (word.definition || 'No definition available'))
      .sort(() => Math.random() - 0.5);
    setShuffledDefinitions(definitions);
  }, [groupWords, beginnerMode]);

  useEffect(() => {
    localStorage.setItem(`matches_${selectedGroup?._id}`, JSON.stringify(matches));
  }, [matches, selectedGroup?._id]);

  useEffect(() => {
    // Clear matches when beginner mode changes
    setMatches({});
  }, [beginnerMode]);

  useEffect(() => {
    return () => {
      localStorage.removeItem(`matches_${selectedGroup?._id}`);
    };
  }, [selectedGroup?._id]);

  useEffect(() => {
    if (allWordsMatched) {
      const timer = setTimeout(() => {
        setShouldTransition(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [allWordsMatched]);

  const handleDragStart = (e, word) => {
    e.dataTransfer.setData('text/plain', word._id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, definitionIndex) => {
    e.preventDefault();
    const wordId = e.dataTransfer.getData('text/plain');
    const word = groupWords.find(w => w._id === wordId);
    const definition = shuffledDefinitions[definitionIndex];
    
    if (word && (beginnerMode ? word.translatedDefinition === definition : word.definition === definition)) {
      setMatches(prev => ({ ...prev, [definitionIndex]: wordId }));
      
      // Only speak in non-beginner mode
      if (!beginnerMode) {
        const textToSpeak = selectedLanguage.code === 'ja' && word.kana ? word.kana : word.word;
        const combinedText = `${textToSpeak}. ${definition}`;
        tts.speak(combinedText, { 
          lang: selectedLanguage.code,
          voicePreference: voicePreference
        });
      }
    }
  };

  const handleToggleClick = (definitionIndex) => {
    setShowingTranslation(prev => {
      const newState = { ...prev, [definitionIndex]: !prev[definitionIndex] };
      
      // If we're showing the translation, start a timer to hide it
      if (newState[definitionIndex]) {
        setTimeout(() => {
          setShowingTranslation(current => ({
            ...current,
            [definitionIndex]: false
          }));
        }, 3000);
      }
      
      return newState;
    });
  };

  const handleWordClick = (word) => {
    if (Object.values(matches).includes(word._id)) return;
    setSelectedWord(selectedWord?._id === word._id ? null : word);
  };

  const handleDefinitionClick = (definitionIndex) => {
    if (!selectedWord) return;
    
    const definition = shuffledDefinitions[definitionIndex];
    if ((beginnerMode ? selectedWord.translatedDefinition === definition : selectedWord.definition === definition)) {
      setMatches(prev => ({ ...prev, [definitionIndex]: selectedWord._id }));
      
      // Only speak in non-beginner mode
      if (!beginnerMode) {
        const textToSpeak = selectedLanguage.code === 'ja' && selectedWord.kana ? selectedWord.kana : selectedWord.word;
        const combinedText = `${textToSpeak}. ${definition}`;
        tts.speak(combinedText, { 
          lang: selectedLanguage.code,
          voicePreference: voicePreference
        });
      }
    }
    setSelectedWord(null);
  };

  const handlePlayClick = (e, definition, word) => {
    e.stopPropagation(); // Prevent triggering the definition click
    tts.stop(); // Stop any ongoing speech
    tts.speak(definition, { 
      lang: selectedLanguage.code,
      voicePreference: voicePreference
    });
  };

  return (
    <FadeTransition isActive={shouldTransition} targetPath="/translate">
      <FadeIn>
        <div className={styles.container} style={{ '--selected-group-color': selectedGroup?.color || '#f5f5f5' }}>
          <div className={styles.wordList}>
            {groupWords.map(word => (
              <div 
                key={word._id} 
                className={`${styles.word} ${Object.values(matches).includes(word._id) ? styles.matched : ''} ${selectedWord?._id === word._id ? styles.selected : ''}`}
                draggable={!Object.values(matches).includes(word._id)}
                onDragStart={(e) => handleDragStart(e, word)}
                onClick={() => handleWordClick(word)}
                data-compact={beginnerMode && (selectedLanguage.code === 'ja' || selectedLanguage.code === 'zh')}
              >
                <div>{word.word}</div>
                {beginnerMode && (selectedLanguage.code === 'ja' || selectedLanguage.code === 'zh') && word.romajiPinyin && (
                  <div className={styles.romajiPinyin}>{word.romajiPinyin}</div>
                )}
              </div>
            ))}
          </div>
          <div className={styles.mainContent}>
            {shuffledDefinitions.map((definition, index) => {
              const wordId = matches[index];
              const word = groupWords.find(w => w._id === wordId);
              const displayText = showingTranslation[index] ? word?.translatedDefinition : definition;
              
              return (
                <div 
                  key={index} 
                  className={`${styles.definition} ${!wordId && selectedWord ? styles.clickable : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => handleDefinitionClick(index)}
                >
                  <div className={styles.blank}>
                    {wordId ? word?.word : '_____'}
                  </div>
                  <div className={styles.definitionText}>
                    {displayText}
                  </div>
                  {wordId && !beginnerMode && (
                    <div 
                      className={`${styles.toggle} ${showingTranslation[index] ? styles.toggled : ''}`} 
                      onClick={() => handleToggleClick(index)} 
                    />
                  )}
                  {!beginnerMode && (
                    <img 
                      src="/icons/play-icon.svg" 
                      alt="Play" 
                      className={styles.playIcon}
                      onClick={(e) => handlePlayClick(e, displayText, word)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </FadeIn>
    </FadeTransition>
  );
}

export default Definition; 
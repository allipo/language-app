import React, { useEffect, useState } from 'react';
import { useGroup } from '../context/GroupContext';
import { useLanguage } from '../context/LanguageContext';
import TextToSpeechService from '../services/textToSpeechService';
import SpeechRecognitionService from '../services/speechRecognitionService';
import FadeIn from '../components/FadeIn';
import FadeTransition from '../components/FadeTransition';
import './Speak.css';

function Speak() {
  const { groupWords, wordImageUrls, selectedGroup } = useGroup();
  const { selectedLanguage, beginnerMode, voicePreference } = useLanguage();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const currentWord = groupWords[currentWordIndex];
  const textToSpeech = new TextToSpeechService();
  const speechRecognition = new SpeechRecognitionService();
  const [showSpeakButton, setShowSpeakButton] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isPluralMode, setIsPluralMode] = useState(false);
  const [shouldTransition, setShouldTransition] = useState(false);
  const [recognizedSpeech, setRecognizedSpeech] = useState('');
  const [backupTimer, setBackupTimer] = useState(null);

  const isSimilarEnough = (text1, text2) => {
    // Remove extra spaces and convert to lowercase
    const clean1 = text1.toLowerCase().trim().replace(/\s+/g, ' ');
    const clean2 = text2.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // If they're exactly the same after cleaning, return true
    if (clean1 === clean2) return true;
    
    // If one contains the other (for partial matches), return true
    if (clean1.includes(clean2) || clean2.includes(clean1)) return true;
    
    // Calculate similarity by comparing character by character
    const maxLength = Math.max(clean1.length, clean2.length);
    const minLength = Math.min(clean1.length, clean2.length);
    
    // If the lengths are very different, it's probably not a match
    if (maxLength - minLength > 2) return false;
    
    // Count matching characters
    let matches = 0;
    for (let i = 0; i < minLength; i++) {
      if (clean1[i] === clean2[i]) matches++;
    }
    
    // Return true if at least 70% of characters match
    return matches / maxLength >= 0.7;
  };

  const estimateSpeechDuration = (text) => {
    // More conservative estimate: 300ms per word + 1000ms base time
    const wordCount = text.split(' ').length;
    return (wordCount * 400) + 1000;
  };

  useEffect(() => {
    if (currentWord) {
      const speakWord = () => {
        const textToSpeak = selectedLanguage.code === 'ja' && currentWord.kana
          ? currentWord.kana
          : isPluralMode && currentWord.plural 
            ? currentWord.plural 
            : currentWord.article 
              ? `${currentWord.article} ${currentWord.word}` 
              : currentWord.word;
        
        // Combine three repetitions with commas
        const combinedText = `${textToSpeak}, ${textToSpeak}, ${textToSpeak}`;
        
        // Clear any existing backup timer
        if (backupTimer) {
          clearTimeout(backupTimer);
        }

        // Set backup timer based on estimated duration
        const duration = estimateSpeechDuration(combinedText);
        const timer = setTimeout(() => {
          setShowSpeakButton(true);
        }, duration);

        setBackupTimer(timer);
        
        textToSpeech.speak(combinedText, { 
          rate: 1,
          lang: `${selectedLanguage.code}-${selectedLanguage.code.toUpperCase()}`,
          voicePreference: voicePreference
        }, () => {
          setShowSpeakButton(true);
          // Clear backup timer if onEnd callback fires
          if (backupTimer) {
            clearTimeout(backupTimer);
          }
        });
      };
      speakWord();
    }

    // Cleanup function
    return () => {
      if (backupTimer) {
        clearTimeout(backupTimer);
      }
    };
  }, [currentWord, selectedLanguage, isPluralMode, voicePreference]);

  const handleSpeakClick = () => {
    speechRecognition.setLanguage(selectedLanguage.code);
    speechRecognition.startListening(
      (text) => {
        setRecognizedSpeech(text);
        const expectedText = isPluralMode && currentWord.plural 
          ? currentWord.plural 
          : currentWord.article 
            ? `${currentWord.article} ${currentWord.word}` 
            : currentWord.word;
        if (isSimilarEnough(text, expectedText)) {
          setIsCorrect(true);
        }
        
        // If we're in singular mode and there's a plural, switch to plural mode after 500ms
        if (!isPluralMode && currentWord.plural) {
          setTimeout(() => {
            setIsPluralMode(true);
            setIsCorrect(false);
            setShowSpeakButton(false);
            setRecognizedSpeech('');
          }, 500);
        } else {
          // Move to next word after 500ms
          setTimeout(() => {
            if (currentWordIndex < groupWords.length - 1) {
              setCurrentWordIndex(prev => prev + 1);
              setIsPluralMode(false);
              setIsCorrect(false);
              setShowSpeakButton(false);
              setRecognizedSpeech('');
            } else {
              // All words completed, trigger transition
              setShouldTransition(true);
            }
          }, 500);
        }
      },
      (error) => console.error('Speech recognition error:', error)
    );
  };

  if (!currentWord) {
    return <div className="speak-container" />;
  }

  return (
    <FadeTransition isActive={shouldTransition} targetPath="/definition">
      <div className="speak-container">
        <FadeIn>
          <div>
            {isPluralMode ? (
              <div className="plural-images">
                <img 
                  src={wordImageUrls[currentWord._id]} 
                  alt={currentWord.word}
                  className="word-image"
                />
                <img 
                  src={wordImageUrls[currentWord._id]} 
                  alt={currentWord.word}
                  className="word-image"
                />
              </div>
            ) : (
              <img 
                src={wordImageUrls[currentWord._id]} 
                alt={currentWord.word}
                className="word-image"
              />
            )}
            <h2 className="word-text">
              {!isPluralMode && currentWord.article && (
                <span className="article">{currentWord.article} </span>
              )}
              <span>
                {isPluralMode && currentWord.plural ? currentWord.plural : currentWord.word}
              </span>
            </h2>
            {beginnerMode && (selectedLanguage.code === 'ja' || selectedLanguage.code === 'zh') && currentWord.romajiPinyin && (
              <p className="romaji-pinyin">{currentWord.romajiPinyin}</p>
            )}
            {showSpeakButton && (
              <div className="speak-page-button-container">
                <button className="speak-page-button" onClick={handleSpeakClick}>
                  Speak
                </button>
                {recognizedSpeech && (
                  <p className="recognized-speech">You said: {recognizedSpeech}</p>
                )}
                <button 
                  className="speak-page-next-button" 
                  onClick={() => {
                    if (!isPluralMode && currentWord.plural) {
                      setIsPluralMode(true);
                      setIsCorrect(false);
                      setShowSpeakButton(false);
                      setRecognizedSpeech('');
                    } else if (currentWordIndex < groupWords.length - 1) {
                      setCurrentWordIndex(prev => prev + 1);
                      setIsPluralMode(false);
                      setIsCorrect(false);
                      setShowSpeakButton(false);
                      setRecognizedSpeech('');
                    } else {
                      setShouldTransition(true);
                    }
                  }}
                >
                  Next Word
                </button>
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </FadeTransition>
  );
}

export default Speak; 
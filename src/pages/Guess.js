import React, { useEffect, useState } from 'react';
import { useGroup } from '../context/GroupContext';
import { useLanguage } from '../context/LanguageContext';
import { scrambleWords } from '../utils/wordUtils';
import TextToSpeechService from '../services/textToSpeechService';
import FadeTransition from '../components/FadeTransition';
import FadeIn from '../components/FadeIn';
import './Guess.css';

function Guess() {
  const { groupWords } = useGroup();
  const { selectedLanguage, beginnerMode, voicePreference } = useLanguage();
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [words, setWords] = useState([]);
  const [scrambledWords, setScrambledWords] = useState([]);
  const [scrambledPictures, setScrambledPictures] = useState([]);
  const [tts] = useState(() => new TextToSpeechService());
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [shouldTransition, setShouldTransition] = useState(false);

  useEffect(() => {
    const startIndex = currentSetIndex * 5;
    const fiveWords = groupWords.slice(startIndex, startIndex + 5);
    setWords(fiveWords);
    setScrambledWords(scrambleWords(fiveWords));
    setScrambledPictures(scrambleWords(fiveWords));
    setCurrentWordIndex(0);
  }, [groupWords, currentSetIndex]);

  useEffect(() => {
    const speakWord = async () => {
      if (scrambledWords.length > 0) {
        try {
          const currentWord = scrambledWords[currentWordIndex];
          const textToSpeak = selectedLanguage.code === 'ja' && currentWord.kana ? currentWord.kana : currentWord.word;
          await tts.speak(textToSpeak, { 
            lang: selectedLanguage.code,
            voicePreference: voicePreference
          });
        } catch (error) {
          console.error('Failed to speak word:', error);
        }
      }
    };

    const timer = setTimeout(speakWord, 100);
    return () => clearTimeout(timer);
  }, [scrambledWords, tts, currentWordIndex, selectedLanguage.code, voicePreference]);

  const handlePictureClick = (clickedWord) => {
    if (clickedWord._id === scrambledWords[currentWordIndex]._id) {
      if (currentWordIndex === 4) {
        // Move to next set if we've completed all words in current set
        if ((currentSetIndex + 1) * 5 >= groupWords.length) {
          setShouldTransition(true);
        } else {
          setCurrentSetIndex(prev => prev + 1);
        }
      } else {
        setCurrentWordIndex(prev => prev + 1);
      }
    }
  };

  // Don't render anything if we've gone through all words
  if (currentSetIndex * 5 >= groupWords.length) {
    return (
      <FadeTransition isActive={shouldTransition} targetPath="/reinforce">
        <div>Congratulations! You've completed all words!</div>
      </FadeTransition>
    );
  }

  return (
    <FadeTransition isActive={shouldTransition} targetPath="/reinforce">
      <FadeIn>
        <div>
          <div className="guess-word-list">
            {scrambledWords.map((word, index) => (
              <div key={word._id} className={`guess-word-item ${index === currentWordIndex ? 'highlighted' : ''}`}>
                <h3>{word.word}</h3>
                {beginnerMode && (selectedLanguage.code === 'ja' || selectedLanguage.code === 'zh') && word.romajiPinyin && (
                  <p className="guess-romaji-pinyin">{word.romajiPinyin}</p>
                )}
              </div>
            ))}
          </div>
          <div className="guess-picture-container">
            <div className="guess-picture-list">
              {scrambledPictures.map((word) => (
                <div 
                  key={word._id} 
                  className="guess-picture-item"
                  onClick={() => handlePictureClick(word)}
                >
                  <img src={word.picture} alt={word.word} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>
    </FadeTransition>
  );
}

export default Guess;   
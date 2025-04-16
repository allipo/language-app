import React, { useState, useEffect, useRef } from 'react';
import { useGroup } from '../context/GroupContext';
import { useLanguage } from '../context/LanguageContext';
import { scrambleWords } from '../utils/wordUtils';
import { languageSpecialChars } from '../utils/languageChars';
import { languageWords } from '../utils/languageWords';
import TextToSpeechService from '../services/textToSpeechService';
import FadeTransition from '../components/FadeTransition';
import FadeIn from '../components/FadeIn';
import './Sentence.css';

function Sentence() {
  const { groupWords } = useGroup();
  const { selectedLanguage, beginnerMode, voicePreference } = useLanguage();
  const [scrambledWords, setScrambledWords] = useState([]);
  const [input, setInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const ttsService = useRef(new TextToSpeechService());
  const inputRef = useRef(null);

  useEffect(() => {
    setScrambledWords(scrambleWords(groupWords));
    setCurrentIndex(0);
    setInput('');
    setIsComplete(false);
  }, [groupWords]);

  useEffect(() => {
    if (scrambledWords.length > 0 && currentIndex < scrambledWords.length) {
      const { sentence, word } = scrambledWords[currentIndex];
      // Remove only the ending period
      const cleanSentence = sentence.replace(/\.$/, '');
      const parts = cleanSentence.split(new RegExp(word, 'gi'));
      
      // For Japanese, use a pause instead of "what"
      const whatWord = selectedLanguage.code === 'ja' ? '...' : languageWords[selectedLanguage.code];
      const fullSentence = `${parts[0]} ${whatWord} ${parts[1]}`;
      ttsService.current.speak(fullSentence, { 
        rate: 1,
        pitch: 1,
        lang: selectedLanguage.code,
        voicePreference: voicePreference,
        onBoundary: (event) => {
          if (event.name === 'word' && event.word === '...') {
            event.utterance.rate = 0.5;
            event.utterance.pitch = 1;
          } else {
            event.utterance.rate = 1;
            event.utterance.pitch = 1;
          }
        }
      });
    }
  }, [currentIndex, scrambledWords, selectedLanguage.code, voicePreference]);

  const getSentenceWithBlank = (sentence, word) => {
    const regex = new RegExp(word, 'gi');
    return sentence.replace(regex, '____________');
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    
    const currentWord = scrambledWords[currentIndex];
    const isJapanese = selectedLanguage.code === 'ja';
    const isChinese = selectedLanguage.code === 'zh';
    
    // Normalize strings by removing spaces and converting to lowercase
    const normalizeString = (str) => str?.replace(/\s+/g, '').toLowerCase();
    
    // Check if input matches any of the accepted forms
    const isMatch = 
      normalizeString(value) === normalizeString(currentWord?.word) ||
      (isJapanese && normalizeString(value) === normalizeString(currentWord?.kana)) ||
      (isJapanese && normalizeString(value) === normalizeString(currentWord?.romajiPinyin)) ||
      (isChinese && normalizeString(value) === normalizeString(currentWord?.romajiPinyin));
    
    if (isMatch) {
      ttsService.current.stop();
      const { sentence, word } = scrambledWords[currentIndex];
      const cleanSentence = sentence.replace(/\.$/, '');
      const parts = cleanSentence.split(new RegExp(word, 'gi'));
      const fullSentence = `${parts[0]} ${word} ${parts[1]}`;
      
      ttsService.current.speak(fullSentence, {
        rate: 1,
        pitch: 1,
        lang: selectedLanguage.code,
        voicePreference: voicePreference,
        onBoundary: (event) => {
          if (event.name === 'word' && event.word.toLowerCase() === word.toLowerCase()) {
            event.utterance.rate = 0.9;
            event.utterance.pitch = 1.1;
          } else {
            event.utterance.rate = 1;
            event.utterance.pitch = 1;
          }
        }
      }, () => {
        if (currentIndex === scrambledWords.length - 1) {
          setIsComplete(true);
        } else {
          setCurrentIndex(prev => prev + 1);
          setInput('');
        }
      });
    }
  };

  const handleSpecialCharClick = (char) => {
    setInput(prev => prev + char);
    inputRef.current.focus();
  };

  if (isComplete) {
    return (
      <FadeTransition isActive={true} targetPath="/speak">
        <div className="sentence-container" />
      </FadeTransition>
    );
  }

  return (
    <FadeTransition isActive={false} targetPath="/speak">
      <FadeIn>
        <div>
          {scrambledWords.length > 0 && currentIndex < scrambledWords.length && (
            <>
              <h3>{getSentenceWithBlank(scrambledWords[currentIndex].sentence, scrambledWords[currentIndex].word)}</h3>
              {beginnerMode && (selectedLanguage.code === 'ja' || selectedLanguage.code === 'zh') && scrambledWords[currentIndex].sentenceRomajiPinyin && (
                <p className="romaji-pinyin">
                  {scrambledWords[currentIndex].sentenceRomajiPinyin.replace(
                    new RegExp(scrambledWords[currentIndex].romajiPinyin || scrambledWords[currentIndex].word, 'gi'),
                    '____'
                  )}
                </p>
              )}
              <input 
                ref={inputRef}
                type="text"
                autoFocus
                value={input}
                onChange={handleInputChange}
                placeholder=""
                className="sentence-input"
              />
              <div className="special-chars" data-lang={selectedLanguage.code}>
                {languageSpecialChars[selectedLanguage.code]?.map((char, index) => (
                  <button
                    key={index}
                    className="special-char-btn"
                    onClick={() => handleSpecialCharClick(char)}
                  >
                    {char}
                  </button>
                ))}
              </div>
              <img 
                src={scrambledWords[currentIndex].picture} 
                alt={scrambledWords[currentIndex].sentence}
                className="sentence-image"
              />
              <div className="word-list">
                {groupWords.map((word, index) => (
                  <span key={index} className="word-item">
                    {word.word}
                    {beginnerMode && (selectedLanguage.code === 'ja' || selectedLanguage.code === 'zh') && word.romajiPinyin && (
                      <span className="romaji-pinyin-small">{word.romajiPinyin}</span>
                    )}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </FadeIn>
    </FadeTransition>
  );
}

export default Sentence; 
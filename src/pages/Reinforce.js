import React, { useState, useEffect, useRef } from 'react';
import { useGroup } from '../context/GroupContext';
import { useLanguage } from '../context/LanguageContext';
import { scrambleWords } from '../utils/wordUtils';
import TextToSpeechService from '../services/textToSpeechService';
import FadeTransition from '../components/FadeTransition';
import FadeIn from '../components/FadeIn';
import './Reinforce.css';

function Reinforce() {
  const { groupWords, selectedGroup } = useGroup();
  const { selectedLanguage, beginnerMode } = useLanguage();
  const [scrambledPictures, setScrambledPictures] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [buttonOrder, setButtonOrder] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedButton, setSelectedButton] = useState(null);
  const tts = new TextToSpeechService();
  const backgroundAudioRef = useRef(null);

  useEffect(() => {
    if (selectedGroup?.backgroundSound) {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current = null;
      }
      const audio = new Audio(selectedGroup.backgroundSound);
      audio.loop = true;
      audio.volume = 0.2;
      backgroundAudioRef.current = audio;
      audio.play().catch(err => console.log('Audio play error:', err));
    }
    return () => {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current = null;
      }
    };
  }, [selectedGroup]);

  const getRandomOptions = (currentWord, allWords) => {
    const otherWords = allWords.filter(w => w.word !== currentWord);
    const shuffled = scrambleWords(otherWords);
    return shuffled.slice(0, 2).map(w => ({ 
      word: w.word, 
      article: w.article,
      romajiPinyin: w.romajiPinyin
    }));
  };

  useEffect(() => {
    if (groupWords.length > 0) {
      const pictures = groupWords.map(word => ({
        id: word._id,
        url: word.picture,
        word: word.word,
        article: word.article,
        kana: word.kana,
        romajiPinyin: word.romajiPinyin
      }));
      setScrambledPictures(scrambleWords(pictures));
      setCurrentIndex(0);
    }
  }, [groupWords]);

  useEffect(() => {
    if (scrambledPictures[currentIndex]) {
      const randomOptions = getRandomOptions(scrambledPictures[currentIndex].word, groupWords);
      setOptions(randomOptions);
      
      // Create array with all options and randomize their order
      const allOptions = [
        { 
          word: scrambledPictures[currentIndex].word, 
          article: scrambledPictures[currentIndex].article, 
          romajiPinyin: scrambledPictures[currentIndex].romajiPinyin,
          isCorrect: true 
        },
        ...randomOptions.map(opt => ({ 
          word: opt.word, 
          article: opt.article, 
          romajiPinyin: opt.romajiPinyin,
          isCorrect: false 
        }))
      ];
      setButtonOrder(scrambleWords(allOptions));
    }
  }, [currentIndex, scrambledPictures, groupWords]);

  const handleNext = () => {
    if (currentIndex < scrambledPictures.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleCorrectChoice = () => {
    setSelectedButton(true);
    const currentWord = scrambledPictures[currentIndex];
    const textToSpeak = selectedLanguage.code === 'ja' && currentWord.kana 
      ? currentWord.kana 
      : currentWord.article 
        ? `${currentWord.article} ${currentWord.word}` 
        : currentWord.word;
    tts.speak(textToSpeak, { lang: selectedLanguage.code });
    setTimeout(() => {
      setSelectedButton(null);
      handleNext();
    }, 1500);
  };

  if (!groupWords.length) {
    return (
      <FadeIn>
        <div className="reinforce-page">
          <h1>Reinforce</h1>
          <p>Please select a word group from the Learn page first!</p>
        </div>
      </FadeIn>
    );
  }

  if (isComplete) {
    return (
      <FadeTransition isActive={isComplete} targetPath="/sentence">
        <div className="reinforce-page" />
      </FadeTransition>
    );
  }

  const showRomajiPinyin = beginnerMode && (selectedLanguage.code === 'ja' || selectedLanguage.code === 'zh');

  return (
    <FadeIn>
      <div className="reinforce-page">
        <div className="picture-container">
          {scrambledPictures[currentIndex] && (
            <>
              <img 
                src={scrambledPictures[currentIndex].url} 
                alt={scrambledPictures[currentIndex].word}
                className="reinforce-word-picture"
              />
              <div className="reinforce-button-container">
                {buttonOrder.map((option, idx) => (
                  <button 
                    key={idx} 
                    className={`reinforce-choice-button ${option.isCorrect && selectedButton ? 'correct-choice' : ''}`}
                    onClick={option.isCorrect ? handleCorrectChoice : undefined}
                    style={{
                      backgroundColor: selectedGroup?.color ? `${selectedGroup.color}20` : 'white',
                      border: `2px solid ${selectedGroup?.color || '#007bff'}`,
                      color: 'black'
                    }}
                  >
                    <div>{option.article ? `${option.article} ${option.word}` : option.word}</div>
                    {showRomajiPinyin && option.romajiPinyin && (
                      <div className="romaji-pinyin">{option.romajiPinyin}</div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </FadeIn>
  );
}

export default Reinforce; 
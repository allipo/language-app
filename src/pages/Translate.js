import React, { useEffect, useState } from 'react';
import { useGroup } from '../context/GroupContext';
import { useLanguage } from '../context/LanguageContext';
import SpeechRecognitionService from '../services/speechRecognitionService';
import TextToSpeechService from '../services/textToSpeechService';
import FadeIn from '../components/FadeIn';
import FadeTransition from '../components/FadeTransition';
import './Translate.css';

function Translate() {
  const { groupWords, scrambleWordList } = useGroup();
  const { selectedLanguage, beginnerMode, voicePreference, speechRecognition } = useLanguage();
  const [scrambledWords, setScrambledWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [sentenceOptions, setSentenceOptions] = useState([]);
  const [matchedSentence, setMatchedSentence] = useState(null);
  const [showIncorrectMessage, setShowIncorrectMessage] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [speechService] = useState(() => new SpeechRecognitionService());
  const [ttsService] = useState(() => new TextToSpeechService());
  const [isComplete, setIsComplete] = useState(false);

  const estimateSpeechDuration = (text) => {
    // Rough estimate: 0.2 seconds per word + 0.5 seconds base
    const wordCount = text.split(/\s+/).length;
    return (wordCount * 0.2 + 0.5) * 1000; // Convert to milliseconds
  };

  const moveToNextSentence = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= scrambledWords.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex(nextIndex);
      updateSentenceOptions(scrambledWords, nextIndex);
    }
  };

  useEffect(() => {
    speechService.setLanguage(selectedLanguage.code);
  }, [selectedLanguage]);

  useEffect(() => {
    const scrambled = scrambleWordList(groupWords);
    setScrambledWords(scrambled);
    updateSentenceOptions(scrambled, 0);
  }, [groupWords, scrambleWordList]);

  const updateSentenceOptions = (scrambled, index) => {
    if (scrambled.length > index) {
      const correctSentence = scrambled[index].sentence;
      const otherSentences = scrambled.filter((_, i) => i !== index).map(word => word.sentence);
      const randomSentences = otherSentences
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
      
      const options = [correctSentence, ...randomSentences]
        .sort(() => Math.random() - 0.5);
      
      setSentenceOptions(options);
      setUserInput('');
      setMatchedSentence(null);
      setShowIncorrectMessage(false);
    }
  };

  const handleStartListening = () => {
    setIsListening(true);
    speechService.startListening(
      (text) => {
        setUserInput(text);
        setIsListening(false);
        
        const cleanUserText = text.toLowerCase().trim().replace(/[.,!?]/g, '');
        
        let bestMatch = null;
        let bestMatchScore = 0;
        
        sentenceOptions.forEach(sentence => {
          const cleanSentence = sentence.toLowerCase().trim().replace(/[.,!?]/g, '');
          const userWords = cleanUserText.split(' ').filter(word => word.length > 0);
          const sentenceWords = cleanSentence.split(' ').filter(word => word.length > 0);
          
          // Calculate word similarity score
          let totalSimilarity = 0;
          const matchedUserWords = new Set();
          const matchedSentenceWords = new Set();
          
          userWords.forEach(userWord => {
            let bestWordScore = 0;
            let bestSentenceWord = null;
            
            sentenceWords.forEach(sentenceWord => {
              if (matchedSentenceWords.has(sentenceWord)) return;
              
              // Exact match
              if (userWord === sentenceWord) {
                bestWordScore = 1;
                bestSentenceWord = sentenceWord;
              }
              // Partial match (one contains the other)
              else if (userWord.includes(sentenceWord) || sentenceWord.includes(userWord)) {
                const lengthRatio = Math.min(userWord.length, sentenceWord.length) / 
                                  Math.max(userWord.length, sentenceWord.length);
                bestWordScore = 0.7 * lengthRatio;
                bestSentenceWord = sentenceWord;
              }
              // Similar words (shared characters)
              else {
                const commonChars = [...userWord].filter(char => 
                  sentenceWord.includes(char)
                ).length;
                const similarity = commonChars / Math.max(userWord.length, sentenceWord.length);
                if (similarity > 0.5) {
                  bestWordScore = similarity;
                  bestSentenceWord = sentenceWord;
                }
              }
              
              if (bestWordScore > 0) {
                matchedUserWords.add(userWord);
                matchedSentenceWords.add(bestSentenceWord);
                totalSimilarity += bestWordScore;
              }
            });
          });
          
          // Calculate final score considering word order and completeness
          const wordMatchRatio = matchedUserWords.size / Math.max(userWords.length, sentenceWords.length);
          const orderBonus = 0.2; // Small bonus for matching words in similar order
          const score = (totalSimilarity / Math.max(userWords.length, sentenceWords.length)) * 0.8 + 
                       wordMatchRatio * 0.2 + orderBonus;
          
          if (score > bestMatchScore) {
            bestMatchScore = score;
            bestMatch = sentence;
          }
        });
        
        console.log(`Best match: "${bestMatch}" with score: ${bestMatchScore}`);
        
        // Always match to highest scoring sentence
        if (bestMatchScore > 0) {
          setMatchedSentence(bestMatch);
          
          // Proceed with correct answer if it's the best match
          if (bestMatch === scrambledWords[currentIndex].sentence) {
            const sentence = bestMatch;
            const duration = estimateSpeechDuration(sentence);
            
            // Set backup timer
            const backupTimer = setTimeout(() => {
              moveToNextSentence();
            }, duration + 1000); // Add 1 second buffer
            
            ttsService.speak(sentence, { 
              lang: `${selectedLanguage.code}-${selectedLanguage.code.toUpperCase()}`,
              voicePreference: voicePreference
            }, () => {
              clearTimeout(backupTimer);
              moveToNextSentence();
            });
            setShowIncorrectMessage(false);
          } else {
            setShowIncorrectMessage(true);
          }
        } else {
          setMatchedSentence(sentenceOptions[0]);
          setShowIncorrectMessage(true);
          console.log('No matches found, defaulting to first option');
        }
      },
      (error) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
        if (error === 'No speech detected within 5 seconds') {
          setShowIncorrectMessage(true);
        }
      }
    );
  };

  const handleOptionClick = (sentence) => {
    if (sentence === scrambledWords[currentIndex].sentence) {
      const duration = estimateSpeechDuration(sentence);
      
      // Set backup timer
      const backupTimer = setTimeout(() => {
        moveToNextSentence();
      }, duration + 1000); // Add 1 second buffer
      
      ttsService.speak(sentence, { 
        lang: `${selectedLanguage.code}-${selectedLanguage.code.toUpperCase()}`,
        voicePreference: voicePreference
      }, () => {
        clearTimeout(backupTimer);
        moveToNextSentence();
      });
      setShowIncorrectMessage(false);
    } else {
      setShowIncorrectMessage(true);
    }
  };

  return (
    <FadeTransition isActive={isComplete} targetPath="/congratulations">
      <div className="translate-page">
        <FadeIn>
          {scrambledWords.length > currentIndex && (
            <div>
              <p className="translated-sentence">{scrambledWords[currentIndex].translatedSentence}</p>
              
              <div className="speaking-section">
                {speechRecognition ? (
                  <button
                    onClick={handleStartListening}
                    className="speak-button"
                    disabled={isListening}
                  >
                    {isListening ? '...' : 'Speak Translation'}
                  </button>
                ) : (
                  <p className="speak-text">Say and select translation</p>
                )}
                
                <p className="user-input">
                  {userInput ? `You said: ${userInput}` : ''}
                </p>
              </div>

              <div className="options-section">
                {sentenceOptions.map((sentence, index) => {
                  const word = scrambledWords.find(w => w.sentence === sentence);
                  const showKana = selectedLanguage.code === 'ja' && word?.sentenceKana && !beginnerMode;
                  const showRomaji = selectedLanguage.code === 'ja' && word?.sentenceRomajiPinyin && beginnerMode;
                  const showPinyin = selectedLanguage.code === 'zh' && word?.sentenceRomajiPinyin;
                  
                  return (
                    <div 
                      key={index} 
                      className={`sentence-option ${matchedSentence === sentence ? 
                        (sentence === scrambledWords[currentIndex].sentence ? 'matched' : 'incorrect') : ''} 
                        ${showAnswer && sentence === scrambledWords[currentIndex].sentence ? 'matched' : ''}
                        ${!speechRecognition ? 'clickable' : ''}`}
                      onClick={() => handleOptionClick(sentence)}
                    >
                      <div className="sentence-text">{sentence}</div>
                      {(showKana || showRomaji || showPinyin) && (
                        <div className="sentence-reading">
                          {showKana ? word.sentenceKana : word.sentenceRomajiPinyin}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {showIncorrectMessage && (
                <p className="incorrect-message">
                  Keep trying or <span className="display-answer" onClick={() => {
                    setShowAnswer(true);
                    ttsService.speak(scrambledWords[currentIndex].sentence, { 
                      lang: `${selectedLanguage.code}-${selectedLanguage.code.toUpperCase()}`,
                      voicePreference: voicePreference
                    }, () => {
                      const nextIndex = currentIndex + 1;
                      setCurrentIndex(nextIndex);
                      updateSentenceOptions(scrambledWords, nextIndex);
                      setShowAnswer(false);
                    });
                  }}>display answer</span>
                </p>
              )}
            </div>
          )}
        </FadeIn>
      </div>
    </FadeTransition>
  );
}

export default Translate; 
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
    if (scrambledWords.length > 0 && nextIndex >= scrambledWords.length) {
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
      const randomSentences = otherSentences.slice(0, 2);
      
      const options = [correctSentence, ...randomSentences];
      // Shuffle the options array
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      setSentenceOptions(options);
      setUserInput('');
      setMatchedSentence(null);
      setShowIncorrectMessage(false);
    }
  };

  const handleStartListening = () => {
    setIsListening(true);
    setMatchedSentence(null);
    speechService.startListening(
      (text) => {
        setUserInput(text);
        setIsListening(false);
        
        const cleanUserText = text.toLowerCase().trim().replace(/[.,!?]/g, '');
        
        let bestMatch = null;
        let bestMatchScore = 0;
        
        sentenceOptions.forEach(sentence => {
          const cleanSentence = sentence.toLowerCase().trim().replace(/[.,!?]/g, '');
          
          // Special handling for Japanese text
          let userWords, sentenceWords;
          if (selectedLanguage.code === 'ja') {
            // For Japanese, normalize spaces and split more carefully
            const normalizedUserText = cleanUserText.replace(/\s+/g, '');
            const normalizedSentence = cleanSentence.replace(/\s+/g, '');
            
            // Split into characters for Japanese
            userWords = [...normalizedUserText];
            sentenceWords = [...normalizedSentence];
          } else {
            // For other languages, use word-based splitting
            userWords = cleanUserText.split(' ').filter(word => word.length > 0);
            sentenceWords = cleanSentence.split(' ').filter(word => word.length > 0);
          }
          
          // Skip if user said nothing
          if (userWords.length === 0) return;
          
          // Calculate word-by-word matching with improved algorithm
          let matchedWords = 0;
          let totalWordScore = 0;
          const usedSentenceWords = new Set();
          
          // First pass: try to match words in order for better accuracy
          const minLength = Math.min(userWords.length, sentenceWords.length);
          for (let i = 0; i < minLength; i++) {
            const userWord = userWords[i];
            const sentenceWord = sentenceWords[i];
            
            let score = 0;
            
            // Exact match gets highest score
            if (userWord === sentenceWord) {
              score = 1.0;
            }
            // Very close match (one character difference)
            else if (Math.abs(userWord.length - sentenceWord.length) <= 1) {
              const longer = userWord.length > sentenceWord.length ? userWord : sentenceWord;
              const shorter = userWord.length > sentenceWord.length ? sentenceWord : userWord;
              
              if (longer.includes(shorter) || shorter.includes(longer)) {
                score = 0.9;
              } else {
                // Check for single character differences
                let differences = 0;
                for (let j = 0; j < Math.min(userWord.length, sentenceWord.length); j++) {
                  if (userWord[j] !== sentenceWord[j]) differences++;
                }
                differences += Math.abs(userWord.length - sentenceWord.length);
                
                if (differences <= 1) {
                  score = 0.8;
                }
              }
            }
            // Partial match (one word contains the other)
            else if (userWord.includes(sentenceWord) || sentenceWord.includes(userWord)) {
              const minLength = Math.min(userWord.length, sentenceWord.length);
              const maxLength = Math.max(userWord.length, sentenceWord.length);
              score = (minLength / maxLength) * 0.7;
            }
            // Similar words (shared characters)
            else {
              const commonChars = [...userWord].filter(char => 
                sentenceWord.includes(char)
              ).length;
              const similarity = commonChars / Math.max(userWord.length, sentenceWord.length);
              if (similarity > 0.6) {
                score = similarity * 0.5;
              }
            }
            
            if (score > 0.1) {
              matchedWords++;
              totalWordScore += score;
              usedSentenceWords.add(sentenceWord);
            }
          }
          
          // Second pass: try to match remaining user words to unused sentence words
          for (let i = minLength; i < userWords.length; i++) {
            const userWord = userWords[i];
            let bestWordScore = 0;
            let bestSentenceWord = null;
            
            sentenceWords.forEach((sentenceWord, j) => {
              if (usedSentenceWords.has(sentenceWord) || j < minLength) return;
              
              let score = 0;
              
              // Exact match gets highest score
              if (userWord === sentenceWord) {
                score = 1.0;
              }
              // Very close match (one character difference)
              else if (Math.abs(userWord.length - sentenceWord.length) <= 1) {
                const longer = userWord.length > sentenceWord.length ? userWord : sentenceWord;
                const shorter = userWord.length > sentenceWord.length ? sentenceWord : userWord;
                
                if (longer.includes(shorter) || shorter.includes(longer)) {
                  score = 0.9;
                } else {
                  // Check for single character differences
                  let differences = 0;
                  for (let k = 0; k < Math.min(userWord.length, sentenceWord.length); k++) {
                    if (userWord[k] !== sentenceWord[k]) differences++;
                  }
                  differences += Math.abs(userWord.length - sentenceWord.length);
                  
                  if (differences <= 1) {
                    score = 0.8;
                  }
                }
              }
              // Partial match (one word contains the other)
              else if (userWord.includes(sentenceWord) || sentenceWord.includes(userWord)) {
                const minLength = Math.min(userWord.length, sentenceWord.length);
                const maxLength = Math.max(userWord.length, sentenceWord.length);
                score = (minLength / maxLength) * 0.7;
              }
              // Similar words (shared characters)
              else {
                const commonChars = [...userWord].filter(char => 
                  sentenceWord.includes(char)
                ).length;
                const similarity = commonChars / Math.max(userWord.length, sentenceWord.length);
                if (similarity > 0.6) {
                  score = similarity * 0.5;
                }
              }
              
              if (score > bestWordScore) {
                bestWordScore = score;
                bestSentenceWord = sentenceWord;
              }
            });
            
            if (bestWordScore > 0.1) {
              matchedWords++;
              totalWordScore += bestWordScore;
              usedSentenceWords.add(bestSentenceWord);
            }
          }
          
          // Calculate final score with improved weighting
          const wordMatchRatio = matchedWords / userWords.length;
          const averageWordScore = matchedWords > 0 ? totalWordScore / matchedWords : 0;
          const lengthPenalty = Math.abs(userWords.length - sentenceWords.length) * 0.03; // Even more reduced penalty
          
          // Final score: 60% word match ratio, 30% average word quality, 10% length penalty
          const score = (wordMatchRatio * 0.6) + (averageWordScore * 0.3) - (lengthPenalty * 0.1);
          
          // For Japanese, use a simpler scoring approach since we're comparing characters
          const finalScore = selectedLanguage.code === 'ja' 
            ? (wordMatchRatio * 0.8) + (averageWordScore * 0.2) - (lengthPenalty * 0.05)
            : score;
          
          console.log(`"${sentence}": score=${finalScore.toFixed(3)}, matches=${matchedWords}/${userWords.length}, avgWordScore=${averageWordScore.toFixed(3)}`);
          
          if (finalScore > bestMatchScore) {
            bestMatchScore = finalScore;
            bestMatch = sentence;
          }
        });
        
        console.log(`Best match: "${bestMatch}" with score: ${bestMatchScore.toFixed(3)}`);
        
        // Use the best match regardless of threshold
        if (bestMatch) {
          setMatchedSentence(bestMatch);
          
          // Proceed with correct answer if it's the best match
          if (bestMatch === scrambledWords[currentIndex].sentence) {
            const sentence = bestMatch;
            const duration = estimateSpeechDuration(sentence);
            
            // Set backup timer
            const backupTimer = setTimeout(() => {
              moveToNextSentence();
            }, duration + 2500); // Add 2 second buffer
            
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
          setMatchedSentence(null);
          setShowIncorrectMessage(true);
          console.log('No matches found');
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
      let hasMovedToNext = false;
      
      // Set backup timer
      const backupTimer = setTimeout(() => {
        if (!hasMovedToNext) {
          moveToNextSentence();
        }
      }, duration + 2000); // Add 2 second buffer
      
      ttsService.speak(sentence, { 
        lang: `${selectedLanguage.code}-${selectedLanguage.code.toUpperCase()}`,
        voicePreference: voicePreference
      }, () => {
        clearTimeout(backupTimer);
        if (!hasMovedToNext) {
          hasMovedToNext = true;
          moveToNextSentence();
        }
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
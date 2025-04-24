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
  const tts = new TextToSpeechService();
  const backgroundAudioRef = useRef(null);

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
        const speakGroupName = () => {
          tts.speak(selectedGroup.name, { 
            lang: `${selectedLanguage.code}-${selectedLanguage.code.toUpperCase()}`,
            voicePreference: voicePreference
          }, () => {
            if (isPlaying) {
              setTimeout(() => {
                setCurrentWordIndex(0);
              }, 600);
            }
          }, (error) => {
            console.error('Error speaking group name:', error);
            if (isPlaying) {
              setTimeout(() => {
                setCurrentWordIndex(0);
              }, 600);
            }
          });
        };
        speakGroupName();
      } else if (currentWordIndex < groupWords.length) {
        const currentWord = groupWords[currentWordIndex];
        const wordWithArticle = currentWord.article ? `${currentWord.article} ${currentWord.word}` : currentWord.word;
        const textToSpeak = selectedLanguage.code === 'ja' && currentWord.kana ? currentWord.kana : wordWithArticle;
        
        // Add a fallback timeout in case the speech synthesis fails
        const fallbackTimeout = setTimeout(() => {
          console.warn('Speech synthesis timed out, forcing progression');
          if (isPlaying) {
            setCurrentWordIndex(prev => prev + 1);
          }
        }, 3000); // 3 second fallback

        tts.speak(textToSpeak, { 
          lang: `${selectedLanguage.code}-${selectedLanguage.code.toUpperCase()}`,
          voicePreference: voicePreference
        }, () => {
          clearTimeout(fallbackTimeout);
          if (isPlaying) {
            setTimeout(() => {
              setCurrentWordIndex(prev => prev + 1);
            }, 600);
          }
        }, (error) => {
          console.error('Error speaking word:', error);
          clearTimeout(fallbackTimeout);
          if (isPlaying) {
            setTimeout(() => {
              setCurrentWordIndex(prev => prev + 1);
            }, 600);
          }
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
    if (currentWordIndex >= groupWords.length) {
      setIsPlaying(false);
      setHideContent(true);
      setTimeout(() => {
        setShouldTransition(true);
      }, 500);
    }
  }, [currentWordIndex, groupWords.length]);

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
              <div className="group-name-card">
                <h1>
                  {currentWordIndex >= 0 && currentWordIndex < groupWords.length 
                    ? (groupWords[currentWordIndex].article 
                        ? `${groupWords[currentWordIndex].article} ${groupWords[currentWordIndex].word}`
                        : groupWords[currentWordIndex].word)
                    : selectedGroup.name}
                </h1>
                <img 
                  src={isPlaying ? "/icons/pause-icon.svg" : "/icons/play-icon.svg"}
                  alt={isPlaying ? "Pause" : "Play"} 
                  className="play-icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                />
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
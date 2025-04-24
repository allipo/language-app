import { useLanguage } from '../context/LanguageContext';

class TextToSpeechService {
    constructor() {
        if (!window.speechSynthesis) {
            throw new Error('Speech synthesis not supported in this browser');
        }
        this.synthesis = window.speechSynthesis;
        this.utterance = null;
        this.voiceLoadTimeout = null;
        this.isSpeaking = false;
        this.cachedVoice = null;
        this.cachedLang = null;
        this.cachedPreference = null;
    }

    getVoiceForLanguage(lang, gender) {
        const voices = this.synthesis.getVoices();
        const languageVoices = voices.filter(voice => voice.lang.startsWith(lang));
        
        if (languageVoices.length === 0) {
            console.warn(`No voices found for language: ${lang}`);
            return null;
        }
        
        // Try to find a voice matching the gender preference
        const preferredVoices = languageVoices.filter(voice => {
            const voiceName = voice.name.toLowerCase();
            return gender === 'Female' ? 
                voiceName.includes('female') || voiceName.includes('woman') || voiceName.includes('girl') :
                voiceName.includes('male') || voiceName.includes('man') || voiceName.includes('boy');
        });
        
        // If no preferred gender voice found, return first available voice for the language
        return preferredVoices.length > 0 ? preferredVoices[0] : languageVoices[0];
    }

    updateVoice(lang, preference) {
        // Only update if language or preference changed
        if (lang !== this.cachedLang || preference !== this.cachedPreference) {
            this.cachedLang = lang;
            this.cachedPreference = preference;
            this.cachedVoice = this.getVoiceForLanguage(lang, preference);
        }
        return this.cachedVoice;
    }

    speak(text, options = {}, onEnd, onError) {
        try {
            console.log('Starting speech synthesis for:', text);
            // Cancel any ongoing speech
            this.stop();

            // Create new utterance
            this.utterance = new SpeechSynthesisUtterance(text);
            this.isSpeaking = true;

            // Set default options
            this.utterance.rate = options.rate || 1;
            this.utterance.pitch = options.pitch || 1;
            this.utterance.volume = options.volume || 1;
            this.utterance.lang = options.lang || 'en-US';

            // Set up error handling
            this.utterance.onerror = (event) => {
                console.log('Speech synthesis error:', event);
                // Ignore 'interrupted' errors as they're expected when stopping speech
                if (event.error !== 'interrupted') {
                    console.error('Speech synthesis error:', event);
                    this.isSpeaking = false;
                    if (onError) onError(event);
                }
                if (onEnd) onEnd();
            };

            // Single consolidated onend handler
            this.utterance.onend = () => {
                console.log('Speech synthesis ended');
                this.isSpeaking = false;
                if (onEnd) onEnd();
            };

            // Load voices if not already loaded
            const voices = this.synthesis.getVoices();
            console.log('Available voices:', voices.length);
            
            if (voices.length === 0) {
                console.log('No voices loaded, waiting for voiceschanged event');
                this.synthesis.onvoiceschanged = () => {
                    console.log('Voices changed event fired');
                    const voice = this.updateVoice(options.lang, options.voicePreference);
                    if (voice) this.utterance.voice = voice;
                    this.synthesis.speak(this.utterance);
                };
            } else {
                console.log('Voices already loaded, proceeding with speech');
                const voice = this.updateVoice(options.lang, options.voicePreference);
                if (voice) this.utterance.voice = voice;
                this.synthesis.speak(this.utterance);
            }
        } catch (error) {
            console.error('Error in speech synthesis:', error);
            this.isSpeaking = false;
            if (onError) onError(error);
            if (onEnd) onEnd();
        }
    }

    stop() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            if (this.voiceLoadTimeout) {
                clearTimeout(this.voiceLoadTimeout);
                this.voiceLoadTimeout = null;
            }
        }
    }

    pause() {
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.pause();
        }
    }

    resume() {
        if (this.synthesis) {
            this.synthesis.resume();
        }
    }
}

export default TextToSpeechService; 
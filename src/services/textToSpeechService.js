import { useLanguage } from '../context/LanguageContext';

class TextToSpeechService {
    constructor() {
        if (!window.speechSynthesis) {
            throw new Error('Speech synthesis not supported in this browser');
        }
        this.synthesis = window.speechSynthesis;
        this.utterance = null;
        this.voiceLoadTimeout = null;
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

    speak(text, options = {}, onEnd) {
        try {
            // Cancel any ongoing speech
            this.stop();

            // Create new utterance
            this.utterance = new SpeechSynthesisUtterance(text);

            // Set default options
            this.utterance.rate = options.rate || 1;
            this.utterance.pitch = options.pitch || 1;
            this.utterance.volume = options.volume || 1;
            this.utterance.lang = options.lang || 'en-US';

            // Set up error handling
            this.utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                if (onEnd) onEnd();
            };

            // Load voices if not already loaded
            if (this.synthesis.getVoices().length === 0) {
                // Set a timeout in case voices never load
                this.voiceLoadTimeout = setTimeout(() => {
                    console.warn('Voice loading timed out, proceeding with default voice');
                    this.synthesis.speak(this.utterance);
                }, 5000);

                this.synthesis.onvoiceschanged = () => {
                    clearTimeout(this.voiceLoadTimeout);
                    const voice = this.getVoiceForLanguage(options.lang, options.voicePreference);
                    if (voice) this.utterance.voice = voice;
                    this.synthesis.speak(this.utterance);
                };
            } else {
                const voice = this.getVoiceForLanguage(options.lang, options.voicePreference);
                if (voice) this.utterance.voice = voice;
                this.synthesis.speak(this.utterance);
            }

            if (onEnd) {
                this.utterance.onend = onEnd;
            }
        } catch (error) {
            console.error('Error in speech synthesis:', error);
            if (onEnd) onEnd();
        }
    }

    stop() {
        if (this.synthesis) {
            this.synthesis.cancel();
            if (this.voiceLoadTimeout) {
                clearTimeout(this.voiceLoadTimeout);
                this.voiceLoadTimeout = null;
            }
        }
    }

    pause() {
        if (this.synthesis) {
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
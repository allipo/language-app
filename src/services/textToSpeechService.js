import { useLanguage } from '../context/LanguageContext';

class TextToSpeechService {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.utterance = null;
    }

    getVoiceForLanguage(lang, gender) {
        const voices = this.synthesis.getVoices();
        const languageVoices = voices.filter(voice => voice.lang.startsWith(lang));
        
        if (languageVoices.length === 0) return null;
        
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
        // Cancel any ongoing speech
        this.stop();

        // Create new utterance
        this.utterance = new SpeechSynthesisUtterance(text);

        // Set default options
        this.utterance.rate = options.rate || 1;
        this.utterance.pitch = options.pitch || 1;
        this.utterance.volume = options.volume || 1;
        this.utterance.lang = options.lang || 'en-US';

        // Load voices if not already loaded
        if (this.synthesis.getVoices().length === 0) {
            this.synthesis.onvoiceschanged = () => {
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
    }

    stop() {
        if (this.synthesis) {
            this.synthesis.cancel();
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
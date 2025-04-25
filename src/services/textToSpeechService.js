import { useLanguage } from '../context/LanguageContext';

class TextToSpeechService {
    constructor() {
        if (!window.speechSynthesis) {
            throw new Error('Speech synthesis not supported in this browser');
        }
        this.synthesis = window.speechSynthesis;
        this.utterance = null;
        this.isSpeaking = false;
        this.cachedVoice = null;
        this.cachedLang = null;
        this.cachedPreference = null;
        this.voicesLoaded = false;
        
        // Load voices once
        if (this.synthesis.getVoices().length === 0) {
            this.synthesis.onvoiceschanged = () => {
                this.voicesLoaded = true;
            };
        } else {
            this.voicesLoaded = true;
        }
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
        
        return preferredVoices.length > 0 ? preferredVoices[0] : languageVoices[0];
    }

    updateVoice(lang, preference) {
        // Only update if language, preference, or voices haven't been loaded yet
        if (lang !== this.cachedLang || preference !== this.cachedPreference || !this.voicesLoaded) {
            this.cachedLang = lang;
            this.cachedPreference = preference;
            this.cachedVoice = this.getVoiceForLanguage(lang, preference);
        }
        return this.cachedVoice;
    }

    speak(text, options = {}, onEnd, onError) {
        try {
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
                // Check if error is due to interruption
                if (event.error === 'interrupted') {
                    console.log('Speech interrupted - this is expected when starting new speech');
                    this.isSpeaking = false;
                    if (this.completionCheckInterval) {
                        clearInterval(this.completionCheckInterval);
                    }
                    return;
                }
                
                console.error('Speech synthesis error:', event);
                this.isSpeaking = false;
                if (this.completionCheckInterval) {
                    clearInterval(this.completionCheckInterval);
                }
                if (onError) onError(event);
                if (onEnd) onEnd();
            };

            this.utterance.onend = () => {
                console.log('Speech completed normally via onend event');
                this.isSpeaking = false;
                if (this.completionCheckInterval) {
                    clearInterval(this.completionCheckInterval);
                }
                if (onEnd) onEnd();
            };

            // Add a check for speech completion
            const checkCompletion = () => {
                if (!this.synthesis.speaking && this.isSpeaking) {
                    console.log('Speech completed via interval check');
                    this.isSpeaking = false;
                    if (this.completionCheckInterval) {
                        clearInterval(this.completionCheckInterval);
                    }
                    if (onEnd) onEnd();
                }
            };
            
            // Check every 100ms if speech is still going
            this.completionCheckInterval = setInterval(checkCompletion, 100);

            // Get or update voice
            const voice = this.updateVoice(options.lang, options.voicePreference);
            if (voice) this.utterance.voice = voice;
            
            // Speak
            this.synthesis.speak(this.utterance);
        } catch (error) {
            console.error('Error in speech synthesis:', error);
            this.isSpeaking = false;
            if (this.completionCheckInterval) {
                clearInterval(this.completionCheckInterval);
            }
            if (onError) onError(error);
            if (onEnd) onEnd();
        }
    }

    stop() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            if (this.completionCheckInterval) {
                clearInterval(this.completionCheckInterval);
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
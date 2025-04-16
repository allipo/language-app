class SpeechRecognitionService {
    constructor() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            throw new Error('Speech recognition not supported in this browser');
        }
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'de-DE';
        this.isListening = false;
        this.timeoutId = null;
        this.hasDetectedSpeech = false;
    }

    setLanguage(languageCode) {
        this.recognition.lang = `${languageCode}-${languageCode.toUpperCase()}`;
    }

    startListening(onResult, onError) {
        this.stop();
        this.hasDetectedSpeech = false;

        setTimeout(() => {
            this.isListening = true;
            
            this.recognition.onresult = (event) => {
                if (!this.isListening) return;
                
                const results = event.results;
                if (!results || results.length === 0) return;

                // Get the last result
                const last = results.length - 1;
                const transcript = results[last][0].transcript;
                
                // If we haven't detected speech yet and got a result, mark as detected
                if (!this.hasDetectedSpeech && transcript.trim()) {
                    this.hasDetectedSpeech = true;
                    clearTimeout(this.timeoutId);
                }

                // Only process final results
                if (results[last].isFinal) {
                    onResult(transcript);
                    this.stop();
                }
            };

            this.recognition.onerror = (event) => {
                if (!this.isListening) return;
                
                clearTimeout(this.timeoutId);
                this.isListening = false;
                if (onError) onError(event.error);
            };

            this.recognition.onend = () => {
                if (!this.isListening) return;
                
                clearTimeout(this.timeoutId);
                this.isListening = false;
            };

            this.recognition.onstart = () => {
                this.timeoutId = setTimeout(() => {
                    if (this.isListening && !this.hasDetectedSpeech) {
                        this.stop();
                        onError('No speech detected within 5 seconds');
                    }
                }, 5000);
            };

            try {
                this.recognition.start();
            } catch (error) {
                clearTimeout(this.timeoutId);
                this.isListening = false;
                onError(error);
            }
        }, 100);
    }

    stop() {
        if (this.isListening) {
            clearTimeout(this.timeoutId);
            this.recognition.stop();
            this.isListening = false;
            this.hasDetectedSpeech = false;
        }
    }
}

export default SpeechRecognitionService; 
class CommentarySpeechSynthesizer {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voice = null;
        this.utterance = null;
        this.commentaryText = '';
        this.isPlaying = false;
        this.isPaused = false;
        this.currentPosition = 0;
        this.sentences = [];
        this.currentSentenceIndex = 0;
        this.videoPlayer = document.getElementById('results-video');
        
        // Initialize voices
        this.loadVoices();
        
        // Reload voices if they change
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
        }
    }
    
    loadVoices() {
        // Get available voices
        const voices = this.synth.getVoices();
        
        if (voices.length > 0) {
            // Try to find a good English voice
            const preferredVoices = voices.filter(voice => 
                (voice.lang.includes('en-GB') || voice.lang.includes('en-US')) && 
                voice.name.includes('Male'));
            
            // If preferred voice is found, use it, otherwise use the first English voice
            if (preferredVoices.length > 0) {
                this.voice = preferredVoices[0];
            } else {
                const englishVoices = voices.filter(voice => voice.lang.includes('en'));
                this.voice = englishVoices.length > 0 ? englishVoices[0] : voices[0];
            }
            
            console.log("Selected voice:", this.voice.name);
        }
    }
    
    setCommentary(text) {
        this.commentaryText = text;
        this.sentences = this.splitIntoSentences(text);
        this.currentSentenceIndex = 0;
        console.log(`Commentary set with ${this.sentences.length} sentences`);
    }
    
    splitIntoSentences(text) {
        // Split text into sentences for better speech synthesis
        return text.split(/(?<=[.!?])\s+/);
    }
    
    play() {
        if (this.isPlaying) return;
        
        if (this.isPaused) {
            this.resume();
            return;
        }
        
        if (!this.commentaryText) {
            console.warn("No commentary text set");
            return;
        }
        
        // Play the video
        if (this.videoPlayer) {
            const playPromise = this.videoPlayer.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Error playing video:", error);
                });
            }
        }
        
        this.isPlaying = true;
        this.speakNextSentence();
    }
    
    speakNextSentence() {
        if (this.currentSentenceIndex >= this.sentences.length) {
            this.isPlaying = false;
            this.currentSentenceIndex = 0;
            this.onCommentaryEnd();
            return;
        }
        
        const sentence = this.sentences[this.currentSentenceIndex];
        this.utterance = new SpeechSynthesisUtterance(sentence);
        
        if (this.voice) {
            this.utterance.voice = this.voice;
        }
        
        this.utterance.rate = 0.9; // Slightly slower for better clarity
        this.utterance.pitch = 1.0;
        this.utterance.volume = 1.0;
        
        // Set handlers
        this.utterance.onend = () => {
            this.currentSentenceIndex++;
            this.speakNextSentence();
        };
        
        this.utterance.onerror = (event) => {
            console.error("Speech synthesis error:", event);
            this.isPlaying = false;
        };
        
        // Highlight current sentence
        this.onSentenceChange(sentence, this.currentSentenceIndex);
        
        // Speak the sentence
        this.synth.speak(this.utterance);
    }
    
    pause() {
        if (!this.isPlaying) return;
        
        this.synth.pause();
        this.isPaused = true;
        this.isPlaying = false;
        
        // Pause the video as well
        if (this.videoPlayer && !this.videoPlayer.paused) {
            this.videoPlayer.pause();
        }
    }
    
    resume() {
        if (!this.isPaused) return;
        
        this.synth.resume();
        this.isPaused = false;
        this.isPlaying = true;
        
        // Resume the video as well
        if (this.videoPlayer && this.videoPlayer.paused) {
            this.videoPlayer.play();
        }
    }
    
    stop() {
        this.synth.cancel();
        this.isPaused = false;
        this.isPlaying = false;
        this.currentSentenceIndex = 0;
        
        // Stop the video as well
        if (this.videoPlayer && !this.videoPlayer.paused) {
            this.videoPlayer.pause();
        }
    }
    
    // Callback functions to be overridden
    onSentenceChange(sentence, index) {
        // Override this function to highlight current sentence
    }
    
    onCommentaryEnd() {
        // Make sure video keeps playing until it naturally ends
        console.log("Commentary ended, but video will continue playing");
    }
}

// Initialize the player when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Get the commentary text
    const commentaryElement = document.getElementById('commentary-text');
    const commentaryText = commentaryElement ? commentaryElement.textContent.trim() : '';
    
    // Get video element
    const videoPlayer = document.getElementById('results-video');
    
    // Initialize the speech synthesizer if we have commentary
    if (commentaryText) {
        const speechSynthesizer = new CommentarySpeechSynthesizer();
        speechSynthesizer.setCommentary(commentaryText);
        
        // Override callbacks
        speechSynthesizer.onSentenceChange = function(sentence, index) {
            // Create a highlighted version of the text
            const sentences = speechSynthesizer.sentences;
            const highlightedText = sentences.map((s, i) => 
                i === index ? `<span class="highlight-sentence">${s}</span>` : s
            ).join(' ');
            
            // Update the UI with highlighted text
            if (commentaryElement) {
                commentaryElement.innerHTML = highlightedText;
            }
        };
        
        speechSynthesizer.onCommentaryEnd = function() {
            const playButton = document.getElementById('play-commentary');
            if (playButton) {
                playButton.innerHTML = '<i class="bi bi-play-fill"></i> Play Commentary';
                playButton.classList.remove('btn-danger');
                playButton.classList.add('btn-success');
            }
            
            // Reset the commentary text display
            if (commentaryElement) {
                commentaryElement.innerHTML = commentaryText;
            }
            
            // Don't pause the video - let it continue playing
            // This is the key change we're making
        };
        
        // Set up the play button
        const playButton = document.getElementById('play-commentary');
        if (playButton) {
            playButton.addEventListener('click', function() {
                if (speechSynthesizer.isPlaying || speechSynthesizer.isPaused) {
                    speechSynthesizer.stop();
                    playButton.innerHTML = '<i class="bi bi-play-fill"></i> Play Commentary';
                    playButton.classList.remove('btn-danger');
                    playButton.classList.add('btn-success');
                    // Note: This will pause the video when commentary is stopped
                } else {
                    speechSynthesizer.play();
                    playButton.innerHTML = '<i class="bi bi-stop-fill"></i> Stop Commentary';
                    playButton.classList.remove('btn-success');
                    playButton.classList.add('btn-danger');
                    // The video will be played by the speechSynthesizer.play() method
                }
            });
        }
        
        // Sync video end with speech synthesizer
        if (videoPlayer) {
            videoPlayer.addEventListener('pause', function() {
                // If video pauses naturally and speech is still going, stop the speech
                if (speechSynthesizer.isPlaying && !speechSynthesizer.isPaused) {
                    speechSynthesizer.stop();
                    if (playButton) {
                        playButton.innerHTML = '<i class="bi bi-play-fill"></i> Play Commentary';
                        playButton.classList.remove('btn-danger');
                        playButton.classList.add('btn-success');
                    }
                }
            });
            
            videoPlayer.addEventListener('ended', function() {
                // If video ends naturally and speech is still going, stop the speech
                if (speechSynthesizer.isPlaying) {
                    speechSynthesizer.stop();
                    if (playButton) {
                        playButton.innerHTML = '<i class="bi bi-play-fill"></i> Play Commentary';
                        playButton.classList.remove('btn-danger');
                        playButton.classList.add('btn-success');
                    }
                }
            });
        }
    }
    
    // Rest of the event handling code...
    // (The events section code is kept unchanged)
});
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

        this.loadVoices();

        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
        }
    }

    loadVoices() {
        const voices = this.synth.getVoices();
        if (voices.length > 0) {
            const preferredVoices = voices.filter(voice =>
                (voice.lang.includes('en-GB') || voice.lang.includes('en-US')) &&
                voice.name.includes('Male'));

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

        this.utterance.rate = 0.9;
        this.utterance.pitch = 1.0;
        this.utterance.volume = 1.0;

        this.utterance.onend = () => {
            this.currentSentenceIndex++;
            this.speakNextSentence();
        };

        this.utterance.onerror = (event) => {
            console.error("Speech synthesis error:", event);
            this.isPlaying = false;
        };

        this.onSentenceChange(sentence, this.currentSentenceIndex);
        this.synth.speak(this.utterance);
    }

    pause() {
        if (!this.isPlaying) return;

        this.synth.pause();
        this.isPaused = true;
        this.isPlaying = false;

        if (this.videoPlayer && !this.videoPlayer.paused) {
            this.videoPlayer.pause();
        }
    }

    resume() {
        if (!this.isPaused) return;

        this.synth.resume();
        this.isPaused = false;
        this.isPlaying = true;

        if (this.videoPlayer && this.videoPlayer.paused) {
            this.videoPlayer.play();
        }
    }

    stop() {
        this.synth.cancel();
        this.isPaused = false;
        this.isPlaying = false;
        this.currentSentenceIndex = 0;

        if (this.videoPlayer && !this.videoPlayer.paused) {
            this.videoPlayer.pause();
        }
    }

    // Override these as needed
    onSentenceChange(sentence, index) {}
    onCommentaryEnd() {
        console.log("Commentary ended");
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const commentaryElement = document.getElementById('commentary-text');
    const commentaryText = commentaryElement ? commentaryElement.textContent.trim() : '';
    const videoPlayer = document.getElementById('results-video');

    if (commentaryText) {
        const speechSynthesizer = new CommentarySpeechSynthesizer();
        speechSynthesizer.setCommentary(commentaryText);

        speechSynthesizer.onSentenceChange = function (sentence, index) {
            const sentences = speechSynthesizer.sentences;
            const highlightedText = sentences.map((s, i) =>
                i === index ? `<span class="highlight-sentence">${s}</span>` : s
            ).join(' ');

            if (commentaryElement) {
                commentaryElement.innerHTML = highlightedText;
            }
        };

        speechSynthesizer.onCommentaryEnd = function () {
            const playButton = document.getElementById('play-commentary');
            if (playButton) {
                playButton.innerHTML = '<i class="bi bi-play-fill"></i> Play Commentary';
                playButton.classList.remove('btn-danger');
                playButton.classList.add('btn-success');
            }

            if (commentaryElement) {
                commentaryElement.innerHTML = commentaryText;
            }
        };

        const playButton = document.getElementById('play-commentary');
        if (playButton) {
            playButton.addEventListener('click', function () {
                if (speechSynthesizer.isPlaying || speechSynthesizer.isPaused) {
                    speechSynthesizer.stop();
                    playButton.innerHTML = '<i class="bi bi-play-fill"></i> Play Commentary';
                    playButton.classList.remove('btn-danger');
                    playButton.classList.add('btn-success');
                } else {
                    speechSynthesizer.play();
                    playButton.innerHTML = '<i class="bi bi-stop-fill"></i> Stop Commentary';
                    playButton.classList.remove('btn-success');
                    playButton.classList.add('btn-danger');
                }
            });
        }

        // Remove the part that stops speech when video ends
        if (videoPlayer) {
            videoPlayer.addEventListener('pause', function () {
                // Do not stop the speech
            });

            videoPlayer.addEventListener('ended', function () {
                // Do not stop the speech
            });
        }
    }
});

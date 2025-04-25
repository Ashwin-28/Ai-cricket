def text_to_speech(text, output_path, video_duration=None):
    """Convert text to speech and save as an audio file.
    
    Args:
        text: The text to convert to speech
        output_path: Path where the audio file will be saved
        video_duration: Duration of the video in seconds (optional)
    
    Returns:
        Boolean indicating success
    """
    import logging
    import os
    
    logger = logging.getLogger(__name__)
    logger.info(f"Converting text to speech: {len(text)} characters")
    
    try:
        # Try to use TTS libraries if available
        try:
            import pyttsx3
            engine = pyttsx3.init()
            
            # If video duration is provided, adjust speech rate
            if video_duration:
                # Calculate appropriate speech rate
                # Average reading speed is ~150 words per minute
                word_count = len(text.split())
                target_duration = video_duration * 0.75  # Target 75% of video duration
                
                # Calculate words per minute needed
                target_wpm = (word_count / target_duration) * 60
                
                # Convert to rate multiplier (pyttsx3 default is 200 wpm)
                rate_multiplier = target_wpm / 200
                
                # Clamp to reasonable values
                rate_multiplier = max(0.5, min(rate_multiplier, 2.0))
                
                # Set the speech rate
                default_rate = engine.getProperty('rate')
                new_rate = int(default_rate * rate_multiplier)
                engine.setProperty('rate', new_rate)
                
                logger.info(f"Adjusted speech rate: {new_rate} (multiplier: {rate_multiplier:.2f})")
            
            engine.save_to_file(text, output_path)
            engine.runAndWait()
            return True
        
        except ImportError:
            logger.warning("pyttsx3 not available, trying gTTS")
            try:
                from gtts import gTTS
                tts = gTTS(text=text, lang='en', slow=False)
                tts.save(output_path)
                return True
            except ImportError:
                logger.warning("gTTS not available, using sample audio")
                return False
    
    except Exception as e:
        logger.error(f"Error in text-to-speech conversion: {str(e)}")
        return False
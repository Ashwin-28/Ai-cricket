def process_video(video_path, output_video_path):
    """Process the video and detect cricket events.
    
    Args:
        video_path: Path to the input video
        output_video_path: Path where processed video will be saved
        
    Returns:
        Dictionary containing detected events and video duration in seconds
    """
    import cv2
    import time
    import random
    import os
    import logging
    
    logger = logging.getLogger(__name__)
    logger.info(f"Processing video: {video_path}")
    
    # Open the video file to get its properties
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"Could not open video file: {video_path}")
            raise Exception(f"Could not open video file: {video_path}")
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration_seconds = frame_count / fps if fps > 0 else 0
        
        logger.info(f"Video FPS: {fps}, Total frames: {frame_count}")
        logger.info(f"Video duration: {duration_seconds:.2f} seconds")
        
        # For demo purposes, we'll simulate processing by copying the input video
        # In a real implementation, this would analyze and annotate the video
        if os.path.exists(video_path) and not os.path.exists(output_video_path):
            import shutil
            # Check if this is a sample video (for demo mode)
            if 'sample' in video_path:
                # Just point to the same sample file
                logger.info(f"Using sample video as output: {video_path}")
                output_video_path = video_path
            else:
                # Copy the video file for real uploads
                logger.info(f"Copying {video_path} to {output_video_path}")
                shutil.copy(video_path, output_video_path)
        
        # Generate simulated events based on video duration
        events = generate_simulated_events(duration_seconds)
        
        # Include video duration in the return value
        return {"events": events, "duration": duration_seconds}
        
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        # Return minimal data with the error
        return {"events": [], "duration": 0, "error": str(e)}
    finally:
        if 'cap' in locals() and cap.isOpened():
            cap.release()

def generate_simulated_events(video_duration=120):
    """Generate simulated cricket events for demonstration purposes.
    
    Args:
        video_duration: Duration of the video in seconds
    
    Returns:
        List of event dictionaries
    """
    import random
    import logging
    
    logger = logging.getLogger(__name__)
    logger.info(f"Generating simulated events for {video_duration} seconds video")
    
    # Scale events based on video duration
    # Base assumptions for a 2-minute video
    BASE_DURATION = 120  # 2 minutes in seconds
    BASE_EVENT_COUNT = 15
    
    # Scale event count based on duration
    scaled_event_count = int(BASE_EVENT_COUNT * (video_duration / BASE_DURATION))
    
    # Ensure a minimum number of events
    event_count = max(5, scaled_event_count)
    logger.info(f"Generating {event_count} scaled events")
    
    events = []
    timestamp = 0
    
    shot_types = ['drive', 'cut', 'pull', 'sweep', 'flick', 'generic']
    
    # Add an event marking the start of the match
    events.append({
        'type': 'match_start',
        'subtype': 'toss',
        'timestamp': 0,
        'description': 'Match begins',
        'confidence': 0.98
    })
    
    # Generate events at timestamps throughout the video
    for i in range(event_count):
        # Space events throughout the video
        progress_ratio = (i+1) / (event_count+1)
        timestamp = round(progress_ratio * video_duration * 0.95)  # Stop at 95% of video
        
        # Determine event type with weighted randomness
        event_type_roll = random.random()
        
        if event_type_roll < 0.7:  # 70% chance of shots
            event = {
                'type': 'shot_played',
                'subtype': random.choice(shot_types),
                'timestamp': timestamp,
                'description': f'Batsman plays a {shot_types} shot',
                'confidence': round(random.uniform(0.70, 0.98), 2)
            }
            events.append(event)
            
        elif event_type_roll < 0.85:  # 15% chance of boundaries
            boundary_type = 'four' if random.random() < 0.7 else 'six'
            event = {
                'type': 'boundary',
                'subtype': boundary_type,
                'timestamp': timestamp,
                'description': f'Batsman hits a {boundary_type}',
                'confidence': round(random.uniform(0.85, 0.98), 2)
            }
            events.append(event)
            
        else:  # 15% chance of wickets
            wicket_types = ['bowled', 'caught', 'lbw', 'run_out']
            event = {
                'type': 'wicket',
                'subtype': random.choice(wicket_types),
                'timestamp': timestamp,
                'description': 'Batsman is out',
                'confidence': round(random.uniform(0.80, 0.95), 2)
            }
            events.append(event)
    
    # Add event for match conclusion
    events.append({
        'type': 'match_end',
        'subtype': 'completion',
        'timestamp': int(video_duration * 0.98),
        'description': 'Match concludes',
        'confidence': 0.99
    })
    
    # Sort events by timestamp
    events.sort(key=lambda x: x['timestamp'])
    return events
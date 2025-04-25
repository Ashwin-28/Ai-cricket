def generate_commentary(analysis_results):
    """Generate cricket commentary based on detected events.
    
    Args:
        analysis_results: Dictionary containing events and video duration
    
    Returns:
        String containing the commentary text
    """
    import logging
    import random
    import math
    
    logger = logging.getLogger(__name__)
    
    # Extract events and duration from analysis results
    events = analysis_results.get("events", [])
    video_duration = analysis_results.get("duration", 120)  # Default to 120 seconds if not provided
    
    logger.info(f"Generating commentary for {len(events)} events over {video_duration:.2f} seconds")
    
    if not events:
        return "No cricket events detected in this video. The analysis model could not identify any specific cricket actions."
    
    # Calculate commentary density based on video duration
    # For shorter videos (under 1 minute), provide more detailed commentary
    # For longer videos (over 5 minutes), be more selective about which events get commentary
    
    short_duration = 60  # 1 minute
    long_duration = 300  # 5 minutes
    
    if video_duration <= short_duration:
        # For short videos, comment on almost everything
        commentary_density = 0.9
        verbosity = "high"
    elif video_duration >= long_duration:
        # For long videos, be more selective
        commentary_density = 0.5
        verbosity = "low"
    else:
        # For medium length videos, scale linearly
        t = (video_duration - short_duration) / (long_duration - short_duration)
        commentary_density = 0.9 - (t * 0.4)  # Scale from 0.9 to 0.5
        verbosity = "medium"
    
    logger.info(f"Using commentary density: {commentary_density:.2f}, verbosity: {verbosity}")
    
    # Introduction
    commentary = ["Welcome to our cricket match analysis!"]
    
    # Target words per minute for natural speech
    target_wpm = 150
    
    # Estimate total word budget based on video duration
    # We want commentary to last approximately 75% of the video duration
    word_budget = math.ceil((video_duration * 0.75 * target_wpm) / 60)
    
    logger.info(f"Commentary word budget: {word_budget} words")
    
    # Calculate words per event based on selected events
    selected_events = []
    for event in events:
        if random.random() < commentary_density:
            selected_events.append(event)
    
    # Ensure we have at least 3 events
    if len(selected_events) < 3 and len(events) >= 3:
        # Pick events systematically: start, middle, end
        indices = [0, len(events)//2, len(events)-1]
        selected_events = [events[i] for i in indices]
    
    # If we still don't have enough events, use what we have
    if not selected_events and events:
        selected_events = events[:min(3, len(events))]
    
    words_per_event = word_budget // max(1, len(selected_events))
    
    logger.info(f"Selected {len(selected_events)} events for commentary, targeting {words_per_event} words per event")
    
    # Generate commentary for each selected event
    for event in selected_events:
        event_type = event.get('type', 'unknown')
        subtype = event.get('subtype', 'generic')
        timestamp = event.get('timestamp', 0)
        
        # Convert timestamp to minutes and seconds
        minutes = timestamp // 60
        seconds = timestamp % 60
        time_str = f"{minutes}m {seconds}s" if minutes > 0 else f"{seconds}s"
        
        if event_type == 'match_start':
            comments = [
                "The players are taking the field as we get ready for some exciting cricket action.",
                "Welcome to this cricket match. The teams are ready and we're about to begin.",
                "The umpires are in position and we're all set for the start of this cricket match."
            ]
            commentary.append(random.choice(comments))
            
        elif event_type == 'shot_played':
            if subtype == 'drive':
                comments = [
                    f"At {time_str}, that's a beautiful drive through the covers by the batsman.",
                    f"What a magnificent drive at {time_str}! The timing was impeccable.",
                    f"The batsman executes a textbook drive at {time_str}, sending the ball racing to the boundary."
                ]
            elif subtype == 'cut':
                comments = [
                    f"A powerful cut shot at {time_str} by the batsman.",
                    f"The batsman cuts the ball away at {time_str}, finding the gap perfectly.",
                    f"That's a decisive cut shot at {time_str}, showing great technique."
                ]
            elif subtype == 'pull':
                comments = [
                    f"The batsman pulls that delivery at {time_str} with authority.",
                    f"A strong pull shot at {time_str}, showing the batsman's strength.",
                    f"At {time_str}, the short ball is pulled away confidently by the batsman."
                ]
            elif subtype == 'sweep':
                comments = [
                    f"The batsman goes down on one knee and sweeps at {time_str}.",
                    f"A well-executed sweep shot at {time_str}, countering the spin effectively.",
                    f"At {time_str}, that's an elegant sweep by the batsman."
                ]
            elif subtype == 'flick':
                comments = [
                    f"A delicate flick off the pads at {time_str}.",
                    f"The batsman flicks the ball at {time_str} with a deft touch.",
                    f"At {time_str}, that's a wonderful flick, showing the batsman's wristwork."
                ]
            else:  # generic
                comments = [
                    f"The batsman plays a confident shot at {time_str}.",
                    f"At {time_str}, that's good batting technique on display.",
                    f"A well-timed shot by the batsman at {time_str}."
                ]
            commentary.append(random.choice(comments))
            
        elif event_type == 'boundary':
            if subtype == 'four':
                comments = [
                    f"FOUR! The ball races to the boundary at {time_str}.",
                    f"At {time_str}, that's a cracking shot for FOUR!",
                    f"The batsman finds the boundary rope at {time_str}. That's FOUR runs!"
                ]
            else:  # six
                comments = [
                    f"SIX! The ball sails over the boundary at {time_str}.",
                    f"At {time_str}, what a magnificent strike for SIX!",
                    f"The batsman clears the rope with ease at {time_str}. That's a massive SIX!"
                ]
            commentary.append(random.choice(comments))
            
        elif event_type == 'wicket':
            if subtype == 'bowled':
                comments = [
                    f"OUT! The batsman is bowled at {time_str}. The stumps are shattered!",
                    f"At {time_str}, that's the end of the batsman's innings - clean bowled!",
                    f"The bowler hits the timber at {time_str}! That's a big wicket."
                ]
            elif subtype == 'caught':
                comments = [
                    f"OUT! Caught at {time_str}. The fielder takes a good catch.",
                    f"At {time_str}, the batsman is caught! A crucial breakthrough.",
                    f"The batsman skies it at {time_str} and is caught. That's the end of a good innings."
                ]
            elif subtype == 'lbw':
                comments = [
                    f"OUT! LBW at {time_str}. The umpire raises the finger without hesitation.",
                    f"At {time_str}, that's plumb in front! The batsman is out LBW.",
                    f"The ball strikes the pad at {time_str} and the batsman is given out LBW."
                ]
            elif subtype == 'run_out':
                comments = [
                    f"OUT! Run out at {time_str}. Brilliant fielding!",
                    f"At {time_str}, there's a mix-up between the batsmen and that's a run out!",
                    f"The batsman is well short of the crease at {time_str}. That's a run out!"
                ]
            else:
                comments = [
                    f"OUT! The batsman is dismissed at {time_str}.",
                    f"At {time_str}, that's another wicket! The fielding team is jubilant.",
                    f"The batsman has to walk back to the pavilion at {time_str}. Big moment in the game!"
                ]
            commentary.append(random.choice(comments))
            
        elif event_type == 'match_end':
            comments = [
                "And that concludes our cricket match. What a fantastic display of cricket we've witnessed today!",
                "The match comes to an end. Thanks for joining us for this exciting cricket action!",
                "That's the end of the match. We hope you enjoyed the cricket as much as we did!"
            ]
            commentary.append(random.choice(comments))
    
    # Ensure we have a conclusion if not already added
    if not any(event.get('type') == 'match_end' for event in selected_events):
        conclusion = "And that brings us to the end of our analysis. Thanks for watching!"
        commentary.append(conclusion)
    
    # Join all commentary sentences
    full_commentary = " ".join(commentary)
    
    # Log the word count
    word_count = len(full_commentary.split())
    logger.info(f"Generated commentary with {word_count} words")
    
    return full_commentary
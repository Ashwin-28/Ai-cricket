// Speech synthesizer for cricket commentary
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const video = document.getElementById('results-video');
    const playCommentaryBtn = document.getElementById('play-commentary');
    const commentaryText = document.getElementById('commentary-text');
    const eventsButton = document.getElementById('events-button');
    
    // Get audio path from the page data
    const commentaryAudioPath = document.querySelector('[download]').href;
    
    // Create audio element for commentary
    const commentaryAudio = new Audio(commentaryAudioPath);
    
    // Flag to track if commentary is playing
    let isCommentaryPlaying = false;
    
    // Play commentary function
    playCommentaryBtn.addEventListener('click', function() {
        if (!isCommentaryPlaying) {
            // Start the video and commentary together
            video.currentTime = 0;
            video.play();
            commentaryAudio.currentTime = 0;
            commentaryAudio.play();
            
            // Update button text
            playCommentaryBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pause Commentary';
            isCommentaryPlaying = true;
        } else {
            // Pause both video and commentary
            video.pause();
            commentaryAudio.pause();
            
            // Update button text
            playCommentaryBtn.innerHTML = '<i class="bi bi-play-fill"></i> Play Commentary';
            isCommentaryPlaying = false;
        }
    });
    
    // Synchronize commentary with video
    video.addEventListener('pause', function() {
        if (isCommentaryPlaying) {
            commentaryAudio.pause();
            playCommentaryBtn.innerHTML = '<i class="bi bi-play-fill"></i> Play Commentary';
            isCommentaryPlaying = false;
        }
    });
    
    // When video ends, reset commentary
    video.addEventListener('ended', function() {
        if (isCommentaryPlaying) {
            commentaryAudio.pause();
            commentaryAudio.currentTime = 0;
            playCommentaryBtn.innerHTML = '<i class="bi bi-play-fill"></i> Play Commentary';
            isCommentaryPlaying = false;
        }
    });
    
    // Load cricket events
    function loadCricketEvents() {
        fetch('/api/events')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    displayEvents(data.events);
                }
            })
            .catch(error => {
                console.error('Error fetching events:', error);
                document.getElementById('cricket-events').innerHTML = 
                    '<div class="alert alert-danger">Failed to load events. Please try refreshing the page.</div>';
            });
    }
    
    // Display events in the UI
    function displayEvents(events) {
        const eventsContainer = document.getElementById('cricket-events');
        if (!events || events.length === 0) {
            eventsContainer.innerHTML = '<div class="alert alert-info">No events detected in this video.</div>';
            return;
        }
        
        let html = '<div class="table-responsive"><table class="table table-dark table-hover">';
        html += '<thead><tr><th>Time</th><th>Event</th><th>Details</th><th>Action</th></tr></thead><tbody>';
        
        events.forEach(event => {
            // Format time as MM:SS
            const minutes = Math.floor(event.timestamp / 60);
            const seconds = Math.floor(event.timestamp % 60);
            const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Get icon based on event type
            let icon, badgeClass;
            switch(event.type) {
                case 'boundary':
                    icon = event.subtype === 'four' ? 'bi-4-circle-fill' : 'bi-6-circle-fill';
                    badgeClass = event.subtype === 'four' ? 'bg-info' : 'bg-warning';
                    break;
                case 'wicket':
                    icon = 'bi-x-circle-fill';
                    badgeClass = 'bg-danger';
                    break;
                case 'shot_played':
                    icon = 'bi-check-circle-fill';
                    badgeClass = 'bg-success';
                    break;
                default:
                    icon = 'bi-circle-fill';
                    badgeClass = 'bg-secondary';
            }
            
            // Create table row
            html += `<tr>
                <td>${formattedTime}</td>
                <td><span class="badge ${badgeClass}"><i class="bi ${icon} me-1"></i>${event.type.replace('_', ' ')}</span></td>
                <td>${event.subtype ? event.subtype.replace('_', ' ') : 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary jump-to-event" data-time="${event.timestamp}">
                        <i class="bi bi-play-fill"></i> Jump
                    </button>
                </td>
            </tr>`;
        });
        
        html += '</tbody></table></div>';
        eventsContainer.innerHTML = html;
        
        // Add event listeners to jump buttons
        document.querySelectorAll('.jump-to-event').forEach(button => {
            button.addEventListener('click', function() {
                const timestamp = parseFloat(this.getAttribute('data-time'));
                video.currentTime = timestamp;
                video.play();
            });
        });
    }
    
    // Handle events button click
    eventsButton.addEventListener('click', function() {
        const eventsSection = document.getElementById('cricket-events');
        eventsSection.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Load events when page loads
    loadCricketEvents();
});
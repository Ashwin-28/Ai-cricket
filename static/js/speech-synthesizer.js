document.addEventListener('DOMContentLoaded', function() {
    // Get HTML elements
    const videoPlayer = document.getElementById('results-video');
    const playCommentaryBtn = document.getElementById('play-commentary');
    const commentaryText = document.getElementById('commentary-text');
    
    // Check if elements exist
    if (!videoPlayer || !playCommentaryBtn) {
        console.warn('Video player or commentary button not found');
        return;
    }
    
    // Find the path to the commentary audio
    let commentaryPath = '';
    const audioLinks = document.querySelectorAll('a[download]');
    audioLinks.forEach(link => {
        if (link.href.includes('commentary')) {
            commentaryPath = link.href;
        }
    });
    
    // Create audio element for commentary
    const commentaryAudio = new Audio(commentaryPath);
    
    // Flag to track if commentary is playing
    let isCommentaryPlaying = false;
    
    // Update the button based on play state
    function updateCommentaryButton(isPlaying) {
        if (isPlaying) {
            playCommentaryBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pause Commentary';
            playCommentaryBtn.classList.remove('btn-success');
            playCommentaryBtn.classList.add('btn-warning');
        } else {
            playCommentaryBtn.innerHTML = '<i class="bi bi-play-fill"></i> Play Commentary';
            playCommentaryBtn.classList.remove('btn-warning');
            playCommentaryBtn.classList.add('btn-success');
        }
    }
    
    // Function to play both video and commentary in sync
    function playWithCommentary() {
        if (!isCommentaryPlaying) {
            // Start playing
            videoPlayer.currentTime = 0;
            videoPlayer.play();
            
            // Reset and play audio
            commentaryAudio.currentTime = 0;
            commentaryAudio.play();
            
            isCommentaryPlaying = true;
            updateCommentaryButton(true);
            
            // Highlight text as it's spoken (simplified implementation)
            highlightCommentaryText();
        } else {
            // Pause both video and commentary
            videoPlayer.pause();
            commentaryAudio.pause();
            
            isCommentaryPlaying = false;
            updateCommentaryButton(false);
        }
    }
    
    // Highlight commentary text as it's spoken (simplified simulation)
    function highlightCommentaryText() {
        if (!commentaryText) return;
        
        const text = commentaryText.innerText;
        const words = text.split(' ');
        
        // Estimate time per word based on audio duration and text length
        const timePerWord = commentaryAudio.duration / words.length;
        
        // Clear existing content
        commentaryText.innerHTML = '';
        
        // Create a span for each word for highlighting
        words.forEach((word, index) => {
            const wordSpan = document.createElement('span');
            wordSpan.textContent = word + ' ';
            wordSpan.id = `word-${index}`;
            commentaryText.appendChild(wordSpan);
            
            // Schedule highlighting
            setTimeout(() => {
                if (isCommentaryPlaying) {
                    // Remove highlight from previous word
                    if (index > 0) {
                        document.getElementById(`word-${index-1}`).classList.remove('highlight');
                    }
                    
                    // Highlight current word
                    wordSpan.classList.add('highlight');
                    
                    // Scroll into view if needed
                    wordSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, timePerWord * 1000 * index);
        });
    }
    
    // Add event listeners
    playCommentaryBtn.addEventListener('click', playWithCommentary);
    
    // Handle video ended event
    videoPlayer.addEventListener('ended', function() {
        commentaryAudio.pause();
        isCommentaryPlaying = false;
        updateCommentaryButton(false);
    });
    
    // Handle commentary ended event
    commentaryAudio.addEventListener('ended', function() {
        isCommentaryPlaying = false;
        updateCommentaryButton(false);
    });
    
    // Load events dynamically
    loadDetectedEvents();
});

// Function to load detected events
function loadDetectedEvents() {
    const eventsContainer = document.getElementById('cricket-events');
    if (!eventsContainer) return;
    
    fetch('/api/events')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.events && data.events.length > 0) {
                // Clear loading spinner
                eventsContainer.innerHTML = '';
                
                // Create timeline visualization
                const timeline = document.createElement('div');
                timeline.className = 'timeline-container mb-4';
                
                // Find video duration
                const videoPlayer = document.getElementById('results-video');
                let videoDuration = 0;
                if (videoPlayer) {
                    videoPlayer.addEventListener('loadedmetadata', function() {
                        videoDuration = videoPlayer.duration;
                        renderEvents(data.events, videoDuration);
                    });
                    
                    // If video is already loaded
                    if (videoPlayer.duration) {
                        videoDuration = videoPlayer.duration;
                    }
                }
                
                // Render events on timeline
                renderEvents(data.events, videoDuration);
                
                function renderEvents(events, duration) {
                    // Calculate max duration for timeline
                    const maxDuration = duration || 
                                       Math.max(...events.map(e => e.timestamp)) + 10;
                    
                    // Create the timeline bar
                    const timelineBar = document.createElement('div');
                    timelineBar.className = 'timeline-bar position-relative mb-3';
                    timelineBar.style.height = '8px';
                    timelineBar.style.backgroundColor = '#343a40';
                    timelineBar.style.borderRadius = '4px';
                    timelineBar.style.marginTop = '20px';
                    timelineBar.style.marginBottom = '40px';
                    
                    // Add event markers to timeline
                    events.forEach(event => {
                        const percentage = (event.timestamp / maxDuration) * 100;
                        
                        const marker = document.createElement('div');
                        marker.className = 'event-marker position-absolute';
                        marker.style.left = `${percentage}%`;
                        marker.style.width = '8px';
                        marker.style.height = '16px';
                        marker.style.top = '-4px';
                        marker.style.transform = 'translateX(-50%)';
                        marker.style.borderRadius = '2px';
                        marker.style.cursor = 'pointer';
                        
                        // Color based on event type
                        if (event.type === 'boundary') {
                            marker.style.backgroundColor = '#0dcaf0'; // info color for boundaries
                        } else if (event.type === 'wicket') {
                            marker.style.backgroundColor = '#dc3545'; // danger color for wickets
                        } else if (event.type === 'shot_played') {
                            marker.style.backgroundColor = '#198754'; // success color for shots
                        } else if (event.type === 'match_start') {
                            marker.style.backgroundColor = '#6610f2'; // purple for match start
                        } else if (event.type === 'match_end') {
                            marker.style.backgroundColor = '#6610f2'; // purple for match end
                        } else {
                            marker.style.backgroundColor = '#6c757d'; // secondary for others
                        }
                        
                        // Add tooltip data
                        marker.setAttribute('data-bs-toggle', 'tooltip');
                        marker.setAttribute('data-bs-placement', 'top');
                        
                        // Format timestamp as MM:SS
                        const minutes = Math.floor(event.timestamp / 60);
                        const seconds = Math.floor(event.timestamp % 60);
                        const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                        
                        marker.setAttribute('data-bs-title', `${event.description} (${timeFormatted})`);
                        
                        // Add click event to jump to that part of the video
                        marker.addEventListener('click', function() {
                            const videoPlayer = document.getElementById('results-video');
                            if (videoPlayer) {
                                videoPlayer.currentTime = event.timestamp;
                                videoPlayer.play();
                            }
                        });
                        
                        timelineBar.appendChild(marker);
                    });
                    
                    timeline.appendChild(timelineBar);
                    
                    // Add time markers below timeline
                    const timeMarkers = document.createElement('div');
                    timeMarkers.className = 'd-flex justify-content-between px-2';
                    
                    // Add start time
                    const startTime = document.createElement('div');
                    startTime.className = 'time-marker small text-muted';
                    startTime.textContent = '00:00';
                    timeMarkers.appendChild(startTime);
                    
                    // Add middle time
                    const middleTime = document.createElement('div');
                    middleTime.className = 'time-marker small text-muted';
                    const middleMinutes = Math.floor(maxDuration / 2 / 60);
                    const middleSeconds = Math.floor((maxDuration / 2) % 60);
                    middleTime.textContent = `${middleMinutes.toString().padStart(2, '0')}:${middleSeconds.toString().padStart(2, '0')}`;
                    timeMarkers.appendChild(middleTime);
                    
                    // Add end time
                    const endTime = document.createElement('div');
                    endTime.className = 'time-marker small text-muted';
                    const endMinutes = Math.floor(maxDuration / 60);
                    const endSeconds = Math.floor(maxDuration % 60);
                    endTime.textContent = `${endMinutes.toString().padStart(2, '0')}:${endSeconds.toString().padStart(2, '0')}`;
                    timeMarkers.appendChild(endTime);
                    
                    timeline.appendChild(timeMarkers);
                    eventsContainer.appendChild(timeline);
                    
                    // Create table of events
                    const eventsTable = document.createElement('div');
                    eventsTable.className = 'table-responsive';
                    
                    const table = document.createElement('table');
                    table.className = 'table table-dark table-hover';
                    
                    // Create table header
                    const thead = document.createElement('thead');
                    const headerRow = document.createElement('tr');
                    
                    const headers = ['Time', 'Event', 'Description', ''];
                    headers.forEach(headerText => {
                        const th = document.createElement('th');
                        th.textContent = headerText;
                        headerRow.appendChild(th);
                    });
                    
                    thead.appendChild(headerRow);
                    table.appendChild(thead);
                    
                    // Create table body
                    const tbody = document.createElement('tbody');
                    
                    // Add rows for each event
                    events.forEach(event => {
                        const row = document.createElement('tr');
                        
                        // Time column
                        const timeCell = document.createElement('td');
                        const minutes = Math.floor(event.timestamp / 60);
                        const seconds = Math.floor(event.timestamp % 60);
                        timeCell.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                        row.appendChild(timeCell);
                        
                        // Event type column
                        const typeCell = document.createElement('td');
                        let eventBadge = document.createElement('span');
                        eventBadge.className = 'badge ';
                        
                        // Set badge style based on event type
                        if (event.type === 'boundary') {
                            eventBadge.classList.add('bg-info');
                            eventBadge.textContent = event.subtype === 'four' ? 'FOUR' : 'SIX';
                        } else if (event.type === 'wicket') {
                            eventBadge.classList.add('bg-danger');
                            eventBadge.textContent = 'WICKET';
                        } else if (event.type === 'shot_played') {
                            eventBadge.classList.add('bg-success');
                            eventBadge.textContent = 'SHOT';
                        } else if (event.type === 'match_start') {
                            eventBadge.classList.add('bg-primary');
                            eventBadge.textContent = 'START';
                        } else if (event.type === 'match_end') {
                            eventBadge.classList.add('bg-primary');
                            eventBadge.textContent = 'END';
                        } else {
                            eventBadge.classList.add('bg-secondary');
                            eventBadge.textContent = event.type.toUpperCase();
                        }
                        
                        typeCell.appendChild(eventBadge);
                        
                        // Add subtype if available
                        if (event.subtype && event.subtype !== 'generic' && 
                            !['four', 'six'].includes(event.subtype)) {
                            const subtypeBadge = document.createElement('span');
                            subtypeBadge.className = 'badge bg-secondary ms-1';
                            subtypeBadge.textContent = event.subtype;
                            typeCell.appendChild(subtypeBadge);
                        }
                        
                        row.appendChild(typeCell);
                        
                        // Description column
                        const descCell = document.createElement('td');
                        descCell.textContent = event.description;
                        row.appendChild(descCell);
                        
                        // Action column - button to jump to timestamp
                        const actionCell = document.createElement('td');
                        const jumpBtn = document.createElement('button');
                        jumpBtn.className = 'btn btn-sm btn-outline-primary';
                        jumpBtn.innerHTML = '<i class="bi bi-play-fill"></i> Jump';
                        jumpBtn.addEventListener('click', function() {
                            const videoPlayer = document.getElementById('results-video');
                            if (videoPlayer) {
                                videoPlayer.currentTime = event.timestamp;
                                videoPlayer.play();
                            }
                        });
                        actionCell.appendChild(jumpBtn);
                        row.appendChild(actionCell);
                        
                        tbody.appendChild(row);
                    });
                    
                    table.appendChild(tbody);
                    eventsTable.appendChild(table);
                    eventsContainer.appendChild(eventsTable);
                    
                    // Initialize tooltips
                    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                    tooltipTriggerList.map(function (tooltipTriggerEl) {
                        return new bootstrap.Tooltip(tooltipTriggerEl);
                    });
                }
            } else {
                eventsContainer.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        No events were detected in this video.
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error fetching events:', error);
            eventsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-circle me-2"></i>
                    Error loading events: ${error.message}
                </div>
            `;
        });
}

// Add some CSS for word highlighting
const style = document.createElement('style');
style.textContent = `
    .highlight {
        background-color: rgba(13, 202, 240, 0.2);
        border-radius: 3px;
        padding: 2px 0;
    }
    
    .commentary-text {
        line-height: 1.8;
        max-height: 300px;
        overflow-y: auto;
        padding: 10px;
        border-radius: 4px;
        background-color: rgba(255, 255, 255, 0.05);
    }
    
    .event-marker:hover {
        transform: translateX(-50%) scale(1.5);
        transition: transform 0.1s ease-in-out;
    }
`;
document.head.appendChild(style);
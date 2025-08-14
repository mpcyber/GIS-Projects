// Google Maps JavaScript API
let directionsService;
let isGoogleMapsLoaded = false;

// Initialize Google Maps API
function initMap() {
    try {
        directionsService = new google.maps.DirectionsService();
        isGoogleMapsLoaded = true;
        console.log('Google Maps API loaded successfully!');
    } catch (error) {
        console.error('Error initializing Google Maps:', error);
        showError('Failed to initialize Google Maps. Please refresh the page and try again.');
    }
}

// Make initMap available globally
window.initMap = initMap;

// Fallback check for Google Maps loading
function checkGoogleMapsLoaded() {
    if (typeof google !== 'undefined' && google.maps && google.maps.DirectionsService) {
        if (!isGoogleMapsLoaded) {
            initMap();
        }
        return true;
    }
    return false;
}

async function calculateRoutes() {
    // Check if Google Maps is loaded
    if (!checkGoogleMapsLoaded()) {
        showError('Google Maps is still loading. Please wait a moment and try again.');
        
        // Try again after 2 seconds
        setTimeout(() => {
            if (checkGoogleMapsLoaded()) {
                console.log('Google Maps loaded on retry!');
                closeResults();
            }
        }, 2000);
        return;
    }

    const origin = '12907 Swedes Street, Centreville, VA';
    const destination = 'Lucky Strike, Centreville, VA';
    
    try {
        // Show loading state
        showLoading();
        
        // Route 1: Via Lee Highway
        const route1Promise = calculateRoute(origin, destination, 'Lee Highway, Centreville, VA');
        
        // Route 2: Via Leland Road  
        const route2Promise = calculateRoute(origin, destination, 'Leland Road, Centreville, VA');
        
        const [route1, route2] = await Promise.all([route1Promise, route2Promise]);
        
        closeLoading();
        displayRouteResults(route1, route2);
    } catch (error) {
        console.error('Error calculating routes:', error);
        closeLoading();
        showError('Unable to calculate routes. Please check your connection and try again.');
    }
}

function calculateRoute(origin, destination, waypoint) {
    return new Promise((resolve, reject) => {
        const request = {
            origin: origin,
            destination: destination,
            waypoints: [{location: waypoint}],
            travelMode: google.maps.TravelMode.DRIVING,
            optimizeWaypoints: false,
            avoidHighways: false,
            avoidTolls: false
        };

        directionsService.route(request, (result, status) => {
            if (status === 'OK') {
                const route = result.routes[0];
                const leg = route.legs[0];
                
                resolve({
                    waypoint: waypoint.split(',')[0], // Get just the road name
                    distance: leg.distance.text,
                    duration: leg.duration.text,
                    steps: leg.steps.length
                });
            } else {
                reject(new Error(`Route calculation failed: ${status}`));
            }
        });
    });
}

function showLoading() {
    const leftInfo = document.getElementById('leftRouteInfo');
    const rightInfo = document.getElementById('rightRouteInfo');
    
    leftInfo.innerHTML = `
        <h3><span class="pin-icon">📍</span> Calculating Route...</h3>
        <p>Via Lee Highway</p>
        <div class="loading-spinner"></div>
    `;
    
    rightInfo.innerHTML = `
        <h3><span class="pin-icon">📍</span> Calculating Route...</h3>
        <p>Via Leland Road</p>
        <div class="loading-spinner"></div>
    `;
    
    // Show the route info containers
    leftInfo.style.opacity = '1';
    rightInfo.style.opacity = '1';
    leftInfo.style.transform = 'translateY(0)';
    rightInfo.style.transform = 'translateY(0)';
}

function closeLoading() {
    // No specific action needed as we'll replace with results
}

function displayRouteResults(route1, route2) {
    // Determine which route is better (shorter duration)
    const route1Minutes = parseDuration(route1.duration);
    const route2Minutes = parseDuration(route2.duration);
    
    let betterRoute, worseRoute, chosenSide;
    
    if (route1Minutes <= route2Minutes) {
        betterRoute = route1;
        worseRoute = route2;
        chosenSide = 'left';
        document.querySelector('.left-side').classList.add('active');
        document.querySelector('.right-side').classList.remove('active');
    } else {
        betterRoute = route2;
        worseRoute = route1;
        chosenSide = 'right';
        document.querySelector('.right-side').classList.add('active');
        document.querySelector('.left-side').classList.remove('active');
    }
    
    // Update left side (Lee Highway) info
    document.getElementById('leftRouteInfo').innerHTML = `
        <h3><span class="pin-icon">📍</span> Via ${route1.waypoint}</h3>
        <p><strong>Distance:</strong> ${route1.distance}</p>
        <p><strong>Time:</strong> ${route1.duration}</p>
        ${chosenSide === 'left' ? 
            `<div class="best-route">🏆 Best Route (${route1.duration})</div>` : 
            ''}
    `;
    
    // Update right side (Leland Road) info
    document.getElementById('rightRouteInfo').innerHTML = `
        <h3><span class="pin-icon">📍</span> Via ${route2.waypoint}</h3>
        <p><strong>Distance:</strong> ${route2.distance}</p>
        <p><strong>Time:</strong> ${route2.duration}</p>
        ${chosenSide === 'right' ? 
            `<div class="best-route">🏆 Best Route (${route2.duration})</div>` : 
            ''}
    `;
}

function parseDuration(duration) {
    // Parse duration string like "15 mins" or "1 hour 20 mins" to minutes
    const parts = duration.toLowerCase().match(/(\d+)\s*(hour|hr|min)/g) || [];
    let totalMinutes = 0;
    
    parts.forEach(part => {
        const number = parseInt(part);
        if (part.includes('hour') || part.includes('hr')) {
            totalMinutes += number * 60;
        } else if (part.includes('min')) {
            totalMinutes += number;
        }
    });
    
    return totalMinutes;
}

function showError(message) {
    const leftInfo = document.getElementById('leftRouteInfo');
    leftInfo.innerHTML = `
        <h3>⚠️ Error</h3>
        <p>${message}</p>
        <button onclick="closeResults()" style="background: #ff6b6b; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px;">Close</button>
    `;
    leftInfo.style.opacity = '1';
    leftInfo.style.transform = 'translateY(0)';
    document.querySelector('.right-side .route-info').style.opacity = '0';
}

function closeResults() {
    document.getElementById('leftRouteInfo').style.opacity = '0';
    document.getElementById('leftRouteInfo').style.transform = 'translateY(20px)';
    document.getElementById('rightRouteInfo').style.opacity = '0';
    document.getElementById('rightRouteInfo').style.transform = 'translateY(20px)';
    
    // Reset the sides to normal state
    document.querySelector('.left-side').classList.remove('active');
    document.querySelector('.right-side').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', function() {
    // Check Google Maps loading status every 2 seconds until loaded
    const checkInterval = setInterval(() => {
        if (checkGoogleMapsLoaded()) {
            clearInterval(checkInterval);
            console.log('Google Maps API ready!');
        }
    }, 2000);
    
    // Clear interval after 30 seconds to avoid infinite checking
    setTimeout(() => {
        clearInterval(checkInterval);
        if (!isGoogleMapsLoaded) {
            console.warn('Google Maps API did not load within 30 seconds');
        }
    }, 30000);

    document.getElementById('bowlingBtn').addEventListener('click', function() {
        // Add a click effect
        this.style.transform = 'translate(-50%, -50%) scale(0.95)';
        this.style.transition = 'transform 0.1s ease';
        
        setTimeout(() => {
            this.style.transform = 'translate(-50%, -50%) scale(1)';
            this.style.transition = 'all 0.3s ease';
        }, 100);
        
        // Optional: Add a subtle flash effect
        const button = this;
        button.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.3), 0 12px 30px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
        
        setTimeout(() => {
            button.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
        }, 200);
        
        // Calculate routes to Lucky Strike
        console.log('Calculating routes to Lucky Strike! 🎳');
        calculateRoutes();
    });

    // Add subtle mouse movement effects
    document.addEventListener('mousemove', function(e) {
        const circles = document.querySelectorAll('.decorative-circle');
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        circles.forEach((circle, index) => {
            const speed = (index + 1) * 0.5;
            const x = mouseX * speed;
            const y = mouseY * speed;
            
            circle.style.transform = `translate(${x}px, ${y}px)`;
        });
    });
});
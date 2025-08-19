let directionsService;
let isGoogleMapsLoaded = false;
let map;
let directionsRenderer;
let route1Data = null;
let route2Data = null;

// Initialize Google Maps API
function initMap() {
    try {
        // Create a new map centered on Centreville, VA
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 38.8400, lng: -77.4288},
            zoom: 13,
            styles: [
                {
                    "featureType": "all",
                    "elementType": "labels",
                    "stylers": [{"visibility": "off"}]
                },
                {
                    "featureType": "road",
                    "elementType": "geometry",
                    "stylers": [{"visibility": "on"}, {"color": "#3a3a3a"}]
                },
                {
                    "featureType": "landscape",
                    "elementType": "geometry",
                    "stylers": [{"color": "#2a2a2a"}]
                }
            ],
            disableDefaultUI: true
        });
        
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: "#4285F4", // Default color
                strokeOpacity: 1,
                strokeWeight: 5
            }
        });
        
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
                // No need to call closeResults here, as showLoading will prepare for new results
                // and if it's already showing error, it will be replaced.
            }
        }, 2000);
        return;
    }

    const origin = '12907 Swedes Street, Centreville, VA';
    const destination = 'Lucky Strike, Centreville, VA';
    
    try {
        // Show loading state and activate map container
        showLoading();
        document.querySelector('.map-container').classList.add('active');
        
        // Calculate both routes
        const [route1, route2] = await Promise.all([
            calculateRoute(origin, destination, 'Lee Highway, Centreville, VA'),
            calculateRoute(origin, destination, 'Leland Road, Centreville, VA')
        ]);
        
        route1Data = {
            ...route1,
            waypoint: 'Lee Highway',
            color: '#4285F4' // Blue
        };
        
        route2Data = {
            ...route2,
            waypoint: 'Leland Road',
            color: '#FBBC05' // Yellow
        };
        
        // Determine which is better
        const route1Minutes = parseDuration(route1Data.duration);
        const route2Minutes = parseDuration(route2Data.duration);
        
        if (route1Minutes <= route2Minutes) {
            await displayRouteOnMap(origin, destination, 'Lee Highway, Centreville, VA', route1Data.color);
            route1Data.isBest = true;
            route2Data.isBest = false; // Explicitly set false for the other route
        } else {
            await displayRouteOnMap(origin, destination, 'Leland Road, Centreville, VA', route2Data.color);
            route2Data.isBest = true;
            route1Data.isBest = false; // Explicitly set false for the other route
        }
        
        closeLoading(); // Simply hides the loading spinners
        displayRouteResults(route1Data, route2Data);
    } catch (error) {
        console.error('Error calculating routes:', error);
        closeLoading(); // Hide spinners even on error
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
                    distance: leg.distance.text,
                    duration: leg.duration.text,
                    steps: leg.steps.length,
                    // Optionally, you can also resolve with the full result to draw later if needed
                    // directionsResult: result
                });
            } else {
                reject(new Error(`Route calculation failed: ${status}`));
            }
        });
    });
}

async function displayRouteOnMap(origin, destination, waypoint, color) {
    return new Promise((resolve) => {
        const request = {
            origin: origin,
            destination: destination,
            waypoints: [{location: waypoint}],
            travelMode: google.maps.TravelMode.DRIVING
        };
        
        directionsService.route(request, (result, status) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(result);
                directionsRenderer.setOptions({
                    polylineOptions: {
                        strokeColor: color,
                        strokeOpacity: 1,
                        strokeWeight: 5
                    },
                    suppressMarkers: true // Keep suppressMarkers true to use custom markers
                });
                
                // Add custom markers
                addMarkers(origin, destination);
                resolve();
            } else {
                console.error('Error displaying route on map:', status);
                // Even if map display fails, proceed with showing text results
                resolve(); 
            }
        });
    });
}

function addMarkers(origin, destination) {
    // Clear existing markers by resetting map on directionsRenderer (it handles its own markers)
    // If you need custom markers that persist or are drawn separately, manage them in an array.
    // For simplicity, relying on suppressMarkers and drawing two distinct markers.

    // Using approximate coordinates for custom markers for now
    // In a real app, you'd geocode these addresses to get precise lat/lng.
    
    // Origin marker
    new google.maps.Marker({
        position: {lat: 38.8435, lng: -77.4360}, // Approximate coordinates for 12907 Swedes Street
        map: map,
        title: 'Origin: 12907 Swedes Street',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#4285F4', // Blue for origin
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 8
        }
    });
    
    // Destination marker (Lucky Strike)
    new google.maps.Marker({
        position: {lat: 38.8375, lng: -77.4295}, // Approximate coordinates for Lucky Strike
        map: map,
        title: 'Destination: Lucky Strike',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#EA4335', // Red for destination
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 8
        }
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
    
    // Show the route info containers and ensure they are ready for content
    leftInfo.style.opacity = '1';
    leftInfo.style.transform = 'translateY(0)';
    rightInfo.style.opacity = '1';
    rightInfo.style.transform = 'translateY(0)';

    // Remove any active classes while loading
    document.querySelector('.left-side').classList.remove('active');
    document.querySelector('.right-side').classList.remove('active');
}

function closeLoading() {
    // No specific action needed here; displayRouteResults will overwrite content.
    // The spinners will naturally disappear when new content is injected.
}

function displayRouteResults(route1, route2) {
    // Update both side panels with route info
    document.getElementById('leftRouteInfo').innerHTML = `
        <h3><span class="pin-icon">📍</span> Via Lee Highway</h3>
        <p><strong>Distance:</strong> ${route1.distance}</p>
        <p><strong>Time:</strong> ${route1.duration}</p>
        ${route1.isBest ? `<div class="best-route">🏆 Best Route (${route1.duration})</div>` : ''}
    `;
    
    document.getElementById('rightRouteInfo').innerHTML = `
        <h3><span class="pin-icon">📍</span> Via Leland Road</h3>
        <p><strong>Distance:</strong> ${route2.distance}</p>
        <p><strong>Time:</strong> ${route2.duration}</p>
        ${route2.isBest ? `<div class="best-route">🏆 Best Route (${route2.duration})</div>` : ''}
    `;
    
    // Highlight the active side
    if (route1.isBest) {
        document.querySelector('.left-side').classList.add('active');
        document.querySelector('.right-side').classList.remove('active');
    } else {
        document.querySelector('.right-side').classList.add('active');
        document.querySelector('.left-side').classList.remove('active');
    }
}

function parseDuration(duration) {
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
    const rightInfo = document.getElementById('rightRouteInfo');

    leftInfo.innerHTML = `
        <h3>⚠️ Error</h3>
        <p>${message}</p>
        <button onclick="closeResults()" style="background: #ff6b6b; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px;">Close</button>
    `;
    leftInfo.style.opacity = '1';
    leftInfo.style.transform = 'translateY(0)';
    
    // Hide or clear the right side if there's an error affecting both
    rightInfo.innerHTML = ''; // Clear content
    rightInfo.style.opacity = '0'; // Hide
    rightInfo.style.transform = 'translateY(20px)'; // Move off-screen

    document.querySelector('.map-container').classList.remove('active'); // Hide map on error
    document.querySelector('.left-side').classList.remove('active');
    document.querySelector('.right-side').classList.remove('active');
}

function closeResults() {
    // Reset route info visibility
    document.getElementById('leftRouteInfo').style.opacity = '0';
    document.getElementById('leftRouteInfo').style.transform = 'translateY(20px)';
    document.getElementById('rightRouteInfo').style.opacity = '0';
    document.getElementById('rightRouteInfo').style.transform = 'translateY(20px)';
    
    // Hide map
    document.querySelector('.map-container').classList.remove('active');
    
    // Reset side panel active states
    document.querySelector('.left-side').classList.remove('active');
    document.querySelector('.right-side').classList.remove('active');

    // Clear content as well
    document.getElementById('leftRouteInfo').innerHTML = '';
    document.getElementById('rightRouteInfo').innerHTML = '';

    // Clear map directions if they were set
    if (directionsRenderer) {
        directionsRenderer.setDirections({routes: []}); // Clear previous directions
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initial check for Google Maps loading status
    const checkInterval = setInterval(() => {
        if (checkGoogleMapsLoaded()) {
            clearInterval(checkInterval);
            console.log('Google Maps API ready after initial check!');
        }
    }, 500); // Check more frequently initially
    
    // Clear interval after 30 seconds to avoid infinite checking
    setTimeout(() => {
        clearInterval(checkInterval);
        if (!isGoogleMapsLoaded) {
            console.warn('Google Maps API did not load within 30 seconds. Displaying a message.');
            showError('Google Maps failed to load. Please check your internet connection.');
        }
    }, 30000);

    document.getElementById('bowlingBtn').addEventListener('click', function() {
        // Add a click effect
        this.style.transform = 'scale(0.95)'; // Simplified transform as it's no longer absolutely positioned
        this.style.transition = 'transform 0.1s ease';
        
        setTimeout(() => {
            this.style.transform = 'scale(1)';
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
});
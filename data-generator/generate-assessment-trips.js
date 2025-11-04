const axios = require('axios');
const fs = require('fs');
const {
    generateEventId,
    generateTimestamp
} = require('./event-generators');

// Get current date and time for folder naming
const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format
    return `${date}-${time}`;
};

const ASSESSMENT_FOLDER = `assessment-${getCurrentDateTime()}`;

// Pool of diverse route options for randomization
const ROUTE_POOLS = {
    longHaul: [
        { start: [-74.0060, 40.7128], end: [-118.2437, 34.0522], desc: "New York to Los Angeles - Transcontinental freight" },
        { start: [-122.4194, 37.7749], end: [-80.1918, 25.7617], desc: "San Francisco to Miami - Coast-to-coast delivery" },
        { start: [-87.6298, 41.8781], end: [-122.3321, 47.6062], desc: "Chicago to Seattle - Midwest to Pacific Northwest" },
        { start: [-95.3698, 29.7604], end: [-71.0589, 42.3601], desc: "Houston to Boston - South to Northeast corridor" }
    ],
    urban: [
        { start: [-87.6298, 41.8781], end: [-87.9073, 42.0451], desc: "Chicago Downtown to Schaumburg - Urban sprawl" },
        { start: [-118.2437, 34.0522], end: [-118.4912, 34.0195], desc: "Los Angeles to Santa Monica - Metro delivery" },
        { start: [-74.0060, 40.7128], end: [-74.1724, 40.7348], desc: "Manhattan to Newark - Cross-river urban route" },
        { start: [-122.4194, 37.7749], end: [-122.2711, 37.8044], desc: "San Francisco to Oakland - Bay Area commute" }
    ],
    mountain: [
        { start: [-104.9903, 39.7392], end: [-111.8910, 40.7608], desc: "Denver to Salt Lake City - Rocky Mountain crossing" },
        { start: [-111.8910, 40.7608], end: [-116.2023, 43.6150], desc: "Salt Lake City to Boise - Mountain desert route" },
        { start: [-105.0178, 39.7391], end: [-106.3175, 39.5501], desc: "Denver to Vail - High altitude mountain route" },
        { start: [-119.7871, 36.7378], end: [-118.8597, 37.7749], desc: "Fresno to Yosemite area - Sierra Nevada foothills" }
    ],
    southern: [
        { start: [-95.3698, 29.7604], end: [-80.1918, 25.7617], desc: "Houston to Miami - Gulf Coast corridor" },
        { start: [-84.3880, 33.7490], end: [-90.0715, 29.9511], desc: "Atlanta to New Orleans - Deep South route" },
        { start: [-97.7431, 30.2672], end: [-106.4869, 31.7619], desc: "Austin to El Paso - Texas desert crossing" },
        { start: [-82.4584, 27.9506], end: [-81.3792, 28.5383], desc: "Tampa to Orlando - Florida corridor" }
    ],
    regional: [
        { start: [-122.3321, 47.6062], end: [-122.6784, 45.5152], desc: "Seattle to Portland - I-5 Pacific corridor" },
        { start: [-71.0589, 42.3601], end: [-74.0060, 40.7128], desc: "Boston to New York - Northeast megalopolis" },
        { start: [-83.0458, 42.3314], end: [-87.6298, 41.8781], desc: "Detroit to Chicago - Great Lakes industrial" },
        { start: [-121.4944, 38.5816], end: [-119.7871, 36.7378], desc: "Sacramento to Fresno - Central Valley agriculture" }
    ]
};

// Function to randomly select routes for variety
function getRandomizedScenarios() {
    const longHaulRoute = ROUTE_POOLS.longHaul[Math.floor(Math.random() * ROUTE_POOLS.longHaul.length)];
    const urbanRoute = ROUTE_POOLS.urban[Math.floor(Math.random() * ROUTE_POOLS.urban.length)];
    const mountainRoute = ROUTE_POOLS.mountain[Math.floor(Math.random() * ROUTE_POOLS.mountain.length)];
    const southernRoute = ROUTE_POOLS.southern[Math.floor(Math.random() * ROUTE_POOLS.southern.length)];
    const regionalRoute = ROUTE_POOLS.regional[Math.floor(Math.random() * ROUTE_POOLS.regional.length)];
    
    return [
        {
            id: 1,
            name: "Cross-Country Long Haul",
            description: longHaulRoute.desc,
            startCoords: longHaulRoute.start,
            endCoords: longHaulRoute.end,
            vehicleId: "VH_001",
            tripId: "trip_20251103_080000",
            deviceId: "GPS_DEVICE_001",
            baseTime: new Date('2025-11-03T08:00:00.000Z'),
            timeInterval: 90, // 1.5 minute intervals for very long trip
            cancellationChance: 0.0,
            filename: `${ASSESSMENT_FOLDER}/trip_1_cross_country.json`
        },
        {
            id: 2,
            name: "Urban Dense Delivery",
            description: urbanRoute.desc,
            startCoords: urbanRoute.start,
            endCoords: urbanRoute.end,
            vehicleId: "VH_002",
            tripId: "trip_20251103_090000",
            deviceId: "GPS_DEVICE_002",
            baseTime: new Date('2025-11-03T09:00:00.000Z'),
            timeInterval: 25, // 25 second intervals for dense urban tracking
            cancellationChance: 0.0,
            filename: `${ASSESSMENT_FOLDER}/trip_2_urban_dense.json`
        },
        {
            id: 3,
            name: "Mountain Route Cancelled",
            description: mountainRoute.desc + " - Cancelled due to weather conditions",
            startCoords: mountainRoute.start,
            endCoords: mountainRoute.end,
            vehicleId: "VH_003",
            tripId: "trip_20251103_100000",
            deviceId: "GPS_DEVICE_003",
            baseTime: new Date('2025-11-03T10:00:00.000Z'),
            timeInterval: 45, // 45 second intervals
            cancellationChance: 1.0, // Guaranteed cancellation
            filename: `${ASSESSMENT_FOLDER}/trip_3_mountain_cancelled.json`
        },
        {
            id: 4,
            name: "Southern Technical Issues",
            description: southernRoute.desc + " - Route with technical problems",
            startCoords: southernRoute.start,
            endCoords: southernRoute.end,
            vehicleId: "VH_004",
            tripId: "trip_20251103_110000",
            deviceId: "GPS_DEVICE_004",
            baseTime: new Date('2025-11-03T11:00:00.000Z'),
            timeInterval: 50, // 50 second intervals
            cancellationChance: 0.0,
            filename: `${ASSESSMENT_FOLDER}/trip_4_southern_technical.json`,
            enhanceTechnicalEvents: true
        },
        {
            id: 5,
            name: "Regional Logistics",
            description: regionalRoute.desc + " - Regional logistics with fuel management",
            startCoords: regionalRoute.start,
            endCoords: regionalRoute.end,
            vehicleId: "VH_005",
            tripId: "trip_20251103_120000",
            deviceId: "GPS_DEVICE_005",
            baseTime: new Date('2025-11-03T12:00:00.000Z'),
            timeInterval: 35, // 35 second intervals
            cancellationChance: 0.0,
            filename: `${ASSESSMENT_FOLDER}/trip_5_regional_logistics.json`,
            enhanceFuelEvents: true
        }
    ];
}


// Fetch route from OSRM API
async function fetchRoute(startCoords, endCoords) {
    try {
        const url = `http://router.project-osrm.org/route/v1/driving/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}?overview=full&geometries=geojson`;
        
        const response = await axios.get(url);
        
        if (response.data.routes && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            return route.geometry.coordinates;
        } else {
            throw new Error('No route found');
        }
    } catch (error) {
        console.error('Error fetching route:', error.message);
        throw error;
    }
}

// Enhanced location events with varied intervals
function generateLocationEvents(coordinates, baseTime, vehicleId, tripId, timeInterval) {
    const events = [];
    
    for (let i = 0; i < coordinates.length; i++) {
        const coord = coordinates[i];
        const timestamp = generateTimestamp(baseTime, i * timeInterval);
        
        // Calculate speed and heading if not the first coordinate
        let speed = 0;
        let heading = 0;
        let moving = false;
        
        if (i > 0) {
            const prevCoord = coordinates[i - 1];
            const R = 6371; // Earth's radius in km
            const dLat = (coord[1] - prevCoord[1]) * Math.PI / 180;
            const dLon = (coord[0] - prevCoord[0]) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(prevCoord[1] * Math.PI / 180) * Math.cos(coord[1] * Math.PI / 180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c; // Distance in km
            
            speed = Math.max(0, Math.min((distance / timeInterval) * 3600, 120)); // Convert to km/h, cap at 120
            
            // Calculate heading
            const dLonHeading = (coord[0] - prevCoord[0]) * Math.PI / 180;
            const lat1 = prevCoord[1] * Math.PI / 180;
            const lat2 = coord[1] * Math.PI / 180;
            const y = Math.sin(dLonHeading) * Math.cos(lat2);
            const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLonHeading);
            heading = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
            
            moving = speed > 1; // Consider moving if speed > 1 km/h
        }
        
        // Add some realistic variation to accuracy
        const accuracy = 5 + Math.random() * 10; // 5-15 meters
        const altitude = 10 + Math.random() * 100; // 10-110 meters
        
        // Determine signal quality based on accuracy
        let signalQuality = 'excellent';
        if (accuracy > 12) signalQuality = 'good';
        if (accuracy > 20) signalQuality = 'fair';
        if (accuracy > 50) signalQuality = 'poor';
        
        const event = {
            event_id: generateEventId(),
            event_type: "location_ping",
            timestamp: timestamp,
            vehicle_id: vehicleId,
            trip_id: tripId,
            location: {
                lat: coord[1],
                lng: coord[0],
                accuracy_meters: Math.round(accuracy * 10) / 10,
                altitude_meters: Math.round(altitude * 10) / 10
            },
            movement: {
                speed_kmh: Math.round(speed * 10) / 10,
                heading_degrees: Math.round(heading * 10) / 10,
                moving: moving
            },
            signal_quality: signalQuality
        };
        
        events.push(event);
    }
    
    return events;
}

// Generate trip with specific scenario parameters
async function generateTripScenario(scenario) {
    try {
        console.log(`\n🚗 Generating ${scenario.name}...`);
        console.log(`📍 Route: ${scenario.description}`);
        
        // Fetch route coordinates
        const coordinates = await fetchRoute(scenario.startCoords, scenario.endCoords);
        console.log(`📊 Route: ${(coordinates.length * scenario.timeInterval / 3600).toFixed(1)} hours, ${coordinates.length} points`);
        
        // Generate ALL events in a single unified loop (cancellation handled internally)
        const { generateAllEventsInSingleLoop } = require('./unified-event-generator');
        let allEvents = generateAllEventsInSingleLoop(coordinates, scenario.baseTime, scenario.vehicleId, scenario.tripId, scenario.deviceId, scenario.timeInterval, scenario.cancellationChance > 0);
        
        // Sort events by timestamp
        allEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Save to file
        fs.writeFileSync(scenario.filename, JSON.stringify(allEvents, null, 2));
        
        console.log(`✅ Generated ${allEvents.length} events for ${scenario.name} using unified event generator`);
        console.log(`💾 Saved to: ${scenario.filename}`);
        
        // Check if trip was cancelled by looking for trip_cancelled event
        const wasCancelled = allEvents.some(event => event.event_type === 'trip_cancelled');
        
        return {
            scenario: scenario.name,
            eventCount: allEvents.length,
            duration: `${(coordinates.length * scenario.timeInterval / 3600).toFixed(1)} hours`,
            cancelled: wasCancelled
        };
        
    } catch (error) {
        console.error(`❌ Error generating ${scenario.name}:`, error.message);
        throw error;
    }
}

// Generate all assessment trips
async function generateAllAssessmentTrips() {
    console.log('🚀 Generating Fleet Tracking Assessment Data...\n');
    
    // Create assessment folder if it doesn't exist
    if (!fs.existsSync(ASSESSMENT_FOLDER)) {
        fs.mkdirSync(ASSESSMENT_FOLDER, { recursive: true });
        console.log(`📁 Created folder: ${ASSESSMENT_FOLDER}\n`);
    }
    
    // Get randomized scenarios for this generation
    const scenarios = getRandomizedScenarios();
    console.log('🎲 Randomized routes selected for unique candidate experience\n');
    
    const results = [];
    
    for (const scenario of scenarios) {
        try {
            const result = await generateTripScenario(scenario);
            results.push(result);
        } catch (error) {
            console.error(`Failed to generate ${scenario.name}`);
        }
    }
    
    // Generate summary
    // Copy reference files to assessment folder
    try {
        const fleetTypesPath = `${ASSESSMENT_FOLDER}/fleet-tracking-event-types.md`;
        
        // Copy fleet-tracking-event-types.md if it doesn't exist
        if (!fs.existsSync(fleetTypesPath)) {
            const sourceFleetTypesPath = '../fleet-tracking-event-types.md';
            if (fs.existsSync(sourceFleetTypesPath)) {
                fs.copyFileSync(sourceFleetTypesPath, fleetTypesPath);
            }
        }
        
        console.log(`📄 Reference files added to ${ASSESSMENT_FOLDER}/`);
    } catch (error) {
        console.log('⚠️  Could not copy reference files (they may already exist)');
    }
    
    console.log('\n📋 Assessment Data Summary:');
    console.log('================================');
    results.forEach((result, index) => {
        const status = result.cancelled ? '🚨 CANCELLED' : '✅ COMPLETED';
        console.log(`${index + 1}. ${result.scenario}: ${result.eventCount} events, ${result.duration} ${status}`);
    });
    
    console.log(`\n🎯 Ready for candidate assessment!`);
    console.log(`📁 All files saved to: ${ASSESSMENT_FOLDER}/`);
    console.log('Files generated for dashboard streaming simulation.');
}

// Run the script
if (require.main === module) {
    generateAllAssessmentTrips();
}

module.exports = {
    generateAllAssessmentTrips,
    generateTripScenario,
    getRandomizedScenarios,
    ROUTE_POOLS
};

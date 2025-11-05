// Unified event generator - single loop with dynamic timestamps and event queue
const { generateEventId } = require('./event-generators');

// Generate ALL events in a single loop with dynamic timestamps
function generateAllEventsInSingleLoop(coordinates, baseTime, vehicleId, tripId, deviceId, baseTimeInterval = 30, shouldCancel = false) {
    const events = [];
    
    // Generate random configuration for this trip
    const config = {
        initial_fuel_level: 85 + Math.random() * 15, // 85-100%
        min_fuel_level: 3 + Math.random() * 7, // 3-10%
        fuel_efficiency: 0.08 + Math.random() * 0.08, // 8-16 L/100km
        initial_battery_level: 90 + Math.random() * 10, // 90-100%
        min_battery_level: 2 + Math.random() * 6, // 2-8%
        battery_drain_rate: 0.0005 + Math.random() * 0.001, // 0.0005-0.0015% per coordinate
        initial_speed: 40 + Math.random() * 20, // 40-60 km/h
        min_speed: 15 + Math.random() * 10, // 15-25 km/h
        max_speed: 80 + Math.random() * 60, // 80-140 km/h
        speed_variation: 5 + Math.random() * 10, // ±5-15 km/h
        signal_change_probability: 0.02 + Math.random() * 0.06, // 2-8%
        speed_limit_kmh: 80 + Math.random() * 120, // 80-120 km/h speed limit for trip
        speed_tolerance: 8 + Math.random() * 7, // 8-15 km/h tolerance before violation
        fuel_tank_capacity_liters: 60 + Math.random() * 80 // 60-140 liters tank capacity
    };
    
    // Track cumulative data
    let current_timestamp = new Date(baseTime);
    let total_distance = 0;
    let fuel_level = config.initial_fuel_level;
    let current_speed = config.initial_speed;
    let device_battery_level = config.initial_battery_level;
    let signal_quality = 'excellent'; // Start with excellent signal
    let battery_low_triggered = false; // Track if battery_low event already sent
    let battery_charging = false; // Track if battery is currently charging
    let charging_start_level = 0; // Track level when charging started
    let fuel_low_triggered = false; // Track if fuel_low event already sent
    let is_overspeeding = false; // Track if vehicle is currently overspeeding
    
    // Trip cancellation setup
    let trip_cancelled = false;
    let cancellation_index = -1;
    if (shouldCancel) {
        // Cancel randomly between 20% and 70% of the trip
        cancellation_index = Math.floor(coordinates.length * (0.2 + Math.random() * 0.5));
        console.log(`🚨 Trip will be cancelled at coordinate ${cancellation_index}/${coordinates.length} (${(cancellation_index/coordinates.length*100).toFixed(1)}% of route)`);
    }
    
    console.log(`🔄 Single loop generation for ${coordinates.length} coordinates...`);
    
    // Add trip_started event at the beginning
    events.push({
        event_id: generateEventId(),
        event_type: "trip_started",
        timestamp: current_timestamp.toISOString(),
        vehicle_id: vehicleId,
        trip_id: tripId,
        device_id: deviceId,
        location: {
            lat: coordinates[0][1],
            lng: coordinates[0][0]
        },
        planned_distance_km: Math.round(calculateTotalDistance(coordinates)),
        estimated_duration_hours: Math.round(coordinates.length * baseTimeInterval / 3600 * 10) / 10
    });

    for (let i = 0; i < coordinates.length; i++) {
        const coord = coordinates[i];
        
        // 1. Add the location ping
        // location_ping
        const segment_distance = i > 0 ? calculateDistance(coordinates[i-1], coord) : 0;
        total_distance += segment_distance;
        current_speed = Math.max(config.min_speed, Math.min(config.max_speed, current_speed + (Math.random() - 0.5) * config.speed_variation));
        
        // Update timestamp based on speed
        const time_increment_seconds = segment_distance > 0 ? (segment_distance / current_speed) * 3600 : baseTimeInterval;
        current_timestamp = new Date(current_timestamp.getTime() + time_increment_seconds * 1000);
        
        // Update fuel level based on distance
        fuel_level = Math.max(config.min_fuel_level, fuel_level - (segment_distance * config.fuel_efficiency));
        
        // Update device battery level based on charging state
        if (!battery_charging) {
            // Normal discharge
            device_battery_level = Math.max(config.min_battery_level, device_battery_level - config.battery_drain_rate);
            
            // Start charging if battery drops below 10%
            if (device_battery_level <= 10 && Math.random() < 0.1) { // 10% chance to start charging
                battery_charging = true;
                charging_start_level = device_battery_level;
            }
        } else {
            // Charging - increase battery level
            device_battery_level = Math.min(100, device_battery_level + config.battery_drain_rate * 3); // Charge 3x faster than drain
            
            // Stop charging when reaches 100%
            if (device_battery_level >= 100) {
                battery_charging = false;
                battery_low_triggered = false; // Reset so it can trigger again next time
            }
        }
        
        // Update signal quality randomly
        const signal_qualities = ['excellent', 'good', 'fair', 'poor'];
        if (Math.random() < config.signal_change_probability) {
            signal_quality = signal_qualities[Math.floor(Math.random() * signal_qualities.length)];
        }
        
        // Update overspeed flag based on current speed vs speed limit + tolerance
        is_overspeeding = current_speed > config.speed_limit_kmh + config.speed_tolerance;
        
        // Calculate heading from previous coordinate
        const heading = i > 0 ? calculateHeading(coordinates[i-1], coord) : 0;
        const baseEvent = createLocationPingEvent(coord, current_timestamp, vehicleId, tripId, current_speed, heading, total_distance);
        
        // Add device battery info and overspeed status to baseEvent
        baseEvent.device = {
            battery_level: Math.round(device_battery_level * 10) / 10,
            charging: battery_charging
        };
        baseEvent.overspeed = is_overspeeding;
        
        events.push(baseEvent);
        
        // 2. Add the trip cancellation if it is time to cancel the event
        // trip_cancelled
        if (shouldCancel && i === cancellation_index && !trip_cancelled) {
            const cancellation_reasons = ['vehicle_malfunction', 'driver_emergency', 'weather_conditions', 'road_closure', 'mechanical_failure'];
            const reason = cancellation_reasons[Math.floor(Math.random() * cancellation_reasons.length)];
            
            events.push({
                ...baseEvent,
                event_id: generateEventId(),
                event_type: "trip_cancelled",
                timestamp: current_timestamp.toISOString(),
                vehicle_id: vehicleId,
                trip_id: tripId,
                cancellation_reason: reason,
                location: {
                    lat: coord[1],
                    lng: coord[0]
                },
                distance_completed_km: Math.round(total_distance * 10) / 10,
                elapsed_time_minutes: Math.round((current_timestamp - new Date(baseTime)) / 60000)
            });
            
            trip_cancelled = true;
            console.log(`🚨 Trip cancelled at coordinate ${i} due to: ${reason}`);
            break; // Stop generating further events after cancellation
        }

        // 4. Add the vehicle transition state events (paired)
        // vehicle_stopped -> vehicle_moving
        if (Math.random() < 0.0005 && i > coordinates.length * 0.1 && i < coordinates.length * 0.9) { // 0.05% chance, not in first/last 10%
            const vehicleStopResult = addBlockingEvents(baseEvent, current_timestamp, {
                startEventType: "vehicle_stopped",
                endEventType: "vehicle_moving",
                minDuration: 5 * 60, // 5 minutes in seconds
                maxDuration: 30 * 60, // 30 minutes in seconds
                endEventData: (duration) => ({
                    stop_duration_minutes: Math.round(duration / 60)
                })
            });
            events.push(...vehicleStopResult.events);
            if (vehicleStopResult.newTimestamp) {
                current_timestamp = vehicleStopResult.newTimestamp;
            }
        }

        // 5. Add the trip pause events
        // signal_lost -> signal_recovered
        if (Math.random() < 0.0005 && i > coordinates.length * 0.2 && i < coordinates.length * 0.8) { // 0.05% chance, not in first/last 20%
            const signalLossResult = addBlockingEvents(baseEvent, current_timestamp, {
                startEventType: "signal_lost",
                endEventType: "signal_recovered",
                minDuration: 30, // 30 seconds
                maxDuration: 150, // 150 seconds
                endEventData: (duration) => ({
                    signal_lost_duration_seconds: duration,
                    signal_quality_after_recovery: "fair"
                })
            });
            events.push(...signalLossResult.events);
            if (signalLossResult.newTimestamp) {
                current_timestamp = signalLossResult.newTimestamp;
            }
        }

        // 6. Add the randomly placed events if it is time to place those based on probability
        // vehicle_telemetry
        if (Math.random() < 0.0008) { // 0.08% chance - reduce frequency for realism
            events.push({
                ...baseEvent,
                event_id: generateEventId(),
                event_type: "vehicle_telemetry",
                timestamp: current_timestamp.toISOString(),
                telemetry: {
                    odometer_km: Math.round(total_distance + 100000 + Math.random() * 50000), // Base odometer + trip distance
                    fuel_level_percent: fuel_level,
                    engine_hours: Math.round(8000 + Math.random() * 2000), // 8000-10000 hours
                    coolant_temp_celsius: 85 + Math.random() * 10, // 85-95°C
                    oil_pressure_kpa: 280 + Math.random() * 30, // 280-310 kPa
                    battery_voltage: 12.5 + Math.random() * 1.5 // 12.5-14.0V
                }
            });
        }
        
        // device_error
        if (Math.random() < 0.0005) { // 0.05% chance - errors should be rare
            const error_types = ['sensor_malfunction', 'gps_signal_weak', 'memory_low', 'temperature_high'];
            const error_codes = ['ERR_FUEL_SENSOR_003', 'ERR_GPS_WEAK_001', 'ERR_MEM_LOW_002', 'ERR_TEMP_HIGH_004'];
            const error_messages = ['Fuel level sensor reading invalid', 'GPS signal strength below threshold', 'Device memory usage critical', 'Device temperature exceeds safe limits'];
            const severities = ['warning', 'error', 'critical'];
            
            const errorIndex = Math.floor(Math.random() * error_types.length);
            
            events.push({
                ...baseEvent,
                event_id: generateEventId(),
                event_type: "device_error",
                timestamp: current_timestamp.toISOString(),
                error_type: error_types[errorIndex],
                error_code: error_codes[errorIndex],
                error_message: error_messages[errorIndex],
                severity: severities[Math.floor(Math.random() * severities.length)]
            });
        }

        // 7. Add the conditional events
        // speed_violation
        if (current_speed > config.speed_limit_kmh + config.speed_tolerance && Math.random() < 0.05) { // 5% chance when speeding - avoid spam
            events.push({
                ...baseEvent,
                event_id: generateEventId(),
                event_type: "speed_violation",
                timestamp: current_timestamp.toISOString(),
                speed_limit_kmh: Math.round(config.speed_limit_kmh),
                violation_amount_kmh: Math.round(current_speed - config.speed_limit_kmh),
                severity: current_speed > config.speed_limit_kmh + 20 ? "severe" : "moderate"
            });
        }
        
        // battery_low
        if (device_battery_level <= 10 && !battery_low_triggered) {
            events.push({
                ...baseEvent,
                event_id: generateEventId(),
                event_type: "battery_low",
                timestamp: current_timestamp.toISOString(),
                battery_level_percent: Math.round(device_battery_level * 10) / 10,
                threshold_percent: 10,
                estimated_remaining_hours: Math.round((device_battery_level / config.battery_drain_rate) / 100)
            });
            battery_low_triggered = true; // Mark as triggered so it never fires again
        }
        
        // fuel_level_low
        if (fuel_level <= 15 && !fuel_low_triggered) {
            events.push({
                ...baseEvent,
                event_id: generateEventId(),
                event_type: "fuel_level_low",
                timestamp: current_timestamp.toISOString(),
                fuel_level_percent: Math.round(fuel_level * 10) / 10,
                threshold_percent: 15,
                estimated_range_km: Math.round((fuel_level / 100) * config.fuel_tank_capacity_liters / config.fuel_efficiency * 100)
            });
            fuel_low_triggered = true; // Mark as triggered so it never fires again
        }
        
        // refueling_started -> refueling_completed
        if (Math.random() < 0.001 && fuel_level <= 20 && i > coordinates.length * 0.1 && i < coordinates.length * 0.9) { // 0.1% chance when fuel low, not in first/last 10%
            const refuel_amount_percent = 60 + Math.random() * 20; // Refuel 60-80% of tank
            const refuel_duration_minutes = 8 + Math.random() * 12; // 8-20 minutes
            const target_fuel_level = Math.min(100, fuel_level + refuel_amount_percent);
            
            const refuelingResult = addBlockingEvents(baseEvent, current_timestamp, {
                startEventType: "refueling_started",
                endEventType: "refueling_completed",
                minDuration: refuel_duration_minutes * 60, // Convert to seconds
                maxDuration: refuel_duration_minutes * 60, // Same duration
                endEventData: (duration) => ({
                    refuel_duration_minutes: Math.round(duration / 60),
                    fuel_level_after_refuel: Math.round(target_fuel_level * 10) / 10,
                    fuel_added_percent: Math.round((target_fuel_level - fuel_level) * 10) / 10
                })
            });
            events.push(...refuelingResult.events);
            if (refuelingResult.newTimestamp) {
                current_timestamp = refuelingResult.newTimestamp;
                fuel_level = target_fuel_level; // Update fuel level after refueling
                fuel_low_triggered = false; // Reset so it can trigger again next time
            }
        }
    }
    
    // Add trip_completed event at the end (only if not cancelled)
    if (!trip_cancelled) {
        events.push({
            event_id: generateEventId(),
            event_type: "trip_completed",
            timestamp: current_timestamp.toISOString(),
            vehicle_id: vehicleId,
            trip_id: tripId,
            device_id: deviceId,
            location: {
                lat: coordinates[coordinates.length-1][1],
                lng: coordinates[coordinates.length-1][0]
            },
            total_distance_km: Math.round(total_distance * 10) / 10,
            total_duration_hours: Math.round((current_timestamp - new Date(baseTime)) / 3600000 * 10) / 10,
            fuel_consumed_percent: Math.round((config.initial_fuel_level - fuel_level) * 10) / 10
        });
    }

    return events;
}

// Add blocking events (start/end pair with duration)
function addBlockingEvents(baseEvent, currentTimestamp, config) {
    const events = [];
    const duration = config.minDuration + Math.random() * (config.maxDuration - config.minDuration);
    
    // Prepare start event data
    const startEventData = { ...config.startEventData };
    if (startEventData.estimated_duration_seconds === null) {
        startEventData.estimated_duration_seconds = duration;
    }
    
    // Add start event
    events.push({
        ...baseEvent,
        event_id: generateEventId(),
        event_type: config.startEventType,
        timestamp: currentTimestamp.toISOString(),
        ...startEventData
    });
    
    // Add end event with delayed timestamp
    const endTimestamp = new Date(currentTimestamp.getTime() + duration * 1000);
    const endEventData = typeof config.endEventData === 'function' ? config.endEventData(duration) : config.endEventData;
    
    events.push({
        ...baseEvent,
        event_id: generateEventId(),
        event_type: config.endEventType,
        timestamp: endTimestamp.toISOString(),
        ...endEventData
    });
    
    return { events, newTimestamp: endTimestamp };
}

// Create location_ping event
function createLocationPingEvent(coord, timestamp, vehicleId, tripId, speed, heading, totalDistance) {
    const accuracy = 5 + Math.random() * 10; // 5-15 meters
    const altitude = 10 + Math.random() * 100; // 10-110 meters
    
    let signalQuality = 'excellent';
    if (accuracy > 12) signalQuality = 'good';
    if (accuracy > 20) signalQuality = 'fair';
    if (accuracy > 50) signalQuality = 'poor';
    
    return {
        event_id: generateEventId(),
        event_type: "location_ping",
        timestamp: timestamp.toISOString(),
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
            moving: speed > 1
        },
        distance_travelled_km: Math.round(totalDistance * 10) / 10,
        signal_quality: signalQuality
    };
}

// Helper functions
function calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
    const dLng = (coord2[0] - coord1[0]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function calculateTotalDistance(coordinates) {
    let total = 0;
    for (let i = 1; i < coordinates.length; i++) {
        total += calculateDistance(coordinates[i-1], coordinates[i]);
    }
    return total;
}

function calculateHeading(coord1, coord2) {
    const dLng = (coord2[0] - coord1[0]) * Math.PI / 180;
    const lat1 = coord1[1] * Math.PI / 180;
    const lat2 = coord2[1] * Math.PI / 180;
    
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    
    const heading = Math.atan2(y, x) * 180 / Math.PI;
    return (heading + 360) % 360;
}

module.exports = {
    generateAllEventsInSingleLoop
};

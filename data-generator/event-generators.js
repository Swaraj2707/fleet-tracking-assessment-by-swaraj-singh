// Event generator functions for fleet tracking events

// Generate unique event ID
function generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate timestamp with incremental seconds
function generateTimestamp(baseTime, offsetSeconds) {
    const timestamp = new Date(baseTime.getTime() + offsetSeconds * 1000);
    return timestamp.toISOString();
}

module.exports = {
    generateEventId,
    generateTimestamp
};

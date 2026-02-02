/**
 * Selective Coordination Analysis Module
 * 
 * Check protection device coordination between upstream and downstream devices
 * 
 * @author bfforex
 * @date 2026-02-02
 * @version 1.0.0
 * @standard IEEE 242-2001 (Buff Book) - Protection and Coordination
 * @standard NEC 2023 - Article 240.12
 */

console.log('🔧 Loading Selective Coordination Analysis Module v1.0.0...');

/**
 * Analyze selective coordination between two protection devices
 * 
 * @param {Object} upstreamDevice - Upstream device {type, rating, curve}
 * @param {Object} downstreamDevice - Downstream device {type, rating, curve}
 * @param {Number} maxFaultCurrent - Maximum fault current in amperes
 * @returns {Object} Coordination analysis results
 */
function analyzeSelectiveCoordination(upstreamDevice, downstreamDevice, maxFaultCurrent = 50000) {
    console.log('\n' + '═'.repeat(80));
    console.log('SELECTIVE COORDINATION ANALYSIS');
    console.log('═'.repeat(80));
    
    console.log(`\nUpstream Device: ${upstreamDevice.type} ${upstreamDevice.rating}A`);
    console.log(`Downstream Device: ${downstreamDevice.type} ${downstreamDevice.rating}A`);
    console.log(`Maximum Fault Current: ${maxFaultCurrent} A (${(maxFaultCurrent / 1000).toFixed(1)} kA)`);
    
    // Test current levels
    const faultCurrents = [1000, 2000, 5000, 10000, 20000, maxFaultCurrent];
    
    // Minimum coordination margin: 100ms (0.1 seconds)
    const minMarginSec = 0.1;
    
    console.log('\n' + '─'.repeat(80));
    console.log('COORDINATION CHECK AT MULTIPLE FAULT LEVELS:');
    console.log('─'.repeat(80));
    console.log('Fault Current | Upstream Time | Downstream Time | Margin | Status');
    console.log('─'.repeat(80));
    
    const results = [];
    let overallCoordinated = true;
    
    for (const current of faultCurrents) {
        // Estimate clearing times based on device type and rating
        const downstreamTime = estimateClearingTime(downstreamDevice, current);
        const upstreamTime = estimateClearingTime(upstreamDevice, current);
        
        const margin = upstreamTime - downstreamTime;
        const coordinated = margin >= minMarginSec;
        
        if (!coordinated) overallCoordinated = false;
        
        results.push({
            faultCurrent: current,
            upstreamTime: upstreamTime,
            downstreamTime: downstreamTime,
            margin: margin,
            coordinated: coordinated
        });
        
        const status = coordinated ? '✓ OK' : '✗ FAIL';
        console.log(`${(current / 1000).toFixed(1).padStart(13)} kA | ${upstreamTime.toFixed(4).padStart(13)} s | ${downstreamTime.toFixed(4).padStart(15)} s | ${margin.toFixed(4).padStart(6)} s | ${status}`);
    }
    
    console.log('─'.repeat(80));
    console.log(`\nOverall Coordination: ${overallCoordinated ? '✓ COORDINATED' : '✗ NOT COORDINATED'}`);
    console.log(`Minimum Margin Required: ${minMarginSec} seconds`);
    
    if (!overallCoordinated) {
        console.log(`\n⚠️  WARNING: Devices are NOT selectively coordinated!`);
        console.log(`   Recommendations:`);
        console.log(`   - Increase upstream device rating`);
        console.log(`   - Change upstream device curve type`);
        console.log(`   - Add current-limiting device upstream`);
        console.log(`   - Review time-current curves in detail`);
    }
    
    console.log('\n' + '═'.repeat(80) + '\n');
    
    return {
        upstreamDevice: upstreamDevice,
        downstreamDevice: downstreamDevice,
        maxFaultCurrent: maxFaultCurrent,
        minMarginRequired: minMarginSec,
        testPoints: results,
        overallCoordinated: overallCoordinated,
        standard: 'IEEE 242-2001 / NEC 240.12'
    };
}

/**
 * Estimate clearing time for a protection device
 * Simplified model - actual devices require time-current curves
 * 
 * @param {Object} device - Device object
 * @param {Number} faultCurrent - Fault current in amperes
 * @returns {Number} Estimated clearing time in seconds
 */
function estimateClearingTime(device, faultCurrent) {
    const rating = device.rating;
    const multiple = faultCurrent / rating;
    
    // Simplified time-current characteristics
    let time = 0;
    
    switch (device.type) {
        case 'fuse':
        case 'Fuse':
            // Fuses are fast at high multiples
            if (multiple < 2) {
                time = 100; // Very slow or doesn't trip
            } else if (multiple < 5) {
                time = 10 / multiple;
            } else {
                time = 0.01 + 5 / multiple;
            }
            break;
            
        case 'molded-case':
        case 'circuit-breaker':
        case 'MCCB':
            // MCCBs are slower than fuses
            if (multiple < 3) {
                time = 100; // Thermal trip only
            } else if (multiple < 10) {
                time = 1.0 / Math.sqrt(multiple);
            } else {
                time = 0.02 + 3 / multiple;
            }
            break;
            
        case 'relay':
        case 'Relay':
            // Inverse time relay
            const curveType = device.curve || 'inverse';
            if (curveType === 'very-inverse') {
                time = 1.0 / Math.pow(multiple, 2);
            } else if (curveType === 'extremely-inverse') {
                time = 1.5 / Math.pow(multiple, 2.5);
            } else {
                // Standard inverse
                time = 0.5 / multiple;
            }
            break;
            
        default:
            // Generic device
            time = 1.0 / Math.sqrt(multiple);
    }
    
    return Math.max(time, 0.001); // Minimum 1ms
}

/**
 * Generate coordination recommendations
 * 
 * @param {Object} upstreamDevice - Upstream device
 * @param {Object} downstreamDevice - Downstream device
 * @returns {Array} List of recommendations
 */
function generateCoordinationRecommendations(upstreamDevice, downstreamDevice) {
    const recommendations = [];
    
    // Check rating ratio
    const ratio = upstreamDevice.rating / downstreamDevice.rating;
    if (ratio < 1.5) {
        recommendations.push('Upstream device rating should be at least 1.5x downstream rating');
    }
    
    // Check device types
    if (upstreamDevice.type === downstreamDevice.type) {
        recommendations.push('Consider using different device types for better coordination');
    }
    
    // Fuse-breaker coordination
    if (upstreamDevice.type === 'fuse' && downstreamDevice.type === 'circuit-breaker') {
        recommendations.push('Fuse-breaker coordination is good - verify with time-current curves');
    }
    
    return recommendations;
}

// Export to global scope
window.analyzeSelectiveCoordination = analyzeSelectiveCoordination;
window.estimateClearingTime = estimateClearingTime;
window.generateCoordinationRecommendations = generateCoordinationRecommendations;

console.log('✅ Selective Coordination Analysis Module loaded successfully');

/**
 * System Totals Module
 * Centralized functions for calculating system-level totals from entry buses
 * 
 * @author bfforex
 * @date 2025-12-03
 * @version 3.3.0
 * 
 * Purpose:
 * - Generic identification of system entry/source buses (no hardcoded names)
 * - Authoritative system totals from entry buses (not per-bus summation)
 * - Reusable across all reports and analytics
 * 
 * Key Design Principles:
 * - System connected load = sum of ENTRY BUS currents only
 * - Entry buses are source buses without parent buses
 * - No hardcoded bus names (e.g., "EHV1") - fully generic
 */

console.log('🔧 Loading System Totals Module v3.3.0...');

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM ENTRY BUS IDENTIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all system entry buses (source buses without parents)
 * @param {Array} buses - Array of all buses
 * @returns {Array} Array of entry bus objects
 */
function getSystemEntryBuses(buses) {
    if (!buses || !Array.isArray(buses)) {
        console.warn('⚠️ getSystemEntryBuses: Invalid buses array');
        return [];
    }
    
    // Entry buses are source buses that have no parent bus
    const entryBuses = buses.filter(b => {
        return b.type === 'source' && !b.parentBus;
    });
    
    console.log(`📍 Found ${entryBuses.length} system entry buses:`, 
                entryBuses.map(b => b.name).join(', '));
    
    return entryBuses;
}

/**
 * Get the primary system entry bus (highest voltage source)
 * @param {Array} buses - Array of all buses
 * @returns {Object|null} Primary entry bus or null if none found
 */
function getPrimarySystemEntryBus(buses) {
    const entryBuses = getSystemEntryBuses(buses);
    
    if (!entryBuses.length) {
        console.warn('⚠️ No system entry buses found');
        return null;
    }
    
    // Find the entry bus with highest voltage
    const primaryBus = entryBuses.reduce((max, b) => {
        return (!max || b.voltage > max.voltage) ? b : max;
    }, null);
    
    console.log(`📍 Primary entry bus: ${primaryBus.name} @ ${primaryBus.voltage}V`);
    
    return primaryBus;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM TOTALS CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get authoritative system totals from entry buses only
 * This is the SINGLE SOURCE OF TRUTH for system connected load
 * 
 * @param {Array} buses - Array of all buses
 * @returns {Object} System totals object
 */
function getSystemEntryTotals(buses) {
    const entryBuses = getSystemEntryBuses(buses);
    
    if (!entryBuses.length) {
        console.warn('⚠️ No entry buses found, returning zero totals');
        return {
            totalConnectedA: 0,
            totalConnectedKVA: 0,
            entryBuses: [],
            busDetails: []
        };
    }
    
    let totalConnectedA = 0;
    let totalConnectedKVA = 0;
    const busDetails = [];
    
    entryBuses.forEach(bus => {
        // Get load flow summary
        const summary = bus.results?.loadFlow?.summary || {};
        
        // Use connected current (or total current as fallback)
        const busCurrentA = summary.connectedCurrent || summary.totalCurrent || 0;
        
        // Calculate kVA for this bus
        const busKVA = (busCurrentA * bus.voltage * Math.sqrt(3)) / 1000;
        
        // Accumulate totals
        totalConnectedA += busCurrentA;
        totalConnectedKVA += busKVA;
        
        // Track details
        busDetails.push({
            busId: bus.id,
            busName: bus.name,
            voltage: bus.voltage,
            currentA: busCurrentA,
            kVA: busKVA
        });
        
        console.log(`   📊 ${bus.name}: ${busCurrentA.toFixed(2)} A, ${busKVA.toFixed(2)} kVA`);
    });
    
    console.log(`✅ System Entry Totals: ${totalConnectedA.toFixed(2)} A, ${totalConnectedKVA.toFixed(2)} kVA`);
    
    return {
        totalConnectedA,
        totalConnectedKVA,
        entryBuses,
        busDetails
    };
}

/**
 * Compute system-wide load aggregates (MD, demand, diversity)
 * Centralizes the per-bus aggregation logic for consistency
 * 
 * @param {Array} buses - Array of all buses
 * @returns {Object} Aggregated load statistics
 */
function computeSystemLoadAggregates(buses) {
    let totalConnected = 0;
    let totalDemand = 0;
    let totalDiversity = 0;
    let busesWithDemandData = 0;
    
    buses.forEach(bus => {
        if (!bus.results?.loadFlow) return;
        
        const lf = bus.results.loadFlow;
        const summary = lf.summary || {};
        const demandSummary = lf.demandSummary || {};
        
        // Connected load (100% FLC)
        const connected = summary.connectedCurrent || summary.totalCurrent || 0;
        
        // Handle demand and diversity
        let demand = connected;
        let diversity = connected;
        
        if (lf.demandFactorsApplied) {
            // Explicit demand factors applied
            demand = demandSummary.demandCurrent || connected;
            diversity = demandSummary.diversityCurrent || demand;
            busesWithDemandData++;
        } else {
            // Apply default diversity by bus type (for informational purposes)
            let diversityFactor = 1.0;
            if (bus.type === 'source') diversityFactor = 1.0;
            else if (bus.type === 'distribution') diversityFactor = 1.2;
            else if (bus.type === 'branch') diversityFactor = 1.3;
            
            diversity = connected / diversityFactor;
        }
        
        totalConnected += connected;
        totalDemand += demand;
        totalDiversity += diversity;
    });
    
    console.log(`📊 System Load Aggregates:`);
    console.log(`   Connected: ${totalConnected.toFixed(2)} A (sum of all buses)`);
    console.log(`   Demand: ${totalDemand.toFixed(2)} A`);
    console.log(`   Diversity: ${totalDiversity.toFixed(2)} A`);
    console.log(`   Buses with demand data: ${busesWithDemandData}`);
    
    return {
        totalConnected,
        totalDemand,
        totalDiversity,
        busesWithDemandData
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.getSystemEntryBuses = getSystemEntryBuses;
    window.getPrimarySystemEntryBus = getPrimarySystemEntryBus;
    window.getSystemEntryTotals = getSystemEntryTotals;
    window.computeSystemLoadAggregates = computeSystemLoadAggregates;
}

console.log('✅ System Totals Module v3.3.0 loaded');
console.log('   - Entry Bus Identification: READY');
console.log('   - System Totals Calculation: READY');
console.log('   - Load Aggregation: READY');

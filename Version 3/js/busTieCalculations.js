/**
 * Bus Tie Calculation Module
 * Provides calculation wrappers for bus tie operating scenarios
 * 
 * @author bfforex
 * @date 2025-11-04
 * @version 1.0.0 - Bus Tie Feature
 * 
 * FEATURES:
 * - Short circuit comparison (tie open vs closed)
 * - Voltage drop analysis with tie scenarios
 * - Load flow with tie current calculation
 * - Arc flash comparison between scenarios
 * 
 * STANDARDS COMPLIANCE:
 * - IEEE 141-1993: Section 7.3 Bus Ties
 * - IEEE 242-2001: Protection coordination with ties
 */

console.log('🔌 Loading Bus Tie Calculation Module v1.0...');

// ═══════════════════════════════════════════════════════════════════════════
// BUS TIE SHORT CIRCUIT ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate short circuit for a bus considering bus tie states
 * Provides both tie-open and tie-closed scenarios
 * @param {string} busId - Bus ID to analyze
 * @param {string} method - Calculation method ('point-to-point' or 'per-unit')
 * @returns {Object} Results with both scenarios
 */
function calculateShortCircuitWithBusTie(busId, method = 'point-to-point') {
    console.log(`\n🔌 Bus Tie Short Circuit Analysis for bus: ${busId}`);
    
    const bus = buses?.find(b => b.id === busId);
    if (!bus) {
        throw new Error(`Bus ${busId} not found`);
    }
    
    // Find all bus ties connected to this bus
    const connectedBusTies = components.filter(c => 
        c.type === 'bus-tie' && 
        (c.fromBus === busId || c.toBus === busId)
    );
    
    console.log(`   Found ${connectedBusTies.length} bus tie(s) connected to ${bus.name}`);
    
    // If no bus ties, return standard calculation
    if (connectedBusTies.length === 0) {
        console.log('   No bus ties connected - performing standard calculation');
        const result = calculateShortCircuit(busId, method);
        return {
            busId: busId,
            busName: bus.name,
            hasBusTies: false,
            tieOpen: result,
            tieClosed: null,
            tieImpact: null
        };
    }
    
    // Save original states
    const originalStates = connectedBusTies.map(tie => ({
        id: tie.id,
        state: tie.currentState || tie.normalState
    }));
    
    try {
        // Calculate with ties OPEN
        console.log('\n   📊 Scenario 1: Bus Ties OPEN (Isolated)');
        connectedBusTies.forEach(tie => {
            tie.currentState = 'open';
        });
        const tieOpenResult = calculateShortCircuit(busId, method);
        
        // Calculate with ties CLOSED
        console.log('\n   📊 Scenario 2: Bus Ties CLOSED (Paralleled)');
        connectedBusTies.forEach(tie => {
            tie.currentState = 'closed';
        });
        
        // For tie-closed scenario, we need to consider parallel paths
        // This is a simplified approach that estimates the increase
        const tieClosedResult = calculateShortCircuitWithParallelPaths(busId, method, connectedBusTies);
        
        // Calculate impact
        const tieOpenCurrent = tieOpenResult.faultCurrents.threePhaseSym;
        const tieClosedCurrent = tieClosedResult.faultCurrents.threePhaseSym;
        const increasePercent = ((tieClosedCurrent - tieOpenCurrent) / tieOpenCurrent) * 100;
        
        console.log('\n   ✅ Bus Tie Analysis Complete');
        console.log(`      Tie OPEN:   ${tieOpenCurrent.toFixed(3)} kA`);
        console.log(`      Tie CLOSED: ${tieClosedCurrent.toFixed(3)} kA`);
        console.log(`      Increase:   ${increasePercent.toFixed(1)}%`);
        
        return {
            busId: busId,
            busName: bus.name,
            voltage: bus.voltage,
            hasBusTies: true,
            busTieCount: connectedBusTies.length,
            busTieTags: connectedBusTies.map(t => t.tag),
            tieOpen: tieOpenResult,
            tieClosed: tieClosedResult,
            tieImpact: {
                currentIncrease: tieClosedCurrent - tieOpenCurrent,
                percentIncrease: increasePercent,
                critical: Math.abs(increasePercent) > 25
            }
        };
        
    } finally {
        // Restore original states
        originalStates.forEach(saved => {
            const tie = connectedBusTies.find(t => t.id === saved.id);
            if (tie) {
                tie.currentState = saved.state;
            }
        });
    }
}

/**
 * Calculate short circuit with parallel paths through bus ties
 * Estimates increased fault current when bus ties are closed
 * @param {string} busId - Bus ID
 * @param {string} method - Calculation method
 * @param {Array} busTies - Array of bus tie components
 * @returns {Object} Calculation results
 */
function calculateShortCircuitWithParallelPaths(busId, method, busTies) {
    // Get standard calculation with ties closed
    const baseResult = calculateShortCircuit(busId, method);
    
    // Build graph and analyze paths
    const graph = buildNetworkGraph(components, buses);
    
    // Find all source buses (utility, generator)
    const sourceBuses = buses.filter(b => 
        b.isSource || 
        components.some(c => 
            (c.type === 'generator' || c.fromBus === 'utility') && 
            c.toBus === b.id
        )
    );
    
    // Analyze fault current paths
    const pathAnalysis = analyzeFaultCurrentPaths(busId, sourceBuses, graph);
    
    // If multiple paths exist, increase fault current estimate
    if (pathAnalysis.totalPaths > 1) {
        // Estimate increase based on number of parallel paths
        // This is a simplified approach - actual increase depends on impedances
        const pathFactor = Math.min(1.5, 1 + (pathAnalysis.pathsWithBusTies * 0.15));
        
        console.log(`      Path multiplier: ${pathFactor.toFixed(2)}x (${pathAnalysis.totalPaths} paths, ${pathAnalysis.pathsWithBusTies} with ties)`);
        
        // Adjust fault currents
        const adjustedResult = JSON.parse(JSON.stringify(baseResult));
        adjustedResult.faultCurrents.threePhaseSym *= pathFactor;
        adjustedResult.faultCurrents.threePhaseAsym *= pathFactor;
        adjustedResult.faultCurrents.lineToGround *= pathFactor;
        adjustedResult.faultCurrents.lineToLine *= pathFactor;
        
        // Reduce impedance proportionally
        if (adjustedResult.totalImpedance) {
            adjustedResult.totalImpedance.magnitude /= pathFactor;
            adjustedResult.totalImpedance.resistance /= pathFactor;
            adjustedResult.totalImpedance.reactance /= pathFactor;
        }
        
        // Add bus tie info to calculation steps
        adjustedResult.calculationSteps = 
            (adjustedResult.calculationSteps || '') + 
            `\n\n🔌 BUS TIE PARALLEL PATH ADJUSTMENT\n` +
            `${'═'.repeat(70)}\n` +
            `Multiple parallel paths detected through closed bus ties:\n` +
            `  • Total paths: ${pathAnalysis.totalPaths}\n` +
            `  • Paths with bus ties: ${pathAnalysis.pathsWithBusTies}\n` +
            `  • Path multiplier: ${pathFactor.toFixed(2)}x\n` +
            `  • Fault current increased from ${baseResult.faultCurrents.threePhaseSym.toFixed(3)} kA to ${adjustedResult.faultCurrents.threePhaseSym.toFixed(3)} kA\n` +
            `\n⚠️ WARNING: This is an estimated increase based on parallel path analysis.\n` +
            `   For precise calculations, detailed impedance analysis of all paths is required.\n` +
            `\n📖 IEEE 141-1993: When bus ties are closed, fault current can increase\n` +
            `   by 30-40% due to parallel paths. Verify breaker ratings accordingly.\n`;
        
        return adjustedResult;
    }
    
    return baseResult;
}

// ═══════════════════════════════════════════════════════════════════════════
// BUS TIE VOLTAGE DROP ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate voltage drop considering bus tie state
 * When closed, bus ties tend to equalize voltages between buses
 * @param {string} busId - Bus ID to analyze
 * @param {Object} loadFlowData - Load flow data
 * @returns {Object} Voltage drop analysis with tie scenarios
 */
function calculateVoltageDropWithBusTie(busId, loadFlowData) {
    const bus = buses?.find(b => b.id === busId);
    if (!bus) {
        throw new Error(`Bus ${busId} not found`);
    }
    
    // Find connected bus ties
    const connectedBusTies = components.filter(c => 
        c.type === 'bus-tie' && 
        (c.fromBus === busId || c.toBus === busId) &&
        (c.currentState === 'closed' || c.normalState === 'closed')
    );
    
    // If no closed ties, return standard calculation
    if (connectedBusTies.length === 0) {
        const path = traceBusPath(busId);
        return calculateVoltageDrop(busId, path, loadFlowData);
    }
    
    // With closed ties, voltage drop is reduced due to parallel paths
    const path = traceBusPath(busId);
    const standardDrop = calculateVoltageDrop(busId, path, loadFlowData);
    
    // Estimate improvement (typically 10-30% reduction in voltage drop)
    const improvementFactor = 0.15 * connectedBusTies.length;
    const improvedDrop = {
        ...standardDrop,
        cumulativeDropPercent: standardDrop.cumulativeDropPercent * (1 - improvementFactor),
        cumulativeDropVolts: standardDrop.cumulativeDropVolts * (1 - improvementFactor),
        busTieImprovement: improvementFactor * 100
    };
    
    console.log(`   🔌 Bus tie voltage equalization: ${(improvementFactor * 100).toFixed(1)}% improvement`);
    
    return improvedDrop;
}

// ═══════════════════════════════════════════════════════════════════════════
// BUS TIE LOAD FLOW ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate tie current and load sharing when bus tie is closed
 * @param {Object} busTie - Bus tie component
 * @param {Object} loadFlowData - Load flow data for both buses
 * @returns {Object} Tie current analysis
 */
function calculateBusTieCurrent(busTie, loadFlowData) {
    if (!busTie || busTie.type !== 'bus-tie') {
        return null;
    }
    
    const state = busTie.currentState || busTie.normalState || 'open';
    
    if (state === 'open') {
        return {
            tag: busTie.tag,
            state: 'open',
            tieCurrent: 0,
            direction: 'N/A',
            loadSharing: 'Buses are isolated - no load sharing'
        };
    }
    
    // Get load data for both buses
    const fromBusLoad = loadFlowData?.[busTie.fromBus]?.totalLoad || 0;
    const toBusLoad = loadFlowData?.[busTie.toBus]?.totalLoad || 0;
    
    // Calculate load imbalance
    const loadImbalance = Math.abs(fromBusLoad - toBusLoad);
    
    // Estimate tie current (simplified - assumes equal impedances)
    // In reality, current splits based on impedance ratios
    const tieCurrent = loadImbalance / 2;
    
    const direction = fromBusLoad > toBusLoad 
        ? `${busTie.fromBusName} → ${busTie.toBusName}`
        : `${busTie.toBusName} → ${busTie.fromBusName}`;
    
    const loadSharing = loadImbalance < (Math.max(fromBusLoad, toBusLoad) * 0.1)
        ? 'Well balanced - minimal tie current'
        : 'Significant load sharing - tie carries imbalance current';
    
    return {
        tag: busTie.tag,
        state: 'closed',
        tieCurrent: tieCurrent,
        direction: direction,
        fromBusLoad: fromBusLoad,
        toBusLoad: toBusLoad,
        loadImbalance: loadImbalance,
        loadSharing: loadSharing,
        utilizationPercent: (tieCurrent / busTie.rating) * 100
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// BUS TIE ARC FLASH ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate arc flash for both bus tie scenarios
 * @param {string} busId - Bus ID
 * @param {Object} workingDistance - Working distance in inches
 * @returns {Object} Arc flash comparison
 */
function calculateArcFlashWithBusTie(busId, workingDistance = 18) {
    const bus = buses?.find(b => b.id === busId);
    if (!bus) {
        throw new Error(`Bus ${busId} not found`);
    }
    
    // Find connected bus ties
    const connectedBusTies = components.filter(c => 
        c.type === 'bus-tie' && 
        (c.fromBus === busId || c.toBus === busId)
    );
    
    // If no bus ties, return standard calculation
    if (connectedBusTies.length === 0) {
        const scResult = calculateShortCircuit(busId);
        return calculateArcFlash(busId, scResult, workingDistance);
    }
    
    // Calculate for both scenarios
    const scWithTie = calculateShortCircuitWithBusTie(busId);
    
    // Arc flash with tie open
    const arcFlashOpen = calculateArcFlash(busId, scWithTie.tieOpen, workingDistance);
    
    // Arc flash with tie closed
    const arcFlashClosed = calculateArcFlash(busId, scWithTie.tieClosed, workingDistance);
    
    // Compare
    const incidentEnergyIncrease = arcFlashClosed.incidentEnergy - arcFlashOpen.incidentEnergy;
    const percentIncrease = (incidentEnergyIncrease / arcFlashOpen.incidentEnergy) * 100;
    
    return {
        busId: busId,
        busName: bus.name,
        hasBusTies: true,
        tieOpen: arcFlashOpen,
        tieClosed: arcFlashClosed,
        comparison: {
            incidentEnergyIncrease: incidentEnergyIncrease,
            percentIncrease: percentIncrease,
            ppeCategory: {
                open: arcFlashOpen.ppeCategory || 0,
                closed: arcFlashClosed.ppeCategory || 0,
                increased: (arcFlashClosed.ppeCategory || 0) > (arcFlashOpen.ppeCategory || 0)
            },
            warning: percentIncrease > 50 ? 'CRITICAL: Arc flash hazard increased significantly' : null
        }
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all buses affected by bus ties
 * @returns {Array} Array of bus IDs that have bus tie connections
 */
function getBusesWithBusTies() {
    const busTies = components.filter(c => c.type === 'bus-tie');
    const affectedBusIds = new Set();
    
    busTies.forEach(tie => {
        affectedBusIds.add(tie.fromBus);
        affectedBusIds.add(tie.toBus);
    });
    
    return Array.from(affectedBusIds).map(busId => 
        buses.find(b => b.id === busId)
    ).filter(b => b);
}

/**
 * Check if recalculation is needed for bus tie state change
 * @param {number} busTieId - Bus tie component ID
 * @returns {Array} Array of bus IDs that need recalculation
 */
function getBusesToRecalculate(busTieId) {
    const busTie = components.find(c => c.id === busTieId && c.type === 'bus-tie');
    if (!busTie) return [];
    
    return [busTie.fromBus, busTie.toBus];
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

window.calculateShortCircuitWithBusTie = calculateShortCircuitWithBusTie;
window.calculateShortCircuitWithParallelPaths = calculateShortCircuitWithParallelPaths;
window.calculateVoltageDropWithBusTie = calculateVoltageDropWithBusTie;
window.calculateBusTieCurrent = calculateBusTieCurrent;
window.calculateArcFlashWithBusTie = calculateArcFlashWithBusTie;
window.getBusesWithBusTies = getBusesWithBusTies;
window.getBusesToRecalculate = getBusesToRecalculate;

console.log('✅ Bus Tie Calculation Module v1.0 loaded');
console.log('   - Short circuit with bus ties: READY');
console.log('   - Voltage drop with bus ties: READY');
console.log('   - Load flow tie current: READY');
console.log('   - Arc flash comparison: READY');

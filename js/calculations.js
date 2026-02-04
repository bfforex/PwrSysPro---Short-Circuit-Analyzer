/**
 * Main Calculations Coordinator
 * Modified: 2025-10-28 04:53:30 UTC by bfforex
 * Enhanced: Added function existence checks
 */

/**
 * Calculate all analyses for a bus
 * Runs Short Circuit, Load Flow, and Voltage Drop analyses
 */
function calculateBus(busId) {
    const calculationDateStamp = getCalculationTimestamp();
    
    try {
        const bus = buses.find(b => b.id === busId);
        if (!bus) {
            alert('Bus not found.');
            return;
        }
        
        logger.info('\n' + '═'.repeat(80));
        logger.info(`COMPREHENSIVE ANALYSIS: ${bus.name}`);
        logger.info('═'.repeat(80));
        logger.info(`Date: ${calculationDateStamp}`);
        logger.info(`Engineer: ${document.getElementById('engineer').value || 'Unknown'}`);
        logger.info('═'.repeat(80) + '\n');
        
        const path = traceBusPath(busId);
        if (!path) {
            alert('Cannot trace path to source. Ensure bus is connected to a source bus.');
            return;
        }
        
        const method = document.querySelector('input[name="method"]:checked').value;
        
        // ═══════════════════════════════════════════════════════════
        // 1. SHORT CIRCUIT ANALYSIS
        // ═══════════════════════════════════════════════════════════
        logger.info('Running Short Circuit Analysis...');
        
        // ✅ DEFENSIVE CHECK: Verify function exists
        if (typeof calculateShortCircuit !== 'function') {
            const errorMsg = '❌ ERROR: calculateShortCircuit function not found!\n\n' +
                           'This usually means:\n' +
                           '1. shortCircuitCalc.js did not load\n' +
                           '2. Script loading order is incorrect\n' +
                           '3. Function export is missing\n\n' +
                           'Check browser console for loading errors.';
            logger.error(errorMsg);
            alert(errorMsg);
            return;
        }
        
        const shortCircuitResults = calculateShortCircuit(busId, method);
        
        // Store basic fault current data (backward compatibility)
        bus.faultCurrent = shortCircuitResults.faultCurrents.threePhaseSym;
        bus.asymFaultCurrent = shortCircuitResults.faultCurrents.threePhaseAsym;
        bus.xrRatio = shortCircuitResults.xrRatio;
        bus.totalZ = shortCircuitResults.totalImpedance.magnitude;
        
        // ═══════════════════════════════════════════════════════════
        // 2. LOAD FLOW ANALYSIS
        // ═══════════════════════════════════════════════════════════
        logger.info('Running Load Flow Analysis...');
        
        // ✅ DEFENSIVE CHECK: Verify function exists
        if (typeof calculateLoadFlow !== 'function') {
            logger.warn('WARNING: calculateLoadFlow function not found! Skipping load flow analysis.');
            const loadFlowResults = null;
        } else {
            var loadFlowResults = calculateLoadFlow(busId);
        }
        
        // ═══════════════════════════════════════════════════════════
        // 3. VOLTAGE DROP ANALYSIS
        // ═══════════════════════════════════════════════════════════
        logger.info('Running Voltage Drop Analysis...');
        
        // ✅ DEFENSIVE CHECK: Verify function exists
        if (typeof calculateVoltageDrop !== 'function') {
            logger.warn('WARNING: calculateVoltageDrop function not found! Skipping voltage drop analysis.');
            var voltageDropResults = null;
        } else {
            var voltageDropResults = calculateVoltageDrop(busId, path, loadFlowResults);
        }
        
        // ═══════════════════════════════════════════════════════════
        // STORE ALL RESULTS
        // ═══════════════════════════════════════════════════════════
        bus.results = {
            // Separate result sets
            shortCircuit: shortCircuitResults,
            loadFlow: loadFlowResults,
            voltageDrop: voltageDropResults,
            
            // Legacy compatibility (for existing code)
            faultCurrents: shortCircuitResults.faultCurrents,
            totalImpedance: shortCircuitResults.totalImpedance,
            xrRatio: shortCircuitResults.xrRatio,
            path: path,
            method: method,
            calculationDate: calculationDateStamp,
            
            // Additional metadata
            analysisComplete: true,
            analysisTypes: ['shortCircuit', 'loadFlow', 'voltageDrop']
        };
        
        // Store path components for analysis
        bus.pathComponents = path.map((segment, index) => ({
            sequence: index,
            bus: segment.bus,
            component: segment.component
        }));
        
        updateBusTree();
        updateBusesContent();
        
        selectedBusId = busId;
        
        // ═══════════════════════════════════════════════════════════
        // GENERATE RECOMMENDATIONS
        // ═══════════════════════════════════════════════════════════
        if (typeof recommendationEngine !== 'undefined') {
            const busRecommendations = recommendationEngine.analyzeBus(bus);
            logger.info(`${busRecommendations.length} recommendations generated`);
        }
        
        // ═══════════════════════════════════════════════════════════
        // DISPLAY RESULTS (NEW SEPARATED DISPLAY)
        // ═══════════════════════════════════════════════════════════
        if (typeof displayCalculationResults === 'function') {
            displayCalculationResults(
                busId,
                shortCircuitResults,
                loadFlowResults,
                voltageDropResults
            );
        } else {
            logger.warn('WARNING: displayCalculationResults function not found!');
        }
        
        switchTab(null, 'results');
        
        scheduleAutoSave();
        
        logger.info('\nALL ANALYSES COMPLETE');
        logger.info('   - Short Circuit: ✓');
        logger.info('   - Load Flow: ' + (loadFlowResults ? '✓' : 'Skipped'));
        logger.info('   - Voltage Drop: ' + (voltageDropResults ? '✓' : 'Skipped'));
        logger.info('═'.repeat(80) + '\n');
        
    } catch (error) {
        logger.error('Error calculating bus:', error);
        logger.error('Stack trace:', error.stack);
        alert('Error calculating bus:\n\n' + error.message + '\n\nCheck browser console for details.');
    }
}

/**
 * Calculate all buses in system
 */
function calculateAllBuses() {
    const calculatedBuses = buses.filter(b => b.type !== 'source' || b.utilityFaultCurrent);
    
    if (calculatedBuses.length === 0) {
        alert('No buses available for calculation. Add buses first.');
        return;
    }
    
    logger.info('\n' + '═'.repeat(80));
    logger.info('SYSTEM-WIDE ANALYSIS');
    logger.info('═'.repeat(80));
    logger.info(`Total buses: ${calculatedBuses.length}`);
    logger.info('═'.repeat(80) + '\n');
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    calculatedBuses.forEach(bus => {
        try {
            logger.info(`\nCalculating: ${bus.name}...`);
            calculateBus(bus.id);
            successCount++;
        } catch (error) {
            logger.error(`Failed to calculate ${bus.name}:`, error);
            errors.push({ bus: bus.name, error: error.message });
            errorCount++;
        }
    });
    
    logger.info('\n' + '═'.repeat(80));
    logger.info('SYSTEM ANALYSIS COMPLETE');
    logger.info('═'.repeat(80));
    logger.info(`Successful: ${successCount}`);
    logger.info(`Failed: ${errorCount}`);
    logger.info('═'.repeat(80) + '\n');
    
    if (errorCount > 0) {
        logger.error('Errors:', errors);
    }
    
    alert(`Analysis complete!\n\n✅ Successful: ${successCount}\n❌ Failed: ${errorCount}`);
}

// ═══════════════════════════════════════════════════════════
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// ═══════════════════════════════════════════════════════════
window.calculateBus = calculateBus;
window.calculateAllBuses = calculateAllBuses;

logger.info('Calculations coordinator loaded');
logger.info('   - calculateBus: Available');
logger.info('   - calculateAllBuses: Available');
logger.info('   - Dependencies check: Enabled');
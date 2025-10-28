/**
 * Main Calculations Coordinator
 * Modified: 2025-10-28 00:56:14 UTC by bfforex
 * Enhanced: Separated calculations into three distinct modules
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
        
        console.log('\n' + '═'.repeat(80));
        console.log(`COMPREHENSIVE ANALYSIS: ${bus.name}`);
        console.log('═'.repeat(80));
        console.log(`Date: ${calculationDateStamp}`);
        console.log(`Engineer: ${document.getElementById('engineer').value || 'Unknown'}`);
        console.log('═'.repeat(80) + '\n');
        
        const path = traceBusPath(busId);
        if (!path) {
            alert('Cannot trace path to source. Ensure bus is connected to a source bus.');
            return;
        }
        
        const method = document.querySelector('input[name="method"]:checked').value;
        
        // ═══════════════════════════════════════════════════════════
        // 1. SHORT CIRCUIT ANALYSIS
        // ═══════════════════════════════════════════════════════════
        console.log('🔥 Running Short Circuit Analysis...');
        const shortCircuitResults = calculateShortCircuit(busId, method);
        
        // Store basic fault current data (backward compatibility)
        bus.faultCurrent = shortCircuitResults.faultCurrents.threePhaseSym;
        bus.asymFaultCurrent = shortCircuitResults.faultCurrents.threePhaseAsym;
        bus.xrRatio = shortCircuitResults.xrRatio;
        bus.totalZ = shortCircuitResults.totalImpedance.magnitude;
        
        // ═══════════════════════════════════════════════════════════
        // 2. LOAD FLOW ANALYSIS
        // ═══════════════════════════════════════════════════════════
        console.log('🔌 Running Load Flow Analysis...');
        const loadFlowResults = calculateLoadFlow(busId);
        
        // ═══════════════════════════════════════════════════════════
        // 3. VOLTAGE DROP ANALYSIS
        // ═══════════════════════════════════════════════════════════
        console.log('📉 Running Voltage Drop Analysis...');
        const voltageDropResults = calculateVoltageDrop(busId, path, loadFlowResults);
        
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
        const busRecommendations = recommendationEngine.analyzeBus(bus);
        console.log(`📊 ${busRecommendations.length} recommendations generated`);
        
        // ═══════════════════════════════════════════════════════════
        // DISPLAY RESULTS (NEW SEPARATED DISPLAY)
        // ═══════════════════════════════════════════════════════════
        displayCalculationResults(
            busId,
            shortCircuitResults,
            loadFlowResults,
            voltageDropResults
        );
        
        switchTab(null, 'results');
        
        scheduleAutoSave();
        
        console.log('\n✅ ALL ANALYSES COMPLETE');
        console.log('   - Short Circuit: ✓');
        console.log('   - Load Flow: ✓');
        console.log('   - Voltage Drop: ✓');
        console.log('═'.repeat(80) + '\n');
        
    } catch (error) {
        console.error('Error calculating bus:', error);
        alert('Error calculating bus:\n\n' + error.message);
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
    
    console.log('\n' + '═'.repeat(80));
    console.log('SYSTEM-WIDE ANALYSIS');
    console.log('═'.repeat(80));
    console.log(`Total buses: ${calculatedBuses.length}`);
    console.log('═'.repeat(80) + '\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    calculatedBuses.forEach(bus => {
        try {
            console.log(`\nCalculating: ${bus.name}...`);
            calculateBus(bus.id);
            successCount++;
        } catch (error) {
            console.error(`Failed to calculate ${bus.name}:`, error);
            errorCount++;
        }
    });
    
    console.log('\n' + '═'.repeat(80));
    console.log('SYSTEM ANALYSIS COMPLETE');
    console.log('═'.repeat(80));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log('═'.repeat(80) + '\n');
    
    alert(`Analysis complete!\n\n✅ Successful: ${successCount}\n❌ Failed: ${errorCount}`);
}
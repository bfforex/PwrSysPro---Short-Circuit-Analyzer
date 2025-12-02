/**
 * Scenario Manager Module
 * Explicit Scenario Support for Bus-Tie Analysis
 * 
 * @author bfforex
 * @date 2025-12-02
 * @version 3.3.0
 * 
 * This module provides explicit scenario support for comparing bus-tie
 * configurations (open vs closed). Each scenario maintains a separate
 * set of bus results using the unified schema.
 * 
 * Key Features:
 * - Define baseline and comparison scenarios
 * - Track bus-tie states per scenario
 * - Store separate results for each scenario
 * - Generate comparison reports
 */

console.log('🔧 Loading Scenario Manager Module v3.3.0...');

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO MANAGER STATE
// ═══════════════════════════════════════════════════════════════════════════════

const ScenarioManager = {
    // Currently active scenarios
    scenarios: {},
    
    // Active scenario ID
    activeScenarioId: null,
    
    // Baseline scenario ID
    baselineScenarioId: null
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO CREATION AND MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new scenario
 * @param {String} id - Unique scenario identifier
 * @param {String} name - Human-readable name
 * @param {Object} options - Scenario options
 * @returns {Object} Created scenario
 */
function createNewScenario(id, name, options = {}) {
    const scenario = {
        id: id,
        name: name,
        description: options.description || '',
        
        // Bus tie configuration for this scenario
        busTies: {},
        
        // Results per bus for this scenario
        busResults: {},
        
        // Scenario metadata
        isBaseline: options.isBaseline || false,
        createdDate: new Date().toISOString(),
        calculatedDate: null,
        
        // Comparison data (if not baseline)
        comparisonBaseline: options.comparisonBaseline || null
    };
    
    // Store in manager
    ScenarioManager.scenarios[id] = scenario;
    
    // Set as baseline if specified
    if (options.isBaseline) {
        ScenarioManager.baselineScenarioId = id;
    }
    
    console.log(`✅ Created scenario: ${name} (${id})`);
    return scenario;
}

/**
 * Create baseline scenario from current system state
 * @param {Array} buses - Array of bus objects
 * @param {Array} components - Array of component objects
 * @returns {Object} Baseline scenario
 */
function createBaselineScenario(buses, components) {
    // Get current bus-tie states
    const busTies = {};
    const busTieComponents = components.filter(c => c.type === 'bus-tie');
    
    busTieComponents.forEach(tie => {
        busTies[tie.id] = tie.state || 'open';
    });
    
    const scenario = createNewScenario(
        'base',
        'Baseline (Bus Ties Open)',
        {
            description: 'Normal operating configuration with all bus ties open',
            isBaseline: true
        }
    );
    
    scenario.busTies = busTies;
    
    // Copy current results
    buses.forEach(bus => {
        if (bus.results) {
            scenario.busResults[bus.id] = JSON.parse(JSON.stringify(bus.results));
        }
    });
    
    scenario.calculatedDate = new Date().toISOString();
    
    console.log(`✅ Baseline scenario created with ${Object.keys(busTies).length} bus ties`);
    return scenario;
}

/**
 * Create bus-tie closed scenario
 * @param {String} tieName - Name for the scenario
 * @param {Array} tieIds - IDs of bus ties to close
 * @returns {Object} New scenario
 */
function createBusTieClosedScenario(tieName, tieIds) {
    const baselineId = ScenarioManager.baselineScenarioId || 'base';
    const baseline = ScenarioManager.scenarios[baselineId];
    
    if (!baseline) {
        throw new Error('Baseline scenario must be created first');
    }
    
    // Generate scenario ID
    const scenarioId = `tie_${tieIds.join('_')}_closed`;
    
    const scenario = createNewScenario(
        scenarioId,
        tieName,
        {
            description: `Configuration with bus ties ${tieIds.join(', ')} closed`,
            isBaseline: false,
            comparisonBaseline: baselineId
        }
    );
    
    // Copy bus tie states from baseline, then close specified ties
    scenario.busTies = { ...baseline.busTies };
    tieIds.forEach(id => {
        scenario.busTies[id] = 'closed';
    });
    
    return scenario;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate results for a specific scenario
 * @param {String} scenarioId - Scenario to calculate
 * @param {Array} buses - Bus array
 * @param {Array} components - Component array
 * @returns {Object} Updated scenario with results
 */
function calculateScenario(scenarioId, buses, components) {
    const scenario = ScenarioManager.scenarios[scenarioId];
    
    if (!scenario) {
        throw new Error(`Scenario ${scenarioId} not found`);
    }
    
    console.log(`\n═══════════════════════════════════════════════════════════════════`);
    console.log(`CALCULATING SCENARIO: ${scenario.name}`);
    console.log(`═══════════════════════════════════════════════════════════════════\n`);
    
    // Apply bus-tie states to components
    const modifiedComponents = components.map(comp => {
        if (comp.type === 'bus-tie' && scenario.busTies[comp.id]) {
            return { ...comp, state: scenario.busTies[comp.id] };
        }
        return comp;
    });
    
    // Store original components state
    const originalComponents = [...components];
    
    // Temporarily replace global components
    if (typeof window !== 'undefined') {
        window.components = modifiedComponents;
    }
    
    try {
        // Calculate all buses
        if (typeof calculateAllBuses === 'function') {
            calculateAllBuses();
        }
        
        // Store results in scenario
        buses.forEach(bus => {
            if (bus.results) {
                scenario.busResults[bus.id] = JSON.parse(JSON.stringify(bus.results));
            }
        });
        
        scenario.calculatedDate = new Date().toISOString();
        console.log(`✅ Scenario ${scenario.name} calculated successfully`);
        
    } finally {
        // Restore original components
        if (typeof window !== 'undefined') {
            window.components = originalComponents;
        }
    }
    
    return scenario;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO COMPARISON
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compare two scenarios and generate comparison data
 * @param {String} scenarioId1 - First scenario ID
 * @param {String} scenarioId2 - Second scenario ID
 * @returns {Object} Comparison results
 */
function compareScenarios(scenarioId1, scenarioId2) {
    const scenario1 = ScenarioManager.scenarios[scenarioId1];
    const scenario2 = ScenarioManager.scenarios[scenarioId2];
    
    if (!scenario1 || !scenario2) {
        throw new Error('Both scenarios must exist for comparison');
    }
    
    console.log(`\n📊 Comparing: ${scenario1.name} vs ${scenario2.name}`);
    
    const comparison = {
        scenario1: {
            id: scenario1.id,
            name: scenario1.name
        },
        scenario2: {
            id: scenario2.id,
            name: scenario2.name
        },
        
        // Per-bus comparison
        busComparisons: {},
        
        // Summary statistics
        summary: {
            faultCurrentChange: {
                max: 0,
                min: 0,
                affected: 0
            },
            voltageDropChange: {
                max: 0,
                min: 0,
                affected: 0
            },
            arcFlashChange: {
                max: 0,
                min: 0,
                affected: 0
            }
        },
        
        comparisonDate: new Date().toISOString()
    };
    
    // Get all bus IDs
    const allBusIds = new Set([
        ...Object.keys(scenario1.busResults),
        ...Object.keys(scenario2.busResults)
    ]);
    
    allBusIds.forEach(busId => {
        const results1 = scenario1.busResults[busId] || {};
        const results2 = scenario2.busResults[busId] || {};
        
        // Get fault currents
        const fc1 = results1.shortCircuit?.faultCurrents?.threePhaseSym || 
                   results1.faultCurrents?.threePhaseSym || 0;
        const fc2 = results2.shortCircuit?.faultCurrents?.threePhaseSym || 
                   results2.faultCurrents?.threePhaseSym || 0;
        
        // Get voltage drops (design)
        const vd1 = results1.loadFlow?.voltageDrop?.designPercent ||
                   results1.voltageDrop?.cumulativeDropPercent || 0;
        const vd2 = results2.loadFlow?.voltageDrop?.designPercent ||
                   results2.voltageDrop?.cumulativeDropPercent || 0;
        
        // Get arc flash incident energy
        const ie1 = results1.shortCircuit?.arcFlash?.incidentEnergy ||
                   results1.arcFlash?.incidentEnergy || 0;
        const ie2 = results2.shortCircuit?.arcFlash?.incidentEnergy ||
                   results2.arcFlash?.incidentEnergy || 0;
        
        // Calculate changes
        const fcChange = fc1 > 0 ? ((fc2 - fc1) / fc1) * 100 : 0;
        const vdChange = vd1 > 0 ? ((vd2 - vd1) / vd1) * 100 : 0;
        const ieChange = ie1 > 0 ? ((ie2 - ie1) / ie1) * 100 : 0;
        
        comparison.busComparisons[busId] = {
            faultCurrent: {
                scenario1: fc1,
                scenario2: fc2,
                changePercent: fcChange,
                changeAbsolute: fc2 - fc1
            },
            voltageDrop: {
                scenario1: vd1,
                scenario2: vd2,
                changePercent: vdChange,
                changeAbsolute: vd2 - vd1
            },
            arcFlash: {
                scenario1: ie1,
                scenario2: ie2,
                changePercent: ieChange,
                changeAbsolute: ie2 - ie1
            }
        };
        
        // Update summary statistics
        if (Math.abs(fcChange) > 0.1) {
            comparison.summary.faultCurrentChange.affected++;
            if (fcChange > comparison.summary.faultCurrentChange.max) {
                comparison.summary.faultCurrentChange.max = fcChange;
            }
            if (fcChange < comparison.summary.faultCurrentChange.min) {
                comparison.summary.faultCurrentChange.min = fcChange;
            }
        }
        
        if (Math.abs(vdChange) > 0.1) {
            comparison.summary.voltageDropChange.affected++;
            if (vdChange > comparison.summary.voltageDropChange.max) {
                comparison.summary.voltageDropChange.max = vdChange;
            }
            if (vdChange < comparison.summary.voltageDropChange.min) {
                comparison.summary.voltageDropChange.min = vdChange;
            }
        }
        
        if (Math.abs(ieChange) > 0.1) {
            comparison.summary.arcFlashChange.affected++;
            if (ieChange > comparison.summary.arcFlashChange.max) {
                comparison.summary.arcFlashChange.max = ieChange;
            }
            if (ieChange < comparison.summary.arcFlashChange.min) {
                comparison.summary.arcFlashChange.min = ieChange;
            }
        }
    });
    
    console.log(`✅ Comparison complete`);
    console.log(`   Buses affected by fault current change: ${comparison.summary.faultCurrentChange.affected}`);
    console.log(`   Buses affected by VD change: ${comparison.summary.voltageDropChange.affected}`);
    console.log(`   Buses affected by IE change: ${comparison.summary.arcFlashChange.affected}`);
    
    return comparison;
}

/**
 * Generate bus-tie analysis report text
 * @param {Object} comparison - Comparison data
 * @param {Array} buses - Bus array for names
 * @returns {String} Report text
 */
function generateBusTieAnalysisReport(comparison, buses) {
    let report = '';
    
    report += '═'.repeat(100) + '\n';
    report += 'BUS TIE ANALYSIS REPORT\n';
    report += '═'.repeat(100) + '\n\n';
    
    report += `SCENARIOS COMPARED:\n`;
    report += `─`.repeat(100) + '\n';
    report += `Scenario 1 (Baseline): ${comparison.scenario1.name}\n`;
    report += `Scenario 2 (Alternate): ${comparison.scenario2.name}\n`;
    report += `Comparison Date: ${comparison.comparisonDate}\n\n`;
    
    report += `SUMMARY OF CHANGES:\n`;
    report += `─`.repeat(100) + '\n';
    report += `\nFAULT CURRENT CHANGES:\n`;
    report += `  Buses Affected: ${comparison.summary.faultCurrentChange.affected}\n`;
    report += `  Maximum Increase: ${comparison.summary.faultCurrentChange.max.toFixed(1)}%\n`;
    report += `  Maximum Decrease: ${comparison.summary.faultCurrentChange.min.toFixed(1)}%\n`;
    
    report += `\nVOLTAGE DROP CHANGES:\n`;
    report += `  Buses Affected: ${comparison.summary.voltageDropChange.affected}\n`;
    report += `  Maximum Increase: ${comparison.summary.voltageDropChange.max.toFixed(1)}%\n`;
    report += `  Maximum Decrease: ${comparison.summary.voltageDropChange.min.toFixed(1)}%\n`;
    
    report += `\nARC FLASH INCIDENT ENERGY CHANGES:\n`;
    report += `  Buses Affected: ${comparison.summary.arcFlashChange.affected}\n`;
    report += `  Maximum Increase: ${comparison.summary.arcFlashChange.max.toFixed(1)}%\n`;
    report += `  Maximum Decrease: ${comparison.summary.arcFlashChange.min.toFixed(1)}%\n`;
    
    // Important note about arc flash vs fault current
    const ieIncreased = comparison.summary.arcFlashChange.max > 5;
    const fcUnchanged = Math.abs(comparison.summary.faultCurrentChange.max) < 5 &&
                       Math.abs(comparison.summary.faultCurrentChange.min) < 5;
    
    if (ieIncreased && fcUnchanged) {
        report += `\n⚠️ IMPORTANT NOTE:\n`;
        report += `   Arc flash incident energy has increased significantly while\n`;
        report += `   bolted fault current remains effectively unchanged.\n`;
        report += `   This can occur when bus-tie closure affects clearing time\n`;
        report += `   or electrode configuration without significantly changing\n`;
        report += `   available fault current.\n\n`;
    }
    
    // Detailed per-bus comparison
    report += `\nDETAILED BUS COMPARISON:\n`;
    report += `─`.repeat(100) + '\n';
    report += `${'Bus Name'.padEnd(25)}${'FC1(kA)'.padStart(10)}${'FC2(kA)'.padStart(10)}${'FC Δ%'.padStart(10)}`;
    report += `${'VD1(%)'.padStart(10)}${'VD2(%)'.padStart(10)}${'VD Δ%'.padStart(10)}`;
    report += `${'IE1'.padStart(10)}${'IE2'.padStart(10)}${'IE Δ%'.padStart(10)}\n`;
    report += `─`.repeat(100) + '\n';
    
    Object.keys(comparison.busComparisons).forEach(busId => {
        const bus = buses.find(b => b.id === busId);
        const busName = bus?.name || busId;
        const comp = comparison.busComparisons[busId];
        
        const fcChangeStr = comp.faultCurrent.changePercent !== 0 ? 
            `${comp.faultCurrent.changePercent > 0 ? '+' : ''}${comp.faultCurrent.changePercent.toFixed(1)}%` : '-';
        const vdChangeStr = comp.voltageDrop.changePercent !== 0 ?
            `${comp.voltageDrop.changePercent > 0 ? '+' : ''}${comp.voltageDrop.changePercent.toFixed(1)}%` : '-';
        const ieChangeStr = comp.arcFlash.changePercent !== 0 ?
            `${comp.arcFlash.changePercent > 0 ? '+' : ''}${comp.arcFlash.changePercent.toFixed(1)}%` : '-';
        
        report += `${busName.substring(0, 24).padEnd(25)}`;
        report += `${comp.faultCurrent.scenario1.toFixed(2).padStart(10)}`;
        report += `${comp.faultCurrent.scenario2.toFixed(2).padStart(10)}`;
        report += `${fcChangeStr.padStart(10)}`;
        report += `${comp.voltageDrop.scenario1.toFixed(2).padStart(10)}`;
        report += `${comp.voltageDrop.scenario2.toFixed(2).padStart(10)}`;
        report += `${vdChangeStr.padStart(10)}`;
        report += `${comp.arcFlash.scenario1.toFixed(2).padStart(10)}`;
        report += `${comp.arcFlash.scenario2.toFixed(2).padStart(10)}`;
        report += `${ieChangeStr.padStart(10)}\n`;
    });
    
    report += `\n`;
    report += `NOTES:\n`;
    report += `─`.repeat(100) + '\n';
    report += `• FC = Fault Current (3-phase symmetrical, kA)\n`;
    report += `• VD = Design Voltage Drop (at 100% FLC, %)\n`;
    report += `• IE = Incident Energy (cal/cm²)\n`;
    report += `• Δ% = Percentage change from Scenario 1 to Scenario 2\n`;
    report += `• Design VD is used for compliance checking per IEEE 141\n`;
    report += `• Positive Δ% indicates an increase in the alternate scenario\n`;
    
    report += '\n' + '═'.repeat(100) + '\n';
    report += 'END OF BUS TIE ANALYSIS REPORT\n';
    report += '═'.repeat(100) + '\n';
    
    return report;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all scenarios
 * @returns {Object} All scenarios
 */
function getAllScenarios() {
    return ScenarioManager.scenarios;
}

/**
 * Get scenario by ID
 * @param {String} id - Scenario ID
 * @returns {Object} Scenario object
 */
function getScenario(id) {
    return ScenarioManager.scenarios[id];
}

/**
 * Get baseline scenario
 * @returns {Object} Baseline scenario
 */
function getBaselineScenario() {
    return ScenarioManager.scenarios[ScenarioManager.baselineScenarioId];
}

/**
 * Set active scenario
 * @param {String} id - Scenario ID to activate
 */
function setActiveScenario(id) {
    if (!ScenarioManager.scenarios[id]) {
        throw new Error(`Scenario ${id} not found`);
    }
    ScenarioManager.activeScenarioId = id;
    console.log(`✅ Active scenario set to: ${ScenarioManager.scenarios[id].name}`);
}

/**
 * Clear all scenarios
 */
function clearAllScenarios() {
    ScenarioManager.scenarios = {};
    ScenarioManager.activeScenarioId = null;
    ScenarioManager.baselineScenarioId = null;
    console.log('✅ All scenarios cleared');
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.ScenarioManager = ScenarioManager;
    
    // Scenario management
    window.createNewScenario = createNewScenario;
    window.createBaselineScenario = createBaselineScenario;
    window.createBusTieClosedScenario = createBusTieClosedScenario;
    
    // Calculation
    window.calculateScenario = calculateScenario;
    
    // Comparison
    window.compareScenarios = compareScenarios;
    window.generateBusTieAnalysisReport = generateBusTieAnalysisReport;
    
    // Utilities
    window.getAllScenarios = getAllScenarios;
    window.getScenario = getScenario;
    window.getBaselineScenario = getBaselineScenario;
    window.setActiveScenario = setActiveScenario;
    window.clearAllScenarios = clearAllScenarios;
}

console.log('✅ Scenario Manager Module v3.3.0 loaded');
console.log('   - Explicit scenario support');
console.log('   - Bus-tie configuration tracking');
console.log('   - Scenario comparison with unified schema');
console.log('   - Report generation for bus-tie analysis');
console.log('');

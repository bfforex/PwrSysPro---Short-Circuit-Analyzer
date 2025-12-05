/**
 * Load Flow Analysis Module
 * Generates comprehensive 5-subsection Load Flow Analysis for Section 2.2
 * Replaces confusing "Internal Load Distribution" with clear power flow analysis
 * 
 * @author bfforex
 * @date 2025-12-05
 * @version 3.4.0
 * 
 * Features:
 * - 2.2.1: Primary Distribution (13.2kV feeders) - Filter buses voltage >= 1000V
 * - 2.2.2: Transformer Loading - Show loading % with severity levels
 * - 2.2.3: Secondary Distribution (440V) - Top 10 load points
 * - 2.2.4: Load Balance - Parallel feeder imbalance analysis
 * - 2.2.5: Summary - Top 3 issues with recommended actions
 * 
 * Standards Compliance:
 * - IEEE 141-1993 (Red Book) - Load Flow and Power Flow Analysis
 * - NEC 2017 Article 220 - Branch-Circuit and Feeder Load Calculations
 */

console.log('🔧 Loading Load Flow Analysis Module v3.4.0...');

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD FLOW ANALYSIS MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate comprehensive Load Flow Analysis with 5 subsections
 * This replaces the confusing "Internal Load Distribution" section
 * 
 * @param {Array} buses - Array of all buses with calculation results
 * @param {Object} analytics - ReportAnalytics instance
 * @returns {String} Complete Load Flow Analysis section
 */
function generateLoadFlowAnalysis(buses, analytics) {
    let report = `${'='.repeat(100)}
2.2 LOAD FLOW ANALYSIS
${'='.repeat(100)}

This section provides a comprehensive power flow analysis throughout the electrical system.
Load Flow Analysis shows how power is distributed from source to end loads, identifying
transformer loading, voltage levels, and system balance.

`;

    // 2.2.1 Primary Distribution
    report += generatePrimaryDistributionAnalysis(buses, analytics);
    
    // 2.2.2 Transformer Loading
    report += generateTransformerLoadingAnalysis(buses);
    
    // 2.2.3 Secondary Distribution
    report += generateSecondaryDistributionAnalysis(buses);
    
    // 2.2.4 Load Balance
    report += generateLoadBalanceAnalysis(buses);
    
    // 2.2.5 Summary
    report += generateLoadFlowSummary(buses);

    return report;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2.2.1 PRIMARY DISTRIBUTION (13.2kV feeders)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate Primary Distribution analysis for medium voltage feeders (>= 1000V)
 * 
 * @param {Array} buses - Array of all buses
 * @param {Object} analytics - ReportAnalytics instance
 * @returns {String} Primary distribution section
 */
function generatePrimaryDistributionAnalysis(buses, analytics) {
    let report = `${'-'.repeat(100)}
2.2.1 PRIMARY DISTRIBUTION (Medium Voltage Feeders >= 1kV)
${'-'.repeat(100)}

`;

    // Filter buses >= 1000V
    const primaryBuses = buses.filter(b => b.voltage >= 1000 && b.results);
    
    if (primaryBuses.length === 0) {
        report += 'No primary distribution buses (>= 1kV) found in system.\n\n';
        return report;
    }

    report += `Total Primary Buses: ${primaryBuses.length}\n\n`;
    report += `${'Bus Name'.padEnd(25)}${'Voltage'.padEnd(12)}${'Load (A)'.padEnd(12)}${'Power (kVA)'.padEnd(15)}${'Status'.padEnd(15)}\n`;
    report += `${'-'.repeat(100)}\n`;

    primaryBuses.forEach(bus => {
        const voltage = bus.voltage;
        const loadCurrent = bus.results?.loadFlow?.summary?.totalCurrent || 0;
        const loadKVA = bus.results?.loadFlow?.summary?.totalKVA || 0;
        
        let status = '✓ Normal';
        if (loadCurrent > 1000) {
            status = '⚠️ High Load';
        } else if (loadCurrent < 10) {
            status = 'ℹ️ Light Load';
        }

        report += `${bus.name.padEnd(25)}${(voltage + ' V').padEnd(12)}${loadCurrent.toFixed(2).padEnd(12)}${loadKVA.toFixed(2).padEnd(15)}${status.padEnd(15)}\n`;
    });

    // Calculate totals
    const totalPrimaryLoad = primaryBuses.reduce((sum, b) => 
        sum + (b.results?.loadFlow?.summary?.totalCurrent || 0), 0);
    const totalPrimaryKVA = primaryBuses.reduce((sum, b) => 
        sum + (b.results?.loadFlow?.summary?.totalKVA || 0), 0);

    report += `${'-'.repeat(100)}\n`;
    report += `${'TOTAL PRIMARY'.padEnd(25)}${' '.padEnd(12)}${totalPrimaryLoad.toFixed(2).padEnd(12)}${totalPrimaryKVA.toFixed(2).padEnd(15)}\n`;
    report += `\n`;

    return report;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2.2.2 TRANSFORMER LOADING ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate Transformer Loading analysis with severity levels
 * 
 * @param {Array} buses - Array of all buses
 * @returns {String} Transformer loading section
 */
function generateTransformerLoadingAnalysis(buses) {
    let report = `${'-'.repeat(100)}
2.2.2 TRANSFORMER LOADING ANALYSIS
${'-'.repeat(100)}

`;

    // Get all transformers from components
    const transformers = (typeof components !== 'undefined' && Array.isArray(components)) 
        ? components.filter(c => c.type === 'transformer') 
        : [];

    if (transformers.length === 0) {
        report += 'No transformers found in system.\n\n';
        return report;
    }

    report += `Total Transformers: ${transformers.length}\n\n`;
    report += `${'Transformer'.padEnd(20)}${'Rating'.padEnd(15)}${'Load'.padEnd(15)}${'Loading %'.padEnd(15)}${'Severity'.padEnd(20)}\n`;
    report += `${'-'.repeat(100)}\n`;

    transformers.forEach(xfmr => {
        const rating = xfmr.rating || xfmr.kva || 1000;
        const toBus = buses.find(b => b.id === xfmr.toBus || b.name === xfmr.toBusName);
        const loadKVA = toBus?.results?.loadFlow?.summary?.totalKVA || 0;
        const loadingPercent = (loadKVA / rating) * 100;

        let severity = '';
        if (loadingPercent > 150) {
            severity = '🔴 CRITICAL >150%';
        } else if (loadingPercent > 120) {
            severity = '🟠 HIGH 120-150%';
        } else if (loadingPercent > 110) {
            severity = '🟡 MODERATE 110-120%';
        } else if (loadingPercent > 100) {
            severity = '🔵 MINOR 100-110%';
        } else {
            severity = '✓ Normal <100%';
        }

        const tag = xfmr.tag || xfmr.name || xfmr.id;
        report += `${tag.padEnd(20)}${(rating + ' kVA').padEnd(15)}${loadKVA.toFixed(2).padEnd(15)}${loadingPercent.toFixed(1).padEnd(15)}${severity}\n`;
    });

    report += `\n`;

    return report;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2.2.3 SECONDARY DISTRIBUTION (440V/480V)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate Secondary Distribution analysis for low voltage loads
 * Shows top 10 load points
 * 
 * @param {Array} buses - Array of all buses
 * @returns {String} Secondary distribution section
 */
function generateSecondaryDistributionAnalysis(buses) {
    let report = `${'-'.repeat(100)}
2.2.3 SECONDARY DISTRIBUTION (Low Voltage <= 1kV) - Top 10 Load Points
${'-'.repeat(100)}

`;

    // Filter buses < 1000V
    const secondaryBuses = buses.filter(b => b.voltage < 1000 && b.results);
    
    if (secondaryBuses.length === 0) {
        report += 'No secondary distribution buses (< 1kV) found in system.\n\n';
        return report;
    }

    // Sort by load current descending and take top 10
    const topLoads = secondaryBuses
        .map(bus => ({
            bus,
            loadCurrent: bus.results?.loadFlow?.summary?.totalCurrent || 0
        }))
        .sort((a, b) => b.loadCurrent - a.loadCurrent)
        .slice(0, 10);

    report += `Total Secondary Buses: ${secondaryBuses.length}\n`;
    report += `Showing Top 10 Heaviest Loaded Buses:\n\n`;
    report += `${'Rank'.padEnd(8)}${'Bus Name'.padEnd(25)}${'Voltage'.padEnd(12)}${'Load (A)'.padEnd(12)}${'Power (kVA)'.padEnd(15)}\n`;
    report += `${'-'.repeat(100)}\n`;

    topLoads.forEach((item, index) => {
        const bus = item.bus;
        const voltage = bus.voltage;
        const loadCurrent = item.loadCurrent;
        const loadKVA = bus.results?.loadFlow?.summary?.totalKVA || 0;

        report += `${(index + 1).toString().padEnd(8)}${bus.name.padEnd(25)}${(voltage + ' V').padEnd(12)}${loadCurrent.toFixed(2).padEnd(12)}${loadKVA.toFixed(2).padEnd(15)}\n`;
    });

    report += `\n`;

    return report;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2.2.4 LOAD BALANCE ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate Load Balance analysis for parallel feeders
 * 
 * @param {Array} buses - Array of all buses
 * @returns {String} Load balance section
 */
function generateLoadBalanceAnalysis(buses) {
    let report = `${'-'.repeat(100)}
2.2.4 LOAD BALANCE ANALYSIS (Parallel Feeder Imbalance)
${'-'.repeat(100)}

`;

    // Group buses by voltage level to find parallel feeders
    const voltageGroups = {};
    buses.forEach(bus => {
        if (!bus.results) return;
        const voltage = bus.voltage;
        if (!voltageGroups[voltage]) {
            voltageGroups[voltage] = [];
        }
        voltageGroups[voltage].push(bus);
    });

    let foundParallelFeeders = false;

    Object.keys(voltageGroups).forEach(voltage => {
        const busesAtVoltage = voltageGroups[voltage];
        
        // Only analyze if there are 2+ buses at this voltage (potential parallel feeders)
        if (busesAtVoltage.length >= 2) {
            foundParallelFeeders = true;
            
            const loads = busesAtVoltage.map(b => b.results?.loadFlow?.summary?.totalCurrent || 0);
            const avgLoad = loads.reduce((sum, l) => sum + l, 0) / loads.length;
            const maxLoad = Math.max(...loads);
            const minLoad = Math.min(...loads);
            const imbalance = avgLoad > 0 ? ((maxLoad - minLoad) / avgLoad) * 100 : 0;

            report += `Voltage Level: ${voltage} V (${busesAtVoltage.length} buses)\n`;
            report += `  Average Load: ${avgLoad.toFixed(2)} A\n`;
            report += `  Maximum Load: ${maxLoad.toFixed(2)} A\n`;
            report += `  Minimum Load: ${minLoad.toFixed(2)} A\n`;
            report += `  Imbalance: ${imbalance.toFixed(1)}%`;
            
            if (imbalance > 20) {
                report += ` 🔴 HIGH - Rebalancing recommended\n`;
            } else if (imbalance > 10) {
                report += ` 🟡 MODERATE - Monitor\n`;
            } else {
                report += ` ✓ Acceptable\n`;
            }
            report += `\n`;
        }
    });

    if (!foundParallelFeeders) {
        report += 'No parallel feeders detected at same voltage level.\n';
        report += 'Load balancing analysis requires 2+ buses at the same voltage level.\n';
    }

    report += `\n`;

    return report;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2.2.5 LOAD FLOW SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate Load Flow Summary with top 3 issues and recommended actions
 * 
 * @param {Array} buses - Array of all buses
 * @returns {String} Load flow summary section
 */
function generateLoadFlowSummary(buses) {
    let report = `${'-'.repeat(100)}
2.2.5 LOAD FLOW SUMMARY - Top 3 Issues & Recommended Actions
${'-'.repeat(100)}

`;

    // Collect all issues
    const issues = [];

    // Check for overloaded transformers
    const transformers = (typeof components !== 'undefined' && Array.isArray(components)) 
        ? components.filter(c => c.type === 'transformer') 
        : [];

    transformers.forEach(xfmr => {
        const rating = xfmr.rating || xfmr.kva || 1000;
        const toBus = buses.find(b => b.id === xfmr.toBus || b.name === xfmr.toBusName);
        const loadKVA = toBus?.results?.loadFlow?.summary?.totalKVA || 0;
        const loadingPercent = (loadKVA / rating) * 100;

        if (loadingPercent > 100) {
            const tag = xfmr.tag || xfmr.name || xfmr.id;
            issues.push({
                priority: loadingPercent > 150 ? 1 : loadingPercent > 120 ? 2 : 3,
                severity: loadingPercent > 150 ? 'CRITICAL' : loadingPercent > 120 ? 'HIGH' : 'MODERATE',
                description: `Transformer ${tag} overloaded at ${loadingPercent.toFixed(1)}%`,
                action: loadingPercent > 150 
                    ? 'Emergency replacement required immediately'
                    : loadingPercent > 120 
                    ? 'Upgrade or rebalance within 30 days'
                    : 'Monitor and plan upgrade or accept with reduced life'
            });
        }
    });

    // Check for high voltage drop
    buses.forEach(bus => {
        const vdPercent = bus.results?.loadFlow?.voltageDrop?.designPercent || 
                         bus.results?.voltageDrop?.cumulativeDropPercent || 0;
        if (vdPercent > 7) {
            issues.push({
                priority: vdPercent > 10 ? 1 : 2,
                severity: vdPercent > 10 ? 'CRITICAL' : 'HIGH',
                description: `Bus ${bus.name} has ${vdPercent.toFixed(2)}% voltage drop (exceeds IEEE 141 7% limit)`,
                action: 'Increase conductor size or reduce load to meet compliance'
            });
        }
    });

    // Check for load imbalance
    const voltageGroups = {};
    buses.forEach(bus => {
        if (!bus.results) return;
        const voltage = bus.voltage;
        if (!voltageGroups[voltage]) {
            voltageGroups[voltage] = [];
        }
        voltageGroups[voltage].push(bus);
    });

    Object.keys(voltageGroups).forEach(voltage => {
        const busesAtVoltage = voltageGroups[voltage];
        if (busesAtVoltage.length >= 2) {
            const loads = busesAtVoltage.map(b => b.results?.loadFlow?.summary?.totalCurrent || 0);
            const avgLoad = loads.reduce((sum, l) => sum + l, 0) / loads.length;
            const maxLoad = Math.max(...loads);
            const minLoad = Math.min(...loads);
            const imbalance = avgLoad > 0 ? ((maxLoad - minLoad) / avgLoad) * 100 : 0;

            if (imbalance > 20) {
                issues.push({
                    priority: 3,
                    severity: 'MODERATE',
                    description: `Load imbalance ${imbalance.toFixed(1)}% at ${voltage}V level`,
                    action: 'Rebalance loads across parallel feeders for better utilization'
                });
            }
        }
    });

    // Sort by priority and take top 3
    issues.sort((a, b) => a.priority - b.priority);
    const top3Issues = issues.slice(0, 3);

    if (top3Issues.length === 0) {
        report += '✅ NO CRITICAL ISSUES DETECTED\n\n';
        report += 'Load flow analysis shows system operating within acceptable parameters:\n';
        report += '  • All transformers loaded below 100% capacity\n';
        report += '  • Voltage drops within IEEE 141 limits (< 7%)\n';
        report += '  • Load balance acceptable across parallel feeders\n';
        report += '\nRecommendation: Continue regular monitoring and maintenance.\n';
    } else {
        report += `DETECTED ${issues.length} ISSUE(S) - Showing Top 3:\n\n`;
        
        top3Issues.forEach((issue, index) => {
            report += `${index + 1}. [${issue.severity}] ${issue.description}\n`;
            report += `   → Action: ${issue.action}\n\n`;
        });

        if (issues.length > 3) {
            report += `Note: ${issues.length - 3} additional issue(s) detected. See detailed sections above.\n`;
        }
    }

    report += `\n`;

    return report;
}

console.log('✅ Load Flow Analysis Module loaded successfully');

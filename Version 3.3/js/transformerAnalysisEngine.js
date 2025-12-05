/**
 * Transformer Analysis Engine Module
 * Severity-based transformer overload classification and cost estimation
 * 
 * @author bfforex
 * @date 2025-12-05
 * @version 3.4.0
 * 
 * Features:
 * - Classify transformer overload by severity (CRITICAL/HIGH/MODERATE/MINOR)
 * - Calculate severity-based replacement/upgrade costs
 * - Equipment cost: $60-80/kVA
 * - Installation cost: $15K-45K (severity-dependent)
 * - Switchgear cost: $10K-20K
 * - De-duplicate recommendations (single entry per transformer)
 * 
 * Standards Compliance:
 * - IEEE C57.12.00 - Transformer loading standards
 * - IEEE C57.91 - Loading guide for mineral-oil-immersed transformers
 */

console.log('🔧 Loading Transformer Analysis Engine v3.4.0...');

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const TRANSFORMER_ANALYSIS_CONFIG = {
    // Severity thresholds (loading %)
    SEVERITY_THRESHOLDS: {
        CRITICAL: 150,      // > 150%
        HIGH: 120,          // 120-150%
        MODERATE: 110,      // 110-120%
        MINOR: 100          // 100-110%
    },
    
    // Cost parameters
    COSTS: {
        EQUIPMENT_PER_KVA_MIN: 60,      // $/kVA minimum
        EQUIPMENT_PER_KVA_MAX: 80,      // $/kVA maximum
        INSTALLATION: {
            CRITICAL: { min: 35000, max: 45000 },    // Emergency replacement
            HIGH: { min: 20000, max: 30000 },        // Urgent upgrade
            MODERATE: { min: 15000, max: 20000 },    // Planned upgrade
            MINOR: { min: 15000, max: 20000 }        // Standard installation
        },
        SWITCHGEAR: {
            min: 10000,
            max: 20000
        },
        REBALANCING: {
            MODERATE: { min: 3000, max: 5000 },      // Minor rebalancing
            MINOR: { min: 3000, max: 5000 }          // Minor rebalancing
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFORMER OVERLOAD CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Classify transformer overload severity
 * 
 * @param {Object} transformer - Transformer component object
 * @param {Object} toBus - Downstream bus with load data
 * @returns {Object} Classification with severity, loading%, and cost estimate
 */
function classifyTransformerOverload(transformer, toBus) {
    const rating = transformer.rating || transformer.kva || 1000;
    const loadKVA = toBus?.results?.loadFlow?.summary?.totalKVA || 0;
    const loadingPercent = (loadKVA / rating) * 100;
    const tag = transformer.tag || transformer.name || transformer.id;

    // Determine severity
    let severity = 'NORMAL';
    let severityLevel = 0;
    const thresholds = TRANSFORMER_ANALYSIS_CONFIG.SEVERITY_THRESHOLDS;

    if (loadingPercent > thresholds.CRITICAL) {
        severity = 'CRITICAL';
        severityLevel = 4;
    } else if (loadingPercent > thresholds.HIGH) {
        severity = 'HIGH';
        severityLevel = 3;
    } else if (loadingPercent > thresholds.MODERATE) {
        severity = 'MODERATE';
        severityLevel = 2;
    } else if (loadingPercent > thresholds.MINOR) {
        severity = 'MINOR';
        severityLevel = 1;
    }

    // Calculate costs
    const costs = calculateTransformerCosts(rating, loadKVA, severity);

    return {
        tag,
        transformer,
        toBus,
        rating,
        loadKVA,
        loadingPercent,
        severity,
        severityLevel,
        costs,
        isOverloaded: loadingPercent > 100,
        requiresAction: severityLevel > 0
    };
}

/**
 * Calculate transformer replacement/upgrade costs based on severity
 * 
 * @param {Number} rating - Transformer rating in kVA
 * @param {Number} loadKVA - Current load in kVA
 * @param {String} severity - Severity classification
 * @returns {Object} Cost breakdown
 */
function calculateTransformerCosts(rating, loadKVA, severity) {
    const config = TRANSFORMER_ANALYSIS_CONFIG.COSTS;
    
    // For overloaded transformers, size to accommodate load + 25% margin
    const requiredRating = loadKVA * 1.25;
    const upgradedRating = Math.max(rating, requiredRating);
    
    // Equipment cost
    const equipmentCostMin = upgradedRating * config.EQUIPMENT_PER_KVA_MIN;
    const equipmentCostMax = upgradedRating * config.EQUIPMENT_PER_KVA_MAX;
    
    // Installation cost (depends on severity - emergency vs planned)
    let installationCostMin, installationCostMax;
    
    if (severity === 'CRITICAL') {
        installationCostMin = config.INSTALLATION.CRITICAL.min;
        installationCostMax = config.INSTALLATION.CRITICAL.max;
    } else if (severity === 'HIGH') {
        installationCostMin = config.INSTALLATION.HIGH.min;
        installationCostMax = config.INSTALLATION.HIGH.max;
    } else if (severity === 'MODERATE') {
        installationCostMin = config.INSTALLATION.MODERATE.min;
        installationCostMax = config.INSTALLATION.MODERATE.max;
    } else {
        installationCostMin = config.INSTALLATION.MINOR.min;
        installationCostMax = config.INSTALLATION.MINOR.max;
    }
    
    // Switchgear cost
    const switchgearCostMin = config.SWITCHGEAR.min;
    const switchgearCostMax = config.SWITCHGEAR.max;
    
    // Total replacement cost
    const totalReplacementMin = equipmentCostMin + installationCostMin + switchgearCostMin;
    const totalReplacementMax = equipmentCostMax + installationCostMax + switchgearCostMax;
    
    // Rebalancing option (for MODERATE and MINOR only)
    let rebalancingCostMin = 0;
    let rebalancingCostMax = 0;
    let hasRebalancingOption = false;
    
    if (severity === 'MODERATE' || severity === 'MINOR') {
        rebalancingCostMin = config.REBALANCING[severity].min;
        rebalancingCostMax = config.REBALANCING[severity].max;
        hasRebalancingOption = true;
    }
    
    return {
        requiredRating: Math.ceil(requiredRating),
        equipment: {
            min: Math.round(equipmentCostMin),
            max: Math.round(equipmentCostMax)
        },
        installation: {
            min: installationCostMin,
            max: installationCostMax
        },
        switchgear: {
            min: switchgearCostMin,
            max: switchgearCostMax
        },
        totalReplacement: {
            min: Math.round(totalReplacementMin),
            max: Math.round(totalReplacementMax)
        },
        rebalancing: hasRebalancingOption ? {
            min: rebalancingCostMin,
            max: rebalancingCostMax
        } : null,
        hasRebalancingOption
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFORMER ANALYSIS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyze all transformers in the system
 * Returns de-duplicated list (one entry per transformer)
 * 
 * @param {Array} buses - Array of all buses
 * @returns {Array} Array of transformer analyses, sorted by severity
 */
function analyzeAllTransformers(buses) {
    const transformers = (typeof components !== 'undefined' && Array.isArray(components)) 
        ? components.filter(c => c.type === 'transformer') 
        : [];

    if (transformers.length === 0) {
        return [];
    }

    // Analyze each transformer
    const analyses = transformers.map(xfmr => {
        const toBus = buses.find(b => b.id === xfmr.toBus || b.name === xfmr.toBusName);
        return classifyTransformerOverload(xfmr, toBus);
    });

    // Sort by severity level (descending) then by loading percent (descending)
    analyses.sort((a, b) => {
        if (b.severityLevel !== a.severityLevel) {
            return b.severityLevel - a.severityLevel;
        }
        return b.loadingPercent - a.loadingPercent;
    });

    return analyses;
}

/**
 * Generate transformer analysis report section
 * 
 * @param {Array} buses - Array of all buses
 * @returns {String} Transformer analysis report
 */
function generateTransformerAnalysisReport(buses) {
    let report = `${'='.repeat(100)}
TRANSFORMER LOADING & COST ANALYSIS
${'='.repeat(100)}

`;

    const analyses = analyzeAllTransformers(buses);

    if (analyses.length === 0) {
        report += 'No transformers found in system.\n\n';
        return report;
    }

    const overloadedCount = analyses.filter(a => a.isOverloaded).length;
    const criticalCount = analyses.filter(a => a.severity === 'CRITICAL').length;
    const highCount = analyses.filter(a => a.severity === 'HIGH').length;
    const moderateCount = analyses.filter(a => a.severity === 'MODERATE').length;
    const minorCount = analyses.filter(a => a.severity === 'MINOR').length;

    report += `Total Transformers: ${analyses.length}\n`;
    report += `Overloaded: ${overloadedCount} (${((overloadedCount / analyses.length) * 100).toFixed(1)}%)\n`;
    report += `  • CRITICAL (>150%): ${criticalCount}\n`;
    report += `  • HIGH (120-150%): ${highCount}\n`;
    report += `  • MODERATE (110-120%): ${moderateCount}\n`;
    report += `  • MINOR (100-110%): ${minorCount}\n`;
    report += `\n`;

    // Detail each overloaded transformer
    const overloadedAnalyses = analyses.filter(a => a.isOverloaded);
    
    if (overloadedAnalyses.length > 0) {
        report += `OVERLOADED TRANSFORMER DETAILS:\n`;
        report += `${'-'.repeat(100)}\n`;

        overloadedAnalyses.forEach((analysis, index) => {
            const icon = analysis.severity === 'CRITICAL' ? '🔴' : 
                        analysis.severity === 'HIGH' ? '🟠' : 
                        analysis.severity === 'MODERATE' ? '🟡' : '🔵';

            report += `\n${index + 1}. ${icon} ${analysis.tag} - ${analysis.severity} OVERLOAD\n`;
            report += `   Current: ${analysis.loadKVA.toFixed(2)} kVA loading on ${analysis.rating} kVA transformer\n`;
            report += `   Loading: ${analysis.loadingPercent.toFixed(1)}% (${(analysis.loadingPercent - 100).toFixed(1)}% over capacity)\n`;
            report += `\n`;
            report += `   COST ANALYSIS:\n`;
            report += `   ─────────────────────────────────────────────────────────────────\n`;
            
            // Option 1: Replacement/Upgrade
            report += `   Option 1: Replacement/Upgrade to ${analysis.costs.requiredRating} kVA\n`;
            report += `     • Equipment: $${(analysis.costs.equipment.min/1000).toFixed(0)}K-$${(analysis.costs.equipment.max/1000).toFixed(0)}K (${analysis.costs.requiredRating} kVA × $${TRANSFORMER_ANALYSIS_CONFIG.COSTS.EQUIPMENT_PER_KVA_MIN}-${TRANSFORMER_ANALYSIS_CONFIG.COSTS.EQUIPMENT_PER_KVA_MAX}/kVA)\n`;
            report += `     • Installation: $${(analysis.costs.installation.min/1000).toFixed(0)}K-$${(analysis.costs.installation.max/1000).toFixed(0)}K`;
            
            if (analysis.severity === 'CRITICAL') {
                report += ` (emergency)\n`;
            } else if (analysis.severity === 'HIGH') {
                report += ` (urgent)\n`;
            } else {
                report += ` (standard)\n`;
            }
            
            report += `     • Switchgear: $${(analysis.costs.switchgear.min/1000).toFixed(0)}K-$${(analysis.costs.switchgear.max/1000).toFixed(0)}K\n`;
            report += `     • TOTAL: $${(analysis.costs.totalReplacement.min/1000).toFixed(0)}K-$${(analysis.costs.totalReplacement.max/1000).toFixed(0)}K\n`;
            
            // Option 2: Rebalancing (if available)
            if (analysis.costs.hasRebalancingOption) {
                report += `\n`;
                report += `   Option 2: Load Rebalancing\n`;
                report += `     • Cost: $${(analysis.costs.rebalancing.min/1000).toFixed(0)}K-$${(analysis.costs.rebalancing.max/1000).toFixed(0)}K\n`;
                report += `     • Move loads to other transformers or circuits\n`;
                report += `     • Requires load analysis and circuit modifications\n`;
                
                if (analysis.severity === 'MODERATE') {
                    report += `\n   Option 3: Accept As-Is (Monitor)\n`;
                    report += `     • Cost: $0 (accept reduced transformer life)\n`;
                    report += `     • Monitor temperature and loading regularly\n`;
                    report += `     • Plan replacement in 2-3 years\n`;
                }
            }
            
            report += `\n`;
            report += `   RECOMMENDED ACTION:\n`;
            
            if (analysis.severity === 'CRITICAL') {
                report += `   ⚠️ EMERGENCY: Replace immediately (within 7 days)\n`;
                report += `   Risk: Transformer failure, fire hazard, extended outage\n`;
            } else if (analysis.severity === 'HIGH') {
                report += `   ⚠️ URGENT: Upgrade or rebalance within 30 days\n`;
                report += `   Risk: Accelerated aging, potential failure under peak load\n`;
            } else if (analysis.severity === 'MODERATE') {
                report += `   ⚠️ PLAN: Rebalance loads or accept with monitoring\n`;
                report += `   Risk: Reduced transformer life, monitor for degradation\n`;
            } else {
                report += `   ℹ️ MINOR: Rebalance recommended or accept with monitoring\n`;
                report += `   Risk: Minimal, acceptable for short-term operation\n`;
            }
            
            report += `\n`;
        });
    } else {
        report += `✅ All transformers operating within capacity (<100% loading)\n\n`;
    }

    // Summary of total costs
    if (overloadedCount > 0) {
        const totalMinCost = overloadedAnalyses.reduce((sum, a) => {
            // Use rebalancing cost if available and cheaper, otherwise replacement
            if (a.costs.hasRebalancingOption) {
                return sum + Math.min(a.costs.rebalancing.min, a.costs.totalReplacement.min);
            }
            return sum + a.costs.totalReplacement.min;
        }, 0);
        
        const totalMaxCost = overloadedAnalyses.reduce((sum, a) => {
            return sum + a.costs.totalReplacement.max;
        }, 0);

        report += `${'-'.repeat(100)}\n`;
        report += `ESTIMATED TOTAL REMEDIATION COST:\n`;
        report += `  Minimum (with rebalancing where possible): $${(totalMinCost/1000).toFixed(0)}K\n`;
        report += `  Maximum (all replacements): $${(totalMaxCost/1000).toFixed(0)}K\n`;
        report += `\n`;
    }

    return report;
}

console.log('✅ Transformer Analysis Engine loaded successfully');

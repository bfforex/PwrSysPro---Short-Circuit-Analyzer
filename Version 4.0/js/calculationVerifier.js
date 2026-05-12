/**
 * Calculation Verifier Module
 * Cross-calculation consistency checking
 * 
 * @author bfforex
 * @date 2025-12-01
 * @version 1.0.0
 * 
 * Issue 6: LOW - Discrepancy Verification System
 * 
 * PURPOSE:
 * - Verify that same parameters show same values across outputs
 * - Automated verification of calculation consistency
 * - Add discrepancy warnings to exported reports
 * - Configurable tolerance threshold
 */

console.log('🔧 Loading Calculation Verifier Module v1.0.0...');

/**
 * Calculation Verifier Class
 * Checks for discrepancies between calculations
 */
class CalculationVerifier {
    /**
     * Create a new CalculationVerifier
     * 
     * @param {Number} tolerancePercent - Tolerance for discrepancies (default: 1.0%)
     */
    constructor(tolerancePercent = 1.0) {
        this.tolerance = tolerancePercent / 100;
        this.results = new Map();
        this.warnings = [];
    }
    
    /**
     * Store a parameter value from a source
     * 
     * @param {String} parameter - Parameter name (e.g., 'fault_current', 'voltage_drop')
     * @param {Number} value - Parameter value
     * @param {String} source - Source of the value (e.g., 'shortCircuit', 'loadFlow')
     */
    store(parameter, value, source) {
        if (!this.results.has(parameter)) {
            this.results.set(parameter, []);
        }
        
        this.results.get(parameter).push({
            value: Number(value),
            source: source,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Verify consistency for a specific parameter
     * 
     * @param {String} parameter - Parameter name
     * @returns {Object} Verification result
     */
    verify(parameter) {
        const entries = this.results.get(parameter);
        
        if (!entries || entries.length < 2) {
            return { 
                consistent: true, 
                entries: entries || [],
                message: 'Not enough data points for comparison'
            };
        }
        
        const reference = entries[0].value;
        const discrepancies = [];
        
        for (let i = 1; i < entries.length; i++) {
            if (reference === 0 && entries[i].value === 0) {
                continue; // Both zero, no discrepancy
            }
            
            let deviation;
            if (reference === 0) {
                deviation = Math.abs(entries[i].value); // Can't calculate percentage
            } else {
                deviation = Math.abs(entries[i].value - reference) / Math.abs(reference);
            }
            
            if (deviation > this.tolerance) {
                discrepancies.push({
                    source: entries[i].source,
                    value: entries[i].value,
                    referenceValue: reference,
                    referenceSource: entries[0].source,
                    deviation: (deviation * 100).toFixed(2) + '%',
                    timestamp: entries[i].timestamp
                });
            }
        }
        
        return {
            consistent: discrepancies.length === 0,
            reference: { value: reference, source: entries[0].source },
            discrepancies: discrepancies,
            entries: entries,
            tolerance: (this.tolerance * 100).toFixed(2) + '%'
        };
    }
    
    /**
     * Verify all stored parameters
     * 
     * @returns {Object} All verification results
     */
    verifyAll() {
        const results = {};
        
        for (const [param, _] of this.results) {
            results[param] = this.verify(param);
        }
        
        return results;
    }
    
    /**
     * Generate warnings for all discrepancies
     * 
     * @returns {Array} Array of warning objects
     */
    generateWarnings() {
        const warnings = [];
        
        for (const [param, _] of this.results) {
            const check = this.verify(param);
            if (!check.consistent) {
                warnings.push({
                    parameter: param,
                    message: `${param} shows ${check.discrepancies.length} discrepancy(ies)`,
                    severity: check.discrepancies.some(d => parseFloat(d.deviation) > 5) ? 'HIGH' : 'MEDIUM',
                    details: check,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        this.warnings = warnings;
        return warnings;
    }
    
    /**
     * Get warnings as formatted text for reports
     * 
     * @returns {String} Formatted warning text
     */
    getWarningsText() {
        const warnings = this.generateWarnings();
        
        if (warnings.length === 0) {
            return '✓ No discrepancies detected between calculations.\n';
        }
        
        let text = '⚠️ CALCULATION DISCREPANCIES DETECTED\n';
        text += '─'.repeat(80) + '\n\n';
        text += `Tolerance threshold: ${(this.tolerance * 100).toFixed(2)}%\n\n`;
        
        warnings.forEach((warning, index) => {
            text += `${index + 1}. ${warning.parameter}\n`;
            text += `   Severity: ${warning.severity}\n`;
            text += `   Reference: ${warning.details.reference.value.toFixed(4)} (from ${warning.details.reference.source})\n`;
            
            warning.details.discrepancies.forEach(disc => {
                text += `   Discrepancy: ${disc.value.toFixed(4)} (from ${disc.source}) - ${disc.deviation} deviation\n`;
            });
            text += '\n';
        });
        
        text += 'NOTE: Discrepancies may indicate calculation errors or different assumptions.\n';
        text += 'Review the source calculations to ensure consistency.\n';
        
        return text;
    }
    
    /**
     * Clear all stored results
     */
    clear() {
        this.results.clear();
        this.warnings = [];
    }
    
    /**
     * Clear results for a specific parameter
     * 
     * @param {String} parameter - Parameter name
     */
    clearParameter(parameter) {
        this.results.delete(parameter);
    }
    
    /**
     * Set tolerance threshold
     * 
     * @param {Number} tolerancePercent - Tolerance as percentage (e.g., 1.0 for 1%)
     */
    setTolerance(tolerancePercent) {
        this.tolerance = tolerancePercent / 100;
    }
    
    /**
     * Get tolerance threshold
     * 
     * @returns {Number} Tolerance as decimal
     */
    getTolerance() {
        return this.tolerance;
    }
    
    /**
     * Check if any discrepancies exist
     * 
     * @returns {Boolean} True if any discrepancies found
     */
    hasDiscrepancies() {
        for (const [param, _] of this.results) {
            const check = this.verify(param);
            if (!check.consistent) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get summary of all parameters and their consistency status
     * 
     * @returns {Object} Summary object
     */
    getSummary() {
        const summary = {
            parameterCount: this.results.size,
            consistentCount: 0,
            discrepancyCount: 0,
            parameters: {},
            tolerance: (this.tolerance * 100).toFixed(2) + '%'
        };
        
        for (const [param, _] of this.results) {
            const check = this.verify(param);
            summary.parameters[param] = {
                consistent: check.consistent,
                entryCount: check.entries.length,
                discrepancyCount: check.discrepancies ? check.discrepancies.length : 0
            };
            
            if (check.consistent) {
                summary.consistentCount++;
            } else {
                summary.discrepancyCount++;
            }
        }
        
        return summary;
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.CalculationVerifier = CalculationVerifier;
    window.calculationVerifier = new CalculationVerifier(1.0); // 1% default tolerance
}

console.log('✅ Calculation Verifier Module loaded');
console.log('   - Default tolerance: 1.0%');
console.log('   - Store parameter values from different sources');
console.log('   - Verify consistency across calculations');
console.log('   - Generate warnings for discrepancies');

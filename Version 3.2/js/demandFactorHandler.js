/**
 * Demand Factor Handler Module
 * Unified demand factor management per NEC 2023 and IEEE 141-1993
 * 
 * @author bfforex
 * @date 2025-12-01
 * @version 1.0.0
 * 
 * Issue 2: HIGH - Demand Factor Inconsistency
 * 
 * PURPOSE:
 * - Centralized demand factor management
 * - Clear rules for which calculations allow demand factors
 * - Short Circuit and Arc Flash NEVER use demand factors
 * - Reports clearly state demand factor source
 * 
 * STANDARDS:
 * - NEC 2023 (NFPA 70) - Articles 210, 215, 220, 430
 * - IEEE 141-1993 (Red Book) - Section 3.4 Voltage Drop
 * - IEEE 242-2001 (Buff Book) - Protection Coordination
 * - IEEE 1584-2018 - Arc Flash Calculations
 */

console.log('🔧 Loading Demand Factor Handler Module v1.0.0...');

/**
 * Demand Factor Handler - Unified demand factor management
 */
const DemandFactorHandler = {
    config: {
        // User-specified demand factors per bus
        userDemandFactors: {},
        
        // IEEE 141-1993 default
        ieeeDefault: 0.85,
        
        // Rules for which calculations allow demand factors
        // CRITICAL: Short Circuit and Arc Flash NEVER use demand factors
        allowedCalculations: {
            loadFlow: true,              // Operating load analysis
            voltageDropOperating: true,  // Operating voltage drop
            voltageDropDesign: false,    // Design: Always 100% FLC
            shortCircuit: false,         // NEVER use demand - per IEEE 141
            arcFlash: false,             // NEVER use demand - per IEEE 1584
            cableSizing: false,          // Conservative - 100% FLC per NEC
            equipmentRating: false,      // Conservative - 100% FLC
            transformerLoading: true     // Operating load
        }
    },
    
    /**
     * Set user-specified demand factor for a bus
     * 
     * @param {String} busId - Bus identifier
     * @param {Number} factor - Demand factor (0.0 to 1.0)
     */
    setUserFactor: function(busId, factor) {
        if (factor < 0 || factor > 1) {
            console.warn(`[DemandFactorHandler] Invalid factor ${factor} for bus ${busId}. Must be 0.0-1.0`);
            return;
        }
        this.config.userDemandFactors[busId] = factor;
        console.log(`[DemandFactorHandler] Set demand factor for bus ${busId}: ${(factor * 100).toFixed(1)}%`);
    },
    
    /**
     * Get user-specified demand factor for a bus
     * 
     * @param {String} busId - Bus identifier
     * @returns {Number|null} User-specified factor or null if not set
     */
    getUserFactor: function(busId) {
        return this.config.userDemandFactors[busId] || null;
    },
    
    /**
     * Clear user-specified demand factor for a bus
     * 
     * @param {String} busId - Bus identifier
     */
    clearUserFactor: function(busId) {
        delete this.config.userDemandFactors[busId];
        console.log(`[DemandFactorHandler] Cleared demand factor for bus ${busId}`);
    },
    
    /**
     * Get demand factor for a specific calculation type
     * CRITICAL: Returns 1.0 for protected calculations (short circuit, arc flash)
     * 
     * @param {String} calculationType - Type of calculation
     * @param {String} busId - Bus identifier (optional)
     * @returns {Number} Demand factor (0.0 to 1.0, or 1.0 for protected calculations)
     */
    getFactorFor: function(calculationType, busId) {
        // CRITICAL: Protected calculations ALWAYS return 1.0 (100% FLC)
        if (!this.config.allowedCalculations[calculationType]) {
            console.log(`[DemandFactorHandler] ${calculationType}: Using 100% FLC (protected calculation)`);
            return 1.0;
        }
        
        // Check for user-specified factor
        if (busId && this.config.userDemandFactors[busId]) {
            const userFactor = this.config.userDemandFactors[busId];
            console.log(`[DemandFactorHandler] ${calculationType}: Using user-specified ${(userFactor * 100).toFixed(1)}%`);
            return userFactor;
        }
        
        // Fall back to IEEE default
        console.log(`[DemandFactorHandler] ${calculationType}: Using IEEE default ${(this.config.ieeeDefault * 100).toFixed(1)}%`);
        return this.config.ieeeDefault;
    },
    
    /**
     * Check if demand factors are allowed for a calculation type
     * 
     * @param {String} calculationType - Type of calculation
     * @returns {Boolean} True if demand factors are allowed
     */
    isAllowed: function(calculationType) {
        return this.config.allowedCalculations[calculationType] === true;
    },
    
    /**
     * Get source description for demand factor (for reports)
     * 
     * @param {String} calculationType - Type of calculation
     * @param {String} busId - Bus identifier (optional)
     * @returns {String} Human-readable description of demand factor source
     */
    getSourceDescription: function(calculationType, busId) {
        // Protected calculations
        if (!this.isAllowed(calculationType)) {
            return 'Full Load Current (100%) - Per NEC/IEEE Standards';
        }
        
        // User-specified factor
        if (busId && this.config.userDemandFactors[busId]) {
            const factor = this.config.userDemandFactors[busId];
            return `User Input (${(factor * 100).toFixed(1)}%)`;
        }
        
        // IEEE default
        return `IEEE 141-1993 Default (${(this.config.ieeeDefault * 100).toFixed(1)}%)`;
    },
    
    /**
     * Get detailed explanation for why demand factor is/isn't applied
     * 
     * @param {String} calculationType - Type of calculation
     * @returns {String} Detailed explanation
     */
    getExplanation: function(calculationType) {
        const explanations = {
            loadFlow: 'Load flow analysis uses demand factors to represent actual operating conditions.',
            voltageDropOperating: 'Operating voltage drop uses demand factors for realistic operating analysis.',
            voltageDropDesign: 'Design voltage drop uses 100% FLC for conservative cable sizing per NEC.',
            shortCircuit: 'Short circuit analysis NEVER uses demand factors. Per IEEE 141-1993 Section 5.2, fault calculations must use maximum available current for proper protection device coordination.',
            arcFlash: 'Arc flash analysis NEVER uses demand factors. Per IEEE 1584-2018, incident energy calculations must use bolted fault current for accurate hazard assessment.',
            cableSizing: 'Cable sizing uses 100% FLC for conservative design per NEC Article 310.',
            equipmentRating: 'Equipment rating uses 100% FLC for conservative sizing.',
            transformerLoading: 'Transformer loading analysis uses demand factors for actual operating conditions.'
        };
        
        return explanations[calculationType] || 'No specific guidance available.';
    },
    
    /**
     * Get all calculation types and their demand factor rules
     * 
     * @returns {Object} Object mapping calculation types to their rules
     */
    getRules: function() {
        const rules = {};
        for (const calcType in this.config.allowedCalculations) {
            rules[calcType] = {
                allowed: this.config.allowedCalculations[calcType],
                factor: this.getFactorFor(calcType),
                description: this.getSourceDescription(calcType),
                explanation: this.getExplanation(calcType)
            };
        }
        return rules;
    }
};

// Export to global scope
if (typeof window !== 'undefined') {
    window.DemandFactorHandler = DemandFactorHandler;
}

console.log('✅ Demand Factor Handler Module loaded');
console.log('   - Short Circuit: NEVER uses demand factors (100% FLC)');
console.log('   - Arc Flash: NEVER uses demand factors (100% FLC)');
console.log('   - Load Flow: Uses demand factors (configurable)');
console.log('   - Voltage Drop Design: 100% FLC (conservative)');
console.log('   - Cable Sizing: 100% FLC per NEC');
console.log('   - IEEE 141-1993 Default: 85%');

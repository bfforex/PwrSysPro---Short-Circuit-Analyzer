/**
 * Calculation State Module
 * Centralized state management for calculation results
 * 
 * @author bfforex
 * @date 2025-12-01
 * @version 1.0.0
 * 
 * Issue 4: MEDIUM - Export Content Does Not Match Display
 * 
 * PURPOSE:
 * - Single source of truth for calculation results
 * - Ensures display and export use the same data
 * - Provides verification mechanism to confirm data integrity
 * 
 * USAGE:
 * 1. After calculation, store results: CalculationState.store('shortCircuit', results, busId)
 * 2. For display: const data = CalculationState.get('shortCircuit')
 * 3. For export: const data = CalculationState.get('shortCircuit') // SAME function
 * 4. Verify integrity: CalculationState.verify('shortCircuit', previousHash)
 */

console.log('🔧 Loading Calculation State Module v1.0.0...');

/**
 * Calculation State - Centralized state management
 */
const CalculationState = {
    // Calculation results storage
    results: {
        shortCircuit: null,
        voltageDrop: null,
        loadFlow: null,
        arcFlash: null,
        demandDiversity: null
    },
    
    // Metadata for tracking
    metadata: {
        lastCalculation: null,
        timestamp: null,
        busId: null,
        hash: null
    },
    
    /**
     * Store calculation results
     * Creates a deep copy to prevent external modification
     * 
     * @param {String} type - Calculation type ('shortCircuit', 'voltageDrop', etc.)
     * @param {Object} data - Calculation results
     * @param {String} busId - Bus identifier
     */
    store: function(type, data, busId) {
        if (!this.results.hasOwnProperty(type)) {
            console.warn(`[CalculationState] Unknown calculation type: ${type}`);
            return;
        }
        
        // Deep copy to prevent external modification
        this.results[type] = JSON.parse(JSON.stringify(data));
        
        // Update metadata
        this.metadata.lastCalculation = type;
        this.metadata.timestamp = new Date().toISOString();
        this.metadata.busId = busId;
        this.metadata.hash = this.generateHash(data);
        
        console.log(`[CalculationState] Stored ${type} results for bus ${busId}`);
        console.log(`   Hash: ${this.metadata.hash}`);
        console.log(`   Timestamp: ${this.metadata.timestamp}`);
    },
    
    /**
     * Get calculation results
     * SAME function used by both display AND export
     * 
     * @param {String} type - Calculation type
     * @returns {Object|null} Calculation results or null if not available
     */
    get: function(type) {
        if (!this.results.hasOwnProperty(type)) {
            console.warn(`[CalculationState] Unknown calculation type: ${type}`);
            return null;
        }
        
        if (!this.results[type]) {
            console.warn(`[CalculationState] No results available for: ${type}`);
            return null;
        }
        
        // Return deep copy to prevent external modification
        return JSON.parse(JSON.stringify(this.results[type]));
    },
    
    /**
     * Check if results exist for a calculation type
     * 
     * @param {String} type - Calculation type
     * @returns {Boolean} True if results exist
     */
    has: function(type) {
        return this.results[type] !== null;
    },
    
    /**
     * Generate hash for data integrity verification
     * Simple hash function for comparison purposes
     * 
     * @param {Object} data - Data to hash
     * @returns {String} Hash string
     */
    generateHash: function(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    },
    
    /**
     * Verify data integrity by comparing hashes
     * 
     * @param {String} type - Calculation type
     * @param {String} expectedHash - Hash to compare against
     * @returns {Boolean} True if hashes match
     */
    verify: function(type, expectedHash) {
        if (!this.results[type]) {
            return false;
        }
        
        const currentHash = this.generateHash(this.results[type]);
        const matches = currentHash === expectedHash;
        
        if (!matches) {
            console.warn(`[CalculationState] Hash mismatch for ${type}`);
            console.warn(`   Expected: ${expectedHash}`);
            console.warn(`   Current: ${currentHash}`);
        }
        
        return matches;
    },
    
    /**
     * Get current hash for a calculation type
     * 
     * @param {String} type - Calculation type
     * @returns {String|null} Current hash or null
     */
    getHash: function(type) {
        if (!this.results[type]) {
            return null;
        }
        return this.generateHash(this.results[type]);
    },
    
    /**
     * Get metadata for the last calculation
     * 
     * @returns {Object} Metadata object
     */
    getMetadata: function() {
        return {
            ...this.metadata
        };
    },
    
    /**
     * Clear results for a specific calculation type
     * 
     * @param {String} type - Calculation type
     */
    clear: function(type) {
        if (this.results.hasOwnProperty(type)) {
            this.results[type] = null;
            console.log(`[CalculationState] Cleared ${type} results`);
        }
    },
    
    /**
     * Clear all calculation results
     */
    clearAll: function() {
        for (const type in this.results) {
            this.results[type] = null;
        }
        this.metadata = {
            lastCalculation: null,
            timestamp: null,
            busId: null,
            hash: null
        };
        console.log('[CalculationState] Cleared all results');
    },
    
    /**
     * Get summary of all stored calculations
     * 
     * @returns {Object} Summary object
     */
    getSummary: function() {
        const summary = {};
        for (const type in this.results) {
            summary[type] = {
                hasData: this.results[type] !== null,
                hash: this.results[type] ? this.generateHash(this.results[type]) : null
            };
        }
        summary.metadata = this.getMetadata();
        return summary;
    },
    
    /**
     * Store all calculation results for a bus
     * Convenience method for storing multiple result types at once
     * 
     * @param {String} busId - Bus identifier
     * @param {Object} allResults - Object containing all result types
     */
    storeAll: function(busId, allResults) {
        for (const type in allResults) {
            if (this.results.hasOwnProperty(type) && allResults[type]) {
                this.store(type, allResults[type], busId);
            }
        }
    },
    
    /**
     * Get all calculation results for export
     * Ensures consistency between display and export
     * 
     * @returns {Object} All stored results
     */
    getAll: function() {
        const all = {};
        for (const type in this.results) {
            if (this.results[type]) {
                all[type] = this.get(type);
            }
        }
        return all;
    }
};

// Export to global scope
if (typeof window !== 'undefined') {
    window.CalculationState = CalculationState;
}

console.log('✅ Calculation State Module loaded');
console.log('   - Centralized storage: shortCircuit, voltageDrop, loadFlow, arcFlash, demandDiversity');
console.log('   - Same data source for display and export');
console.log('   - Hash verification for data integrity');

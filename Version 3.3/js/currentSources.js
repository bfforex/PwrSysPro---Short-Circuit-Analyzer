/**
 * Current Sources Module
 * Defines and separates current types for different calculations
 *
 * @author bfforex
 * @date 2025-12-01
 * @version 1.0.0
 *
 * Issue 5: MEDIUM - Current Source Separation
 *
 * PURPOSE:
 * - Clear separation between current types
 * - Each calculation uses appropriate current source
 * - UI clearly labels current basis
 * - Transformer loading uses actual (not design) current
 * - Reports state current basis explicitly
 *
 * CURRENT TYPES AND STANDARDS BASIS:
 * - CONNECTED_LOAD: 100% FLC — NEC conductor ampacity sizing (Art. 310.15)
 * - DEMAND_LOAD: Demand-adjusted — NEC Article 220/430 demand factors
 * - DIVERSITY_LOAD: Demand + diversity — IEEE 141-1993 Table 3-5
 * - OPERATING_LOAD: Actual measured/estimated load flow
 * - FAULT_CURRENT: Short-circuit — IEEE 141-1993 Ch. 5 (NEVER demand-factored)
 *
 * STANDARDS:
 * - NEC 2017 Article 220 - Load calculations
 * - NEC 2017 Article 430 - Motor demand factors
 * - IEEE 141-1993 Table 3-5 - Diversity factors
 * - IEEE 141-1993 §5.1 - Short-circuit calculations always at 100% FLC
 */

console.log('🔧 Loading Current Sources Module v1.0.0...');

/**
 * Current Sources - Defines and manages current types
 */
const CurrentSources = {
    // Current type definitions
    types: {
        CONNECTED_LOAD: 'connected',      // 100% FLC - for sizing
        DEMAND_LOAD: 'demand',            // Demand-adjusted
        DIVERSITY_LOAD: 'diversity',      // Demand + diversity
        OPERATING_LOAD: 'operating',      // Actual load flow
        FAULT_CURRENT: 'fault'            // Short circuit
    },
    
    /**
     * Get the appropriate current value for a given calculation type
     *
     * Returns the correct current tier based on which type of analysis is being
     * performed, ensuring calculations never misuse demand/diversity-factored
     * currents for conservative sizing requirements.
     *
     * RULES (per IEEE 141-1993 and NEC 2017):
     * - Short Circuit: ALWAYS connected load (100% FLC) — never demand-factored
     * - Arc Flash:     ALWAYS connected load (100% FLC) — never demand-factored
     * - Conductor sizing: Connected load (100% FLC) per NEC Article 310.15
     * - Transformer loading: Diversity load (most realistic) per IEEE C57.12
     * - Voltage drop compliance: Connected load (100% FLC) per NEC 210.19/215.2
     * - Operating load flow: Diversity load for realistic operating analysis
     *
     * @param {string} busId           - Unique bus identifier
     * @param {string} calculationType - Type of analysis requesting the current:
     *   'shortCircuit' | 'arcFlash' | 'loadFlow' | 'voltageDropDesign' |
     *   'voltageDropOperating' | 'transformerLoading' | 'cableSizing'
     * @returns {{value: number, type: string, label: string, source: string}}
     *   Current value in amperes and metadata about the current source
     *
     * @reference IEEE 141-1993 §5.1 "Short-circuit calculations"
     * @reference NEC 2017 Articles 210.19, 215.2, 310.15
     */
    getCurrentFor: function(busId, calculationType) {
        const bus = typeof buses !== 'undefined' ? buses.find(b => b.id === busId) : null;
        
        if (!bus) {
            console.warn(`[CurrentSources] Bus ${busId} not found`);
            return {
                value: 0,
                type: this.types.CONNECTED_LOAD,
                label: 'Unknown',
                source: 'error'
            };
        }
        
        switch (calculationType) {
            case 'shortCircuit':
            case 'arcFlash':
                return this.getFaultCurrent(busId);
                
            case 'voltageDropDesign':
            case 'cableSizing':
            case 'equipmentRating':
                return this.getConnectedLoad(busId); // 100% FLC
                
            case 'voltageDropOperating':
            case 'loadFlow':
                return this.getOperatingLoad(busId);
                
            case 'transformerLoading':
                return this.getOperatingLoad(busId); // Actual load, not design
                
            default:
                console.warn(`[CurrentSources] Unknown calculation type: ${calculationType}, using connected load`);
                return this.getConnectedLoad(busId); // Conservative default
        }
    },
    
    /**
     * Get connected load (100% FLC)
     * Used for: cable sizing, design voltage drop, equipment ratings
     * 
     * @param {String} busId - Bus identifier
     * @returns {Object} Connected load current and metadata
     */
    getConnectedLoad: function(busId) {
        const bus = typeof buses !== 'undefined' ? buses.find(b => b.id === busId) : null;
        
        if (!bus) {
            return { value: 0, type: this.types.CONNECTED_LOAD, label: 'Connected Load (100% FLC)', source: 'error' };
        }
        
        // Try to get from load flow results
        let connectedCurrent = 0;
        
        if (bus.results && bus.results.loadFlow && bus.results.loadFlow.summary) {
            connectedCurrent = bus.results.loadFlow.summary.connectedCurrent || 
                              bus.results.loadFlow.summary.totalCurrent || 0;
        } else if (bus.loadCurrent) {
            connectedCurrent = parseFloat(bus.loadCurrent);
        } else if (typeof calculateDownstreamLoad === 'function') {
            connectedCurrent = calculateDownstreamLoad(busId);
        }
        
        return {
            value: connectedCurrent,
            type: this.types.CONNECTED_LOAD,
            label: 'Connected Load (100% FLC) - Conservative Design',
            source: 'connected_load'
        };
    },
    
    /**
     * Get operating load (demand/diversity-adjusted)
     * Used for: load flow, operating voltage drop, transformer loading
     * 
     * @param {String} busId - Bus identifier
     * @returns {Object} Operating load current and metadata
     */
    getOperatingLoad: function(busId) {
        const bus = typeof buses !== 'undefined' ? buses.find(b => b.id === busId) : null;
        
        if (!bus) {
            return { value: 0, type: this.types.OPERATING_LOAD, label: 'Operating Load (Demand-Adjusted)', source: 'error' };
        }
        
        let operatingCurrent = 0;
        let source = 'default';
        
        // Try to get diversified load first
        if (bus.results && bus.results.loadFlow && bus.results.loadFlow.demandSummary) {
            operatingCurrent = bus.results.loadFlow.demandSummary.diversityCurrent || 
                              bus.results.loadFlow.demandSummary.demandCurrent || 0;
            source = 'diversified_load';
        } else if (bus.results && bus.results.loadFlow && bus.results.loadFlow.summary) {
            operatingCurrent = bus.results.loadFlow.summary.totalCurrent || 0;
            source = 'load_flow';
        } else {
            // Try to calculate diversity load if function exists
            try {
                if (typeof calculateDownstreamLoadWithDiversity === 'function') {
                    const result = calculateDownstreamLoadWithDiversity(busId, { applyDiversity: true });
                    if (result && result.diversifiedLoad > 0) {
                        operatingCurrent = result.diversifiedLoad;
                        source = 'diversity_calc';
                    }
                }
            } catch (error) {
                console.warn(`[CurrentSources] Error calculating diversity load for bus ${busId}:`, error.message);
            }
        }
        
        return {
            value: operatingCurrent,
            type: this.types.OPERATING_LOAD,
            label: 'Operating Load (Demand-Adjusted)',
            source: source
        };
    },
    
    /**
     * Get fault current
     * Used for: short circuit, arc flash, protection sizing
     * 
     * @param {String} busId - Bus identifier
     * @returns {Object} Fault current and metadata
     */
    getFaultCurrent: function(busId) {
        const bus = typeof buses !== 'undefined' ? buses.find(b => b.id === busId) : null;
        
        if (!bus) {
            return { value: 0, type: this.types.FAULT_CURRENT, label: 'Fault Current (Short Circuit Analysis)', source: 'error' };
        }
        
        let faultCurrent = 0;
        let source = 'default';
        
        if (bus.results && bus.results.faultCurrents) {
            faultCurrent = bus.results.faultCurrents.threePhaseSym * 1000; // Convert kA to A
            source = 'short_circuit_calc';
        } else if (bus.results && bus.results.shortCircuit && bus.results.shortCircuit.faultCurrents) {
            faultCurrent = bus.results.shortCircuit.faultCurrents.threePhaseSym * 1000;
            source = 'short_circuit_calc';
        }
        
        return {
            value: faultCurrent,
            type: this.types.FAULT_CURRENT,
            label: 'Fault Current (Short Circuit Analysis)',
            source: source
        };
    },
    
    /**
     * Get human-readable label for a calculation type
     * 
     * @param {String} calculationType - Type of calculation
     * @returns {String} Human-readable label
     */
    getLabelFor: function(calculationType) {
        const labels = {
            shortCircuit: 'Fault Current (Short Circuit Analysis)',
            arcFlash: 'Bolted Fault Current (Arc Flash Analysis)',
            voltageDropDesign: 'Connected Load (100% FLC) - Conservative Design',
            voltageDropOperating: 'Operating Load (Demand-Adjusted)',
            loadFlow: 'Operating Load (Load Flow Analysis)',
            transformerLoading: 'Actual Operating Load',
            cableSizing: 'Connected Load (100% FLC) - Per NEC',
            equipmentRating: 'Connected Load (100% FLC) - Equipment Sizing'
        };
        return labels[calculationType] || 'Current';
    },
    
    /**
     * Get current type for a calculation
     * 
     * @param {String} calculationType - Type of calculation
     * @returns {String} Current type constant
     */
    getTypeFor: function(calculationType) {
        const typeMap = {
            shortCircuit: this.types.FAULT_CURRENT,
            arcFlash: this.types.FAULT_CURRENT,
            voltageDropDesign: this.types.CONNECTED_LOAD,
            voltageDropOperating: this.types.OPERATING_LOAD,
            loadFlow: this.types.OPERATING_LOAD,
            transformerLoading: this.types.OPERATING_LOAD,
            cableSizing: this.types.CONNECTED_LOAD,
            equipmentRating: this.types.CONNECTED_LOAD
        };
        return typeMap[calculationType] || this.types.CONNECTED_LOAD;
    },
    
    /**
     * Get explanation for why a specific current type is used
     * 
     * @param {String} calculationType - Type of calculation
     * @returns {String} Explanation
     */
    getExplanation: function(calculationType) {
        const explanations = {
            shortCircuit: 'Short circuit analysis uses fault current to determine protection device ratings and coordination.',
            arcFlash: 'Arc flash analysis uses bolted fault current to calculate incident energy and establish safe working distances.',
            voltageDropDesign: 'Design voltage drop uses 100% FLC for conservative cable sizing to ensure equipment operates properly under worst-case conditions.',
            voltageDropOperating: 'Operating voltage drop uses demand-adjusted load to show actual operating conditions.',
            loadFlow: 'Load flow analysis uses operating load to represent actual power flow in the system.',
            transformerLoading: 'Transformer loading uses actual operating current to determine realistic loading percentages.',
            cableSizing: 'Cable sizing uses 100% FLC per NEC Article 310 for proper ampacity selection.',
            equipmentRating: 'Equipment rating uses 100% FLC to ensure adequate sizing for all operating conditions.'
        };
        return explanations[calculationType] || 'No specific guidance available.';
    }
};

// Export to global scope
if (typeof window !== 'undefined') {
    window.CurrentSources = CurrentSources;
}

console.log('✅ Current Sources Module loaded');
console.log('   - Current Types: CONNECTED_LOAD, DEMAND_LOAD, DIVERSITY_LOAD, OPERATING_LOAD, FAULT_CURRENT');
console.log('   - Short Circuit/Arc Flash: Uses FAULT_CURRENT');
console.log('   - Cable Sizing/Design Voltage Drop: Uses CONNECTED_LOAD (100% FLC)');
console.log('   - Load Flow/Transformer Loading: Uses OPERATING_LOAD');

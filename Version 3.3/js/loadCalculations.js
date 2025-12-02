/**
 * Load Calculations Module
 * Calculates dynamic load currents based on downstream equipment
 * 
 * @author bfforex
 * @date 2025-10-27 16:11:27 UTC
 * @version 1.0.0
 */

/**
 * Calculate total downstream load current for a bus
 * @param {String} busId - Bus identifier
 * @returns {Number} Total load current in amperes
 */
function calculateDownstreamLoad(busId) {
    const bus = buses.find(b => b.id === busId);
    if (!bus) return 0;

    let totalLoad = 0;
    const visited = new Set();
    
    // Recursive function to traverse downstream
    function traverseDownstream(currentBusId) {
        if (visited.has(currentBusId)) return 0;
        visited.add(currentBusId);
        
        let branchLoad = 0;
        const currentBus = buses.find(b => b.id === currentBusId);
        if (!currentBus) return 0;
        
        // Add direct load on this bus if specified
        // ✅ FIXED: Only add MANUAL loads (not auto-calculated) to prevent double-counting
        // Added: 2025-12-01 by bfforex
        if (currentBus.loadCurrent && currentBus.loadCurrent > 0 && !currentBus.loadCurrentAutoCalculated) {
            branchLoad += currentBus.loadCurrent;
            console.log(`   📍 Direct load on ${currentBus.name}: ${currentBus.loadCurrent.toFixed(2)} A (manual)`);
        } else if (currentBus.loadCurrent && currentBus.loadCurrentAutoCalculated) {
            console.log(`   ℹ️ Skipping auto-calculated load on ${currentBus.name} (prevents double-count)`);
        }
        
        // Find all components connected FROM this bus
        const downstreamComponents = components.filter(c => c.fromBus === currentBusId);
        
        downstreamComponents.forEach(comp => {
            const toBus = buses.find(b => b.id === comp.toBus);
            if (!toBus) return;
            
            // Add load based on component type
            switch(comp.type) {
                case 'motor':
                    // Motor load: HP to Amps conversion
                    // Formula: I = (HP × 746) / (V × Efficiency × PF × √3)
                    // Typical efficiency: 0.9, PF: 0.85 for motors
                    const motorCurrent = (comp.hp * 746) / (toBus.voltage * 0.9 * 0.85 * Math.sqrt(3));
                    branchLoad += motorCurrent;
                    console.log(`   Motor: ${comp.hp} HP = ${motorCurrent.toFixed(2)} A`);
                    break;
                    
                case 'cable':
                    // If cable has specified load current, use it
                    if (comp.loadCurrent && comp.loadCurrent > 0) {
                        branchLoad += comp.loadCurrent;
                        console.log(`   Cable load: ${comp.loadCurrent.toFixed(2)} A`);
                    } else {
                        // Otherwise, traverse to downstream bus
                        const downstreamLoad = traverseDownstream(comp.toBus);
                        branchLoad += downstreamLoad;
                    }
                    break;
                    
                case 'transformer':
                    // Calculate downstream load on secondary side
                    const transformerDownstream = traverseDownstream(comp.toBus);
                    if (transformerDownstream > 0) {
                        // ✅ NEW: Refer secondary current to primary side
                        const turnsRatio = comp.primary / comp.secondary;
                        const primaryCurrent = transformerDownstream / turnsRatio;  
                        branchLoad += primaryCurrent;
        
                        console.log(`   Transformer: ${comp.rating} kVA`);
                        console.log(`     Secondary load: ${transformerDownstream.toFixed(2)} A @ ${comp.secondary}V`);
                        console.log(`     Primary current: ${primaryCurrent.toFixed(2)} A @ ${comp.primary}V`);
                        console.log(`     Turns ratio: ${turnsRatio.toFixed(4)}`);

                    } else if (comp.rating) {
                        // Use transformer rating as maximum load (80% loading)
                        const transformerCurrent = (comp.rating * 1000) / (Math.sqrt(3) * comp.primary);
                        branchLoad += transformerCurrent * 0.8;
                        console.log(`   Transformer: ${comp.rating} kVA @ 80% = ${(transformerCurrent * 0.8).toFixed(2)} A`);
                    }
                    break;
                    
                case 'generator':
                    // Generators typically don't add load, they supply it
                    // But we'll note their contribution
                    console.log(`   Generator: ${comp.rating} kVA (source)`);
                    break;
                    
                default:
                    // For other components, traverse downstream
                    branchLoad += traverseDownstream(comp.toBus);
            }
        });
        
        return branchLoad;
    }
    
    totalLoad = traverseDownstream(busId);
    
    console.log(`📊 Total downstream load for ${bus.name}: ${totalLoad.toFixed(2)} A`);
    return totalLoad;
}

/**
 * Calculate load current for voltage drop analysis
 * Uses downstream load calculation if available, falls back to manual input
 * @param {Object} bus - Bus object
 * @returns {Number} Load current in amperes
 */
function getLoadCurrentForBus(bus) {
    // First, try to calculate from downstream loads
    const downstreamLoad = calculateDownstreamLoad(bus.id);
    
    if (downstreamLoad > 0) {
        console.log(`✅ Using calculated downstream load: ${downstreamLoad.toFixed(2)} A`);
        return downstreamLoad;
    }
    
    // Fall back to manual input from UI
    const manualLoad = parseFloat(document.getElementById('loadCurrent')?.value || 0);
    if (manualLoad > 0) {
        console.log(`⚠️ No downstream loads found, using manual input: ${manualLoad.toFixed(2)} A`);
        return manualLoad;
    }
    
    // Last resort: use a default based on bus voltage
    const defaultLoad = getDefaultLoadByVoltage(bus.voltage);
    console.log(`⚠️ No load specified, using default: ${defaultLoad.toFixed(2)} A`);
    return defaultLoad;
}

/**
 * Get default load current based on voltage level
 * @param {Number} voltage - Bus voltage in volts
 * @returns {Number} Default load current in amperes
 */
function getDefaultLoadByVoltage(voltage) {
    if (voltage >= 13800) return 100;  // Medium voltage: 100A default
    if (voltage >= 480) return 200;     // Low voltage: 200A default
    if (voltage >= 208) return 100;     // 208V: 100A default
    return 50;                          // 120V and below: 50A default
}

/**
 * Get load summary for a bus (for display purposes)
 * @param {String} busId - Bus identifier
 * @returns {Object} Load summary with breakdown
 */
function getLoadSummary(busId) {
    const bus = buses.find(b => b.id === busId);
    if (!bus) return null;
    
    const summary = {
        totalLoad: 0,
        motorLoad: 0,
        transformerLoad: 0,
        manualLoad: 0,
        cableLoad: 0,
        breakdown: []
    };
    
    const downstreamComponents = components.filter(c => c.fromBus === busId);
    
    downstreamComponents.forEach(comp => {
        const toBus = buses.find(b => b.id === comp.toBus);
        if (!toBus) return;
        
        switch(comp.type) {
            case 'motor':
                const motorCurrent = (comp.hp * 746) / (toBus.voltage * 0.9 * 0.85 * Math.sqrt(3));
                summary.motorLoad += motorCurrent;
                summary.breakdown.push({
                    type: 'Motor',
                    description: `${comp.hp} HP`,
                    current: motorCurrent,
                    location: toBus.name
                });
                break;
                
            case 'cable':
                if (comp.loadCurrent) {
                    summary.cableLoad += comp.loadCurrent;
                    summary.breakdown.push({
                        type: 'Cable Load',
                        description: `${comp.size} ${comp.material}`,
                        current: comp.loadCurrent,
                        location: toBus.name
                    });
                }
                break;
                
            case 'transformer':
                if (comp.rating) {
                    const transformerCurrent = (comp.rating * 1000) / (Math.sqrt(3) * toBus.voltage) * 0.8;
                    summary.transformerLoad += transformerCurrent;
                    summary.breakdown.push({
                        type: 'Transformer',
                        description: `${comp.rating} kVA`,
                        current: transformerCurrent,
                        location: toBus.name
                    });
                }
                break;
        }
    });
    
    // Add manual load if specified
    if (bus.loadCurrent && bus.loadCurrent > 0) {
        summary.manualLoad = bus.loadCurrent;
        summary.breakdown.push({
            type: 'Direct Load',
            description: 'Specified on bus',
            current: bus.loadCurrent,
            location: bus.name
        });
    }
    
    summary.totalLoad = summary.motorLoad + summary.transformerLoad + 
                        summary.manualLoad + summary.cableLoad;
    
    return summary;
}

/**
 * Update load current display in UI
 * @param {String} busId - Bus identifier
 */
function displayLoadSummary(busId) {
    const summary = getLoadSummary(busId);
    if (!summary) return;
    
    const container = document.getElementById('loadSummaryContainer');
    if (!container) return;
    
    let html = `
        <div class="load-summary-section">
            <h4>📊 Load Analysis</h4>
            <div class="load-summary-total">
                <strong>Total Load Current:</strong> ${summary.totalLoad.toFixed(2)} A
            </div>
            <div class="load-breakdown">
                ${summary.breakdown.map(item => `
                    <div class="load-item">
                        <span class="load-type">${item.type}</span>
                        <span class="load-desc">${item.description}</span>
                        <span class="load-location">${item.location}</span>
                        <span class="load-current">${item.current.toFixed(2)} A</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

console.log('✅ Load Calculations module loaded');
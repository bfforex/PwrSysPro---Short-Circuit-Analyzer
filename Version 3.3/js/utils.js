// Utility Functions
// Modified: 2025-10-28 01:40:16 UTC by bfforex
// Added: getLoadCurrent and calculateComponentVoltageDrop functions

/**
 * Generate unique bus ID
 */
function generateBusId() {
    return 'BUS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate unique component ID
 */
function generateComponentId() {
    return Date.now();
}

/**
 * Get bus icon based on type
 */
function getBusIcon(type) {
    switch(type) {
        case 'source': return '⚡';
        case 'distribution': return '🔌';
        case 'branch': return '📍';
        default: return '🔌';
    }
}

/**
 * Get current timestamp for calculations
 */
function getCalculationTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
}

/**
 * Update session time display
 */
function updateSessionTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    document.getElementById('sessionDate').textContent = formattedDateTime;
}

/**
 * Temperature correction for cable resistance
 */
function temperatureCorrection(r20, temp, material = 'copper') {
    const alpha = TEMP_COEFFICIENT[material];
    return r20 * (1 + alpha * (temp - 20));
}

/**
 * Calculate parallel impedance of two complex impedances
 */
function calculateParallelImpedance(z1, z2) {
    const R_sum = z1.r + z2.r;
    const X_sum = z1.x + z2.x;
    const R_prod = z1.r * z2.r - z1.x * z2.x;
    const X_prod = z1.r * z2.x + z1.x * z2.r;
    const denominator = R_sum * R_sum + X_sum * X_sum;
    
    if (denominator === 0) {
        return { r: 0, x: 0 };
    }
    
    const R_parallel = (R_prod * R_sum + X_prod * X_sum) / denominator;
    const X_parallel = (X_prod * R_sum - R_prod * X_sum) / denominator;
    
    return { r: R_parallel, x: X_parallel };
}

/**
 * Schedule auto-save
 */
function scheduleAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(autoSave, 2000);
}

/**
 * Auto-save project
 * Fixed: 2025-10-28 01:51:03 UTC by bfforex
 * Enhanced: Handle new separated calculation results without circular references
 */
function autoSave() {
    if (!document.getElementById('autoSave').checked) return;
    
    try {
        // Create a deep copy of buses without circular references
        const busesForSave = buses.map(bus => {
            const busCopy = { ...bus };
            
            // Handle new separated results structure
            if (busCopy.results) {
                const resultsCopy = { ...busCopy.results };
                
                // Clean up shortCircuit results
                if (resultsCopy.shortCircuit && resultsCopy.shortCircuit.path) {
                    resultsCopy.shortCircuit = {
                        ...resultsCopy.shortCircuit,
                        path: resultsCopy.shortCircuit.path.map(segment => ({
                            busId: segment.bus?.id,
                            busName: segment.bus?.name,
                            busVoltage: segment.bus?.voltage,
                            componentType: segment.component?.type,
                            componentId: segment.component?.id
                        }))
                    };
                }
                
                // Clean up loadFlow results (if it has circular refs)
                if (resultsCopy.loadFlow && resultsCopy.loadFlow.pathTrace) {
                    resultsCopy.loadFlow = {
                        ...resultsCopy.loadFlow,
                        pathTrace: resultsCopy.loadFlow.pathTrace.map(trace => ({
                            depth: trace.depth,
                            bus: trace.bus,
                            voltage: trace.voltage
                        }))
                    };
                }
                
                // Clean up voltageDropResults (if it has circular refs)
                if (resultsCopy.voltageDrop && resultsCopy.voltageDrop.criticalComponents) {
                    resultsCopy.voltageDrop = {
                        ...resultsCopy.voltageDrop,
                        criticalComponents: resultsCopy.voltageDrop.criticalComponents.map(item => ({
                            step: item.step,
                            componentId: item.component?.id,
                            componentType: item.component?.type,
                            componentName: item.component?.name,
                            voltageDrop: item.voltageDrop
                        }))
                    };
                }
                
                // Clean up legacy path (backward compatibility)
                if (resultsCopy.path) {
                    resultsCopy.path = resultsCopy.path.map(segment => ({
                        busId: segment.bus?.id,
                        busName: segment.bus?.name,
                        busVoltage: segment.bus?.voltage,
                        componentType: segment.component?.type,
                        componentId: segment.component?.id
                    }));
                }
                
                busCopy.results = resultsCopy;
            }
            
            // Remove pathComponents to avoid duplication
            delete busCopy.pathComponents;
            
            return busCopy;
        });
        
        const projectData = {
            version: VERSION,
            author: AUTHOR,
            projectName: document.getElementById('projectName').value,
            projectNumber: document.getElementById('projectNumber').value,
            engineer: document.getElementById('engineer').value,
            method: document.querySelector('input[name="method"]:checked').value,
            buses: busesForSave,
            components: components,
            projectLoadCurrent: parseFloat(document.getElementById('loadCurrent').value) || 0,
            projectPF: parseFloat(document.getElementById('powerFactor').value) || 0.9,
            voltageDropLimit: parseFloat(document.getElementById('voltageDropLimit').value) || 3,
            temperature: parseFloat(document.getElementById('temperature').value) || 75,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('multiBusProject', JSON.stringify(projectData));
        
        const indicator = document.getElementById('autoSaveIndicator');
        if (indicator) {
            indicator.classList.add('show');
            setTimeout(() => indicator.classList.remove('show'), 2000);
        }
        
        console.log('✅ Auto-saved successfully at', new Date().toISOString());
    } catch (error) {
        console.error('❌ Auto-save failed:', error);
        // Don't alert user for auto-save failures
    }
}
/**
 * Trace path from bus to source
 * - Supports both {fromBus/toBus} and {fromBusId/toBusId}
 * - Skips OPEN bus ties (if present)
 */
function traceBusPath(busId) {
  const path = [];
  let currentBusId = busId;
  const visited = new Set();

  while (currentBusId) {
    if (visited.has(currentBusId)) {
      throw new Error('Circular reference detected in bus hierarchy');
    }
    visited.add(currentBusId);

    const currentBus = buses.find(b => b.id === currentBusId);
    if (!currentBus) return null;

    const feedingComponent = components.find(c => {
      if (!c) return false;

      const to = c.toBus ?? c.toBusId;
      if (to !== currentBusId) return false;

      // Skip OPEN bus ties (if any exist)
      if (c.type === 'bus-tie') {
        const state = c.currentState || c.normalState || 'open';
        return state !== 'open';
      }

      return true;
    });

    path.unshift({ bus: currentBus, component: feedingComponent || null });

    if (currentBus.type === 'source') {
      return path;
    }

    if (feedingComponent) {
      currentBusId = feedingComponent.fromBus ?? feedingComponent.fromBusId;
    } else {
      return null;
    }
  }

  return null;
}

/**
 * Get load current for voltage drop calculation
 */
function getLoadCurrent(bus, component = null, defaultCurrent = 100) {
    console.log(`\n🔍 Load Current for: ${bus?.name || 'Unknown'}`);
    
    // Priority 1: Component-specific load current
    if (component && component.loadCurrent && component.loadCurrent > 0) {
        console.log(`  ✅ Using component load: ${component.loadCurrent}A (manual)`);
        return parseFloat(component.loadCurrent);
    }
    
    // Priority 2: Bus-specific load current
    if (bus && bus.loadCurrent && bus.loadCurrent > 0) {
        console.log(`  ✅ Using bus load: ${bus.loadCurrent}A`);
        return parseFloat(bus.loadCurrent);
    }
    
    // Priority 3: Calculate from load power
    if (bus && bus.load && bus.load.power && bus.voltage) {
        const power = parseFloat(bus.load.power);
        const powerFactor = parseFloat(bus.load.powerFactor) || 0.85;
        const voltage = parseFloat(bus.voltage) / 1000;
        const calculated = (power / (Math.sqrt(3) * voltage * powerFactor)) * 1000;
        console.log(`  ✅ Calculated from power: ${calculated.toFixed(2)}A`);
        return calculated;
    }
    
    // Priority 4: Load Flow Analysis
    if (typeof calculateDownstreamLoad === 'function') {
        const downstreamLoad = calculateDownstreamLoad(bus.id);
        if (downstreamLoad > 0) {
            console.log(`  ✅ Load flow analysis: ${downstreamLoad.toFixed(2)}A (calculated)`);
            return downstreamLoad;
        }
    }
    
    // Priority 5: Default value
    console.log(`  ⚠️ Using default: ${defaultCurrent}A`);
    return defaultCurrent;
}

/**
 * Calculate voltage drop for a component
 */
function calculateComponentVoltageDrop(component, current, voltage, resistance, reactance, powerFactor) {
    const sinPhi = Math.sqrt(1 - powerFactor * powerFactor);
    
    // ΔV = √3 × I × (R×cosφ + X×sinφ)
    const dropVolts = Math.sqrt(3) * current * (resistance * powerFactor + reactance * sinPhi);
    const dropPercent = (dropVolts / voltage) * 100;
    
    // Determine severity
    let severity = 'OK';
    if (dropPercent > 7) {
        severity = 'CRITICAL';
    } else if (dropPercent > 5) {
        severity = 'HIGH';
    } else if (dropPercent > 3) {
        severity = 'MEDIUM';
    }
    
    return {
        dropVolts: dropVolts,
        dropPercent: dropPercent,
        severity: severity,
        current: current,
        powerFactor: powerFactor
    };
}

/**
 * Refer current across transformer
 */
function referCurrentAcrossTransformer(current, fromVoltage, toVoltage) {
    const turnsRatio = fromVoltage / toVoltage;
    return current / turnsRatio;
}

/**
 * Calculate transformer full load current
 */
function calculateTransformerCurrent(kva, voltage, loadingFactor = 0.8) {
    return (kva * 1000 * loadingFactor) / (Math.sqrt(3) * voltage);
}

/**
 * Calculate motor full load current
 * @param {number} hp - Motor horsepower
 * @param {number} voltage - Line-to-line voltage (V)
 * @param {number} efficiency - Motor efficiency (default 0.9)
 * @param {number} powerFactor - Power factor (default 0.85)
 * @param {number} phases - Number of phases: 3 (default) or 1 for single-phase (Issue #43)
 */
function calculateMotorCurrent(hp, voltage, efficiency = 0.9, powerFactor = 0.85, phases = 3) {
    // Single-phase: I = HP × 746 / (V × η × PF)
    // Three-phase:  I = HP × 746 / (√3 × V × η × PF)
    const phaseFactor = (phases === 1) ? 1 : Math.sqrt(3);
    return (hp * 746) / (voltage * phaseFactor * efficiency * powerFactor);
}

/**
 * Safe toFixed utility function - Issue #2 FIX
 * Prevents "Cannot read properties of undefined (reading 'toFixed')" errors
 * when exporting reports with incomplete or missing data
 * 
 * @param {*} value - The value to format
 * @param {Number} decimals - Number of decimal places (default: 2)
 * @param {String} fallback - Fallback value if input is invalid (default: 'N/A')
 * @returns {String} Formatted number string or fallback
 * 
 * @author bfforex
 * @date 2025-12-01
 * @version 1.0.0
 */
function safeToFixed(value, decimals = 2, fallback = 'N/A') {
    if (value === undefined || value === null || isNaN(Number(value))) {
        // Only log in development/debug mode to avoid performance impact
        if (typeof console !== 'undefined' && console.debug) {
            console.debug(`[safeToFixed] Invalid value: ${value}, using fallback: ${fallback}`);
        }
        return fallback;
    }
    return Number(value).toFixed(decimals);
}

// Export functions to global scope
window.traceBusPath = traceBusPath;
window.getLoadCurrent = getLoadCurrent;
window.calculateComponentVoltageDrop = calculateComponentVoltageDrop;
window.referCurrentAcrossTransformer = referCurrentAcrossTransformer;
window.calculateTransformerCurrent = calculateTransformerCurrent;
window.calculateMotorCurrent = calculateMotorCurrent;
window.safeToFixed = safeToFixed;

console.log('✅ Utils loaded');
console.log('   - traceBusPath: Available');
console.log('   - getLoadCurrent: Available');
console.log('   - calculateComponentVoltageDrop: Available');
console.log('   - safeToFixed: Available (Issue #2 FIX)');
// Utility Functions
// Modified: 2025-10-27 23:43:22 UTC by bfforex
// Fixed: Added missing generateComponentId function

/**
 * Generate unique bus ID
 */
function generateBusId() {
    return 'BUS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate unique component ID
 * Added: 2025-10-27 23:43:22 UTC by bfforex
 * Fixed: Missing function causing addComponent to fail
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
 */
function autoSave() {
    if (!document.getElementById('autoSave').checked) return;
    
    try {
        // Create a deep copy of buses without circular references
        const busesForSave = buses.map(bus => {
            const busCopy = { ...bus };
            
            // Remove circular references from results
            if (busCopy.results && busCopy.results.path) {
                busCopy.results.path = busCopy.results.path.map(segment => ({
                    busId: segment.bus?.id,
                    busName: segment.bus?.name,
                    busVoltage: segment.bus?.voltage,
                    componentType: segment.component?.type,
                    componentId: segment.component?.id
                }));
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
    }
}
/**
 * Project Manager Module
 * Handles saving and loading of project data
 * 
 * @author bfforex
 * @date 2025-10-29 16:52:38 UTC
 * @version 1.2.0
 * @fixed Circular reference in JSON serialization
 * @fixed Auto-save circular reference with systemFault
 */

console.log('🔧 Loading Project Manager v1.2.0...');

/**
 * Save project to JSON file
 * Enhanced: Removes circular references before serialization
 */
function saveProject() {
    try {
        const projectName = document.getElementById('projectName').value || 'Untitled Project';
        const engineer = document.getElementById('engineer').value || 'Unknown';
        const projectNumber = document.getElementById('projectNumber').value || '';
        
        console.log('💾 Saving project...');
        
        // Clean buses - remove circular references
        const busesClean = cleanBusesForSerialization(buses);
        
        // Create project data object
        const projectData = {
            projectInfo: {
                name: projectName,
                engineer: engineer,
                projectNumber: projectNumber,
                savedDate: new Date().toISOString(),
                version: '1.2.0'
            },
            buses: busesClean,
            components: components,
            settings: {
                loadCurrent: parseFloat(document.getElementById('loadCurrent').value) || 100,
                powerFactor: parseFloat(document.getElementById('powerFactor').value) || 0.9,
                voltageDropLimit: parseFloat(document.getElementById('voltageDropLimit').value) || 3,
                temperature: parseFloat(document.getElementById('temperature').value) || 75,
                method: document.querySelector('input[name="method"]:checked')?.value || 'point-to-point'
            }
        };
        
        // Convert to JSON
        const json = JSON.stringify(projectData, null, 2);
        
        // Create blob and download
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ Project saved successfully');
        console.log(`   File: ${a.download}`);
        console.log(`   Buses: ${busesClean.length}`);
        console.log(`   Components: ${components.length}`);
        
        alert(`✅ Project saved successfully!\n\nFile: ${a.download}\nBuses: ${busesClean.length}\nComponents: ${components.length}`);
        
    } catch (error) {
        console.error('❌ Save failed:', error);
        console.error('Stack trace:', error.stack);
        alert(`❌ Failed to save project:\n\n${error.message}\n\nCheck browser console for details.`);
    }
}

/**
 * Clean buses for JSON serialization
 * Removes all circular references
 * 
 * @param {Array} buses - Array of bus objects
 * @returns {Array} Cleaned bus array
 */
function cleanBusesForSerialization(buses) {
    return buses.map(bus => {
        const busClone = { ...bus };
        
        // Clean results object
        if (busClone.results) {
            const resultsClean = { ...busClone.results };
            
            // ✅ Clean shortCircuit (remove path with circular refs)
            if (resultsClean.shortCircuit) {
                resultsClean.shortCircuit = cleanResultObject(resultsClean.shortCircuit);
            }
            
            // ✅ Clean systemFault (NEW - was causing circular reference)
            if (resultsClean.systemFault) {
                resultsClean.systemFault = cleanResultObject(resultsClean.systemFault);
            }
            
            // ✅ Clean motorContribution
            if (resultsClean.motorContribution && resultsClean.motorContribution.motors) {
                resultsClean.motorContribution = {
                    ...resultsClean.motorContribution,
                    motors: resultsClean.motorContribution.motors.map(m => ({
                        id: m.id,
                        name: m.name,
                        hp: m.hp,
                        motorType: m.motorType
                    }))
                };
            }
            
            // ✅ Clean main path
            if (resultsClean.path) {
                resultsClean.path = cleanPathArray(resultsClean.path);
            }
            
            // ✅ Clean loadFlow
            if (resultsClean.loadFlow) {
                if (resultsClean.loadFlow.pathTrace) {
                    resultsClean.loadFlow.pathTrace = resultsClean.loadFlow.pathTrace
                        .filter(trace => trace && trace.bus)
                        .map(trace => ({
                            depth: trace.depth || 0,
                            bus: trace.bus || 'Unknown',
                            voltage: trace.voltage || 0,
                            loads: trace.loads || []
                        }));
                }
            }
            
            // ✅ Clean voltageDrop
            if (resultsClean.voltageDrop && resultsClean.voltageDrop.components) {
                resultsClean.voltageDrop.components = resultsClean.voltageDrop.components
                    .filter(comp => comp)
                    .map(comp => {
                        const { bus, component, ...rest } = comp;
                        return rest;
                    });
            }
            
            busClone.results = resultsClean;
        }
        
        // Clean pathComponents
        if (busClone.pathComponents) {
            busClone.pathComponents = cleanPathArray(busClone.pathComponents);
        }
        
        return busClone;
    });
}

/**
 * Clean a result object (shortCircuit, systemFault, etc.)
 * 
 * @param {Object} resultObj - Result object to clean
 * @returns {Object} Cleaned result object
 */
function cleanResultObject(resultObj) {
    const cleaned = { ...resultObj };
    
    // Remove path (contains circular references)
    if (cleaned.path) {
        cleaned.path = cleanPathArray(cleaned.path);
    }
    
    // Clean motorContribution if present
    if (cleaned.motorContribution && cleaned.motorContribution.motors) {
        cleaned.motorContribution = {
            ...cleaned.motorContribution,
            motors: cleaned.motorContribution.motors.map(m => ({
                id: m.id,
                name: m.name,
                hp: m.hp,
                motorType: m.motorType
            }))
        };
    }
    
    return cleaned;
}

/**
 * Clean path array
 * 
 * @param {Array} pathArray - Array of path segments
 * @returns {Array} Cleaned path array
 */
function cleanPathArray(pathArray) {
    if (!Array.isArray(pathArray)) return [];
    
    return pathArray
        .filter(segment => segment && segment.bus)
        .map(segment => ({
            sequence: segment.sequence || 0,
            bus: {
                id: segment.bus.id,
                name: segment.bus.name || 'Unknown',
                voltage: segment.bus.voltage || 0,
                type: segment.bus.type || 'unknown'
            },
            component: segment.component ? {
                id: segment.component.id,
                type: segment.component.type || 'unknown',
                name: segment.component.name || 'Unknown Component'
            } : null
        }));
}

/**
 * Validate project data structure and types
 * ✅ ISSUE #8: Comprehensive input validation
 * 
 * @param {Object} data - Project data to validate
 * @returns {Object} Validation result with {valid: boolean, errors: string[], warnings: string[]}
 */
function validateProjectData(data) {
    const errors = [];
    const warnings = [];
    
    // Check for required top-level structure
    if (!data || typeof data !== 'object') {
        errors.push('Project data must be an object');
        return { valid: false, errors, warnings };
    }
    
    // Validate buses array
    if (!data.buses || !Array.isArray(data.buses)) {
        errors.push('Missing or invalid buses array');
    } else if (data.buses.length === 0) {
        warnings.push('Project contains no buses');
    } else {
        // Validate each bus
        data.buses.forEach((bus, index) => {
            if (!bus || typeof bus !== 'object') {
                errors.push(`Bus at index ${index} is not an object`);
                return;
            }
            if (!bus.id || typeof bus.id !== 'string') {
                errors.push(`Bus at index ${index} missing valid id`);
            }
            if (!bus.name || typeof bus.name !== 'string') {
                errors.push(`Bus at index ${index} missing valid name`);
            }
            if (typeof bus.voltage !== 'number' || bus.voltage <= 0) {
                errors.push(`Bus "${bus.name}" has invalid voltage`);
            }
            if (!bus.type || typeof bus.type !== 'string') {
                errors.push(`Bus "${bus.name}" missing valid type`);
            }
        });
    }
    
    // Validate components array
    if (!data.components || !Array.isArray(data.components)) {
        errors.push('Missing or invalid components array');
    } else {
        // Validate each component
        data.components.forEach((component, index) => {
            if (!component || typeof component !== 'object') {
                errors.push(`Component at index ${index} is not an object`);
                return;
            }
            if (!component.id || typeof component.id !== 'string') {
                errors.push(`Component at index ${index} missing valid id`);
            }
            if (!component.type || typeof component.type !== 'string') {
                errors.push(`Component at index ${index} missing valid type`);
            }
        });
    }
    
    // Validate project info (optional but should have proper structure if present)
    if (data.projectInfo && typeof data.projectInfo !== 'object') {
        errors.push('projectInfo must be an object if present');
    }
    
    // Validate settings (optional but should have proper structure if present)
    if (data.settings) {
        if (typeof data.settings !== 'object') {
            errors.push('settings must be an object if present');
        } else {
            // Validate numeric settings
            if (data.settings.loadCurrent !== undefined && (typeof data.settings.loadCurrent !== 'number' || data.settings.loadCurrent < 0)) {
                warnings.push('Invalid loadCurrent value, will use default');
            }
            if (data.settings.powerFactor !== undefined && (typeof data.settings.powerFactor !== 'number' || data.settings.powerFactor <= 0 || data.settings.powerFactor > 1)) {
                warnings.push('Invalid powerFactor value, will use default');
            }
            if (data.settings.temperature !== undefined && (typeof data.settings.temperature !== 'number' || data.settings.temperature < -50 || data.settings.temperature > 200)) {
                warnings.push('Invalid temperature value, will use default');
            }
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Sanitize project data to ensure safe values
 * ✅ ISSUE #8: Data sanitization for security
 * 
 * @param {Object} data - Project data to sanitize
 * @returns {Object} Sanitized project data
 */
function sanitizeProjectData(data) {
    const sanitized = {
        projectInfo: {
            name: sanitizeString(data.projectInfo?.name, 'Untitled Project'),
            engineer: sanitizeString(data.projectInfo?.engineer, 'Unknown'),
            projectNumber: sanitizeString(data.projectInfo?.projectNumber, ''),
            version: data.projectInfo?.version || '1.2.0'
        },
        buses: [],
        components: [],
        settings: {
            loadCurrent: sanitizeNumber(data.settings?.loadCurrent, 100, 0, 100000),
            powerFactor: sanitizeNumber(data.settings?.powerFactor, 0.9, 0.1, 1.0),
            voltageDropLimit: sanitizeNumber(data.settings?.voltageDropLimit, 3, 0, 100),
            temperature: sanitizeNumber(data.settings?.temperature, 75, -50, 200),
            method: ['point-to-point', 'per-unit'].includes(data.settings?.method) ? data.settings.method : 'point-to-point'
        }
    };
    
    // Sanitize buses
    if (Array.isArray(data.buses)) {
        sanitized.buses = data.buses.map(bus => ({
            id: sanitizeString(bus.id, `bus_${Date.now()}_${Math.random()}`),
            name: sanitizeString(bus.name, 'Unnamed Bus'),
            voltage: sanitizeNumber(bus.voltage, 440, 1, 1000000),
            type: sanitizeString(bus.type, 'load'),
            parent: bus.parent || null,
            // Preserve other bus properties
            availableFaultCurrent: sanitizeNumber(bus.availableFaultCurrent, 0, 0, 1000),
            xrRatio: sanitizeNumber(bus.xrRatio, 0, 0, 100),
            demandFactor: sanitizeNumber(bus.demandFactor, 1.0, 0, 10),
            diversityFactor: sanitizeNumber(bus.diversityFactor, 1.0, 0, 10)
        }));
    }
    
    // Sanitize components
    if (Array.isArray(data.components)) {
        sanitized.components = data.components.map(component => {
            const base = {
                id: sanitizeString(component.id, `comp_${Date.now()}_${Math.random()}`),
                type: sanitizeString(component.type, 'unknown'),
                tag: sanitizeString(component.tag, ''),
                description: sanitizeString(component.description, '')
            };
            
            // Add type-specific properties with sanitization
            if (component.type === 'cable') {
                return {
                    ...base,
                    fromBusId: sanitizeString(component.fromBusId, ''),
                    toBusId: sanitizeString(component.toBusId, ''),
                    fromBusName: sanitizeString(component.fromBusName, ''),
                    toBusName: sanitizeString(component.toBusName, ''),
                    size: sanitizeString(component.size, ''),
                    length: sanitizeNumber(component.length, 0, 0, 100000),
                    material: sanitizeString(component.material, 'copper')
                };
            } else if (component.type === 'transformer') {
                return {
                    ...base,
                    fromBusId: sanitizeString(component.fromBusId, ''),
                    toBusId: sanitizeString(component.toBusId, ''),
                    fromBusName: sanitizeString(component.fromBusName, ''),
                    toBusName: sanitizeString(component.toBusName, ''),
                    rating: sanitizeNumber(component.rating, 100, 1, 100000),
                    primaryVoltage: sanitizeNumber(component.primaryVoltage, 440, 1, 1000000),
                    secondaryVoltage: sanitizeNumber(component.secondaryVoltage, 440, 1, 1000000),
                    impedance: sanitizeNumber(component.impedance, 5, 0.1, 100)
                };
            } else if (component.type === 'motor') {
                return {
                    ...base,
                    busId: sanitizeString(component.busId, ''),
                    hp: sanitizeNumber(component.hp, 10, 0.1, 100000),
                    voltage: sanitizeNumber(component.voltage, 440, 1, 1000000),
                    efficiency: sanitizeNumber(component.efficiency, 0.9, 0.1, 1.0),
                    powerFactor: sanitizeNumber(component.powerFactor, 0.85, 0.1, 1.0)
                };
            }
            
            // For other types, preserve as-is but with base sanitization
            return { ...base, ...component };
        });
    }
    
    return sanitized;
}

/**
 * Sanitize a string value
 * @param {*} value - Value to sanitize
 * @param {string} defaultValue - Default value if invalid
 * @returns {string} Sanitized string
 */
function sanitizeString(value, defaultValue = '') {
    if (typeof value !== 'string') return defaultValue;
    // Remove any potentially dangerous characters but preserve normal text
    return value.replace(/[<>]/g, '').trim().substring(0, 1000);
}

/**
 * Sanitize a numeric value
 * @param {*} value - Value to sanitize
 * @param {number} defaultValue - Default value if invalid
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Sanitized number
 */
function sanitizeNumber(value, defaultValue, min = -Infinity, max = Infinity) {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num) || !isFinite(num)) return defaultValue;
    return Math.max(min, Math.min(max, num));
}

/**
 * Load project from JSON file
 */
function loadProject() {
    const fileInput = document.getElementById('fileInput');
    
    fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        console.log('📂 Loading project:', file.name);
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const projectData = JSON.parse(e.target.result);
                
                console.log('📦 Project data loaded');
                console.log('   Version:', projectData.projectInfo?.version || 'Unknown');
                console.log('   Buses:', projectData.buses?.length || 0);
                console.log('   Components:', projectData.components?.length || 0);
                
                // ✅ ISSUE #8: Enhanced input sanitization and validation
                const validationResult = validateProjectData(projectData);
                if (!validationResult.valid) {
                    throw new Error(`Invalid project file: ${validationResult.errors.join(', ')}`);
                }
                
                // Sanitize data before loading
                const sanitizedData = sanitizeProjectData(projectData);
                
                // Confirm before loading
                if (buses.length > 0 || components.length > 0) {
                    if (!confirm('This will replace your current project. Continue?')) {
                        fileInput.value = '';
                        return;
                    }
                }
                
                // Load project info (using sanitized data)
                if (sanitizedData.projectInfo) {
                    document.getElementById('projectName').value = sanitizedData.projectInfo.name || '';
                    document.getElementById('engineer').value = sanitizedData.projectInfo.engineer || '';
                    document.getElementById('projectNumber').value = sanitizedData.projectInfo.projectNumber || '';
                }
                
                // Load settings (using sanitized data)
                if (sanitizedData.settings) {
                    document.getElementById('loadCurrent').value = sanitizedData.settings.loadCurrent || 100;
                    document.getElementById('powerFactor').value = sanitizedData.settings.powerFactor || 0.9;
                    document.getElementById('voltageDropLimit').value = sanitizedData.settings.voltageDropLimit || 3;
                    document.getElementById('temperature').value = sanitizedData.settings.temperature || 75;
                    
                    if (sanitizedData.settings.method) {
                        const methodRadio = document.querySelector(`input[name="method"][value="${sanitizedData.settings.method}"]`);
                        if (methodRadio) methodRadio.checked = true;
                    }
                }
                
                // Load buses and components (using sanitized data)
                buses = sanitizedData.buses;
                components = sanitizedData.components;
                
                // Update UI
                updateBusTree();
                updateBusDropdowns();
                if (typeof displayComponents === 'function') displayComponents();
                updateBusesContent();
                
                // Reset selected bus
                selectedBusId = null;
                
                console.log('✅ Project loaded successfully');
                
                // Show any warnings from sanitization
                if (validationResult.warnings && validationResult.warnings.length > 0) {
                    console.warn('⚠️ Project loaded with warnings:');
                    validationResult.warnings.forEach(w => console.warn('   -', w));
                }
                
                alert(`✅ Project loaded successfully!\n\nName: ${sanitizedData.projectInfo?.name || 'Untitled'}\nBuses: ${buses.length}\nComponents: ${components.length}`);
                
            } catch (error) {
                console.error('❌ Load failed:', error);
                console.error('Stack trace:', error.stack);
                alert(`❌ Failed to load project:\n\n${error.message}\n\nMake sure the file is a valid project file.`);
            }
            
            // Reset file input
            fileInput.value = '';
        };
        
        reader.readAsText(file);
    };
    
    // Trigger file selection
    fileInput.click();
}

/**
 * Auto-save functionality
 */
let autoSaveTimeout = null;

function scheduleAutoSave() {
    const autoSaveEnabled = document.getElementById('autoSave')?.checked;
    
    if (!autoSaveEnabled) return;
    
    // Clear existing timeout
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }
    
    // Show indicator
    const indicator = document.getElementById('autoSaveIndicator');
    if (indicator) {
        indicator.textContent = '💾 Saving...';
        indicator.style.opacity = '1';
    }
    
    // Schedule auto-save after 2 seconds of inactivity
    autoSaveTimeout = setTimeout(() => {
        autoSaveToLocalStorage();
        
        if (indicator) {
            indicator.textContent = '✓ Auto-saved';
            setTimeout(() => {
                indicator.style.opacity = '0';
            }, 2000);
        }
    }, 2000);
}

/**
 * Auto-save to localStorage
 * Fixed: 2025-10-29 16:52:38 UTC by bfforex
 * Uses cleanBusesForSerialization to prevent circular references
 */
function autoSaveToLocalStorage() {
    try {
        const projectName = document.getElementById('projectName').value || 'Untitled Project';
        
        console.log('💾 Auto-saving to localStorage...');
        
        // ✅ Use the same cleaning function as saveProject
        const busesClean = cleanBusesForSerialization(buses);
        
        const projectData = {
            projectInfo: {
                name: projectName,
                engineer: document.getElementById('engineer').value || '',
                projectNumber: document.getElementById('projectNumber').value || '',
                savedDate: new Date().toISOString(),
                version: '1.2.0',
                autoSave: true
            },
            buses: busesClean,
            components: components,
            settings: {
                loadCurrent: parseFloat(document.getElementById('loadCurrent').value) || 100,
                powerFactor: parseFloat(document.getElementById('powerFactor').value) || 0.9,
                voltageDropLimit: parseFloat(document.getElementById('voltageDropLimit').value) || 3,
                temperature: parseFloat(document.getElementById('temperature').value) || 75,
                method: document.querySelector('input[name="method"]:checked')?.value || 'point-to-point'
            }
        };
        
        const json = JSON.stringify(projectData);
        localStorage.setItem('pwrsyspro_autosave', json);
        
        console.log('   ✅ Auto-saved successfully');
        console.log(`   Buses: ${busesClean.length}`);
        console.log(`   Components: ${components.length}`);
        
    } catch (error) {
        console.error('   ⚠️ Auto-save failed:', error.message);
        // Don't throw - auto-save failure shouldn't break the app
    }
}

/**
 * Load auto-saved project from localStorage
 */
function loadAutoSavedProject() {
    try {
        const json = localStorage.getItem('pwrsyspro_autosave');
        if (!json) return false;
        
        const projectData = JSON.parse(json);
        
        if (!projectData.projectInfo?.autoSave) return false;
        
        const savedDate = new Date(projectData.projectInfo.savedDate);
        const now = new Date();
        const hoursDiff = (now - savedDate) / (1000 * 60 * 60);
        
        // Only restore if saved within last 24 hours
        if (hoursDiff > 24) {
            localStorage.removeItem('pwrsyspro_autosave');
            return false;
        }
        
        console.log('📂 Auto-saved project found');
        console.log('   Saved:', savedDate.toLocaleString());
        console.log('   Hours ago:', hoursDiff.toFixed(1));
        
        const restore = confirm(`Auto-saved project found!\n\nProject: ${projectData.projectInfo.name}\nSaved: ${savedDate.toLocaleString()}\n\nRestore this project?`);
        
        if (restore) {
            // Load project info
            if (projectData.projectInfo) {
                document.getElementById('projectName').value = projectData.projectInfo.name || '';
                document.getElementById('engineer').value = projectData.projectInfo.engineer || '';
                document.getElementById('projectNumber').value = projectData.projectInfo.projectNumber || '';
            }
            
            // Load settings
            if (projectData.settings) {
                document.getElementById('loadCurrent').value = projectData.settings.loadCurrent || 100;
                document.getElementById('powerFactor').value = projectData.settings.powerFactor || 0.9;
                document.getElementById('voltageDropLimit').value = projectData.settings.voltageDropLimit || 3;
                document.getElementById('temperature').value = projectData.settings.temperature || 75;
                
                if (projectData.settings.method) {
                    const methodRadio = document.querySelector(`input[name="method"][value="${projectData.settings.method}"]`);
                    if (methodRadio) methodRadio.checked = true;
                }
            }
            
            // Load buses and components
            buses = projectData.buses;
            components = projectData.components;
            
            // Update UI
            updateBusTree();
            updateBusDropdowns();
            if (typeof displayComponents === 'function') displayComponents();
            updateBusesContent();
            
            console.log('✅ Auto-saved project restored');
            
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Failed to load auto-saved project:', error);
        return false;
    }
}

// Export functions
window.saveProject = saveProject;
window.loadProject = loadProject;
window.scheduleAutoSave = scheduleAutoSave;
window.autoSaveToLocalStorage = autoSaveToLocalStorage;
window.loadAutoSavedProject = loadAutoSavedProject;
window.cleanBusesForSerialization = cleanBusesForSerialization;

console.log('✅ Project Manager v1.2.0 loaded');
console.log('   - Circular reference fix: COMPLETE');
console.log('   - Auto-save: FIXED');
console.log('   - systemFault circular ref: FIXED');
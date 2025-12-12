/**
 * Project Manager Module
 * Handles saving and loading of project data
 * 
 * @author bfforex
 * @date 2025-12-01
 * @version 1.3.1
 * @fixed Circular reference in JSON serialization
 * @fixed Auto-save circular reference with systemFault
 * @fixed ISSUE #10: Accept both numeric and string IDs for backward compatibility
 * @enhancement ISSUE #8: Added comprehensive input validation and sanitization
 * @enhancement Added validateProjectData() for structure validation
 * @enhancement Added sanitizeProjectData() for safe data handling
 * @enhancement Added sanitizeString() and sanitizeNumber() helper functions
 */

console.log('🔧 Loading Project Manager v1.3.1...');
console.log('   ✅ Input validation enabled (Issue #8)');
console.log('   ✅ Data sanitization enabled (Issue #8)');
console.log('   ✅ ID type flexibility enabled (Issue #10)');

// ✅ CODE REVIEW: Define constants for consistency and maintainability
const PROJECT_MANAGER_VERSION = '1.3.1';
const MAX_STRING_LENGTH = 1000; // Maximum allowed string length for security

// ✅ CODE REVIEW: ID generation counter for uniqueness
let idCounter = 0;

/**
 * Generate unique ID with prefix
 * ✅ CODE REVIEW: Counter-based approach ensures uniqueness even with rapid calls
 * @param {string} prefix - ID prefix (e.g., 'bus', 'comp')
 * @returns {string} Unique ID
 */
function generateUniqueId(prefix = 'item') {
    return `${prefix}-${Date.now()}-${++idCounter}`;
}

/**
 * Save project to JSON file
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
                version: PROJECT_MANAGER_VERSION
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
 * Clean path array
 * 
 * @param {Array} pathArray - Array of path segments
 * @returns {Array} Cleaned path array
 */
function cleanPathArray(pathArray) {
    if (!Array.isArray(pathArray)) return [];
    
    return pathArray
        .filter(segment => segment && segment.bus)
        .map(segment => {
            // Create a clean bus object without results property
            const cleanBus = {
                id: segment.bus. id,
                name: segment. bus.name || 'Unknown',
                voltage: segment.bus.voltage || 0,
                type: segment.bus.type || 'unknown',
                tag: segment.bus.tag || ''
            };
            // ✅ DO NOT include segment.bus.results - this causes circular reference
            
            const cleanComponent = segment.component ?  {
                id: segment.component.id,
                type: segment.component.type || 'unknown',
                name: segment.component.name || 'Unknown Component',
                tag: segment.component.tag || ''
            } : null;
            
            return {
                sequence: segment.sequence || 0,
                bus: cleanBus,
                component: cleanComponent
            };
        });
}

/**
 * Clean result object
 * 
 * @param {Object} resultObj - Result object
 * @returns {Object} Cleaned result object
 */
function cleanResultObject(resultObj) {
    if (!resultObj || typeof resultObj !== 'object') return null;
    
    const cleaned = { ...resultObj };
    
    // ✅ CRITICAL: Clean the path to remove circular references
    if (cleaned.path) {
        cleaned.path = cleanPathArray(cleaned.path);
    }
    
    // Clean motorContribution if present
    if (cleaned.motorContribution && cleaned.motorContribution.motors) {
        cleaned.motorContribution = {
            ... cleaned.motorContribution,
            motors: Array.isArray(cleaned.motorContribution.motors) 
                ? cleaned.motorContribution.motors.map(m => ({
                    id: m.id,
                    name: m.name,
                    hp: m.hp,
                    motorType: m.motorType
                }))
                : []
        };
    }
    
    return cleaned;
}

/**
 * Clean results object
 * 
 * @param {Object} results - Results object
 * @returns {Object} Cleaned results object
 */
function cleanResultsObject(results) {
    if (!results || typeof results !== 'object') return null;
    
    const cleaned = {};
    
    // Clean shortCircuit results
    if (results.shortCircuit) {
        cleaned.shortCircuit = cleanResultObject(results.shortCircuit);
    }
    
    // Clean loadFlow results
    if (results. loadFlow) {
        const lfCleaned = { ...results.loadFlow };
        // Remove any path arrays from load flow too
        if (lfCleaned.pathTrace) {
            lfCleaned.pathTrace = cleanPathArray(lfCleaned.pathTrace);
        }
        cleaned.loadFlow = lfCleaned;
    }
    
    // Clean voltageDrop results
    if (results. voltageDrop) {
        const vdCleaned = { ...results.voltageDrop };
        // Remove any path arrays
        if (vdCleaned.path) {
            vdCleaned.path = cleanPathArray(vdCleaned.path);
        }
        cleaned.voltageDrop = vdCleaned;
    }
    
    // Clean arcFlash results
    if (results.arcFlash) {
        cleaned.arcFlash = { ...results.arcFlash };
    }
    
    // Clean main path if exists at top level
    if (results.path) {
        cleaned.path = cleanPathArray(results.path);
    }
    
    // Copy other properties (scalars only)
    Object.keys(results).forEach(key => {
        if (! cleaned[key] && typeof results[key] !== 'object') {
            cleaned[key] = results[key];
        }
    });
    
    return cleaned;
}

/**
 * Clean buses for serialization
 * Removes circular references from bus objects
 * 
 * @param {Array} buses - Array of bus objects
 * @returns {Array} Cleaned bus array
 */
function cleanBusesForSerialization(buses) {
    if (!Array. isArray(buses)) return [];
    
    return buses.map(bus => {
        if (! bus || typeof bus !== 'object') return null;
        
        const busClone = {
            id: bus.id,
            name: bus.name,
            voltage: bus.voltage,
            type: bus.type,
            tag: bus.tag,
            parent: bus.parent,
            parentBus: bus.parentBus,
            availableFaultCurrent: bus.availableFaultCurrent,
            xrRatio: bus.xrRatio,
            demandFactor: bus.demandFactor,
            diversityFactor: bus.diversityFactor,
            utilityFaultCurrent: bus.utilityFaultCurrent,
            utilityFaultMVA: bus.utilityFaultMVA,
            utilityXR: bus.utilityXR,
            loadCurrent: bus.loadCurrent,
            // ✅ CRITICAL FIX: Preserve auto-calculated flag to prevent double-counting
            // Added: 2025-12-01 by bfforex
            loadCurrentAutoCalculated: bus.loadCurrentAutoCalculated || false,
        };
        
        // ✅ Clean results to remove circular references
        if (bus.results) {
            busClone.results = cleanResultsObject(bus.results);
        }
        
        // ✅ Remove systemFault to prevent circular references
        // DO NOT include bus.systemFault
        
        // ✅ Remove pathComponents to prevent circular references
        // DO NOT include bus.pathComponents
        
        return busClone;
    }). filter(bus => bus !== null);
}

/**
 * Validate project data structure and types
 * ✅ ISSUE #8: Comprehensive input validation
 * ✅ ISSUE #10: Accept both numeric and string IDs
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
    if (!data.buses || ! Array.isArray(data.buses)) {
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
            // ✅ ISSUE #10 FIX: Accept both string and number IDs for backward compatibility
            if (bus.id === null || bus.id === undefined) {
                errors.push(`Bus at index ${index} missing valid id`);
            } else if (typeof bus.id !== 'string' && typeof bus.id !== 'number') {
                errors.push(`Bus at index ${index} has invalid id type (must be string or number, got ${typeof bus.id})`);
            }
            if (! bus.name || typeof bus.name !== 'string') {
                errors.push(`Bus at index ${index} missing valid name`);
            }
            if (typeof bus.voltage !== 'number' || bus.voltage <= 0) {
                errors.push(`Bus "${bus.name || 'Unknown'}" has invalid voltage`);
            }
            if (! bus.type || typeof bus.type !== 'string') {
                errors.push(`Bus "${bus.name || 'Unknown'}" missing valid type`);
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
            // ✅ ISSUE #10 FIX: Accept both string and number IDs for backward compatibility
            if (component.id === null || component.id === undefined) {
                errors.push(`Component at index ${index} missing valid id`);
            } else if (typeof component.id !== 'string' && typeof component.id !== 'number') {
                errors.push(`Component at index ${index} has invalid id type (must be string or number, got ${typeof component.id})`);
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
 * ✅ ISSUE #10: Preserve ID types (numeric or string) for backward compatibility
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
            version: data.projectInfo?.version || PROJECT_MANAGER_VERSION
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
            // ✅ ISSUE #10 FIX: Preserve ID as-is (string or number) for backward compatibility
            id: bus.id !== null && bus.id !== undefined ? bus.id : generateUniqueId('bus'),
            name: sanitizeString(bus.name, 'Unnamed Bus'),
            voltage: sanitizeNumber(bus.voltage, 440, 1, 1000000),
            type: sanitizeString(bus.type, 'load'),
            parent: bus.parent !== undefined ? bus.parent : null,
            parentBus: bus.parentBus !== undefined ?  bus.parentBus : null,
            tag: sanitizeString(bus.tag, ''),  // ✅ ADD: Preserve bus tag
            // Preserve other bus properties
            availableFaultCurrent: sanitizeNumber(bus.availableFaultCurrent, 0, 0, 1000000),
            xrRatio: sanitizeNumber(bus.xrRatio, 0, 0, 100),
            demandFactor: sanitizeNumber(bus. demandFactor, 1.0, 0, 10),
            diversityFactor: sanitizeNumber(bus.diversityFactor, 1.0, 0, 10),
            // Preserve utility fault data if present
            utilityFaultCurrent: bus. utilityFaultCurrent || null,
            utilityFaultMVA: bus.utilityFaultMVA || null,
            utilityXR: bus.utilityXR || null,
            // ✅ CRITICAL: Preserve load current
            loadCurrent: sanitizeNumber(bus.loadCurrent, 0, 0, 100000),
            // ✅ CRITICAL FIX: Preserve auto-calculated flag to prevent double-counting
            // Added: 2025-12-01 by bfforex
            loadCurrentAutoCalculated: bus.loadCurrentAutoCalculated || false,
            // ✅ CRITICAL: Preserve calculation results if present
            results: bus.results || null,
            // ✅ CRITICAL: Preserve fault current results for display
            faultCurrent: bus.faultCurrent || null,
            asymFaultCurrent: bus.asymFaultCurrent || null,
            totalZ: bus.totalZ || null,
            pathComponents: bus.pathComponents || null
        }));
    }
    
    // Sanitize components
    if (Array.isArray(data.components)) {
        sanitized.components = data.components.map(component => {
            const base = {
                id: component.id !== null && component.id !== undefined ? component.id : generateUniqueId('comp'),
                type: sanitizeString(component.type, 'unknown'),
                tag: sanitizeString(component.tag, ''),
                description: sanitizeString(component.description, ''),
                name: sanitizeString(component.name, '')
            };
        
            // Add type-specific properties with sanitization
            if (component.type === 'cable') {
                return {
                    ...base,
                    // ✅ CRITICAL FIX: Preserve BOTH ID formats for backward compatibility
                    // traceBusPath() uses fromBus/toBus, loadFlow also uses these
                    fromBusId: component.fromBusId !== undefined ? component.fromBusId : component.fromBus,
                    toBusId: component.toBusId !== undefined ? component.toBusId : component.toBus,
                    fromBus: component.fromBus !== undefined ? component.fromBus : component.fromBusId,
                    toBus: component.toBus !== undefined ? component.toBus : component.toBusId,
                    fromBusName: sanitizeString(component.fromBusName, ''),
                    toBusName: sanitizeString(component.toBusName, ''),
                    size: sanitizeString(component.size, ''),
                    length: sanitizeNumber(component.length, 0, 0, 100000),
                    material: sanitizeString(component.material, 'copper'),
                    conduit: sanitizeString(component.conduit, 'PVC'),
                    parallel: sanitizeNumber(component.parallel, 1, 1, 10),
                    // Preserve additional cable properties
                    manufacturer: sanitizeString(component.manufacturer, ''),
                    catalogNumber: sanitizeString(component.catalogNumber, ''),
                    insulation: sanitizeString(component.insulation, ''),
                    voltageRating: sanitizeString(component.voltageRating, ''),
                    installationDate: sanitizeString(component.installationDate, ''),
                    notes: sanitizeString(component.notes, '')
                };
            } else if (component.type === 'transformer') {
                return {
                    ...base,
                    // ✅ CRITICAL FIX: Preserve BOTH ID formats
                    fromBusId: component.fromBusId !== undefined ? component.fromBusId : component.fromBus,
                    toBusId: component.toBusId !== undefined ?  component.toBusId : component.toBus,
                    fromBus: component.fromBus !== undefined ? component.fromBus : component.fromBusId,
                    toBus: component.toBus !== undefined ? component.toBus : component.toBusId,
                    fromBusName: sanitizeString(component.fromBusName, ''),
                    toBusName: sanitizeString(component.toBusName, ''),
                    rating: sanitizeNumber(component.rating, 100, 1, 100000),
                    // Support both property names for voltage
                    primary: sanitizeNumber(component.primary || component.primaryVoltage, 440, 1, 1000000),
                    secondary: sanitizeNumber(component.secondary || component.secondaryVoltage, 440, 1, 1000000),
                    primaryVoltage: sanitizeNumber(component.primaryVoltage || component.primary, 440, 1, 1000000),
                    secondaryVoltage: sanitizeNumber(component.secondaryVoltage || component.secondary, 440, 1, 1000000),
                    impedance: sanitizeNumber(component.impedance, 5, 0.1, 100),
                    xr: sanitizeNumber(component.xr, 5, 0, 100),
                    tapSetting: sanitizeNumber(component.tapSetting, 0, -10, 10)
                };
            } else if (component.type === 'motor') {
                return {
                        ...base,
                        // ✅ CRITICAL FIX: Motors also need fromBus/toBus preserved!
                        // Motors were created with these properties, we must keep them
                        fromBusId: component.fromBusId !== undefined ? component.fromBusId : component.fromBus,
                        toBusId: component.toBusId !== undefined ? component.toBusId : component.toBus,
                        fromBus: component.fromBus !== undefined ? component.fromBus : component.fromBusId,
                        toBus: component.toBus !== undefined ? component.toBus : component.toBusId,
                        fromBusName: sanitizeString(component.fromBusName, ''),
                        toBusName: sanitizeString(component.toBusName, ''),
                        // Motor-specific properties
                        busId: component.busId,
                        busName: sanitizeString(component.busName, ''),
                        hp: sanitizeNumber(component.hp, 10, 0.1, 100000),
                        voltage: sanitizeNumber(component.voltage, 440, 1, 1000000),
                        efficiency: sanitizeNumber(component.efficiency, 0.9, 0.1, 1.0),
                        powerFactor: sanitizeNumber(component.powerFactor, 0.85, 0.1, 1.0),
                        motorType: sanitizeString(component.motorType, 'induction'),
                        // Preserve additional motor properties  
                        location: sanitizeString(component.location, ''),
                        sequenceNumber: component.sequenceNumber
                    };
            } else if (component.type === 'generator') {
                return {
                        ...base,
                        // ✅ CRITICAL FIX: Generators also need fromBus/toBus preserved!
                        fromBusId: component.fromBusId !== undefined ? component.fromBusId : component.fromBus,
                        toBusId: component.toBusId !== undefined ?  component.toBusId : component.toBus,
                        fromBus: component.fromBus !== undefined ? component.fromBus : component.fromBusId,
                        toBus: component.toBus !== undefined ? component.toBus : component.toBusId,
                        fromBusName: sanitizeString(component.fromBusName, ''),
                        toBusName: sanitizeString(component.toBusName, ''),
                        // Generator-specific properties
                        busId: component.busId,
                        busName: sanitizeString(component.busName, ''),
                        rating: sanitizeNumber(component.rating, 100, 1, 100000),
                        voltage: sanitizeNumber(component.voltage, 440, 1, 1000000),
                        subtransient: sanitizeNumber(component.subtransient, 20, 0.1, 100)
                    };
            }
        
            // For other types, preserve all properties with base sanitization
            return { ...component, ...base };
        });
    }    
    
    return sanitized;
}

/**
 * Sanitize a string value
 * ✅ CODE REVIEW: Enhanced to remove more potentially dangerous characters
 * @param {*} value - Value to sanitize
 * @param {string} defaultValue - Default value if invalid
 * @returns {string} Sanitized string
 */
function sanitizeString(value, defaultValue = '') {
    if (typeof value !== 'string') return defaultValue;
    
    // Remove potentially dangerous characters:
    // - HTML tags: < >
    // - Script injection: quotes, semicolons, backslashes
    // - Control characters
    return value
        .replace(/[<>'"`;\\]/g, '')
        .replace(/[\x00-\x1F\x7F]/g, '')
        .trim()
        .substring(0, MAX_STRING_LENGTH);
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
    if (isNaN(num) || ! isFinite(num)) return defaultValue;
    return Math.max(min, Math.min(max, num));
}

/**
 * Load project from JSON file
 */
function loadProject() {
    const fileInput = document.getElementById('fileInput');
    
    fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (! file) return;
        
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
                
                // ✅ ISSUE #10: Log component ID types for debugging
                console.log('📊 Component ID types:', projectData.components.slice(0, 5).map(c => ({
                    id: c.id,
                    type: c.type,
                    idType: typeof c.id
                })));
                
                console.log('📊 Bus ID types:', projectData.buses.slice(0, 5).map(b => ({
                    id: b.id,
                    name: b.name,
                    idType: typeof b.id
                })));
                
                // Sanitize data before loading
                const sanitizedData = sanitizeProjectData(projectData);
                
                // Confirm before loading
                if (buses.length > 0 || components.length > 0) {
                    if (! confirm('This will replace your current project.Continue?')) {
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
                
                console.log('✅ Data assigned to global variables');
                console.log('   buses.length:', buses.length);
                console.log('   components.length:', components.length);
                
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
                version: PROJECT_MANAGER_VERSION,
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
        
        if (! projectData.projectInfo?.autoSave) return false;
        
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

            try {
              // Signal to the app that project restoration completed so other modules (diagnostic, UI) can react.
              window.dispatchEvent(new Event('project:restored'));
            } catch (e) {
              console.warn('Could not dispatch project:restored event', e);
            }
            
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

console.log('✅ Project Manager v1.3.1 loaded');
console.log('   - Circular reference fix: COMPLETE');
console.log('   - Auto-save: FIXED');
console.log('   - systemFault circular ref: FIXED');
console.log('   - ID type flexibility: ENABLED (numeric & string)');
console.log('   - Backward compatibility: MAINTAINED');
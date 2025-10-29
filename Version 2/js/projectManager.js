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
                
                // Validate data
                if (!projectData.buses || !projectData.components) {
                    throw new Error('Invalid project file format');
                }
                
                // Confirm before loading
                if (buses.length > 0 || components.length > 0) {
                    if (!confirm('This will replace your current project. Continue?')) {
                        fileInput.value = '';
                        return;
                    }
                }
                
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
                
                // Reset selected bus
                selectedBusId = null;
                
                console.log('✅ Project loaded successfully');
                
                alert(`✅ Project loaded successfully!\n\nName: ${projectData.projectInfo?.name || 'Untitled'}\nBuses: ${buses.length}\nComponents: ${components.length}`);
                
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
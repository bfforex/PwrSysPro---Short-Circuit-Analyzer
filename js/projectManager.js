/**
 * Project Manager Module
 * Handles saving and loading of project data
 * 
 * @author bfforex
 * @date 2025-10-28 05:25:08 UTC
 * @version 1.1.0
 * @fixed Circular reference in JSON serialization
 */

/**
 * Save project to JSON file
 * Enhanced: 2025-10-28 05:25:08 UTC by bfforex
 * Fixed: Removes circular references before serialization
 */
function saveProject() {
    try {
        const projectName = document.getElementById('projectName').value || 'Untitled Project';
        const engineer = document.getElementById('engineer').value || 'Unknown';
        const projectNumber = document.getElementById('projectNumber').value || '';
        
        logger.info('Saving project...');
        
        // ═══════════════════════════════════════════════════════════
        // 🔥 FIX: Remove circular references from buses
        // Added: 2025-10-28 05:25:08 UTC by bfforex
        // ═══════════════════════════════════════════════════════════
        const busesClean = buses.map(bus => {
            const busClone = { ...bus };
            
            // If results exist, clean the path to prevent circular references
            if (busClone.results) {
                const resultsClean = { ...busClone.results };
                
                // Clean shortCircuit path
                if (resultsClean.shortCircuit && resultsClean.shortCircuit.path) {
                    resultsClean.shortCircuit.path = resultsClean.shortCircuit.path.map(segment => ({
                        bus: {
                            id: segment.bus.id,
                            name: segment.bus.name,
                            voltage: segment.bus.voltage,
                            type: segment.bus.type
                            // Don't include 'results' property
                        },
                        component: segment.component ? {
                            id: segment.component.id,
                            type: segment.component.type,
                            name: segment.component.name
                        } : null
                    }));
                }
                
                // Clean main path if exists
                if (resultsClean.path) {
                    resultsClean.path = resultsClean.path.map(segment => ({
                        bus: {
                            id: segment.bus.id,
                            name: segment.bus.name,
                            voltage: segment.bus.voltage,
                            type: segment.bus.type
                        },
                        component: segment.component ? {
                            id: segment.component.id,
                            type: segment.component.type,
                            name: segment.component.name
                        } : null
                    }));
                }
                
                // Clean loadFlow path if exists
                if (resultsClean.loadFlow && resultsClean.loadFlow.pathTrace) {
                    resultsClean.loadFlow.pathTrace = resultsClean.loadFlow.pathTrace.map(trace => ({
                        depth: trace.depth,
                        bus: trace.bus,
                        voltage: trace.voltage,
                        loads: trace.loads || []
                    }));
                }
                
                // Clean voltageDrop components if exists
                if (resultsClean.voltageDrop && resultsClean.voltageDrop.components) {
                    resultsClean.voltageDrop.components = resultsClean.voltageDrop.components.map(comp => {
                        const compClean = { ...comp };
                        // Remove any circular references in component data
                        return compClean;
                    });
                }
                
                busClone.results = resultsClean;
            }
            
            // Clean pathComponents if exists
            if (busClone.pathComponents) {
                busClone.pathComponents = busClone.pathComponents.map(pc => ({
                    sequence: pc.sequence,
                    bus: {
                        id: pc.bus.id,
                        name: pc.bus.name,
                        voltage: pc.bus.voltage,
                        type: pc.bus.type
                    },
                    component: pc.component ? {
                        id: pc.component.id,
                        type: pc.component.type,
                        name: pc.component.name
                    } : null
                }));
            }
            
            return busClone;
        });
        
        // Create project data object
        const projectData = {
            projectInfo: {
                name: projectName,
                engineer: engineer,
                projectNumber: projectNumber,
                savedDate: new Date().toISOString(),
                version: '1.1.0'
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
        
        logger.info('Project saved successfully');
        logger.info(`   File: ${a.download}`);
        logger.info(`   Buses: ${busesClean.length}`);
        logger.info(`   Components: ${components.length}`);
        
        alert(`✅ Project saved successfully!\n\nFile: ${a.download}\nBuses: ${busesClean.length}\nComponents: ${components.length}`);
        
    } catch (error) {
        logger.error('Save failed:', error);
        logger.error('Stack trace:', error.stack);
        alert(`❌ Failed to save project:\n\n${error.message}\n\nCheck browser console for details.`);
    }
}

/**
 * Load project from JSON file
 */
function loadProject() {
    const fileInput = document.getElementById('fileInput');
    
    fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        logger.info('Loading project:', file.name);
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const projectData = JSON.parse(e.target.result);
                
                logger.info('Project data loaded');
                logger.info('   Version:', projectData.projectInfo?.version || 'Unknown');
                logger.info('   Buses:', projectData.buses?.length || 0);
                logger.info('   Components:', projectData.components?.length || 0);
                
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
                updateComponentsList();
                updateBusesContent();
                
                // Reset selected bus
                selectedBusId = null;
                
                logger.info('✅ Project loaded successfully');
                
                alert(`✅ Project loaded successfully!\n\nName: ${projectData.projectInfo?.name || 'Untitled'}\nBuses: ${buses.length}\nComponents: ${components.length}`);
                
            } catch (error) {
                logger.error('❌ Load failed:', error);
                logger.error('Stack trace:', error.stack);
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
 * Fixed: 2025-10-28 05:33:32 UTC by bfforex
 * Added: Defensive checks for undefined properties
 * Enhanced: 2026-02-03 - Strip calculation results to reduce size and avoid quota errors
 */
function autoSaveToLocalStorage() {
    try {
        const projectName = document.getElementById('projectName').value || 'Untitled Project';
        
        logger.debug('Auto-saving to localStorage...');
        
        // ═══════════════════════════════════════════════════════════
        // 🔥 ENHANCED: Strip calculation results to save space
        // Auto-save only essential data - results can be recalculated
        // Added: 2026-02-03 to fix quota exceeded error
        // ═══════════════════════════════════════════════════════════
        const busesClean = buses.map(bus => {
            const busClone = { ...bus };
            
            // Remove results entirely from auto-save to save space
            // Results can be recalculated after restore
            delete busClone.results;
            delete busClone.pathComponents;
            
            return busClone;
        });
        
        const projectData = {
            projectInfo: {
                name: projectName,
                engineer: document.getElementById('engineer').value || '',
                projectNumber: document.getElementById('projectNumber').value || '',
                savedDate: new Date().toISOString(),
                version: '1.1.1',
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
        const sizeKB = (json.length / 1024).toFixed(2);
        
        // Check if data size is approaching localStorage limit (typically 5-10MB)
        // Warn if > 4MB, which should never happen with stripped results
        if (json.length > 4 * 1024 * 1024) {
            logger.warn(`Auto-save data is large: ${sizeKB} KB`);
            logger.warn('   Consider reducing project complexity or using manual save');
        }
        
        localStorage.setItem('pwrsyspro_autosave', json);
        
        logger.debug('Auto-saved to localStorage successfully');
        logger.debug(`   Buses: ${busesClean.length}`);
        logger.info(`   Components: ${components.length}`);
        logger.debug(`   Size: ${sizeKB} KB`);
        
    } catch (error) {
        // Handle quota exceeded error gracefully
        if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
            logger.warn('Auto-save failed: Storage quota exceeded');
            logger.warn('   Tip: Use manual save (Save Project button) to download project file');
            
            // Show user-friendly message
            const indicator = document.getElementById('autoSaveIndicator');
            if (indicator) {
                indicator.textContent = '⚠️ Auto-save disabled (project too large)';
                indicator.style.opacity = '1';
                indicator.style.backgroundColor = '#ff9800';
                setTimeout(() => {
                    indicator.style.opacity = '0';
                }, 5000);
            }
        } else {
            logger.warn('Auto-save failed:', error.message);
            logger.warn('Stack trace:', error.stack);
        }
        // Don't throw error - auto-save failure shouldn't break the app
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
        
        logger.info('Auto-saved project found');
        logger.info('   Saved:', savedDate.toLocaleString());
        logger.info('   Hours ago:', hoursDiff.toFixed(1));
        
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
            updateComponentsList();
            updateBusesContent();
            
            logger.info('Auto-saved project restored');
            
            return true;
        }
        
        return false;
        
    } catch (error) {
        logger.error('Failed to load auto-saved project:', error);
        return false;
    }
}

// Export functions
window.saveProject = saveProject;
window.loadProject = loadProject;
window.scheduleAutoSave = scheduleAutoSave;
window.autoSaveToLocalStorage = autoSaveToLocalStorage;
window.loadAutoSavedProject = loadAutoSavedProject;

logger.info('Project Manager loaded');
logger.info('   - Version: 1.1.1');
logger.info('   - Auto-save optimization: ENABLED (results stripped)');
logger.info('   - Quota check: ENABLED');
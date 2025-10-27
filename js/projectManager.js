// Project Manager Module - Handles save/load operations

/**
 * Save project to file
 */
function saveProject() {
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
        
        const json = JSON.stringify(projectData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = projectData.projectName || 'project';
        a.download = `${fileName.replace(/\s+/g, '_')}_MultiBus_v${VERSION}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        alert('Project saved successfully!');
        console.log('✅ Project saved successfully');
    } catch (error) {
        console.error('❌ Save failed:', error);
        alert('Error saving project:\n\n' + error.message);
    }
}

/**
 * Load project from file
 */
function loadProject() {
    document.getElementById('fileInput').click();
}

/**
 * Initialize file input listener
 */
function initFileInputListener() {
    document.getElementById('fileInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const projectData = JSON.parse(e.target.result);
                
                document.getElementById('projectName').value = projectData.projectName || '';
                document.getElementById('projectNumber').value = projectData.projectNumber || '';
                document.getElementById('engineer').value = projectData.engineer || 'Engr. B. P. Faraon';
                
                if (projectData.method) {
                    const el = document.querySelector(`input[name="method"][value="${projectData.method}"]`);
                    if (el) el.checked = true;
                }
                
                if (projectData.projectLoadCurrent !== undefined) 
                    document.getElementById('loadCurrent').value = projectData.projectLoadCurrent;
                if (projectData.projectPF !== undefined) 
                    document.getElementById('powerFactor').value = projectData.projectPF;
                if (projectData.voltageDropLimit !== undefined) 
                    document.getElementById('voltageDropLimit').value = projectData.voltageDropLimit;
                if (projectData.temperature !== undefined) 
                    document.getElementById('temperature').value = projectData.temperature;
                
                buses = projectData.buses || [];
                components = projectData.components || [];
                
                updateBusTree();
                updateBusDropdowns();
                updateComponentsList();
                updateBusesContent();
                
                alert('Project loaded successfully!');
            } catch (error) {
                alert('Error loading project file:\n\n' + error.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });
}

/**
 * Load auto-saved project on startup
 */
function loadAutoSavedProject() {
    const autoSaved = localStorage.getItem('multiBusProject');
    if (autoSaved && confirm('Found auto-saved project. Would you like to restore it?')) {
        try {
            const projectData = JSON.parse(autoSaved);
            document.getElementById('projectName').value = projectData.projectName || '';
            document.getElementById('projectNumber').value = projectData.projectNumber || '';
            document.getElementById('engineer').value = projectData.engineer || 'Engr. B. P. Faraon';
            if (projectData.method) {
                const el = document.querySelector(`input[name="method"][value="${projectData.method}"]`);
                if (el) el.checked = true;
            }
            if (projectData.projectLoadCurrent !== undefined) 
                document.getElementById('loadCurrent').value = projectData.projectLoadCurrent;
            if (projectData.projectPF !== undefined) 
                document.getElementById('powerFactor').value = projectData.projectPF;
            if (projectData.voltageDropLimit !== undefined) 
                document.getElementById('voltageDropLimit').value = projectData.voltageDropLimit;
            if (projectData.temperature !== undefined) 
                document.getElementById('temperature').value = projectData.temperature;
            buses = projectData.buses || [];
            components = projectData.components || [];
            updateBusTree();
            updateBusDropdowns();
            updateComponentsList();
            updateBusesContent();
        } catch (error) {
            console.error('Error restoring auto-saved project:', error);
        }
    }
}

/**
 * Add change listeners for auto-save
 */
function initAutoSaveListeners() {
    document.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('change', scheduleAutoSave);
    });
}
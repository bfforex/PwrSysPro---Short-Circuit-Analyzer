// Main Application Module - Initialization and event handlers

/**
 * Initialize the application
 */
function initApp() {
    console.log(`╔════════════════════════════════════════════════════════════════════════════╗`);
    console.log(`║  PwrSys Pro - Short Circuit Analyzer v${VERSION}                          ║`);
    console.log(`║  Multi-Bus Power System Analysis - NEC/PEC Compliant                      ║`);
    console.log(`╠════════════════════════════════════════════════════════════════════════════╣`);
    console.log(`║  Author: ${AUTHOR}                                            ║`);
    console.log(`║  Date/Time (UTC): 2025-01-27 01:54:57                                     ║`);
    console.log(`║  ✓ Parallel Transformer Support                                           ║`);
    console.log(`║  ✓ Point-to-Point Method                                                  ║`);
    console.log(`║  ✓ Per-Unit Method                                                        ║`);
    console.log(`║  ✓ Multi-Voltage Level Support                                            ║`);
    console.log(`║  ✓ Temperature Correction                                                 ║`);
    console.log(`╚════════════════════════════════════════════════════════════════════════════╝`);
    
    // Set author information
    document.getElementById('Author').textContent = AUTHOR;
    
    // Initialize theme
    initTheme();
    
    // Initialize component type selector
    initComponentTypeSelector();
    
    // Initialize file input listener
    initFileInputListener();
    
    // Initialize auto-save listeners
    initAutoSaveListeners();
    
    // Initialize modal click outside handler
    initModalClickOutside();
    
    // Initialize session time update
    updateSessionTime();
    setInterval(updateSessionTime, 1000);
    
    // Initialize calculate button
    document.getElementById('calculateBtn').addEventListener('click', calculateAllBuses);
    
    // Initialize keyboard shortcuts
    initKeyboardShortcuts();
    
    // Load auto-saved project
    loadAutoSavedProject();
}

/**
 * Initialize keyboard shortcuts
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+S or Cmd+S - Save project
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveProject();
        }
        // Ctrl+Enter or Cmd+Enter - Calculate all buses
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            calculateAllBuses();
        }
    });
}

/**
 * Clear all data and reset application
 * Added: 2025-10-27 17:03:47 UTC by bfforex
 * Fixed: Missing function error
 */
function clearAll() {
    if (!confirm('⚠️ WARNING: This will delete ALL buses, components, and calculations.\n\nThis action CANNOT be undone.\n\nAre you absolutely sure?')) {
        return;
    }
    
    // Second confirmation for safety
    if (!confirm('🔴 FINAL CONFIRMATION:\n\nDelete everything and start fresh?\n\nClick OK to proceed or Cancel to keep your data.')) {
        return;
    }
    
    console.log('🗑️ Clearing all data...');
    
    // Clear all arrays
    buses = [];
    components = [];
    selectedBusId = null;
    editingBusId = null;
    editingComponentId = null;
    
    // Clear localStorage
    localStorage.removeItem('pwrsyspro_autosave');
    localStorage.removeItem('reviewedRecommendations');
    localStorage.removeItem('actionPlan');
    
    // Reset UI inputs
    const projectName = document.getElementById('projectName');
    const engineer = document.getElementById('engineer');
    const projectNumber = document.getElementById('projectNumber');
    const loadCurrent = document.getElementById('loadCurrent');
    const powerFactor = document.getElementById('powerFactor');
    const voltageDropLimit = document.getElementById('voltageDropLimit');
    const temperature = document.getElementById('temperature');
    
    if (projectName) projectName.value = '';
    if (engineer) engineer.value = '';
    if (projectNumber) projectNumber.value = '';
    if (loadCurrent) loadCurrent.value = '100';
    if (powerFactor) powerFactor.value = '0.9';
    if (voltageDropLimit) voltageDropLimit.value = '3';
    if (temperature) temperature.value = '75';
    
    // Reset calculation method to default
    const methodPtp = document.getElementById('method-ptp');
    if (methodPtp) methodPtp.checked = true;
    
    // Update all displays
    updateBusTree();
    updateBusDropdowns();
    updateBusesContent();
    updateComponentsList();
    
    // Clear results
    const resultsContainer = document.getElementById('resultsContainer');
    const calculationSteps = document.getElementById('calculationSteps');
    
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="alert alert-info">Run calculation to see results here.</div>';
    }
    
    if (calculationSteps) {
        calculationSteps.innerHTML = '<div class="alert alert-info">Detailed calculations will appear here after running the analysis.</div>';
    }
    
    // Hide recommendations tab if visible
    const recTab = document.getElementById('recommendationsTabButton');
    if (recTab) {
        recTab.style.display = 'none';
    }
    
    // Switch to buses tab
    switchTab(null, 'buses');
    
    console.log('✅ All data cleared successfully');
    alert('✅ All data has been cleared.\n\nThe application has been reset to its initial state.');
}

/**
 * Clear only calculation results (keep buses and components)
 * Added: 2025-10-27 17:03:47 UTC by bfforex
 */
function clearResults() {
    if (!confirm('Clear all calculation results?\n\nThis will keep your buses and components but remove all fault current calculations.')) {
        return;
    }
    
    console.log('🧹 Clearing calculation results...');
    
    // Clear results from all buses
    buses.forEach(bus => {
        bus.faultCurrent = null;
        bus.asymFaultCurrent = null;
        bus.xrRatio = null;
        bus.totalZ = null;
        delete bus.results;
        delete bus.pathComponents;
    });
    
    selectedBusId = null;
    
    // Update displays
    updateBusTree();
    updateBusesContent();
    
    // Clear results display
    const resultsContainer = document.getElementById('resultsContainer');
    const calculationSteps = document.getElementById('calculationSteps');
    
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="alert alert-info">Run calculation to see results here.</div>';
    }
    
    if (calculationSteps) {
        calculationSteps.innerHTML = '<div class="alert alert-info">Detailed calculations will appear here after running the analysis.</div>';
    }
    
    // Hide recommendations tab
    const recTab = document.getElementById('recommendationsTabButton');
    if (recTab) {
        recTab.style.display = 'none';
    }
    
    scheduleAutoSave();
    
    console.log('✅ Calculation results cleared');
    alert('✅ Calculation results cleared.\n\nYour buses and components are still intact.');
}

/**
 * Initialize application on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing PwrSys Pro...');
    initApp();
});

/**
 * Export all functions to global scope
 */
window.clearAll = clearAll;
window.clearResults = clearResults;

console.log('✅ Main.js loaded successfully');
console.log('   - clearAll: Available');
console.log('   - clearResults: Available');
// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export functions to global scope for inline event handlers
window.openAddBusModal = openAddBusModal;
window.closeAddBusModal = closeAddBusModal;
window.toggleUtilityFields = toggleUtilityFields;
window.toggleUtilityInputMode = toggleUtilityInputMode;
window.toggleEditUtilityInputMode = toggleEditUtilityInputMode;
window.saveBus = saveBus;
window.editBus = editBus;
window.closeEditBusModal = closeEditBusModal;
window.saveBusEdits = saveBusEdits;
window.deleteBus = deleteBus;
window.selectBus = selectBus;
window.calculateBus = calculateBus;
window.addComponent = addComponent;
window.editComponent = editComponent;
window.closeEditComponentModal = closeEditComponentModal;
window.saveComponentEdits = saveComponentEdits;
window.moveComponent = moveComponent;
window.deleteComponent = deleteComponent;
window.clearAll = clearAll;
window.toggleTheme = toggleTheme;
window.switchTab = switchTab;
window.exportBusReport = exportBusReport;
window.exportAllBusesSummary = exportAllBusesSummary;
window.saveProject = saveProject;
window.loadProject = loadProject;

// ═══════════════════════════════════════════════════════════
// RECOMMENDATION SYSTEM EXPORTS
// Added: 2025-10-27 12:35:03 UTC by bfforex
// ═══════════════════════════════════════════════════════════
window.runSystemAnalytics = runSystemAnalytics;
window.viewCalculationSteps = viewCalculationSteps;
window.exportBusRecommendations = exportBusRecommendations;

console.log('✅ Recommendation system initialized');
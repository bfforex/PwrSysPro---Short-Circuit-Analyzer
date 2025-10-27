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
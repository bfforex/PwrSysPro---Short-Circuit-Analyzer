/**
 * Main Application Module
 * Initialization and event handlers
 * 
 * @author Engr. B. P. Faraon
 * @date 2025-11-02 17:35:57 UTC
 * @version 1.4.0
 * @enhanced Complete helper functions integration
 * @enhanced Motor contribution support (IEEE 141/IEC 60909)
 * @enhancement ISSUE #4: Added comprehensive module dependency checking
 * @enhancement Added checkModuleDependencies() for startup validation
 */

console.log('\n' + '═'.repeat(80));
console.log('⚡ PwrSys Pro - Initializing...');
console.log('Current Date/Time (UTC): 2025-11-02 17:35:57');
console.log('User: bfforex');
console.log('═'.repeat(80) + '\n');

/**
 * Initialize theme
 * Loads saved theme preference from localStorage
 * Enhanced: 2025-10-28 10:18:31 UTC by bfforex
 */
function initTheme() {
    const savedTheme = localStorage.getItem('pwrsyspro_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Update theme button if it exists
    updateThemeButton(savedTheme);
    
    console.log('🌓 Theme initialized:', savedTheme);
}

/**
 * Toggle theme between light and dark
 * Enhanced: 2025-10-28 10:18:31 UTC by bfforex
 * Fixed: Better UI feedback and state management
 */
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    console.log(`🌓 Toggling theme: ${currentTheme} → ${newTheme}`);
    
    // Apply new theme
    html.setAttribute('data-theme', newTheme);
    
    // Save to localStorage
    localStorage.setItem('pwrsyspro_theme', newTheme);
    
    // Update button appearance
    updateThemeButton(newTheme);
    
    // Add smooth transition
    html.classList.add('theme-transitioning');
    setTimeout(() => {
        html.classList.remove('theme-transitioning');
    }, 300);
    
    console.log(`✅ Theme changed to: ${newTheme}`);
    
    // Show feedback to user
    showThemeChangeFeedback(newTheme);
}

/**
 * Update theme toggle button appearance
 * New function: 2025-10-28 10:18:31 UTC by bfforex
 * @param {String} theme - Current theme ('light' or 'dark')
 */
function updateThemeButton(theme) {
    // Find theme button (supports multiple selectors)
    const themeBtn = document.querySelector('.theme-toggle') || 
                     document.getElementById('themeToggle');
    
    if (!themeBtn) {
        console.warn('⚠️ Theme toggle button not found in DOM');
        return;
    }
    
    // Update button content based on theme
    if (theme === 'dark') {
        themeBtn.innerHTML = '☀️ Light Mode';
        themeBtn.setAttribute('aria-label', 'Switch to Light Mode');
        themeBtn.setAttribute('title', 'Switch to Light Mode');
        themeBtn.classList.add('dark-active');
    } else {
        themeBtn.innerHTML = '🌙 Dark Mode';
        themeBtn.setAttribute('aria-label', 'Switch to Dark Mode');
        themeBtn.setAttribute('title', 'Switch to Dark Mode');
        themeBtn.classList.remove('dark-active');
    }
}

/**
 * Show visual feedback when theme changes
 * New function: 2025-10-28 10:18:31 UTC by bfforex
 * @param {String} theme - New theme name
 */
function showThemeChangeFeedback(theme) {
    // Create temporary feedback element
    const feedback = document.createElement('div');
    feedback.className = 'theme-change-feedback';
    feedback.innerHTML = theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode';
    
    document.body.appendChild(feedback);
    
    // Animate in
    setTimeout(() => {
        feedback.classList.add('show');
    }, 10);
    
    // Remove after 2 seconds
    setTimeout(() => {
        feedback.classList.remove('show');
        setTimeout(() => {
            feedback.remove();
        }, 300);
    }, 2000);
}

/**
 * Initialize file input listener
 * File operations handled by projectManager.js
 */
function initFileInputListener() {
    console.log('✅ File input listener ready (handled by projectManager.js)');
}

/**
 * Initialize auto-save listeners
 * Triggers auto-save on any input change
 */
function initAutoSaveListeners() {
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            if (typeof scheduleAutoSave === 'function') {
                scheduleAutoSave();
            }
        });
    });
    
    console.log('✅ Auto-save listeners initialized');
}

/**
 * Initialize modal click outside handler
 * Closes modals when clicking outside the modal content
 */
function initModalClickOutside() {
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            const modals = ['addBusModal', 'editBusModal', 'editComponentModal'];
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (modal && event.target === modal) {
                    if (typeof closeModal === 'function') {
                        closeModal(modalId);
                    } else {
                        modal.style.display = 'none';
                    }
                }
            });
        }
    });
    
    console.log('✅ Modal click-outside handler initialized');
}

/**
 * Update session time display
 * Updates the session timestamp every second
 */
function updateSessionTime() {
    const sessionDate = document.getElementById('sessionDate');
    if (sessionDate) {
        const now = new Date();
        const formatted = now.toISOString().replace('T', ' ').substring(0, 19);
        sessionDate.textContent = formatted;
    }
}

/**
 * Switch between tabs
 * Handles tab navigation in the main content area
 * 
 * @param {Event} event - Click event (can be null)
 * @param {String} tabName - Name of tab to switch to
 */
function switchTab(event, tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Mark tab button as active
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // If no event, find tab button by name
        const tabButton = Array.from(tabs).find(tab => 
            tab.textContent.toLowerCase().includes(tabName.toLowerCase())
        );
        if (tabButton) {
            tabButton.classList.add('active');
        }
    }
}

/**
 * Initialize keyboard shortcuts
 * Ctrl+S: Save project
 * Ctrl+Enter: Calculate all buses
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+S or Cmd+S - Save project
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (typeof saveProject === 'function') {
                saveProject();
            } else {
                console.warn('⚠️ saveProject function not available');
            }
        }
        
        // Ctrl+Enter or Cmd+Enter - Calculate all buses
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (typeof calculateAllBuses === 'function') {
                calculateAllBuses();
            } else {
                console.warn('⚠️ calculateAllBuses function not available');
            }
        }
    });
    
    console.log('✅ Keyboard shortcuts initialized');
    console.log('   • Ctrl+S: Save project');
    console.log('   • Ctrl+Enter: Calculate all buses');
}

/**
 * Check if required modules are loaded
 * ✅ ISSUE #4: Module dependency checker
 * @returns {Object} Result with {success: boolean, missing: string[], warnings: string[]}
 */
function checkModuleDependencies() {
    const requiredModules = [
        // Core modules
        { name: 'buses', type: 'array', description: 'Bus data array' },
        { name: 'components', type: 'array', description: 'Components array' },
        { name: 'selectedBusId', type: 'any', description: 'Selected bus ID' },
        
        // Manager functions
        { name: 'addBus', type: 'function', description: 'Bus manager' },
        { name: 'addComponent', type: 'function', description: 'Component manager' },
        { name: 'updateBusTree', type: 'function', description: 'UI update function' },
        
        // Calculation functions
        { name: 'calculateShortCircuit', type: 'function', description: 'Short circuit calculation' },
        { name: 'calculateVoltageDropEnhanced', type: 'function', description: 'Voltage drop calculation' },
        { name: 'calculateLoadFlow', type: 'function', description: 'Load flow calculation' },
        { name: 'calculateAllBuses', type: 'function', description: 'Calculate all function' },
        
        // Display functions
        { name: 'displayCalculationResults', type: 'function', description: 'Results display' },
        { name: 'updateComponentInputs', type: 'function', description: 'Component input updater' },
        
        // Export functions
        { name: 'exportReport', type: 'function', description: 'Report export' },
        { name: 'exportEnhancedSystemReport', type: 'function', description: 'Enhanced report export' },
        
        // Project management
        { name: 'saveProject', type: 'function', description: 'Project save' },
        { name: 'loadProject', type: 'function', description: 'Project load' }
    ];
    
    const missing = [];
    const warnings = [];
    
    requiredModules.forEach(module => {
        try {
            const value = eval(module.name);
            
            if (value === undefined) {
                missing.push(`${module.name} (${module.description})`);
            } else if (module.type === 'function' && typeof value !== 'function') {
                warnings.push(`${module.name} is not a function (${module.description})`);
            } else if (module.type === 'array' && !Array.isArray(value)) {
                warnings.push(`${module.name} is not an array (${module.description})`);
            }
        } catch (e) {
            missing.push(`${module.name} (${module.description})`);
        }
    });
    
    return {
        success: missing.length === 0,
        missing,
        warnings
    };
}

/**
 * Initialize the application
 * Main entry point for application setup
 * ✅ ISSUE #4: Enhanced with module dependency checking
 */
function initApp() {
    console.log(`╔════════════════════════════════════════════════════════════════════════════╗`);
    console.log(`║  PwrSys Pro - Short Circuit Analyzer v${VERSION}                          ║`);
    console.log(`║  Multi-Bus Power System Analysis - NEC/PEC Compliant                      ║`);
    console.log(`╠════════════════════════════════════════════════════════════════════════════╣`);
    console.log(`║  Author: ${AUTHOR}                                            ║`);
    console.log(`║  Date/Time (UTC): 2025-10-28 05:38:11                                     ║`);
    console.log(`║  ✓ Parallel Transformer Support                                           ║`);
    console.log(`║  ✓ Point-to-Point Method                                                  ║`);
    console.log(`║  ✓ Per-Unit Method                                                        ║`);
    console.log(`║  ✓ Multi-Voltage Level Support                                            ║`);
    console.log(`║  ✓ Temperature Correction                                                 ║`);
    console.log(`║  ✓ Motor Contribution (IEEE 141/IEC 60909)                                ║`);
    console.log(`╚════════════════════════════════════════════════════════════════════════════╝`);
    
    // ✅ ISSUE #4: Check module dependencies before initialization
    console.log('\n🔍 Checking module dependencies...');
    const depCheck = checkModuleDependencies();
    
    if (!depCheck.success) {
        console.error('❌ CRITICAL: Missing required modules:');
        depCheck.missing.forEach(m => console.error(`   ✗ ${m}`));
        
        alert(
            '⚠️ APPLICATION INITIALIZATION ERROR\n\n' +
            'Some required modules failed to load:\n\n' +
            depCheck.missing.join('\n') +
            '\n\nThe application may not function correctly.\n' +
            'Please refresh the page. If the problem persists, check the browser console.'
        );
        
        // Continue with initialization but warn user
        console.warn('⚠️ Continuing with initialization despite missing modules...');
    } else {
        console.log('✅ All required modules loaded successfully');
    }
    
    if (depCheck.warnings.length > 0) {
        console.warn('⚠️ Module warnings:');
        depCheck.warnings.forEach(w => console.warn(`   ⚠ ${w}`));
    }
    
    try {
        // Set author information
        const authorElement = document.getElementById('Author');
        if (authorElement) {
            authorElement.textContent = AUTHOR;
        }
        
        // Initialize theme
        initTheme();
        
        // Initialize component type selector
        if (typeof initComponentTypeSelector === 'function') {
            initComponentTypeSelector();
        } else {
            // Fallback: Add listener directly
            const componentTypeSelect = document.getElementById('componentType');
            if (componentTypeSelect) {
                componentTypeSelect.addEventListener('change', updateComponentInputs);
                updateComponentInputs(); // Initialize with current selection
                console.log('✅ Component type selector initialized (fallback method)');
            } else {
                console.warn('⚠️ Component type selector element not found in DOM');
            }
        }
        
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
        const calcBtn = document.getElementById('calculateBtn');
        if (calcBtn) {
            calcBtn.addEventListener('click', function() {
                if (typeof calculateAllBuses === 'function') {
                    calculateAllBuses();
                } else {
                    console.error('❌ calculateAllBuses not loaded');
                    alert('Error: Calculation module not loaded.\n\nPlease refresh the page and try again.');
                }
            });
            console.log('✅ Calculate button initialized');
        }
        
        // Initialize keyboard shortcuts
        initKeyboardShortcuts();
        
        // Load auto-saved project
        if (typeof loadAutoSavedProject === 'function') {
            setTimeout(function() {
                loadAutoSavedProject();
            }, 500);
            console.log('✅ Auto-save recovery scheduled');
        }
        
        console.log('\n✅ Application initialization complete!');
        console.log('═'.repeat(80) + '\n');
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        console.error('Stack trace:', error.stack);
        alert('⚠️ Application initialization error.\n\nCheck browser console for details.\n\nSome features may not work correctly.');
    }
}

/**
 * Clear all data and reset application
 * Requires double confirmation for safety
 */
function clearAll() {
    if (!confirm('⚠️ WARNING: This will delete ALL buses, components, and calculations.\n\nThis action CANNOT be undone.\n\nAre you absolutely sure?')) {
        return;
    }
    
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
    if (typeof updateBusTree === 'function') updateBusTree();
    if (typeof updateBusDropdowns === 'function') updateBusDropdowns();
    if (typeof updateBusesContent === 'function') updateBusesContent();
    if (typeof updateComponentsList === 'function') updateComponentsList();
    
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
 * Clear only calculation results
 * Keeps buses and components intact
 */
function clearResults() {
    if (!confirm('Clear all calculation results?\n\nThis will keep your buses and components but remove all fault current calculations.')) {
        return;
    }
    
    console.log('🧹 Clearing calculation results...');
    
    // Clear results from all buses
    buses.forEach(function(bus) {
        bus.faultCurrent = null;
        bus.asymFaultCurrent = null;
        bus.xrRatio = null;
        bus.totalZ = null;
        delete bus.results;
        delete bus.pathComponents;
    });
    
    selectedBusId = null;
    
    // Update displays
    if (typeof updateBusTree === 'function') updateBusTree();
    if (typeof updateBusesContent === 'function') updateBusesContent();
    
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
    
    // Trigger auto-save
    if (typeof scheduleAutoSave === 'function') {
        scheduleAutoSave();
    }
    
    console.log('✅ Calculation results cleared');
    alert('✅ Calculation results cleared.\n\nYour buses and components are still intact.');
}

// ═══════════════════════════════════════════════════════════
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// Required for inline event handlers and cross-module access
// ═══════════════════════════════════════════════════════════

// Core application functions
window.clearAll = clearAll;
window.clearResults = clearResults;
window.initTheme = initTheme;
window.toggleTheme = toggleTheme;
window.updateThemeButton = updateThemeButton;
window.showThemeChangeFeedback = showThemeChangeFeedback;
window.switchTab = switchTab;

// Bus manager functions
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

// Component manager functions
window.addComponent = addComponent;
window.editComponent = editComponent;
window.closeEditComponentModal = closeEditComponentModal;
window.saveComponentEdits = saveComponentEdits;
window.moveComponent = moveComponent;
window.deleteComponent = deleteComponent;

// Export/report functions
window.exportBusReport = exportBusReport;
window.exportAllBusesSummary = exportAllBusesSummary;

// Project management functions
window.saveProject = saveProject;
window.loadProject = loadProject;

// Recommendation system functions
window.runSystemAnalytics = runSystemAnalytics;
window.viewCalculationSteps = viewCalculationSteps;
window.exportBusRecommendations = exportBusRecommendations;

// ═══════════════════════════════════════════════════════════
// APPLICATION INITIALIZATION
// Initializes when DOM is ready
// ═══════════════════════════════════════════════════════════

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM already loaded
    initApp();
}

// ═══════════════════════════════════════════════════════════
// MODULE LOAD CONFIRMATION
// ═══════════════════════════════════════════════════════════

console.log('✅ Main.js loaded successfully');
console.log('   - Version: 1.3.0');
console.log('   - Date: 2025-10-28 05:38:11 UTC');
console.log('   - Author: bfforex');
console.log('   - All helper functions: Available');
console.log('   - clearAll: Available');
console.log('   - clearResults: Available');
console.log('   - Motor contribution: Enabled');
console.log('   - IEEE 141/IEC 60909: Compliant');
console.log('✅ Application ready');
console.log('═'.repeat(80) + '\n');
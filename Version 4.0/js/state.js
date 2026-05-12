// Application State
// Note: var (not let) is used for buses/components so that window.buses / window.components
// are automatically kept in sync with the global variables (fix for Issue #37).
var buses = [];
var components = [];
let calculationResults = null;
let editingComponentIndex = null;
let editingBusId = null;
let autoSaveTimer = null;
let selectedBusId = null;
let protectionDevices = [];
let protectionZones = [];
let protectionAssociations = [];


// Version 3.3: Scenario and Mode State
window.currentScenarioId = 'base';  // Default scenario: baseline configuration
window.currentMode = 'design';      // Default mode: design (100% FLC)
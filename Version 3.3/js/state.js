// Application State
let buses = [];
let components = [];
let calculationResults = null;
let editingComponentIndex = null;
let editingBusId = null;
let autoSaveTimer = null;
let selectedBusId = null;

// Version 3.3: Scenario and Mode State
window.currentScenarioId = 'base';  // Default scenario: baseline configuration
window.currentMode = 'design';      // Default mode: design (100% FLC)
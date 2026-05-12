// Application State
// AppStore-compatible initialization layer
// Preserves existing global semantics while routing through window shims.

window.buses = Array.isArray(window.buses) ? window.buses : [];
window.components = Array.isArray(window.components) ? window.components : [];
window.calculationResults = window.calculationResults || null;
window.editingComponentIndex = window.editingComponentIndex || null;
window.editingBusId = window.editingBusId || null;
window.autoSaveTimer = window.autoSaveTimer || null;
window.selectedBusId = window.selectedBusId || null;
window.protectionDevices = Array.isArray(window.protectionDevices) ? window.protectionDevices : [];
window.protectionZones = Array.isArray(window.protectionZones) ? window.protectionZones : [];
window.protectionAssociations = Array.isArray(window.protectionAssociations) ? window.protectionAssociations : [];

// Version 3.3: Scenario and Mode State
window.currentScenarioId = window.currentScenarioId || 'base';
window.currentMode = window.currentMode || 'design';

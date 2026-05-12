// Bus Manager Module - Handles all bus-related operations
// Corrected: 2026-05-05 by M365 Copilot
// Fixes:
// - Bus Manager tree refresh after add/edit/delete
// - Proper <option value=""> entries for root/none selections
// - Insert-after support without breaking root bus visibility
// - Parent-cycle protection
// - Orphan/corrupt-parent fallback so buses do not disappear from tree
// - Buses tab content rendering
// - Defensive DOM checks

console.log('🔧 Loading Bus Manager Module - corrected visibility build...');

// ═══════════════════════════════════════════════════════════════════════════════
// SAFE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
function getBusesArray() {
 if (typeof window !== 'undefined' && Array.isArray(window.buses)) return window.buses;
 if (typeof buses !== 'undefined' && Array.isArray(buses)) return buses;
 return [];
}

function getComponentsArray() {
 if (typeof window !== 'undefined' && Array.isArray(window.components)) return window.components;
 if (typeof components !== 'undefined' && Array.isArray(components)) return components;
 return [];
}

function setBusesArray(nextBuses) {
 if (typeof window !== 'undefined') window.buses = nextBuses;
 try { buses = nextBuses; } catch (_) {}
}

function setComponentsArray(nextComponents) {
 if (typeof window !== 'undefined') window.components = nextComponents;
 try { components = nextComponents; } catch (_) {}
}

function escapeBusHtml(value) {
 if (value === null || value === undefined) return '';
 return String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');
}

function formatBusNum(value, decimals = 2, fallback = '—') {
 if (typeof formatNum === 'function') {
  try { return formatNum(value, decimals, fallback); } catch (_) {}
 }
 const n = Number(value);
 return Number.isFinite(n) ? n.toFixed(decimals) : fallback;
}

function getBusById(busId) {
 return getBusesArray().find(bus => String(bus.id) === String(busId)) || null;
}

function getBusIcon(type) {
 if (type === 'source') return '⚡';
 if (type === 'branch') return '🔹';
 return '🔌';
}

function generateBusIdSafe() {
 if (typeof generateBusId === 'function') {
  try { return generateBusId(); } catch (_) {}
 }
 if (typeof generateUniqueId === 'function') {
  try { return generateUniqueId('bus'); } catch (_) {}
 }
 return 'BUS-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
}

function refreshBusManagerUI() {
 if (typeof updateBusTree === 'function') {
  updateBusTree();
 }
 if (typeof updateBusDropdowns === 'function') {
  updateBusDropdowns();
 }
 if (typeof updateBusSelects === 'function') {
  updateBusSelects();
 }
 if (typeof updateBusesContent === 'function') {
  updateBusesContent();
 }
 if (typeof displayComponents === 'function') {
  displayComponents();
 } else if (typeof updateComponentsList === 'function') {
  updateComponentsList();
 }
 if (typeof refreshDiagramIfNeeded === 'function') {
  refreshDiagramIfNeeded();
 }
}

function scheduleSaveSafe() {
 if (typeof scheduleAutoSave === 'function') {
  scheduleAutoSave();
  return;
 }
 if (typeof autoSaveToLocalStorage === 'function') {
  autoSaveToLocalStorage();
 }
}

function wouldCreateBusParentCycle(busId, proposedParentId) {
 if (!busId || !proposedParentId) return false;
 let currentParentId = proposedParentId;
 const visited = new Set();
 while (currentParentId) {
  if (String(currentParentId) === String(busId)) return true;
  if (visited.has(String(currentParentId))) return true;
  visited.add(String(currentParentId));
  const parentBus = getBusById(currentParentId);
  if (!parentBus) return false;
  currentParentId = parentBus.parentBus || null;
 }
 return false;
}

function getRenderableRootBuses() {
 const currentBuses = getBusesArray();
 const validBusIds = new Set(currentBuses.map(bus => String(bus.id)));
 let rootBuses = currentBuses.filter(bus => !bus.parentBus || !validBusIds.has(String(bus.parentBus)));
 if (rootBuses.length === 0 && currentBuses.length > 0) {
  console.warn('⚠️ No root buses found. Rendering all buses as fallback to prevent hidden bus tree.');
  rootBuses = currentBuses;
 }
 return rootBuses;
}

function buildBusOptionList(selectedBusId = '', excludeBusId = null, includeRoot = false, rootLabel = 'None (Root Bus)') {
 let html = includeRoot ? `<option value="">${escapeBusHtml(rootLabel)}</option>` : '';
 getBusesArray().forEach(bus => {
  if (excludeBusId && String(bus.id) === String(excludeBusId)) return;
  const selected = String(bus.id) === String(selectedBusId || '') ? 'selected' : '';
  html += `<option value="${escapeBusHtml(bus.id)}" ${selected}>${escapeBusHtml(bus.name)} (${formatBusNum(bus.voltage, 0)}V)</option>`;
 });
 return html;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADD BUS MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function openAddBusModal() {
 const parentSelect = document.getElementById('newBusParent');
 if (parentSelect) {
  parentSelect.innerHTML = buildBusOptionList('', null, true, 'None (Root Bus)');
 }

 const insertAfterSelect = document.getElementById('insertAfterBus');
 if (insertAfterSelect) {
  insertAfterSelect.innerHTML = buildBusOptionList('', null, true, 'None (Add at end)');
 }

 if (typeof openModal === 'function') {
  openModal('addBusModal', function() {
   const firstInput = document.getElementById('newBusName');
   if (firstInput) setTimeout(() => firstInput.focus(), 150);
  });
 } else {
  const modal = document.getElementById('addBusModal');
  if (modal) modal.style.display = 'block';
  const firstInput = document.getElementById('newBusName');
  if (firstInput) setTimeout(() => firstInput.focus(), 150);
 }
}

function closeAddBusModal() {
 const fields = {
  newBusName: '',
  newBusVoltage: '',
  newBusType: 'distribution',
  newBusParent: '',
  newBusLoad: '',
  newBusDemandFactor: '1.0',
  newBusDiversityFactor: '',
  newBusUtilityFault: '',
  newBusUtilityMVA: '',
  newBusUtilityXR: '3',
  utilityMode: 'kA',
  newBusSLGFault: '',
  newBusSLGXR: '',
  newBusZ1R: '',
  newBusZ1X: '',
  newBusZ0R: '',
  newBusZ0X: '',
  insertAfterBus: ''
 };
 Object.entries(fields).forEach(([id, value]) => {
  const el = document.getElementById(id);
  if (el) el.value = value;
 });

 ['utilitySourceGroup', 'utilityXRGroup', 'utilityModeGroup'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
 });
 const faultCurrentMode = document.getElementById('faultCurrentMode');
 if (faultCurrentMode) faultCurrentMode.style.display = 'block';
 const faultMVAMode = document.getElementById('faultMVAMode');
 if (faultMVAMode) faultMVAMode.style.display = 'none';
 const slgDutyGroup = document.getElementById('slgDutyGroup');
 if (slgDutyGroup) slgDutyGroup.style.display = 'none';
 const slgXRGroup = document.getElementById('slgXRGroup');
 if (slgXRGroup) slgXRGroup.style.display = 'none';
 const seqImpGroup = document.getElementById('seqImpedanceGroup');
 if (seqImpGroup) seqImpGroup.style.display = 'none';

 if (typeof clearModalErrors === 'function') {
  clearModalErrors('addBusModal');
 }
 if (typeof closeModal === 'function') {
  closeModal('addBusModal');
 } else {
  const modal = document.getElementById('addBusModal');
  if (modal) modal.style.display = 'none';
 }
}

function toggleUtilityFields() {
 const busType = document.getElementById('newBusType')?.value;
 const isSource = busType === 'source';
 const utilitySourceGroup = document.getElementById('utilitySourceGroup');
 const utilityXRGroup = document.getElementById('utilityXRGroup');
 const utilityModeGroup = document.getElementById('utilityModeGroup');
 if (utilitySourceGroup) utilitySourceGroup.style.display = isSource ? 'block' : 'none';
 if (utilityXRGroup) utilityXRGroup.style.display = isSource ? 'block' : 'none';
 if (utilityModeGroup) utilityModeGroup.style.display = isSource ? 'block' : 'none';
 if (isSource) toggleUtilityInputMode();
}

function toggleUtilityInputMode() {
 const mode = document.getElementById('utilityMode')?.value || 'kA';
 const faultCurrentDiv = document.getElementById('faultCurrentMode');
 const faultMVADiv = document.getElementById('faultMVAMode');
 const slgDutyGroup = document.getElementById('slgDutyGroup');
 const slgXRGroup = document.getElementById('slgXRGroup');
 const seqImpGroup = document.getElementById('seqImpedanceGroup');
 const xrGroup = document.getElementById('utilityXRGroup');

 [faultCurrentDiv, faultMVADiv, slgDutyGroup, slgXRGroup, seqImpGroup].forEach(el => {
  if (el) el.style.display = 'none';
 });

 if (mode === 'kA') {
  if (faultCurrentDiv) faultCurrentDiv.style.display = 'block';
  if (slgDutyGroup) slgDutyGroup.style.display = 'block';
  if (slgXRGroup) slgXRGroup.style.display = 'block';
  if (xrGroup) xrGroup.style.display = 'block';
  const slgInput = document.getElementById('newBusSLGFault');
  if (slgInput) slgInput.placeholder = 'SLG kA (optional)';
 } else if (mode === 'MVA') {
  if (faultMVADiv) faultMVADiv.style.display = 'block';
  if (slgDutyGroup) slgDutyGroup.style.display = 'block';
  if (slgXRGroup) slgXRGroup.style.display = 'block';
  if (xrGroup) xrGroup.style.display = 'block';
  const slgInput = document.getElementById('newBusSLGFault');
  if (slgInput) slgInput.placeholder = 'SLG MVA (optional)';
 } else {
  if (seqImpGroup) seqImpGroup.style.display = 'block';
  if (xrGroup) xrGroup.style.display = 'none';
 }
}

function toggleEditUtilityInputMode() {
 const mode = document.getElementById('editUtilityMode')?.value || 'kA';
 const faultCurrentDiv = document.getElementById('editFaultCurrentMode');
 const faultMVADiv = document.getElementById('editFaultMVAMode');
 if (faultCurrentDiv) faultCurrentDiv.style.display = mode === 'kA' ? 'block' : 'none';
 if (faultMVADiv) faultMVADiv.style.display = mode === 'MVA' ? 'block' : 'none';
}

function saveBus() {
 const name = document.getElementById('newBusName')?.value.trim() || '';
 const voltage = parseFloat(document.getElementById('newBusVoltage')?.value);
 const type = document.getElementById('newBusType')?.value || 'distribution';
 const parentId = document.getElementById('newBusParent')?.value || null;

 if (!name) {
  alert('Please enter a bus name.');
  return;
 }
 if (!Number.isFinite(voltage) || voltage <= 0) {
  alert('Please enter a valid voltage.');
  return;
 }

 const bus = {
  id: generateBusIdSafe(),
  name: name,
  voltage: voltage,
  type: type,
  parentBus: parentId,
  faultCurrent: null,
  asymFaultCurrent: null,
  xrRatio: null,
  totalZ: null,
  created: new Date().toISOString()
 };

 const loadField = document.getElementById('newBusLoad');
 if (loadField) {
  const loadCurrent = parseFloat(loadField.value);
  if (Number.isFinite(loadCurrent) && loadCurrent > 0) {
   bus.loadCurrent = loadCurrent;
  }
 }

 const demandFactorField = document.getElementById('newBusDemandFactor');
 if (demandFactorField) {
  const demandFactor = parseFloat(demandFactorField.value);
  if (Number.isFinite(demandFactor) && demandFactor >= 0 && demandFactor <= 1) {
   bus.demandFactor = demandFactor;
  }
 }

 const diversityFactorField = document.getElementById('newBusDiversityFactor');
 if (diversityFactorField) {
  const diversityFactor = parseFloat(diversityFactorField.value);
  if (Number.isFinite(diversityFactor) && diversityFactor >= 1 && diversityFactor <= 4) {
   bus.diversityFactor = diversityFactor;
  }
 }

 if (type === 'source') {
  const utilityMode = document.getElementById('utilityMode')?.value || 'kA';
  const utilityXR = parseFloat(document.getElementById('newBusUtilityXR')?.value);
  bus.utilityMode = utilityMode;
  bus.utilityXR = Number.isFinite(utilityXR) && utilityXR > 0 ? utilityXR : 3;
  bus.utilityXRRatio = bus.utilityXR;
  bus.xrRatio = bus.utilityXR;

  if (utilityMode === 'kA') {
   const utilityFaultCurrent = parseFloat(document.getElementById('newBusUtilityFault')?.value);
   if (Number.isFinite(utilityFaultCurrent) && utilityFaultCurrent > 0) {
    bus.utilityFaultCurrent = utilityFaultCurrent;
    bus.faultCurrent = utilityFaultCurrent;
   }
  } else if (utilityMode === 'MVA') {
   const utilityFaultMVA = parseFloat(document.getElementById('newBusUtilityMVA')?.value);
   if (Number.isFinite(utilityFaultMVA) && utilityFaultMVA > 0) {
    bus.utilityFaultMVA = utilityFaultMVA;
   }
  } else if (utilityMode === 'Z') {
   const z1r = parseFloat(document.getElementById('newBusZ1R')?.value);
   const z1x = parseFloat(document.getElementById('newBusZ1X')?.value);
   const z0r = parseFloat(document.getElementById('newBusZ0R')?.value);
   const z0x = parseFloat(document.getElementById('newBusZ0X')?.value);
   if (Number.isFinite(z1r) && Number.isFinite(z1x)) {
    bus.z1 = { r: z1r, x: z1x };
   }
   if (Number.isFinite(z0r) && Number.isFinite(z0x)) {
    bus.z0 = { r: z0r, x: z0x };
   }
  }

  const slgFault = parseFloat(document.getElementById('newBusSLGFault')?.value);
  const slgXR = parseFloat(document.getElementById('newBusSLGXR')?.value);
  if (Number.isFinite(slgFault) && slgFault > 0) bus.utilitySLGFault = slgFault;
  if (Number.isFinite(slgXR) && slgXR > 0) bus.utilitySLGXR = slgXR;
 }

 const insertAfterId = document.getElementById('insertAfterBus')?.value || '';
 const currentBuses = getBusesArray();
 if (insertAfterId) {
  const index = currentBuses.findIndex(b => String(b.id) === String(insertAfterId));
  if (index !== -1) {
   currentBuses.splice(index + 1, 0, bus);
  } else {
   currentBuses.push(bus);
  }
 } else {
  currentBuses.push(bus);
 }
 setBusesArray(currentBuses);

 refreshBusManagerUI();
 closeAddBusModal();
 scheduleSaveSafe();
 alert(`Bus "${name}" added successfully!`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUS TREE DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════
function updateBusTree() {
 const tree = document.getElementById('busTree');
 if (!tree) return;
 const currentBuses = getBusesArray();
 if (currentBuses.length === 0) {
  tree.innerHTML = '<div class="alert alert-info">No buses created yet. Click "Add Bus" to start.</div>';
  return;
 }
 const rootBuses = getRenderableRootBuses();
 let html = '';
 rootBuses.forEach(bus => {
  html += renderBusTree(bus, 0, new Set());
 });
 tree.innerHTML = html;
 if (typeof refreshDiagramIfNeeded === 'function') refreshDiagramIfNeeded();
}

function renderBusTree(bus, level, visited = new Set()) {
 if (!bus || !bus.id) return '';
 if (visited.has(String(bus.id))) {
  return `<div class="bus-item bus-level-${level}" style="border-left: 3px solid #dc3545;">
   <div class="bus-header">
    <div><span class="bus-name">⚠️ ${escapeBusHtml(bus.name || bus.id)}</span> <span class="badge badge-danger">Parent cycle detected</span></div>
   </div>
  </div>`;
 }
 visited.add(String(bus.id));

 const currentBuses = getBusesArray();
 const children = currentBuses.filter(b => String(b.parentBus || '') === String(bus.id));
 const hasChildren = children.length > 0;
 const faultVal = Number.isFinite(Number(bus.faultCurrent)) ? Number(bus.faultCurrent) : null;
 const faultClass = faultVal != null ? (faultVal > 50 ? 'high' : (faultVal > 25 ? 'medium' : '')) : '';
 const selectedId = typeof selectedBusId !== 'undefined' ? selectedBusId : window.selectedBusId;
 const isSelected = String(selectedId || '') === String(bus.id);
 const voltageDisplay = formatBusNum(bus.voltage, 0, '—');

 let loadBadge = '';
 if (Number.isFinite(Number(bus.loadCurrent)) && Number(bus.loadCurrent) > 0) {
  loadBadge = `<span class="badge badge-primary" title="User-specified load (used in calculations)" style="background-color: #4a90e2;">📌 ${formatBusNum(bus.loadCurrent, 1)}A Manual</span>`;
 }
 if (Number.isFinite(Number(bus.loadCurrentCalculated)) && Number(bus.loadCurrentCalculated) > 0) {
  const calcBadge = `<span class="badge badge-success" title="Auto-calculated from downstream (display only)" style="background-color: #28a745;">⚡ ${formatBusNum(bus.loadCurrentCalculated, 1)}A Calc</span>`;
  loadBadge = loadBadge ? loadBadge + ' ' + calcBadge : calcBadge;
 }

 const demandBadge = Number.isFinite(Number(bus.demandFactor)) && Number(bus.demandFactor) < 1.0
  ? `<span class="badge badge-warning">DF:${formatBusNum(Number(bus.demandFactor) * 100, 0)}%</span>`
  : '';
 const faultBadge = faultVal != null
  ? `<span class="bus-fault ${faultClass}">${formatBusNum(faultVal, 2)} kA</span>`
  : '';
 const orphanBadge = bus.parentBus && !getBusById(bus.parentBus)
  ? '<span class="badge badge-danger">Orphan parent</span>'
  : '';

 let html = `<div class="bus-item bus-level-${level} ${isSelected ? 'selected' : ''}" onclick="selectBus('${escapeBusHtml(bus.id)}')" data-bus-id="${escapeBusHtml(bus.id)}">
  <div class="bus-header">
   <div>
    <span class="bus-name">${getBusIcon(bus.type)} ${escapeBusHtml(bus.name)}</span>
    <span class="bus-voltage">${voltageDisplay}V</span>
    ${bus.type === 'source' ? '<span class="badge badge-info">SOURCE</span>' : ''}
    ${loadBadge}
    ${demandBadge}
    ${orphanBadge}
   </div>
   ${faultBadge}
  </div>
  <div class="bus-controls">
   <button class="btn btn-info btn-small" onclick="event.stopPropagation(); editBus('${escapeBusHtml(bus.id)}')">✎ Edit</button>
   <button class="btn btn-danger btn-small" onclick="event.stopPropagation(); deleteBus('${escapeBusHtml(bus.id)}')">✕ Delete</button>
   <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); calculateBus('${escapeBusHtml(bus.id)}')">🔢 Calculate</button>
  </div>
 </div>`;

 if (hasChildren) {
  children.forEach(child => {
   html += renderBusTree(child, level + 1, new Set(visited));
  });
 }
 return html;
}

function selectBus(busId) {
 if (typeof window !== 'undefined') window.selectedBusId = busId;
 try { selectedBusId = busId; } catch (_) {}
 updateBusTree();
 const bus = getBusById(busId);
 if (bus && bus.faultCurrent !== null && typeof switchTab === 'function') {
  switchTab(null, 'results');
 }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT BUS
// ═══════════════════════════════════════════════════════════════════════════════
function editBus(busId) {
 if (typeof window !== 'undefined') window.editingBusId = busId;
 try { editingBusId = busId; } catch (_) {}
 const bus = getBusById(busId);
 if (!bus) return;
 const modalBody = document.getElementById('editBusModalBody');
 if (!modalBody) return;

 const loadInputValue = Number.isFinite(Number(bus.loadCurrent)) && Number(bus.loadCurrent) > 0 ? bus.loadCurrent : '';
 let autoCalcInfoHTML = '';
 if (Number.isFinite(Number(bus.loadCurrentCalculated)) && Number(bus.loadCurrentCalculated) > 0) {
  autoCalcInfoHTML = `<div class="small-muted" style="color: #28a745; margin-top: 8px; padding: 10px; background: #f0f9f4; border-left: 3px solid #28a745; border-radius: 4px;">
   ⚡ <strong>Auto-calculated load:</strong> ${formatBusNum(bus.loadCurrentCalculated, 2)} A<br>
   <small style="color: #666;">Computed from downstream components (display only)</small>
  </div>`;
 }

 const parentBusOptions = buildBusOptionList(bus.parentBus || '', bus.id, true, 'None (Root Bus)');
 let utilityFieldsHTML = '';
 if (bus.type === 'source') {
  const mode = bus.utilityMode || 'kA';
  utilityFieldsHTML = `<div class="form-group">
    <label>Utility Source Data Mode:</label>
    <select id="editUtilityMode" onchange="toggleEditUtilityInputMode()">
     <option value="kA" ${mode === 'kA' ? 'selected' : ''}>Fault Current (kA)</option>
     <option value="MVA" ${mode === 'MVA' ? 'selected' : ''}>Fault MVA</option>
    </select>
   </div>
   <div id="editFaultCurrentMode" style="display: ${mode === 'kA' ? 'block' : 'none'};">
    <div class="form-group">
     <label>Available Fault Current (kA):</label>
     <input type="number" id="editBusUtilityFault" value="${escapeBusHtml(bus.utilityFaultCurrent || bus.faultCurrent || '')}" step="0.1" min="0">
    </div>
   </div>
   <div id="editFaultMVAMode" style="display: ${mode === 'MVA' ? 'block' : 'none'};">
    <div class="form-group">
     <label>Available Fault MVA:</label>
     <input type="number" id="editBusUtilityMVA" value="${escapeBusHtml(bus.utilityFaultMVA || '')}" step="0.1" min="0">
    </div>
   </div>
   <div class="form-group">
    <label>Source X/R Ratio:</label>
    <input type="number" id="editBusUtilityXR" value="${escapeBusHtml(bus.utilityXR || bus.utilityXRRatio || bus.xrRatio || 3)}" step="0.1" min="0">
   </div>`;
 }

 modalBody.innerHTML = `<div class="form-group">
   <label>Bus Name:</label>
   <input type="text" id="editBusName" value="${escapeBusHtml(bus.name)}">
  </div>
  <div class="form-group">
   <label>Bus Voltage (V):</label>
   <input type="number" id="editBusVoltage" value="${escapeBusHtml(bus.voltage)}" step="0.1" min="0">
  </div>
  <div class="form-group">
   <label>Bus Type:</label>
   <select id="editBusType" disabled>
    <option value="source" ${bus.type === 'source' ? 'selected' : ''}>Source</option>
    <option value="distribution" ${bus.type === 'distribution' ? 'selected' : ''}>Distribution</option>
    <option value="branch" ${bus.type === 'branch' ? 'selected' : ''}>Branch</option>
   </select>
   <div class="small-muted">Bus type cannot be changed after creation</div>
  </div>
  <div class="form-group">
   <label>Parent Bus:</label>
   <select id="editBusParent">${parentBusOptions}</select>
   <div class="small-muted">Changing the parent bus updates the network hierarchy.</div>
  </div>
  <div class="form-group">
   <label>Bus Load Current (A) - Optional:</label>
   <input type="number" id="editBusLoad" value="${escapeBusHtml(loadInputValue)}" step="0.1" min="0" placeholder="Manual direct load">
   <div class="small-muted">Manual load is included in calculations. Leave blank to clear manual direct load.</div>
   ${autoCalcInfoHTML}
  </div>
  <details class="collapsible-section">
   <summary>Demand & Diversity Factors</summary>
   <div class="form-group">
    <label>Demand Factor (0.0 - 1.0):</label>
    <input type="number" id="editBusDemandFactor" value="${escapeBusHtml(bus.demandFactor ?? 1.0)}" step="0.01" min="0" max="1">
   </div>
   <div class="form-group">
    <label>Diversity Factor (1.0 - 4.0):</label>
    <input type="number" id="editBusDiversityFactor" value="${escapeBusHtml(bus.diversityFactor || '')}" step="0.01" min="1" max="4" placeholder="Auto">
   </div>
  </details>
  ${utilityFieldsHTML}`;

 if (typeof openModal === 'function') {
  openModal('editBusModal', function() {
   const firstInput = document.getElementById('editBusName');
   if (firstInput) setTimeout(() => firstInput.focus(), 150);
  });
 } else {
  const modal = document.getElementById('editBusModal');
  if (modal) modal.style.display = 'block';
 }
}

function closeEditBusModal() {
 if (typeof window !== 'undefined') window.editingBusId = null;
 try { editingBusId = null; } catch (_) {}
 if (typeof clearModalErrors === 'function') {
  clearModalErrors('editBusModal');
 }
 if (typeof closeModal === 'function') {
  closeModal('editBusModal');
 } else {
  const modal = document.getElementById('editBusModal');
  if (modal) modal.style.display = 'none';
 }
}

function saveBusEdits() {
 const activeEditingBusId = (typeof editingBusId !== 'undefined' && editingBusId) ? editingBusId : window.editingBusId;
 if (!activeEditingBusId) return;
 const bus = getBusById(activeEditingBusId);
 if (!bus) return;

 const newName = document.getElementById('editBusName')?.value.trim() || '';
 const newVoltage = parseFloat(document.getElementById('editBusVoltage')?.value);
 if (!newName) {
  alert('Please enter a bus name.');
  return;
 }
 if (!Number.isFinite(newVoltage) || newVoltage <= 0) {
  alert('Please enter a valid voltage.');
  return;
 }

 const oldName = bus.name;
 bus.name = newName;
 bus.voltage = newVoltage;

 getComponentsArray().forEach(comp => {
  if (String(comp.fromBus) === String(bus.id)) comp.fromBusName = bus.name;
  if (String(comp.toBus) === String(bus.id)) comp.toBusName = bus.name;
 });

 const editParentField = document.getElementById('editBusParent');
 if (editParentField) {
  const newParentId = editParentField.value || null;
  if (wouldCreateBusParentCycle(bus.id, newParentId)) {
   bus.name = oldName;
   alert('Invalid parent bus selection. This change would create a circular bus hierarchy.');
   return;
  }
  bus.parentBus = newParentId;
 }

 const editLoadField = document.getElementById('editBusLoad');
 if (editLoadField) {
  const loadCurrent = parseFloat(editLoadField.value);
  if (Number.isFinite(loadCurrent) && loadCurrent > 0) {
   bus.loadCurrent = loadCurrent;
  } else {
   delete bus.loadCurrent;
  }
 }

 const editDemandFactorField = document.getElementById('editBusDemandFactor');
 if (editDemandFactorField) {
  const demandFactor = parseFloat(editDemandFactorField.value);
  bus.demandFactor = Number.isFinite(demandFactor) && demandFactor >= 0 && demandFactor <= 1 ? demandFactor : 1.0;
 }

 const editDiversityFactorField = document.getElementById('editBusDiversityFactor');
 if (editDiversityFactorField) {
  const diversityFactor = parseFloat(editDiversityFactorField.value);
  if (Number.isFinite(diversityFactor) && diversityFactor >= 1 && diversityFactor <= 4) {
   bus.diversityFactor = diversityFactor;
  } else {
   delete bus.diversityFactor;
  }
 }

 if (bus.type === 'source') {
  const editUtilityMode = document.getElementById('editUtilityMode')?.value || bus.utilityMode || 'kA';
  const editUtilityXR = parseFloat(document.getElementById('editBusUtilityXR')?.value);
  bus.utilityMode = editUtilityMode;
  bus.utilityXR = Number.isFinite(editUtilityXR) && editUtilityXR > 0 ? editUtilityXR : 3;
  bus.utilityXRRatio = bus.utilityXR;
  bus.xrRatio = bus.utilityXR;

  if (editUtilityMode === 'kA') {
   const utilityFault = parseFloat(document.getElementById('editBusUtilityFault')?.value);
   if (Number.isFinite(utilityFault) && utilityFault > 0) {
    bus.utilityFaultCurrent = utilityFault;
    bus.faultCurrent = utilityFault;
   }
   delete bus.utilityFaultMVA;
  } else if (editUtilityMode === 'MVA') {
   const utilityMVA = parseFloat(document.getElementById('editBusUtilityMVA')?.value);
   if (Number.isFinite(utilityMVA) && utilityMVA > 0) {
    bus.utilityFaultMVA = utilityMVA;
   }
  }
 }

 refreshBusManagerUI();
 closeEditBusModal();
 scheduleSaveSafe();
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE BUS
// ═══════════════════════════════════════════════════════════════════════════════
function deleteBus(busId) {
 const bus = getBusById(busId);
 if (!bus) return;

 const childBuses = getBusesArray().filter(b => String(b.parentBus || '') === String(busId));
 if (childBuses.length > 0) {
  const childNames = childBuses.map(c => c.name).join(', ');
  alert(`Cannot delete "${bus.name}" because it has ${childBuses.length} child bus(es):\n\n${childNames}\n\nPlease delete child buses first.`);
  return;
 }

 let currentComponents = getComponentsArray();
 const connectedComponents = currentComponents.filter(c => String(c.fromBus) === String(busId) || String(c.toBus) === String(busId));
 if (connectedComponents.length > 0) {
  if (!confirm(`Bus "${bus.name}" has ${connectedComponents.length} component(s) connected. Delete anyway?`)) {
   return;
  }
  currentComponents = currentComponents.filter(c => String(c.fromBus) !== String(busId) && String(c.toBus) !== String(busId));
  setComponentsArray(currentComponents);
 }

 if (confirm(`Are you sure you want to delete bus "${bus.name}"?`)) {
  const nextBuses = getBusesArray().filter(b => String(b.id) !== String(busId));
  setBusesArray(nextBuses);
  if (String(window.selectedBusId || '') === String(busId)) window.selectedBusId = null;
  try { if (String(selectedBusId || '') === String(busId)) selectedBusId = null; } catch (_) {}
  refreshBusManagerUI();
  scheduleSaveSafe();
 }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DROPDOWNS AND BUSES TAB CONTENT
// ═══════════════════════════════════════════════════════════════════════════════
function updateBusDropdowns() {
 const fromBus = document.getElementById('fromBus');
 const toBus = document.getElementById('toBus');
 if (!fromBus || !toBus) return;

 const fromValue = fromBus.value;
 const toValue = toBus.value;
 fromBus.innerHTML = '<option value="">Select source bus</option>';
 toBus.innerHTML = '<option value="">Select destination bus</option>';

 getBusesArray().forEach(bus => {
  const optionFrom = document.createElement('option');
  optionFrom.value = bus.id;
  optionFrom.textContent = `${bus.name} (${bus.voltage}V)`;
  if (String(bus.id) === String(fromValue)) optionFrom.selected = true;
  fromBus.appendChild(optionFrom);

  const optionTo = document.createElement('option');
  optionTo.value = bus.id;
  optionTo.textContent = `${bus.name} (${bus.voltage}V)`;
  if (String(bus.id) === String(toValue)) optionTo.selected = true;
  toBus.appendChild(optionTo);
 });
}

function getHierarchicalBusRows() {
 const currentBuses = getBusesArray();
 const validBusIds = new Set(currentBuses.map(bus => String(bus.id)));
 const originalIndex = new Map();

 currentBuses.forEach((bus, index) => {
  originalIndex.set(String(bus.id), index);
 });

 const childrenByParent = new Map();

 currentBuses.forEach(bus => {
  const parentKey = bus.parentBus && validBusIds.has(String(bus.parentBus))
   ? String(bus.parentBus)
   : '';

  if (!childrenByParent.has(parentKey)) {
   childrenByParent.set(parentKey, []);
  }

  childrenByParent.get(parentKey).push(bus);
 });

 childrenByParent.forEach(children => {
  children.sort((a, b) => {
   return (originalIndex.get(String(a.id)) || 0) - (originalIndex.get(String(b.id)) || 0);
  });
 });

 let roots = childrenByParent.get('') || [];

 if (roots.length === 0 && currentBuses.length > 0) {
  console.warn('⚠️ No valid root buses found. Rendering all buses as hierarchy fallback.');
  roots = currentBuses.slice();
 }

 const rows = [];
 const visitedGlobal = new Set();

 function walk(bus, level, path, stack) {
  if (!bus || !bus.id) return;

  const busKey = String(bus.id);

  if (stack.has(busKey)) {
   rows.push({
    bus,
    level,
    path,
    cycle: true,
    orphan: false
   });
   return;
  }

  if (visitedGlobal.has(busKey)) return;

  visitedGlobal.add(busKey);

  const parentMissing = bus.parentBus && !validBusIds.has(String(bus.parentBus));

  rows.push({
   bus,
   level,
   path,
   cycle: false,
   orphan: parentMissing
  });

  const nextStack = new Set(stack);
  nextStack.add(busKey);

  const children = childrenByParent.get(busKey) || [];
  children.forEach(child => {
   walk(child, level + 1, path.concat(bus.name || bus.id), nextStack);
  });
 }

 roots.forEach(root => {
  walk(root, 0, [], new Set());
 });

 currentBuses.forEach(bus => {
  if (!visitedGlobal.has(String(bus.id))) {
   walk(bus, 0, ['Unresolved hierarchy'], new Set());
  }
 });

 return rows;
}

function getBusTypeBadge(type) {
 const normalizedType = String(type || '').toLowerCase();

 if (normalizedType === 'source') {
  return '<span class="badge badge-info">SOURCE</span>';
 }

 if (normalizedType === 'distribution') {
  return '<span class="badge badge-primary">DISTRIBUTION</span>';
 }

 if (normalizedType === 'branch') {
  return '<span class="badge badge-secondary">BRANCH</span>';
 }

 return `<span class="badge badge-secondary">${escapeBusHtml(type || 'N/A')}</span>`;
}

function getBusFaultBadge(bus) {
 const faultCurrent = Number(bus.faultCurrent);

 if (!Number.isFinite(faultCurrent)) {
  return '<span style="color:#777;">—</span>';
 }

 let bg = '#28a745';

 if (faultCurrent > 50) {
  bg = '#dc3545';
 } else if (faultCurrent > 25) {
  bg = '#f0ad4e';
 }

 return `<span style="
  display:inline-block;
  min-width:70px;
  text-align:center;
  background:${bg};
  color:white;
  font-weight:700;
  border-radius:10px;
  padding:5px 8px;
 ">${formatBusNum(faultCurrent, 2)} kA</span>`;
}

function getBusLoadBadge(bus) {
 const manualLoad = Number(bus.loadCurrent);
 const calculatedLoad = Number(bus.loadCurrentCalculated);

 if (Number.isFinite(manualLoad) && manualLoad > 0) {
  return `<span style="
   display:inline-block;
   background:#4a90e2;
   color:white;
   border-radius:10px;
   padding:4px 8px;
   font-weight:700;
  ">📌 ${formatBusNum(manualLoad, 1)} A Manual</span>`;
 }

 if (Number.isFinite(calculatedLoad) && calculatedLoad > 0) {
  return `<span style="
   display:inline-block;
   background:#28a745;
   color:white;
   border-radius:10px;
   padding:4px 8px;
   font-weight:700;
  ">⚡ ${formatBusNum(calculatedLoad, 1)} A Calc</span>`;
 }

 return '<span style="color:#777;">—</span>';
}

function attachBusesContentActionHandlers() {
 const content = document.getElementById('busesContent');
 if (!content) return;

 content.querySelectorAll('[data-bus-action]').forEach(button => {
 button.onclick = function(event) {
 event.preventDefault();
 event.stopPropagation();

 const action = button.getAttribute('data-bus-action');
 const busId = button.getAttribute('data-bus-id');

 if (!busId) return;

 if (action === 'edit') {
 if (typeof window.editBus === 'function') {
 window.editBus(busId);
 } else if (typeof editBus === 'function') {
 editBus(busId);
 } else {
 alert('Edit Bus function is not available.');
 }
 return;
 }

 if (action === 'delete') {
 if (typeof window.deleteBus === 'function') {
 window.deleteBus(busId);
 } else if (typeof deleteBus === 'function') {
 deleteBus(busId);
 } else {
 alert('Delete Bus function is not available.');
 }
 return;
 }

 if (action === 'calculate') {
 if (typeof window.calculateBus === 'function') {
 window.calculateBus(busId);
 } else if (typeof calculateBus === 'function') {
 calculateBus(busId);
 } else {
 alert('Calculate Bus function is not available.');
 }
 return;
 }
 };
 });
}

function updateBusesContent() {
 const content = document.getElementById('busesContent');
 if (!content) return;

 const currentBuses = getBusesArray();
 const currentComponents = getComponentsArray();

 if (currentBuses.length === 0) {
  content.innerHTML = '<div class="alert alert-info">No buses created yet. Use the Bus Manager to add buses to your system.</div>';
  return;
 }

 const rows = getHierarchicalBusRows();

 let html = '';

 html += '<div style="margin-bottom:10px; color:#555; font-size:12px;">';
 html += 'Auto-arranged by parent-child hierarchy. Child buses are indented under their parent buses.';
 html += '</div>';

 html += '<div class="table-responsive" style="overflow-x:auto;">';

 html += '<table class="results-table" style="width:100%; border-collapse:collapse; table-layout:auto;">';

 html += '<thead>';
 html += '<tr>';
 html += '<th style="width:45px; text-align:center;">#</th>';
 html += '<th style="min-width:260px;">Bus Hierarchy</th>';
 html += '<th style="width:95px;">Voltage</th>';
 html += '<th style="width:120px;">Type</th>';
 html += '<th style="min-width:170px;">Parent Bus</th>';
 html += '<th style="width:120px; text-align:center;">Connections</th>';
 html += '<th style="width:150px;">Load</th>';
 html += '<th style="width:110px;">Fault Current</th>';
 html += '<th style="width:170px;">Actions</th>';
 html += '</tr>';
 html += '</thead>';

 html += '<tbody>';

 rows.forEach((entry, index) => {
  const bus = entry.bus;
  const level = entry.level || 0;
  const parentBus = bus.parentBus ? getBusById(bus.parentBus) : null;

  const componentsFrom = currentComponents.filter(c => String(c.fromBus) === String(bus.id));
  const componentsTo = currentComponents.filter(c => String(c.toBus) === String(bus.id));
  const connectedCount = componentsFrom.length + componentsTo.length;

  const parentText = parentBus
   ? escapeBusHtml(parentBus.name)
   : entry.orphan
    ? '<span style="color:#dc3545; font-weight:700;">Missing Parent</span>'
    : 'Root';

  const levelColor = level === 0
   ? '#244a9b'
   : level === 1
    ? '#007b83'
    : '#6f42c1';

  const rowBg = level === 0
   ? '#ffffff'
   : level === 1
    ? '#fbfdff'
    : '#fdfbff';

  const leftBorder = level === 0
   ? '#244a9b'
   : level === 1
    ? '#17a2b8'
    : '#6f42c1';

  const indentPx = level * 24;

  html += `<tr style="background:${rowBg}; border-bottom:1px solid #e5e5e5;">`;

  html += `<td style="text-align:center; vertical-align:middle;">${index + 1}</td>`;

  html += `<td style="vertical-align:middle; border-left:4px solid ${leftBorder};">`;
  html += `<div style="display:flex; align-items:center; gap:8px; padding-left:${indentPx}px;">`;

  if (level > 0) {
   html += '<span style="color:#999;">↳</span>';
  }

  html += `<span style="
   display:inline-block;
   min-width:32px;
   text-align:center;
   color:white;
   background:${levelColor};
   border-radius:999px;
   font-size:11px;
   font-weight:700;
   padding:2px 6px;
  ">L${level}</span>`;

  html += `<span style="font-weight:800; color:#111;">${getBusIcon(bus.type)} ${escapeBusHtml(bus.name)}</span>`;

  if (entry.cycle) {
   html += '<span style="background:#dc3545; color:white; border-radius:8px; padding:2px 6px; font-size:11px;">Cycle</span>';
  }

  if (entry.orphan) {
   html += '<span style="background:#ffc107; color:#111; border-radius:8px; padding:2px 6px; font-size:11px;">Orphan</span>';
  }

  html += '</div>';

  if (entry.path && entry.path.length > 0) {
   html += `<div style="padding-left:${indentPx + 48}px; color:#777; font-size:11px; margin-top:2px;">`;
   html += escapeBusHtml(entry.path.join(' › '));
   html += '</div>';
  }

  html += '</td>';

  html += `<td style="vertical-align:middle;">${formatBusNum(bus.voltage, 0)} V</td>`;

  html += `<td style="vertical-align:middle;">${getBusTypeBadge(bus.type)}</td>`;

  html += `<td style="vertical-align:middle;">${parentText}</td>`;

  html += `<td style="text-align:center; vertical-align:middle;">`;
  html += `<span style="
   display:inline-block;
   background:#eef2ff;
   color:#244a9b;
   border-radius:10px;
   padding:4px 8px;
   font-weight:700;
  ">${connectedCount}</span>`;
  html += `<div style="font-size:10px; color:#777;">Out:${componentsFrom.length} / In:${componentsTo.length}</div>`;
  html += '</td>';

  html += `<td style="vertical-align:middle;">${getBusLoadBadge(bus)}</td>`;

  html += `<td style="vertical-align:middle;">${getBusFaultBadge(bus)}</td>`;

  html += '<td style="vertical-align:middle;">';
  html += '<div style="display:flex; flex-wrap:wrap; gap:6px;">';
  html += `<button type="button" class="btn btn-info btn-small" data-bus-action="edit" data-bus-id="${escapeBusHtml(bus.id)}">Edit</button>`;
  html += `<button type="button" class="btn btn-danger btn-small" data-bus-action="delete" data-bus-id="${escapeBusHtml(bus.id)}">Delete</button>`;
  html += `<button type="button" class="btn btn-primary btn-small" data-bus-action="calculate" data-bus-id="${escapeBusHtml(bus.id)}">Calculate</button>`;
  html += '</div>';
  html += '</td>';

  html += '</tr>';
 });

 html += '</tbody>';
 html += '</table>';
 html += '</div>';

 content.innerHTML = html;

 attachBusesContentActionHandlers();
 if (typeof refreshDiagramIfNeeded === 'function') refreshDiagramIfNeeded();
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
 window.openAddBusModal = openAddBusModal;
 window.closeAddBusModal = closeAddBusModal;
 window.toggleUtilityFields = toggleUtilityFields;
 window.toggleUtilityInputMode = toggleUtilityInputMode;
 window.toggleEditUtilityInputMode = toggleEditUtilityInputMode;
 window.saveBus = saveBus;
 window.updateBusTree = updateBusTree;
 window.renderBusTree = renderBusTree;
 window.selectBus = selectBus;
 window.editBus = editBus;
 window.closeEditBusModal = closeEditBusModal;
 window.saveBusEdits = saveBusEdits;
 window.deleteBus = deleteBus;
 window.updateBusDropdowns = updateBusDropdowns;
 window.updateBusesContent = updateBusesContent;
 window.attachBusesContentActionHandlers = attachBusesContentActionHandlers;
 window.refreshBusManagerUI = refreshBusManagerUI;
 window.escapeBusHtml = escapeBusHtml;
 window.wouldCreateBusParentCycle = wouldCreateBusParentCycle;
 window.getRenderableRootBuses = getRenderableRootBuses;
 window.formatNum = window.formatNum || formatBusNum;
}

console.log('✅ Bus Manager corrected build loaded');
console.log(' - Add/Edit bus visibility refresh: READY');
console.log(' - Insert-after bus support: READY');
console.log(' - Parent-cycle guard: READY');
console.log(' - Orphan parent fallback rendering: READY');
console.log(' - Buses tab rendering: READY');

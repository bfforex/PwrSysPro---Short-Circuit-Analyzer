// Bus Manager Module - Handles all bus-related operations
// Modified: 2025-12-02 by Copilot
// Enhanced: Option 1 - Separate display-only property for auto-calculated loads
// Previous: Feature #5 - Demand & Diversity Factors

/**
 * Open add bus modal
 * Enhanced: 2025-10-28 02:53:11 UTC by bfforex
 * Accessibility: Uses centralized modal manager
 */
function openAddBusModal() {
    const parentSelect = document.getElementById('newBusParent');
    parentSelect.innerHTML = '<option value="">None (Root Bus)</option>';
    buses.forEach(bus => {
        parentSelect.innerHTML += `<option value="${bus.id}">${bus.name} (${bus.voltage}V)</option>`;
    });
    
    // Open modal with accessibility support
    
    const insertAfterSelect = document.getElementById('insertAfterBus');
    if (insertAfterSelect) {
        insertAfterSelect.innerHTML = '<option value="">None (Add at end)</option>';
        buses.forEach(bus => {
            insertAfterSelect.innerHTML += `<option value="${bus.id}">${bus.name} (${bus.voltage}V)</option>`;
        });
    }

    openModal('addBusModal', function() {
        // Focus first input
        const firstInput = document.getElementById('newBusName');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 150);
        }
    });
}

/**
 * Close add bus modal
 * Enhanced: 2025-10-28 02:53:11 UTC by bfforex
 * Accessibility: Uses centralized modal manager
 */
function closeAddBusModal() {
    document.getElementById('newBusName').value = '';
    document.getElementById('newBusVoltage').value = '';
    document.getElementById('newBusType').value = 'distribution';
    document.getElementById('newBusParent').value = '';
    
    // Clear load current if field exists
    const loadField = document.getElementById('newBusLoad');
    if (loadField) loadField.value = '';
    
    // Clear demand/diversity factors
    const demandField = document.getElementById('newBusDemandFactor');
    if (demandField) demandField.value = '1.0';
    
    const diversityField = document.getElementById('newBusDiversityFactor');
    if (diversityField) diversityField.value = '';
    
    document.getElementById('newBusUtilityFault').value = '';
    document.getElementById('newBusUtilityMVA').value = '';
    document.getElementById('newBusUtilityXR').value = '3';
    document.getElementById('utilityMode').value = 'kA';
    document.getElementById('utilitySourceGroup').style.display = 'none';
    document.getElementById('utilityXRGroup').style.display = 'none';
    document.getElementById('utilityModeGroup').style.display = 'none';
    document.getElementById('faultCurrentMode').style.display = 'block';
    document.getElementById('faultMVAMode').style.display = 'none';
    
    // Clear any errors
    if (typeof clearModalErrors === 'function') {
        clearModalErrors('addBusModal');
    }
    
    // Close modal with accessibility support
    closeModal('addBusModal');
}

/**
 * Toggle utility fields based on bus type
 */
function toggleUtilityFields() {
    const busType = document.getElementById('newBusType').value;
    const isSource = busType === 'source';
    document.getElementById('utilitySourceGroup').style.display = isSource ? 'block' : 'none';
    document.getElementById('utilityXRGroup').style.display = isSource ? 'block' : 'none';
    document.getElementById('utilityModeGroup').style.display = isSource ? 'block' : 'none';
}

/**
 * Toggle utility input mode (kA vs MVA)
 */
function toggleUtilityInputMode() {
    const mode = document.getElementById('utilityMode').value;
    const faultCurrentDiv = document.getElementById('faultCurrentMode');
    const faultMVADiv = document.getElementById('faultMVAMode');
    
    if (mode === 'kA') {
        faultCurrentDiv.style.display = 'block';
        faultMVADiv.style.display = 'none';
    } else {
        faultCurrentDiv.style.display = 'none';
        faultMVADiv.style.display = 'block';
    }
}

/**
 * Toggle edit utility input mode
 */
function toggleEditUtilityInputMode() {
    const mode = document.getElementById('editUtilityMode').value;
    const faultCurrentDiv = document.getElementById('editFaultCurrentMode');
    const faultMVADiv = document.getElementById('editFaultMVAMode');
    
    if (mode === 'kA') {
        faultCurrentDiv.style.display = 'block';
        faultMVADiv.style.display = 'none';
    } else {
        faultCurrentDiv.style.display = 'none';
        faultMVADiv.style.display = 'block';
    }
}

/**
 * Save new bus
 * Modified: 2025-12-02 by Copilot
 * Enhancement: Option 1 - Separate display-only property for auto-calculated loads
 * Previous: Feature #5 - Demand & Diversity Factors
 */
function saveBus() {
    const name = document.getElementById('newBusName').value.trim();
    const voltage = parseFloat(document.getElementById('newBusVoltage').value);
    const type = document.getElementById('newBusType').value;
    const parentId = document.getElementById('newBusParent').value;
    
    if (!name) {
        alert('Please enter a bus name.');
        return;
    }
    
    if (! voltage || voltage <= 0) {
        alert('Please enter a valid voltage.');
        return;
    }
    
    const bus = {
        id: generateBusId(),
        name: name,
        voltage: voltage,
        type: type,
        parentBus: parentId || null,
        faultCurrent: null,
        asymFaultCurrent: null,
        xrRatio: null,
        totalZ: null,
        created: new Date().toISOString()
    };
    
    // ═══════════════════════════════════════════════════════════════════════
    // OPTION 1: SEPARATE DISPLAY-ONLY PROPERTY FOR AUTO-CALCULATED LOADS
    // Modified: 2025-12-02 by Copilot
    // - bus.loadCurrent: User-specified manual load (used in calculations)
    // - bus.loadCurrentCalculated: Auto-calculated display value (NOT used in calculations)
    // ═══════════════════════════════════════════════════════════════════════
    const loadField = document.getElementById('newBusLoad');
    if (loadField) {
        const loadCurrent = parseFloat(loadField.value);
        if (loadCurrent && loadCurrent > 0) {
            bus.loadCurrent = loadCurrent;  // Manual load - WILL be used in calculations
            console.log(`✅ Bus ${name}: Manual load set to ${loadCurrent.toFixed(2)} A`);
        }
        // Note: loadCurrentCalculated will be set later by calculations.js
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // FEATURE #5: DEMAND & DIVERSITY FACTORS
    // Added: 2025-10-29 12:15:10 UTC by bfforex
    // ═══════════════════════════════════════════════════════════════════════
    
    // Store demand factor if specified
    const demandFactorField = document.getElementById('newBusDemandFactor');
    if (demandFactorField) {
        const demandFactor = parseFloat(demandFactorField.value);
        if (! isNaN(demandFactor) && demandFactor >= 0 && demandFactor <= 1) {
            bus.demandFactor = demandFactor;
            console.log(`✅ Bus ${name}: Demand factor set to ${(demandFactor * 100).toFixed(1)}%`);
        }
    }
    
    // Store diversity factor if specified
    const diversityFactorField = document.getElementById('newBusDiversityFactor');
    if (diversityFactorField) {
        const diversityFactor = parseFloat(diversityFactorField.value);
        if (! isNaN(diversityFactor) && diversityFactor >= 0 && diversityFactor <= 1) {
            bus.diversityFactor = diversityFactor;
            console.log(`✅ Bus ${name}: Diversity factor set to ${(diversityFactor * 100).toFixed(1)}%`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    
    if (type === 'source') {
        const utilityMode = document.getElementById('utilityMode').value;
        const utilityXR = parseFloat(document.getElementById('newBusUtilityXR').value) || 3;
        
        if (utilityMode === 'kA') {
            const utilityFault = parseFloat(document.getElementById('newBusUtilityFault').value);
            
            if (!utilityFault || utilityFault <= 0) {
                alert('Please enter available fault current for source bus.');
                return;
            }
            
            bus.utilityFaultCurrent = utilityFault;
            bus.utilityXR = utilityXR;
            bus.utilityMode = 'kA';
        } else {
            const utilityMVA = parseFloat(document.getElementById('newBusUtilityMVA').value);
            
            if (!utilityMVA || utilityMVA <= 0) {
                alert('Please enter available fault MVA for source bus.');
                return;
            }
            
            const voltageKV = voltage / 1000;
            const faultCurrentKA = utilityMVA / (SQRT3 * voltageKV);
            
            bus.utilityFaultMVA = utilityMVA;
            bus.utilityFaultCurrent = faultCurrentKA;
            bus.utilityXR = utilityXR;
            bus.utilityMode = 'MVA';
        }
    }
    
    const insertAfterId = document.getElementById('insertAfterBus')?.value;
    if (insertAfterId) {
        const index = buses.findIndex(b => b.id === insertAfterId);
        if (index !== -1) {
            buses.splice(index + 1, 0, bus);
        } else {
            buses.push(bus);
        }
    } else {
        buses.push(bus);
    }
    updateBusTree();
    updateBusDropdowns();
    updateBusesContent();
    closeAddBusModal();
    scheduleAutoSave();
    
    alert(`Bus "${name}" added successfully! `);
}


/**
 * Update bus tree display
 */
function updateBusTree() {
  const tree = document.getElementById('busTree');
  if (buses.length === 0) {
    tree.innerHTML = '<div class="alert alert-info">No buses created yet. Click "Add New Bus" to start.</div>';
    return;
  }
  const rootBuses = buses.filter(b => ! b.parentBus);
  let html = '';
  rootBuses.forEach(bus => {
    html += renderBusTree(bus, 0);
  });
  tree.innerHTML = html;
  if (typeof refreshDiagramIfNeeded === 'function') refreshDiagramIfNeeded();
}



/**
 * Render bus tree recursively
 * Modified: 2025-12-02 by Copilot
 * Enhancement: Display both manual and auto-calculated loads with visual distinction
 */
function renderBusTree(bus, level) {
  const children = buses.filter(b => b.parentBus === bus.id);
  const hasChildren = children.length > 0;

  // Class based on fault level (safe checks)
  const faultVal = Number.isFinite(bus.faultCurrent) ? bus.faultCurrent : null;
  const faultClass = faultVal != null
    ? (faultVal > 50 ? 'high' : (faultVal > 25 ? 'medium' : ''))
    : '';

  const isSelected = selectedBusId === bus.id;
  const voltageDisplay = formatNum(bus.voltage, 0, '—');

  // ═══════════════════════════════════════════════════════════════════════
  // OPTION 1: DISPLAY BOTH MANUAL AND AUTO-CALCULATED LOADS
  // Modified: 2025-12-02 by Copilot
  // - Manual loads: Blue badge with 📌 (user-specified, used in calculations)
  // - Auto-calculated loads: Green badge with ⚡ (computed from downstream, display only)
  // ═══════════════════════════════════════════════════════════════════════
  
  let loadBadge = '';
  
  // Show manual load (user-specified) with blue badge
  if (Number.isFinite(bus.loadCurrent) && bus.loadCurrent > 0) {
    loadBadge = `<span class="badge badge-primary" title="User-specified load (used in calculations)" style="background-color: #4a90e2;">
      📌 ${formatNum(bus.loadCurrent, 1)}A Manual
    </span>`;
  }
  
  // Show auto-calculated load (from downstream) with green badge
  if (Number.isFinite(bus.loadCurrentCalculated) && bus.loadCurrentCalculated > 0) {
    // If there's also a manual load, show both; otherwise just show calculated
    if (bus.loadCurrent && bus.loadCurrent > 0) {
      // Show both: manual AND calculated
      loadBadge += ` <span class="badge badge-success" title="Auto-calculated from downstream (display only)" style="background-color: #28a745;">
        ⚡ ${formatNum(bus.loadCurrentCalculated, 1)}A Calc
      </span>`;
    } else {
      // Show only calculated (no manual load specified)
      loadBadge = `<span class="badge badge-success" title="Auto-calculated from downstream (display only)">
        ⚡ ${formatNum(bus.loadCurrentCalculated, 1)}A
      </span>`;
    }
  }

  const demandBadge = Number.isFinite(bus.demandFactor) && bus.demandFactor < 1.0
    ? `<span class="badge badge-warning">DF:${formatNum(bus.demandFactor * 100, 0)}%</span>`
    : '';

  const faultBadge = Number.isFinite(bus.faultCurrent)
    ? `<span class="bus-fault ${faultClass}">${formatNum(bus.faultCurrent, 2)} kA</span>`
    : '';

  let html = `
    <div class="bus-item bus-level-${level} ${isSelected ? 'selected' : ''}" onclick="selectBus('${bus.id}')" data-bus-id="${bus.id}">
      <div class="bus-header">
        <div>
          <span class="bus-name">${getBusIcon(bus.type)} ${bus.name}</span>
          <span class="bus-voltage">${voltageDisplay}V</span>
          ${bus.type === 'source' ?  '<span class="badge badge-info">SOURCE</span>' : ''}
          ${loadBadge}
          ${demandBadge}
        </div>
        ${faultBadge}
      </div>
      <div class="bus-controls">
        <button class="btn btn-info btn-small" onclick="event.stopPropagation(); editBus('${bus.id}')">✎ Edit</button>
        <button class="btn btn-danger btn-small" onclick="event.stopPropagation(); deleteBus('${bus.id}')">✕ Delete</button>
        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); calculateBus('${bus.id}')">🔢 Calculate</button>
      </div>
    </div>
  `;

  if (hasChildren) {
    html += '<div class="bus-children">';
    children.forEach(child => {
      html += renderBusTree(child, level + 1);
    });
    html += '</div>';
  }
  return html;
}

/**
 * Select a bus
 */
function selectBus(busId) {
    selectedBusId = busId;
    updateBusTree();
    
    const bus = buses.find(b => b.id === busId);
    if (bus && bus.faultCurrent !== null) {
        switchTab(null, 'results');
    }
}

/**
 * Edit bus
 * Modified: 2025-12-02 by Copilot
 * Enhancement: Show calculated load as info only, don't populate input field
 */
function editBus(busId) {
    editingBusId = busId;
    const bus = buses.find(b => b.id === busId);
    if (! bus) return;
    
    const modalBody = document.getElementById('editBusModalBody');
    
    // ═══════════════════════════════════════════════════════════════════════
    // OPTION 1: SHOW ONLY MANUAL LOAD IN INPUT FIELD
    // Modified: 2025-12-02 by Copilot
    // - Input field shows only manual load (bus.loadCurrent)
    // - Auto-calculated load shown as info text below (bus.loadCurrentCalculated)
    // ═══════════════════════════════════════════════════════════════════════
    const loadInputValue = (bus.loadCurrent && bus.loadCurrent > 0) ? bus.loadCurrent : '';
    
    let autoCalcInfoHTML = '';
    if (Number.isFinite(bus.loadCurrentCalculated) && bus.loadCurrentCalculated > 0) {
        autoCalcInfoHTML = `
            <div class="small-muted" style="color: #28a745; margin-top: 8px; padding: 10px; background: #f0f9f4; border-left: 3px solid #28a745; border-radius: 4px;">
                ⚡ <strong>Auto-calculated load:</strong> ${formatNum(bus.loadCurrentCalculated, 2)} A
                <br><small style="color: #666;">Computed from downstream components (motors, transformers, cables)</small>
            </div>
        `;
    }
    
    let utilityFieldsHTML = '';
    if (bus.type === 'source') {
        const mode = bus.utilityMode || 'kA';
        utilityFieldsHTML = `
            <div class="form-group">
                <label>Utility Source Data Mode:</label>
                <select id="editUtilityMode" onchange="toggleEditUtilityInputMode()">
                    <option value="kA" ${mode === 'kA' ? 'selected' : ''}>Fault Current (kA)</option>
                    <option value="MVA" ${mode === 'MVA' ? 'selected' : ''}>Fault MVA</option>
                </select>
            </div>
            <div id="editFaultCurrentMode" style="display: ${mode === 'kA' ?  'block' : 'none'};">
                <div class="form-group">
                    <label>Available Fault Current (kA):</label>
                    <input type="number" id="editBusUtilityFault" value="${bus.utilityFaultCurrent || ''}" step="0.1" min="0">
                </div>
            </div>
            <div id="editFaultMVAMode" style="display: ${mode === 'MVA' ? 'block' : 'none'};">
                <div class="form-group">
                    <label>Available Fault MVA:</label>
                    <input type="number" id="editBusUtilityMVA" value="${bus.utilityFaultMVA || ''}" step="0.1" min="0">
                </div>
            </div>
            <div class="form-group">
                <label>Source X/R Ratio:</label>
                <input type="number" id="editBusUtilityXR" value="${bus.utilityXR || 3}" step="0.1" min="0">
            </div>
        `;
    }
    
    modalBody.innerHTML = `
        <div class="form-group">
            <label>Bus Name:</label>
            <input type="text" id="editBusName" value="${bus.name}">
        </div>
        <div class="form-group">
            <label>Bus Voltage (V):</label>
            <input type="number" id="editBusVoltage" value="${bus.voltage}" step="0.1" min="0">
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
            <label>Bus Load Current (A) - Optional:
                <span class="tooltip">ℹ️
                    <span class="tooltiptext">Specify direct load on this bus that should be included in calculations. Leave blank to use only downstream loads.</span>
                </span>
            </label>
            <input type="number" id="editBusLoad" value="${loadInputValue}" step="0.1" min="0" placeholder="Manual load (optional)">
            <div class="small-muted">If specified, this manual load will be ADDED to downstream loads in calculations</div>
            ${autoCalcInfoHTML}
        </div>
        
        <details class="collapsible-section">
            <summary style="cursor: pointer; padding: 10px; background: #f0f0f0; border-radius: 5px; margin: 10px 0;">
                ⚡ Demand & Diversity Factors (Optional - Feature #5)
            </summary>
            <div style="padding: 10px; border: 1px solid #e0e0e0; border-radius: 5px; margin-top: 5px;">
                <div class="form-group">
                    <label for="editBusDemandFactor">
                        Demand Factor (0.0 - 1.0):
                        <span class="tooltip">ℹ️
                            <span class="tooltiptext">Ratio of the maximum demand of a system (or part of a system) to the total connected load of the system (or part of the system) under consideration. NEC Article 220. Default: 1.0 (100%). Example: 0.85 for 85% demand.</span>
                        </span>
                    </label>
                    <input type="number" id="editBusDemandFactor" value="${bus.demandFactor || 1.0}" step="0.01" min="0" max="1" placeholder="1.0">
                    <small style="color: #666; font-size: 0.85em;">NEC Article 220 - Demand factors for load calculations</small>
                </div>
                
                <div class="form-group">
                    <label for="editBusDiversityFactor">
                        Diversity Factor (1.0 - 4.0):
                        <span class="tooltip">ℹ️
                            <span class="tooltiptext">Ratio of the sum of the individual maximum demands of the various subdivisions of a system to the maximum demand of the whole system.IEEE 141.Leave blank for automatic based on bus type.</span>
                        </span>
                    </label>
                    <input type="number" id="editBusDiversityFactor" value="${bus.diversityFactor || ''}" step="0.01" min="1" max="4" placeholder="Auto">
                    <small style="color: #666; font-size: 0.85em;">IEEE 141 - Diversity factors. Auto: Source=1.1%, Distribution=1.2%, Branch=1.25%</small>
                </div>
            </div>
        </details>
        
        ${utilityFieldsHTML}
    `;
    
    // Open modal with accessibility support
    openModal('editBusModal', function() {
        // Focus first input
        const firstInput = document.getElementById('editBusName');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 150);
        }
    });
}

/**
 * Close edit bus modal
 * Enhanced: 2025-10-28 02:53:11 UTC by bfforex
 * Accessibility: Uses centralized modal manager
 */
function closeEditBusModal() {
    editingBusId = null;
    
    // Clear any errors
    if (typeof clearModalErrors === 'function') {
        clearModalErrors('editBusModal');
    }
    
    // Close modal with accessibility support
    closeModal('editBusModal');
}

/**
 * Save bus edits
 * Modified: 2025-12-02 by Copilot
 * Enhancement: Preserve separation between manual and auto-calculated loads
 */
function saveBusEdits() {
    if (!editingBusId) return;
    
    const bus = buses.find(b => b.id === editingBusId);
    if (!bus) return;
    
    bus.name = document.getElementById('editBusName').value.trim();
    bus.voltage = parseFloat(document.getElementById('editBusVoltage').value);
    
    // ═══════════════════════════════════════════════════════════════════════
    // OPTION 1: UPDATE ONLY MANUAL LOAD (PRESERVE AUTO-CALCULATED)
    // Modified: 2025-12-02 by Copilot
    // - Only update bus.loadCurrent (manual load used in calculations)
    // - Preserve bus.loadCurrentCalculated (will be updated on next calculation)
    // ═══════════════════════════════════════════════════════════════════════
    const editLoadField = document.getElementById('editBusLoad');
    if (editLoadField) {
        const loadCurrent = parseFloat(editLoadField.value);
        if (loadCurrent && loadCurrent > 0) {
            bus.loadCurrent = loadCurrent;  // Manual load
            console.log(`✅ Bus ${bus.name}: Manual load updated to ${loadCurrent.toFixed(2)} A`);
        } else {
            // Clear manual load (but keep calculated load for display)
            delete bus.loadCurrent;
            console.log(`🔄 Bus ${bus.name}: Manual load cleared`);
        }
        // Note: loadCurrentCalculated is NOT touched here - it will be updated on next calculation
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // FEATURE #5: DEMAND & DIVERSITY FACTORS
    // Added: 2025-10-29 12:15:10 UTC by bfforex
    // ═══════════════════════════════════════════════════════════════════════
    
    // Save demand factor
    const editDemandFactorField = document.getElementById('editBusDemandFactor');
    if (editDemandFactorField) {
        const demandFactor = parseFloat(editDemandFactorField.value);
        if (! isNaN(demandFactor) && demandFactor >= 0 && demandFactor <= 1) {
            bus.demandFactor = demandFactor;
            console.log(`✅ Bus ${bus.name}: Demand factor updated to ${(demandFactor * 100).toFixed(1)}%`);
        } else {
            bus.demandFactor = 1.0; // Default
        }
    }
    
    // Save diversity factor
    const editDiversityFactorField = document.getElementById('editBusDiversityFactor');
    if (editDiversityFactorField) {
        const diversityFactor = parseFloat(editDiversityFactorField.value);
        if (!isNaN(diversityFactor) && diversityFactor >= 0 && diversityFactor <= 1) {
            bus.diversityFactor = diversityFactor;
            console.log(`✅ Bus ${bus.name}: Diversity factor updated to ${(diversityFactor * 100).toFixed(1)}%`);
        } else {
            delete bus.diversityFactor;
            console.log(`🔄 Bus ${bus.name}: Using automatic diversity factor`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    
    if (bus.type === 'source') {
        const editUtilityMode = document.getElementById('editUtilityMode');
        const editUtilityXR = document.getElementById('editBusUtilityXR');
        
        if (editUtilityMode) {
            const mode = editUtilityMode.value;
            bus.utilityMode = mode;
            bus.utilityXR = parseFloat(editUtilityXR.value) || 3;
            
            if (mode === 'kA') {
                const utilityFault = document.getElementById('editBusUtilityFault');
                if (utilityFault) {
                    bus.utilityFaultCurrent = parseFloat(utilityFault.value);
                }
            } else {
                const utilityMVA = document.getElementById('editBusUtilityMVA');
                if (utilityMVA) {
                    const mva = parseFloat(utilityMVA.value);
                    bus.utilityFaultMVA = mva;
                    const voltageKV = bus.voltage / 1000;
                    bus.utilityFaultCurrent = mva / (SQRT3 * voltageKV);
                }
            }
        }
    }
    
    updateBusTree();
    updateBusDropdowns();
    updateBusesContent();
    closeEditBusModal();
    scheduleAutoSave();
}

/**
 * Delete bus
 */
function deleteBus(busId) {
    const bus = buses.find(b => b.id === busId);
    if (! bus) return;
    
    const children = buses.filter(b => b.parentBus === busId);
    if (children.length > 0) {
        const childNames = children.map(c => `"${c.name}"`).join(', ');
        alert(`Cannot delete "${bus.name}" because it has ${children.length} child bus(es):\n\n${childNames}\n\nPlease delete child buses first.`);
        return;
    }
    
    const connectedComponents = components.filter(c => c.fromBus === busId || c.toBus === busId);
    if (connectedComponents.length > 0) {
        if (! confirm(`Bus "${bus.name}" has ${connectedComponents.length} component(s) connected.Delete anyway?`)) {
            return;
        }
        components = components.filter(c => c.fromBus !== busId && c.toBus !== busId);
    }
    
    if (confirm(`Are you sure you want to delete bus "${bus.name}"?`)) {
        buses = buses.filter(b => b.id !== busId);
        updateBusTree();
        updateBusDropdowns();
        updateComponentsList();
        updateBusesContent();
        scheduleAutoSave();
    }
}

/**
 * Update bus dropdowns
 */
function updateBusDropdowns() {
    const fromBus = document.getElementById('fromBus');
    const toBus = document.getElementById('toBus');
    
    if (! fromBus || !toBus) return;
    
    fromBus.innerHTML = '<option value="">Select source bus</option>';
    toBus.innerHTML = '<option value="">Select destination bus</option>';
    
    buses.forEach(bus => {
        fromBus.innerHTML += `<option value="${bus.id}">${bus.name} (${bus.voltage}V)</option>`;
        toBus.innerHTML += `<option value="${bus.id}">${bus.name} (${bus.voltage}V)</option>`;
    });
}


// (Optional) Export a safe formatter to avoid .toFixed crashes in renderers
window.formatNum = (value, decimals = 2, fallback = '—') => {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n.toFixed(decimals) : fallback;
};



/**
 * Update buses content display
 * Modified: 2025-12-02 by Copilot
 * Enhancement: Display both manual and auto-calculated loads
 */
function updateBusesContent() {
  const content = document.getElementById('busesContent');
  if (!content) return;

  if (buses.length === 0) {
    content.innerHTML = '<div class="alert alert-info">No buses created yet. Use the Bus Manager to add buses to your system.</div>';
    return;
  }

  let html = '';
  buses.forEach(bus => {
    const children = buses.filter(b => b.parentBus === bus.id);
    const componentsFrom = components.filter(c => c.fromBus === bus.id);
    const componentsTo = components.filter(c => c.toBus === bus.id);

    const voltageDisplay = formatNum(bus.voltage, 0, '—');
    
    // ═══════════════════════════════════════════════════════════════════════
    // OPTION 1: SHOW BOTH MANUAL AND AUTO-CALCULATED LOADS
    // Modified: 2025-12-02 by Copilot
    // ═══════════════════════════════════════════════════════════════════════
    let loadBadge = '';
    if (Number.isFinite(bus.loadCurrent) && bus.loadCurrent > 0) {
      loadBadge = `<span class="badge badge-primary" style="background-color: #4a90e2;">📌 ${formatNum(bus.loadCurrent, 1)}A Manual</span>`;
    }
    if (Number.isFinite(bus.loadCurrentCalculated) && bus.loadCurrentCalculated > 0) {
      loadBadge += ` <span class="badge badge-success">⚡ ${formatNum(bus.loadCurrentCalculated, 1)}A Calc</span>`;
    }

    const demandBadge = Number.isFinite(bus.demandFactor) && bus.demandFactor < 1.0
      ? `<span class="badge badge-warning">DF:${formatNum(bus.demandFactor * 100, 0)}%</span>`
      : '';

    const diversityBadge = Number.isFinite(bus.diversityFactor)
      ? `<span class="badge badge-info">Div:${formatNum(bus.diversityFactor * 100, 0)}%</span>`
      : '';

    const faultLine = Number.isFinite(bus.faultCurrent)
      ? `
        <br><br>
        <strong style="color: var(--success);">Fault Current: ${formatNum(bus.faultCurrent, 3)} kA</strong>
        ${Number.isFinite(bus.asymFaultCurrent) ? `&nbsp;&nbsp;Peak: ${formatNum(bus.asymFaultCurrent, 3)} kA` : ''}
        ${Number.isFinite(bus.xrRatio) ? `&nbsp;&nbsp;X/R: ${formatNum(bus.xrRatio, 2)}` : ''}
      `
      : '';

    const utilityLine = (bus.type === 'source' && Number.isFinite(bus.utilityFaultCurrent))
      ? `
        <br><small style="color: var(--text-muted);">
          Utility Available: ${formatNum(bus.utilityFaultCurrent, 2)} kA
          ${Number.isFinite(bus.utilityFaultMVA) ? ` (${formatNum(bus.utilityFaultMVA, 1)} MVA)` : ''}
          &nbsp;&nbsp;X/R: ${bus.utilityXR ??  '—'}
        </small>
      `
      : '';

    html += `
      <div class="result-item">
        <strong>${getBusIcon(bus.type)} ${bus.name}</strong>
        ${bus.type === 'source' ?  '<span class="badge badge-info">SOURCE</span>' : ''}
        ${loadBadge}
        ${demandBadge}
        ${diversityBadge}
        <br>
        <span style="color: var(--text-muted);">
          Voltage: ${voltageDisplay}V
          &nbsp;&nbsp;Type: ${bus.type}
          &nbsp;&nbsp;Children: ${children.length}
          &nbsp;&nbsp;Components: ${componentsFrom.length + componentsTo.length}
        </span>
        ${faultLine}
        ${utilityLine}
      </div>
    `;
  });

  content.innerHTML = html;
  if (typeof refreshDiagramIfNeeded === 'function') refreshDiagramIfNeeded();
}

console.log('✅ Bus Manager loaded with Option 1: Separate Display Property for Auto-Calculated Loads');
console.log('   - bus.loadCurrent: Manual user-specified load (used in calculations)');
console.log('   - bus.loadCurrentCalculated: Auto-calculated load (display only)');
console.log('   - Visual distinction: 📌 Blue (Manual) | ⚡ Green (Calculated)');
console.log('   - Feature #5: Demand & Diversity Factors integrated');
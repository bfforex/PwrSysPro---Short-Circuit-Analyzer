// Bus Manager Module - Handles all bus-related operations
// Modified: 2025-10-29 12:15:10 UTC by bfforex
// Enhanced: Feature #5 - Demand & Diversity Factors

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
 * Modified: 2025-10-29 12:15:10 UTC by bfforex
 * Added: Feature #5 - Demand & Diversity Factors
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
    
    if (!voltage || voltage <= 0) {
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
    
    // Store load current if specified
    const loadField = document.getElementById('newBusLoad');
    if (loadField) {
        const loadCurrent = parseFloat(loadField.value);
        if (loadCurrent && loadCurrent > 0) {
            bus.loadCurrent = loadCurrent;
            console.log(`✅ Bus ${name}: Load current set to ${loadCurrent} A`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // FEATURE #5: DEMAND & DIVERSITY FACTORS
    // Added: 2025-10-29 12:15:10 UTC by bfforex
    // ═══════════════════════════════════════════════════════════════════════
    
    // Store demand factor if specified
    const demandFactorField = document.getElementById('newBusDemandFactor');
    if (demandFactorField) {
        const demandFactor = parseFloat(demandFactorField.value);
        if (!isNaN(demandFactor) && demandFactor >= 0 && demandFactor <= 1) {
            bus.demandFactor = demandFactor;
            console.log(`✅ Bus ${name}: Demand factor set to ${(demandFactor * 100).toFixed(1)}%`);
        }
    }
    
    // Store diversity factor if specified
    const diversityFactorField = document.getElementById('newBusDiversityFactor');
    if (diversityFactorField) {
        const diversityFactor = parseFloat(diversityFactorField.value);
        if (!isNaN(diversityFactor) && diversityFactor >= 0 && diversityFactor <= 1) {
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
    
    alert(`Bus "${name}" added successfully!`);
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
    
    const rootBuses = buses.filter(b => !b.parentBus);
    let html = '';
    
    rootBuses.forEach(bus => {
        html += renderBusTree(bus, 0);
    });
    
    tree.innerHTML = html;
  if (typeof refreshDiagramIfNeeded === 'function') refreshDiagramIfNeeded();
}

/**
 * Render bus tree recursively
 */
function renderBusTree(bus, level) {
    const children = buses.filter(b => b.parentBus === bus.id);
    const hasChildren = children.length > 0;
    const faultClass = bus.faultCurrent ? (bus.faultCurrent > 50 ? 'high' : (bus.faultCurrent > 25 ? 'medium' : '')) : '';
    const isSelected = selectedBusId === bus.id;
    
    let html = `
        <div class="bus-item bus-level-${level} ${isSelected ? 'selected' : ''}" onclick="selectBus('${bus.id}')" data-bus-id="${bus.id}">
            <div class="bus-header">
                <div>
                    <span class="bus-name">${getBusIcon(bus.type)} ${bus.name}</span>
                    <span class="bus-voltage">${bus.voltage}V</span>
                    ${bus.type === 'source' ? '<span class="badge badge-info">SOURCE</span>' : ''}
                    ${bus.loadCurrent ? `<span class="badge badge-success">${bus.loadCurrent.toFixed(1)}A</span>` : ''}
                    ${bus.demandFactor && bus.demandFactor < 1.0 ? `<span class="badge badge-warning">DF:${(bus.demandFactor * 100).toFixed(0)}%</span>` : ''}
                </div>
                ${bus.faultCurrent !== null ? `<span class="bus-fault ${faultClass}">${bus.faultCurrent.toFixed(2)} kA</span>` : ''}
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
 * Enhanced: 2025-10-29 12:15:10 UTC by bfforex
 * Feature #5: Demand & Diversity Factors
 */
function editBus(busId) {
    editingBusId = busId;
    const bus = buses.find(b => b.id === busId);
    if (!bus) return;
    
    const modalBody = document.getElementById('editBusModalBody');
    
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
            <div id="editFaultCurrentMode" style="display: ${mode === 'kA' ? 'block' : 'none'};">
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
                    <span class="tooltiptext">Specify direct load on this bus. Leave blank to calculate from downstream loads automatically.</span>
                </span>
            </label>
            <input type="number" id="editBusLoad" value="${bus.loadCurrent || ''}" step="0.1" min="0" placeholder="Auto-calculated if blank">
            <div class="small-muted">If blank, load will be calculated from motors, transformers, and cables downstream</div>
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
                            <span class="tooltiptext">Ratio of the sum of the individual maximum demands of the various subdivisions of a system to the maximum demand of the whole system. . IEEE 141. Leave blank for automatic based on bus type.</span>
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
 * Modified: 2025-10-29 12:15:10 UTC by bfforex
 * Added: Feature #5 - Demand & Diversity Factors
 */
function saveBusEdits() {
    if (!editingBusId) return;
    
    const bus = buses.find(b => b.id === editingBusId);
    if (!bus) return;
    
    bus.name = document.getElementById('editBusName').value.trim();
    bus.voltage = parseFloat(document.getElementById('editBusVoltage').value);
    
    // Save load current
    const editLoadField = document.getElementById('editBusLoad');
    if (editLoadField) {
        const loadCurrent = parseFloat(editLoadField.value);
        if (loadCurrent && loadCurrent > 0) {
            bus.loadCurrent = loadCurrent;
            console.log(`✅ Bus ${bus.name}: Load current updated to ${loadCurrent} A`);
        } else {
            delete bus.loadCurrent;
            console.log(`🔄 Bus ${bus.name}: Load current cleared (will auto-calculate)`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // FEATURE #5: DEMAND & DIVERSITY FACTORS
    // Added: 2025-10-29 12:15:10 UTC by bfforex
    // ═══════════════════════════════════════════════════════════════════════
    
    // Save demand factor
    const editDemandFactorField = document.getElementById('editBusDemandFactor');
    if (editDemandFactorField) {
        const demandFactor = parseFloat(editDemandFactorField.value);
        if (!isNaN(demandFactor) && demandFactor >= 0 && demandFactor <= 1) {
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
    if (!bus) return;
    
    const children = buses.filter(b => b.parentBus === busId);
    if (children.length > 0) {
        const childNames = children.map(c => `"${c.name}"`).join(', ');
        alert(`Cannot delete "${bus.name}" because it has ${children.length} child bus(es):\n\n${childNames}\n\nPlease delete child buses first.`);
        return;
    }
    
    const connectedComponents = components.filter(c => c.fromBus === busId || c.toBus === busId);
    if (connectedComponents.length > 0) {
        if (!confirm(`Bus "${bus.name}" has ${connectedComponents.length} component(s) connected. Delete anyway?`)) {
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
    
    if (!fromBus || !toBus) return;
    
    fromBus.innerHTML = '<option value="">Select source bus</option>';
    toBus.innerHTML = '<option value="">Select destination bus</option>';
    
    buses.forEach(bus => {
        fromBus.innerHTML += `<option value="${bus.id}">${bus.name} (${bus.voltage}V)</option>`;
        toBus.innerHTML += `<option value="${bus.id}">${bus.name} (${bus.voltage}V)</option>`;
    });
}

/**
 * Update buses content display
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
        
        html += `
            <div class="result-item">
                <strong>${getBusIcon(bus.type)} ${bus.name}</strong>
                ${bus.type === 'source' ? '<span class="badge badge-info">SOURCE</span>' : ''}
                ${bus.loadCurrent ? `<span class="badge badge-success">${bus.loadCurrent.toFixed(1)}A Load</span>` : ''}
                ${bus.demandFactor && bus.demandFactor < 1.0 ? `<span class="badge badge-warning">DF:${(bus.demandFactor * 100).toFixed(0)}%</span>` : ''}
                ${bus.diversityFactor ? `<span class="badge badge-info">Div:${(bus.diversityFactor * 100).toFixed(0)}%</span>` : ''}
                <br>
                <span style="color: var(--text-muted);">
                    Voltage: ${bus.voltage}V | 
                    Type: ${bus.type} | 
                    Children: ${children.length} | 
                    Components: ${componentsFrom.length + componentsTo.length}
                    ${bus.loadCurrent ? ` | Load: ${bus.loadCurrent.toFixed(1)}A` : ''}
                </span>
                ${bus.faultCurrent !== null ? `
                    <br><br>
                    <strong style="color: var(--success);">Fault Current: ${bus.faultCurrent.toFixed(3)} kA</strong> |
                    Peak: ${bus.asymFaultCurrent.toFixed(3)} kA |
                    X/R: ${bus.xrRatio.toFixed(2)}
                ` : ''}
                ${bus.type === 'source' && bus.utilityFaultCurrent ? `
                    <br><small style="color: var(--text-muted);">
                    Utility Available: ${bus.utilityFaultCurrent.toFixed(2)} kA
                    ${bus.utilityFaultMVA ? ` (${bus.utilityFaultMVA.toFixed(1)} MVA)` : ''}
                    | X/R: ${bus.utilityXR}
                    </small>
                ` : ''}
            </div>
        `;
    });
    
    content.innerHTML = html;
  if (typeof refreshDiagramIfNeeded === 'function') refreshDiagramIfNeeded();
}

console.log('✅ Bus Manager loaded with Demand & Diversity Factors (Feature #5)');
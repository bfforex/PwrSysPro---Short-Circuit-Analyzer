// Bus Manager Module - Handles all bus-related operations
// Modified: 2025-10-28 02:53:11 UTC by bfforex
// Enhanced: Accessibility support with modal manager integration

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
 * Modified: 2025-10-27 16:26:23 UTC by bfforex
 * Added: Store load current for dynamic load calculation
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
    
    buses.push(bus);
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
 * Enhanced: 2025-10-28 02:53:11 UTC by bfforex
 * Accessibility: Uses centralized modal manager
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
 * Modified: 2025-10-27 16:26:23 UTC by bfforex
 * Added: Save load current
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
}
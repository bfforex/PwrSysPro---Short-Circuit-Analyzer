// Component Manager Module - Handles all component operations
// Modified: 2025-10-27 16:46:49 UTC by bfforex
// Enhanced: Full parallel cables support implementation

/**
 * Get icon for component type
 * Added: 2025-10-27 17:01:09 UTC by bfforex
 * Fixed: Missing function error
 */
function getComponentIcon(type) {
    const icons = {
        'cable': '🔌',
        'transformer': '⚡',
        'generator': '🔋',
        'motor': '⚙️',
        'breaker': '🔲',
        'fuse': '⚡',
        'reactor': '🔄',
        'capacitor': '⚙️'
    };
    return icons[type] || '📦';
}

/**
 * Render component input fields based on type
 * Modified: 2025-10-27 16:46:49 UTC by bfforex
 * Enhanced: Added parallel cables support for all cable inputs
 */
function renderComponentInputs() {
    const componentType = document.getElementById('componentType').value;
    const container = document.getElementById('componentInputs');
    
    if (componentType === 'cable') {
        container.innerHTML = `
            <div class="form-group">
                <label for="cableSize">Cable Size:</label>
                <select id="cableSize" aria-label="Select cable size">
                    <option value="14">14 AWG</option>
                    <option value="12">12 AWG</option>
                    <option value="10">10 AWG</option>
                    <option value="8">8 AWG</option>
                    <option value="6">6 AWG</option>
                    <option value="4">4 AWG</option>
                    <option value="3">3 AWG</option>
                    <option value="2">2 AWG</option>
                    <option value="1">1 AWG</option>
                    <option value="1/0">1/0 AWG</option>
                    <option value="2/0">2/0 AWG</option>
                    <option value="3/0">3/0 AWG</option>
                    <option value="4/0" selected>4/0 AWG</option>
                    <option value="250">250 kcmil</option>
                    <option value="300">300 kcmil</option>
                    <option value="350">350 kcmil</option>
                    <option value="400">400 kcmil</option>
                    <option value="500">500 kcmil</option>
                    <option value="600">600 kcmil</option>
                    <option value="750">750 kcmil</option>
                    <option value="1000">1000 kcmil</option>
                </select>
            </div>
            <div class="form-group">
                <label for="cableMaterial">Material:</label>
                <select id="cableMaterial" aria-label="Select cable material">
                    <option value="copper" selected>Copper</option>
                    <option value="aluminum">Aluminum</option>
                </select>
            </div>
            <div class="form-group">
                <label for="cableLength">Length (ft):</label>
                <input type="number" id="cableLength" placeholder="e.g., 100" step="0.1" min="0" aria-label="Cable length in feet">
            </div>
            
            <!-- ═══════════════════════════════════════════════════════════ -->
            <!-- 🔥 NEW: PARALLEL CABLES INPUT -->
            <!-- Added: 2025-10-27 16:46:49 UTC by bfforex -->
            <!-- ═══════════════════════════════════════════════════════════ -->
            <div class="form-group">
                <label for="cableParallel">Number of Parallel Cables:
                    <span class="tooltip">ℹ️
                        <span class="tooltiptext">Running multiple cables in parallel reduces impedance and increases ampacity. Per NEC 310.10(G), parallel conductors must be same length, material, size, and insulation.</span>
                    </span>
                </label>
                <select id="cableParallel" aria-label="Number of parallel cables">
                    <option value="1" selected>1 (Single Cable)</option>
                    <option value="2">2 Cables in Parallel</option>
                    <option value="3">3 Cables in Parallel</option>
                    <option value="4">4 Cables in Parallel</option>
                    <option value="5">5 Cables in Parallel</option>
                    <option value="6">6 Cables in Parallel</option>
                </select>
                <div class="small-muted">
                    <strong>NEC 310.10(G):</strong> Parallel cables divide impedance and multiply ampacity.
                    <br><strong>Example:</strong> 2 cables in parallel = Z÷2, Ampacity×2
                </div>
            </div>
            <!-- ═══════════════════════════════════════════════════════════ -->
            
            <div class="form-group">
                <label for="cableConduit">Conduit Type:</label>
                <select id="cableConduit" aria-label="Select conduit type">
                    <option value="PVC" selected>PVC</option>
                    <option value="Steel">Steel</option>
                    <option value="Aluminum">Aluminum</option>
                </select>
            </div>
            <div class="form-group">
                <label for="cableLoadCurrent">Load Current (A) - Optional:
                    <span class="tooltip">ℹ️
                        <span class="tooltiptext">Specify load current for voltage drop calculation. Leave blank to use downstream loads or default value.</span>
                    </span>
                </label>
                <input type="number" id="cableLoadCurrent" placeholder="Auto-calculated if blank" step="0.1" min="0" aria-label="Cable load current in amperes">
                <div class="small-muted">If blank, load will be calculated from downstream equipment</div>
            </div>
        `;
    } else if (componentType === 'transformer') {
        container.innerHTML = `
            <div class="form-group">
                <label for="transformerRating">Transformer Rating (kVA):</label>
                <input type="number" id="transformerRating" placeholder="e.g., 500" step="0.1" min="0" aria-label="Transformer rating in kVA">
            </div>
            <div class="form-group">
                <label for="transformerPrimary">Primary Voltage (V):</label>
                <input type="number" id="transformerPrimary" placeholder="e.g., 13800" step="0.1" min="0" aria-label="Primary voltage in volts">
            </div>
            <div class="form-group">
                <label for="transformerSecondary">Secondary Voltage (V):</label>
                <input type="number" id="transformerSecondary" placeholder="e.g., 480" step="0.1" min="0" aria-label="Secondary voltage in volts">
            </div>
            <div class="form-group">
                <label for="transformerImpedance">Impedance (%):</label>
                <input type="number" id="transformerImpedance" placeholder="e.g., 5.75" step="0.01" min="0" value="5.75" aria-label="Transformer impedance percentage">
            </div>
            <div class="form-group">
                <label for="transformerXR">X/R Ratio:</label>
                <input type="number" id="transformerXR" placeholder="e.g., 7" step="0.1" min="0" value="7" aria-label="Transformer X/R ratio">
            </div>
        `;
    } else if (componentType === 'generator') {
        container.innerHTML = `
            <div class="form-group">
                <label for="generatorRating">Generator Rating (kVA):</label>
                <input type="number" id="generatorRating" placeholder="e.g., 1000" step="0.1" min="0" aria-label="Generator rating in kVA">
            </div>
            <div class="form-group">
                <label for="generatorVoltage">Voltage (V):</label>
                <input type="number" id="generatorVoltage" placeholder="e.g., 480" step="0.1" min="0" aria-label="Generator voltage in volts">
            </div>
            <div class="form-group">
                <label for="generatorXd">Subtransient Reactance X"d (%):</label>
                <input type="number" id="generatorXd" placeholder="e.g., 15" step="0.1" min="0" value="15" aria-label="Generator subtransient reactance">
            </div>
            <div class="form-group">
                <label for="generatorXR">X/R Ratio:</label>
                <input type="number" id="generatorXR" placeholder="e.g., 20" step="0.1" min="0" value="20" aria-label="Generator X/R ratio">
            </div>
        `;
    } else if (componentType === 'motor') {
        container.innerHTML = `
            <div class="form-group">
                <label for="motorHP">Motor Horsepower (HP):</label>
                <input type="number" id="motorHP" placeholder="e.g., 100" step="0.1" min="0" aria-label="Motor horsepower">
            </div>
            <div class="form-group">
                <label for="motorType">Motor Type:</label>
                <select id="motorType" aria-label="Select motor type">
                    <option value="induction" selected>Induction Motor</option>
                    <option value="synchronous">Synchronous Motor</option>
                </select>
            </div>
        `;
    }
}

/**
 * Add component
 * Modified: 2025-10-27 16:46:49 UTC by bfforex
 * Enhanced: Store parallel cable count
 */
function addComponent() {
    const fromBusId = document.getElementById('fromBus').value;
    const toBusId = document.getElementById('toBus').value;
    const componentType = document.getElementById('componentType').value;
    
    if (!fromBusId || !toBusId) {
        alert('Please select both source and destination buses.');
        return;
    }
    
    if (fromBusId === toBusId) {
        alert('Source and destination buses must be different.');
        return;
    }
    
    const fromBus = buses.find(b => b.id === fromBusId);
    const toBus = buses.find(b => b.id === toBusId);
    
    if (!fromBus || !toBus) {
        alert('Invalid bus selection.');
        return;
    }
    
    let component = {
        id: generateComponentId(),
        type: componentType,
        fromBus: fromBusId,
        toBus: toBusId,
        fromBusName: fromBus.name,
        toBusName: toBus.name,
        created: new Date().toISOString()
    };
    
    if (componentType === 'cable') {
        const size = document.getElementById('cableSize').value;
        const material = document.getElementById('cableMaterial').value;
        const length = parseFloat(document.getElementById('cableLength').value);
        const conduit = document.getElementById('cableConduit').value;
        
        // ═══════════════════════════════════════════════════════════
        // 🔥 NEW: GET PARALLEL CABLE COUNT
        // Added: 2025-10-27 16:46:49 UTC by bfforex
        // ═══════════════════════════════════════════════════════════
        const parallel = parseInt(document.getElementById('cableParallel').value) || 1;
        // ═══════════════════════════════════════════════════════════
        
        const loadCurrentField = document.getElementById('cableLoadCurrent');
        const loadCurrent = loadCurrentField ? parseFloat(loadCurrentField.value) : null;
        
        if (!length || length <= 0) {
            alert('Please enter a valid cable length.');
            return;
        }
        
        component.size = size;
        component.material = material;
        component.length = length;
        component.conduit = conduit;
        component.parallel = parallel; // 🔥 STORE PARALLEL COUNT
        
        if (loadCurrent && loadCurrent > 0) {
            component.loadCurrent = loadCurrent;
        }
        
        const parallelLabel = parallel > 1 ? ` (${parallel}×)` : '';
        component.name = `${size} ${material.toUpperCase()}${parallelLabel} - ${length}ft`;
        
        console.log(`✅ Cable added: ${component.name} | Parallel: ${parallel} | Z÷${parallel}`);
        
    } else if (componentType === 'transformer') {
        const rating = parseFloat(document.getElementById('transformerRating').value);
        const primary = parseFloat(document.getElementById('transformerPrimary').value);
        const secondary = parseFloat(document.getElementById('transformerSecondary').value);
        const impedance = parseFloat(document.getElementById('transformerImpedance').value);
        const xr = parseFloat(document.getElementById('transformerXR').value);
        
        if (!rating || !primary || !secondary || !impedance) {
            alert('Please fill in all transformer parameters.');
            return;
        }
        
        component.rating = rating;
        component.primary = primary;
        component.secondary = secondary;
        component.impedance = impedance;
        component.xr = xr;
        component.name = `${rating} kVA Transformer (${primary}V / ${secondary}V)`;
        
    } else if (componentType === 'generator') {
        const rating = parseFloat(document.getElementById('generatorRating').value);
        const voltage = parseFloat(document.getElementById('generatorVoltage').value);
        const xd = parseFloat(document.getElementById('generatorXd').value);
        const xr = parseFloat(document.getElementById('generatorXR').value);
        
        if (!rating || !voltage || !xd) {
            alert('Please fill in all generator parameters.');
            return;
        }
        
        component.rating = rating;
        component.voltage = voltage;
        component.xd = xd;
        component.xr = xr;
        component.name = `${rating} kVA Generator`;
        
    } else if (componentType === 'motor') {
        const hp = parseFloat(document.getElementById('motorHP').value);
        const motorType = document.getElementById('motorType').value;
        
        if (!hp || hp <= 0) {
            alert('Please enter a valid motor horsepower.');
            return;
        }
        
        component.hp = hp;
        component.motorType = motorType;
        component.name = `${hp} HP ${motorType} Motor`;
    }
    
    components.push(component);
    updateComponentsList();
    updateComponentDropdowns();
    scheduleAutoSave();
    
    alert(`Component added: ${component.name || componentType}`);
}

/**
 * Update components list display
 * Modified: 2025-10-27 16:46:49 UTC by bfforex
 * Enhanced: Show parallel cable configuration with styling
 */
function updateComponentsList() {
    const list = document.getElementById('componentsList');
    
    if (components.length === 0) {
        list.innerHTML = '<div class="alert alert-info">No components added yet. Add components to connect your buses.</div>';
        return;
    }
    
    let html = '';
    components.forEach(comp => {
        let details = '';
        
        if (comp.type === 'cable') {
            // ═══════════════════════════════════════════════════════════
            // 🔥 ENHANCED: SHOW PARALLEL CONFIGURATION WITH BADGES
            // Modified: 2025-10-27 16:46:49 UTC by bfforex
            // ═══════════════════════════════════════════════════════════
            const parallel = comp.parallel || 1;
            const parallelBadge = parallel > 1 ? 
                `<span class="badge badge-warning" style="margin-left: 8px;">${parallel}× Parallel</span>` : '';
            
            const impedanceNote = parallel > 1 ? 
                `<br><strong>Effective:</strong> Z ÷ ${parallel} | Ampacity × ${parallel}` : '';
            
            details = `<strong>Size:</strong> ${comp.size} ${comp.material.toUpperCase()}${parallelBadge}<br>
                       <strong>Length:</strong> ${comp.length} ft | <strong>Conduit:</strong> ${comp.conduit}${impedanceNote}`;
            
            if (comp.loadCurrent) {
                details += `<br><strong>Load Current:</strong> ${comp.loadCurrent.toFixed(1)} A`;
            }
            // ═══════════════════════════════════════════════════════════
            
        } else if (comp.type === 'transformer') {
            details = `<strong>Rating:</strong> ${comp.rating} kVA<br>
                       <strong>Voltage:</strong> ${comp.primary}V / ${comp.secondary}V<br>
                       <strong>Impedance:</strong> ${comp.impedance}% | <strong>X/R:</strong> ${comp.xr}`;
        } else if (comp.type === 'generator') {
            details = `<strong>Rating:</strong> ${comp.rating} kVA<br>
                       <strong>Voltage:</strong> ${comp.voltage}V | <strong>X"d:</strong> ${comp.xd}%<br>
                       <strong>X/R:</strong> ${comp.xr}`;
        } else if (comp.type === 'motor') {
            details = `<strong>HP:</strong> ${comp.hp}<br>
                       <strong>Type:</strong> ${comp.motorType}`;
        }
        
        html += `
            <div class="component-item">
                <div class="component-header">
                    <span class="component-type">${getComponentIcon(comp.type)} ${comp.type.toUpperCase()}</span>
                    <div class="component-controls">
                        <button class="btn btn-info btn-small" onclick="editComponent('${comp.id}')">✎ Edit</button>
                        <button class="btn btn-danger btn-small" onclick="deleteComponent('${comp.id}')">✕ Delete</button>
                    </div>
                </div>
                <div class="component-details">${details}</div>
                <div class="component-bus-info">
                    <strong>Connection:</strong> ${comp.fromBusName} → ${comp.toBusName}
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
}

/**
 * Edit component
 * Enhanced: 2025-10-28 02:53:11 UTC by bfforex
 * Accessibility: Uses centralized modal manager
 */
function editComponent(compId) {
    // Convert string ID to number if needed
    const id = typeof compId === 'string' ? parseInt(compId) : compId;
    editingComponentId = id;
    
    const comp = components.find(c => c.id == id);
    if (!comp) {
        console.error('Component not found:', id, 'Available IDs:', components.map(c => c.id));
        alert('Error: Component not found. Please refresh the page.');
        return;
    }
    
    const modalBody = document.getElementById('editComponentModalBody');
    let inputsHTML = '';
    
    if (comp.type === 'cable') {
        const parallel = comp.parallel || 1;
        
        inputsHTML = `
            <div class="form-group">
                <label>Cable Size:</label>
                <select id="editCableSize">
                    ${['14', '12', '10', '8', '6', '4', '3', '2', '1', '1/0', '2/0', '3/0', '4/0', '250', '300', '350', '400', '500', '600', '750', '1000'].map(size => 
                        `<option value="${size}" ${comp.size === size ? 'selected' : ''}>${size} ${parseInt(size) > 100 ? 'kcmil' : 'AWG'}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Material:</label>
                <select id="editCableMaterial">
                    <option value="copper" ${comp.material === 'copper' ? 'selected' : ''}>Copper</option>
                    <option value="aluminum" ${comp.material === 'aluminum' ? 'selected' : ''}>Aluminum</option>
                </select>
            </div>
            <div class="form-group">
                <label>Length (ft):</label>
                <input type="number" id="editCableLength" value="${comp.length}" step="0.1" min="0">
            </div>
            
            <div class="form-group">
                <label>Number of Parallel Cables:
                    <span class="tooltip">ℹ️
                        <span class="tooltiptext">NEC 310.10(G): All parallel conductors must be same length, material, size, and insulation type.</span>
                    </span>
                </label>
                <select id="editCableParallel" onchange="updateParallelPreview()">
                    ${[1, 2, 3, 4, 5, 6].map(num => 
                        `<option value="${num}" ${parallel === num ? 'selected' : ''}>${num} Cable${num > 1 ? 's' : ''}${num > 1 ? ' in Parallel' : ''}</option>`
                    ).join('')}
                </select>
                <div class="small-muted" id="parallelPreview" style="margin-top: 8px; padding: 8px; background: rgba(102, 126, 234, 0.1); border-radius: 4px;">
                    <strong>Effect:</strong>
                    <br>• Impedance: <strong>Z ÷ ${parallel}</strong>
                    <br>• Ampacity: <strong>Amp × ${parallel}</strong>
                    <br>• Voltage Drop: <strong>Reduced by ${parallel}×</strong>
                </div>
            </div>
            
            <div class="form-group">
                <label>Conduit Type:</label>
                <select id="editCableConduit">
                    <option value="PVC" ${comp.conduit === 'PVC' ? 'selected' : ''}>PVC</option>
                    <option value="Steel" ${comp.conduit === 'Steel' ? 'selected' : ''}>Steel</option>
                    <option value="Aluminum" ${comp.conduit === 'Aluminum' ? 'selected' : ''}>Aluminum</option>
                </select>
            </div>
            <div class="form-group">
                <label>Load Current (A) - Optional:</label>
                <input type="number" id="editCableLoadCurrent" value="${comp.loadCurrent || ''}" step="0.1" min="0" placeholder="Auto-calculated">
                <div class="small-muted">Leave blank to calculate from downstream equipment</div>
            </div>
        `;
    } else if (comp.type === 'transformer') {
        inputsHTML = `
            <div class="form-group">
                <label>Transformer Rating (kVA):</label>
                <input type="number" id="editTransformerRating" value="${comp.rating}" step="0.1" min="0">
            </div>
            <div class="form-group">
                <label>Primary Voltage (V):</label>
                <input type="number" id="editTransformerPrimary" value="${comp.primary}" step="0.1" min="0">
            </div>
            <div class="form-group">
                <label>Secondary Voltage (V):</label>
                <input type="number" id="editTransformerSecondary" value="${comp.secondary}" step="0.1" min="0">
            </div>
            <div class="form-group">
                <label>Impedance (%):</label>
                <input type="number" id="editTransformerImpedance" value="${comp.impedance}" step="0.01" min="0">
            </div>
            <div class="form-group">
                <label>X/R Ratio:</label>
                <input type="number" id="editTransformerXR" value="${comp.xr}" step="0.1" min="0">
            </div>
        `;
    } else if (comp.type === 'generator') {
        inputsHTML = `
            <div class="form-group">
                <label>Generator Rating (kVA):</label>
                <input type="number" id="editGeneratorRating" value="${comp.rating}" step="0.1" min="0">
            </div>
            <div class="form-group">
                <label>Voltage (V):</label>
                <input type="number" id="editGeneratorVoltage" value="${comp.voltage}" step="0.1" min="0">
            </div>
            <div class="form-group">
                <label>Subtransient Reactance X"d (%):</label>
                <input type="number" id="editGeneratorXd" value="${comp.xd}" step="0.1" min="0">
            </div>
            <div class="form-group">
                <label>X/R Ratio:</label>
                <input type="number" id="editGeneratorXR" value="${comp.xr}" step="0.1" min="0">
            </div>
        `;
    } else if (comp.type === 'motor') {
        inputsHTML = `
            <div class="form-group">
                <label>Motor Horsepower (HP):</label>
                <input type="number" id="editMotorHP" value="${comp.hp}" step="0.1" min="0">
            </div>
            <div class="form-group">
                <label>Motor Type:</label>
                <select id="editMotorType">
                    <option value="induction" ${comp.motorType === 'induction' ? 'selected' : ''}>Induction Motor</option>
                    <option value="synchronous" ${comp.motorType === 'synchronous' ? 'selected' : ''}>Synchronous Motor</option>
                </select>
            </div>
        `;
    }
    
    modalBody.innerHTML = inputsHTML;
    
    // Open modal with accessibility support
    openModal('editComponentModal', function() {
        // Focus first input
        setTimeout(() => {
            const firstInput = modalBody.querySelector('input, select');
            if (firstInput) firstInput.focus();
        }, 150);
    });
}

/**
 * Update parallel preview in edit modal
 * Added: 2025-10-27 16:46:49 UTC by bfforex
 */
function updateParallelPreview() {
    const parallelField = document.getElementById('editCableParallel');
    const previewDiv = document.getElementById('parallelPreview');
    
    if (!parallelField || !previewDiv) return;
    
    const parallel = parseInt(parallelField.value) || 1;
    
    previewDiv.innerHTML = `
        <strong>Effect of ${parallel} Cable${parallel > 1 ? 's' : ''} in Parallel:</strong>
        <br>• Impedance: <strong>Z ÷ ${parallel}</strong>
        <br>• Ampacity: <strong>Amp × ${parallel}</strong>
        <br>• Voltage Drop: <strong>Reduced by ${parallel}×</strong>
        ${parallel > 1 ? `<br><br><small style="color: var(--warning);">⚠️ NEC 310.10(G): All parallel conductors must be same length, size, material, and insulation.</small>` : ''}
    `;
}

/**
 * Save component edits
 * Modified: 2025-10-27 16:46:49 UTC by bfforex
 * Enhanced: Save parallel cable count with validation
 */
function saveComponentEdits() {
    if (!editingComponentId) return;
    
    const comp = components.find(c => c.id === editingComponentId);
    if (!comp) return;
    
    if (comp.type === 'cable') {
        comp.size = document.getElementById('editCableSize').value;
        comp.material = document.getElementById('editCableMaterial').value;
        comp.length = parseFloat(document.getElementById('editCableLength').value);
        comp.conduit = document.getElementById('editCableConduit').value;
        
        // ═══════════════════════════════════════════════════════════
        // 🔥 NEW: SAVE AND VALIDATE PARALLEL COUNT
        // Added: 2025-10-27 16:46:49 UTC by bfforex
        // ═══════════════════════════════════════════════════════════
        const parallelField = document.getElementById('editCableParallel');
        if (parallelField) {
            const newParallel = parseInt(parallelField.value) || 1;
            const oldParallel = comp.parallel || 1;
            
            comp.parallel = newParallel;
            
            if (newParallel !== oldParallel) {
                console.log(`🔄 Cable parallel changed: ${oldParallel}× → ${newParallel}×`);
                console.log(`   Impedance effect: Z ÷ ${newParallel}`);
                console.log(`   Ampacity effect: Amp × ${newParallel}`);
            }
        }
        // ═══════════════════════════════════════════════════════════
        
        const loadField = document.getElementById('editCableLoadCurrent');
        if (loadField) {
            const loadCurrent = parseFloat(loadField.value);
            if (loadCurrent && loadCurrent > 0) {
                comp.loadCurrent = loadCurrent;
            } else {
                delete comp.loadCurrent;
            }
        }
        
        const parallel = comp.parallel || 1;
        const parallelLabel = parallel > 1 ? ` (${parallel}×)` : '';
        comp.name = `${comp.size} ${comp.material.toUpperCase()}${parallelLabel} - ${comp.length}ft`;
        
    } else if (comp.type === 'transformer') {
        comp.rating = parseFloat(document.getElementById('editTransformerRating').value);
        comp.primary = parseFloat(document.getElementById('editTransformerPrimary').value);
        comp.secondary = parseFloat(document.getElementById('editTransformerSecondary').value);
        comp.impedance = parseFloat(document.getElementById('editTransformerImpedance').value);
        comp.xr = parseFloat(document.getElementById('editTransformerXR').value);
        comp.name = `${comp.rating} kVA Transformer (${comp.primary}V / ${comp.secondary}V)`;
        
    } else if (comp.type === 'generator') {
        comp.rating = parseFloat(document.getElementById('editGeneratorRating').value);
        comp.voltage = parseFloat(document.getElementById('editGeneratorVoltage').value);
        comp.xd = parseFloat(document.getElementById('editGeneratorXd').value);
        comp.xr = parseFloat(document.getElementById('editGeneratorXR').value);
        comp.name = `${comp.rating} kVA Generator`;
        
    } else if (comp.type === 'motor') {
        comp.hp = parseFloat(document.getElementById('editMotorHP').value);
        comp.motorType = document.getElementById('editMotorType').value;
        comp.name = `${comp.hp} HP ${comp.motorType} Motor`;
    }
    
    updateComponentsList();
    closeEditComponentModal();
    scheduleAutoSave();
    
    console.log(`✅ Component updated: ${comp.name}`);
}

/**
 * Close edit component modal
 * Enhanced: 2025-10-28 02:53:11 UTC by bfforex
 * Accessibility: Uses centralized modal manager
 */
function closeEditComponentModal() {
    editingComponentId = null;
    
    // Clear any errors
    if (typeof clearModalErrors === 'function') {
        clearModalErrors('editComponentModal');
    }
    
    // Close modal with accessibility support
    closeModal('editComponentModal');
}

/**
 * Delete component
 * Fixed: 2025-10-28 02:00:19 UTC by bfforex
 * Issue: ID type mismatch (string vs number)
 */
function deleteComponent(compId) {
    // Convert string ID to number if needed
    const id = typeof compId === 'string' ? parseInt(compId) : compId;
    
    const comp = components.find(c => c.id == id); // Use == for loose comparison
    if (!comp) {
        console.error('Component not found:', id, 'Available IDs:', components.map(c => c.id));
        alert('Error: Component not found. Please refresh the page.');
        return;
    }
    
    if (confirm(`Are you sure you want to delete component "${comp.name || comp.type}"?`)) {
        components = components.filter(c => c.id != id); // Use != for loose comparison
        updateComponentsList();
        updateComponentDropdowns();
        scheduleAutoSave();
        console.log(`🗑️ Component deleted: ${comp.name || comp.type}`);
    }
}

/**
 * Update component dropdowns (if needed for future features)
 */
function updateComponentDropdowns() {
    // Placeholder for future component dropdown updates
    // Currently not used but reserved for future enhancements
}

/**
 * Initialize component type selector
 * Added: 2025-10-27 16:56:15 UTC by bfforex
 * Fixed: Missing function error
 */
function initComponentTypeSelector() {
    const componentTypeSelect = document.getElementById('componentType');
    if (componentTypeSelect) {
        componentTypeSelect.addEventListener('change', renderComponentInputs);
        renderComponentInputs(); // Initial render
    }
}

/**
 * Move component up or down in list
 * Added: 2025-10-27 16:56:15 UTC by bfforex
 * Fixed: Missing function error
 */
function moveComponent(compId, direction) {
    const index = components.findIndex(c => c.id === compId);
    
    if (index === -1) {
        console.error(`Component ${compId} not found`);
        return;
    }
    
    if (direction === 'up' && index > 0) {
        // Swap with previous component
        [components[index - 1], components[index]] = [components[index], components[index - 1]];
        console.log(`📤 Moved component up: ${components[index].name}`);
    } else if (direction === 'down' && index < components.length - 1) {
        // Swap with next component
        [components[index], components[index + 1]] = [components[index + 1], components[index]];
        console.log(`📥 Moved component down: ${components[index].name}`);
    } else {
        console.warn(`Cannot move component ${direction} from position ${index}`);
        return;
    }
    
    updateComponentsList();
    scheduleAutoSave();
}

/**
 * Move component to specific position
 * Added: 2025-10-27 16:56:15 UTC by bfforex
 */
function moveComponentToPosition(compId, newIndex) {
    const oldIndex = components.findIndex(c => c.id === compId);
    
    if (oldIndex === -1) {
        console.error(`Component ${compId} not found`);
        return;
    }
    
    if (newIndex < 0 || newIndex >= components.length) {
        console.error(`Invalid position ${newIndex}`);
        return;
    }
    
    const [movedComponent] = components.splice(oldIndex, 1);
    components.splice(newIndex, 0, movedComponent);
    
    console.log(`🔀 Moved component to position ${newIndex}: ${movedComponent.name}`);
    
    updateComponentsList();
    scheduleAutoSave();
}

/**
 * Initialize component manager on DOM load
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Initializing Component Manager...');
    
    const componentTypeSelect = document.getElementById('componentType');
    if (componentTypeSelect) {
        componentTypeSelect.addEventListener('change', renderComponentInputs);
        renderComponentInputs(); // Initial render
        console.log('✅ Component type selector initialized');
    }
});

// Export all functions to global scope
window.renderComponentInputs = renderComponentInputs;
window.addComponent = addComponent;
window.updateComponentsList = updateComponentsList;
window.editComponent = editComponent;
window.updateParallelPreview = updateParallelPreview;
window.saveComponentEdits = saveComponentEdits;
window.closeEditComponentModal = closeEditComponentModal;
window.deleteComponent = deleteComponent;
window.updateComponentDropdowns = updateComponentDropdowns;
window.initComponentTypeSelector = initComponentTypeSelector;
window.moveComponent = moveComponent;
window.moveComponentToPosition = moveComponentToPosition;

console.log('✅ Component Manager module loaded with parallel cables support');
console.log('   - Functions exported: 11');
console.log('   - Parallel cables: Enabled');
console.log('   - Move/reorder: Enabled');
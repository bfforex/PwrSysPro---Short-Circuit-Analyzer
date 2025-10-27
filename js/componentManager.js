// Component Manager Module - Handles all component-related operations

// Component input templates
const COMPONENT_INPUTS = {
    transformer: `
        <div class="form-group">
            <label>Rating (kVA):</label>
            <input type="number" id="xfmrRating" placeholder="e.g., 1000" step="0.1" min="0" required>
        </div>
        <div class="form-group">
            <label>Impedance (%):</label>
            <input type="number" id="xfmrImpedance" placeholder="e.g., 5.75" step="0.01" min="0" required>
        </div>
        <div class="form-group">
            <label>X/R Ratio:</label>
            <input type="number" id="xfmrXR" placeholder="e.g., 5" step="0.1" min="0" required>
        </div>
    `,
    cable: `
        <div class="form-group">
            <label>Length (feet):</label>
            <input type="number" id="cableLength" placeholder="e.g., 100" step="0.1" min="0" required>
        </div>
        <div class="form-group">
            <label>Size (AWG/kcmil):</label>
            <select id="cableSize">
                <option value="14">14 AWG</option>
                <option value="12">12 AWG</option>
                <option value="10">10 AWG</option>
                <option value="8">8 AWG</option>
                <option value="6">6 AWG</option>
                <option value="4">4 AWG</option>
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
            <label>Material:</label>
            <select id="cableMaterial">
                <option value="copper">Copper</option>
                <option value="aluminum">Aluminum</option>
            </select>
        </div>
        <div class="form-group">
            <label>Conduit Type:</label>
            <select id="conduitType">
                <option value="pvc">PVC</option>
                <option value="steel">Steel</option>
                <option value="aluminum">Aluminum</option>
            </select>
        </div>
        <div class="form-group">
            <label>Conductors per Phase:</label>
            <input type="number" id="cableParallel" placeholder="e.g., 1" step="1" min="1" value="1">
        </div>
        <div class="form-group">
            <label>Cable Load Current (A) - Optional:</label>
            <input type="number" id="cableLoadCurrent" placeholder="Leave blank to use project default" step="0.1" min="0">
        </div>
    `,
    generator: `
        <div class="form-group">
            <label>Rating (kVA):</label>
            <input type="number" id="genRating" placeholder="e.g., 500" step="0.1" min="0" required>
        </div>
        <div class="form-group">
            <label>Subtransient Reactance (%):</label>
            <input type="number" id="genXd" placeholder="e.g., 12" step="0.1" min="0" required>
        </div>
        <div class="form-group">
            <label>X/R Ratio:</label>
            <input type="number" id="genXR" placeholder="e.g., 15" step="0.1" min="0" required>
        </div>
    `,
    motor: `
        <div class="form-group">
            <label>Total Motor HP:</label>
            <input type="number" id="motorHP" placeholder="e.g., 100" step="0.1" min="0" required>
        </div>
        <div class="form-group">
            <label>Motor Type:</label>
            <select id="motorType">
                <option value="induction">Induction</option>
                <option value="synchronous">Synchronous</option>
            </select>
        </div>
    `
};

/**
 * Initialize component type selector
 */
function initComponentTypeSelector() {
    document.getElementById('componentType').addEventListener('change', function() {
        document.getElementById('componentInputs').innerHTML = COMPONENT_INPUTS[this.value];
    });
    document.getElementById('componentInputs').innerHTML = COMPONENT_INPUTS.transformer;
}

/**
 * Add component
 */
function addComponent() {
    try {
        const fromBusId = document.getElementById('fromBus').value;
        const toBusId = document.getElementById('toBus').value;
        const type = document.getElementById('componentType').value;
        
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
        
        const component = { 
            type, 
            id: Date.now(),
            fromBus: fromBusId,
            toBus: toBusId,
            fromBusName: fromBus.name,
            toBusName: toBus.name
        };
        
        switch(type) {
            case 'transformer':
                component.rating = parseFloat(document.getElementById('xfmrRating').value);
                component.primary = fromBus.voltage;
                component.secondary = toBus.voltage;
                component.impedance = parseFloat(document.getElementById('xfmrImpedance').value);
                component.xr = parseFloat(document.getElementById('xfmrXR').value);
                
                if (!component.rating || !component.impedance || !component.xr) {
                    alert('Please fill all transformer fields.');
                    return;
                }
                break;
                
            case 'cable':
                component.length = parseFloat(document.getElementById('cableLength').value);
                component.size = document.getElementById('cableSize').value;
                component.material = document.getElementById('cableMaterial').value;
                component.conduit = document.getElementById('conduitType').value;
                component.voltage = fromBus.voltage;
                component.parallel = parseFloat(document.getElementById('cableParallel').value) || 1;
                
                const cableLoad = document.getElementById('cableLoadCurrent').value;
                if (cableLoad !== '') component.loadCurrent = parseFloat(cableLoad);
                
                if (!component.length) {
                    alert('Please enter cable length.');
                    return;
                }
                break;
                
            case 'generator':
                component.rating = parseFloat(document.getElementById('genRating').value);
                component.voltage = fromBus.voltage;
                component.xd = parseFloat(document.getElementById('genXd').value);
                component.xr = parseFloat(document.getElementById('genXR').value);
                
                if (!component.rating || !component.xd || !component.xr) {
                    alert('Please fill all generator fields.');
                    return;
                }
                break;
                
            case 'motor':
                component.hp = parseFloat(document.getElementById('motorHP').value);
                component.voltage = fromBus.voltage;
                component.motorType = document.getElementById('motorType').value;
                
                if (!component.hp) {
                    alert('Please enter motor HP.');
                    return;
                }
                break;
        }
        
        components.push(component);
        updateComponentsList();
        scheduleAutoSave();
        
        alert('Component added successfully!');
        
    } catch (error) {
        alert('Error adding component:\n\n' + error.message);
    }
}

/**
 * Update components list display
 */
function updateComponentsList() {
    const list = document.getElementById('componentsList');
    
    // ✅ FIXED: Check 'list' not 'container'
    if (!list) {
        console.error('❌ componentsList element not found in DOM');
        return;
    }
    
    if (components.length === 0) {
        list.innerHTML = '<div class="alert alert-info">No components added yet. Add components to connect your buses.</div>';
        return;
    }
    
    list.innerHTML = components.map((comp, index) => {
        let details = '';
        switch(comp.type) {
            case 'transformer':
                details = `${comp.rating} kVA | ${comp.primary}V/${comp.secondary}V | Z: ${comp.impedance}% | X/R: ${comp.xr}`;
                break;
            case 'cable':
                details = `${comp.length} ft | ${comp.size} ${comp.material} | ${comp.conduit} conduit`;
                if (comp.parallel > 1) details += ` | ${comp.parallel} parallel`;
                if (comp.loadCurrent) details += ` | Load: ${comp.loadCurrent} A`;
                break;
            case 'generator':
                details = `${comp.rating} kVA | X"d: ${comp.xd}% | X/R: ${comp.xr}`;
                break;
            case 'motor':
                details = `${comp.hp} HP | Type: ${comp.motorType}`;
                break;
        }
        
        return `
            <div class="component-item">
                <div class="component-header">
                    <span class="component-type">${index + 1}. ${comp.type.toUpperCase()}</span>
                    <div class="component-controls">
                        <button class="btn btn-info btn-small" onclick="editComponent(${index})">✎ Edit</button>
                        <button class="btn btn-secondary btn-small" onclick="moveComponent(${index}, -1)" title="Move Up">↑</button>
                        <button class="btn btn-secondary btn-small" onclick="moveComponent(${index}, 1)" title="Move Down">↓</button>
                        <button class="btn btn-danger btn-small" onclick="deleteComponent(${index})">✕</button>
                    </div>
                </div>
                <div class="component-details">${details}</div>
                <div class="component-bus-info">
                    <strong>From:</strong> ${comp.fromBusName} → <strong>To:</strong> ${comp.toBusName}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Edit component
 */
function editComponent(index) {
    editingComponentIndex = index;
    const comp = components[index];
    const modalBody = document.getElementById('editComponentModalBody');
    
    let editHTML = '';
    
    switch(comp.type) {
        case 'transformer':
            editHTML = `
                <div class="form-group">
                    <label>Rating (kVA):</label>
                    <input type="number" id="editXfmrRating" value="${comp.rating}" step="0.1" min="0">
                </div>
                <div class="form-group">
                    <label>Impedance (%):</label>
                    <input type="number" id="editXfmrImpedance" value="${comp.impedance}" step="0.01" min="0">
                </div>
                <div class="form-group">
                    <label>X/R Ratio:</label>
                    <input type="number" id="editXfmrXR" value="${comp.xr}" step="0.1" min="0">
                </div>
                <div class="small-muted">From: ${comp.fromBusName} (${comp.primary}V) → To: ${comp.toBusName} (${comp.secondary}V)</div>
            `;
            break;
            
        case 'cable':
            editHTML = `
                <div class="form-group">
                    <label>Length (feet):</label>
                    <input type="number" id="editCableLength" value="${comp.length}" step="0.1" min="0">
                </div>
                <div class="form-group">
                    <label>Size (AWG/kcmil):</label>
                    <select id="editCableSize">
                        <option value="14">14 AWG</option>
                        <option value="12">12 AWG</option>
                        <option value="10">10 AWG</option>
                        <option value="8">8 AWG</option>
                        <option value="6">6 AWG</option>
                        <option value="4">4 AWG</option>
                        <option value="2">2 AWG</option>
                        <option value="1">1 AWG</option>
                        <option value="1/0">1/0 AWG</option>
                        <option value="2/0">2/0 AWG</option>
                        <option value="3/0">3/0 AWG</option>
                        <option value="4/0">4/0 AWG</option>
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
                    <label>Material:</label>
                    <select id="editCableMaterial">
                        <option value="copper">Copper</option>
                        <option value="aluminum">Aluminum</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Conduit Type:</label>
                    <select id="editConduitType">
                        <option value="pvc">PVC</option>
                        <option value="steel">Steel</option>
                        <option value="aluminum">Aluminum</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Conductors per Phase:</label>
                    <input type="number" id="editCableParallel" value="${comp.parallel || 1}" step="1" min="1">
                </div>
                <div class="form-group">
                    <label>Cable Load Current (A) - Optional:</label>
                    <input type="number" id="editCableLoadCurrent" value="${comp.loadCurrent || ''}" step="0.1" min="0">
                </div>
                <div class="small-muted">From: ${comp.fromBusName} → To: ${comp.toBusName}</div>
            `;
            setTimeout(() => {
                document.getElementById('editCableSize').value = comp.size;
                document.getElementById('editCableMaterial').value = comp.material;
                document.getElementById('editConduitType').value = comp.conduit;
            }, 0);
            break;
            
        case 'generator':
            editHTML = `
                <div class="form-group">
                    <label>Rating (kVA):</label>
                    <input type="number" id="editGenRating" value="${comp.rating}" step="0.1" min="0">
                </div>
                <div class="form-group">
                    <label>Subtransient Reactance (%):</label>
                    <input type="number" id="editGenXd" value="${comp.xd}" step="0.1" min="0">
                </div>
                <div class="form-group">
                    <label>X/R Ratio:</label>
                    <input type="number" id="editGenXR" value="${comp.xr}" step="0.1" min="0">
                </div>
                <div class="small-muted">From: ${comp.fromBusName} → To: ${comp.toBusName}</div>
            `;
            break;
            
        case 'motor':
            editHTML = `
                <div class="form-group">
                    <label>Total Motor HP:</label>
                    <input type="number" id="editMotorHP" value="${comp.hp}" step="0.1" min="0">
                </div>
                <div class="form-group">
                    <label>Motor Type:</label>
                    <select id="editMotorType">
                        <option value="induction">Induction</option>
                        <option value="synchronous">Synchronous</option>
                    </select>
                </div>
                <div class="small-muted">From: ${comp.fromBusName} → To: ${comp.toBusName}</div>
            `;
            setTimeout(() => {
                document.getElementById('editMotorType').value = comp.motorType;
            }, 0);
            break;
    }
    
    modalBody.innerHTML = editHTML;
    document.getElementById('editComponentModal').style.display = 'block';
}

/**
 * Close edit component modal
 */
function closeEditComponentModal() {
    document.getElementById('editComponentModal').style.display = 'none';
    editingComponentIndex = null;
}

/**
 * Save component edits
 */
function saveComponentEdits() {
    if (editingComponentIndex === null) return;
    
    try {
        const comp = components[editingComponentIndex];
        
        switch(comp.type) {
            case 'transformer':
                comp.rating = parseFloat(document.getElementById('editXfmrRating').value);
                comp.impedance = parseFloat(document.getElementById('editXfmrImpedance').value);
                comp.xr = parseFloat(document.getElementById('editXfmrXR').value);
                break;
                
            case 'cable':
                comp.length = parseFloat(document.getElementById('editCableLength').value);
                comp.size = document.getElementById('editCableSize').value;
                comp.material = document.getElementById('editCableMaterial').value;
                comp.conduit = document.getElementById('editConduitType').value;
                comp.parallel = parseFloat(document.getElementById('editCableParallel').value) || 1;
                const cLoad = document.getElementById('editCableLoadCurrent').value;
                if (cLoad !== '') comp.loadCurrent = parseFloat(cLoad); else delete comp.loadCurrent;
                break;
                
            case 'generator':
                comp.rating = parseFloat(document.getElementById('editGenRating').value);
                comp.xd = parseFloat(document.getElementById('editGenXd').value);
                comp.xr = parseFloat(document.getElementById('editGenXR').value);
                break;
                
            case 'motor':
                comp.hp = parseFloat(document.getElementById('editMotorHP').value);
                comp.motorType = document.getElementById('editMotorType').value;
                break;
        }
        
        closeEditComponentModal();
        updateComponentsList();
        scheduleAutoSave();
    } catch (error) {
        alert('Error saving component edits:\n\n' + error.message);
    }
}

/**
 * Move component up or down
 */
function moveComponent(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= components.length) return;
    
    [components[index], components[newIndex]] = [components[newIndex], components[index]];
    updateComponentsList();
    scheduleAutoSave();
}

/**
 * Delete component
 */
function deleteComponent(index) {
    if (confirm('Are you sure you want to delete this component?')) {
        components.splice(index, 1);
        updateComponentsList();
        scheduleAutoSave();
    }
}

/**
 * Clear all data
 */
function clearAll() {
    if (confirm('Are you sure you want to clear all buses, components, and results?')) {
        buses = [];
        components = [];
        calculationResults = null;
        selectedBusId = null;
        updateBusTree();
        updateBusDropdowns();
        updateComponentsList();
        updateBusesContent();
        document.getElementById('resultsContainer').innerHTML = '<div class="alert alert-info">Run calculation to see results here.</div>';
        document.getElementById('calculationSteps').innerHTML = '<div class="alert alert-info">Detailed calculations will appear here after running the analysis.</div>';
        scheduleAutoSave();
    }
}
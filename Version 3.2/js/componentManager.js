/**
 * Component Manager - Enhanced with Cable Tagging & Motor Contribution
 * Handles all component operations (add, edit, delete, display)
 * 
 * @author bfforex
 * @date 2025-11-02 17:35:57 UTC
 * @version 2.2.0 - Enhanced Data Integrity (Issue #9)
 * 
 * FEATURES:
 * - Cable equipment tagging (Feature #7)
 * - From/To tracking with tags (Feature #8)
 * - Motor type selection for contribution calculations (Feature #1)
 * - Advanced motor parameters (efficiency, power factor)
 * - ✅ ISSUE #9: Enforced unique tag constraint (cables & transformers)
 * - Enhanced component details modal
 */

console.log('🔧 Loading Component Manager v2.2 - Enhanced Data Integrity...');
console.log('   ✅ Unique tag enforcement enabled (Issue #9)');

// ═══════════════════════════════════════════════════════════════════════════
// BUS TIE CONFIGURATION
// Added: 2025-11-04 by bfforex - Feature: Bus Tie Circuit Breaker Analysis
// ═══════════════════════════════════════════════════════════════════════════

const BUS_TIE_CONFIG = {
    TYPES: {
        CIRCUIT_BREAKER: 'circuit-breaker',
        BUS_COUPLER: 'bus-coupler'
    },
    STATES: {
        OPEN: 'open',
        CLOSED: 'closed'
    },
    DEFAULT_IMPEDANCE: 0.0001,
    DEFAULT_RATING: 1600,
    AUTO_TAG_PREFIX: 'BT'
};
window.BUS_TIE_CONFIG = BUS_TIE_CONFIG;

console.log('🔌 Bus Tie Configuration loaded');

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT INPUT GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update component input fields based on selected type
 * ENHANCED: 2025-10-29 14:14:42 UTC by bfforex
 * Feature #1: Motor type selection added
 */
function updateComponentInputs() {
    const type = document.getElementById('componentType').value;
    const container = document.getElementById('componentInputs');
    let html = '';

    if (type === 'transformer') {
        html = `
            <!-- ✅ NEW: Equipment Identification Section -->
            <div style="margin-bottom: 15px; padding: 10px; background: #f0f8ff; border-left: 4px solid #4CAF50;">
                <h4 style="margin-top: 0; color: #2196F3;">🏷️ Equipment Identification</h4>
                
                <div class="form-group">
                    <label for="transformerTag" style="font-weight: bold;">
                        Equipment Tag: <span style="color: red;">*</span>
                    </label>
                    <input 
                        type="text" 
                        id="transformerTag" 
                        placeholder="e.g., XFMR-LCA1-1000" 
                        required
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <small style="display: block; margin-top: 5px; color: #666;">
                        Unique identifier for this transformer (used in reports & drawings)
                    </small>
                </div>
                
                <div class="form-group">
                    <label for="transformerDescription">Description:</label>
                    <input 
                        type="text" 
                        id="transformerDescription" 
                        placeholder="e.g., Main distribution transformer"
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <small style="display: block; margin-top: 5px; color: #666;">
                        Brief description of transformer purpose
                    </small>
                </div>
            </div>
            
            <!-- Existing Electrical Ratings -->
            <div style="margin-bottom: 15px; padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107;">
                <h4 style="margin-top: 0; color: #ff9800;">⚡ Electrical Ratings</h4>
                
                <div class="form-group">
                    <label for="transformerRating">Rating (kVA): <span style="color: red;">*</span></label>
                    <input type="number" id="transformerRating" placeholder="e.g., 1000" step="0.1" min="0" required>
                </div>
                
                <div class="form-group">
                    <label for="transformerPrimary">Primary Voltage (V): <span style="color: red;">*</span></label>
                    <input type="number" id="transformerPrimary" placeholder="e.g., 13200" step="0.1" min="0" required>
                </div>
                
                <div class="form-group">
                    <label for="transformerSecondary">Secondary Voltage (V): <span style="color: red;">*</span></label>
                    <input type="number" id="transformerSecondary" placeholder="e.g., 480" step="0.1" min="0" required>
                </div>
                
                <div class="form-group">
                    <label for="transformerImpedance">Impedance (%): <span style="color: red;">*</span></label>
                    <input type="number" id="transformerImpedance" placeholder="e.g., 5.75" step="0.01" min="0" required>
                    <small style="display: block; margin-top: 5px; color: #666;">
                        Transformer impedance on its rating base (typically 2-6%)
                    </small>
                </div>
                
                <div class="form-group">
                    <label for="transformerXR">X/R Ratio: <span style="color: red;">*</span></label>
                    <input type="number" id="transformerXR" placeholder="e.g., 7" step="0.1" min="0" value="7" required>
                    <small style="display: block; margin-top: 5px; color: #666;">
                        Typical values: 5-15 for distribution transformers
                    </small>
                </div>
                
                <div class="form-group">
                    <label for="transformerTapSetting">
                        Tap Setting (%):
                        <span class="tooltip">ℹ️
                            <span class="tooltiptext">Adjust secondary voltage ±5% to compensate for voltage drop</span>
                        </span>
                    </label>
                    <select id="transformerTapSetting">
                        <option value="-5">-5.0% (Lower secondary voltage)</option>
                        <option value="-2.5">-2.5%</option>
                        <option value="0" selected>0% (Nominal - No adjustment)</option>
                        <option value="2.5">+2.5% (Boost voltage - Recommended)</option>
                        <option value="5">+5.0% (Maximum boost)</option>
                    </select>
                    <small style="color: #666; font-size: 0.85em;">
                        💡 Use positive taps (+2.5%, +5%) for long cable runs or low voltage at load<br>
                        📖 Per IEEE 141 - Tap changers compensate for system voltage drop
                    </small>
                </div>
            </div>
            
            <!-- ✅ NEW: Manufacturer Information -->
            <div style="margin-bottom: 15px; padding: 10px; background: #e8f5e9; border-left: 4px solid #4caf50;">
                <h4 style="margin-top: 0; color: #4caf50;">📋 Additional Information</h4>
                
                <div class="form-group">
                    <label for="transformerManufacturer">Manufacturer:</label>
                    <input 
                        type="text" 
                        id="transformerManufacturer" 
                        placeholder="e.g., ABB, Siemens, GE"
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div class="form-group">
                    <label for="transformerCatalog">Catalog Number:</label>
                    <input 
                        type="text" 
                        id="transformerCatalog" 
                        placeholder="Manufacturer part number"
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div class="form-group">
                    <label for="transformerInstallDate">Installation Date:</label>
                    <input 
                        type="date" 
                        id="transformerInstallDate"
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div class="form-group">
                    <label for="transformerNotes">Notes:</label>
                    <textarea 
                        id="transformerNotes" 
                        rows="2" 
                        placeholder="Additional notes about this transformer..."
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
                </div>
            </div>
        `;

    } else if (type === 'cable') {
        html = `
            <!-- ✅ Cable Tag (Required) -->
            <div class="form-group">
                <label for="cableTag">
                    🏷️ Cable Tag (Required):
                    <span class="tooltip">ℹ️
                        <span class="tooltiptext">Equipment tag for identification in drawings, reports, and recommendations</span>
                    </span>
                </label>
                <input type="text" id="cableTag" placeholder="e.g., C-001, FDR-A1, MAIN-FEEDER" required>
                <small style="color: #666; font-size: 0.85em;">Must be unique. Used throughout the application.</small>
            </div>
            
            <!-- ✅ Cable Description (Optional) -->
            <div class="form-group">
                <label for="cableDescription">Description (Optional):</label>
                <input type="text" id="cableDescription" placeholder="e.g., Main feeder to MVSG">
            </div>
            
            <div class="form-group">
                <label for="cableSize">Conductor Size:</label>
                <select id="cableSize" required>
                    <option value="">Select Size</option>
                    <optgroup label="AWG">
                        <option value="14">14 AWG</option>
                        <option value="12">12 AWG</option>
                        <option value="10">10 AWG</option>
                        <option value="8">8 AWG</option>
                        <option value="6">6 AWG</option>
                        <option value="4">4 AWG</option>
                        <option value="3">3 AWG</option>
                        <option value="2">2 AWG</option>
                        <option value="1">1 AWG</option>
                    </optgroup>
                    <optgroup label="Circular Mils (kcmil)">
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
                    </optgroup>
                </select>
            </div>
            <div class="form-group">
                <label for="cableMaterial">Material:</label>
                <select id="cableMaterial" required>
                    <option value="copper">Copper</option>
                    <option value="aluminum">Aluminum</option>
                </select>
            </div>
            <div class="form-group">
                <label for="cableLength">Length (ft):</label>
                <input type="number" id="cableLength" placeholder="e.g., 100" step="0.1" min="0" required>
            </div>
            <div class="form-group">
                <label for="cableConduit">Conduit Type:</label>
                <select id="cableConduit" required>
                    <option value="PVC">PVC</option>
                    <option value="Steel">Steel/EMT</option>
                    <option value="Aluminum">Aluminum</option>
                    <option value="NonMetallic">Non-Metallic</option>
                </select>
            </div>
            <div class="form-group">
                <label for="cableParallel">Parallel Runs:</label>
                <input type="number" id="cableParallel" value="1" min="1" max="10" required>
            </div>
            
            <!-- ✅ Collapsible Additional Cable Info -->
            <details class="collapsible-section">
                <summary style="cursor: pointer; padding: 10px; background: #f0f0f0; border-radius: 5px; margin: 10px 0;">
                    📋 Additional Cable Information (Optional)
                </summary>
                <div style="padding: 10px; border: 1px solid #e0e0e0; border-radius: 5px; margin-top: 5px;">
                    <div class="form-group">
                        <label for="cableManufacturer">Manufacturer:</label>
                        <input type="text" id="cableManufacturer" placeholder="e.g., Southwire, General Cable, Okonite">
                    </div>
                    
                    <div class="form-group">
                        <label for="cableCatalog">Catalog/Part Number:</label>
                        <input type="text" id="cableCatalog" placeholder="e.g., 250 MCM THHN/THWN-2">
                    </div>
                    
                    <div class="form-group">
                        <label for="cableInstallDate">Installation Date:</label>
                        <input type="date" id="cableInstallDate">
                    </div>
                    
                    <div class="form-group">
                        <label for="cableInsulation">Insulation Type:</label>
                        <select id="cableInsulation">
                            <option value="">Not specified</option>
                            <option value="THHN">THHN</option>
                            <option value="THWN">THWN</option>
                            <option value="THWN-2">THWN-2</option>
                            <option value="XHHW">XHHW</option>
                            <option value="XHHW-2">XHHW-2</option>
                            <option value="USE-2">USE-2</option>
                            <option value="RHH">RHH</option>
                            <option value="RHW-2">RHW-2</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="cableVoltageRating">Voltage Rating:</label>
                        <select id="cableVoltageRating">
                            <option value="">Not specified</option>
                            <option value="600V">600V</option>
                            <option value="1kV">1kV</option>
                            <option value="5kV">5kV</option>
                            <option value="15kV">15kV</option>
                            <option value="25kV">25kV</option>
                            <option value="35kV">35kV</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="cableNotes">Notes:</label>
                        <textarea id="cableNotes" rows="3" placeholder="Additional notes about this cable..."></textarea>
                    </div>
                </div>
            </details>
        `;
    } else if (type === 'generator') {
        html = `
            <div class="form-group">
                <label for="generatorRating">Rating (kVA):</label>
                <input type="number" id="generatorRating" placeholder="e.g., 500" step="0.1" min="0" required>
            </div>
            <div class="form-group">
                <label for="generatorVoltage">Voltage (V):</label>
                <input type="number" id="generatorVoltage" placeholder="e.g., 480" step="0.1" min="0" required>
            </div>
            <div class="form-group">
                <label for="generatorSubtransient">Subtransient Reactance X"d (%):</label>
                <input type="number" id="generatorSubtransient" placeholder="e.g., 15" step="0.1" min="0" value="15" required>
            </div>
        `;
    } else if (type === 'motor') {
        // ═══════════════════════════════════════════════════════════════════════
        // FEATURE #1: MOTOR TYPE SELECTION
        // Added: 2025-10-29 14:14:42 UTC by bfforex
        // ═══════════════════════════════════════════════════════════════════════
        html = `
            <div class="form-group">
                <label for="motorHP">Motor Horsepower (HP):</label>
                <input type="number" id="motorHP" placeholder="e.g., 100" step="0.1" min="0" required aria-label="Motor horsepower">
            </div>
            
            <div class="form-group">
                <label for="motorType">
                    Motor Type:
                    <span class="tooltip">ℹ️
                        <span class="tooltiptext">Motor type affects short circuit contribution. Induction motors are most common. Synchronous motors have higher contribution.</span>
                    </span>
                </label>
                <select id="motorType" aria-label="Select motor type">
                    <option value="induction">Induction Motor (Standard)</option>
                    <option value="synchronous">Synchronous Motor</option>
                    <option value="wound_rotor">Wound Rotor Motor</option>
                </select>
                <small style="color: #666; font-size: 0.85em;">
                    Affects short circuit contribution per IEEE 141
                </small>
            </div>
            
            <details class="collapsible-section">
                <summary style="cursor: pointer; padding: 8px; background: #f0f0f0; border-radius: 4px; margin: 8px 0;">
                    ⚙️ Advanced Motor Parameters (Optional)
                </summary>
                <div style="padding: 10px; border: 1px solid #e0e0e0; border-radius: 5px; margin-top: 5px;">
                    
                    <div class="form-group">
                        <label for="motorEfficiency">
                            Motor Efficiency (0.0 - 1.0):
                            <span class="tooltip">ℹ️
                                <span class="tooltiptext">Typical values: 0.85-0.95. Higher HP motors are more efficient. Default: 0.90</span>
                            </span>
                        </label>
                        <input type="number" id="motorEfficiency" placeholder="0.90 (default)" step="0.01" min="0.5" max="1.0" aria-label="Motor efficiency">
                        <small style="color: #666; font-size: 0.85em;">
                            Leave blank to use default (0.90)
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label for="motorPowerFactor">
                            Motor Power Factor (0.0 - 1.0):
                            <span class="tooltip">ℹ️
                                <span class="tooltiptext">Typical values: 0.80-0.90. Varies with load. Default: 0.85</span>
                            </span>
                        </label>
                        <input type="number" id="motorPowerFactor" placeholder="0.85 (default)" step="0.01" min="0.5" max="1.0" aria-label="Motor power factor">
                        <small style="color: #666; font-size: 0.85em;">
                            Leave blank to use default (0.85)
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label for="motorName">
                            Motor Name/Tag (Optional):
                            <span class="tooltip">ℹ️
                                <span class="tooltiptext">Identifier for this motor (e.g., "Pump P-101", "Fan F-203")</span>
                            </span>
                        </label>
                        <input type="text" id="motorName" placeholder="e.g., Pump P-101" aria-label="Motor name or tag">
                    </div>
                    
                    <div style="background: rgba(102, 126, 234, 0.1); padding: 10px; border-radius: 5px; margin-top: 10px;">
                        <strong style="color: #667eea;">📖 IEEE 141 Motor Classification:</strong>
                        <ul style="margin: 8px 0; padding-left: 20px; font-size: 0.85em; line-height: 1.6;">
                            <li><strong>&lt; 50 HP</strong>: Small induction motor (X/R ≈ 3.2, X" ≈ 20%)</li>
                            <li><strong>50-250 HP</strong>: Medium induction motor (X/R ≈ 4.5, X" ≈ 17%)</li>
                            <li><strong>&gt; 250 HP</strong>: Large induction motor (X/R ≈ 6.6, X" ≈ 15%)</li>
                            <li><strong>Synchronous</strong>: Higher fault contribution (X/R ≈ 15, X" ≈ 12%)</li>
                        </ul>
                    </div>
                </div>
            </details>
        `;
    } else if (type === 'bus-tie') {
        // ═══════════════════════════════════════════════════════════════════════
        // BUS TIE (CIRCUIT BREAKER) COMPONENT
        // Added: 2025-11-04 by bfforex - Feature: Bus Tie Circuit Breaker Analysis
        // ═══════════════════════════════════════════════════════════════════════
        html = `
            <!-- ✅ Bus Tie Identification Section -->
            <div style="margin-bottom: 15px; padding: 10px; background: #fff3e0; border-left: 4px solid #ff9800;">
                <h4 style="margin-top: 0; color: #ff6f00;">🔌 Bus Tie Identification</h4>
                
                <div class="form-group">
                    <label for="busTieTag">
                        Equipment Tag:
                        <span class="tooltip">ℹ️
                            <span class="tooltiptext">Auto-generated tag format: BT-{BUS1}-{BUS2}-{SEQ}</span>
                        </span>
                    </label>
                    <input 
                        type="text" 
                        id="busTieTag" 
                        placeholder="Auto-generated: BT-BUS1-BUS2-1"
                        readonly
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background-color: #f5f5f5;">
                    <small style="display: block; margin-top: 5px; color: #666;">
                        Tag is automatically generated based on connected buses
                    </small>
                </div>
                
                <div class="form-group">
                    <label for="busTieDescription">Description (Optional):</label>
                    <input 
                        type="text" 
                        id="busTieDescription" 
                        placeholder="e.g., Main tie between LCA1-4 and LCB1-4"
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
            </div>
            
            <!-- ✅ Electrical Ratings -->
            <div style="margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-left: 4px solid #2196f3;">
                <h4 style="margin-top: 0; color: #1976d2;">⚡ Electrical Ratings</h4>
                
                <div class="form-group">
                    <label for="busTieRating">
                        Rating (A): <span style="color: red;">*</span>
                        <span class="tooltip">ℹ️
                            <span class="tooltiptext">Continuous current rating of circuit breaker</span>
                        </span>
                    </label>
                    <input type="number" id="busTieRating" placeholder="e.g., 1600" min="0" step="100" value="1600" required>
                    <small style="color: #666; font-size: 0.85em;">
                        Typical: 800A, 1600A, 2000A, 3200A, 4000A
                    </small>
                </div>
                
                <div class="form-group">
                    <label for="busTieBreakerType">
                        Breaker Type: <span style="color: red;">*</span>
                    </label>
                    <select id="busTieBreakerType" required>
                        <option value="ACB">ACB - Air Circuit Breaker</option>
                        <option value="MCCB">MCCB - Molded Case Circuit Breaker</option>
                        <option value="VCB">VCB - Vacuum Circuit Breaker</option>
                        <option value="OCB">OCB - Oil Circuit Breaker</option>
                    </select>
                </div>
            </div>
            
            <!-- ✅ Physical Configuration -->
            <div style="margin-bottom: 15px; padding: 10px; background: #f3e5f5; border-left: 4px solid #9c27b0;">
                <h4 style="margin-top: 0; color: #7b1fa2;">📏 Physical Configuration</h4>
                
                <div class="form-group">
                    <label for="busTieLength">
                        Bus Length (ft): <span style="color: red;">*</span>
                        <span class="tooltip">ℹ️
                            <span class="tooltiptext">Length of bus bar connecting the two buses</span>
                        </span>
                    </label>
                    <input type="number" id="busTieLength" placeholder="e.g., 10" min="0" step="0.1" value="10" required>
                    <small style="color: #666; font-size: 0.85em;">
                        Typical bus tie lengths: 5-50 feet
                    </small>
                </div>
                
                <div class="form-group">
                    <label for="busTieSize">
                        Conductor Size (kcmil): <span style="color: red;">*</span>
                    </label>
                    <select id="busTieSize" required>
                        <option value="250">250 kcmil</option>
                        <option value="300">300 kcmil</option>
                        <option value="350">350 kcmil</option>
                        <option value="400">400 kcmil</option>
                        <option value="500" selected>500 kcmil</option>
                        <option value="600">600 kcmil</option>
                        <option value="750">750 kcmil</option>
                        <option value="1000">1000 kcmil</option>
                        <option value="1250">1250 kcmil</option>
                        <option value="1500">1500 kcmil</option>
                        <option value="2000">2000 kcmil</option>
                    </select>
                </div>
            </div>
            
            <!-- ✅ Operating Configuration -->
            <div style="margin-bottom: 15px; padding: 10px; background: #e8f5e9; border-left: 4px solid #4caf50;">
                <h4 style="margin-top: 0; color: #388e3c;">⚙️ Operating Configuration</h4>
                
                <div class="form-group">
                    <label for="busTieNormalState">
                        Normal Operating State: <span style="color: red;">*</span>
                        <span class="tooltip">ℹ️
                            <span class="tooltiptext">Normal operating position of breaker. Per IEEE 141, bus ties typically operate OPEN.</span>
                        </span>
                    </label>
                    <select id="busTieNormalState" required>
                        <option value="open" selected>🔌 OPEN (Normal - Isolated)</option>
                        <option value="closed">⚡ CLOSED (Paralleled)</option>
                    </select>
                    <small style="color: #666; font-size: 0.85em;">
                        IEEE 141-1993: Bus ties normally operate OPEN for fault isolation
                    </small>
                </div>
                
                <div class="form-group">
                    <label for="busTieInterlock">
                        Source Interlock:
                        <span class="tooltip">ℹ️
                            <span class="tooltiptext">Prevents paralleling of utility sources (recommended per NEC)</span>
                        </span>
                    </label>
                    <select id="busTieInterlock">
                        <option value="yes" selected>Yes - Interlocked (Recommended)</option>
                        <option value="no">No - Not interlocked</option>
                    </select>
                    <small style="color: #666; font-size: 0.85em;">
                        Interlock prevents simultaneous closure of source breakers
                    </small>
                </div>
            </div>
            
            <!-- ✅ IEEE 141 Guidance -->
            <div style="background: rgba(33, 150, 243, 0.1); padding: 10px; border-radius: 5px; margin-top: 10px;">
                <strong style="color: #1976d2;">📖 IEEE 141-1993 Bus Tie Guidance:</strong>
                <ul style="margin: 8px 0; padding-left: 20px; font-size: 0.85em; line-height: 1.6;">
                    <li>Bus ties normally operate <strong>OPEN</strong> for fault isolation</li>
                    <li>Closing tie increases fault current by 30-40% typically</li>
                    <li>Improves voltage regulation and load sharing when closed</li>
                    <li>Must verify breaker ratings for both operating modes</li>
                    <li>Arc flash hazard increases significantly when closed</li>
                </ul>
            </div>
        `;
    }

    container.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════════
// ADD COMPONENT WITH TAGGING & MOTOR TYPE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add component to system with cable tagging and motor type support
 * ENHANCED: 2025-10-29 14:14:42 UTC by bfforex
 * Feature #1: Motor type and parameters added
 */
function addComponent() {
    const fromBusId = document.getElementById('fromBus').value;
    const toBusId = document.getElementById('toBus').value;
    const type = document.getElementById('componentType').value;

    if (!fromBusId || !toBusId) {
        alert('❌ Please select both From and To buses!');
        return;
    }

    const fromBus = buses.find(b => b.id === fromBusId);
    const toBus = buses.find(b => b.id === toBusId);

    if (!fromBus || !toBus) {
        alert('❌ Invalid bus selection!');
        return;
    }

    let component = {
        id: Date.now(),
        type: type,
        fromBus: fromBusId,
        toBus: toBusId,
        fromBusName: fromBus.name,
        toBusName: toBus.name,
        created: new Date().toISOString()
    };

    // ═══════════════════════════════════════════════════════════════════════
    // CABLE WITH TAGGING SYSTEM
    // ═══════════════════════════════════════════════════════════════════════
    if (type === 'cable') {
        const tag = document.getElementById('cableTag')?.value.trim();
        
        // ✅ Validate tag (required)
        if (!tag) {
            alert('❌ Cable tag is required!\n\nPlease provide an equipment tag for identification in reports and drawings.');
            document.getElementById('cableTag')?.focus();
            return;
        }
        
        // ✅ ISSUE #9: Enforce unique cable tag constraint
        const existingCable = components.find(c => c.type === 'cable' && c.tag === tag);
        if (existingCable) {
            alert(
                `❌ ERROR: Cable tag "${tag}" already exists!\n\n` +
                `Existing cable: ${existingCable.fromBusName} → ${existingCable.toBusName}\n` +
                `New cable: ${fromBus.name} → ${toBus.name}\n\n` +
                `Cable tags must be unique for proper tracking and reporting.\n\n` +
                `Please choose a different tag.`
            );
            document.getElementById('cableTag')?.focus();
            document.getElementById('cableTag')?.select();
            console.warn(`⚠️ Duplicate cable tag rejected: "${tag}"`);
            return;
        }
        
        const size = document.getElementById('cableSize').value;
        const material = document.getElementById('cableMaterial').value;
        const length = parseFloat(document.getElementById('cableLength').value);
        const conduit = document.getElementById('cableConduit').value;
        const parallel = parseInt(document.getElementById('cableParallel').value) || 1;
        
        if (!size || !material || !length) {
            alert('❌ Please fill in all required cable fields!');
            return;
        }
        
        component = {
            ...component,
            size: size,
            material: material,
            length: length,
            conduit: conduit,
            parallel: parallel,
            
            // ✅ Tagging and identification
            tag: tag,
            description: document.getElementById('cableDescription')?.value.trim() || '',
            
            // ✅ Manufacturer information
            manufacturer: document.getElementById('cableManufacturer')?.value.trim() || '',
            catalogNumber: document.getElementById('cableCatalog')?.value.trim() || '',
            insulation: document.getElementById('cableInsulation')?.value || '',
            voltageRating: document.getElementById('cableVoltageRating')?.value || '',
            
            // ✅ Installation tracking
            installationDate: document.getElementById('cableInstallDate')?.value || '',
            notes: document.getElementById('cableNotes')?.value.trim() || '',
            
            // Generated name (includes tag)
            name: `${tag} - ${size} ${material.toUpperCase()}${parallel > 1 ? ` (${parallel}×)` : ''} - ${length}ft`
        };
        
        console.log(`✅ Cable "${tag}" added:`, component);
        
        } else if (type === 'transformer') {
                       const tag = document.getElementById('transformerTag')?.value.trim();
        
                       // ✅ Validate tag (required)
                      if (!tag) {
                              alert('❌ Transformer tag is required!\n\nPlease provide an equipment tag for identification in reports and drawings.');
                               document.getElementById('transformerTag')?.focus();
                               return;
                        }
        
                        // ✅ ISSUE #9: Enforce unique transformer tag constraint
                       const existingXfmr = components.find(c => c.type === 'transformer' && c.tag === tag);
                      if (existingXfmr) {
                               alert(
                                          `❌ ERROR: Transformer tag "${tag}" already exists!\n\n` +
                                          `Existing transformer: ${existingXfmr.fromBusName} → ${existingXfmr.toBusName}\n` +
                                          `New transformer: ${fromBus.name} → ${toBus.name}\n\n` +
                                          `Transformer tags must be unique for proper tracking and reporting.\n\n` +
                                          `Please choose a different tag.`
                                );
                               document.getElementById('transformerTag')?.focus();
                               document.getElementById('transformerTag')?.select();
                               console.warn(`⚠️ Duplicate transformer tag rejected: "${tag}"`);
                               return;
                      }
        
                       const rating = parseFloat(document.getElementById('transformerRating').value);
                       const primary = parseFloat(document.getElementById('transformerPrimary').value);
                       const secondary = parseFloat(document.getElementById('transformerSecondary').value);
                       const impedance = parseFloat(document.getElementById('transformerImpedance').value);
                       const xr = parseFloat(document.getElementById('transformerXR').value);
                       const tapSetting = parseFloat(document.getElementById('transformerTapSetting')?.value) || 0;
    
                      if (!rating || !primary || !secondary || !impedance || !xr) {
                              alert('❌ Please fill in all required transformer fields!');
                              return;
                      }
        
                      component = {
                                 ...component,
                                 rating: rating,
                                 primary: primary,
                                 secondary: secondary,
                                 impedance: impedance,
                                 xr: xr,
                                 tapSetting: tapSetting,
            
                                  // ✅ Tagging and identification
                                  tag: tag,
                                  description: document.getElementById('transformerDescription')?.value.trim() || '',
             
                                  // ✅ Manufacturer information
                                  manufacturer: document.getElementById('transformerManufacturer')?.value.trim() || '',
                                  catalogNumber: document.getElementById('transformerCatalog')?.value.trim() || '',
            
                                  // ✅ Installation tracking
                                  installationDate: document.getElementById('transformerInstallDate')?.value || '',
                                  notes: document.getElementById('transformerNotes')?.value.trim() || '',
            
                                  // Generated name (includes tag)
                                  name: `${tag} - ${rating}kVA (${primary}V/${secondary}V)`
                      };
        
                      console.log(`✅ Transformer "${tag}" added:`, component);
        
        // ✅ NEW: Log tap setting for diagnostics
        if (tapSetting !== 0) {
             console.log(`✅ Transformer added with tap: ${tapSetting > 0 ? '+' : ''}${tapSetting}%`);
           console.log(`   Secondary voltage adjusted to: ${(secondary * (1 + tapSetting/100)).toFixed(2)}V`);
        }

    } else if (type === 'generator') {
        const rating = parseFloat(document.getElementById('generatorRating').value);
        const voltage = parseFloat(document.getElementById('generatorVoltage').value);
        const subtransient = parseFloat(document.getElementById('generatorSubtransient').value);
        
        if (!rating || !voltage || !subtransient) {
            alert('❌ Please fill in all required generator fields!');
            return;
        }
        
        component = {
            ...component,
            rating: rating,
            voltage: voltage,
            subtransient: subtransient,
            name: `${rating} kVA Generator (${voltage}V)`
        };
        
    } else if (type === 'motor') {
                   // ═══════════════════════════════════════════════════════════════════
            // MOTOR WITH AUTO-TAG GENERATION
              // Format: M-{FROM_BUS}-{HP}-{SEQ}
               // Enhanced: 2025-11-03 13:52:00 UTC by bfforex
               // FIXED: Bus object reference (fromBus is already an object, not ID)
               // ═══════════════════════════════════════════════════════════════════
               const hp = parseFloat(document.getElementById('motorHP').value);
    
               if (!hp || hp <= 0) {
                    alert('❌ Please enter a valid motor HP!');
                      return;
               }
    
               // ✅ Get motor type
               const motorType = document.getElementById('motorType').value || 'induction';
    
               // ✅ Get advanced parameters (optional with defaults)
               const efficiencyInput = document.getElementById('motorEfficiency');
               let efficiency = 0.90; // default
               if (efficiencyInput && efficiencyInput.value) {
                       const eff = parseFloat(efficiencyInput.value);
                      if (eff >= 0.5 && eff <= 1.0) {
                              efficiency = eff;
                          }
                   }
    
               const powerFactorInput = document.getElementById('motorPowerFactor');
               let powerFactor = 0.85; // default
               if (powerFactorInput && powerFactorInput.value) {
                       const pf = parseFloat(powerFactorInput.value);
                       if (pf >= 0.5 && pf <= 1.0) {
                               powerFactor = pf;
                       }
               }
    
               const motorNameInput = document.getElementById('motorName');
               let motorName = '';
               if (motorNameInput && motorNameInput.value.trim()) {
                       motorName = motorNameInput.value.trim();
               } else {
                   motorName = `${hp} HP ${motorType} motor`;
               }
    
               // ═══════════════════════════════════════════════════════════════════
               // ✅ FIXED: Bus object references
               // fromBus and toBus are ALREADY bus objects (from line 160-161)
               // We don't need to find them again!
               // ═══════════════════════════════════════════════════════════════════
    
               // ✅ Get FROM bus tag for auto-tag generation
               // fromBus is ALREADY the bus object
               const fromBusTag = fromBus.tag || fromBus.name;
               const fromBusTagFormatted = fromBusTag.replace(/\s+/g, '-').toUpperCase();
    
               // Format HP (remove decimals if whole number)
               const hpFormatted = hp % 1 === 0 ? hp.toString() : hp.toFixed(1).replace('.', 'P');
    
               // Generate base tag: M-{FROM_BUS}-{HP}
               const baseTag = `M-${fromBusTagFormatted}-${hpFormatted}`;
    
               // ✅ Find next available sequence number
               // Check existing motors with same base tag
               const existingMotorsWithSameBase = components.filter(c => 
                          c.type === 'motor' && 
                          c.tag && 
                          c.tag.startsWith(`${baseTag}-`)
               );
    
               // Extract sequence numbers and find max
               let maxSeq = 0;
               existingMotorsWithSameBase.forEach(motor => {
                          const parts = motor.tag.split('-');
                          const seqNum = parseInt(parts[parts.length - 1]);
                          if (!isNaN(seqNum) && seqNum > maxSeq) {
                                  maxSeq = seqNum;
                          }
               });
    
               // Next sequence number
               const nextSeq = maxSeq + 1;
    
               // Final tag: M-{FROM_BUS}-{HP}-{SEQ}
               const finalTag = `${baseTag}-${nextSeq}`;
    
               // ✅ Build component with auto-tag
               component = {
                           ...component,
                           hp: hp,
                           motorType: motorType,
                           efficiency: efficiency,
                           powerFactor: powerFactor,
                             name: motorName,
                             tag: finalTag,  // ✅ Auto-generated tag
                             fromBusTag: fromBusTagFormatted,
                             fromBusName: fromBus.name,  // ✅ FIXED: Use fromBus.name directly
                             toBusName: toBus.name,      // ✅ FIXED: Use toBus.name directly
                             location: toBus.name,
                             sequenceNumber: nextSeq
                 };
    
                 // ✅ Enhanced logging
                   console.log('\n' + '═'.repeat(70));               
                   console.log('✅ MOTOR ADDED WITH AUTO-TAG'); 
                   console.log('═'.repeat(70));
                   console.log(`Tag:             ${finalTag}`);
                   console.log(`  - Prefix:      M- (Motor)`);
                   console.log(`  - Source Bus:  ${fromBusTagFormatted} (${fromBus.name})`);
                   console.log(`  - HP Rating:   ${hpFormatted}`);
                   console.log(`  - Sequence:    ${nextSeq}`);
                   console.log('─'.repeat(70));
                   console.log(`Motor Name:      ${motorName}`);
                   console.log(`Type:            ${motorType}`);
                   console.log(`From Bus:        ${fromBus.name} (${fromBus.tag || 'no tag'}) - source`);
                   console.log(`To Bus:          ${toBus.name} (${toBus.tag || 'no tag'}) - location`);
                   console.log(`HP:              ${hp}`);
                   console.log(`Efficiency:      ${(efficiency * 100).toFixed(1)}%`);
                   console.log(`Power Factor:    ${powerFactor.toFixed(2)}`);
                   console.log('═'.repeat(70) + '\n');
          } else if (type === 'bus-tie') {
        // ═══════════════════════════════════════════════════════════════════
        // BUS TIE WITH AUTO-TAG GENERATION
        // Format: BT-{BUS1}-{BUS2}-{SEQ}
        // Added: 2025-11-04 by bfforex - Feature: Bus Tie Circuit Breaker Analysis
        // ═══════════════════════════════════════════════════════════════════
        
        // ✅ Validate voltage compatibility
        if (fromBus.voltage !== toBus.voltage) {
            alert(
                `❌ VOLTAGE MISMATCH ERROR!\n\n` +
                `Bus ties can only connect buses at the same voltage level.\n\n` +
                `From Bus: ${fromBus.name} (${fromBus.voltage}V)\n` +
                `To Bus: ${toBus.name} (${toBus.voltage}V)\n\n` +
                `Please select buses with matching voltages.`
            );
            return;
        }
        
        // ✅ Check for existing bus tie between same buses
        const existingTie = components.find(c => 
            c.type === 'bus-tie' && 
            ((c.fromBus === fromBusId && c.toBus === toBusId) ||
             (c.fromBus === toBusId && c.toBus === fromBusId))
        );
        
        if (existingTie) {
            alert(
                `❌ DUPLICATE BUS TIE ERROR!\n\n` +
                `A bus tie already exists between these buses:\n` +
                `  ${existingTie.fromBusName} ↔ ${existingTie.toBusName}\n` +
                `  Tag: ${existingTie.tag}\n\n` +
                `Only one tie can exist between two buses.\n` +
                `To modify the existing tie, delete it first and create a new one.`
            );
            return;
        }
        
        // ✅ Get input values
        const rating = parseFloat(document.getElementById('busTieRating').value);
        const breakerType = document.getElementById('busTieBreakerType').value;
        const length = parseFloat(document.getElementById('busTieLength').value);
        const size = parseFloat(document.getElementById('busTieSize').value);
        const normalState = document.getElementById('busTieNormalState').value;
        const interlock = document.getElementById('busTieInterlock').value;
        const description = document.getElementById('busTieDescription')?.value.trim() || '';
        
        if (!rating || !breakerType || !length || !size || !normalState) {
            alert('❌ Please fill in all required bus tie fields!');
            return;
        }
        
        // ✅ Generate auto-tag: BT-{BUS1}-{BUS2}-{SEQ}
        const bus1Tag = (fromBus.tag || fromBus.name).replace(/\s+/g, '-').toUpperCase();
        const bus2Tag = (toBus.tag || toBus.name).replace(/\s+/g, '-').toUpperCase();
        
        // Alphabetically sort bus tags for consistency
        const [busA, busB] = [bus1Tag, bus2Tag].sort();
        const baseTag = `${BUS_TIE_CONFIG.AUTO_TAG_PREFIX}-${busA}-${busB}`;
        
        // ✅ Find next sequence number
        const existingTiesWithSameBase = components.filter(c => 
            c.type === 'bus-tie' && 
            c.tag && 
            c.tag.startsWith(`${baseTag}-`)
        );
        
        let maxSeq = 0;
        existingTiesWithSameBase.forEach(tie => {
            const parts = tie.tag.split('-');
            const seqNum = parseInt(parts[parts.length - 1]);
            if (!isNaN(seqNum) && seqNum > maxSeq) {
                maxSeq = seqNum;
            }
        });
        
        const nextSeq = maxSeq + 1;
        const finalTag = `${baseTag}-${nextSeq}`;
        
        // ✅ Calculate impedance (simplified bus bar impedance)
        // Using typical bus bar impedance: ~0.00005 ohms per foot for large conductors
        // Z = length * impedance_per_foot
        const impedancePerFoot = 0.00001; // ohms/ft for large bus bars
        const impedance = length * impedancePerFoot;
        
        // ✅ Build component
        component = {
            ...component,
            rating: rating,
            breakerType: breakerType,
            length: length,
            size: size,
            normalState: normalState,
            currentState: normalState, // Initially same as normal state
            interlock: interlock,
            impedance: impedance,
            description: description,
            tag: finalTag,
            isBusTie: true,
            voltage: fromBus.voltage, // Store voltage for reference
            name: `${finalTag} - ${rating}A ${breakerType} Tie`
        };
        
        // ✅ Enhanced logging
        console.log('\n' + '═'.repeat(70));
        console.log('✅ BUS TIE ADDED WITH AUTO-TAG');
        console.log('═'.repeat(70));
        console.log(`Tag:             ${finalTag}`);
        console.log(`  - Prefix:      ${BUS_TIE_CONFIG.AUTO_TAG_PREFIX} (Bus Tie)`);
        console.log(`  - Bus A:       ${busA}`);
        console.log(`  - Bus B:       ${busB}`);
        console.log(`  - Sequence:    ${nextSeq}`);
        console.log('─'.repeat(70));
        console.log(`Rating:          ${rating} A`);
        console.log(`Breaker Type:    ${breakerType}`);
        console.log(`Bus Length:      ${length} ft`);
        console.log(`Conductor Size:  ${size} kcmil`);
        console.log(`Normal State:    ${normalState.toUpperCase()}`);
        console.log(`Current State:   ${normalState.toUpperCase()}`);
        console.log(`Interlock:       ${interlock.toUpperCase()}`);
        console.log(`Impedance:       ${impedance.toFixed(6)} Ω`);
        console.log(`Voltage:         ${fromBus.voltage} V`);
        console.log(`From Bus:        ${fromBus.name} (${fromBus.tag || 'no tag'})`);
        console.log(`To Bus:          ${toBus.name} (${toBus.tag || 'no tag'})`);
        if (description) {
            console.log(`Description:     ${description}`);
        }
        console.log('═'.repeat(70) + '\n');
    }

        components.push(component);
    
              // Success message
              if (type === 'cable') {
                       alert(`✅ Cable "${component.tag}" added successfully!\n\n` +
                                      `From: ${fromBus.name}\n` +
                                      `To: ${toBus.name}\n` +
                                      `${component.description ? `Description: ${component.description}` : ''}`);
               } else if (type === 'transformer') {
                        alert(`✅ Transformer "${component.tag}" added successfully!\n\n` +
                                       `From: ${fromBus.name}\n` +
                                       `To: ${toBus.name}\n` +
                                       `Rating: ${component.rating} kVA`);
               } else if (type === 'motor') {
                                          alert(`✅ Motor "${component.tag}" added successfully!\n\n` +
                                                       `Name: ${component.name}\n` +
                                                       `HP: ${component.hp}\n` +
                                                       `Type: ${component.motorType}\n` +
                                                       `Location: ${component.location}\n` +
                                                       `Tag: ${component.tag}`);
               } else if (type === 'motor') {
                   alert(`✅ Motor "${component.tag}" added successfully!\n\n` +
                         `Tag: ${component.tag}\n` +
                         `  • Source Bus: ${component.fromBusName}\n` +
                         `  • HP Rating: ${component.hp}\n` +
                         `  • Sequence: ${component.sequenceNumber}\n\n` +
                         `Motor Details:\n` +
                         `  • Name: ${component.name}\n` +
                         `  • Type: ${component.motorType}\n` +
                         `  • Location: ${component.location}`);
               } else if (type === 'bus-tie') {
                   alert(`✅ Bus Tie "${component.tag}" added successfully!\n\n` +
                         `Tag: ${component.tag}\n` +
                         `  • Between: ${component.fromBusName} ↔ ${component.toBusName}\n` +
                         `  • Voltage: ${component.voltage} V\n` +
                         `  • Rating: ${component.rating} A\n` +
                         `  • Type: ${component.breakerType}\n\n` +
                         `Operating Configuration:\n` +
                         `  • Normal State: ${component.normalState.toUpperCase()}\n` +
                         `  • Current State: ${component.currentState.toUpperCase()}\n` +
                         `  • Interlock: ${component.interlock.toUpperCase()}\n\n` +
                         `${component.description ? `Description: ${component.description}\n\n` : ''}` +
                         `⚠️ IEEE 141: Verify breaker ratings for both open and closed scenarios.`);
               } else {
                   alert(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} added successfully!`);
               }
    
    console.log('✅ Component added:', component);
    
    displayComponents();
    updateBusSelects();
    autoSaveToLocalStorage();
    
    // Clear form
    document.getElementById('fromBus').value = '';
    document.getElementById('toBus').value = '';
    document.getElementById('componentType').selectedIndex = 0;
    updateComponentInputs();
}

// ═══════════════════════════════════════════════════════════════════════════
// DISPLAY COMPONENTS WITH TAGGING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Display all components with cable tags and From/To information
 * ENHANCED: 2025-10-29 14:14:42 UTC by bfforex
 */
function displayComponents() {
    const container = document.getElementById('componentsList');
    
    if (components.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <strong>ℹ️ No Components Yet</strong>
                <p>Add components to connect your buses and build your power system.</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="components-list">';
    
    components.forEach((comp, index) => {
        const componentNumber = index + 1;
        
        html += `<div class="component-item" data-component-id="${comp.id}">`;
        
        // ═══════════════════════════════════════════════════════════════════
        // CABLE COMPONENT (WITH TAGGING)
        // ═══════════════════════════════════════════════════════════════════
        if (comp.type === 'cable') {
            html += `
                <div class="component-header">
                    <div class="component-type-section">
                        <span class="component-icon">🔗</span>
                        <span class="component-tag-display">
                            <strong>${comp.tag || `Cable ${componentNumber}`}</strong>
                            ${comp.description ? `<span class="component-desc">- ${comp.description}</span>` : ''}
                        </span>
                    </div>
                    <div class="component-controls">
                        <button class="btn btn-info btn-small" onclick="viewCableDetails('${comp.id}')" title="View detailed cable information">
                            📋 Details
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="editComponent(${comp.id})" title="Edit cable">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger btn-small" onclick="deleteComponent(${comp.id})" title="Delete cable">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
                <div class="component-details">
                    <div class="component-tag-badge">🏷️ ${comp.tag}</div>
                    <div class="component-info-grid">
                        <div class="info-row">
                            <strong>From:</strong> <span class="bus-name-highlight">${comp.fromBusName || comp.fromBus}</span>
                        </div>
                        <div class="info-row">
                            <strong>To:</strong> <span class="bus-name-highlight">${comp.toBusName || comp.toBus}</span>
                        </div>
                        <div class="info-row">
                            <strong>Size:</strong> ${comp.size} ${comp.material.toUpperCase()}
                            ${comp.parallel > 1 ? ` <span class="parallel-badge">(${comp.parallel}× parallel)</span>` : ''}
                        </div>
                        <div class="info-row">
                            <strong>Length:</strong> ${comp.length} ft | <strong>Conduit:</strong> ${comp.conduit}
                        </div>
                        ${comp.manufacturer ? `
                        <div class="info-row">
                            <strong>Manufacturer:</strong> ${comp.manufacturer}
                            ${comp.catalogNumber ? ` | <strong>Cat #:</strong> ${comp.catalogNumber}` : ''}
                        </div>
                        ` : ''}
                        ${comp.insulation ? `
                        <div class="info-row">
                            <strong>Insulation:</strong> ${comp.insulation}
                            ${comp.voltageRating ? ` | <strong>Voltage Rating:</strong> ${comp.voltageRating}` : ''}
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // TRANSFORMER COMPONENT
        // ═══════════════════════════════════════════════════════════════════
        else if (comp.type === 'transformer') {
            html += `
                <div class="component-header">
                    <div class="component-type-section">
                        <span class="component-icon">🔌</span>
                        <span class="component-name"><strong>${comp.name}</strong></span>
                    </div>
                    <div class="component-controls">
                        <button class="btn btn-secondary btn-small" onclick="editComponent(${comp.id})">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger btn-small" onclick="deleteComponent(${comp.id})">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
                <div class="component-details">
                    <div class="component-info-grid">
                        <div class="info-row">
                            <strong>From:</strong> <span class="bus-name-highlight">${comp.fromBusName || comp.fromBus}</span>
                        </div>
                        <div class="info-row">
                            <strong>To:</strong> <span class="bus-name-highlight">${comp.toBusName || comp.toBus}</span>
                        </div>
                        <div class="info-row">
                            <strong>Rating:</strong> ${comp.rating} kVA
                        </div>
                        <div class="info-row">
                            <strong>Voltage:</strong> ${comp.primary}V / ${comp.secondary}V
                        </div>
                        <div class="info-row">
                            <strong>Impedance:</strong> ${comp.impedance}% | <strong>X/R:</strong> ${comp.xr}
                        </div>
                        ${comp.tapSetting && comp.tapSetting !== 0 ? `
                                                                <div class="info-row" style="background: rgba(102, 126, 234, 0.1); padding: 6px 10px; border-radius: 4px; margin-top: 5px;">
                                                                           <strong>⚙️ Tap Setting:</strong> 
                                                                           <span style="color: ${comp.tapSetting > 0 ? '#28a745' : '#dc3545'}; font-weight: 600;">
                                                                                       ${comp.tapSetting > 0 ? '+' : ''}${comp.tapSetting}%
                                                                           </span>
                                                                           <small style="color: #666; margin-left: 8px;">
                                                                                       (Secondary: ${(comp.secondary * (1 + comp.tapSetting/100)).toFixed(1)}V)
                                                                           </small>
                                                               </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // GENERATOR COMPONENT
        // ═══════════════════════════════════════════════════════════════════
        else if (comp.type === 'generator') {
            html += `
                <div class="component-header">
                    <div class="component-type-section">
                        <span class="component-icon">⚡</span>
                        <span class="component-name"><strong>${comp.name}</strong></span>
                    </div>
                    <div class="component-controls">
                        <button class="btn btn-secondary btn-small" onclick="editComponent(${comp.id})">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger btn-small" onclick="deleteComponent(${comp.id})">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
                <div class="component-details">
                    <div class="component-info-grid">
                        <div class="info-row">
                            <strong>From:</strong> <span class="bus-name-highlight">${comp.fromBusName || comp.fromBus}</span>
                        </div>
                        <div class="info-row">
                            <strong>To:</strong> <span class="bus-name-highlight">${comp.toBusName || comp.toBus}</span>
                        </div>
                        <div class="info-row">
                            <strong>Rating:</strong> ${comp.rating} kVA | <strong>Voltage:</strong> ${comp.voltage}V
                        </div>
                        <div class="info-row">
                            <strong>Subtransient X"d:</strong> ${comp.subtransient}%
                        </div>
                    </div>
                </div>
            `;
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // MOTOR COMPONENT (WITH TYPE INFO AND AUTO-TAG)
        // ENHANCED: 2025-11-03 05:08:34 UTC by bfforex
        // ═══════════════════════════════════════════════════════════════════
        else if (comp.type === 'motor') {
            const motorTypeDisplay = comp.motorType ? 
                ` (${comp.motorType.replace('_', ' ')})` : '';
    
            html += `
                <div class="component-header">
                    <div class="component-type-section">
                        <span class="component-icon">⚙️</span>
                        <span class="component-tag-display">
                            <strong>${comp.tag || 'N/A'}</strong>
                            <span class="component-desc">- ${comp.name}${motorTypeDisplay}</span>
                        </span>
                    </div>
                    <div class="component-controls">
                        <button class="btn btn-secondary btn-small" onclick="editComponent(${comp.id})" title="Edit motor">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger btn-small" onclick="deleteComponent(${comp.id})" title="Delete motor">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
                <div class="component-details">
                    <div class="component-tag-badge">🏷️ ${comp.tag || 'N/A'}</div>
                    <div class="component-info-grid">
                        <div class="info-row">
                            <strong>From:</strong> <span class="bus-name-highlight">${comp.fromBusName || comp.fromBus}</span>
                        </div>
                        <div class="info-row">
                            <strong>Location:</strong> <span class="bus-name-highlight">${comp.toBusName || comp.toBus}</span>
                        </div>
                        <div class="info-row">
                            <strong>HP:</strong> ${comp.hp} ${comp.motorType ? `| <strong>Type:</strong> ${comp.motorType.replace('_', ' ')}` : ''}
                        </div>
                        <div class="info-row">
                            <strong>Efficiency:</strong> ${((comp.efficiency || 0.90) * 100).toFixed(1)}% | 
                            <strong>PF:</strong> ${(comp.powerFactor || 0.85).toFixed(2)}
                        </div>
                    </div>
                </div>
            `;
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // BUS TIE COMPONENT (WITH STATE INDICATOR)
        // Added: 2025-11-04 by bfforex - Feature: Bus Tie Circuit Breaker Analysis
        // ═══════════════════════════════════════════════════════════════════
        else if (comp.type === 'bus-tie') {
            const isOpen = (comp.currentState || comp.normalState) === 'open';
            const stateIcon = isOpen ? '🔌' : '⚡';
            const stateText = isOpen ? 'OPEN (Isolated)' : 'CLOSED (Operating)';
            const stateColor = isOpen ? '#9e9e9e' : '#4caf50';
            const stateBgColor = isOpen ? '#f5f5f5' : '#e8f5e9';
            
            html += `
                <div class="component-header" style="background: ${stateBgColor};">
                    <div class="component-type-section">
                        <span class="component-icon" style="font-size: 1.3em;">${stateIcon}</span>
                        <span class="component-tag-display">
                            <strong style="color: ${stateColor};">${comp.tag || 'N/A'}</strong>
                            ${comp.description ? `<span class="component-desc">- ${comp.description}</span>` : ''}
                        </span>
                    </div>
                    <div class="component-controls">
                        <button 
                            class="btn btn-small" 
                            style="background: ${stateColor}; color: white; margin-right: 5px;"
                            onclick="toggleBusTieState(${comp.id})" 
                            title="Toggle operating state">
                            ${stateIcon} ${stateText}
                        </button>
                        <button class="btn btn-danger btn-small" onclick="deleteComponent(${comp.id})" title="Delete bus tie">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
                <div class="component-details">
                    <div class="component-tag-badge" style="background: ${stateColor}; color: white;">
                        🔌 ${comp.tag || 'N/A'} - ${stateText}
                    </div>
                    <div class="component-info-grid">
                        <div class="info-row">
                            <strong>Between:</strong> 
                            <span class="bus-name-highlight">${comp.fromBusName || comp.fromBus}</span>
                            ↔
                            <span class="bus-name-highlight">${comp.toBusName || comp.toBus}</span>
                        </div>
                        <div class="info-row">
                            <strong>Voltage:</strong> ${comp.voltage || 'N/A'} V
                        </div>
                        <div class="info-row">
                            <strong>Rating:</strong> ${comp.rating} A | 
                            <strong>Type:</strong> ${comp.breakerType}
                        </div>
                        <div class="info-row">
                            <strong>Bus Length:</strong> ${comp.length} ft | 
                            <strong>Size:</strong> ${comp.size} kcmil
                        </div>
                        <div class="info-row">
                            <strong>Normal State:</strong> ${(comp.normalState || 'open').toUpperCase()} | 
                            <strong>Interlock:</strong> ${(comp.interlock || 'no').toUpperCase()}
                        </div>
                        <div class="info-row">
                            <strong>Impedance:</strong> ${(comp.impedance || BUS_TIE_CONFIG.DEFAULT_IMPEDANCE).toFixed(6)} Ω
                        </div>
                    </div>
                </div>
            `;
        }
        
        html += `</div>`; // Close component-item
    });
    
    html += '</div>'; // Close components-list
    
    container.innerHTML = html;
    
    console.log(`📊 Displayed ${components.length} component(s)`);
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW CABLE DETAILS MODAL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * View detailed cable information in modal
 * Feature #7: Cable tagging details
 */
function viewCableDetails(compId) {
    const cable = components.find(c => c.id == compId);
    if (!cable || cable.type !== 'cable') {
        alert('❌ Cable not found!');
        return;
    }
    
    const modalHTML = `
        <div class="modal-overlay" id="cableDetailsModal" onclick="closeCableDetailsModal(event)">
            <div class="modal-content large" onclick="event.stopPropagation()" style="max-width: 900px;">
                <div class="modal-header">
                    <h2>📋 Cable Details: ${cable.tag}</h2>
                    <span class="close-modal" onclick="closeCableDetailsModal()">&times;</span>
                </div>
                <div class="modal-body" style="max-height: 600px; overflow-y: auto;">
                    
                    <!-- Cable Details Grid -->
                    <div class="cable-details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        
                        <!-- Identification Section -->
                        <div class="detail-section" style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                            <h3 style="color: #667eea; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">
                                🏷️ Identification
                            </h3>
                            <table class="detail-table" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px; font-weight: 600; width: 140px;">Equipment Tag:</td>
                                    <td style="padding: 8px; font-family: 'Courier New', monospace; background: #fff; border-radius: 4px;">
                                        ${cable.tag}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: 600;">Description:</td>
                                    <td style="padding: 8px;">
                                        ${cable.description || '<em style="color: #999;">Not specified</em>'}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: 600;">From Bus:</td>
                                    <td style="padding: 8px; color: #667eea; font-weight: 600;">
                                        ${cable.fromBusName || cable.fromBus}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: 600;">To Bus:</td>
                                    <td style="padding: 8px; color: #667eea; font-weight: 600;">
                                        ${cable.toBusName || cable.toBus}
                                    </td>
                                </tr>
                            </table>
                        </div>
                        
                        <!-- Electrical Specifications -->
                        <div class="detail-section" style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                            <h3 style="color: #667eea; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">
                                📐 Electrical Specifications
                            </h3>
                            <table class="detail-table" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px; font-weight: 600; width: 140px;">Conductor Size:</td>
                                    <td style="padding: 8px; font-family: 'Courier New', monospace;">
                                        ${cable.size} ${cable.material.toUpperCase()}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: 600;">Length:</td>
                                    <td style="padding: 8px;">
                                        ${cable.length} ft
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: 600;">Parallel Runs:</td>
                                    <td style="padding: 8px;">
                                        ${cable.parallel}${cable.parallel > 1 ? ' <span style="color: #ff9800; font-weight: 600;">(Parallel)</span>' : ''}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: 600;">Conduit Type:</td>
                                    <td style="padding: 8px;">
                                        ${cable.conduit}
                                    </td>
                                </tr>
                                ${cable.insulation ? `
                                <tr>
                                    <td style="padding: 8px; font-weight: 600;">Insulation:</td>
                                    <td style="padding: 8px;">
                                        ${cable.insulation}
                                    </td>
                                </tr>
                                ` : ''}
                                ${cable.voltageRating ? `
                                <tr>
                                    <td style="padding: 8px; font-weight: 600;">Voltage Rating:</td>
                                    <td style="padding: 8px;">
                                        ${cable.voltageRating}
                                    </td>
                                </tr>
                                ` : ''}
                            </table>
                        </div>
                        
                    </div>
                    
                    <!-- Manufacturer Information (Full Width) -->
                    ${cable.manufacturer || cable.catalogNumber || cable.installationDate ? `
                    <div class="detail-section" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #667eea; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">
                            🏭 Manufacturer Information
                        </h3>
                        <table class="detail-table" style="width: 100%; border-collapse: collapse;">
                            ${cable.manufacturer ? `
                            <tr>
                                <td style="padding: 8px; font-weight: 600; width: 200px;">Manufacturer:</td>
                                <td style="padding: 8px;">
                                    ${cable.manufacturer}
                                </td>
                            </tr>
                            ` : ''}
                            ${cable.catalogNumber ? `
                            <tr>
                                <td style="padding: 8px; font-weight: 600;">Catalog/Part Number:</td>
                                <td style="padding: 8px; font-family: 'Courier New', monospace;">
                                    ${cable.catalogNumber}
                                </td>
                            </tr>
                            ` : ''}
                            ${cable.installationDate ? `
                            <tr>
                                <td style="padding: 8px; font-weight: 600;">Installation Date:</td>
                                <td style="padding: 8px;">
                                    ${new Date(cable.installationDate).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </td>
                            </tr>
                            ` : ''}
                        </table>
                    </div>
                    ` : ''}
                    
                    <!-- Notes (Full Width) -->
                    ${cable.notes ? `
                    <div class="detail-section" style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                        <h3 style="color: #856404; margin-bottom: 10px;">
                            📝 Notes
                        </h3>
                        <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">
                            ${cable.notes}
                        </div>
                    </div>
                    ` : ''}
                    
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeCableDetailsModal()">
                        Close
                    </button>
                    <button class="btn btn-primary" onclick="editComponent(${cable.id}); closeCableDetailsModal()">
                        ✏️ Edit Cable
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Close cable details modal
 */
function closeCableDetailsModal(event) {
    // Close only if clicking overlay, not modal content
    if (event && event.target.closest('.modal-content')) {
        return;
    }
    
    const modal = document.getElementById('cableDetailsModal');
    if (modal) {
        modal.remove();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EDIT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Edit existing component
 * ENHANCED: 2025-10-29 14:14:42 UTC by bfforex
 * Feature #1: Motor type editing support
 */
function editComponent(id) {
    const component = components.find(c => c.id === id);
    if (!component) {
        alert('❌ Component not found!');
        return;
    }

    const modal = document.getElementById('editComponentModal');
    const modalBody = document.getElementById('editComponentModalBody');
    
    let html = `
        <input type="hidden" id="editComponentId" value="${component.id}">
        <div class="form-group">
            <label>Type:</label>
            <input type="text" value="${component.type}" disabled>
        </div>
        <div class="form-group">
            <label>From Bus:</label>
            <input type="text" value="${component.fromBusName || component.fromBus}" disabled>
        </div>
        <div class="form-group">
            <label>To Bus:</label>
            <input type="text" value="${component.toBusName || component.toBus}" disabled>
        </div>
    `;

    if (component.type === 'cable') {
        html += `
            <!-- ✅ Cable Tag (Editable) -->
            <div class="form-group">
                <label for="editCableTag">
                    🏷️ Cable Tag:
                    <span class="tooltip">ℹ️
                        <span class="tooltiptext">Equipment tag for identification</span>
                    </span>
                </label>
                <input type="text" id="editCableTag" value="${component.tag || ''}" required>
            </div>
            
            <div class="form-group">
                <label for="editCableDescription">Description:</label>
                <input type="text" id="editCableDescription" value="${component.description || ''}">
            </div>
            
            <div class="form-group">
                <label for="editCableSize">Size:</label>
                <select id="editCableSize" required>
                    <option value="14" ${component.size === '14' ? 'selected' : ''}>14 AWG</option>
                    <option value="12" ${component.size === '12' ? 'selected' : ''}>12 AWG</option>
                    <option value="10" ${component.size === '10' ? 'selected' : ''}>10 AWG</option>
                    <option value="8" ${component.size === '8' ? 'selected' : ''}>8 AWG</option>
                    <option value="6" ${component.size === '6' ? 'selected' : ''}>6 AWG</option>
                    <option value="4" ${component.size === '4' ? 'selected' : ''}>4 AWG</option>
                    <option value="3" ${component.size === '3' ? 'selected' : ''}>3 AWG</option>
                    <option value="2" ${component.size === '2' ? 'selected' : ''}>2 AWG</option>
                    <option value="1" ${component.size === '1' ? 'selected' : ''}>1 AWG</option>
                    <option value="1/0" ${component.size === '1/0' ? 'selected' : ''}>1/0 AWG</option>
                    <option value="2/0" ${component.size === '2/0' ? 'selected' : ''}>2/0 AWG</option>
                    <option value="3/0" ${component.size === '3/0' ? 'selected' : ''}>3/0 AWG</option>
                    <option value="4/0" ${component.size === '4/0' ? 'selected' : ''}>4/0 AWG</option>
                    <option value="250" ${component.size === '250' ? 'selected' : ''}>250 kcmil</option>
                    <option value="300" ${component.size === '300' ? 'selected' : ''}>300 kcmil</option>
                    <option value="350" ${component.size === '350' ? 'selected' : ''}>350 kcmil</option>
                    <option value="400" ${component.size === '400' ? 'selected' : ''}>400 kcmil</option>
                    <option value="500" ${component.size === '500' ? 'selected' : ''}>500 kcmil</option>
                    <option value="600" ${component.size === '600' ? 'selected' : ''}>600 kcmil</option>
                    <option value="750" ${component.size === '750' ? 'selected' : ''}>750 kcmil</option>
                    <option value="1000" ${component.size === '1000' ? 'selected' : ''}>1000 kcmil</option>
                </select>
            </div>
            <div class="form-group">
                <label for="editCableMaterial">Material:</label>
                <select id="editCableMaterial" required>
                    <option value="copper" ${component.material === 'copper' ? 'selected' : ''}>Copper</option>
                    <option value="aluminum" ${component.material === 'aluminum' ? 'selected' : ''}>Aluminum</option>
                </select>
            </div>
            <div class="form-group">
                <label for="editCableLength">Length (ft):</label>
                <input type="number" id="editCableLength" value="${component.length}" step="0.1" min="0" required>
            </div>
            <div class="form-group">
                <label for="editCableConduit">Conduit:</label>
                <select id="editCableConduit" required>
                    <option value="PVC" ${component.conduit === 'PVC' ? 'selected' : ''}>PVC</option>
                    <option value="Steel" ${component.conduit === 'Steel' ? 'selected' : ''}>Steel/EMT</option>
                    <option value="Aluminum" ${component.conduit === 'Aluminum' ? 'selected' : ''}>Aluminum</option>
                    <option value="NonMetallic" ${component.conduit === 'NonMetallic' ? 'selected' : ''}>Non-Metallic</option>
                </select>
            </div>
            <div class="form-group">
                <label for="editCableParallel">Parallel Runs:</label>
                <input type="number" id="editCableParallel" value="${component.parallel}" min="1" max="10" required>
            </div>
            
            <!-- Collapsible Additional Info -->
            <details open>
                <summary style="cursor: pointer; padding: 10px; background: #f0f0f0; border-radius: 5px; margin: 10px 0;">
                    📋 Additional Information
                </summary>
                <div style="padding: 10px; border: 1px solid #e0e0e0; border-radius: 5px; margin-top: 5px;">
                    <div class="form-group">
                        <label for="editCableManufacturer">Manufacturer:</label>
                        <input type="text" id="editCableManufacturer" value="${component.manufacturer || ''}">
                    </div>
                    <div class="form-group">
                        <label for="editCableCatalog">Catalog Number:</label>
                        <input type="text" id="editCableCatalog" value="${component.catalogNumber || ''}">
                    </div>
                    <div class="form-group">
                        <label for="editCableInsulation">Insulation:</label>
                        <select id="editCableInsulation">
                            <option value="">Not specified</option>
                            <option value="THHN" ${component.insulation === 'THHN' ? 'selected' : ''}>THHN</option>
                            <option value="THWN" ${component.insulation === 'THWN' ? 'selected' : ''}>THWN</option>
                            <option value="THWN-2" ${component.insulation === 'THWN-2' ? 'selected' : ''}>THWN-2</option>
                            <option value="XHHW" ${component.insulation === 'XHHW' ? 'selected' : ''}>XHHW</option>
                            <option value="XHHW-2" ${component.insulation === 'XHHW-2' ? 'selected' : ''}>XHHW-2</option>
                            <option value="USE-2" ${component.insulation === 'USE-2' ? 'selected' : ''}>USE-2</option>
                            <option value="RHH" ${component.insulation === 'RHH' ? 'selected' : ''}>RHH</option>
                            <option value="RHW-2" ${component.insulation === 'RHW-2' ? 'selected' : ''}>RHW-2</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editCableVoltageRating">Voltage Rating:</label>
                        <select id="editCableVoltageRating">
                            <option value="">Not specified</option>
                            <option value="600V" ${component.voltageRating === '600V' ? 'selected' : ''}>600V</option>
                            <option value="1kV" ${component.voltageRating === '1kV' ? 'selected' : ''}>1kV</option>
                            <option value="5kV" ${component.voltageRating === '5kV' ? 'selected' : ''}>5kV</option>
                            <option value="15kV" ${component.voltageRating === '15kV' ? 'selected' : ''}>15kV</option>
                            <option value="25kV" ${component.voltageRating === '25kV' ? 'selected' : ''}>25kV</option>
                            <option value="35kV" ${component.voltageRating === '35kV' ? 'selected' : ''}>35kV</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editCableInstallDate">Installation Date:</label>
                        <input type="date" id="editCableInstallDate" value="${component.installationDate || ''}">
                    </div>
                    <div class="form-group">
                        <label for="editCableNotes">Notes:</label>
                        <textarea id="editCableNotes" rows="3">${component.notes || ''}</textarea>
                    </div>
                </div>
            </details>
        `;
    } else if (component.type === 'transformer') {
        html += `
            <div class="form-group">
                <label for="editTransformerRating">Rating (kVA):</label>
                <input type="number" id="editTransformerRating" value="${component.rating}" step="0.1" min="0" required>
            </div>
            <div class="form-group">
                <label for="editTransformerPrimary">Primary Voltage (V):</label>
                <input type="number" id="editTransformerPrimary" value="${component.primary}" step="0.1" min="0" required>
            </div>
            <div class="form-group">
                <label for="editTransformerSecondary">Secondary Voltage (V):</label>
                <input type="number" id="editTransformerSecondary" value="${component.secondary}" step="0.1" min="0" required>
            </div>
            <div class="form-group">
                <label for="editTransformerImpedance">Impedance (%):</label>
                <input type="number" id="editTransformerImpedance" value="${component.impedance}" step="0.01" min="0" required>
            </div>
            <div class="form-group">
                <label for="editTransformerXR">X/R Ratio:</label>
                <input type="number" id="editTransformerXR" value="${component.xr}" step="0.1" min="0" required>
            </div>
                                <!-- ✅ FEATURE: Edit Tap Setting -->
                                <div class="form-group">
                                          <label for="editTransformerTapSetting">
                                                      Tap Setting (%):
                                                      <span class="tooltip">ℹ️
                                                                 <span class="tooltiptext">Adjust secondary voltage to compensate for voltage drop</span>
                                                      </span>
                                           </label>
                                           <select id="editTransformerTapSetting">
                                                      <option value="-5" ${component.tapSetting === -5 ? 'selected' : ''}>-5.0%</option>
                                                      <option value="-2.5" ${component.tapSetting === -2.5 ? 'selected' : ''}>-2.5%</option>
                                                      <option value="0" ${!component.tapSetting || component.tapSetting === 0 ? 'selected' : ''}>0% (Nominal)</option>
                                                      <option value="2.5" ${component.tapSetting === 2.5 ? 'selected' : ''}>+2.5%</option>
                                                      <option value="5" ${component.tapSetting === 5 ? 'selected' : ''}>+5.0%</option>
                                           </select>
                                           <small style="color: #666; font-size: 0.85em;">
                                                       Current: ${component.tapSetting ? (component.tapSetting > 0 ? '+' : '') + component.tapSetting + '%' : 'Nominal (0%)'}
                                            </small>
                                </div>
        `;
    } else if (component.type === 'generator') {
        html += `
            <div class="form-group">
                <label for="editGeneratorRating">Rating (kVA):</label>
                <input type="number" id="editGeneratorRating" value="${component.rating}" step="0.1" min="0" required>
            </div>
            <div class="form-group">
                <label for="editGeneratorVoltage">Voltage (V):</label>
                <input type="number" id="editGeneratorVoltage" value="${component.voltage}" step="0.1" min="0" required>
            </div>
            <div class="form-group">
                <label for="editGeneratorSubtransient">Subtransient X"d (%):</label>
                <input type="number" id="editGeneratorSubtransient" value="${component.subtransient}" step="0.1" min="0" required>
            </div>
        `;
    } else if (component.type === 'motor') {
        // ═══════════════════════════════════════════════════════════════════
        // FEATURE #1: MOTOR EDIT WITH TYPE
        // ═══════════════════════════════════════════════════════════════════
        html += `
            <div class="form-group">
                <label for="editMotorHP">Motor Horsepower (HP):</label>
                <input type="number" id="editMotorHP" value="${component.hp}" step="0.1" min="0" required>
            </div>
            
            <div class="form-group">
                <label for="editMotorType">Motor Type:</label>
                <select id="editMotorType">
                    <option value="induction" ${component.motorType === 'induction' || !component.motorType ? 'selected' : ''}>Induction Motor (Standard)</option>
                    <option value="synchronous" ${component.motorType === 'synchronous' ? 'selected' : ''}>Synchronous Motor</option>
                    <option value="wound_rotor" ${component.motorType === 'wound_rotor' ? 'selected' : ''}>Wound Rotor Motor</option>
                </select>
            </div>
            
            <details class="collapsible-section" open>
                <summary style="cursor: pointer; padding: 8px; background: #f0f0f0; border-radius: 4px; margin: 8px 0;">
                    ⚙️ Advanced Motor Parameters
                </summary>
                <div style="padding: 10px; border: 1px solid #e0e0e0; border-radius: 5px; margin-top: 5px;">
                    
                    <div class="form-group">
                        <label for="editMotorEfficiency">Motor Efficiency (0.0 - 1.0):</label>
                        <input type="number" id="editMotorEfficiency" value="${component.efficiency || ''}" placeholder="0.90 (default)" step="0.01" min="0.5" max="1.0">
                    </div>
                    
                    <div class="form-group">
                        <label for="editMotorPowerFactor">Motor Power Factor (0.0 - 1.0):</label>
                        <input type="number" id="editMotorPowerFactor" value="${component.powerFactor || ''}" placeholder="0.85 (default)" step="0.01" min="0.5" max="1.0">
                    </div>
                    
                    <div class="form-group">
                        <label for="editMotorName">Motor Name/Tag:</label>
                        <input type="text" id="editMotorName" value="${component.name || ''}" placeholder="e.g., Pump P-101">
                    </div>
                </div>
            </details>
        `;
    }

    modalBody.innerHTML = html;
    modal.style.display = 'block';
}

/**
 * Save component edits
 * ENHANCED: 2025-10-29 14:19:08 UTC by bfforex
 * Feature #1: Motor type save logic
 */
function saveComponentEdits() {
    const id = parseInt(document.getElementById('editComponentId').value);
    const component = components.find(c => c.id === id);
    
    if (!component) {
        alert('❌ Component not found!');
        return;
    }

    if (component.type === 'cable') {
        const newTag = document.getElementById('editCableTag')?.value.trim();
        
        // Validate tag
        if (!newTag) {
            alert('❌ Cable tag is required!');
            return;
        }
        
        // ✅ ISSUE #9: Enforce unique cable tag constraint (excluding current cable)
        const existingCable = components.find(c => 
            c.type === 'cable' && 
            c.tag === newTag && 
            c.id !== id
        );
        
        if (existingCable) {
            alert(
                `❌ ERROR: Cable tag "${newTag}" is already used by another cable!\n\n` +
                `Existing cable: ${existingCable.fromBusName} → ${existingCable.toBusName}\n\n` +
                `Cable tags must be unique for proper tracking and reporting.\n\n` +
                `Please choose a different tag.`
            );
            document.getElementById('editCableTag')?.focus();
            document.getElementById('editCableTag')?.select();
            console.warn(`⚠️ Duplicate cable tag rejected during edit: "${newTag}"`);
            return;
        }
        
        component.tag = newTag;
        component.description = document.getElementById('editCableDescription')?.value.trim() || '';
        component.size = document.getElementById('editCableSize').value;
        component.material = document.getElementById('editCableMaterial').value;
        component.length = parseFloat(document.getElementById('editCableLength').value);
        component.conduit = document.getElementById('editCableConduit').value;
        component.parallel = parseInt(document.getElementById('editCableParallel').value);
        component.manufacturer = document.getElementById('editCableManufacturer')?.value.trim() || '';
        component.catalogNumber = document.getElementById('editCableCatalog')?.value.trim() || '';
        component.insulation = document.getElementById('editCableInsulation')?.value || '';
        component.voltageRating = document.getElementById('editCableVoltageRating')?.value || '';
        component.installationDate = document.getElementById('editCableInstallDate')?.value || '';
        component.notes = document.getElementById('editCableNotes')?.value.trim() || '';
        
        // Update name
        component.name = `${component.tag} - ${component.size} ${component.material.toUpperCase()}${component.parallel > 1 ? ` (${component.parallel}×)` : ''} - ${component.length}ft`;
        
    } else if (component.type === 'transformer') {
        component.rating = parseFloat(document.getElementById('editTransformerRating').value);
        component.primary = parseFloat(document.getElementById('editTransformerPrimary').value);
        component.secondary = parseFloat(document.getElementById('editTransformerSecondary').value);
        component.impedance = parseFloat(document.getElementById('editTransformerImpedance').value);
        component.xr = parseFloat(document.getElementById('editTransformerXR').value);
        component.tapSetting = parseFloat(document.getElementById('editTransformerTapSetting')?.value) || 0;  // ✅ NEW
        component.name = `${component.rating} kVA Transformer (${component.primary}V / ${component.secondary}V)`;
         // ✅ NEW: Log tap change for diagnostics
        if (component.tapSetting !== 0) {
                             console.log(`✅ Transformer tap updated: ${component.tapSetting > 0 ? '+' : ''}${component.tapSetting}%`);
                      }   
    } else if (component.type === 'generator') {
        component.rating = parseFloat(document.getElementById('editGeneratorRating').value);
        component.voltage = parseFloat(document.getElementById('editGeneratorVoltage').value);
        component.subtransient = parseFloat(document.getElementById('editGeneratorSubtransient').value);
        component.name = `${component.rating} kVA Generator (${component.voltage}V)`;
        
    } else if (component.type === 'motor') {
        // ═══════════════════════════════════════════════════════════════════
        // FEATURE #1: MOTOR EDIT SAVE WITH TYPE
        // ═══════════════════════════════════════════════════════════════════
        component.hp = parseFloat(document.getElementById('editMotorHP').value);
        
        // ✅ Update motor type
        const editMotorType = document.getElementById('editMotorType');
        if (editMotorType) {
            component.motorType = editMotorType.value || 'induction';
        }
        
        // ✅ Update advanced parameters
        const editEfficiency = document.getElementById('editMotorEfficiency');
        if (editEfficiency && editEfficiency.value) {
            const efficiency = parseFloat(editEfficiency.value);
            if (efficiency >= 0.5 && efficiency <= 1.0) {
                component.efficiency = efficiency;
            } else {
                component.efficiency = 0.90; // default
            }
        } else {
            component.efficiency = 0.90; // default
        }
        
        const editPowerFactor = document.getElementById('editMotorPowerFactor');
        if (editPowerFactor && editPowerFactor.value) {
            const powerFactor = parseFloat(editPowerFactor.value);
            if (powerFactor >= 0.5 && powerFactor <= 1.0) {
                component.powerFactor = powerFactor;
            } else {
                component.powerFactor = 0.85; // default
            }
        } else {
            component.powerFactor = 0.85; // default
        }
        
        const editName = document.getElementById('editMotorName');
        if (editName && editName.value.trim()) {
            component.name = editName.value.trim();
        } else {
            component.name = `${component.hp} HP Motor (${component.motorType})`;
        }
        
        console.log(`✅ Motor updated: ${component.name}`);
        console.log(`   HP: ${component.hp}`);
        console.log(`   Type: ${component.motorType}`);
        console.log(`   Efficiency: ${(component.efficiency * 100).toFixed(1)}%`);
        console.log(`   Power Factor: ${component.powerFactor.toFixed(2)}`);
    }

    closeEditComponentModal();
    displayComponents();
    autoSaveToLocalStorage();
    
    alert(`✅ Component updated successfully!${component.type === 'cable' ? `\n\nTag: ${component.tag}` : ''}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// DELETE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Delete component
 * ENHANCED: Shows tag in confirmation
 */
function deleteComponent(id) {
    const component = components.find(c => c.id === id);
    if (!component) {
        alert('❌ Component not found!');
        return;
    }
    
    const displayName = component.type === 'cable' && component.tag 
        ? `Cable "${component.tag}"`
        : component.name;
    
    const confirm = window.confirm(
        `⚠️ Delete ${displayName}?\n\n` +
        `From: ${component.fromBusName}\n` +
        `To: ${component.toBusName}\n\n` +
        `This action cannot be undone.`
    );
    
    if (confirm) {
        components = components.filter(c => c.id !== id);
        displayComponents();
        autoSaveToLocalStorage();
        alert(`✅ ${displayName} deleted successfully!`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Move component up or down in the list
 */
function moveComponent(id, direction) {
    const index = components.findIndex(c => c.id === id);
    
    if (index === -1) {
        console.error(`❌ Component ${id} not found`);
        return false;
    }
    
    if (direction === 'up' && index > 0) {
        // Swap with previous component
        [components[index], components[index - 1]] = [components[index - 1], components[index]];
        console.log(`✅ Moved component ${id} up`);
    } else if (direction === 'down' && index < components.length - 1) {
        // Swap with next component
        [components[index], components[index + 1]] = [components[index + 1], components[index]];
        console.log(`✅ Moved component ${id} down`);
    } else {
        console.warn(`⚠️ Cannot move ${direction} - already at ${direction === 'up' ? 'top' : 'bottom'}`);
        return false;
    }
    
    // Refresh display and save
    displayComponents();
    autoSaveToLocalStorage();
    
    return true;
}

/**
 * Update component list display
 * Alias for displayComponents() for backward compatibility
 */
function updateComponentsList() {
    console.log('📋 Updating components list...');
    displayComponents();
}

/**
 * Update bus dropdown selects with current buses
 */
function updateBusSelects() {
    const fromBusSelect = document.getElementById('fromBus');
    const toBusSelect = document.getElementById('toBus');
    
    if (!fromBusSelect || !toBusSelect) {
        console.warn('⚠️ Bus select elements not found in DOM');
        return;
    }
    
    // Save current selections
    const fromBusValue = fromBusSelect.value;
    const toBusValue = toBusSelect.value;
    
    // Clear existing options
    fromBusSelect.innerHTML = '<option value="">Select source bus</option>';
    toBusSelect.innerHTML = '<option value="">Select destination bus</option>';
    
    // Add bus options
    buses.forEach(bus => {
        // From bus option
        const optionFrom = document.createElement('option');
        optionFrom.value = bus.id;
        optionFrom.textContent = `${bus.name} (${bus.voltage}V)`;
        if (bus.id === fromBusValue) optionFrom.selected = true;
        fromBusSelect.appendChild(optionFrom);
        
        // To bus option
        const optionTo = document.createElement('option');
        optionTo.value = bus.id;
        optionTo.textContent = `${bus.name} (${bus.voltage}V)`;
        if (bus.id === toBusValue) optionTo.selected = true;
        toBusSelect.appendChild(optionTo);
    });
    
    console.log(`✅ Bus selects updated with ${buses.length} buses`);
}

/**
 * Get component by ID
 */
function getComponentById(id) {
    return components.find(c => c.id === id) || null;
}

/**
 * Get all components of a specific type
 */
function getComponentsByType(type) {
    return components.filter(c => c.type === type);
}

/**
 * Get all cables (convenience function)
 */
function getAllCables() {
    return getComponentsByType('cable');
}

/**
 * Find cable by tag
 */
function getCableByTag(tag) {
    return components.find(c => c.type === 'cable' && c.tag === tag) || null;
}

/**
 * Validate component data
 */
function validateComponent(component) {
    const errors = [];
    
    if (!component.id) errors.push('Missing component ID');
    if (!component.type) errors.push('Missing component type');
    if (!component.fromBus) errors.push('Missing source bus');
    if (!component.toBus) errors.push('Missing destination bus');
    
    // Type-specific validation
    if (component.type === 'cable') {
        if (!component.tag) errors.push('Missing cable tag');
        if (!component.size) errors.push('Missing cable size');
        if (!component.material) errors.push('Missing cable material');
        if (!component.length || component.length <= 0) errors.push('Invalid cable length');
    } else if (component.type === 'transformer') {
        if (!component.rating || component.rating <= 0) errors.push('Invalid transformer rating');
        if (!component.impedance || component.impedance <= 0) errors.push('Invalid transformer impedance');
    } else if (component.type === 'motor') {
        if (!component.hp || component.hp <= 0) errors.push('Invalid motor HP');
        if (!component.motorType) errors.push('Missing motor type');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// BUS TIE STATE MANAGEMENT
// Added: 2025-11-04 by bfforex - Feature: Bus Tie Circuit Breaker Analysis
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Toggle bus tie operating state between OPEN and CLOSED
 * @param {number} componentId - ID of the bus tie component
 */
function toggleBusTieState(componentId) {
    const busTie = components.find(c => c.id === componentId);
    
    if (!busTie || busTie.type !== 'bus-tie') {
        alert('❌ Bus tie not found!');
        return;
    }
    
    const currentState = busTie.currentState || busTie.normalState || 'open';
    const newState = currentState === 'open' ? 'closed' : 'open';
    
    // Confirmation dialog with safety warnings
    const confirmMessage = newState === 'closed' 
        ? `⚠️ CLOSE BUS TIE: ${busTie.tag}\n\n` +
          `This will PARALLEL the following buses:\n` +
          `  • ${busTie.fromBusName} (${busTie.voltage}V)\n` +
          `  • ${busTie.toBusName} (${busTie.voltage}V)\n\n` +
          `WARNINGS:\n` +
          `  ⚠️ Fault current will INCREASE by ~30-40%\n` +
          `  ⚠️ Arc flash hazard will INCREASE significantly\n` +
          `  ⚠️ Verify all breaker ratings are adequate\n` +
          `  ⚠️ Check source interlock if applicable\n\n` +
          `Per IEEE 141: Ensure protection coordination is valid.\n\n` +
          `Proceed with CLOSING bus tie?`
        : `🔌 OPEN BUS TIE: ${busTie.tag}\n\n` +
          `This will ISOLATE the buses:\n` +
          `  • ${busTie.fromBusName} (${busTie.voltage}V)\n` +
          `  • ${busTie.toBusName} (${busTie.voltage}V)\n\n` +
          `This is the normal operating mode per IEEE 141.\n\n` +
          `Proceed with OPENING bus tie?`;
    
    if (!confirm(confirmMessage)) {
        console.log(`❌ Bus tie state change cancelled by user`);
        return;
    }
    
    // Update state
    busTie.currentState = newState;
    
    console.log('\n' + '═'.repeat(70));
    console.log(`🔄 BUS TIE STATE CHANGED: ${busTie.tag}`);
    console.log('═'.repeat(70));
    console.log(`Previous State:  ${currentState.toUpperCase()}`);
    console.log(`New State:       ${newState.toUpperCase()}`);
    console.log(`Normal State:    ${(busTie.normalState || 'open').toUpperCase()}`);
    console.log(`Between:         ${busTie.fromBusName} ↔ ${busTie.toBusName}`);
    console.log(`Voltage:         ${busTie.voltage} V`);
    console.log('─'.repeat(70));
    
    if (newState === 'closed') {
        console.log('⚠️ WARNING: Fault current will increase significantly!');
        console.log('⚠️ WARNING: Arc flash hazard increased - update PPE labels!');
        console.log('⚠️ WARNING: Verify breaker interrupting ratings!');
    } else {
        console.log('✅ Buses now isolated - normal operating mode');
        console.log('✅ Fault current and arc flash reduced to normal levels');
    }
    
    console.log('═'.repeat(70) + '\n');
    
    // Refresh display
    displayComponents();
    autoSaveToLocalStorage();
    
    // Show success message
    const stateIcon = newState === 'open' ? '🔌' : '⚡';
    const stateText = newState === 'open' ? 'OPEN (Isolated)' : 'CLOSED (Operating)';
    
    alert(
        `${stateIcon} Bus Tie State Changed!\n\n` +
        `Tag: ${busTie.tag}\n` +
        `New State: ${stateText}\n\n` +
        `${newState === 'closed' 
            ? '⚠️ Remember to:\n' +
              '  • Recalculate fault currents\n' +
              '  • Update arc flash labels\n' +
              '  • Verify breaker ratings\n' +
              '  • Review protection coordination'
            : '✅ Buses now operate independently\n' +
              '  • Fault current reduced\n' +
              '  • Arc flash hazard reduced\n' +
              '  • Normal operating mode'
        }`
    );
    
    // ✅ Trigger recalculation of affected buses
    if (typeof getBusesToRecalculate === 'function') {
        const affectedBuses = getBusesToRecalculate(componentId);
        console.log(`   Affected buses for recalculation: ${affectedBuses.join(', ')}`);
        
        // Note: Automatic recalculation is not triggered to avoid performance issues
        // User should manually recalculate after state change
        console.log('   ⚠️ Manual recalculation recommended after bus tie state change');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function closeEditComponentModal() {
    document.getElementById('editComponentModal').style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT ALL FUNCTIONS TO GLOBAL SCOPE
// ═══════════════════════════════════════════════════════════════════════════

window.moveComponent = moveComponent;
window.updateComponentsList = updateComponentsList;
window.updateBusSelects = updateBusSelects;
window.getComponentById = getComponentById;
window.getComponentsByType = getComponentsByType;
window.getAllCables = getAllCables;
window.getCableByTag = getCableByTag;
window.validateComponent = validateComponent;
window.updateComponentInputs = updateComponentInputs;
window.addComponent = addComponent;
window.displayComponents = displayComponents;
window.viewCableDetails = viewCableDetails;
window.closeCableDetailsModal = closeCableDetailsModal;
window.editComponent = editComponent;
window.saveComponentEdits = saveComponentEdits;
window.deleteComponent = deleteComponent;
window.closeEditComponentModal = closeEditComponentModal;
window.toggleBusTieState = toggleBusTieState;

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    updateComponentInputs();
    displayComponents();
    console.log('✅ Component Manager v2.1 initialized');
    console.log('   - Cable Tagging System: READY (Feature #7)');
    console.log('   - Motor Type Selection: READY (Feature #1)');
});

console.log('✅ Component Manager v2.1 loaded - Motor Contribution Support Ready');
console.log('   - Cable Tagging: ENABLED');
console.log('   - Motor Types: Induction, Synchronous, Wound Rotor');
console.log('   - Advanced Motor Parameters: Efficiency, Power Factor, Custom Name');
                
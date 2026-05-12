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

                <!-- ═══════════════════════════════════════════════════════════ -->
                <!-- VECTOR GROUP — affects Z0 / ground-fault calculations      -->
                <!-- ═══════════════════════════════════════════════════════════ -->
                <div class="form-group">
                    <label for="transformerVectorGroup">
                        Vector Group:
                        <span class="tooltip">ℹ️
                            <span class="tooltiptext">
                                Determines zero-sequence (Z0) impedance behaviour and ground-fault current path.
                                Dyn11 is the most common distribution transformer (delta primary, grounded-wye secondary).
                                Per IEC 60076-1, IEEE 141-1993 §5.4, and IEC 60909-0 §3.3.
                            </span>
                        </span>
                    </label>
                    <select id="transformerVectorGroup" onchange="updateTransformerVectorNote()" required>
                        <optgroup label="Most Common — Distribution">
                            <option value="Dyn11" selected>Dyn11 — Delta / Grounded-Wye (most common LV dist.)</option>
                            <option value="Dyn1">Dyn1 — Delta / Grounded-Wye (alt. phase)</option>
                            <option value="Yyn0">Yyn0 — Ungrounded-Wye / Grounded-Wye</option>
                        </optgroup>
                        <optgroup label="Utility / Transmission">
                            <option value="YNd11">YNd11 — Grounded-Wye / Delta</option>
                            <option value="YNd1">YNd1 — Grounded-Wye / Delta (alt. phase)</option>
                            <option value="YNyn0">YNyn0 — Grounded-Wye / Grounded-Wye</option>
                        </optgroup>
                        <optgroup label="Grounding / Special">
                            <option value="Yzn11">Yzn11 — Wye / Zigzag-Grounded</option>
                        </optgroup>
                        <optgroup label="Ungrounded / Delta">
                            <option value="Dd0">Dd0 — Delta / Delta (Z0 blocked)</option>
                            <option value="Dy11">Dy11 — Delta / Ungrounded-Wye (Z0 blocked)</option>
                            <option value="Yd11">Yd11 — Ungrounded-Wye / Delta (Z0 blocked)</option>
                        </optgroup>
                    </select>
                    <small id="transformerVectorNote" style="color:#1565c0; font-size:0.82em; display:block; margin-top:4px; padding:4px 6px; background:rgba(21,101,192,0.06); border-radius:3px;">
                        Dyn11: primary delta traps upstream Z0; grounded-wye secondary is the zero-seq source for LV faults.
                    </small>
                </div>

                <!-- ═══════════════════════════════════════════════════════════ -->
                <!-- GROUNDING MODE — secondary neutral grounding                -->
                <!-- ═══════════════════════════════════════════════════════════ -->
                <div class="form-group">
                    <label for="transformerGroundingMode">
                        Secondary Neutral Grounding:
                        <span class="tooltip">ℹ️
                            <span class="tooltiptext">
                                How the transformer secondary neutral is connected to ground.
                                Affects L-G fault magnitude and protection coordination.
                                Per IEEE 142 (Green Book) and NEC Article 250.
                            </span>
                        </span>
                    </label>
                    <select id="transformerGroundingMode" onchange="updateTransformerGroundingNote()">
                        <option value="solidly-grounded" selected>Solidly Grounded (NEC 250.20(B))</option>
                        <option value="low-resistance">Low-Resistance Grounded — LRG (200–600 A)</option>
                        <option value="high-resistance">High-Resistance Grounded — HRG (&lt;10 A)</option>
                        <option value="impedance-grounded">Impedance Grounded (Reactance)</option>
                        <option value="ungrounded">Ungrounded / Isolated Neutral</option>
                    </select>
                    <small id="transformerGroundingNote" style="color:#1b5e20; font-size:0.82em; display:block; margin-top:4px; padding:4px 6px; background:rgba(27,94,32,0.06); border-radius:3px;">
                        Solidly grounded: maximum L-G fault current; most common for ≤600 V systems.
                    </small>
                </div>

                <!-- Neutral Resistor — shown only when LRG or HRG selected -->
                <div class="form-group" id="transformerNeutralRGroup" style="display:none;">
                    <label for="transformerNeutralR">
                        Neutral Resistor Rn (Ω):
                        <span class="tooltip">ℹ️
                            <span class="tooltiptext">
                                Neutral grounding resistor rating. Appears as 3×Rn in zero-sequence network.
                                L-G fault current = V_LN / Rn (approximately, neglecting system impedance).
                            </span>
                        </span>
                    </label>
                    <input type="number" id="transformerNeutralR" placeholder="e.g., 12 (for 13.2kV/630A LRG)" step="0.01" min="0">
                    <small style="color:#666; font-size:0.82em;">3×Rn added to zero-sequence network — IEEE 142-2007 §2.2</small>
                </div>

                <!-- COOLING CLASS -->
                <div class="form-group">
                    <label for="transformerCoolingClass">
                        Cooling Class (ONAN/ONAF/…):
                        <span class="tooltip">ℹ️
                            <span class="tooltiptext">
                                IEC 60076-2 / IEEE C57 cooling designation.
                                Affects overload capacity and temperature-rise limits.
                                Not used in impedance calculations but required for full equipment schedule.
                            </span>
                        </span>
                    </label>
                    <select id="transformerCoolingClass">
                        <option value="ONAN" selected>ONAN — Oil Natural Air Natural (self-cooled)</option>
                        <option value="ONAF">ONAF — Oil Natural Air Forced</option>
                        <option value="OFAF">OFAF — Oil Forced Air Forced</option>
                        <option value="OFWF">OFWF — Oil Forced Water Forced</option>
                        <option value="KNAN">KNAN — Non-inflammable oil, natural</option>
                        <option value="AN">AN — Dry-type, Air Natural (AA)</option>
                        <option value="AF">AF — Dry-type, Air Forced (AFA)</option>
                    </select>
                </div>

                <!-- LOSSES (optional — for energy studies and reports) -->
                <details class="collapsible-section" style="margin-top:8px;">
                    <summary style="font-size:11px; color:#667eea; cursor:pointer;">📊 No-Load / Load Losses (optional)</summary>
                    <div style="padding:8px; border:1px solid #e0e0e0; border-radius:4px; margin-top:4px;">
                        <div class="form-group">
                            <label for="transformerNoLoadLoss" style="font-size:12px;">No-Load (Core/Iron) Loss P0 (kW):</label>
                            <input type="number" id="transformerNoLoadLoss" placeholder="e.g., 1.8" step="0.01" min="0"
                                   style="font-size:11px;">
                            <small style="color:#666; font-size:0.8em;">IEC 60076-1 P0 test — constant loss regardless of load</small>
                        </div>
                        <div class="form-group">
                            <label for="transformerLoadLoss" style="font-size:12px;">Load (Copper/Winding) Loss Pk (kW) at rated:</label>
                            <input type="number" id="transformerLoadLoss" placeholder="e.g., 8.5" step="0.01" min="0"
                                   style="font-size:11px;">
                            <small style="color:#666; font-size:0.8em;">IEC 60076-1 Pk test at rated current — varies with load²</small>
                        </div>
                    </div>
                </details>
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
                <small style="color: #666; font-size: 0.85em;">Must be unique.Used throughout the application.</small>
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
                <label for="cableInstallMethod">
                    Installation Method:
                    <span class="tooltip">ℹ️
                        <span class="tooltiptext">
                            Affects reactance (X), zero-sequence impedance (Z0), and ampacity derating.
                            Per NEC 310.15, NEC Ch 9 Table 9, IEEE 141-1993 §4, and IEC 60364-5-52.
                        </span>
                    </span>
                </label>
                <select id="cableInstallMethod" required onchange="updateCableInstallNote()">
                    <optgroup label="Conduit">
                        <option value="conduit-pvc" selected>PVC / Non-Metallic Conduit</option>
                        <option value="conduit-steel">Steel / EMT Conduit</option>
                        <option value="conduit-aluminum">Aluminum Conduit</option>
                    </optgroup>
                    <optgroup label="Cable Tray">
                        <option value="tray-trefoil">Cable Tray — Trefoil (triangular)</option>
                        <option value="tray-flat-touching">Cable Tray — Flat, Touching</option>
                        <option value="tray-flat-spaced">Cable Tray — Flat, Spaced (≥1Ø apart)</option>
                    </optgroup>
                    <optgroup label="Open / Air">
                        <option value="free-air">In Free Air</option>
                    </optgroup>
                    <optgroup label="Underground">
                        <option value="underground-direct">Underground — Direct Buried</option>
                        <option value="underground-duct-pvc">Underground — PVC Duct Bank</option>
                        <option value="underground-duct-concrete">Underground — Concrete-Encased Duct Bank</option>
                    </optgroup>
                </select>
                <small id="cableInstallNote" style="color:#666; font-size:0.82em; display:block; margin-top:4px;">
                    PVC conduit: base X per NEC Ch 9 Table 9; Z0 = 3.5×Z1
                </small>
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

    } else if (type === 'breaker') {
        html = `
    <div class="form-group">
        <label for="breakerTag">Breaker Tag: *</label>
        <input type="text" id="breakerTag" placeholder="e.g., 52-101">
    </div>

    <div class="form-group">
        <label for="breakerDescription">Description:</label>
        <input type="text" id="breakerDescription" placeholder="e.g., 13.2kV Feeder Breaker">
    </div>

    <div class="form-group">
        <label for="breakerClass">Breaker Class: *</label>
        <select id="breakerClass">
            <option value="MCCB">MCCB</option>
            <option value="ACB">ACB</option>
            <option value="VCB">VCB</option>
            <option value="SF6">SF6</option>
            <option value="GIS">GIS</option>
            <option value="RECLOSER">RECLOSER</option>
        </select>
    </div>

    <div class="form-group">
        <label for="breakerTripUnitType">Trip Unit Type:</label>
        <select id="breakerTripUnitType">
            <option value="electronic">Electronic</option>
            <option value="thermal-magnetic">Thermal-Magnetic</option>
            <option value="relay-controlled">Relay-Controlled</option>
            <option value="fixed">Fixed</option>
        </select>
    </div>

    <div class="form-group">
        <label for="breakerContinuousA">Continuous Amp Rating (A): *</label>
        <input type="number" id="breakerContinuousA" min="0" step="0.1" placeholder="e.g., 1200">
    </div>

    <div class="form-group">
        <label for="breakerInterruptingSymKA">Interrupting Symmetrical Rating (kA): *</label>
        <input type="number" id="breakerInterruptingSymKA" min="0" step="0.1" placeholder="e.g., 25">
    </div>

    <div class="form-group">
        <label for="breakerInterruptingAsymKA">Interrupting Asymmetrical Rating (kA):</label>
        <input type="number" id="breakerInterruptingAsymKA" min="0" step="0.1" placeholder="Optional">
    </div>

    <div class="form-group">
        <label for="breakerMomentaryKA">Momentary Rating (kA):</label>
        <input type="number" id="breakerMomentaryKA" min="0" step="0.1" placeholder="Optional">
    </div>

    <div class="form-group">
        <label for="breakerCloseLatchKA">Close-Latch Rating (kA):</label>
        <input type="number" id="breakerCloseLatchKA" min="0" step="0.1" placeholder="Optional">
    </div>
    `;

    } else if (type === 'fuse') {
        html = `
    <div class="form-group">
        <label for="fuseTag">Fuse Tag: *</label>
        <input type="text" id="fuseTag" placeholder="e.g., F-101">
    </div>

    <div class="form-group">
        <label for="fuseDescription">Description:</label>
        <input type="text" id="fuseDescription" placeholder="e.g., Transformer Primary Fuse">
    </div>

    <div class="form-group">
        <label for="fuseClass">Fuse Class: *</label>
        <select id="fuseClass">
            <option value="HRC">HRC</option>
            <option value="CURRENT_LIMITING">Current Limiting</option>
            <option value="EXPULSION">Expulsion</option>
            <option value="POWER_FUSE">Power Fuse</option>
            <option value="BRANCH_FUSE">Branch Fuse</option>
        </select>
    </div>

    <div class="form-group">
        <label for="fuseSpeedClass">Speed Class:</label>
        <input type="text" id="fuseSpeedClass" placeholder="e.g., time-delay, fast, E-rated">
    </div>

    <div class="form-group">
        <label for="fuseAmpereRating">Ampere Rating (A): *</label>
        <input type="number" id="fuseAmpereRating" min="0" step="0.1" placeholder="e.g., 100">
    </div>

    <div class="form-group">
        <label for="fuseInterruptingKA">Interrupting Rating (kA): *</label>
        <input type="number" id="fuseInterruptingKA" min="0" step="0.1" placeholder="e.g., 50">
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
                        <span class="tooltiptext">Motor type affects short circuit contribution.Induction motors are most common.Synchronous motors have higher contribution.</span>
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
                                <span class="tooltiptext">Typical values: 0.85-0.95.Higher HP motors are more efficient.Default: 0.90</span>
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
                                <span class="tooltiptext">Typical values: 0.80-0.90.Varies with load.Default: 0.85</span>
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
                            <span class="tooltiptext">Normal operating position of breaker.Per IEEE 141, bus ties typically operate OPEN.</span>
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
        alert('❌ Please select both From and To buses! ');
        return;
    }

    const fromBus = buses.find(b => b.id === fromBusId);
    const toBus = buses.find(b => b.id === toBusId);

    if (!fromBus || !toBus) {
        alert('❌ Invalid bus selection!');
        return;
    }

    let component = {
        id: generateUniqueId('comp'),
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
        const installationMethod = document.getElementById('cableInstallMethod')?.value || 'conduit-pvc';
        const parallel = parseInt(document.getElementById('cableParallel').value) || 1;
        
        if (! size || !material || !length) {
            alert('❌ Please fill in all required cable fields!');
            return;
        }
        
        component = {
            ...component,
            size: size,
            material: material,
            length: length,
            installationMethod: installationMethod,
            // Keep conduit for backward compatibility — derive from installationMethod
            conduit: installationMethod.startsWith('conduit-steel') ? 'Steel'
                   : installationMethod.startsWith('conduit-aluminum') ? 'Aluminum'
                   : installationMethod.startsWith('conduit-') ? 'PVC'
                   : 'NonMetallic',
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
            alert('❌ Please fill in all required transformer fields! ');
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
            
            // ✅ Vector group — drives Z0 behaviour in fault calculations
            vectorGroup:    document.getElementById('transformerVectorGroup')?.value || 'Dyn11',
            groundingMode:  document.getElementById('transformerGroundingMode')?.value || 'solidly-grounded',
            neutralR:       parseFloat(document.getElementById('transformerNeutralR')?.value) || 0,
            coolingClass:   document.getElementById('transformerCoolingClass')?.value || 'ONAN',
            
            // ✅ Losses (optional)
            noLoadLoss_kW:  parseFloat(document.getElementById('transformerNoLoadLoss')?.value) || null,
            loadLoss_kW:    parseFloat(document.getElementById('transformerLoadLoss')?.value) || null,
            
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
     
       } else if (type === 'breaker') {
                    const tag = document.getElementById('breakerTag')?.value.trim();
                    if (!tag) {
                        alert('❌ Breaker tag is required!');
                        document.getElementById('breakerTag')?.focus();
                        return;
                    }

                    const existingBreaker = components.find(c => c.type === 'breaker' && c.tag === tag);
                    if (existingBreaker) {
                        alert(
                            `❌ ERROR: Breaker tag "${tag}" already exists!\n\n` +
                            `Existing breaker: ${existingBreaker.fromBusName} → ${existingBreaker.toBusName}\n` +
                            `New breaker: ${fromBus.name} → ${toBus.name}\n\n` +
                            `Breaker tags must be unique for proper tracking and reporting.`
                        );
                        document.getElementById('breakerTag')?.focus();
                        document.getElementById('breakerTag')?.select();
                        return;
                    }

                    const breakerClass = document.getElementById('breakerClass')?.value;
                    const tripUnitType = document.getElementById('breakerTripUnitType')?.value || 'electronic';
                    const continuousAmpRating = parseFloat(document.getElementById('breakerContinuousA')?.value);
                    const interruptingRatingSymKA = parseFloat(document.getElementById('breakerInterruptingSymKA')?.value);
                    const interruptingRatingAsymKA = parseFloat(document.getElementById('breakerInterruptingAsymKA')?.value) || 0;
                    const momentaryRatingKA = parseFloat(document.getElementById('breakerMomentaryKA')?.value) || 0;
                    const closeLatchRatingKA = parseFloat(document.getElementById('breakerCloseLatchKA')?.value) || 0;

                    if (!breakerClass || !continuousAmpRating || !interruptingRatingSymKA) {
                        alert('❌ Please fill in all required breaker fields!');
                        return;
                    }

                    component = {
                        ...component,
                        tag: tag,
                        description: document.getElementById('breakerDescription')?.value.trim() || '',
                        voltage: fromBus.voltage,
                        breakerClass: breakerClass,
                        tripUnitType: tripUnitType,
                        continuousAmpRating: continuousAmpRating,
                        interruptingRatingSymKA: interruptingRatingSymKA,
                        interruptingRatingAsymKA: interruptingRatingAsymKA,
                        momentaryRatingKA: momentaryRatingKA,
                        closeLatchRatingKA: closeLatchRatingKA,
                        name: `${tag} - ${breakerClass} ${continuousAmpRating}A`
                    };

                    console.log(`✅ Breaker "${tag}" added:`, component);

                } else if (type === 'fuse') {
                    const tag = document.getElementById('fuseTag')?.value.trim();
                    if (!tag) {
                        alert('❌ Fuse tag is required!');
                        document.getElementById('fuseTag')?.focus();
                        return;
                    }

                    const existingFuse = components.find(c => c.type === 'fuse' && c.tag === tag);
                    if (existingFuse) {
                        alert(
                            `❌ ERROR: Fuse tag "${tag}" already exists!\n\n` +
                            `Existing fuse: ${existingFuse.fromBusName} → ${existingFuse.toBusName}\n` +
                            `New fuse: ${fromBus.name} → ${toBus.name}\n\n` +
                            `Fuse tags must be unique for proper tracking and reporting.`
                        );
                        document.getElementById('fuseTag')?.focus();
                        document.getElementById('fuseTag')?.select();
                        return;
                    }

                    const fuseClass = document.getElementById('fuseClass')?.value;
                    const speedClass = document.getElementById('fuseSpeedClass')?.value.trim() || '';
                    const ampereRating = parseFloat(document.getElementById('fuseAmpereRating')?.value);
                    const interruptingRatingKA = parseFloat(document.getElementById('fuseInterruptingKA')?.value);

                    if (!fuseClass || !ampereRating || !interruptingRatingKA) {
                        alert('❌ Please fill in all required fuse fields!');
                        return;
                    }

                    component = {
                        ...component,
                        tag: tag,
                        description: document.getElementById('fuseDescription')?.value.trim() || '',
                        voltage: fromBus.voltage,
                        fuseClass: fuseClass,
                        speedClass: speedClass,
                        ampereRating: ampereRating,
                        interruptingRatingKA: interruptingRatingKA,
                        name: `${tag} - ${ampereRating}A ${fuseClass}`
                    };

                    console.log(`✅ Fuse "${tag}" added:`, component);
   
    } else if (type === 'motor') {
        // ═══════════════════════════════════════════════════════════════════
        // MOTOR WITH AUTO-TAG GENERATION
        // Format: M-{FROM_BUS}-{HP}-{SEQ}
        // Enhanced: 2025-11-03 13:52:00 UTC by bfforex
        // FIXED: Bus object reference (fromBus is already an object, not ID)
        // ═══════════════════════════════════════════════════════════════════
        const hp = parseFloat(document.getElementById('motorHP').value);
    
        if (!hp || hp <= 0) {
            alert('❌ Please enter a valid motor HP! ');
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
    
        const motorTagInfo = generateMotorAutoTag(fromBus, hp);
        const fromBusTagFormatted = motorTagInfo.fromBusTagFormatted;
        const nextSeq = motorTagInfo.sequenceNumber;
        const finalTag = motorTagInfo.tag;
    
        // ✅ Build component with auto-tag
        component = {
            ...component,
            hp: hp,
            motorType: motorType,
            efficiency: efficiency,
            powerFactor: powerFactor,
            name: motorName,
            tag: finalTag,  // ✅ Auto-generated tag
            tagAutoGenerated: true,
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
        
        
        const busTieTagInfo = generateBusTieAutoTag(fromBus, toBus);
        const busA = busTieTagInfo.busA;
        const busB = busTieTagInfo.busB;
        const nextSeq = busTieTagInfo.sequenceNumber;
        const finalTag = busTieTagInfo.tag;
    
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
            tagAutoGenerated: true,
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
                      `${component.description ?  `Description: ${component.description}` : ''}`);
    } else if (type === 'transformer') {
        alert(`✅ Transformer "${component.tag}" added successfully!\n\n` +
                       `From: ${fromBus.name}\n` +
                       `To: ${toBus.name}\n` +
                       `Rating: ${component.rating} kVA`);
    } else if (type === 'breaker') {
                   alert( `✅ Breaker "${component.tag}" added successfully!\n\n` +
            						     `From: ${fromBus.name}\n` +
            						     `To: ${toBus.name}\n` +
       						             `Class: ${component.breakerClass}\n` +
            						     `Continuous: ${component.continuousAmpRating} A\n` +
            						     `Interrupting: ${component.interruptingRatingSymKA} kA`);
           } else if (type === 'fuse') {
                   alert(`✅ Fuse "${component.tag}" added successfully!\n\n` +
            						     `From: ${fromBus.name}\n` +
            						     `To: ${toBus.name}\n` +
            						     `Class: ${component.fuseClass}\n` +
            						     `Ampere Rating: ${component.ampereRating} A\n` +
            						     `Interrupting: ${component.interruptingRatingKA} kA`);
    } else if (type === 'motor') {
        alert(`✅ Motor "${component.tag}" added successfully!\n\n` +
                       `Name: ${component.name}\n` +
                       `HP: ${component.hp}\n` +
                       `Type: ${component.motorType}\n` +
                       `Location: ${component.location}\n` +
                       `Tag: ${component.tag}`);
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
        alert(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} added successfully! `);
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
// AUTO ARRANGE COMPONENTS HELPERS
// ═══════════════════════════════════════════════════════════════════════════


function getComponentBusHierarchyInfo() {
 const currentBuses = Array.isArray(buses) ? buses : [];
 const validBusIds = new Set(currentBuses.map(bus => String(bus.id)));
 const originalBusIndex = new Map();

 currentBuses.forEach((bus, index) => {
  originalBusIndex.set(String(bus.id), index);
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
   return (originalBusIndex.get(String(a.id)) || 0) - (originalBusIndex.get(String(b.id)) || 0);
  });
 });

 let roots = childrenByParent.get('') || [];

 if (roots.length === 0 && currentBuses.length > 0) {
  roots = currentBuses.slice();
 }

 const busOrder = new Map();
 const busLevel = new Map();
 const busPath = new Map();
 let orderCounter = 0;

 function walk(bus, level, path, stack) {
  if (!bus || !bus.id) return;

  const busKey = String(bus.id);

  if (stack.has(busKey)) {
   if (!busOrder.has(busKey)) {
    busOrder.set(busKey, orderCounter++);
    busLevel.set(busKey, level);
    busPath.set(busKey, path.concat(bus.name || bus.id));
   }
   return;
  }

  if (busOrder.has(busKey)) return;

  busOrder.set(busKey, orderCounter++);
  busLevel.set(busKey, level);
  busPath.set(busKey, path.concat(bus.name || bus.id));

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
  if (!busOrder.has(String(bus.id))) {
   walk(bus, 0, ['Unresolved hierarchy'], new Set());
  }
 });

 return {
  busOrder,
  busLevel,
  busPath
 };
}

function getComponentTypeSortOrder(type) {
 const normalizedType = String(type || '').toLowerCase();

 const order = {
  'cable': 10,
  'fuse': 20,
  'breaker': 30,
  'transformer': 40,
  'bus-tie': 50,
  'generator': 60,
  'motor': 70,
  'load': 80
 };

 return order[normalizedType] || 99;
}

function getAutoArrangedComponents() {
 const currentComponents = Array.isArray(components) ? components : [];
 const hierarchy = getComponentBusHierarchyInfo();

 return currentComponents
  .map((component, originalIndex) => {
   const fromOrder = hierarchy.busOrder.has(String(component.fromBus))
    ? hierarchy.busOrder.get(String(component.fromBus))
    : 999999;

   const toOrder = hierarchy.busOrder.has(String(component.toBus))
    ? hierarchy.busOrder.get(String(component.toBus))
    : 999999;

   const fromLevel = hierarchy.busLevel.has(String(component.fromBus))
    ? hierarchy.busLevel.get(String(component.fromBus))
    : 999999;

   return {
    component,
    originalIndex,
    fromOrder,
    toOrder,
    fromLevel,
    typeOrder: getComponentTypeSortOrder(component.type)
   };
  })
  .sort((a, b) => {
   if (a.fromOrder !== b.fromOrder) return a.fromOrder - b.fromOrder;
   if (a.toOrder !== b.toOrder) return a.toOrder - b.toOrder;
   if (a.typeOrder !== b.typeOrder) return a.typeOrder - b.typeOrder;
   return a.originalIndex - b.originalIndex;
  })
  .map(entry => entry.component);
}

function getComponentBusLabel(busId) {
 const bus = Array.isArray(buses)
  ? buses.find(b => String(b.id) === String(busId))
  : null;

 if (!bus) return 'Unknown / Unassigned Bus';

 return `${bus.name} (${bus.voltage}V)`;
}

function renderComponentGroupHeader(busId) {
 const hierarchy = getComponentBusHierarchyInfo();
 const bus = Array.isArray(buses)
  ? buses.find(b => String(b.id) === String(busId))
  : null;

 const level = hierarchy.busLevel.has(String(busId))
  ? hierarchy.busLevel.get(String(busId))
  : 0;

 const path = hierarchy.busPath.has(String(busId))
  ? hierarchy.busPath.get(String(busId))
  : [];

 const indentPx = level * 18;

 const busName = bus ? bus.name : 'Unknown / Unassigned Bus';
 const busVoltage = bus ? `${bus.voltage}V` : '';
 const busType = bus ? String(bus.type || '').toUpperCase() : 'UNKNOWN';

 return `
<div class="component-group-header" style="
 margin: 14px 0 8px 0;
 padding: 10px 12px;
 border-left: 5px solid ${level === 0 ? '#244a9b' : level === 1 ? '#17a2b8' : '#6f42c1'};
 background: ${level === 0 ? '#f5f8ff' : level === 1 ? '#f3fcff' : '#fbf7ff'};
 border-radius: 6px;
">
 <div style="display:flex; align-items:center; gap:8px; padding-left:${indentPx}px;">
  <span style="
   display:inline-block;
   min-width:32px;
   text-align:center;
   color:white;
   background:${level === 0 ? '#244a9b' : level === 1 ? '#17a2b8' : '#6f42c1'};
   border-radius:999px;
   font-size:11px;
   font-weight:700;
   padding:2px 6px;
  ">L${level}</span>
  <strong>🔌 ${busName}</strong>
  <span style="color:#666;">${busVoltage}</span>
  <span class="badge badge-info">${busType}</span>
 </div>
 <div style="padding-left:${indentPx + 48}px; color:#777; font-size:11px; margin-top:3px;">
  ${path.length > 0 ? path.join(' › ') : 'Root / unresolved path'}
 </div>
</div>`;
}


// ═══════════════════════════════════════════════════════════════════════════
// DISPLAY COMPONENTS WITH TAGGING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Display all components with cable tags and From/To information
 * ENHANCED: 2025-10-29 14:14:42 UTC by bfforex
 * FIXED: 2025-12-02 - Event delegation with proper listener cleanup
 * UPDATED: 2025-12-02 - Bus Tie: added Details + Edit buttons like other components
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
    
    const arrangedComponents = getAutoArrangedComponents();
    let currentComponentGroupBusId = null;

    arrangedComponents.forEach((comp, index) => {
             const groupBusId = comp.fromBus || 'unknown';

             if (String(groupBusId) !== String(currentComponentGroupBusId)) {
               currentComponentGroupBusId = groupBusId;
               html += renderComponentGroupHeader(groupBusId);
             }
        const componentNumber = index + 1;
        
        html += `<div class="component-item" data-component-id="${comp.id}">`;
        
        // ═══════════════════════════════════════════════════════════════
        // CABLE COMPONENT (WITH TAGGING)
        // ═══════════════════════════════════════════════════════════════
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
                        <button class="btn btn-info btn-small btn-details" data-id="${comp.id}" data-type="cable" title="View detailed cable information">
                            📋 Details
                        </button>
                        <button class="btn btn-secondary btn-small btn-edit" data-id="${comp.id}" title="Edit cable">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger btn-small btn-delete" data-id="${comp.id}" title="Delete cable">
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
                            ${comp.parallel > 1 ?  ` <span class="parallel-badge">(${comp.parallel}× parallel)</span>` : ''}
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
        
        // ═══════════════════════════════════════════════════════════════
        // TRANSFORMER COMPONENT
        // ═══════════════════════════════════════════════════════════════
        else if (comp.type === 'transformer') {
            html += `
                <div class="component-header">
                    <div class="component-type-section">
                        <span class="component-icon">🔌</span>
                        <span class="component-name"><strong>${comp.name}</strong></span>
                    </div>
                    <div class="component-controls">
                        <button class="btn btn-secondary btn-small btn-edit" data-id="${comp.id}">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger btn-small btn-delete" data-id="${comp.id}">
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
        
        // ═══════════════════════════════════════════════════════════════
        // GENERATOR COMPONENT
        // ═══════════════════════════════════════════════════════════════
        else if (comp.type === 'generator') {
            html += `
                <div class="component-header">
                    <div class="component-type-section">
                        <span class="component-icon">⚡</span>
                        <span class="component-name"><strong>${comp.name}</strong></span>
                    </div>
                    <div class="component-controls">
                        <button class="btn btn-secondary btn-small btn-edit" data-id="${comp.id}">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger btn-small btn-delete" data-id="${comp.id}">
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

        // ═══════════════════════════════════════════════════════════════
        // PROTECTION COMPONENT
        // ═══════════════════════════════════════════════════════════════
        else if (comp.type === 'breaker') {
                                html += `
               <div class="component-item">
                               <div class="component-header">
                                         <strong>🛡️ ${comp.tag || `Breaker ${componentNumber}`}${comp.description ? ` - ${comp.description}` : ''}</strong>
                                         <div class="component-actions">
                                                     <button class="btn btn-warning btn-edit" data-id="${comp.id}">✏️ Edit</button>
                                                     <button class="btn btn-danger btn-delete" data-id="${comp.id}">🗑️ Delete</button>
                                         </div>
                              </div>
                              <div class="component-details">
                                         <div><strong>From:</strong> ${comp.fromBusName || comp.fromBus}</div>
                                         <div><strong>To:</strong> ${comp.toBusName || comp.toBus}</div>
                                         <div><strong>Class:</strong> ${comp.breakerClass || 'N/A'}</div>
                                         <div><strong>Continuous:</strong> ${comp.continuousAmpRating || 0} A</div>
                                         <div><strong>Interrupting Sym:</strong> ${comp.interruptingRatingSymKA || 0} kA</div>
                                       <div><strong>Momentary:</strong> ${comp.momentaryRatingKA || 0} kA</div>
                           </div>
              </div>
             `;
             } else if (comp.type === 'fuse') {
                        html += `
             <div class="component-item">
                         <div class="component-header">
                                   <strong>🧯 ${comp.tag || `Fuse ${componentNumber}`}${comp.description ? ` - ${comp.description}` : ''}</strong>
                                   <div class="component-actions">
                                              <button class="btn btn-warning btn-edit" data-id="${comp.id}">✏️ Edit</button>
                                              <button class="btn btn-danger btn-delete" data-id="${comp.id}">🗑️ Delete</button>
                                   </div>
                        </div>
                        <div class="component-details">
                     <div><strong>From:</strong> ${comp.fromBusName || comp.fromBus}</div>
                     <div><strong>To:</strong> ${comp.toBusName || comp.toBus}</div>
                     <div><strong>Class:</strong> ${comp.fuseClass || 'N/A'}</div>
                     <div><strong>Speed Class:</strong> ${comp.speedClass || 'N/A'}</div>
                     <div><strong>Ampere Rating:</strong> ${comp.ampereRating || 0} A</div>
                     <div><strong>Interrupting:</strong> ${comp.interruptingRatingKA || 0} kA</div>
                  </div>
        </div>
        `;        
        }
        
        // ═══════════════════════════════════════════════════════════════
        // MOTOR COMPONENT (WITH TYPE INFO AND AUTO-TAG)
        // ═══════════════════════════════════════════════════════════════
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
                        <button class="btn btn-secondary btn-small btn-edit" data-id="${comp.id}" title="Edit motor">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger btn-small btn-delete" data-id="${comp.id}" title="Delete motor">
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
        
        // ═══════════════════════════════════════════════════════════════
        // BUS TIE COMPONENT (WITH STATE INDICATOR + DETAILS + EDIT)
        // ═══════════════════════════════════════════════════════════════
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
                            class="btn btn-info btn-small btn-details" 
                            data-id="${comp.id}"
                            data-type="bus-tie"
                            title="View bus tie details">
                            📋 Details
                        </button>
                        <button 
                            class="btn btn-secondary btn-small btn-edit" 
                            data-id="${comp.id}"
                            title="Edit bus tie">
                            ✏️ Edit
                        </button>
                        <button 
                            class="btn btn-small btn-toggle-tie" 
                            data-id="${comp.id}"
                            style="background: ${stateColor}; color: white; margin-right: 5px;"
                            title="Toggle operating state">
                            ${stateIcon} ${stateText}
                        </button>
                        <button class="btn btn-danger btn-small btn-delete" data-id="${comp.id}" title="Delete bus tie">
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
    
    // ════════════════════════════════════════════════════════════════
    // REMOVE OLD LISTENER AND SET NEW HTML
    // ════════════════════════════════════════════════════════════════
    
    // Clone container to remove all old event listeners
    const newContainer = container.cloneNode(false);
    container.parentNode.replaceChild(newContainer, container);
    
    // Set the HTML
    newContainer.innerHTML = html;
    
    // ════════════════════════════════════════════════════════════════
    // EVENT DELEGATION - Single listener for all buttons
    // ════════════════════════════════════════════════════════════════
    newContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
    
        const id = btn.dataset.id;  // ✅ Keep as string - don't parse! 
        if (!id) return;
    
        // Debug logging
        console.log(`Button clicked: ${btn.className}, ID: ${id} (type: ${typeof id})`);
        console.log(`Looking for component with ID ${id} in array of ${components.length} components`);
    
        if (btn.classList.contains('btn-details')) {
            const type = btn.dataset.type || null;
            viewComponentDetails(id, type);
        } else if (btn.classList.contains('btn-edit')) {
            editComponent(id);
        } else if (btn.classList.contains('btn-delete')) {
            deleteComponent(id);
        } else if (btn.classList.contains('btn-toggle-tie')) {
            toggleBusTieState(id);
        }
    });
    
    console.log(`📊 Displayed ${arrangedComponents.length} component(s) in parent-child bus order`);
}

/**
 * Generic entry point for viewing component details.
 * Routes to type-specific detail modals.
 */
function viewComponentDetails(componentId, explicitType) {
           const comp = components.find(c => String(c.id) === String(componentId));
           if (!comp) {
                   alert('❌ Component not found!');
                   console.error(`Component not found in viewComponentDetails. ID: ${componentId}`);
                   return;
           }

           const type = explicitType || comp.type;

           if (type === 'cable') {
                   viewCableDetails(componentId);
                   return;
           }

           if (type === 'bus-tie') {
                   viewBusTieDetails(componentId);
                   return;
           }

           // For other types, you can add dedicated viewers later.
           alert(
                      `Details viewer for "${type}" components is not implemented yet.\n\n` +
                      `Tag/Name: ${comp.tag || comp.name || 'N/A'}\n` +
                      `From: ${comp.fromBusName || comp.fromBus}\n` +
                      `To: ${comp.toBusName || comp.toBus}`
           );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW CABLE DETAILS MODAL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * View detailed cable information in modal
 * FIXED: 2025-12-02 - Handle both numeric and string IDs
 */
function viewCableDetails(compId) {
    // Compare as strings to handle both numeric and string IDs
    const cable = components.find(c => String(c.id) === String(compId));
    
    if (!cable || cable.type !== 'cable') {
        alert('❌ Cable not found!');
        console.error(`Cable not found.  Searching for ID: ${compId} (${typeof compId})`);
        return;
    }
    
    // Build modal HTML with proper escaping
    const cableId = cable.id;
    const cableTag = cable.tag || 'N/A';
    const cableDesc = cable.description || '<em style="color: #999;">Not specified</em>';
    const cableFromBus = cable.fromBusName || cable.fromBus;
    const cableToBus = cable.toBusName || cable.toBus;
    const cableSize = cable.size;
    const cableMaterial = cable.material.toUpperCase();
    const cableLength = cable.length;
    const cableParallel = cable.parallel;
    const cableConduit = cable.conduit;
    
    let modalHTML = '<div class="modal-overlay" id="cableDetailsModal" onclick="closeCableDetailsModal(event)">';
    modalHTML += '<div class="modal-content large" onclick="event.stopPropagation()" style="max-width: 900px;">';
    modalHTML += '<div class="modal-header">';
    modalHTML += '<h2>📋 Cable Details: ' + cableTag + '</h2>';
    modalHTML += '<span class="close-modal" onclick="closeCableDetailsModal()">&times;</span>';
    modalHTML += '</div>';
    modalHTML += '<div class="modal-body" style="max-height: 600px; overflow-y: auto;">';
    
    // Cable Details Grid
    modalHTML += '<div class="cable-details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">';
    
    // Identification Section
    modalHTML += '<div class="detail-section" style="background: #f8f9fa; padding: 15px; border-radius: 8px;">';
    modalHTML += '<h3 style="color: #667eea; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">🏷️ Identification</h3>';
    modalHTML += '<table class="detail-table" style="width: 100%; border-collapse: collapse;">';
    modalHTML += '<tr><td style="padding: 8px; font-weight: 600; width: 140px;">Equipment Tag:</td>';
    modalHTML += '<td style="padding: 8px; font-family: \'Courier New\', monospace; background: #fff; border-radius: 4px;">' + cableTag + '</td></tr>';
    modalHTML += '<tr><td style="padding: 8px; font-weight: 600;">Description:</td>';
    modalHTML += '<td style="padding: 8px;">' + cableDesc + '</td></tr>';
    modalHTML += '<tr><td style="padding: 8px; font-weight: 600;">From Bus:</td>';
    modalHTML += '<td style="padding: 8px; color: #667eea; font-weight: 600;">' + cableFromBus + '</td></tr>';
    modalHTML += '<tr><td style="padding: 8px; font-weight: 600;">To Bus:</td>';
    modalHTML += '<td style="padding: 8px; color: #667eea; font-weight: 600;">' + cableToBus + '</td></tr>';
    modalHTML += '</table></div>';
    
    // Electrical Specifications Section
    modalHTML += '<div class="detail-section" style="background: #f8f9fa; padding: 15px; border-radius: 8px;">';
    modalHTML += '<h3 style="color: #667eea; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">📐 Electrical Specifications</h3>';
    modalHTML += '<table class="detail-table" style="width: 100%; border-collapse: collapse;">';
    modalHTML += '<tr><td style="padding: 8px; font-weight: 600; width: 140px;">Conductor Size:</td>';
    modalHTML += '<td style="padding: 8px; font-family: \'Courier New\', monospace;">' + cableSize + ' ' + cableMaterial + '</td></tr>';
    modalHTML += '<tr><td style="padding: 8px; font-weight: 600;">Length:</td>';
    modalHTML += '<td style="padding: 8px;">' + cableLength + ' ft</td></tr>';
    modalHTML += '<tr><td style="padding: 8px; font-weight: 600;">Parallel Runs:</td>';
    modalHTML += '<td style="padding: 8px;">' + cableParallel;
    if (cableParallel > 1) {
        modalHTML += ' <span style="color: #ff9800; font-weight: 600;">(Parallel)</span>';
    }
    modalHTML += '</td></tr>';
    modalHTML += '<tr><td style="padding: 8px; font-weight: 600;">Conduit Type:</td>';
    modalHTML += '<td style="padding: 8px;">' + cableConduit + '</td></tr>';
    
    if (cable.insulation) {
        modalHTML += '<tr><td style="padding: 8px; font-weight: 600;">Insulation:</td>';
        modalHTML += '<td style="padding: 8px;">' + cable.insulation + '</td></tr>';
    }
    if (cable.voltageRating) {
        modalHTML += '<tr><td style="padding: 8px; font-weight: 600;">Voltage Rating:</td>';
        modalHTML += '<td style="padding: 8px;">' + cable.voltageRating + '</td></tr>';
    }
    modalHTML += '</table></div>';
    modalHTML += '</div>'; // Close cable-details-grid
    
    // Manufacturer Information
    if (cable.manufacturer || cable.catalogNumber || cable.installationDate) {
        modalHTML += '<div class="detail-section" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">';
        modalHTML += '<h3 style="color: #667eea; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 8px;">🏭 Manufacturer Information</h3>';
        modalHTML += '<table class="detail-table" style="width: 100%; border-collapse: collapse;">';
        
        if (cable.manufacturer) {
            modalHTML += '<tr><td style="padding: 8px; font-weight: 600; width: 200px;">Manufacturer:</td>';
            modalHTML += '<td style="padding: 8px;">' + cable.manufacturer + '</td></tr>';
        }
        if (cable.catalogNumber) {
            modalHTML += '<tr><td style="padding: 8px; font-weight: 600;">Catalog/Part Number:</td>';
            modalHTML += '<td style="padding: 8px; font-family: \'Courier New\', monospace;">' + cable.catalogNumber + '</td></tr>';
        }
        if (cable.installationDate) {
            const dateStr = new Date(cable.installationDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            modalHTML += '<tr><td style="padding: 8px; font-weight: 600;">Installation Date:</td>';
            modalHTML += '<td style="padding: 8px;">' + dateStr + '</td></tr>';
        }
        
        modalHTML += '</table></div>';
    }
    
    // Notes
    if (cable.notes) {
        modalHTML += '<div class="detail-section" style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">';
        modalHTML += '<h3 style="color: #856404; margin-bottom: 10px;">📝 Notes</h3>';
        modalHTML += '<div style="white-space: pre-wrap; line-height: 1.6; color: #333;">' + cable.notes + '</div>';
        modalHTML += '</div>';
    }
    
    modalHTML += '</div>'; // Close modal-body
    
    // Modal Footer - THIS IS THE CRITICAL PART
    modalHTML += '<div class="modal-footer">';
    modalHTML += '<button class="btn btn-secondary" onclick="closeCableDetailsModal()">Close</button>';
    modalHTML += '<button class="btn btn-primary" onclick="editComponent(\'' + String(cableId) + '\'); closeCableDetailsModal()">✏️ Edit Cable</button>';
    modalHTML += '</div>';
    
    modalHTML += '</div>'; // Close modal-content
    modalHTML += '</div>'; // Close modal-overlay
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * View detailed bus tie information in modal
 */
function viewBusTieDetails(componentId) {
    const tie = components.find(c => String(c.id) === String(componentId));

    if (!tie || tie.type !== 'bus-tie') {
        alert('❌ Bus tie not found!');
        console.error(`Bus tie not found in viewBusTieDetails. ID: ${componentId}`);
        return;
    }

    const tag = tie.tag || 'N/A';
    const fromBus = tie.fromBusName || tie.fromBus;
    const toBus = tie.toBusName || tie.toBus;
    const voltage = tie.voltage || 'N/A';
    const rating = tie.rating || 'N/A';
    const breakerType = tie.breakerType || 'N/A';
    const length = tie.length || 'N/A';
    const size = tie.size || 'N/A';
    const normalState = (tie.normalState || 'open').toUpperCase();
    const currentState = (tie.currentState || tie.normalState || 'open').toUpperCase();
    const interlock = (tie.interlock || 'no').toUpperCase();
    const impedance = (tie.impedance != null ? tie.impedance : BUS_TIE_CONFIG.DEFAULT_IMPEDANCE).toFixed(6);
    const description = tie.description || '<em style="color:#999;">Not specified</em>';

    let modalHTML = '<div class="modal-overlay" id="busTieDetailsModal" onclick="closeBusTieDetailsModal(event)">';
    modalHTML += '<div class="modal-content large" onclick="event.stopPropagation()" style="max-width: 900px;">';
    modalHTML += '<div class="modal-header">';
    modalHTML += '<h2>🔌 Bus Tie Details: ' + tag + '</h2>';
    modalHTML += '<span class="close-modal" onclick="closeBusTieDetailsModal()">&times;</span>';
    modalHTML += '</div>';
    modalHTML += '<div class="modal-body" style="max-height: 600px; overflow-y: auto;">';

    // Top grid: Identification + Electrical
    modalHTML += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">';

    // Identification
    modalHTML += '<div class="detail-section" style="background:#f8f9fa;padding:15px;border-radius:8px;">';
    modalHTML += '<h3 style="color:#667eea;margin-bottom:15px;border-bottom:2px solid #667eea;padding-bottom:8px;">🏷️ Identification</h3>';
    modalHTML += '<table style="width:100%;border-collapse:collapse;">';
    modalHTML += '<tr><td style="padding:8px;font-weight:600;width:150px;">Tag:</td>';
    modalHTML += '<td style="padding:8px;font-family:\'Courier New\',monospace;background:#fff;border-radius:4px;">' + tag + '</td></tr>';
    modalHTML += '<tr><td style="padding:8px;font-weight:600;">Description:</td>';
    modalHTML += '<td style="padding:8px;">' + description + '</td></tr>';
    modalHTML += '<tr><td style="padding:8px;font-weight:600;">From Bus:</td>';
    modalHTML += '<td style="padding:8px;color:#667eea;font-weight:600;">' + fromBus + '</td></tr>';
    modalHTML += '<tr><td style="padding:8px;font-weight:600;">To Bus:</td>';
    modalHTML += '<td style="padding:8px;color:#667eea;font-weight:600;">' + toBus + '</td></tr>';
    modalHTML += '</table></div>';

    // Electrical
    modalHTML += '<div class="detail-section" style="background:#f8f9fa;padding:15px;border-radius:8px;">';
    modalHTML += '<h3 style="color:#667eea;margin-bottom:15px;border-bottom:2px solid #667eea;padding-bottom:8px;">⚡ Electrical Data</h3>';
    modalHTML += '<table style="width:100%;border-collapse:collapse;">';
    modalHTML += '<tr><td style="padding:8px;font-weight:600;width:150px;">Voltage Level:</td>';
    modalHTML += '<td style="padding:8px;">' + voltage + ' V</td></tr>';
    modalHTML += '<tr><td style="padding:8px;font-weight:600;">Breaker Rating:</td>';
    modalHTML += '<td style="padding:8px;">' + rating + ' A</td></tr>';
    modalHTML += '<tr><td style="padding:8px;font-weight:600;">Breaker Type:</td>';
    modalHTML += '<td style="padding:8px;">' + breakerType + '</td></tr>';
    modalHTML += '<tr><td style="padding:8px;font-weight:600;">Bus Length:</td>';
    modalHTML += '<td style="padding:8px;">' + length + ' ft</td></tr>';
    modalHTML += '<tr><td style="padding:8px;font-weight:600;">Conductor Size:</td>';
    modalHTML += '<td style="padding:8px;">' + size + ' kcmil</td></tr>';
    modalHTML += '<tr><td style="padding:8px;font-weight:600;">Impedance (Z):</td>';
    modalHTML += '<td style="padding:8px;">' + impedance + ' Ω</td></tr>';
    modalHTML += '</table></div>';

    modalHTML += '</div>'; // end grid

    // Operating configuration
    modalHTML += '<div class="detail-section" style="background:#e8f5e9;padding:15px;border-radius:8px;margin-bottom:20px;">';
    modalHTML += '<h3 style="color:#388e3c;margin-bottom:10px;">⚙️ Operating Configuration</h3>';
    modalHTML += '<table style="width:100%;border-collapse:collapse;">';
    modalHTML += '<tr><td style="padding:8px;font-weight:600;width:170px;">Normal State:</td>';
    modalHTML += '<td style="padding:8px;">' + normalState + '</td></tr>';
    modalHTML += '<tr><td style="padding:8px;font-weight:600;">Current State:</td>';
    modalHTML += '<td style="padding:8px;">' + currentState + '</td></tr>';
    modalHTML += '<tr><td style="padding:8px;font-weight:600;">Source Interlock:</td>';
    modalHTML += '<td style="padding:8px;">' + interlock + '</td></tr>';
    modalHTML += '</table>';
    modalHTML += '<p style="margin-top:8px;font-size:0.9em;color:#555;">';
    modalHTML += 'Per IEEE 141, bus ties normally operate OPEN for fault isolation. Closing the tie increases fault current and arc flash hazard.';
    modalHTML += '</p>';
    modalHTML += '</div>';

    modalHTML += '</div>'; // modal-body

    // Footer with edit shortcut
    modalHTML += '<div class="modal-footer">';
    modalHTML += '<button class="btn btn-secondary" onclick="closeBusTieDetailsModal()">Close</button>';
    modalHTML += '<button class="btn btn-primary" onclick="editComponent(\'' + String(tie.id) + '\'); closeBusTieDetailsModal()">✏️ Edit Bus Tie</button>';
    modalHTML += '</div>';

    modalHTML += '</div>'; // modal-content
    modalHTML += '</div>'; // modal-overlay

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Close bus tie details modal
 */
function closeBusTieDetailsModal(event) {
    if (event && event.target && event.target.closest('.modal-content')) {
        return; // clicked inside modal
    }
    const modal = document.getElementById('busTieDetailsModal');
    if (modal) modal.remove();
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
 * FIXED: 2025-12-02 - Handle both numeric and string IDs
 */

function buildEditBusOptions(selectedBusId) {
    return buses.map(bus => {
        const selected = String(bus.id) === String(selectedBusId) ? 'selected' : '';
        return `<option value="${bus.id}" ${selected}>${bus.name} (${bus.voltage}V)</option>`;
    }).join('');
}

function generateMotorAutoTag(fromBus, hp, currentComponentId = null) {
    const fromBusTag = (fromBus.tag || fromBus.name).replace(/\s+/g, '-').toUpperCase();
    const hpFormatted = hp % 1 === 0 ? hp.toString() : hp.toFixed(1).replace('.', 'P');
    const baseTag = `M-${fromBusTag}-${hpFormatted}`;

    const existingMotorsWithSameBase = components.filter(c =>
        c.type === 'motor' &&
        c.tag &&
        c.tag.startsWith(`${baseTag}-`) &&
        String(c.id) !== String(currentComponentId)
    );

    let maxSeq = 0;
    existingMotorsWithSameBase.forEach(motor => {
        const parts = motor.tag.split('-');
        const seqNum = parseInt(parts[parts.length - 1]);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
            maxSeq = seqNum;
        }
    });

    const nextSeq = maxSeq + 1;
    return {
        tag: `${baseTag}-${nextSeq}`,
        fromBusTagFormatted: fromBusTag,
        sequenceNumber: nextSeq
    };
}

function generateBusTieAutoTag(fromBus, toBus, currentComponentId = null) {
    const bus1Tag = (fromBus.tag || fromBus.name).replace(/\s+/g, '-').toUpperCase();
    const bus2Tag = (toBus.tag || toBus.name).replace(/\s+/g, '-').toUpperCase();
    const [busA, busB] = [bus1Tag, bus2Tag].sort();

    const baseTag = `${BUS_TIE_CONFIG.AUTO_TAG_PREFIX}-${busA}-${busB}`;

    const existingTiesWithSameBase = components.filter(c =>
        c.type === 'bus-tie' &&
        c.tag &&
        c.tag.startsWith(`${baseTag}-`) &&
        String(c.id) !== String(currentComponentId)
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
    return {
        tag: `${baseTag}-${nextSeq}`,
        busA: busA,
        busB: busB,
        sequenceNumber: nextSeq
    };
}

function editComponent(id) {
    // Compare as strings to handle both numeric and string IDs
    const component = components.find(c => String(c.id) === String(id));

    if (!component) {
        alert('❌ Component not found!');
        console.error(`Component not found. Searching for ID: ${id} (${typeof id})`);
        console.error(`Available IDs:`, components.map(c => ({ id: c.id, type: typeof c.id })));
        return;
    }

    const modal = document.getElementById('editComponentModal');
    const modalBody = document.getElementById('editComponentModalBody');

    // Build editable bus selectors for all component types
    const fromBusOptions = buses.map(bus => {
        const selected = String(bus.id) === String(component.fromBus) ? 'selected' : '';
        return `<option value="${bus.id}" ${selected}>${bus.name} (${bus.voltage}V)</option>`;
    }).join('');

    const toBusOptions = buses.map(bus => {
        const selected = String(bus.id) === String(component.toBus) ? 'selected' : '';
        return `<option value="${bus.id}" ${selected}>${bus.name} (${bus.voltage}V)</option>`;
    }).join('');

    let html = `
        <input type="hidden" id="editComponentId" value="${component.id}">
        <div class="form-group">
            <label>Type:</label>
            <input type="text" id="editComponentType" value="${component.type}" disabled>
        </div>
        <div class="form-group">
            <label for="editComponentFromBus">From Bus:</label>
            <select id="editComponentFromBus">
                ${fromBusOptions}
            </select>
        </div>
        <div class="form-group">
            <label for="editComponentToBus">To Bus:</label>
            <select id="editComponentToBus">
                ${toBusOptions}
            </select>
        </div>
    `;

    if (component.type === 'cable') {
        html += `
        <div class="form-group">
            <label for="editCableTag">🏷️ Cable Tag:</label>
            <input type="text" id="editCableTag" value="${component.tag || ''}">
        </div>
        <div class="form-group">
            <label for="editCableDescription">Description:</label>
            <input type="text" id="editCableDescription" value="${component.description || ''}">
        </div>
        <div class="form-group">
            <label for="editCableSize">Size:</label>
            <select id="editCableSize">
                <option value="14 AWG" ${component.size === '14 AWG' ? 'selected' : ''}>14 AWG</option>
                <option value="12 AWG" ${component.size === '12 AWG' ? 'selected' : ''}>12 AWG</option>
                <option value="10 AWG" ${component.size === '10 AWG' ? 'selected' : ''}>10 AWG</option>
                <option value="8 AWG" ${component.size === '8 AWG' ? 'selected' : ''}>8 AWG</option>
                <option value="6 AWG" ${component.size === '6 AWG' ? 'selected' : ''}>6 AWG</option>
                <option value="4 AWG" ${component.size === '4 AWG' ? 'selected' : ''}>4 AWG</option>
                <option value="3 AWG" ${component.size === '3 AWG' ? 'selected' : ''}>3 AWG</option>
                <option value="2 AWG" ${component.size === '2 AWG' ? 'selected' : ''}>2 AWG</option>
                <option value="1 AWG" ${component.size === '1 AWG' ? 'selected' : ''}>1 AWG</option>
                <option value="1/0 AWG" ${component.size === '1/0 AWG' ? 'selected' : ''}>1/0 AWG</option>
                <option value="2/0 AWG" ${component.size === '2/0 AWG' ? 'selected' : ''}>2/0 AWG</option>
                <option value="3/0 AWG" ${component.size === '3/0 AWG' ? 'selected' : ''}>3/0 AWG</option>
                <option value="4/0 AWG" ${component.size === '4/0 AWG' ? 'selected' : ''}>4/0 AWG</option>
                <option value="250 kcmil" ${component.size === '250 kcmil' ? 'selected' : ''}>250 kcmil</option>
                <option value="300 kcmil" ${component.size === '300 kcmil' ? 'selected' : ''}>300 kcmil</option>
                <option value="350 kcmil" ${component.size === '350 kcmil' ? 'selected' : ''}>350 kcmil</option>
                <option value="400 kcmil" ${component.size === '400 kcmil' ? 'selected' : ''}>400 kcmil</option>
                <option value="500 kcmil" ${component.size === '500 kcmil' ? 'selected' : ''}>500 kcmil</option>
                <option value="600 kcmil" ${component.size === '600 kcmil' ? 'selected' : ''}>600 kcmil</option>
                <option value="750 kcmil" ${component.size === '750 kcmil' ? 'selected' : ''}>750 kcmil</option>
                <option value="1000 kcmil" ${component.size === '1000 kcmil' ? 'selected' : ''}>1000 kcmil</option>
            </select>
        </div>
        <div class="form-group">
            <label for="editCableMaterial">Material:</label>
            <select id="editCableMaterial">
                <option value="copper" ${component.material === 'copper' ? 'selected' : ''}>Copper</option>
                <option value="aluminum" ${component.material === 'aluminum' ? 'selected' : ''}>Aluminum</option>
            </select>
        </div>
        <div class="form-group">
            <label for="editCableLength">Length (ft):</label>
            <input type="number" id="editCableLength" value="${component.length || ''}" min="0" step="0.1">
        </div>
        <div class="form-group">
            <label for="editCableConduit">Conduit:</label>
            <select id="editCableConduit">
                <option value="PVC" ${component.conduit === 'PVC' ? 'selected' : ''}>PVC</option>
                <option value="Steel/EMT" ${component.conduit === 'Steel/EMT' ? 'selected' : ''}>Steel/EMT</option>
                <option value="Aluminum" ${component.conduit === 'Aluminum' ? 'selected' : ''}>Aluminum</option>
                <option value="Non-Metallic" ${component.conduit === 'Non-Metallic' ? 'selected' : ''}>Non-Metallic</option>
            </select>
        </div>
        <div class="form-group">
            <label for="editCableParallel">Parallel Runs:</label>
            <input type="number" id="editCableParallel" value="${component.parallel || 1}" min="1" step="1">
        </div>
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
                <option value="" ${!component.insulation ? 'selected' : ''}>Not specified</option>
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
                <option value="" ${!component.voltageRating ? 'selected' : ''}>Not specified</option>
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
            <textarea id="editCableNotes">${component.notes || ''}</textarea>
        </div>
        `;
    } else if (component.type === 'transformer') {
        html += `
        <div class="form-group">
            <label for="editTransformerRating">Rating (kVA):</label>
            <input type="number" id="editTransformerRating" value="${component.rating || ''}" min="0" step="0.1">
        </div>
        <div class="form-group">
            <label for="editTransformerPrimary">Primary Voltage (V):</label>
            <input type="number" id="editTransformerPrimary" value="${component.primary || ''}" min="0" step="0.1">
        </div>
        <div class="form-group">
            <label for="editTransformerSecondary">Secondary Voltage (V):</label>
            <input type="number" id="editTransformerSecondary" value="${component.secondary || ''}" min="0" step="0.1">
        </div>
        <div class="form-group">
            <label for="editTransformerImpedance">Impedance (%):</label>
            <input type="number" id="editTransformerImpedance" value="${component.impedance || ''}" min="0" step="0.01">
        </div>
        <div class="form-group">
            <label for="editTransformerXR">X/R Ratio:</label>
            <input type="number" id="editTransformerXR" value="${component.xr || ''}" min="0" step="0.1">
        </div>
        <div class="form-group">
            <label for="editTransformerTapSetting">Tap Setting (%):</label>
            <select id="editTransformerTapSetting">
                <option value="-5" ${component.tapSetting == -5 ? 'selected' : ''}>-5.0%</option>
                <option value="-2.5" ${component.tapSetting == -2.5 ? 'selected' : ''}>-2.5%</option>
                <option value="0" ${component.tapSetting == 0 ? 'selected' : ''}>0% (Nominal)</option>
                <option value="2.5" ${component.tapSetting == 2.5 ? 'selected' : ''}>+2.5%</option>
                <option value="5" ${component.tapSetting == 5 ? 'selected' : ''}>+5.0%</option>
            </select>
        </div>
        `;
    } else if (component.type === 'generator') {
        html += `
        <div class="form-group">
            <label for="editGeneratorRating">Rating (kVA):</label>
            <input type="number" id="editGeneratorRating" value="${component.rating || ''}" min="0" step="0.1">
        </div>
        <div class="form-group">
            <label for="editGeneratorVoltage">Voltage (V):</label>
            <input type="number" id="editGeneratorVoltage" value="${component.voltage || ''}" min="0" step="0.1">
        </div>
        <div class="form-group">
            <label for="editGeneratorSubtransient">Subtransient X"d (%):</label>
            <input type="number" id="editGeneratorSubtransient" value="${component.subtransient || ''}" min="0" step="0.1">
        </div>
        `;
    } else if (component.type === 'breaker') {
        html += `
        <div class="form-group">
            <label for="editBreakerTag">Breaker Tag:</label>
            <input type="text" id="editBreakerTag" value="${component.tag || ''}">
        </div>
        <div class="form-group">
            <label for="editBreakerDescription">Description:</label>
            <input type="text" id="editBreakerDescription" value="${component.description || ''}">
        </div>
        <div class="form-group">
            <label for="editBreakerClass">Breaker Class:</label>
            <select id="editBreakerClass">
                <option value="MCCB" ${component.breakerClass === 'MCCB' ? 'selected' : ''}>MCCB</option>
                <option value="ACB" ${component.breakerClass === 'ACB' ? 'selected' : ''}>ACB</option>
                <option value="VCB" ${component.breakerClass === 'VCB' ? 'selected' : ''}>VCB</option>
                <option value="SF6" ${component.breakerClass === 'SF6' ? 'selected' : ''}>SF6</option>
                <option value="GIS" ${component.breakerClass === 'GIS' ? 'selected' : ''}>GIS</option>
                <option value="RECLOSER" ${component.breakerClass === 'RECLOSER' ? 'selected' : ''}>RECLOSER</option>
            </select>
        </div>
        <div class="form-group">
            <label for="editBreakerTripUnitType">Trip Unit Type:</label>
            <select id="editBreakerTripUnitType">
                <option value="electronic" ${component.tripUnitType === 'electronic' ? 'selected' : ''}>Electronic</option>
                <option value="thermal-magnetic" ${component.tripUnitType === 'thermal-magnetic' ? 'selected' : ''}>Thermal-Magnetic</option>
                <option value="relay-controlled" ${component.tripUnitType === 'relay-controlled' ? 'selected' : ''}>Relay-Controlled</option>
                <option value="fixed" ${component.tripUnitType === 'fixed' ? 'selected' : ''}>Fixed</option>
            </select>
        </div>
        <div class="form-group">
            <label for="editBreakerContinuousA">Continuous Amp Rating (A):</label>
            <input type="number" id="editBreakerContinuousA" value="${component.continuousAmpRating || ''}" min="0" step="0.1">
        </div>
        <div class="form-group">
            <label for="editBreakerInterruptingSymKA">Interrupting Symmetrical Rating (kA):</label>
            <input type="number" id="editBreakerInterruptingSymKA" value="${component.interruptingRatingSymKA || ''}" min="0" step="0.1">
        </div>
        <div class="form-group">
            <label for="editBreakerInterruptingAsymKA">Interrupting Asymmetrical Rating (kA):</label>
            <input type="number" id="editBreakerInterruptingAsymKA" value="${component.interruptingRatingAsymKA || ''}" min="0" step="0.1">
        </div>
        <div class="form-group">
            <label for="editBreakerMomentaryKA">Momentary Rating (kA):</label>
            <input type="number" id="editBreakerMomentaryKA" value="${component.momentaryRatingKA || ''}" min="0" step="0.1">
        </div>
        <div class="form-group">
            <label for="editBreakerCloseLatchKA">Close-Latch Rating (kA):</label>
            <input type="number" id="editBreakerCloseLatchKA" value="${component.closeLatchRatingKA || ''}" min="0" step="0.1">
        </div>
        `;
    } else if (component.type === 'fuse') {
        html += `
        <div class="form-group">
            <label for="editFuseTag">Fuse Tag:</label>
            <input type="text" id="editFuseTag" value="${component.tag || ''}">
        </div>
        <div class="form-group">
            <label for="editFuseDescription">Description:</label>
            <input type="text" id="editFuseDescription" value="${component.description || ''}">
        </div>
        <div class="form-group">
            <label for="editFuseClass">Fuse Class:</label>
            <select id="editFuseClass">
                <option value="HRC" ${component.fuseClass === 'HRC' ? 'selected' : ''}>HRC</option>
                <option value="CURRENT_LIMITING" ${component.fuseClass === 'CURRENT_LIMITING' ? 'selected' : ''}>Current Limiting</option>
                <option value="EXPULSION" ${component.fuseClass === 'EXPULSION' ? 'selected' : ''}>Expulsion</option>
                <option value="POWER_FUSE" ${component.fuseClass === 'POWER_FUSE' ? 'selected' : ''}>Power Fuse</option>
                <option value="BRANCH_FUSE" ${component.fuseClass === 'BRANCH_FUSE' ? 'selected' : ''}>Branch Fuse</option>
            </select>
        </div>
        <div class="form-group">
            <label for="editFuseSpeedClass">Speed Class:</label>
            <input type="text" id="editFuseSpeedClass" value="${component.speedClass || ''}">
        </div>
        <div class="form-group">
            <label for="editFuseAmpereRating">Ampere Rating (A):</label>
            <input type="number" id="editFuseAmpereRating" value="${component.ampereRating || ''}" min="0" step="0.1">
        </div>
        <div class="form-group">
            <label for="editFuseInterruptingKA">Interrupting Rating (kA):</label>
            <input type="number" id="editFuseInterruptingKA" value="${component.interruptingRatingKA || ''}" min="0" step="0.1">
        </div>
        `;
    } else if (component.type === 'motor') {
        // ═══════════════════════════════════════════════════════════════════
        // FEATURE #1: MOTOR EDIT WITH TYPE
        // ═══════════════════════════════════════════════════════════════════
        html += `
        <div class="form-group">
            <label for="editMotorHP">Motor Horsepower (HP):</label>
            <input type="number" id="editMotorHP" value="${component.hp || ''}" min="0" step="0.1">
        </div>
        <div class="form-group">
            <label for="editMotorType">Motor Type:</label>
            <select id="editMotorType">
                <option value="induction" ${component.motorType === 'induction' ? 'selected' : ''}>Induction Motor (Standard)</option>
                <option value="synchronous" ${component.motorType === 'synchronous' ? 'selected' : ''}>Synchronous Motor</option>
                <option value="wound_rotor" ${component.motorType === 'wound_rotor' ? 'selected' : ''}>Wound Rotor Motor</option>
            </select>
        </div>
        <div class="form-group">
            <label for="editMotorEfficiency">Motor Efficiency (0.0 - 1.0):</label>
            <input type="number" id="editMotorEfficiency" value="${component.efficiency || 0.90}" min="0.5" max="1.0" step="0.01">
        </div>
        <div class="form-group">
            <label for="editMotorPowerFactor">Motor Power Factor (0.0 - 1.0):</label>
            <input type="number" id="editMotorPowerFactor" value="${component.powerFactor || 0.85}" min="0.5" max="1.0" step="0.01">
        </div>
        <div class="form-group">
            <label for="editMotorName">Motor Name/Tag:</label>
            <input type="text" id="editMotorName" value="${component.name || ''}">
        </div>
        `;
    } else if (component.type === 'bus-tie') {
        // BUS TIE EDIT FORM
        html += `
        <div class="form-group">
            <label for="editBusTieTag">Equipment Tag:</label>
            <input type="text" id="editBusTieTag" value="${component.tag || ''}">
            <div class="small-muted">If the tag remains auto-generated, it will update when connected buses change. If you edit the tag manually, it will be preserved.</div>
        </div>
        <div class="form-group">
            <label for="editBusTieDescription">Description:</label>
            <input type="text" id="editBusTieDescription" value="${component.description || ''}">
        </div>
        <div class="form-group">
            <label for="editBusTieRating">Rating (A):</label>
            <input type="number" id="editBusTieRating" value="${component.rating || ''}" min="0" step="0.1">
        </div>
        <div class="form-group">
            <label for="editBusTieBreakerType">Breaker Type:</label>
            <select id="editBusTieBreakerType">
                <option value="ACB" ${component.breakerType === 'ACB' ? 'selected' : ''}>ACB - Air Circuit Breaker</option>
                <option value="MCCB" ${component.breakerType === 'MCCB' ? 'selected' : ''}>MCCB - Molded Case Circuit Breaker</option>
                <option value="VCB" ${component.breakerType === 'VCB' ? 'selected' : ''}>VCB - Vacuum Circuit Breaker</option>
                <option value="OCB" ${component.breakerType === 'OCB' ? 'selected' : ''}>OCB - Oil Circuit Breaker</option>
            </select>
        </div>
        <div class="form-group">
            <label for="editBusTieLength">Bus Length (ft):</label>
            <input type="number" id="editBusTieLength" value="${component.length || ''}" min="0" step="0.1">
        </div>
        <div class="form-group">
            <label for="editBusTieSize">Conductor Size (kcmil):</label>
            <select id="editBusTieSize">
                <option value="250" ${component.size == 250 ? 'selected' : ''}>250 kcmil</option>
                <option value="300" ${component.size == 300 ? 'selected' : ''}>300 kcmil</option>
                <option value="350" ${component.size == 350 ? 'selected' : ''}>350 kcmil</option>
                <option value="400" ${component.size == 400 ? 'selected' : ''}>400 kcmil</option>
                <option value="500" ${component.size == 500 ? 'selected' : ''}>500 kcmil</option>
                <option value="600" ${component.size == 600 ? 'selected' : ''}>600 kcmil</option>
                <option value="750" ${component.size == 750 ? 'selected' : ''}>750 kcmil</option>
                <option value="1000" ${component.size == 1000 ? 'selected' : ''}>1000 kcmil</option>
                <option value="1250" ${component.size == 1250 ? 'selected' : ''}>1250 kcmil</option>
                <option value="1500" ${component.size == 1500 ? 'selected' : ''}>1500 kcmil</option>
                <option value="2000" ${component.size == 2000 ? 'selected' : ''}>2000 kcmil</option>
            </select>
        </div>
        <div class="form-group">
            <label for="editBusTieNormalState">Normal Operating State:</label>
            <select id="editBusTieNormalState">
                <option value="open" ${component.normalState === 'open' ? 'selected' : ''}>OPEN (Isolated)</option>
                <option value="closed" ${component.normalState === 'closed' ? 'selected' : ''}>CLOSED (Paralleled)</option>
            </select>
        </div>
        <div class="form-group">
            <label for="editBusTieInterlock">Source Interlock:</label>
            <select id="editBusTieInterlock">
                <option value="yes" ${component.interlock === 'yes' ? 'selected' : ''}>Yes - Interlocked (Recommended)</option>
                <option value="no" ${component.interlock === 'no' ? 'selected' : ''}>No - Not interlocked</option>
            </select>
        </div>
        `;
    }

    modalBody.innerHTML = html;
    modal.style.display = 'block';
}


/**
 * Save component edits
 * FIXED: 2025-12-02 - Handle both numeric and string IDs
 */
function saveComponentEdits() {
    const id = document.getElementById('editComponentId').value;

    // Compare as strings to handle both numeric and string IDs
    const component = components.find(c => String(c.id) === String(id));

    if (! component) {
        alert('❌ Component not found!');
        console.error(`Component not found during save. ID: ${id}`);
        return;
    }

    const oldFromBusId = component.fromBus;
    const oldToBusId = component.toBus;
    const busesChanged =
               String(oldFromBusId) !== String(document.getElementById('editComponentFromBus')?.value) ||
          String(oldToBusId) !== String(document.getElementById('editComponentToBus')?.value);

    // ═══════════════════════════════════════════════════════════════════
    // COMMON CONNECTION UPDATE FOR ALL COMPONENT TYPES
    // Allows user to change parent/child bus relationship (from/to)
    // Tags are intentionally preserved and NOT auto-regenerated
    // ═══════════════════════════════════════════════════════════════════
    const newFromBusId = document.getElementById('editComponentFromBus')?.value;
    const newToBusId = document.getElementById('editComponentToBus')?.value;

    if (!newFromBusId || !newToBusId) {
        alert('❌ Please select both From Bus and To Bus.');
        return;
    }

    if (String(newFromBusId) === String(newToBusId)) {
        alert('❌ From Bus and To Bus cannot be the same.');
        return;
    }

    const newFromBus = buses.find(b => String(b.id) === String(newFromBusId));
    const newToBus = buses.find(b => String(b.id) === String(newToBusId));

    if (!newFromBus || !newToBus) {
        alert('❌ Invalid bus selection while saving component edits.');
        return;
    }

    // Bus-tie specific validation: must remain same-voltage and unique pair
    if (component.type === 'bus-tie') {
        if (Number(newFromBus.voltage) !== Number(newToBus.voltage)) {
            alert(
                `❌ VOLTAGE MISMATCH ERROR!\n\n` +
                `Bus ties can only connect buses at the same voltage level.\n\n` +
                `From Bus: ${newFromBus.name} (${newFromBus.voltage}V)\n` +
                `To Bus: ${newToBus.name} (${newToBus.voltage}V)`
            );
            return;
        }

        const duplicateTie = components.find(c =>
            c.type === 'bus-tie' &&
            String(c.id) !== String(component.id) &&
            (
                (String(c.fromBus) === String(newFromBusId) && String(c.toBus) === String(newToBusId)) ||
                (String(c.fromBus) === String(newToBusId) && String(c.toBus) === String(newFromBusId))
            )
        );

        if (duplicateTie) {
            alert(
                `❌ DUPLICATE BUS TIE ERROR!\n\n` +
                `Another bus tie already exists between these buses:\n` +
                ` ${duplicateTie.fromBusName} ↔ ${duplicateTie.toBusName}\n` +
                ` Tag: ${duplicateTie.tag}`
            );
            return;
        }
    }

    // Apply updated connection to all component types
    component.fromBus = newFromBusId;
    component.toBus = newToBusId;
    component.fromBusName = newFromBus.name;
    component.toBusName = newToBus.name;

    // Keep related display metadata in sync where applicable
    if (component.type === 'motor') {
        component.location = newToBus.name;
    }

    if (component.type === 'breaker' || component.type === 'fuse' || component.type === 'bus-tie') {
        component.voltage = newFromBus.voltage;
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
        component.tapSetting = parseFloat(document.getElementById('editTransformerTapSetting')?.value) || 0;

        // ✅ NEW
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

    } else if (component.type === 'breaker') {
        const newTag = document.getElementById('editBreakerTag')?.value.trim();

        if (!newTag) {
            alert('❌ Breaker tag is required!');
            return;
        }

        const existingBreaker = components.find(c =>
            c.type === 'breaker' &&
            c.tag === newTag &&
            String(c.id) !== String(id)
        );

        if (existingBreaker) {
            alert(
                `❌ ERROR: Breaker tag "${newTag}" is already used by another breaker!\n\n` +
                `Breaker tags must be unique for proper tracking and reporting.`
            );
            document.getElementById('editBreakerTag')?.focus();
            document.getElementById('editBreakerTag')?.select();
            return;
        }

        component.tag = newTag;
        component.description = document.getElementById('editBreakerDescription')?.value.trim() || '';
        component.breakerClass = document.getElementById('editBreakerClass')?.value || 'MCCB';
        component.tripUnitType = document.getElementById('editBreakerTripUnitType')?.value || 'electronic';
        component.continuousAmpRating = parseFloat(document.getElementById('editBreakerContinuousA')?.value) || 0;
        component.interruptingRatingSymKA = parseFloat(document.getElementById('editBreakerInterruptingSymKA')?.value) || 0;
        component.interruptingRatingAsymKA = parseFloat(document.getElementById('editBreakerInterruptingAsymKA')?.value) || 0;
        component.momentaryRatingKA = parseFloat(document.getElementById('editBreakerMomentaryKA')?.value) || 0;
        component.closeLatchRatingKA = parseFloat(document.getElementById('editBreakerCloseLatchKA')?.value) || 0;
        component.name = `${component.tag} - ${component.breakerClass} ${component.continuousAmpRating}A`;

    } else if (component.type === 'fuse') {
        const newTag = document.getElementById('editFuseTag')?.value.trim();

        if (!newTag) {
            alert('❌ Fuse tag is required!');
            return;
        }

        const existingFuse = components.find(c =>
            c.type === 'fuse' &&
            c.tag === newTag &&
            String(c.id) !== String(id)
        );

        if (existingFuse) {
            alert(
                `❌ ERROR: Fuse tag "${newTag}" is already used by another fuse!\n\n` +
                `Fuse tags must be unique for proper tracking and reporting.`
            );
            document.getElementById('editFuseTag')?.focus();
            document.getElementById('editFuseTag')?.select();
            return;
        }

        component.tag = newTag;
        component.description = document.getElementById('editFuseDescription')?.value.trim() || '';
        component.fuseClass = document.getElementById('editFuseClass')?.value || 'HRC';
        component.speedClass = document.getElementById('editFuseSpeedClass')?.value.trim() || '';
        component.ampereRating = parseFloat(document.getElementById('editFuseAmpereRating')?.value) || 0;
        component.interruptingRatingKA = parseFloat(document.getElementById('editFuseInterruptingKA')?.value) || 0;
        component.name = `${component.tag} - ${component.ampereRating}A ${component.fuseClass}`;

    } else if (component.type === 'motor') {
        // ═══════════════════════════════════════════════════════════════════
        // FEATURE #1: MOTOR EDIT SAVE WITH TYPE
        // ═══════════════════════════════════════════════════════════════════
        
        const oldMotorTag = component.tag
        const oldMotorHP = component.hp;
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

        if (component.tagAutoGenerated !== false && (busesChanged || Number(oldMotorHP) !== Number(component.hp))) {
                              const motorTagInfo = generateMotorAutoTag(newFromBus, component.hp, component.id);
                              component.tag = motorTagInfo.tag;
                              component.fromBusTag = motorTagInfo.fromBusTagFormatted;
                              component.sequenceNumber = motorTagInfo.sequenceNumber;

                              console.log(`🔄 Motor auto-tag updated: ${oldMotorTag} → ${component.tag}`);
                      }


        console.log(`✅ Motor updated: ${component.name}`);
        console.log(` HP: ${component.hp}`);
        console.log(` Type: ${component.motorType}`);
        console.log(` Efficiency: ${(component.efficiency * 100).toFixed(1)}%`);
        console.log(` Power Factor: ${component.powerFactor.toFixed(2)}`);

    } else if (component.type === 'bus-tie') {
        const enteredTag = document.getElementById('editBusTieTag')?.value.trim() || component.tag;
        let newTag = component.tag;

        if (component.tagAutoGenerated !== false) {
          // If user changed the tag manually, stop auto-regeneration from now on
          if (enteredTag !== component.tag) {
             component.tagAutoGenerated = false;
             newTag = enteredTag;
                           } else if (busesChanged) {
             const busTieTagInfo = generateBusTieAutoTag(newFromBus, newToBus, component.id);
                                   newTag = busTieTagInfo.tag;
                           } else {
                                   newTag = component.tag;
                           }
        } else {
              // Manual override already in effect
              newTag = enteredTag;
        }
        const existingTieTag = components.find(c =>
            c.type === 'bus-tie' &&
            c.tag === newTag &&
            String(c.id) !== String(id)
        );

        if (existingTieTag) {
            alert(
                `❌ ERROR: Bus tie tag "${newTag}" is already used by another bus tie!\n\n` +
                `Bus tie tags must be unique for proper tracking and reporting.`
            );
            document.getElementById('editBusTieTag')?.focus();
            document.getElementById('editBusTieTag')?.select();
            return;
        }

        const rating = parseFloat(document.getElementById('editBusTieRating').value);
        const length = parseFloat(document.getElementById('editBusTieLength').value);
        const size = parseFloat(document.getElementById('editBusTieSize').value);
        const breakerType = document.getElementById('editBusTieBreakerType').value;
        const normalState = document.getElementById('editBusTieNormalState').value;
        const interlock = document.getElementById('editBusTieInterlock').value;
        const description = document.getElementById('editBusTieDescription').value.trim();

        if (!rating || !length || !size || !breakerType || !normalState) {
            alert('❌ Please fill in all required bus tie fields!');
            return;
        }

        component.tag = newTag;
        component.rating = rating;
        component.length = length;
        component.size = size;
        component.breakerType = breakerType;
        component.normalState = normalState;

        // Keep currentState unless user changes state via toggle:
        component.currentState = component.currentState || normalState;
        component.interlock = interlock;
        component.description = description;

        // Recalculate impedance based on new length (same rule as addComponent)
        const impedancePerFoot = 0.00001; // ohms/ft
        component.impedance = length * impedancePerFoot;

        // Update name to stay consistent
        component.name = `${component.tag || 'BUS-TIE'} - ${component.rating}A ${component.breakerType} Tie`;

        console.log('✅ Bus tie updated:', component);
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
 * FIXED: 2025-12-02 - Handle both numeric and string IDs
 */
function deleteComponent(id) {
    // Compare as strings to handle both numeric and string IDs
    const component = components.find(c => String(c.id) === String(id));
    
    if (!component) {
        alert('❌ Component not found!');
        console.error(`Component not found. Searching for ID: ${id} (${typeof id})`);
        return;
    }
    
    const displayName = component.type === 'cable' && component.tag 
        ?  `Cable "${component.tag}"`
        : component.name;
    
    const confirm = window. confirm(
        `⚠️ Delete ${displayName}?\n\n` +
        `From: ${component.fromBusName}\n` +
        `To: ${component.toBusName}\n\n` +
        `This action cannot be undone. `
    );
    
    if (confirm) {
        // Filter using string comparison
        components = components.filter(c => String(c.id) !== String(id)); 
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
        if (! component.impedance || component.impedance <= 0) errors.push('Invalid transformer impedance');
    } else if (component.type === 'breaker') {
               if (!component.tag) errors.push('Missing breaker tag');
               if (!component.continuousAmpRating || component.continuousAmpRating <= 0) {
                   errors.push('Invalid breaker continuous amp rating');
              }
              if (!component.interruptingRatingSymKA || component.interruptingRatingSymKA <= 0) {
                   errors.push('Invalid breaker interrupting symmetrical rating');
              }
    } else if (component.type === 'fuse') {
            if (!component.tag) errors.push('Missing fuse tag');
            if (!component.ampereRating || component.ampereRating <= 0) {
                errors.push('Invalid fuse ampere rating');
            }
            if (!component.interruptingRatingKA || component.interruptingRatingKA <= 0) {
                errors.push('Invalid fuse interrupting rating');
            }

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
// FIXED: 2025-12-02 - String ID conversion
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Toggle bus tie operating state between OPEN and CLOSED
 * FIXED: 2025-12-02 - Handle both numeric and string IDs
 */
function toggleBusTieState(componentId) {
    // Compare as strings to handle both numeric and string IDs
    const busTie = components.find(c => String(c.id) === String(componentId));
    
    if (!busTie || busTie.type !== 'bus-tie') {
        alert('❌ Bus tie not found! ');
        console.error(`Bus tie not found.  Searching for ID: ${componentId}`);
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
    
    if (! confirm(confirmMessage)) {
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
        console.log('⚠️ WARNING: Verify breaker interrupting ratings! ');
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
window.viewBusTieDetails = viewBusTieDetails;
window.closeBusTieDetailsModal = closeBusTieDetailsModal;
window.editComponent = editComponent;
window.saveComponentEdits = saveComponentEdits;
window.deleteComponent = deleteComponent;
window.closeEditComponentModal = closeEditComponentModal;
window.toggleBusTieState = toggleBusTieState;
window.getComponentBusHierarchyInfo = getComponentBusHierarchyInfo;
window.getAutoArrangedComponents = getAutoArrangedComponents;
window.renderComponentGroupHeader = renderComponentGroupHeader;

// ════════════════════════════════════════════════════════════════════════════
// UI HELPERS — Installation method and vector group note updaters
// ════════════════════════════════════════════════════════════════════════════

/**
 * Update the hint text when a cable installation method is changed.
 * Reads from CABLE_INSTALLATION_FACTORS (constants.js).
 */
function updateCableInstallNote() {
    const sel  = document.getElementById('cableInstallMethod');
    const note = document.getElementById('cableInstallNote');
    if (!sel || !note) return;

    const factors = (typeof getCableInstallationFactors === 'function')
        ? getCableInstallationFactors(sel.value)
        : null;

    if (factors) {
        note.textContent =
            `${factors.label} — X×${factors.x_factor.toFixed(2)}, Z0/Z1 = ${factors.z0_factor.toFixed(1)} | ${factors.standard}`;
    } else {
        note.textContent = sel.value;
    }
}

/**
 * Update the hint text when transformer vector group is changed.
 * Reads from TRANSFORMER_VECTOR_GROUP_Z0 (constants.js).
 */
function updateTransformerVectorNote() {
    const sel  = document.getElementById('transformerVectorGroup');
    const note = document.getElementById('transformerVectorNote');
    if (!sel || !note) return;

    const info = (typeof getTransformerVectorGroupZ0 === 'function')
        ? getTransformerVectorGroupZ0(sel.value)
        : null;

    if (info) {
        note.textContent = info.note;
        note.style.color = info.ground_path_on_lv ? '#1b5e20' : '#b71c1c';
    }
}

/**
 * Update grounding mode note and show/hide neutral resistor field.
 */
function updateTransformerGroundingNote() {
    const sel    = document.getElementById('transformerGroundingMode');
    const note   = document.getElementById('transformerGroundingNote');
    const rGroup = document.getElementById('transformerNeutralRGroup');
    if (!sel) return;

    const modes = (typeof TRANSFORMER_GROUNDING_MODES !== 'undefined')
        ? TRANSFORMER_GROUNDING_MODES : {};
    const info = modes[sel.value];

    if (note && info) {
        note.textContent = info.note || '';
    }

    const needsRn = ['low-resistance','high-resistance','impedance-grounded'].includes(sel.value);
    if (rGroup) rGroup.style.display = needsRn ? 'block' : 'none';
}

window.updateCableInstallNote       = updateCableInstallNote;
window.updateTransformerVectorNote  = updateTransformerVectorNote;
window.updateTransformerGroundingNote = updateTransformerGroundingNote;

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    updateComponentInputs();
    displayComponents();
    console.log('✅ Component Manager v2.3 initialized');
    console.log('   - Cable Tagging System: READY (Feature #7)');
    console.log('   - Motor Type Selection: READY (Feature #1)');
    console.log('   - Data Integrity: ENABLED (Issue #9)');
    console.log('   - Cable Installation Methods: READY');
    console.log('   - Transformer Vector Group / Grounding: READY');
});

console.log('✅ Component Manager v2.2 loaded - Enhanced Data Integrity');
console.log('   - Cable Tagging: ENABLED');
console.log('   - Motor Types: Induction, Synchronous, Wound Rotor');
console.log('   - Advanced Motor Parameters: Efficiency, Power Factor, Custom Name');
console.log('   - Unique Tag Enforcement: ACTIVE');
                            
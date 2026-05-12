/**
 * Calculation Display Module
 * Unified display handler for all calculation types
 * 
 * @author bfforex
 * @date 2025-11-01 07:36:22 UTC
 * @version 1.2.0
 * @fixed Voltage drop v2.0.0 compatibility (totalDropPercent, totalDropVolts, loadVoltage)
 * @fixed Motor contribution display with defensive checks
 * @fixed busId scope issue in display functions
 */

console.log('🔧 Loading Calculation Display Module v1.2.0...');

/**
 * Display calculation results in separate tabs
 * 
 * @param {String} busId - Bus identifier
 * @param {Object} shortCircuitResults - Short circuit calculation results
 * @param {Object} loadFlowResults - Load flow calculation results
 * @param {Object} voltageDropResults - Voltage drop calculation results
 * @param {Object} arcFlashResults - Arc flash calculation results (optional)
 */
function displayCalculationResults(busId, shortCircuitResults, loadFlowResults, voltageDropResults, arcFlashResults = null) {
    try {
        console.log('📊 Displaying results for bus:', busId);

        const resultsContainer = document.getElementById('resultsContainer');
        if (!resultsContainer) {
            console.error('❌ Results container not found');
            return;
        }

        const bus = buses.find(b => b.id === busId);
        if (!bus) {
            console.error('❌ Bus not found:', busId);
            return;
        }

        const hasProtection = !!(bus.results?.protection);

        // Arc flash result / status handling
        const arcFlashStatus = bus.results?.arcFlashStatus || null;
        const arcFlashReason = bus.results?.arcFlashReason || '';
        const effectiveArcFlashResults = bus.results?.arcFlash || arcFlashResults || null;
        const hasArcFlash = effectiveArcFlashResults !== null && effectiveArcFlashResults !== undefined;
        const showArcFlashSection = hasArcFlash || !!arcFlashStatus;

        // Fallback informational panel if arc flash was intentionally skipped
        const arcFlashUnavailableHtml = (typeof generateArcFlashUnavailableDisplay === 'function')
            ? generateArcFlashUnavailableDisplay(busId, arcFlashStatus, arcFlashReason)
            : `
                <div class="results-section">
                    <div class="results-header">
                        <h2>🔥 Arc Flash Not Calculated</h2>
                    </div>
                    <div class="alert alert-warning" style="margin-top: 20px;">
                        <strong>ℹ️ Status Details:</strong>
                        <p style="margin-top: 8px;">${arcFlashReason || 'Arc flash was not performed for this bus.'}</p>
                        <p style="margin-top: 8px;">
                            This does not affect short circuit, load flow, or voltage drop results.
                            Where required, provide a separate external arc-flash evaluation for this bus/equipment.
                        </p>
                    </div>
                </div>
            `;

        let html = `
            <div class="results-header">
                <h2>📊 Analysis Results: ${bus.name}</h2>
                <div class="results-meta">
                    <span><strong>Voltage:</strong> ${bus.voltage}V</span>
                    <span><strong>Type:</strong> ${bus.type}</span>
                    <span><strong>Date:</strong> ${getCalculationTimestamp()}</span>
                </div>
            </div>

            <!-- Calculation Type Tabs -->
            <div class="calculation-tabs">
                <button class="calc-tab active" data-calc-type="shortcircuit" onclick="switchCalcTab('shortcircuit')">
                    ⚡ Short Circuit
                </button>
                <button class="calc-tab" data-calc-type="loadflow" onclick="switchCalcTab('loadflow')">
                    🔌 Load Flow
                </button>
                ${hasProtection ? `
                    <button class="calc-tab" data-calc-type="protection" onclick="switchCalcTab('protection')">
                        🛡️ Protection
                    </button>
                ` : ''}
                <button class="calc-tab" data-calc-type="voltagedrop" onclick="switchCalcTab('voltagedrop')">
                    📉 Voltage Drop
                </button>
                ${showArcFlashSection ? `
                    <button class="calc-tab" data-calc-type="arcflash" onclick="switchCalcTab('arcflash')">
                        🔥 Arc Flash
                    </button>
                ` : ''}
            </div>

            <!-- Short Circuit Tab Content -->
            <div id="shortcircuit-content" class="calc-tab-content active">
                ${generateShortCircuitDisplay(busId, (bus.results?.shortCircuit || shortCircuitResults))}
            </div>

            <!-- Load Flow Tab Content -->
            <div id="loadflow-content" class="calc-tab-content">
                ${generateLoadFlowDisplay(busId, (bus.results?.loadFlow || loadFlowResults))}
            </div>

            ${hasProtection ? `
                <!-- Protection Tab Content -->
                <div id="protection-content" class="calc-tab-content">
                    ${generateProtectionDisplay(busId, (bus.results?.protection))}
                </div>
            ` : ''}

            <!-- Voltage Drop Tab Content -->
            <div id="voltagedrop-content" class="calc-tab-content">
                ${generateVoltageDropDisplay(busId, (bus.results?.voltageDrop || voltageDropResults))}
            </div>

            ${showArcFlashSection ? `
                <!-- Arc Flash Tab Content -->
                <div id="arcflash-content" class="calc-tab-content">
                    ${
                        hasArcFlash
                            ? generateArcFlashDisplay(busId, effectiveArcFlashResults)
                            : arcFlashUnavailableHtml
                    }
                </div>
            ` : ''}
        `;

        resultsContainer.innerHTML = html;

        // Delegated actions for results buttons (avoids inline onclick/CSP issues)
        if (!resultsContainer._actionsAttached) {
            resultsContainer.addEventListener('click', (e) => {
                const btn = e.target?.closest?.('[data-action]');
                if (!btn) return;

                const action = btn.getAttribute('data-action');

                if (action === 'view-steps') {
                    const calc = btn.getAttribute('data-calc');
                    if (typeof window.showCalculationSteps === 'function') {
                        window.showCalculationSteps(calc);
                    } else {
                        console.error('❌ showCalculationSteps not available');
                        alert('Detailed steps viewer is not available (showCalculationSteps missing).');
                    }
                }
            });
            resultsContainer._actionsAttached = true;
        }

        console.log('✅ Results displayed successfully');
        console.log(`   Protection: ${hasProtection ? 'Available' : 'Not calculated'}`);
        console.log(`   Arc Flash: ${hasArcFlash ? 'Available' : (arcFlashStatus || 'Not calculated')}`);

    } catch (error) {
        console.error('❌ Error displaying results:', error);
        console.error('Stack:', error.stack);

        // Fallback display
        const resultsContainer = document.getElementById('resultsContainer');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <h3>⚠️ Display Error</h3>
                    <p>Calculations completed but display failed.</p>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p>Check console for details.</p>
                </div>
            `;
        }
    }
}

/**
 * Generate short circuit display HTML
 * Updated: 2025-10-29 16:49:40 UTC by bfforex
 * Fixed: Motor contribution defensive checks
 * Enhanced: IEC 60909 uses SAME card/tile appearance as IEEE methods
 */
function generateShortCircuitDisplay(busId, results) {
  if (!results) return '<div class="alert alert-info">No short circuit data available.</div>';

  // ✅ Defensive check: Ensure faultCurrents exists OR IEC has initial current
  if (!results.faultCurrents && results.initialSymmetricalCurrentKA == null) {
    console.error('❌ faultCurrents missing in results');
    return '<div class="alert alert-danger">Error: Fault current data missing</div>';
  }

  // Local safe number helper (do not rely on global `n()` presence)
  const num = (v, fb = 0) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : fb;
  };

  // Detect method
  const rawMethod = String(results.method || '').toLowerCase();
  const isIEC = rawMethod === 'iec-60909';

  // Per-unit detector (your codebase sometimes uses 'Per-Unit' or 'per-unit')
  const isPerUnit = rawMethod === 'per-unit' || results.method === 'Per-Unit';

  // ✅ If IEC, map to the SAME structure used by the standard display (cards/tile)
  // so it renders exactly like point-to-point/per-unit.
  if (isIEC) {
    const calcType = String(results.calculationType || results._iecFactors?.calculationType || results._iecCalcType || results._iec60909Raw?.calculationType || 'max').toLowerCase().startsWith('min') ? 'min' : 'max';

    // IEC currents
    const ik = num(results.initialSymmetricalCurrentKA, num(results.faultCurrents?.threePhaseSym, 0)); // I″k
    const ip = num(results.peakCurrentKA, num(results.faultCurrents?.threePhaseAsym, 0));              // ip (peak)

    // IEC impedance (ohms)
    const r = num(results.impedance?.r, 0);
    const x = num(results.impedance?.x, 0);
    const z = num(results.impedance?.z, 0);

    // IEC X/R
    const xr = num(results.impedance?.xrRatio, (r !== 0 ? (x / r) : 0));

    // Build display-compatible object
    results = {
      ...results,

      // IMPORTANT: change method label so we do NOT re-enter IEC branch elsewhere
      // and so the badge shows IEC nicely.
      method: `IEC 60909 (${calcType === 'max' ? 'MAX' : 'MIN'})`,

      // Standard tiles use these fields
      faultCurrents: {
        threePhaseSym: ik,
        // Use IEC peak as the "asym" tile value (closest equivalent)
        threePhaseAsym: ip,
        lineToGround: num(results.lineToGroundCurrentKA, ik * 0.85),
        lineToLine: num(results.lineToLineCurrentKA, ik * 0.866)
      },

      xrRatio: xr,

      totalImpedance: {
        resistance: r,
        reactance: x,
        magnitude: z,
        angle: Math.atan2(x, r) * (180 / Math.PI)
      },

      // Keep IEC-specific fields for later sections
      _iecFactors: {
        peakFactor: num(results.peakFactor, 0),
        voltageFactor: num(results.voltageFactor, 0),
        breakingCurrentKA: num(results.breakingCurrentKA, ik),
        steadyStateCurrentKA: num(results.steadyStateCurrentKA, ik),
        lineToGroundCurrentKA: num(results.lineToGroundCurrentKA, ik * 0.85),
        standard: results.standard || 'IEC 60909-0:2016',
        calculationType: calcType
      }
    };
  }

  // From here on, ALL methods (IEC included via mapping) use the same template
  let html = `
    <div class="results-section">
      <h3>⚡ Fault Current Results</h3>
      <div class="method-badge">
        <span class="badge ${isPerUnit ? 'badge-info' : 'badge-primary'}">${results.method || 'Point-to-Point'} Method</span>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">⚡</div>
          <div class="stat-value">${num(results.faultCurrents?.threePhaseSym).toFixed(2)}</div>
          <div class="stat-label">3-Phase Sym (kA)</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-value">${num(results.faultCurrents?.threePhaseAsym).toFixed(2)}</div>
          <div class="stat-label">3-Phase Asym (kA)</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔄</div>
          <div class="stat-value">${num(results.xrRatio).toFixed(2)}</div>
          <div class="stat-label">X/R Ratio</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⚙️</div>
          <div class="stat-value">${(num(results.totalImpedance?.magnitude) * 1000).toFixed(1)}</div>
          <div class="stat-label">Total Z (mΩ)</div>
        </div>
      </div>

      ${generateMotorContributionSection(results)}

      ${generateCompleteFaultTypesSection(results)}

      <h4>📋 Impedance Breakdown</h4>
      <div class="result-item">
        <strong>Resistance (R):</strong> ${(num(results.totalImpedance?.resistance) * 1000).toFixed(3)} mΩ<br>
        <strong>Reactance (X):</strong> ${(num(results.totalImpedance?.reactance) * 1000).toFixed(3)} mΩ<br>
        <strong>Magnitude (Z):</strong> ${(num(results.totalImpedance?.magnitude) * 1000).toFixed(3)} mΩ<br>
        <strong>Angle:</strong> ${num(results.totalImpedance?.angle).toFixed(2)}°
      </div>

      ${generatePerUnitSection(results, isPerUnit)}
  `;

  // ✅ Append IEC-only details in a matching style (optional but recommended)
  if (results._iecFactors) {
    const f = results._iecFactors;
    html += `
      <h4>📋 IEC 60909 Details</h4>
      <div class="result-item">
        <strong>Calculation Type:</strong> ${f.calculationType === 'max' ? 'Maximum (Equipment Rating)' : 'Minimum (Protection Coordination)'}<br>
        <strong>κ Peak Factor:</strong> ${num(f.peakFactor).toFixed(3)}<br>
        <strong>c Voltage Factor:</strong> ${num(f.voltageFactor).toFixed(3)}<br>
        <strong>Breaking Current (Ib):</strong> ${num(f.breakingCurrentKA).toFixed(3)} kA<br>
        <strong>Steady-State (Ik):</strong> ${num(f.steadyStateCurrentKA).toFixed(3)} kA<br>
        <strong>Line-to-Ground (Ik1):</strong> ${num(f.lineToGroundCurrentKA).toFixed(3)} kA<br>
        <strong>Standard:</strong> ${f.standard}
      </div>
    `;
  }

  html += `
      <h4>📊 Other Fault Types</h4>
      <div class="result-item">
        <strong>Line-to-Ground:</strong> ${num(results.faultCurrents?.lineToGround).toFixed(2)} kA (≈85% of 3-phase)<br>
        <strong>Line-to-Line:</strong> ${num(results.faultCurrents?.lineToLine).toFixed(2)} kA (≈86.6% of 3-phase)
      </div>

      ${generateMotorDetailsTable(results)}

      <div class="button-group">
        <button class="btn btn-info" data-action="view-steps" data-calc="shortcircuit">
          📝 View Detailed Calculations
        </button>
        <button class="btn btn-success" onclick="exportBusReport('${busId}')">
          📄 Export Report
        </button>
      </div>
    </div>
  `;

  return html;
}
/**
 * Generate motor contribution section
 * ✅ NEW: Separated for cleaner code with defensive checks
 * 
 * @param {Object} results - Short circuit results
 * @returns {String} HTML for motor contribution section
 */
function generateMotorContributionSection(results) {
  // Defensive checks for motor contribution (supports normalized schema via _motorDetails)
  const mc = results?._motorDetails || results?.motorContribution;
  if (!mc) return '';

  // Motors list can exist on full detail object; if missing, hide section
  const motorsArr = mc.motors || mc.individualMotors || [];
  if (!Array.isArray(motorsArr) || motorsArr.length === 0) return '';

  const motorCount = mc.motorCount || mc.motors?.length || (Array.isArray(mc.motors) ? mc.motors.length : (Array.isArray(mc.individualMotors) ? mc.individualMotors.length : 0));
  const totalSym = mc.totalSymmetricalContribution || mc.totalCurrent || (mc.motorFaultCurrent ? mc.motorFaultCurrent / 1000 : 0);
  const totalAsym = mc.totalAsymmetricalContribution || 0;
  const motorZ = mc.totalMotorZ || 0;
  const increase = results.faultCurrentIncrease || 0;

return `
        <div class="alert alert-success">
            <h4>⚡ Motor Contribution Included</h4>
            <div class="motor-contribution-details">
                <strong>Motors Connected:</strong> ${motorCount}<br>
                <strong>Symmetrical Contribution:</strong> ${totalSym.toFixed(3)} kA<br>
                ${totalAsym > 0 ? `<strong>Asymmetrical Contribution:</strong> ${totalAsym.toFixed(3)} kA<br>` : ''}
                ${motorZ > 0 ? `<strong>Motor Impedance:</strong> ${(motorZ * 1000).toFixed(3)} mΩ<br>` : ''}
                ${increase !== 0 ? `<strong>Fault Current Increase:</strong> ${increase.toFixed(1)}%<br>` : ''}
                <small class="text-muted">Per IEEE 141-1993, IEC 60909, and NEC Article 430</small>
            </div>
        </div>
    `;
}

/**
 * Generate per-unit section
 * ✅ NEW: Separated for cleaner code
 * 
 * @param {Object} results - Short circuit results
 * @param {Boolean} isPerUnit - Whether per-unit method was used
 * @returns {String} HTML for per-unit section
 */
function generatePerUnitSection(results, isPerUnit) {
    if (!isPerUnit || !results.perUnit) return '';
    
    return `
        <h4>📊 Per-Unit System Data</h4>
        <div class="result-item per-unit-data">
            <div class="pu-section">
                <h5>Base Values</h5>
                <strong>Base kVA:</strong> ${results.perUnit.baseKVA.toLocaleString()} kVA<br>
                <strong>Base Voltage:</strong> ${results.perUnit.baseVoltage} V<br>
                <strong>Base Impedance:</strong> ${results.perUnit.baseZ ? results.perUnit.baseZ.toFixed(6) : 'N/A'} Ω<br>
                <strong>Base Current:</strong> ${results.perUnit.baseCurrent ? results.perUnit.baseCurrent.toFixed(2) : 'N/A'} A
            </div>
            <div class="pu-section">
                <h5>Per-Unit Impedances</h5>
                <strong>R_pu:</strong> ${results.perUnit.totalRpu.toFixed(6)} pu<br>
                <strong>X_pu:</strong> ${results.perUnit.totalXpu.toFixed(6)} pu<br>
                <strong>Z_pu:</strong> ${results.perUnit.totalZpu.toFixed(6)} pu<br>
                <strong>X/R:</strong> ${results.xrRatio.toFixed(3)}
            </div>
            <div class="pu-section">
                <h5>Fault Current (Per-Unit)</h5>
                <strong>I_sc_pu:</strong> ${(1.0 / results.perUnit.totalZpu).toFixed(6)} pu<br>
                <strong>I_sc_actual:</strong> ${results.faultCurrents.threePhaseSym.toFixed(3)} kA<br>
                <small class="text-muted">I_actual = I_pu × I_base</small>
            </div>
        </div>
        
        <div class="alert alert-info">
            <h5>ℹ️ Per-Unit Method Advantages</h5>
            <ul>
                <li>✓ Voltage level changes handled automatically</li>
                <li>✓ Transformer ratios built into per-unit conversion</li>
                <li>✓ Easy parallel/series impedance combinations</li>
                <li>✓ Standard for multi-voltage level systems</li>
                <li>✓ Simplifies analysis of complex power systems</li>
            </ul>
        </div>
    `;
}

/**
 * Generate motor details table
 * ✅ NEW: Separated for cleaner code with defensive checks
 * 
 * @param {Object} results - Short circuit results
 * @returns {String} HTML for motor details table
 */
function generateMotorDetailsTable(results) {
    if (!results.motorContribution || !results.motorContribution.individualMotors) return '';
    
    const motors = results.motorContribution.individualMotors;
    if (!Array.isArray(motors) || motors.length === 0) return '';
    
    return `
        <h4>⚙️ Motor Details</h4>
        <table class="breakdown-table">
            <thead>
                <tr>
                    <th>Motor</th>
                    <th>HP</th>
                    <th>Type</th>
                    <th>FLC (A)</th>
                    <th>LRC (A)</th>
                    <th>Contribution (kA)</th>
                </tr>
            </thead>
            <tbody>
                ${motors.map(m => `
                    <tr>
                        <td>${m.motors && m.motors[0] ? m.motors[0].name : 'Unknown'}</td>
                        <td>${m.motorHP || 'N/A'}</td>
                        <td>${m.motorType || 'N/A'}</td>
                        <td>${m.fullLoadCurrent ? m.fullLoadCurrent.toFixed(1) : 'N/A'}</td>
                        <td>${m.lockedRotorCurrent ? m.lockedRotorCurrent.toFixed(1) : 'N/A'}</td>
                        <td>${m.symmetricalContribution ? (m.symmetricalContribution / 1000).toFixed(3) : 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

/**
 * Display demand factor analysis
 * Complete function with error handling
 * Updated: 2025-11-03 02:53:31 UTC by bfforex
 * 
 * @param {Object} bus - Bus object
 * @param {HTMLElement} container - Container element
 */
function displayDemandFactorAnalysis(bus, container) {
    // ✅ ADDED: Error boundary
    try {
        if (!bus.results || !bus.results.loadFlow) {
            console.log('ℹ️ No load flow results for demand factor display');
            return;
        }
        
        const lf = bus.results.loadFlow;
        
        // Create section
        const section = document.createElement('div');
        section.className = 'result-section demand-diversity-section';
        section.style.marginTop = '20px';
        
        let html = '<h3>📊 Demand & Diversity Factor Analysis</h3>';
        
        if (lf.demandFactorsApplied && lf.demandSummary) {
            const ds = lf.demandSummary;
            const reductionPercent = ds.connectedCurrent > 0 
                ? ((1 - ds.diversityCurrent / ds.connectedCurrent) * 100) 
                : 0;
            
            html += '<div class="demand-summary">';
            html += '<table class="result-table">';
            html += '<thead>';
            html += '<tr>';
            html += '<th>Load Type</th>';
            html += '<th>Current (A)</th>';
            html += '<th>Power (kVA)</th>';
            html += '<th>Percentage</th>';
            html += '</tr>';
            html += '</thead>';
            html += '<tbody>';
            
            // Connected Load
            html += '<tr>';
            html += '<td><strong>Connected Load</strong></td>';
            html += `<td>${ds.connectedCurrent.toFixed(2)}</td>`;
            html += `<td>${ds.connectedPowerKVA.toFixed(2)}</td>`;
            html += '<td>100.0%</td>';
            html += '</tr>';
            
            // Demand Load
            html += '<tr>';
            html += `<td><strong>Demand Load</strong> <span class="info-badge" title="NEC Article 220">Kd=${ds.demandFactor.toFixed(3)}</span></td>`;
            html += `<td>${ds.demandCurrent.toFixed(2)}</td>`;
            html += `<td>${ds.demandPowerKVA.toFixed(2)}</td>`;
            html += `<td>${(ds.demandFactor * 100).toFixed(1)}%</td>`;
            html += '</tr>';
            
            // Diversified Load
            html += '<tr class="highlight-row">';
            html += `<td><strong>Diversified Load</strong> <span class="info-badge" title="IEEE 141-1993">DF=${ds.diversityFactor.toFixed(3)}</span></td>`;
            html += `<td><strong>${ds.diversityCurrent.toFixed(2)}</strong></td>`;
            html += `<td><strong>${ds.diversityPowerKVA.toFixed(2)}</strong></td>`;
            html += `<td><strong>${((ds.diversityCurrent / ds.connectedCurrent) * 100).toFixed(1)}%</strong></td>`;
            html += '</tr>';
            
            html += '</tbody>';
            html += '</table>';
            html += '</div>';
            
            // Savings display
            html += '<div class="savings-display" style="margin-top: 15px; padding: 15px; background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px;">';
            html += '<div style="display: flex; justify-content: space-around; text-align: center;">';
            html += '<div>';
            html += '<div style="font-size: 24px; font-weight: bold; color: #2e7d32;">' + (ds.connectedPowerKVA - ds.diversityPowerKVA).toFixed(2) + ' kVA</div>';
            html += '<div style="font-size: 12px; color: #666;">Power Savings</div>';
            html += '</div>';
            html += '<div>';
            html += '<div style="font-size: 24px; font-weight: bold; color: #2e7d32;">' + (ds.connectedCurrent - ds.diversityCurrent).toFixed(2) + ' A</div>';
            html += '<div style="font-size: 12px; color: #666;">Current Reduction</div>';
            html += '</div>';
            html += '<div>';
            html += '<div style="font-size: 24px; font-weight: bold; color: #2e7d32;">' + reductionPercent.toFixed(1) + '%</div>';
            html += '<div style="font-size: 12px; color: #666;">Load Reduction</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            
            // ═══════════════════════════════════════════════════════════════
            // VOLTAGE DROP COMPARISON
            // Enhanced: 2025-11-03 02:53:31 UTC by bfforex
            // Fixed: Property compatibility for v1.2.2 and v2.0.0
            // ═══════════════════════════════════════════════════════════════
            
            if (bus.results.voltageDrop) {
                const vd = bus.results.voltageDrop;
                
                // ✅ FIXED: Compatible with both versions
                const vdPercent = vd.totalDropPercent || vd.cumulativeDropPercent || 0;
                const vdVolts = vd.totalDropVolts || vd.cumulativeDropVolts || 0;
                
                // Calculate diversity voltage drop
                const diversityVD = vdPercent * (ds.diversityCurrent / ds.connectedCurrent);
                const vdReduction = ((1 - diversityVD / vdPercent) * 100);
                
                html += '<div class="voltage-drop-comparison" style="margin-top: 15px; padding: 15px; background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px;">';
                html += '<h4 style="margin-top: 0;">⚡ Voltage Drop Analysis</h4>';
                html += '<table class="result-table" style="font-size: 13px;">';
                
                html += '<tr>';
                html += '<td><strong>Method:</strong></td>';
                html += '<td>Full Load Current (Conservative)</td>';
                html += '</tr>';
                
                html += '<tr>';
                html += '<td><strong>Calculated Drop:</strong></td>';
                html += `<td>${vdPercent.toFixed(3)}% (${vdVolts.toFixed(2)}V)</td>`;
                html += '</tr>';
                
                html += '<tr>';
                html += '<td><strong>With Diversity:</strong></td>';
                html += `<td>${diversityVD.toFixed(3)}% (${(diversityVD * bus.voltage / 100).toFixed(2)}V) - Estimated Operating</td>`;
                html += '</tr>';
                
                html += '<tr>';
                html += '<td><strong>Improvement:</strong></td>';
                html += `<td><strong>${vdReduction.toFixed(1)}% lower</strong> voltage drop in normal operation</td>`;
                html += '</tr>';
                
                html += '<tr>';
                html += '<td colspan="2" style="padding-top: 10px; font-size: 11px; color: #666;">';
                html += 'ℹ️ Voltage drop calculated using FLC ensures conservative cable sizing. ';
                html += 'Actual operating conditions will have lower voltage drop due to demand/diversity factors.';
                html += '</td>';
                html += '</tr>';
                
                html += '</table>';
                html += '</div>';
            }
            
            // Standards compliance
            html += '<div class="standards-compliance" style="margin-top: 15px; padding: 10px; background: #f5f5f5; border-radius: 4px; font-size: 12px;">';
            html += '<strong>📋 Standards Applied:</strong><br>';
            html += '✓ NEC Article 220 - Demand Factors<br>';
            html += '✓ NEC Article 430.24 - Motor Demand Factors<br>';
            html += '✓ IEEE 141-1993 - Diversity Factors';
            html += '</div>';
            
        } else {
            // Demand factors not applied
            html += '<div class="warning-box" style="padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">';
            html += '<h4 style="margin-top: 0;">⚠️ Demand Factors Not Applied</h4>';
            html += '<p><strong>Load Used:</strong> Connected Load (100%) - Conservative Approach</p>';
            html += '<p><strong>Reason:</strong> Demand factor modules not available or bus configuration does not support automatic application.</p>';
            html += '<p><strong>Impact:</strong> Calculations use full connected load (most conservative). This ensures adequate sizing but may result in over-capacity in actual operating conditions.</p>';
            html += '<p style="margin-bottom: 0;"><strong>Status:</strong> ';
            
            if (lf.summary) {
                html += `Total Load: ${lf.summary.totalCurrent.toFixed(2)} A | ${lf.summary.totalPowerKVA.toFixed(2)} kVA`;
            } else {
                html += 'Load data available';
            }
            html += '</p>';
            html += '</div>';
        }
        
        section.innerHTML = html;
        container.appendChild(section);
        
        console.log(`✅ Demand factor analysis displayed for bus: ${bus.name}`);
        
    } catch (error) {
        console.error('❌ Error in displayDemandFactorAnalysis:', error);
        console.error('Stack trace:', error.stack);
        
        // Display error message to user
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger" style="margin-top: 15px;">
                    <h4>⚠️ Display Error</h4>
                    <p>Could not display demand factor analysis.</p>
                    <details>
                        <summary>Error Details</summary>
                        <pre style="font-size: 11px; margin-top: 10px;">${error.message}\n\n${error.stack}</pre>
                    </details>
                </div>
            `;
        }
    }
}

/**
 * Generate load flow display HTML
 * Updated: 2025-11-03 02:53:31 UTC by bfforex
 * Fixed: DOM timing and demand factor integration
 * 
 * @param {String} busId - Bus identifier
 * @param {Object} results - Load flow results
 */
function generateLoadFlowDisplay(busId, results) {
    if (!results) return '<div class="alert alert-info">No load flow data available.</div>';
    
    const motorTotal = results.breakdown.motors.reduce((sum, m) => sum + m.current, 0);
    const xfmrTotal = results.breakdown.transformers.reduce((sum, t) => sum + (t.primaryCurrent || 0), 0);
    const cableTotal = results.breakdown.cables.reduce((sum, c) => sum + c.current, 0);
    const directTotal = results.breakdown.directLoads.reduce((sum, d) => sum + d.current, 0);
    
    // ✅ ISSUE #4: Check if diversity was applied
    const diversityApplied = results.diversityApplied || false;
    const diversityInfo = diversityApplied ? `
        <div class="alert alert-success" style="margin: 15px 0;">
            <h4>📊 Diversity Factors Applied</h4>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 10px;">
                <div>
                    <strong>Connected Load:</strong><br>
                    <span style="font-size: 1.2em;">${results.connectedLoad.toFixed(2)} A</span>
                </div>
                <div>
                    <strong>Diversified Load:</strong><br>
                    <span style="font-size: 1.2em; color: #28a745;">${results.diversifiedLoad.toFixed(2)} A</span>
                </div>
                <div>
                    <strong>Reduction:</strong><br>
                    <span style="font-size: 1.2em; color: #17a2b8;">${results.loadReductionPercent.toFixed(1)}%</span>
                </div>
            </div>
            <small style="color: #666; margin-top: 8px; display: block;">
                Per IEEE 141-1993 & NEC Article 220 | Diversity Factor: ${results.overallDiversityFactor.toFixed(3)}
            </small>
        </div>
    ` : '';
    
    const htmlContent = `
        <div class="results-section">
            <h3>🔌 Load Flow Summary</h3>
            ${diversityInfo}
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">⚡</div>
                    <div class="stat-value">${results.summary.totalCurrent.toFixed(1)}</div>
                    <div class="stat-label">Total Current (A)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-value">${results.summary.totalPowerKVA.toFixed(1)}</div>
                    <div class="stat-label">Apparent Power (kVA)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⚙️</div>
                    <div class="stat-value">${results.summary.totalPowerKW.toFixed(1)}</div>
                    <div class="stat-label">Active Power (kW)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🔄</div>
                    <div class="stat-value">${results.summary.powerFactor.toFixed(2)}</div>
                    <div class="stat-label">Power Factor</div>
                </div>
            </div>
            
            <h4>📋 Load Breakdown by Type</h4>
            <div class="load-breakdown-chart">
                ${motorTotal > 0 ? `
                    <div class="load-bar">
                        <div class="load-label">Motors</div>
                        <div class="load-progress">
                            <div class="load-fill" style="width: ${(motorTotal/results.summary.totalCurrent*100).toFixed(1)}%; background: #ff6384;"></div>
                        </div>
                        <div class="load-value">${motorTotal.toFixed(1)}A (${(motorTotal/results.summary.totalCurrent*100).toFixed(1)}%)</div>
                    </div>
                ` : ''}
                ${xfmrTotal > 0 ? `
                    <div class="load-bar">
                        <div class="load-label">Transformers</div>
                        <div class="load-progress">
                            <div class="load-fill" style="width: ${(xfmrTotal/results.summary.totalCurrent*100).toFixed(1)}%; background: #36a2eb;"></div>
                        </div>
                        <div class="load-value">${xfmrTotal.toFixed(1)}A (${(xfmrTotal/results.summary.totalCurrent*100).toFixed(1)}%)</div>
                    </div>
                ` : ''}
                ${cableTotal > 0 ? `
                    <div class="load-bar">
                        <div class="load-label">Cables</div>
                        <div class="load-progress">
                            <div class="load-fill" style="width: ${(cableTotal/results.summary.totalCurrent*100).toFixed(1)}%; background: #ffce56;"></div>
                        </div>
                        <div class="load-value">${cableTotal.toFixed(1)}A (${(cableTotal/results.summary.totalCurrent*100).toFixed(1)}%)</div>
                    </div>
                ` : ''}
                ${directTotal > 0 ? `
                    <div class="load-bar">
                        <div class="load-label">Direct Loads</div>
                        <div class="load-progress">
                            <div class="load-fill" style="width: ${(directTotal/results.summary.totalCurrent*100).toFixed(1)}%; background: #4bc0c0;"></div>
                        </div>
                        <div class="load-value">${directTotal.toFixed(1)}A (${(directTotal/results.summary.totalCurrent*100).toFixed(1)}%)</div>
                    </div>
                ` : ''}
            </div>
            
            ${generateLoadFlowBreakdowns(results)}
            
            <!-- ✅ FIXED: Demand factor container without inline script -->
            <div id="demand-factor-container-${busId}"></div>
            
            <div class="button-group">
                <button class="btn btn-info" data-action="view-steps" data-calc="loadflow">
                    📝 View Detailed Calculations
                </button>
                <button class="btn btn-success" onclick="exportLoadFlowReport('${busId}')">
                    📄 Export Report
                </button>
            </div>
        </div>
    `;
    
    // ✅ FIXED: Schedule demand factor display after DOM update
    // Using requestAnimationFrame ensures DOM is ready
    if (typeof displayDemandFactorAnalysis === 'function') {
        requestAnimationFrame(() => {
            const bus = buses.find(b => b.id === busId);
            const container = document.getElementById(`demand-factor-container-${busId}`);
            
            if (container && bus && bus.results && bus.results.loadFlow) {
                try {
                    displayDemandFactorAnalysis(bus, container);
                    console.log(`✅ Demand factor display injected for bus: ${busId}`);
                } catch (error) {
                    console.error('❌ Error displaying demand factors:', error);
                    container.innerHTML = `
                        <div class="alert alert-warning" style="margin-top: 15px;">
                            <strong>⚠️ Display Error:</strong> Could not show demand factor analysis.
                        </div>
                    `;
                }
            } else {
                console.log(`ℹ️ Demand factor display skipped for bus: ${busId} (container or data not available)`);
            }
        });
    }
    
    return htmlContent;
}

/**
 * Generate load flow breakdowns
 * ✅ NEW: Separated for cleaner code
 */
function generateLoadFlowBreakdowns(results) {
    let html = '<h4>📊 Component Details</h4>';
    
    // Motors
    if (results.breakdown.motors.length > 0) {
        html += `
            <div class="component-breakdown">
                <h5>⚙️ Motors (${results.breakdown.motors.length})</h5>
                <table class="breakdown-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Location</th>
                            <th>HP</th>
                            <th>Current (A)</th>
                            <th>Power (kW)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.breakdown.motors.map(motor => `
                            <tr>
                                <td>${motor.name}</td>
                                <td>${motor.location}</td>
                                <td>${motor.hp}</td>
                                <td>${motor.current.toFixed(1)}</td>
                                <td>${motor.powerKW.toFixed(1)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Transformers
    if (results.breakdown.transformers.length > 0) {
        html += `
            <div class="component-breakdown">
                <h5>⚡ Transformers (${results.breakdown.transformers.length})</h5>
                <table class="breakdown-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Location</th>
                            <th>Rating (kVA)</th>
                            <th>Primary I (A)</th>
                            <th>Loading (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.breakdown.transformers.map(xfmr => `
                            <tr>
                                <td>${xfmr.name}</td>
                                <td>${xfmr.location}</td>
                                <td>${xfmr.rating}</td>
                                <td>${xfmr.primaryCurrent ? xfmr.primaryCurrent.toFixed(1) : 'N/A'}</td>
                                <td>${xfmr.loading ? xfmr.loading.toFixed(1) : 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    return html;
}

function generateProtectionDisplay(busId, results) {
 if (!results) {
  return `
<div class="calculation-section">
<h3>🛡️ No Protection Data Available</h3>
<div class="alert alert-info">
Protection analysis has not been run for this bus.
</div>
</div>
`;
 }

 const bus = buses.find(b => b.id === busId) || null;
 const adequacy = results.adequacy || {};
 const devices = Array.isArray(adequacy.devices) ? adequacy.devices : [];
 const clearing = results.clearing || {};
 const recommendations = Array.isArray(results.recommendations) ? results.recommendations : [];
 const sc = bus?.results?.shortCircuit || {};
 const fc = sc.faultCurrents || {};
 const firstDevice = devices[0] || {};

 const duties = {
  threePhaseSymKA: Number(results.duties?.threePhaseSymKA ?? firstDevice.duties?.threePhaseSymKA ?? fc.threePhaseSym ?? 0),
  threePhaseAsymKA: Number(results.duties?.threePhaseAsymKA ?? firstDevice.duties?.threePhaseAsymKA ?? fc.threePhaseAsym ?? 0),
  lineToGroundKA: Number(results.duties?.lineToGroundKA ?? firstDevice.duties?.lineToGroundKA ?? fc.lineToGround ?? 0),
  lineToLineKA: Number(results.duties?.lineToLineKA ?? firstDevice.duties?.lineToLineKA ?? fc.lineToLine ?? 0),
  peakKA: Number(results.duties?.peakKA ?? firstDevice.duties?.peakKA ?? sc.peakCurrentKA ?? 0)
 };

 const loadCurrentA = Number(
  results.loadCurrentA ??
  bus?.results?.loadFlow?.demandSummary?.diversityCurrent ??
  bus?.results?.loadFlow?.demandSummary?.demandCurrent ??
  bus?.results?.loadFlow?.summary?.totalCurrent ??
  bus?.loadCurrentCalculated ??
  bus?.loadCurrent ??
  0
 );

 const clearingDeviceLabel =
  clearing.clearingDeviceLabel ||
  clearing.clearingDeviceTag ||
  clearing.clearingDeviceName ||
  clearing.clearingDeviceId ||
  adequacy.primaryDeviceLabel ||
  adequacy.primaryDeviceId ||
  'N/A';

 const clearingDeviceType =
  String(
   clearing.clearingDeviceType ||
   firstDevice.deviceType ||
   'N/A'
  ).toUpperCase();

 const clearingReason =
  clearing.reason ||
  'Nearest upstream breaker/fuse in traced path selected as primary clearing device.';

 const calculationMethod =
  results.calculationMethod ||
  'MVP adequacy';

 const overallStatus =
  results.overallStatus ||
  (devices.some(d => String(d.status).toUpperCase() === 'FAIL') ? 'FAIL' :
   devices.some(d => String(d.status).toUpperCase() === 'MARGINAL') ? 'MARGINAL' :
   devices.some(d => String(d.status).toUpperCase() === 'PASS') ? 'PASS' :
   'UNKNOWN');

 function getStatusColors(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'PASS') {
   return {
    bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
    border: '#4caf50',
    text: '#1b5e20'
   };
  }
  if (s === 'MARGINAL') {
   return {
    bg: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
    border: '#ff9800',
    text: '#e65100'
   };
  }
  if (s === 'FAIL') {
   return {
    bg: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
    border: '#f44336',
    text: '#b71c1c'
   };
  }
  return {
   bg: 'linear-gradient(135deg, #eceff1 0%, #cfd8dc 100%)',
   border: '#78909c',
   text: '#37474f'
  };
 }

 function getStatusBadge(status) {
  const c = getStatusColors(status);
  return `<span style="display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: ${c.bg}; border: 1px solid ${c.border}; color: ${c.text};">${String(status || 'UNKNOWN').toUpperCase()}</span>`;
 }

 const overallColors = getStatusColors(overallStatus);

 let html = `
<div class="calculation-section">
<h3 style="margin-bottom: 18px;">🛡️ Protection Analysis</h3>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 20px;">
 <div style="background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%); border-left: 4px solid #607d8b; border-radius: 8px; padding: 14px 16px;">
  <div style="font-size: 11px; color: #607d8b; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px;">Devices Evaluated</div>
  <div style="font-size: 28px; font-weight: 700; color: #263238; line-height: 1.1;">${devices.length}</div>
 </div>
 <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-left: 4px solid #2196f3; border-radius: 8px; padding: 14px 16px;">
  <div style="font-size: 11px; color: #1976d2; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px;">Primary Clearing Device</div>
  <div style="font-size: 18px; font-weight: 700; color: #0d47a1; line-height: 1.2;">${clearingDeviceLabel}</div>
 </div>
 <div style="background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); border-left: 4px solid #9c27b0; border-radius: 8px; padding: 14px 16px;">
  <div style="font-size: 11px; color: #7b1fa2; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px;">Clearing Device Type</div>
  <div style="font-size: 18px; font-weight: 700; color: #4a148c; line-height: 1.2;">${clearingDeviceType}</div>
 </div>
 <div style="background: ${overallColors.bg}; border-left: 4px solid ${overallColors.border}; border-radius: 8px; padding: 14px 16px;">
  <div style="font-size: 11px; color: ${overallColors.text}; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px;">Overall Status</div>
  <div style="font-size: 20px; font-weight: 700; color: ${overallColors.text}; line-height: 1.2;">${String(overallStatus).toUpperCase()}</div>
 </div>
</div>

<div style="background: #fafafa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-bottom: 18px;">
 <h4 style="margin: 0 0 12px 0; color: #d84315;">⚡ Fault Duty Basis</h4>
 <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px;">
  <div style="background: white; border: 1px solid #eeeeee; border-radius: 6px; padding: 12px;">
   <div style="font-size: 11px; color: #757575; text-transform: uppercase; margin-bottom: 4px;">3φ Symmetrical</div>
   <div style="font-size: 18px; font-weight: 700; color: #263238;">${duties.threePhaseSymKA.toFixed(3)} kA</div>
  </div>
  <div style="background: white; border: 1px solid #eeeeee; border-radius: 6px; padding: 12px;">
   <div style="font-size: 11px; color: #757575; text-transform: uppercase; margin-bottom: 4px;">3φ Asymmetrical</div>
   <div style="font-size: 18px; font-weight: 700; color: #263238;">${duties.threePhaseAsymKA.toFixed(3)} kA</div>
  </div>
  <div style="background: white; border: 1px solid #eeeeee; border-radius: 6px; padding: 12px;">
   <div style="font-size: 11px; color: #757575; text-transform: uppercase; margin-bottom: 4px;">Line-to-Ground</div>
   <div style="font-size: 18px; font-weight: 700; color: #263238;">${duties.lineToGroundKA.toFixed(3)} kA</div>
  </div>
  <div style="background: white; border: 1px solid #eeeeee; border-radius: 6px; padding: 12px;">
   <div style="font-size: 11px; color: #757575; text-transform: uppercase; margin-bottom: 4px;">Line-to-Line</div>
   <div style="font-size: 18px; font-weight: 700; color: #263238;">${duties.lineToLineKA.toFixed(3)} kA</div>
  </div>
 </div>
 <div style="margin-top: 12px; font-size: 13px; color: #616161;">
  <strong>Load Current Basis:</strong> ${loadCurrentA.toFixed(2)} A
 </div>
</div>

<div style="background: linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%); border-left: 4px solid #00acc1; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
 <div style="font-size: 16px; font-weight: 700; color: #01579b; margin-bottom: 8px;">Primary Clearing Device: ${clearingDeviceLabel}</div>
 <div style="font-size: 13px; color: #006064; margin-bottom: 4px;"><strong>Selection Basis:</strong> ${clearingReason}</div>
 <div style="font-size: 13px; color: #006064;"><strong>Protection Method:</strong> ${calculationMethod}</div>
</div>
`;

 if (devices.length > 0) {
  html += `
<h4 style="margin-bottom: 10px;">📋 Device Adequacy Results</h4>
<div class="table-responsive" style="margin-bottom: 18px;">
<table class="results-table" style="width: 100%; border-collapse: collapse;">
 <tr style="background: #f5f5f5;">
  <th style="text-align: left;">Device</th>
  <th style="text-align: left;">Type</th>
  <th style="text-align: left;">Status</th>
  <th style="text-align: left;">Interrupting Rating</th>
  <th style="text-align: left;">Interrupting Utilization</th>
  <th style="text-align: left;">Momentary Utilization</th>
  <th style="text-align: left;">Continuous Utilization</th>
  <th style="text-align: left;">Notes</th>
 </tr>
${devices.map(d => {
   const deviceLabel =
    d.deviceLabel ||
    d.deviceTag ||
    d.deviceName ||
    d.deviceId ||
    'N/A';

   const interruptingRating =
    d.ratings?.interruptingSymKA != null
     ? Number(d.ratings.interruptingSymKA).toFixed(3) + ' kA'
     : 'N/A';

   return `
 <tr>
  <td style="font-weight: 600;">${deviceLabel}</td>
  <td>${String(d.deviceType || 'N/A').toUpperCase()}</td>
  <td>${getStatusBadge(d.status)}</td>
  <td>${interruptingRating}</td>
  <td>${d.utilizationPercent?.interrupting != null ? d.utilizationPercent.interrupting.toFixed(1) + '%' : 'N/A'}</td>
  <td>${d.utilizationPercent?.momentary != null ? d.utilizationPercent.momentary.toFixed(1) + '%' : 'N/A'}</td>
  <td>${d.utilizationPercent?.continuous != null ? d.utilizationPercent.continuous.toFixed(1) + '%' : 'N/A'}</td>
  <td>${d.notes || ''}</td>
 </tr>
`;
  }).join('')}
</table>
</div>
`;
 } else {
  html += `
<div class="alert alert-info" style="margin-bottom: 18px;">
No breaker or fuse adequacy results were produced for this bus.
</div>
`;
 }

 if (recommendations.length > 0) {
  html += `
<h4 style="margin-bottom: 10px;">⚠️ Protection Recommendations</h4>
<div class="alert alert-warning" style="margin-bottom: 18px;">
<ul style="margin: 0; padding-left: 20px;">
${recommendations.map(r => `
 <li><strong>${r.severity || 'INFO'}:</strong> ${r.message || ''}</li>
`).join('')}
</ul>
</div>
`;
 }

 html += `
<div class="result-actions">
 <button class="btn btn-secondary" data-action="view-steps" data-calc="protection">📝 View Detailed Calculations</button>
</div>
</div>
`;

 return html;
}

/**
 * Generate voltage drop display HTML
 * ✅ FIXED: Compatible with voltageDropCalc.js v2.0.0
 * Updated: 2025-11-01 07:36:22 UTC by bfforex
 * 
 * @param {String} busId - Bus identifier
 * @param {Object} results - Voltage drop results from v2.0.0
 */
function vdDisplayNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function getVoltageDropDisplayBreakdown(results) {
    const components = Array.isArray(results?.components) ? results.components : [];

    const nominalLoadVoltage = vdDisplayNumber(
        results?.nominalLoadVoltage,
        vdDisplayNumber(results?.nominalVoltage,
        vdDisplayNumber(results?.busVoltage,
        vdDisplayNumber(results?.targetBusVoltage,
        vdDisplayNumber(results?.systemVoltageProfile?.basisVoltage,
        vdDisplayNumber(results?.loadVoltage, 0)))))
    );

    const tapAdjustedNominal = vdDisplayNumber(
        results?.tapAdjustedNominal,
        vdDisplayNumber(results?.tapAdjustment?.tapAdjustedNominal, 0)
    );

    const basisVoltage = vdDisplayNumber(
        results?.conductorVoltageDrop?.basisVoltage,
        tapAdjustedNominal > 0 ? tapAdjustedNominal : nominalLoadVoltage
    );

    const conductorComponents = results?.conductorVoltageDrop?.components ||
        components.filter(c => String(c.type || '').toLowerCase() !== 'transformer');

    const transformerComponents = results?.transformerRegulation?.transformers ||
        components.filter(c => String(c.type || '').toLowerCase() === 'transformer');

    let conductorDropVolts = vdDisplayNumber(results?.conductorVoltageDrop?.totalDropVolts, NaN);
    if (!Number.isFinite(conductorDropVolts)) {
        conductorDropVolts = conductorComponents.reduce((sum, c) => sum + vdDisplayNumber(c.dropVolts, 0), 0);
    }

    let conductorDropPercent = vdDisplayNumber(results?.conductorVoltageDrop?.totalDropPercent, NaN);
    if (!Number.isFinite(conductorDropPercent)) {
        conductorDropPercent = basisVoltage > 0 ? conductorDropVolts / basisVoltage * 100 : 0;
    }

    const transformerDropVolts = vdDisplayNumber(
        results?.transformerRegulation?.totalDropVolts,
        transformerComponents.reduce((sum, c) => sum + vdDisplayNumber(c.dropVolts, 0), 0)
    );

    const transformerDropPercent = vdDisplayNumber(
        results?.transformerRegulation?.totalDropPercent,
        transformerComponents.reduce((sum, c) => sum + vdDisplayNumber(c.dropPercent, 0), 0)
    );

    const highestTransformerLoading = vdDisplayNumber(
        results?.transformerRegulation?.highestLoading,
        transformerComponents.reduce((max, c) => Math.max(max, vdDisplayNumber(c.loading, 0)), 0)
    );

    const voltageAtLoad = vdDisplayNumber(
        results?.actualVoltageAtLoad,
        vdDisplayNumber(results?.loadVoltage,
        vdDisplayNumber(results?.systemVoltageProfile?.voltageAtLoad, nominalLoadVoltage - conductorDropVolts))
    );

    const profileBasisVoltage = nominalLoadVoltage > 0 ? nominalLoadVoltage : basisVoltage;
    const systemDropVolts = profileBasisVoltage > 0 ? profileBasisVoltage - voltageAtLoad : 0;
    const systemDropPercent = profileBasisVoltage > 0 ? systemDropVolts / profileBasisVoltage * 100 : 0;

    return {
        basisVoltage,
        nominalLoadVoltage,
        tapAdjustedNominal,
        profileBasisVoltage,
        components,
        conductorComponents,
        transformerComponents,
        conductorDropVolts,
        conductorDropPercent,
        transformerDropVolts,
        transformerDropPercent,
        highestTransformerLoading,
        systemDropVolts,
        systemDropPercent,
        voltageAtLoad
    };
}

function getVoltageDropStatusVisuals(status) {
    const s = String(status || '').toUpperCase();
    if (s === 'NON-COMPLIANT' || s === 'FAIL') return { className: 'danger', icon: '❌' };
    if (s === 'WARNING' || s === 'REVIEW') return { className: 'warning', icon: '⚠️' };
    if (s === 'ACCEPTABLE' || s === 'INFO') return { className: 'info', icon: 'ℹ️' };
    return { className: 'success', icon: '✅' };
}

/**
 * Generate voltage drop display HTML
 * Updated 2026-05-11: separates conductor VD, transformer regulation, and system voltage profile.
 */
function generateVoltageDropDisplay(busId, results) {
    if (!results) return '<div class="alert alert-info">No voltage drop data available.</div>';

    const breakdown = getVoltageDropDisplayBreakdown(results);
    const compliance = results.compliance || { status: 'UNKNOWN', feederLimit: 3, branchLimit: 3, combinedLimit: 5 };
    const statusVisual = getVoltageDropStatusVisuals(compliance.status);
    const sourceVoltage = vdDisplayNumber(results.sourceVoltage, vdDisplayNumber(results.busVoltage, 0));

    return `
        <div class="results-section voltage-drop-results-enhanced">
            <h3>📉 Voltage Drop Analysis</h3>

            <div class="stats-grid vd-summary-grid">
                <div class="stat-card ${statusVisual.className}">
                    <div class="stat-icon">${statusVisual.icon}</div>
                    <div class="stat-value">${breakdown.conductorDropPercent.toFixed(3)}%</div>
                    <div class="stat-label">Conductor VD</div>
                </div>
                <div class="stat-card info">
                    <div class="stat-icon">🔧</div>
                    <div class="stat-value">${breakdown.transformerDropPercent.toFixed(3)}%</div>
                    <div class="stat-label">Transformer Reg.</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⚡</div>
                    <div class="stat-value">${breakdown.voltageAtLoad.toFixed(2)} V</div>
                    <div class="stat-label">Voltage at Load</div>
                </div>
                <div class="stat-card ${breakdown.systemDropPercent > 5 ? 'warning' : 'info'}">
                    <div class="stat-icon">📈</div>
                    <div class="stat-value">${breakdown.systemDropPercent.toFixed(3)}%</div>
                    <div class="stat-label">System Profile</div>
                </div>
            </div>

            ${generateVoltageAnalysisSection(sourceVoltage, breakdown)}
            ${generateVoltageDropCompliance(breakdown, compliance, statusVisual.className, statusVisual.icon)}
            ${generateVoltageDropTable(results, breakdown)}

            <div class="vd-note">
                <strong>Note:</strong> Conductor VD is used for compliance checking. Transformer regulation remains visible as a separate equipment/loading item and is included only in the System Voltage Profile.
            </div>

            <div class="button-group">
                <button class="btn btn-info" data-action="view-steps" data-calc="voltagedrop">📝 View Detailed Calculations</button>
                <button class="btn btn-primary" onclick="showSystemVoltageDropSteps()">📉 System-Wide VD Calculation</button>
                <button class="btn btn-success" onclick="exportSystemVoltageDropCalculation()">📄 Export System VD</button>
            </div>
        </div>
    `;
}

function generateVoltageAnalysisSection(sourceVoltage, breakdown) {
    const profileBasisVoltage = vdDisplayNumber(breakdown.profileBasisVoltage, vdDisplayNumber(sourceVoltage, 0));
    if (!profileBasisVoltage || profileBasisVoltage === 0) return '';

    const loadPct = profileBasisVoltage > 0 ? (breakdown.voltageAtLoad / profileBasisVoltage) * 100 : 0;

    return `
        <div class="result-section voltage-profile-section">
            <h5>⚡ System Voltage Profile</h5>
            <div class="voltage-profile-grid">
                <div class="profile-item">
                    <strong>Nominal Load Voltage:</strong><br>
                    <span class="voltage-value">${profileBasisVoltage.toFixed(2)} V</span><br>
                    <small>(100.00%)</small>
                </div>
                <div class="profile-item">
                    <strong>Voltage at Load:</strong><br>
                    <span class="voltage-value ${loadPct < 95 ? 'warning' : 'success'}">${breakdown.voltageAtLoad.toFixed(2)} V</span><br>
                    <small>(${loadPct.toFixed(2)}%)</small>
                </div>
                <div class="profile-item">
                    <strong>System Profile Deviation:</strong><br>
                    <span class="voltage-value">${breakdown.systemDropVolts.toFixed(2)} V</span><br>
                    <small>(${breakdown.systemDropPercent.toFixed(3)}%) at final bus voltage level</small>
                </div>
            </div>
        </div>
    `;
}

function generateVoltageDropCompliance(breakdown, compliance, complianceClass, complianceIcon) {
    const feederLimit = vdDisplayNumber(compliance.feederLimit, 3);
    const branchLimit = vdDisplayNumber(compliance.branchLimit, 3);
    const combinedLimit = vdDisplayNumber(compliance.combinedLimit, 5);
    const checked = breakdown.conductorDropPercent;
    return `
        <div class="compliance-status ${complianceClass} vd-compliance-panel">
            <h4>${complianceIcon} Conductor Voltage Drop Compliance: ${String(compliance.status || 'UNKNOWN').toUpperCase()}</h4>
            <div class="vd-note">Checked value is conductor voltage drop only. Transformer regulation/loading is shown separately.</div>
            <div class="compliance-details">
                <div class="compliance-item"><span class="compliance-label">Feeder Conductors:</span><span class="compliance-limit">${feederLimit}% max</span><span class="compliance-check">${checked <= feederLimit ? '✓' : '✗'}</span></div>
                <div class="compliance-item"><span class="compliance-label">Branch Circuits:</span><span class="compliance-limit">${branchLimit}% max</span><span class="compliance-check">${checked <= branchLimit ? '✓' : '✗'}</span></div>
                <div class="compliance-item"><span class="compliance-label">Combined Conductors:</span><span class="compliance-limit">${combinedLimit}% max</span><span class="compliance-check">${checked <= combinedLimit ? '✓' : '✗'}</span></div>
            </div>
            <div class="vd-checked-value">Checked Value: <strong>${checked.toFixed(3)}%</strong> conductor voltage drop</div>
        </div>
    `;
}

function generateVoltageDropTable(results, breakdown) {
    const components = results.components || [];
    if (components.length === 0) return '<div class="alert alert-info">No component breakdown available.</div>';

    const rows = components.map(comp => {
        const isTransformer = String(comp.type || '').toLowerCase() === 'transformer';
        const severity = comp.severity || 'LOW';
        let statusClass = 'ok';
        if (severity === 'CRITICAL') statusClass = 'critical';
        else if (severity === 'HIGH') statusClass = 'high';
        else if (severity === 'MEDIUM') statusClass = 'medium';
        return `
            <tr class="${isTransformer ? 'vd-row-transformer' : 'vd-row-conductor'}">
                <td>${comp.step || ''}</td>
                <td>${comp.type || 'N/A'}</td>
                <td>${comp.name || comp.tag || 'N/A'}</td>
                <td>${vdDisplayNumber(comp.current, 0).toFixed(1)}</td>
                <td>${vdDisplayNumber(comp.dropVolts, 0).toFixed(3)}</td>
                <td>${vdDisplayNumber(comp.dropPercent, 0).toFixed(3)}</td>
                <td>${isTransformer ? 'Transformer Regulation' : 'Conductor VD'}</td>
                <td><span class="status-badge ${statusClass}">${severity}</span></td>
            </tr>
        `;
    }).join('');

    return `
        <div class="component-breakdown vd-component-breakdown">
            <h4>📊 Component-by-Component Breakdown</h4>
            <table class="breakdown-table vd-table">
                <thead>
                    <tr>
                        <th>Step</th><th>Type</th><th>Component</th><th>Current (A)</th><th>Drop (V)</th><th>Drop (%)</th><th>Basis</th><th>Status</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
                <tfoot>
                    <tr class="vd-row-total vd-row-conductor-total"><td colspan="4">CONDUCTOR TOTAL</td><td>${breakdown.conductorDropVolts.toFixed(3)} V</td><td>${breakdown.conductorDropPercent.toFixed(3)}%</td><td colspan="2">Compliance basis</td></tr>
                    <tr class="vd-row-total vd-row-transformer-total"><td colspan="4">TRANSFORMER REG.</td><td>${breakdown.transformerDropVolts.toFixed(3)} V</td><td>${breakdown.transformerDropPercent.toFixed(3)}%</td><td colspan="2">Equipment regulation/loading</td></tr>
                    <tr class="vd-row-total vd-row-system-total"><td colspan="4">SYSTEM VOLTAGE PROFILE</td><td>${breakdown.systemDropVolts.toFixed(3)} V</td><td>${breakdown.systemDropPercent.toFixed(3)}%</td><td colspan="2">Includes conductor VD + transformer regulation</td></tr>
                </tfoot>
            </table>
        </div>
    `;
}

function buildSystemVoltageDropRegistry() {
    const registry = new Map();
    const busSummaries = [];
    (Array.isArray(buses) ? buses : []).filter(b => b && b.results && b.results.voltageDrop).forEach(bus => {
        const vd = bus.results.voltageDrop;
        const breakdown = getVoltageDropDisplayBreakdown(vd);
        busSummaries.push({ bus, vd, breakdown });
        (vd.components || []).forEach(comp => {
            const key = [comp.type || 'component', comp.tag || comp.name || '', comp.fromBus || '', comp.toBus || ''].join('|');
            if (!registry.has(key)) registry.set(key, { component: comp, usedBy: [] });
            registry.get(key).usedBy.push(bus.name || bus.id);
        });
    });
    return { registry, busSummaries };
}

function generateSystemVoltageDropCalculationText() {
    const { registry, busSummaries } = buildSystemVoltageDropRegistry();
    const timestamp = (typeof getCalculationTimestamp === 'function') ? getCalculationTimestamp() : new Date().toISOString();
    const engineer = document.getElementById('engineer')?.value || 'Unknown';
    const project = document.getElementById('projectName')?.value || 'Untitled';
    let text = '';
    text += '═'.repeat(100) + '\nSYSTEM-WIDE VOLTAGE DROP CALCULATION\n' + '═'.repeat(100) + '\n\n';
    text += `Project: ${project}\nEngineer: ${engineer}\nDate/Time: ${timestamp}\n`;
    text += 'Basis: Conductor VD compliance separated from transformer regulation/loading\n\n';
    if (busSummaries.length === 0) return text + 'No voltage-drop results are available. Run calculations first.\n';

    const worstConductor = busSummaries.reduce((max, item) => item.breakdown.conductorDropPercent > max.breakdown.conductorDropPercent ? item : max, busSummaries[0]);
    const worstSystem = busSummaries.reduce((max, item) => item.breakdown.systemDropPercent > max.breakdown.systemDropPercent ? item : max, busSummaries[0]);
    const lowestVoltage = busSummaries.reduce((min, item) => item.breakdown.voltageAtLoad < min.breakdown.voltageAtLoad ? item : min, busSummaries[0]);

    text += 'SYSTEM SUMMARY\n' + '─'.repeat(100) + '\n';
    text += `Buses Analyzed: ${busSummaries.length}\nUnique Component Steps: ${registry.size}\n`;
    text += `Worst Conductor VD: ${worstConductor.breakdown.conductorDropPercent.toFixed(3)}% at ${worstConductor.bus.name}\n`;
    text += `Worst System Profile: ${worstSystem.breakdown.systemDropPercent.toFixed(3)}% at ${worstSystem.bus.name}\n`;
    text += `Lowest Voltage at Load: ${lowestVoltage.breakdown.voltageAtLoad.toFixed(2)} V at ${lowestVoltage.bus.name}\n\n`;

    text += 'BUS VOLTAGE DROP SUMMARY\n' + '─'.repeat(100) + '\n';
    text += 'Bus'.padEnd(28) + 'Voltage'.padEnd(12) + 'Conductor VD'.padEnd(16) + 'Transformer Reg'.padEnd(18) + 'System Profile'.padEnd(18) + 'Voltage at Load\n';
    text += '─'.repeat(100) + '\n';
    busSummaries.forEach(item => {
        text += String(item.bus.name || item.bus.id).substring(0, 27).padEnd(28);
        text += String((item.bus.voltage || 0) + ' V').padEnd(12);
        text += (item.breakdown.conductorDropPercent.toFixed(3) + '%').padEnd(16);
        text += (item.breakdown.transformerDropPercent.toFixed(3) + '%').padEnd(18);
        text += (item.breakdown.systemDropPercent.toFixed(3) + '%').padEnd(18);
        text += item.breakdown.voltageAtLoad.toFixed(2) + ' V\n';
    });
    text += '\nUNIQUE COMPONENT CALCULATION STEPS\n' + '═'.repeat(100) + '\n\n';
    let stepNo = 1;
    registry.forEach(entry => {
        const c = entry.component;
        const isTransformer = String(c.type || '').toLowerCase() === 'transformer';
        text += `COMPONENT VD-${String(stepNo).padStart(3, '0')}: ${String(c.type || 'component').toUpperCase()}\n`;
        text += '─'.repeat(100) + '\n';
        text += `Tag/Name: ${c.tag || c.name || 'N/A'}\nFrom/To: ${c.fromBus || 'N/A'} → ${c.toBus || 'N/A'}\n`;
        text += `Current: ${vdDisplayNumber(c.current, 0).toFixed(2)} A\nVoltage Level: ${vdDisplayNumber(c.voltageLevel, 0).toFixed(0)} V\n`;
        text += `Drop: ${vdDisplayNumber(c.dropVolts, 0).toFixed(3)} V (${vdDisplayNumber(c.dropPercent, 0).toFixed(3)}%)\n`;
        text += `Basis: ${isTransformer ? 'Transformer regulation/loading; excluded from conductor VD compliance' : 'Conductor voltage drop; included in compliance basis'}\n`;
        text += `Used By Buses: ${[...new Set(entry.usedBy)].join(', ')}\n\n`;
        stepNo++;
    });
    return text + 'END OF SYSTEM-WIDE VOLTAGE DROP CALCULATION\n' + '═'.repeat(100) + '\n';
}

function showSystemVoltageDropSteps() {
    const steps = generateSystemVoltageDropCalculationText();
    document.getElementById('calcStepsOverlay')?.remove();

    const escapeHtml = (s) => String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const overlay = document.createElement('div');
    overlay.id = 'calcStepsOverlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.55)';
    overlay.style.zIndex = '99999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';

    overlay.innerHTML = `
        <div style="background:#fff;color:#111;width:min(1000px,95vw);max-height:90vh;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);display:flex;flex-direction:column;overflow:hidden;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #ddd;">
                <h3 style="margin:0;">System-Wide Voltage Drop Calculation</h3>
                <button id="calcStepsClose" class="btn btn-secondary">Close</button>
            </div>
            <pre style="margin:0;padding:18px;overflow:auto;white-space:pre-wrap;font-family:Consolas,'Courier New',monospace;font-size:13px;line-height:1.45;flex:1;">${escapeHtml(steps)}</pre>
            <div style="display:flex;justify-content:flex-end;align-items:center;gap:14px;padding:14px 18px;border-top:1px solid #ddd;background:#f6f7f9;">
                <button id="systemVdA4HtmlOpen" style="padding:14px 28px;border:none;border-radius:10px;background:linear-gradient(135deg,#6610f2,#7b2ff7);color:#ffffff;font-size:16px;font-weight:600;cursor:pointer;">🌐 Open A4 HTML</button>
                <button id="systemVdA4HtmlDownload" style="padding:14px 28px;border:none;border-radius:10px;background:#495057;color:#ffffff;font-size:16px;font-weight:600;cursor:pointer;">📄 Download A4 HTML</button>
                <button id="systemVdExport" class="btn btn-success">Export TXT</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    overlay.querySelector('#calcStepsClose')?.addEventListener('click', () => overlay.remove());
    overlay.querySelector('#systemVdExport')?.addEventListener('click', exportSystemVoltageDropCalculation);
    overlay.querySelector('#systemVdA4HtmlOpen')?.addEventListener('click', function () {
        if (typeof showAllBusVoltageDropReportHTML === 'function') {
            showAllBusVoltageDropReportHTML();
        } else {
            alert('Voltage Drop A4 HTML report function is not loaded.');
        }
    });
    overlay.querySelector('#systemVdA4HtmlDownload')?.addEventListener('click', function () {
        if (typeof exportAllBusVoltageDropReportHTML === 'function') {
            exportAllBusVoltageDropReportHTML();
        } else {
            alert('Voltage Drop A4 HTML export function is not loaded.');
        }
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function exportSystemVoltageDropCalculation() {
    const text = generateSystemVoltageDropCalculationText();
    const project = (document.getElementById('projectName')?.value || 'Project').replace(/\s+/g, '_');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${project}_System_Voltage_Drop_Calculation_${stamp}.txt`;
    if (typeof downloadTextFile === 'function') return downloadTextFile(text, fileName);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function generateArcFlashUnavailableDisplay(busId, status, reason) {
    let title = 'Arc Flash Not Calculated';
    let detail = reason || 'Arc flash was not performed for this bus.';
    let badgeText = 'Skipped';
    let alertClass = 'warning';

    if (status === 'external-study-required') {
        title = 'External HV Arc-Flash Study Required';
        badgeText = 'External Study';
        alertClass = 'warning';
    } else if (status === 'not-applicable-source') {
        title = 'Arc Flash Not Applicable for Utility Source Bus';
        badgeText = 'Not Applicable';
        alertClass = 'info';
    } else if (status === 'below-supported-range') {
        title = 'Arc Flash Voltage Below Supported Range';
        badgeText = 'Out of Range';
        alertClass = 'warning';
    } else if (status === 'invalid-voltage') {
        title = 'Arc Flash Not Calculated - Invalid Voltage';
        badgeText = 'Invalid Input';
        alertClass = 'danger';
    }

    return `
        <div class="results-section">
            <h3>🔥 Arc Flash Hazard Analysis</h3>

            <div class="alert alert-${alertClass}" style="margin-bottom: 20px;">
                <h4 style="margin-top: 0;">ℹ️ ${title}</h4>
                <p style="margin-bottom: 0;">${detail}</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">⚠️</div>
                    <div class="stat-value">N/A</div>
                    <div class="stat-label">Incident Energy (cal/cm²)</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">📏</div>
                    <div class="stat-value">N/A</div>
                    <div class="stat-label">Arc Flash Boundary</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">🦺</div>
                    <div class="stat-value">N/A</div>
                    <div class="stat-label">PPE Category</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">ℹ️</div>
                    <div class="stat-value">${badgeText}</div>
                    <div class="stat-label">Arc Flash Status</div>
                </div>
            </div>

            <div class="result-item" style="margin-top: 20px;">
                <strong>Status Details:</strong><br>
                ${detail}
            </div>

            <div class="alert alert-info" style="margin-top: 20px;">
                <strong>Note:</strong>
                This does not affect short-circuit, load flow, or voltage drop results.
                Where required, provide a separate external arc-flash evaluation for this bus/equipment.
            </div>
        </div>
    `;
}

function generateArcFlashDisplay(busId, results) {
    if (!results) return '<div class="alert alert-info">No arc flash data available.</div>';
    
    const incidentEnergy = results.incidentEnergy || 0;
    const arcFlashBoundary = results.arcFlashBoundary || 0;
    const ppeCategory = results.ppeCategory || 0;
    const hazardLevel = results.hazardLevel || 'Unknown';
    
    // Determine hazard class
    let hazardClass = 'success';
    let hazardIcon = '✅';
    if (incidentEnergy >= 40) {
        hazardClass = 'danger';
        hazardIcon = '❌';
    } else if (incidentEnergy >= 25) {
        hazardClass = 'danger';
        hazardIcon = '⚠️';
    } else if (incidentEnergy >= 8) {
        hazardClass = 'warning';
        hazardIcon = '⚠️';
    } else if (incidentEnergy >= 4) {
        hazardClass = 'warning';
        hazardIcon = 'ℹ️';
    }
    
    return `
        <div class="results-section">
            <h3>🔥 Arc Flash Hazard Analysis</h3>
            
            <div class="stats-grid">
                <div class="stat-card ${hazardClass}">
                    <div class="stat-icon">${hazardIcon}</div>
                    <div class="stat-value">${incidentEnergy.toFixed(2)}</div>
                    <div class="stat-label">Incident Energy (cal/cm²)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📏</div>
                    <div class="stat-value">${(arcFlashBoundary / 12).toFixed(2)}</div>
                    <div class="stat-label">Arc Flash Boundary (ft)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🦺</div>
                    <div class="stat-value">${ppeCategory}</div>
                    <div class="stat-label">PPE Category</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⚡</div>
                    <div class="stat-value">${results.arcingCurrentKA.toFixed(2)}</div>
                    <div class="stat-label">Arcing Current (kA)</div>
                </div>
            </div>
            
            ${generateArcFlashHazardSection(incidentEnergy, hazardLevel, hazardClass)}
            ${generatePPERequirementsSection(results)}
            ${generateArcFlashParametersTable(results)}
            ${generateEquipmentLabelSection(results)}
            
            <div class="button-group">
                <button class="btn btn-info" data-action="view-steps" data-calc="arcflash">
                    📝 View Detailed Calculations
                </button>
                <button class="btn btn-success" onclick="exportArcFlashReport('${busId}')">
                    📄 Export Report
                </button>
                <button class="btn btn-warning" onclick="generateArcFlashLabel('${busId}')">
                    🏷️ Generate Warning Label
                </button>
            </div>
        </div>
    `;
}

/**
 * Generate arc flash hazard section
 */
function generateArcFlashHazardSection(incidentEnergy, hazardLevel, hazardClass) {
    let hazardDescription = '';
    let recommendations = [];
    
    if (incidentEnergy < 1.2) {
        hazardDescription = 'Limited hazard - minimal risk of burns';
        recommendations = [
            'Non-melting or FR clothing recommended',
            'Standard safety glasses',
            'Leather work gloves'
        ];
    } else if (incidentEnergy < 4) {
        hazardDescription = 'Low hazard - potential for second-degree burns';
        recommendations = [
            'FR long-sleeve shirt and pants required',
            'Arc-rated face shield',
            'Arc-rated gloves',
            'Hard hat with arc rating'
        ];
    } else if (incidentEnergy < 8) {
        hazardDescription = 'Moderate hazard - significant burn risk';
        recommendations = [
            'FR clothing system required',
            'Arc-rated face shield with balaclava',
            'Heavy-duty arc-rated gloves',
            'Full body coverage mandatory'
        ];
    } else if (incidentEnergy < 25) {
        hazardDescription = 'High hazard - severe burn risk';
        recommendations = [
            'Arc flash suit required',
            'Full face shield with hood',
            'Multi-layer protection',
            'Second person for observation',
            'Consider remote operation'
        ];
    } else if (incidentEnergy < 40) {
        hazardDescription = 'Very high hazard - life-threatening';
        recommendations = [
            'Multi-layer arc flash suit required',
            'Maximum protection PPE',
            'Second person mandatory',
            'Remote operation strongly recommended',
            'Energized work permit required'
        ];
    } else {
        hazardDescription = 'Extreme hazard - immediately dangerous';
        recommendations = [
            'DO NOT perform energized work',
            'De-energize and lock out required',
            'Remote operation mandatory if possible',
            'Maximum protection if work unavoidable',
            'Engineering controls required'
        ];
    }
    
    return `
        <div class="alert alert-${hazardClass}">
            <h4>⚠️ HAZARD ASSESSMENT: ${hazardLevel.toUpperCase()}</h4>
            <div class="hazard-details">
                <p><strong>Description:</strong> ${hazardDescription}</p>
                <p><strong>Incident Energy:</strong> ${incidentEnergy.toFixed(2)} cal/cm² at working distance</p>
                
                <h5>🛡️ Safety Requirements:</h5>
                <ul>
                    ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
                
                <p class="text-muted" style="margin-top: 10px;">
                    <small>Per IEEE 1584-2018, IEEE 1584-2002, and NFPA 70E-2021</small>
                </p>
            </div>
        </div>
    `;
}

/**
 * Generate PPE requirements section
 */
function generatePPERequirementsSection(results) {
    const ppe = results.ppeRequirements || {};
    const ppeCategory = results.ppeCategory || 0;
    
    return `
        <div class="ppe-requirements">
            <h4>🦺 Required Personal Protective Equipment</h4>
            
            <div class="ppe-category-badge">
                <span class="badge badge-danger" style="font-size: 1.5em; padding: 10px 20px;">
                    PPE CATEGORY ${ppeCategory}
                </span>
                <span style="margin-left: 15px;">Minimum Arc Rating: ${ppe.cal || 0} cal/cm²</span>
            </div>
            
            <div class="ppe-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 15px;">
                <div class="ppe-item">
                    <h5>👔 Body Protection</h5>
                    <p>${ppe.clothing || 'Standard FR clothing'}</p>
                    <small>Arc-rated minimum: ${ppe.cal || 0} cal/cm²</small>
                </div>
                
                <div class="ppe-item">
                    <h5>👷 Head Protection</h5>
                    <p>${ppeCategory >= 2 ? 'Arc-rated face shield with balaclava' : 'Arc-rated face shield'}</p>
                    <small>Hard hat (Class E) required</small>
                </div>
                
                <div class="ppe-item">
                    <h5>🧤 Hand Protection</h5>
                    <p>${ppeCategory >= 2 ? 'Heavy-duty leather gloves over rubber insulating gloves' : 'Arc-rated gloves'}</p>
                    <small>Arc-rated ${ppe.cal || 0} cal/cm² minimum</small>
                </div>
                
                <div class="ppe-item">
                    <h5>👢 Foot Protection</h5>
                    <p>Leather work boots (no synthetics)</p>
                    <small>Steel toe ASTM F2413 compliant</small>
                </div>
            </div>
            
            ${ppeCategory >= 3 ? `
                <div class="alert alert-danger" style="margin-top: 15px;">
                    <h5>⚠️ Additional Requirements for Category ${ppeCategory}:</h5>
                    <ul>
                        <li>Arc flash suit hood with integrated face shield</li>
                        <li>Arc-rated hearing protection</li>
                        <li>FR underwear recommended</li>
                        <li>Second person for observation (NFPA 70E requirement)</li>
                        <li>Consider remote operation if available</li>
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Generate arc flash parameters table
 */
function generateArcFlashParametersTable(results) {
    return `
        <h4>📊 Calculation Parameters</h4>
        <table class="breakdown-table">
            <thead>
                <tr>
                    <th>Parameter</th>
                    <th>Value</th>
                    <th>Standard/Reference</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>System Voltage</td>
                    <td>${results.voltage} V</td>
                    <td>System nominal voltage</td>
                </tr>
                <tr>
                    <td>Bolted Fault Current</td>
                    <td>${(results.boltedFaultCurrent / 1000).toFixed(3)} kA</td>
                    <td>From short circuit analysis</td>
                </tr>
                <tr>
                    <td>Arcing Current</td>
                    <td>${results.arcingCurrentKA.toFixed(3)} kA</td>
                    <td>IEEE 1584-2018/2002 (85% factor)</td>
                </tr>
                <tr>
                    <td>Clearing Time</td>
                    <td>${results.clearingTimeCycles.toFixed(1)} cycles (${results.clearingTimeSec.toFixed(3)} sec)</td>
                    <td>Protective device</td>
                </tr>
                <tr>
                    <td>Working Distance</td>
                    <td>${results.workingDistance} inches</td>
                    <td>IEEE 1584-2018/2002 Table 4.5</td>
                </tr>
                <tr>
                    <td>Equipment Type</td>
                    <td>${results.equipmentType}</td>
                    <td>IEEE 1584-2018/2002</td>
                </tr>
                <tr>
                    <td>Electrode Gap</td>
                    <td>${results.electrodeGap} mm</td>
                    <td>IEEE 1584-2018/2002</td>
                </tr>
            </tbody>
        </table>
    `;
}

/**
 * Generate equipment label section
 */
function generateEquipmentLabelSection(results) {
    const boundaryFeet = (results.arcFlashBoundary / 12).toFixed(1);
    const ppe = results.ppeRequirements || {};
    
    return `
        <h4>🏷️ Equipment Warning Label (NEC 110.16)</h4>
        <div class="equipment-label" style="
            border: 3px solid #ff0000;
            background: #fff3cd;
            padding: 20px;
            margin: 15px 0;
            font-family: 'Arial Black', sans-serif;
        ">
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="font-size: 2em; color: #ff0000; font-weight: bold;">⚠️ DANGER</div>
                <div style="font-size: 1.3em; font-weight: bold; color: #000;">
                    ARC FLASH AND SHOCK HAZARD
                </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 5px;"><strong>Equipment:</strong></td>
                    <td style="padding: 5px;">${results.busTag || results.busName}</td>
                </tr>
                <tr>
                    <td style="padding: 5px;"><strong>Voltage:</strong></td>
                    <td style="padding: 5px;">${results.voltage} V</td>
                </tr>
                <tr style="background: #ffebee;">
                    <td style="padding: 5px;"><strong>Incident Energy:</strong></td>
                    <td style="padding: 5px; font-size: 1.2em; font-weight: bold;">${results.incidentEnergy.toFixed(2)} cal/cm²</td>
                </tr>
                <tr style="background: #ffebee;">
                    <td style="padding: 5px;"><strong>Arc Flash Boundary:</strong></td>
                    <td style="padding: 5px; font-size: 1.2em; font-weight: bold;">${boundaryFeet} feet</td>
                </tr>
                <tr>
                    <td style="padding: 5px;"><strong>Working Distance:</strong></td>
                    <td style="padding: 5px;">${results.workingDistance} inches</td>
                </tr>
                <tr style="background: #e3f2fd;">
                    <td style="padding: 5px;"><strong>PPE Category:</strong></td>
                    <td style="padding: 5px; font-size: 1.2em; font-weight: bold;">${results.ppeCategory}</td>
                </tr>
                <tr style="background: #e3f2fd;">
                    <td style="padding: 5px;"><strong>Arc Rating Required:</strong></td>
                    <td style="padding: 5px; font-size: 1.2em; font-weight: bold;">${ppe.cal || 0} cal/cm²</td>
                </tr>
            </table>
            
            <div style="margin-top: 15px; padding: 10px; background: #fff; border: 1px solid #000;">
                <p style="margin: 5px 0; font-weight: bold;">
                    Appropriate PPE SHALL be worn when working on or near this equipment.
                </p>
                <p style="margin: 5px 0;">
                    See NFPA 70E for proper work practices.
                </p>
                <p style="margin: 5px 0; font-size: 0.9em;">
                    <strong>Last Calculated:</strong> ${results.calculationDate}
                </p>
            </div>
        </div>
    `;
}

// Export new arc flash function
window.generateArcFlashDisplay = generateArcFlashDisplay;

/**
 * Switch between calculation tabs
 */
function switchCalcTab(calcType) {
    // Update tab buttons
    document.querySelectorAll('.calc-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = document.querySelector(`.calc-tab[data-calc-type="${calcType}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    // Update content
    document.querySelectorAll('.calc-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const activeContent = document.getElementById(`${calcType}-content`);
    if (activeContent) activeContent.classList.add('active');
}

/**
 * Show detailed calculation steps in modal
 */
function showCalculationSteps(calcType) {
    const bus = buses.find(b => b.id === selectedBusId);
    if (!bus || !bus.results) {
        alert('No calculation data available');
        return;
    }

    let steps = '';
    let title = '';

    switch (calcType) {
        case 'shortcircuit':
            steps = bus.results.shortCircuit?.calculationSteps || 'No steps available';
            title = 'Short Circuit Calculation Steps';
            break;

        case 'loadflow':
            steps = bus.results.loadFlow?.calculationSteps || 'No steps available';
            title = 'Load Flow Calculation Steps';
            break;

        case 'protection':
            steps = bus.results.protection?.calculationSteps || 'No steps available';
            title = 'Protection Calculation Steps';
            break;

        case 'voltagedrop':
            steps = bus.results.voltageDrop?.calculationSteps || 'No steps available';
            title = 'Voltage Drop Calculation Steps';
            break;

        case 'arcflash':
            steps = bus.results.arcFlash?.calculationSteps || 'No steps available';
            title = 'Arc Flash Analysis Steps';
            break;

        default:
            steps = 'No steps available';
            title = 'Calculation Steps';
    }

    // Ensure steps is a string
    if (typeof steps !== 'string') {
        try {
            steps = JSON.stringify(steps, null, 2);
        } catch (e) {
            steps = String(steps);
        }
    }

    // Proper HTML escaping
    const escapeHtml = (s) => String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Remove any existing overlay
    document.getElementById('calcStepsOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'calcStepsOverlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.55)';
    overlay.style.zIndex = '99999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';

    overlay.innerHTML = `
        <div style="width:min(980px,100%); max-height:90vh; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.35);">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#f6f7f9;">
                <h3 style="margin:0;font-size:16px;">${title}</h3>
                <button id="calcStepsClose" title="Close" style="border:none;background:transparent;font-size:18px;cursor:pointer;">✕</button>
            </div>

            <div style="padding:12px 16px; overflow:auto; max-height: calc(90vh - 110px);">
                <pre style="white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 12.5px; line-height: 1.35; margin: 0;">${escapeHtml(steps)}</pre>
            </div>

            <div style="display:flex;justify-content:flex-end;gap:10px;padding:10px 16px;background:#f6f7f9;">
                <button id="calcStepsCopy" class="btn btn-primary">📋 Copy to Clipboard</button>
                <button id="calcStepsClose2" class="btn btn-secondary">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const close = () => {
        try { overlay.remove(); } catch (_) {}
    };

    overlay.querySelector('#calcStepsClose')?.addEventListener('click', close);
    overlay.querySelector('#calcStepsClose2')?.addEventListener('click', close);

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    overlay.querySelector('#calcStepsCopy')?.addEventListener('click', () => {
        copyToClipboard(steps);
    });
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('❌ Failed to copy to clipboard');
    });
}

// Export functions
window.displayCalculationResults = displayCalculationResults;
window.generateShortCircuitDisplay = generateShortCircuitDisplay;
window.generateLoadFlowDisplay = generateLoadFlowDisplay;
window.generateVoltageDropDisplay = generateVoltageDropDisplay;
window.switchCalcTab = switchCalcTab;
window.showCalculationSteps = showCalculationSteps;
window.copyToClipboard = copyToClipboard;
window.showSystemVoltageDropSteps = showSystemVoltageDropSteps;
window.generateSystemVoltageDropCalculationText = generateSystemVoltageDropCalculationText;
window.exportSystemVoltageDropCalculation = exportSystemVoltageDropCalculation;
window.displayDemandFactorAnalysis = displayDemandFactorAnalysis;

// ═══════════════════════════════════════════════════════════════════════
// PHASE 3 ADDITIONS: IEC 60909 and Complete Fault Types Display
// Added: 2026-02-02
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generate IEC 60909 display
 */
function generateIEC60909Display(busId, results) {
  const calcType = (results?.calculationType || 'max');

  const fc = results?.faultCurrents || {};
  const imp = results?.impedance || {};
  const totImp = results?.totalImpedance || {};

  const ik = n(results?.initialSymmetricalCurrentKA, n(fc?.threePhaseSym, 0));
  const ip = n(results?.peakCurrentKA, n(fc?.threePhaseAsym, 0));
  const ib = n(results?.breakingCurrentKA, ik);
  const iss = n(results?.steadyStateCurrentKA, ik);
  const ilg = n(results?.lineToGroundCurrentKA, n(fc?.lineToGround, 0));

  const kappa = n(results?.peakFactor, 0);
  const cFactor = n(results?.voltageFactor, 0);

  const r = n(imp.r, n(totImp.resistance, 0));
  const x = n(imp.x, n(totImp.reactance, 0));
  const z = n(imp.z, n(totImp.magnitude, 0));
  const xr = n(imp.xrRatio, (r !== 0 ? (x / r) : n(results?.xrRatio, 0)));

  const methodLabel = `IEC 60909 (${calcType === 'max' ? 'MAX' : 'MIN'})`;

  return `
#### ⚡ Fault Current Results

${methodLabel} Method

⚡
${ik.toFixed(3)}
3-Phase Sym (kA)

📈
${ip.toFixed(3)}
3-Phase Asym/Peak (kA)

🔄
${xr.toFixed(2)}
X/R Ratio

⚙️
${(z * 1000).toFixed(1)}
Total Z (mΩ)

##### 📋 IEC 60909 Currents

Initial Symmetrical (I"k): ${ik.toFixed(3)} kA  
Peak Current (ip): ${ip.toFixed(3)} kA  
Breaking Current (Ib): ${ib.toFixed(3)} kA  
Steady-State (Ik): ${iss.toFixed(3)} kA  
Line-to-Ground (Ik1): ${ilg.toFixed(3)} kA  

##### 📋 IEC Factors

κ Peak Factor: ${kappa.toFixed(3)}  
c Voltage Factor: ${cFactor.toFixed(3)}  

##### 📋 Impedance Breakdown

Resistance (R): ${(r * 1000).toFixed(3)} mΩ  
Reactance (X): ${(x * 1000).toFixed(3)} mΩ  
Magnitude (Z): ${(z * 1000).toFixed(3)} mΩ  
Angle: ${(Math.atan2(x, r) * (180 / Math.PI)).toFixed(2)}°  

Standard: ${results?.standard || 'IEC 60909-0:2016'}  
Calculation Purpose: ${calcType === 'max' ? 'Equipment Rating and Selection' : 'Protection Coordination'}  
<div class="calc-actions" style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;">
  <button class="btn btn-secondary" data-action="view-steps" data-calc="shortcircuit">📝 View Detailed Calculations</button>
  <button class="btn btn-secondary" data-action="export-report" data-calc="shortcircuit" disabled title="Export coming soon">📄 Export Report</button>
</div>
`;
}

function n(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Generate complete fault types section
 */
function generateCompleteFaultTypesSection(results) {
  if (!results.allFaultTypes) return '';

  const ft = results.allFaultTypes.faults;
  // Authoritative currents from results.faultCurrents (fallback to ft if missing)
  const fc  = results?.faultCurrents || {};
  const I3  = typeof fc.threePhaseSym === 'number' ? fc.threePhaseSym : (ft?.threePhaseLLL?.currentKA ?? 0);
  const ILL = typeof fc.lineToLine    === 'number' ? fc.lineToLine    : (ft?.lineToLineLL?.currentKA ?? 0);
  const ILG = typeof fc.lineToGround  === 'number' ? fc.lineToGround  : (ft?.lineToGroundLG?.currentKA ?? 0);
  const RLL = I3 > 0 ? (ILL / I3) : (ft?.lineToLineLL?.ratio ?? null);
  const RLG = I3 > 0 ? (ILG / I3) : (ft?.lineToGroundLG?.ratio ?? null);
  const ILLG = (typeof fc.doubleLineToGround === 'number') ? fc.doubleLineToGround : (typeof ft?.doubleLineToGroundLLG?.currentKA === 'number' ? ft.doubleLineToGroundLLG.currentKA : null);
  const RLLG = (ILLG != null && I3 > 0) ? (ILLG / I3) : (ft?.doubleLineToGroundLLG?.ratio ?? null);

  const maxKA = Math.max(
    Number.isFinite(I3) ? I3 : 0,
    Number.isFinite(ILL) ? ILL : 0,
    Number.isFinite(ILG) ? ILG : 0,
    Number.isFinite(ILLG) ? ILLG : 0
  );

  let html = `
    <h4>⚡ Complete Fault Type Analysis</h4>
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Fault Type</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Current (kA)</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Ratio to 3φ</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Three-Phase (L-L-L)</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${(I3 ?? 0).toFixed(3)}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">1.000</td>
            <td style="padding: 8px; border: 1px solid #ddd;">Balanced fault</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Line-to-Line (L-L)</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${(ILL ?? 0).toFixed(3)}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${RLL != null ? RLL.toFixed(3) : '—'}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${(RLL != null && Math.abs(RLL - 0.866) < 0.05) ? '✓ Typical (0.866)' : ''}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Line-to-Ground (L-G)</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${(ILG ?? 0).toFixed(3)}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${RLG != null ? RLG.toFixed(3) : '—'}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${(RLG != null && RLG > 1.0) ? '⚠️ Exceeds 3φ' : ''}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Double L-G (L-L-G)</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${ILLG != null ? ILLG.toFixed(3) : '—'}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${RLLG != null ? RLLG.toFixed(3) : '—'}</td>
            <td style="padding: 8px; border: 1px solid #ddd;"></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="alert alert-info" style="font-size: 12px; margin-top: 10px;">
      <strong>Maximum Fault:</strong> ${maxKA.toFixed(3)} kA<br>
      <strong>Sequence Network Analysis</strong> - Per IEEE 141-1993 Chapter 5
    </div>
  `;

  return html;
}
console.log('✅ Calculation Display Module v1.3.0 loaded');
console.log('   - Demand factor display: ADDED');
console.log('   - Voltage drop v2.0.0 compatibility: FIXED');
console.log('   - Motor contribution display: WORKING');
console.log('   - Arc Flash display: WORKING');
console.log('   - Defensive checks: ENABLED');
console.log('   - IEC 60909 display: ADDED (Phase 3)');
console.log('   - Complete fault types display: ADDED (Phase 3)');
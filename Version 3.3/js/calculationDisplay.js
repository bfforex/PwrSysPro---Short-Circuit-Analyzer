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
        
        // Check if arc flash results exist
        const hasArcFlash = arcFlashResults !== null && arcFlashResults !== undefined;
        
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
                <button class="calc-tab" data-calc-type="voltagedrop" onclick="switchCalcTab('voltagedrop')">
                    📉 Voltage Drop
                </button>
                ${hasArcFlash ? `
                    <button class="calc-tab" data-calc-type="arcflash" onclick="switchCalcTab('arcflash')">
                        🔥 Arc Flash
                    </button>
                ` : ''}
            </div>
            
            <!-- Short Circuit Tab Content -->
            <div id="shortcircuit-content" class="calc-tab-content active">
                ${generateShortCircuitDisplay(busId, shortCircuitResults)}
            </div>
            
            <!-- Load Flow Tab Content -->
            <div id="loadflow-content" class="calc-tab-content">
                ${generateLoadFlowDisplay(busId, loadFlowResults)}
            </div>
            
            <!-- Voltage Drop Tab Content -->
            <div id="voltagedrop-content" class="calc-tab-content">
                ${generateVoltageDropDisplay(busId, voltageDropResults)}
            </div>
            
            ${hasArcFlash ? `
                <!-- Arc Flash Tab Content -->
                <div id="arcflash-content" class="calc-tab-content">
                    ${generateArcFlashDisplay(busId, arcFlashResults)}
                </div>
            ` : ''}
        `;
        
        resultsContainer.innerHTML = html;
        
        console.log('✅ Results displayed successfully');
        console.log(`   Arc Flash: ${hasArcFlash ? 'Available' : 'Not calculated'}`);
        
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
 */
function generateShortCircuitDisplay(busId, results) {
    if (!results) return '<div class="alert alert-info">No short circuit data available.</div>';
    
    // ✅ Defensive check: Ensure faultCurrents exists
    if (!results.faultCurrents) {
        console.error('❌ faultCurrents missing in results');
        return '<div class="alert alert-danger">Error: Fault current data missing</div>';
    }
    
    const isPerUnit = results.method === 'Per-Unit';
    
    let html = `
        <div class="results-section">
            <h3>⚡ Fault Current Results</h3>
            <div class="method-badge">
                <span class="badge ${isPerUnit ? 'badge-info' : 'badge-primary'}">${results.method || 'Point-to-Point'} Method</span>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">⚡</div>
                    <div class="stat-value">${results.faultCurrents.threePhaseSym.toFixed(2)}</div>
                    <div class="stat-label">3-Phase Sym (kA)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📈</div>
                    <div class="stat-value">${results.faultCurrents.threePhaseAsym.toFixed(2)}</div>
                    <div class="stat-label">3-Phase Asym (kA)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🔄</div>
                    <div class="stat-value">${results.xrRatio.toFixed(2)}</div>
                    <div class="stat-label">X/R Ratio</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⚙️</div>
                    <div class="stat-value">${(results.totalImpedance.magnitude * 1000).toFixed(1)}</div>
                    <div class="stat-label">Total Z (mΩ)</div>
                </div>
            </div>
            
            ${generateMotorContributionSection(results)}
            
            <h4>📋 Impedance Breakdown</h4>
            <div class="result-item">
                <strong>Resistance (R):</strong> ${(results.totalImpedance.resistance * 1000).toFixed(3)} mΩ<br>
                <strong>Reactance (X):</strong> ${(results.totalImpedance.reactance * 1000).toFixed(3)} mΩ<br>
                <strong>Magnitude (Z):</strong> ${(results.totalImpedance.magnitude * 1000).toFixed(3)} mΩ<br>
                <strong>Angle:</strong> ${results.totalImpedance.angle.toFixed(2)}°
            </div>
            
            ${generatePerUnitSection(results, isPerUnit)}
            
            <h4>📊 Other Fault Types</h4>
            <div class="result-item">
                <strong>Line-to-Ground:</strong> ${results.faultCurrents.lineToGround.toFixed(2)} kA (≈85% of 3-phase)<br>
                <strong>Line-to-Line:</strong> ${results.faultCurrents.lineToLine.toFixed(2)} kA (≈86.6% of 3-phase)
            </div>
            
            ${generateMotorDetailsTable(results)}
            
            <div class="button-group">
                <button class="btn btn-info" onclick="showCalculationSteps('shortcircuit')">
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
    // ✅ Defensive checks for motor contribution
    if (!results.motorContribution) return '';
    
    const mc = results.motorContribution;
    
    // Check if motors array exists and has items
    if (!mc.motors || !Array.isArray(mc.motors) || mc.motors.length === 0) return '';
    
    // ✅ Safe access to motor contribution properties
    const motorCount = mc.motorCount || mc.motors.length || 0;
    const totalSym = mc.totalSymmetricalContribution || (mc.motorFaultCurrent ? mc.motorFaultCurrent / 1000 : 0);
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
                <button class="btn btn-info" onclick="showCalculationSteps('loadflow')">
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

/**
 * Generate voltage drop display HTML
 * ✅ FIXED: Compatible with voltageDropCalc.js v2.0.0
 * Updated: 2025-11-01 07:36:22 UTC by bfforex
 * 
 * @param {String} busId - Bus identifier
 * @param {Object} results - Voltage drop results from v2.0.0
 */
function generateVoltageDropDisplay(busId, results) {
    if (!results) return '<div class="alert alert-info">No voltage drop data available.</div>';
    
    // ✅ NEW v2.0.0 property names (backward compatible with v1.2.2)
    const totalDropPercent = results.totalDropPercent || results.cumulativeDropPercent || 0;
    const totalDropVolts = results.totalDropVolts || results.cumulativeDropVolts || 0;
    const sourceVoltage = results.sourceVoltage || results.busVoltage || 0;
    const loadVoltage = results.loadVoltage || (sourceVoltage - totalDropVolts);
    const maxDropPercent = results.maxDropPercent || 0;
    
    // ✅ Safe access to compliance data
    const compliance = results.compliance || {
        status: 'UNKNOWN',
        feederLimit: 3,
        branchLimit: 5,
        combinedLimit: 7
    };
    
    let complianceClass = 'success';
    let complianceIcon = '✅';
    if (compliance.status === 'NON-COMPLIANT') {
        complianceClass = 'danger';
        complianceIcon = '❌';
    } else if (compliance.status === 'WARNING') {
        complianceClass = 'warning';
        complianceIcon = '⚠️';
    } else if (compliance.status === 'ACCEPTABLE') {
        complianceClass = 'info';
        complianceIcon = '✓';
    }
    
    return `
        <div class="results-section">
            <h3>📉 Voltage Drop Analysis</h3>
            
            <div class="stats-grid">
                <div class="stat-card ${complianceClass}">
                    <div class="stat-icon">${complianceIcon}</div>
                    <div class="stat-value">${totalDropPercent.toFixed(3)}%</div>
                    <div class="stat-label">Total Voltage Drop</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-value">${totalDropVolts.toFixed(2)}</div>
                    <div class="stat-label">Voltage Drop (V)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🔝</div>
                    <div class="stat-value">${maxDropPercent.toFixed(3)}%</div>
                    <div class="stat-label">Max Single Component</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📏</div>
                    <div class="stat-value">${compliance.combinedLimit}%</div>
                    <div class="stat-label">IEEE 141 Limit</div>
                </div>
            </div>
            
            ${generateVoltageAnalysisSection(sourceVoltage, loadVoltage, totalDropVolts, totalDropPercent)}
            ${generateVoltageDropCompliance(totalDropPercent, compliance, complianceClass, complianceIcon)}
            ${generateVoltageDropTable(results, totalDropPercent)}
            
            <div class="button-group">
                <button class="btn btn-info" onclick="showCalculationSteps('voltagedrop')">
                    📝 View Detailed Calculations
                </button>
                <button class="btn btn-success" onclick="exportVoltageDropReport('${busId}')">
                    📄 Export Report
                </button>
            </div>
        </div>
    `;
}

/**
 * Generate voltage analysis section (NEW in v2.0.0)
 * Shows source voltage, load voltage, and drop
 */
function generateVoltageAnalysisSection(sourceVoltage, loadVoltage, totalDropVolts, totalDropPercent) {
    if (!sourceVoltage || sourceVoltage === 0) return '';
    
    return `
        <div class="alert alert-info">
            <h4>⚡ Voltage Analysis</h4>
            <div class="voltage-analysis-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 10px;">
                <div>
                    <strong>Source Voltage:</strong><br>
                    <span style="font-size: 1.3em; color: #28a745;">${sourceVoltage.toFixed(2)} V</span><br>
                    <small>(100.00%)</small>
                </div>
                <div>
                    <strong>Voltage at Load:</strong><br>
                    <span style="font-size: 1.3em; color: ${totalDropPercent > 5 ? '#dc3545' : '#17a2b8'};">${loadVoltage.toFixed(2)} V</span><br>
                    <small>(${((loadVoltage/sourceVoltage)*100).toFixed(2)}%)</small>
                </div>
                <div>
                    <strong>Total Drop:</strong><br>
                    <span style="font-size: 1.3em; color: ${totalDropPercent > 5 ? '#dc3545' : '#ffc107'};">${totalDropVolts.toFixed(2)} V</span><br>
                    <small>(${totalDropPercent.toFixed(3)}%)</small>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate voltage drop compliance section
 * ✅ FIXED: Uses totalDropPercent parameter instead of results.cumulativeDropPercent
 */
function generateVoltageDropCompliance(totalDropPercent, compliance, complianceClass, complianceIcon) {
    return `
        <div class="compliance-status ${complianceClass}">
            <h4>${complianceIcon} IEEE 141 COMPLIANCE: ${compliance.status}</h4>
            <div class="compliance-details">
                <div class="compliance-item">
                    <span class="compliance-label">Feeder Circuits:</span>
                    <span class="compliance-limit">${compliance.feederLimit}% max</span>
                    <span class="compliance-check">${totalDropPercent <= compliance.feederLimit ? '✓' : '✗'}</span>
                </div>
                <div class="compliance-item">
                    <span class="compliance-label">Branch Circuits:</span>
                    <span class="compliance-limit">${compliance.branchLimit}% max</span>
                    <span class="compliance-check">${totalDropPercent <= compliance.branchLimit ? '✓' : '✗'}</span>
                </div>
                <div class="compliance-item">
                    <span class="compliance-label">Combined System:</span>
                    <span class="compliance-limit">${compliance.combinedLimit}% max</span>
                    <span class="compliance-check">${totalDropPercent <= compliance.combinedLimit ? '✓' : '✗'}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate voltage drop table
 * ✅ FIXED: Defensive checks for missing components
 */
function generateVoltageDropTable(results, totalDropPercent) {
    // ✅ Defensive check for components array
    const components = results.components || [];
    const totalDropVolts = results.totalDropVolts || results.cumulativeDropVolts || 0;
    const compliance = results.compliance || { status: 'UNKNOWN' };
    
    if (components.length === 0) {
        return '<div class="alert alert-warning">No component breakdown available.</div>';
    }
    
    return `
        <h4>📊 Component-by-Component Breakdown</h4>
        <div class="voltage-drop-table">
            <table class="breakdown-table">
                <thead>
                    <tr>
                        <th>Step</th>
                        <th>Type</th>
                        <th>Component</th>
                        <th>Current (A)</th>
                        <th>Drop (V)</th>
                        <th>Drop (%)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${components.map(comp => {
                        let statusClass = 'ok';
                        const severity = comp.severity || 'LOW';
                        if (severity === 'CRITICAL') statusClass = 'critical';
                        else if (severity === 'HIGH') statusClass = 'high';
                        else if (severity === 'MEDIUM') statusClass = 'medium';
                        
                        return `
                            <tr class="vd-${statusClass}">
                                <td>${comp.step || ''}</td>
                                <td>${comp.type || 'N/A'}</td>
                                <td>${comp.name || 'N/A'}</td>
                                <td>${(comp.current || 0).toFixed(1)}</td>
                                <td>${(comp.dropVolts || 0).toFixed(3)}</td>
                                <td>${(comp.dropPercent || 0).toFixed(3)}</td>
                                <td><span class="status-badge ${statusClass}">${severity}</span></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="4"><strong>TOTAL</strong></td>
                        <td><strong>${totalDropVolts.toFixed(3)} V</strong></td>
                        <td><strong>${totalDropPercent.toFixed(3)}%</strong></td>
                        <td><strong>${compliance.status}</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
}

/**
 * Generate arc flash display HTML
 * NEW: Arc Flash Analysis v1.0.0
 * Added: 2025-11-02 16:14:25 UTC by bfforex
 * 
 * @param {String} busId - Bus identifier
 * @param {Object} results - Arc flash results
 * @returns {String} HTML for arc flash display
 */
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
                <button class="btn btn-info" onclick="showCalculationSteps('arcflash')">
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
                    <small>Per IEEE 1584-2018 and NFPA 70E-2021</small>
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
                    <td>IEEE 1584-2018 (85% factor)</td>
                </tr>
                <tr>
                    <td>Clearing Time</td>
                    <td>${results.clearingTimeCycles.toFixed(1)} cycles (${results.clearingTimeSec.toFixed(3)} sec)</td>
                    <td>Protective device</td>
                </tr>
                <tr>
                    <td>Working Distance</td>
                    <td>${results.workingDistance} inches</td>
                    <td>IEEE 1584-2018 Table 4.5</td>
                </tr>
                <tr>
                    <td>Equipment Type</td>
                    <td>${results.equipmentType}</td>
                    <td>IEEE 1584-2018</td>
                </tr>
                <tr>
                    <td>Electrode Gap</td>
                    <td>${results.electrodeGap} mm</td>
                    <td>IEEE 1584-2018</td>
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
    
    switch(calcType) {
        case 'shortcircuit':
            steps = bus.results.shortCircuit?.calculationSteps || 'No steps available';
            title = 'Short Circuit Calculation Steps';
            break;
        case 'loadflow':
            steps = bus.results.loadFlow?.calculationSteps || 'No steps available';
            title = 'Load Flow Calculation Steps';
            break;
        case 'voltagedrop':
            steps = bus.results.voltageDrop?.calculationSteps || 'No steps available';
            title = 'Voltage Drop Calculation Steps';
            break;
                      case 'arcflash':
                                steps = bus.results.arcFlash?.calculationSteps || 'No steps available';
                                title = 'Arc Flash Analysis Steps';
                                break;
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <pre class="calculation-steps">${steps}</pre>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                <button class="btn btn-primary" onclick="copyToClipboard(this.closest('.modal-content').querySelector('.calculation-steps').textContent)">
                    📋 Copy to Clipboard
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
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
window.displayDemandFactorAnalysis = displayDemandFactorAnalysis;

console.log('✅ Calculation Display Module v1.3.0 loaded');
console.log('   - Demand factor display: ADDED');
console.log('   - Voltage drop v2.0.0 compatibility: FIXED');
console.log('   - Motor contribution display: WORKING');
console.log('   - Arc Flash display: WORKING');
console.log('   - Defensive checks: ENABLED');
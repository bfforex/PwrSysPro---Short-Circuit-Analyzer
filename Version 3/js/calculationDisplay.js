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
 */
function displayCalculationResults(busId, shortCircuitResults, loadFlowResults, voltageDropResults) {
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
        `;
        
        resultsContainer.innerHTML = html;
        
        console.log('✅ Results displayed successfully');
        
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
 * Generate load flow display HTML
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
    return `
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

console.log('✅ Calculation Display Module v1.2.0 loaded');
console.log('   - Voltage drop v2.0.0 compatibility: FIXED');
console.log('   - Motor contribution display: WORKING');
console.log('   - Defensive checks: ENABLED');
console.log('   - Load voltage display: ADDED');
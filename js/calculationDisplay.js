/**
 * Calculation Display Module
 * Unified display handler for all calculation types
 * 
 * @author bfforex
 * @date 2025-10-28 01:45:36 UTC
 * @version 1.0.1
 * @fixed busId scope issue in display functions
 */

/**
 * Display calculation results in separate tabs
 * 
 * @param {String} busId - Bus identifier
 * @param {Object} shortCircuitResults - Short circuit calculation results
 * @param {Object} loadFlowResults - Load flow calculation results
 * @param {Object} voltageDropResults - Voltage drop calculation results
 */
function displayCalculationResults(busId, shortCircuitResults, loadFlowResults, voltageDropResults) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (!resultsContainer) {
        logger.error('Results container not found');
        return;
    }
    
    const bus = buses.find(b => b.id === busId);
    if (!bus) return;
    
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
}

/**
 * Generate short circuit display HTML
 * Updated: 2025-10-28 04:45:03 UTC by bfforex
 * Enhanced: Show per-unit data when available
 */
function generateShortCircuitDisplay(busId, results) {
    if (!results) return '<div class="alert alert-info">No short circuit data available.</div>';
    
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
            
            ${results.motorContribution && results.motorContribution.motors.length > 0 ? `
                <div class="alert alert-success">
                    <h4>⚡ Motor Contribution Included</h4>
                    <div class="motor-contribution-details">
                        <strong>Motors Connected:</strong> ${results.motorContribution.motors.length}<br>
                        <strong>Motor Contribution:</strong> ${(results.motorContribution.motorFaultCurrent/1000).toFixed(3)} kA<br>
                        <strong>Total Impedance:</strong> ${(results.motorContribution.totalMotorZ * 1000).toFixed(3)} mΩ<br>
                        <small class="text-muted">Per IEEE 141-1993, IEC 60909, and NEC Article 430</small>
                    </div>
                </div>
            ` : ''}
            
            <h4>📋 Impedance Breakdown</h4>
            <div class="result-item">
                <strong>Resistance (R):</strong> ${(results.totalImpedance.resistance * 1000).toFixed(3)} mΩ<br>
                <strong>Reactance (X):</strong> ${(results.totalImpedance.reactance * 1000).toFixed(3)} mΩ<br>
                <strong>Magnitude (Z):</strong> ${(results.totalImpedance.magnitude * 1000).toFixed(3)} mΩ<br>
                <strong>Angle:</strong> ${results.totalImpedance.angle.toFixed(2)}°
            </div>
            
            ${isPerUnit && results.perUnit ? `
                <h4>📊 Per-Unit System Data</h4>
                <div class="result-item per-unit-data">
                    <div class="pu-section">
                        <h5>Base Values</h5>
                        <strong>Base kVA:</strong> ${results.perUnit.baseKVA.toLocaleString()} kVA<br>
                        <strong>Base Voltage:</strong> ${results.perUnit.baseVoltage} V<br>
                        <!-- ✅ FIXED: Show actual base impedance value -->
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
            ` : ''}
            
            <h4>📊 Other Fault Types</h4>
            <div class="result-item">
                <strong>Line-to-Ground:</strong> ${results.faultCurrents.lineToGround.toFixed(2)} kA (≈85% of 3-phase)<br>
                <strong>Line-to-Line:</strong> ${results.faultCurrents.lineToLine.toFixed(2)} kA (≈86.6% of 3-phase)
            </div>
            
            ${results.motorContribution && results.motorContribution.motors.length > 0 ? `
                <h4>⚙️ Motor Details</h4>
                <table class="breakdown-table">
                    <thead>
                        <tr>
                            <th>Motor</th>
                            <th>HP</th>
                            <th>Type</th>
                            <th>FLC (A)</th>
                            <th>LRC (A)</th>
                            <th>Z (Ω)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.motorContribution.motors.map(motor => `
                            <tr>
                                <td>${motor.name}</td>
                                <td>${motor.hp}</td>
                                <td>${motor.type}</td>
                                <td>${motor.flc.toFixed(1)}</td>
                                <td>${motor.lrc.toFixed(1)}</td>
                                <td>${motor.z.toFixed(6)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : ''}
            
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
 * Generate load flow display HTML
 * @param {String} busId - Bus identifier (ADDED)
 * @param {Object} results - Load flow results
 */
function generateLoadFlowDisplay(busId, results) {
    if (!results) return '<div class="alert alert-info">No load flow data available.</div>';
    
    const motorTotal = results.breakdown.motors.reduce((sum, m) => sum + m.current, 0);
    const xfmrTotal = results.breakdown.transformers.reduce((sum, t) => sum + (t.primaryCurrent || 0), 0);
    const cableTotal = results.breakdown.cables.reduce((sum, c) => sum + c.current, 0);
    const directTotal = results.breakdown.directLoads.reduce((sum, d) => sum + d.current, 0);
    
    return `
        <div class="results-section">
            <h3>🔌 Load Flow Summary</h3>
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
            
            <h4>📊 Component Details</h4>
            
            ${results.breakdown.motors.length > 0 ? `
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
            ` : ''}
            
            ${results.breakdown.transformers.length > 0 ? `
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
            ` : ''}
            
            ${results.breakdown.cables.length > 0 ? `
                <div class="component-breakdown">
                    <h5>🔌 Cables (${results.breakdown.cables.length})</h5>
                    <table class="breakdown-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Location</th>
                                <th>Size</th>
                                <th>Length (ft)</th>
                                <th>Current (A)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${results.breakdown.cables.map(cable => `
                                <tr>
                                    <td>${cable.name}</td>
                                    <td>${cable.location}</td>
                                    <td>${cable.size} ${cable.material}${cable.parallel > 1 ? ` (${cable.parallel}×)` : ''}</td>
                                    <td>${cable.length}</td>
                                    <td>${cable.current.toFixed(1)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
            
            ${results.breakdown.directLoads.length > 0 ? `
                <div class="component-breakdown">
                    <h5>💡 Direct Loads (${results.breakdown.directLoads.length})</h5>
                    <table class="breakdown-table">
                        <thead>
                            <tr>
                                <th>Bus</th>
                                <th>Current (A)</th>
                                <th>Power (kVA)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${results.breakdown.directLoads.map(load => `
                                <tr>
                                    <td>${load.bus}</td>
                                    <td>${load.current.toFixed(1)}</td>
                                    <td>${load.powerKVA.toFixed(1)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
            
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
 * Generate voltage drop display HTML
 * @param {String} busId - Bus identifier (ADDED)
 * @param {Object} results - Voltage drop results
 */
function generateVoltageDropDisplay(busId, results) {
    if (!results) return '<div class="alert alert-info">No voltage drop data available.</div>';
    
    let complianceClass = 'success';
    let complianceIcon = '✅';
    if (results.compliance.status === 'NON-COMPLIANT') {
        complianceClass = 'danger';
        complianceIcon = '❌';
    } else if (results.compliance.status === 'WARNING') {
        complianceClass = 'warning';
        complianceIcon = '⚠️';
    } else if (results.compliance.status === 'ACCEPTABLE') {
        complianceClass = 'info';
        complianceIcon = '✓';
    }
    
    return `
        <div class="results-section">
            <h3>📉 Voltage Drop Analysis</h3>
            
            <div class="stats-grid">
                <div class="stat-card ${complianceClass}">
                    <div class="stat-icon">${complianceIcon}</div>
                    <div class="stat-value">${results.cumulativeDropPercent.toFixed(3)}%</div>
                    <div class="stat-label">Total Voltage Drop</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-value">${results.cumulativeDropVolts.toFixed(2)}</div>
                    <div class="stat-label">Voltage Drop (V)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🔝</div>
                    <div class="stat-value">${results.maxDropPercent.toFixed(3)}%</div>
                    <div class="stat-label">Max Single Component</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📏</div>
                    <div class="stat-value">${results.compliance.combinedLimit}%</div>
                    <div class="stat-label">IEEE 141 Limit</div>
                </div>
            </div>
            
            <div class="compliance-status ${complianceClass}">
                <h4>${complianceIcon} IEEE 141 COMPLIANCE: ${results.compliance.status}</h4>
                <div class="compliance-details">
                    <div class="compliance-item">
                        <span class="compliance-label">Feeder Circuits:</span>
                        <span class="compliance-limit">${results.compliance.feederLimit}% max</span>
                        <span class="compliance-check">${results.cumulativeDropPercent <= results.compliance.feederLimit ? '✓' : '✗'}</span>
                    </div>
                    <div class="compliance-item">
                        <span class="compliance-label">Branch Circuits:</span>
                        <span class="compliance-limit">${results.compliance.branchLimit}% max</span>
                        <span class="compliance-check">${results.cumulativeDropPercent <= results.compliance.branchLimit ? '✓' : '✗'}</span>
                    </div>
                    <div class="compliance-item">
                        <span class="compliance-label">Combined System:</span>
                        <span class="compliance-limit">${results.compliance.combinedLimit}% max</span>
                        <span class="compliance-check">${results.cumulativeDropPercent <= results.compliance.combinedLimit ? '✓' : '✗'}</span>
                    </div>
                </div>
            </div>
            
            ${results.criticalComponents && results.criticalComponents.length > 0 ? `
                <div class="alert alert-warning">
                    <h4>⚠️ Critical Components Requiring Attention (${results.criticalComponents.length})</h4>
                    <ul>
                        ${results.criticalComponents.map(item => `
                            <li>
                                <strong>Step ${item.step}:</strong> ${item.component.type.toUpperCase()} - 
                                ${item.component.name || item.component.fromBusName}
                                <br>
                                <span class="text-muted">
                                    Drop: ${item.voltageDrop.dropPercent.toFixed(3)}% (${item.voltageDrop.severity})
                                    ${item.component.type === 'cable' ? 
                                        `<br>Recommendation: Consider larger conductor size or parallel conductors` : 
                                        item.component.type === 'transformer' ? 
                                        `<br>Recommendation: Review transformer tap settings or consider higher rating` : 
                                        ''
                                    }
                                </span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
            
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
                        ${results.components.map(comp => {
                            let statusClass = 'ok';
                            if (comp.severity === 'CRITICAL') statusClass = 'critical';
                            else if (comp.severity === 'HIGH') statusClass = 'high';
                            else if (comp.severity === 'MEDIUM') statusClass = 'medium';
                            
                            return `
                                <tr class="vd-${statusClass}">
                                    <td>${comp.step}</td>
                                    <td>${comp.type}</td>
                                    <td>${comp.name || 'N/A'}</td>
                                    <td>${comp.current.toFixed(1)}</td>
                                    <td>${comp.dropVolts.toFixed(3)}</td>
                                    <td>${comp.dropPercent.toFixed(3)}</td>
                                    <td><span class="status-badge ${statusClass}">${comp.severity}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td colspan="4"><strong>TOTAL</strong></td>
                            <td><strong>${results.cumulativeDropVolts.toFixed(3)} V</strong></td>
                            <td><strong>${results.cumulativeDropPercent.toFixed(3)}%</strong></td>
                            <td><strong>${results.compliance.status}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div class="voltage-drop-chart">
                <h5>📈 Cumulative Voltage Drop Chart</h5>
                <div class="chart-container">
                    ${generateVoltageDropChart(results.components, results.compliance.combinedLimit)}
                </div>
            </div>
            
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
 * Generate voltage drop chart visualization
 */
function generateVoltageDropChart(components, limit) {
    let cumulativePercent = 0;
    const maxWidth = 400;
    
    let html = '<div class="vd-chart">';
    
    components.forEach((comp, index) => {
        cumulativePercent += comp.dropPercent;
        const width = (cumulativePercent / limit) * 100;
        const widthPx = Math.min(width * maxWidth / 100, maxWidth);
        
        let barColor = '#4caf50';
        if (cumulativePercent > limit) barColor = '#f44336';
        else if (cumulativePercent > limit * 0.8) barColor = '#ff9800';
        else if (cumulativePercent > limit * 0.6) barColor = '#ffeb3b';
        
        html += `
            <div class="vd-chart-row">
                <div class="vd-chart-label">${comp.step}. ${comp.type}</div>
                <div class="vd-chart-bar-container">
                    <div class="vd-chart-bar" style="width: ${widthPx}px; background: ${barColor};">
                        <span class="vd-chart-value">${cumulativePercent.toFixed(3)}%</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    // Add limit line
    html += `
        <div class="vd-chart-limit" style="left: ${maxWidth}px;">
            <span class="vd-limit-label">IEEE 141 Limit: ${limit}%</span>
        </div>
    `;
    
    html += '</div>';
    
    return html;
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
        logger.error('Failed to copy:', err);
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

logger.info('Calculation Display module loaded');
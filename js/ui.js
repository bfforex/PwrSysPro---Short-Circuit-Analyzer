// UI Module - Handles user interface updates and interactions

/**
 * Toggle theme (dark/light mode)
 */
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

/**
 * Switch between tabs
 */
function switchTab(event, tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (event) event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}

/**
 * Display bus calculation results
 * Modified: 2025-10-27 12:35:03 UTC by bfforex
 * Added: Recommendations display integration
 */
function displayBusResults(bus, result, timestamp, recommendations = null) {
    const container = document.getElementById('resultsContainer');
    
    // Generate fault current severity badge
    const getFaultSeverity = (current) => {
        if (current > 65) return '<span class="badge badge-danger">Very High</span>';
        if (current > 40) return '<span class="badge badge-warning">High</span>';
        if (current > 20) return '<span class="badge badge-info">Moderate</span>';
        return '<span class="badge badge-success">Normal</span>';
    };

    // Generate voltage drop severity badge
    const getVDSeverity = (drop) => {
        if (drop > 7) return '<span class="badge badge-danger">Critical</span>';
        if (drop > 5) return '<span class="badge badge-warning">High</span>';
        if (drop > 3) return '<span class="badge badge-info">Moderate</span>';
        return '<span class="badge badge-success">Good</span>';
    };

    let html = `
        <div class="results-section">
            <div class="results-header">
                <h2>📊 Fault Current Analysis Results</h2>
                <div class="results-meta">
                    <span><strong>Bus:</strong> ${bus.name}</span>
                    <span><strong>Voltage:</strong> ${bus.voltage} V</span>
                    <span><strong>Method:</strong> ${result.method}</span>
                    <span><strong>Calculated:</strong> ${timestamp}</span>
                </div>
            </div>

            <!-- Fault Current Results -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${result.faultCurrentKA.toFixed(3)} kA</div>
                    <div class="stat-label">Symmetrical Fault Current</div>
                    ${getFaultSeverity(result.faultCurrentKA)}
                </div>
                <div class="stat-card">
                    <div class="stat-value">${result.asymFaultCurrentKA.toFixed(3)} kA</div>
                    <div class="stat-label">Asymmetrical (Peak) Current</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${result.xrRatio.toFixed(2)}</div>
                    <div class="stat-label">X/R Ratio</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${result.totalZ.toFixed(6)} Ω</div>
                    <div class="stat-label">Total Impedance</div>
                </div>
            </div>

            <!-- Voltage Drop Results (if available) -->
            ${result.voltageDrop ? `
                <div class="voltage-drop-section">
                    <h3>💧 Voltage Drop Analysis</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${result.voltageDrop.cumulativeDropPercent.toFixed(3)}%</div>
                            <div class="stat-label">Total Voltage Drop</div>
                            ${getVDSeverity(result.voltageDrop.cumulativeDropPercent)}
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${result.voltageDrop.cumulativeDropVolts.toFixed(2)} V</div>
                            <div class="stat-label">Voltage Drop (Volts)</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${result.voltageDrop.maxDropPercent.toFixed(3)}%</div>
                            <div class="stat-label">Max Single Component</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${result.voltageDrop.components.length}</div>
                            <div class="stat-label">Components Analyzed</div>
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- ═══════════════════════════════════════════════════════════ -->
            <!-- 🔥 NEW: RECOMMENDATIONS SECTION -->
            <!-- ═══════════════════════════════════════════════════════════ -->
            ${recommendations && recommendations.length > 0 ? `
                <div class="recommendations-section">
                    <div class="recommendations-section-header">
                        <h3>💡 Recommendations for This Bus</h3>
                        <span class="rec-count">${recommendations.length} recommendation${recommendations.length !== 1 ? 's' : ''} found</span>
                    </div>
                    <div id="busRecommendations"></div>
                </div>
            ` : `
                <div class="recommendations-section">
                    <div class="alert alert-success">
                        <strong>✅ All Clear!</strong>
                        <p>No issues detected. This bus meets all IEEE standards and design criteria.</p>
                    </div>
                </div>
            `}
            <!-- ═══════════════════════════════════════════════════════════ -->

            <!-- Export Buttons -->
            <div class="button-group">
                <button class="btn btn-info" onclick="exportBusReport('${bus.id}')">📄 Export Bus Report</button>
                <button class="btn btn-secondary" onclick="viewCalculationSteps('${bus.id}')">🔍 View Detailed Calculations</button>
                ${recommendations && recommendations.length > 0 ? `
                    <button class="btn btn-warning" onclick="exportBusRecommendations('${bus.id}')">📋 Export Recommendations</button>
                ` : ''}
            </div>
        </div>
    `;

    container.innerHTML = html;

    // ═══════════════════════════════════════════════════════════
    // 🔥 NEW: RENDER RECOMMENDATIONS IF AVAILABLE
    // ═══════════════════════════════════════════════════════════
    if (recommendations && recommendations.length > 0) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            recUI.displayBusRecommendations(bus.id, 'busRecommendations');
        }, 100);
    }
    // ═══════════════════════════════════════════════════════════

    // Show detailed calculation steps in calculations tab
    document.getElementById('calculationSteps').innerHTML = `<pre class="calculation-steps">${result.steps}</pre>`;
}

/**
 * Calculate all buses in the system
 * Modified: 2025-10-27 12:35:03 UTC by bfforex
 * Added: System-wide recommendations generation
 */
function calculateAllBuses() {
    const calculatedBuses = [];
    const errors = [];
    
    buses.forEach(bus => {
        try {
            // Only calculate buses that can be traced to a source
            const path = traceBusPath(bus.id);
            if (path) {
                const method = document.querySelector('input[name="method"]:checked').value;
                const result = calculatePathImpedance(path, method);
                
                bus.faultCurrent = result.faultCurrentKA;
                bus.asymFaultCurrent = result.asymFaultCurrentKA;
                bus.xrRatio = result.xrRatio;
                bus.totalZ = result.totalZ;
                
                // Store detailed results
                bus.results = {
                    faultCurrents: {
                        threePhaseSym: result.faultCurrentKA,
                        threePhaseAsym: result.asymFaultCurrentKA,
                        lineToGround: result.faultCurrentKA * 0.85,
                        lineToLine: result.faultCurrentKA * 0.866
                    },
                    totalImpedance: {
                        magnitude: result.totalZ,
                        resistance: result.totalR,
                        reactance: result.totalX,
                        angle: Math.atan2(result.totalX, result.totalR) * (180 / Math.PI)
                    },
                    xrRatio: result.xrRatio,
                    path: result.path,
                    method: result.method,
                    calculationDate: getCalculationTimestamp(),
                    voltageDrop: result.voltageDrop || null
                };
                
                // Store path components
                bus.pathComponents = path.map((segment, index) => ({
                    sequence: index,
                    bus: segment.bus,
                    component: segment.component
                }));
                
                calculatedBuses.push(bus);
            }
        } catch (error) {
            errors.push({ bus: bus.name, error: error.message });
            console.error(`Error calculating bus ${bus.name}:`, error);
        }
    });
    
    // Update displays
    updateBusTree();
    updateBusesContent();
    
    // ═══════════════════════════════════════════════════════════
    // 🔥 NEW: GENERATE SYSTEM-WIDE RECOMMENDATIONS
    // ═══════════════════════════════════════════════════════════
    
    if (calculatedBuses.length > 0) {
        console.log(`✅ Calculated ${calculatedBuses.length} buses`);
        
        // Generate system-wide recommendations
        const systemReport = recommendationEngine.analyzeSystem(calculatedBuses);
        
        console.log(`📊 System Analysis Complete:`);
        console.log(`   - Total Recommendations: ${systemReport.totalRecommendations}`);
        console.log(`   - Critical: ${systemReport.critical}`);
        console.log(`   - High: ${systemReport.high}`);
        console.log(`   - Medium: ${systemReport.medium}`);
        
        // Display system recommendations
        displaySystemRecommendations(systemReport);
        
        // Show summary message
        const summaryMsg = `
✅ Calculation Complete!

Buses Calculated: ${calculatedBuses.length}
${errors.length > 0 ? `\n⚠️ Errors: ${errors.length}` : ''}

📊 Recommendations Generated:
  - Critical: ${systemReport.critical}
  - High: ${systemReport.high}
  - Medium: ${systemReport.medium}

${systemReport.critical > 0 ? '⚠️ ATTENTION: Critical issues require immediate action!' : ''}
        `;
        
        alert(summaryMsg);
        
        // Switch to recommendations tab
        addRecommendationsTab();
        switchTab(null, 'recommendations');
    }
    // ═══════════════════════════════════════════════════════════
    
    if (errors.length > 0) {
        console.warn('Some buses had calculation errors:', errors);
    }
    
    scheduleAutoSave();
}

/**
 * Display system-wide recommendations
 * Added: 2025-10-27 12:35:03 UTC by bfforex
 */
function displaySystemRecommendations(systemReport) {
    const container = document.getElementById('recommendationsTabContent');
    if (!container) {
        console.error('Recommendations tab content not found');
        return;
    }
    
    recUI.displaySystemRecommendations(systemReport, 'recommendationsTabContent');
}

/**
 * View detailed calculation steps for a bus
 * Added: 2025-10-27 12:35:03 UTC by bfforex
 */
function viewCalculationSteps(busId) {
    const bus = buses.find(b => b.id === busId);
    if (bus && bus.results) {
        switchTab(null, 'calculations');
    }
}

/**
 * Export recommendations for a specific bus
 * Added: 2025-10-27 12:35:03 UTC by bfforex
 */
function exportBusRecommendations(busId) {
    const bus = buses.find(b => b.id === busId);
    if (!bus) return;
    
    const recommendations = recommendationEngine.filterByBus(busId);
    if (recommendations.length === 0) {
        alert('No recommendations to export for this bus.');
        return;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `Bus_${bus.name}_Recommendations_${timestamp}.txt`;
    
    let content = `
${'='.repeat(100)}
BUS RECOMMENDATIONS REPORT
${'='.repeat(100)}

Project: ${document.getElementById('projectName').value || 'Untitled'}
Bus: ${bus.name}
Voltage: ${bus.voltage} V
Generated: ${new Date().toLocaleString()}

SUMMARY
${'-'.repeat(100)}
Total Recommendations: ${recommendations.length}
Critical: ${recommendations.filter(r => r.severity === 'CRITICAL').length}
High: ${recommendations.filter(r => r.severity === 'HIGH').length}
Medium: ${recommendations.filter(r => r.severity === 'MEDIUM').length}

DETAILED RECOMMENDATIONS
${'-'.repeat(100)}

${recommendations.map((rec, i) => `
${i + 1}. [${rec.severity}] ${rec.name}
   Category: ${rec.category}
   Priority: ${rec.priority}
   
   Finding:
   ${rec.recommendation}
   
   Required Action:
   ${rec.action}
   
   Impact:
   ${rec.impact}
   
   Cost: ${rec.cost}
   Effort: ${rec.effort}
   Standard: ${rec.standard}
   
${'─'.repeat(100)}
`).join('\n')}

${'='.repeat(100)}
END OF REPORT
${'='.repeat(100)}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Add recommendations tab to the UI
 * Added: 2025-10-27 12:35:03 UTC by bfforex
 */
function addRecommendationsTab() {
    const tabsContainer = document.querySelector('.tabs');
    if (!tabsContainer) return;
    
    // Check if tab already exists
    if (document.getElementById('recommendationsTabButton')) return;
    
    // Add tab button
    const tabButton = document.createElement('button');
    tabButton.id = 'recommendationsTabButton';
    tabButton.className = 'tab';
    tabButton.textContent = '💡 Recommendations';
    tabButton.onclick = (e) => switchTab(e, 'recommendations');
    tabsContainer.appendChild(tabButton);
    
    // Add tab content container if not exists
    const contentArea = document.querySelector('.content-area');
    if (!document.getElementById('recommendationsTab')) {
        const tabContent = document.createElement('div');
        tabContent.id = 'recommendationsTab';
        tabContent.className = 'tab-content';
        tabContent.innerHTML = '<div id="recommendationsTabContent"></div>';
        contentArea.appendChild(tabContent);
    }
}

/**
 * Run system analytics manually
 * Added: 2025-10-27 12:35:03 UTC by bfforex
 */
function runSystemAnalytics() {
    const calculatedBuses = buses.filter(b => b.results);
    
    if (calculatedBuses.length === 0) {
        alert('No calculated buses found. Please run calculations first.');
        return;
    }
    
    const systemReport = recommendationEngine.analyzeSystem(calculatedBuses);
    displaySystemRecommendations(systemReport);
    addRecommendationsTab();
    switchTab(null, 'recommendations');
    
    console.log('📊 System Analytics Complete:', systemReport);
}

// Export new functions to global scope
window.viewCalculationSteps = viewCalculationSteps;
window.exportBusRecommendations = exportBusRecommendations;
window.runSystemAnalytics = runSystemAnalytics;

/**
 * Initialize theme from localStorage
 */
function initTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

/**
 * Close modal when clicking outside
 */
function initModalClickOutside() {
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    }
}
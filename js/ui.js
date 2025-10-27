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
 */
function displayBusResults(bus, result, calculationDateStamp) {
    const pathStr = result.path.map((p, i) => {
        if (i === 0) return p.bus.name;
        return `→ ${p.component.type} → ${p.bus.name}`;
    }).join(' ');
    
    let methodInfo = '';
    if (result.method === 'Per-Unit') {
        methodInfo = `
            <div class="result-item">
                <strong>Per-Unit Base Values at Target Bus:</strong><br>
                Base kVA: ${result.baseKVA} kVA (CONSTANT for entire system) | 
                Base Voltage: ${result.baseVoltage} V<br>
                Base Impedance: ${result.baseZ.toFixed(6)} Ω | 
                Base Current: ${result.baseCurrent.toFixed(2)} A
            </div>
            <div class="result-item">
                <strong>Per-Unit Impedances:</strong><br>
                R(pu) = ${result.totalRpu.toFixed(6)} pu | 
                X(pu) = ${result.totalXpu.toFixed(6)} pu | 
                Z(pu) = ${result.totalZpu.toFixed(6)} pu
            </div>
        `;
    }
    
    const html = `
        <div class="results-section">
            <h4>📊 Fault Current Analysis: ${bus.name}</h4>
            <div class="badge ${result.method === 'Per-Unit' ? 'badge-info' : 'badge-success'}" style="margin-bottom: 15px;">
                Method: ${result.method}
            </div>
            
            <div class="alert alert-info">
                <strong>Path from Source:</strong><br>
                ${pathStr}
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${result.faultCurrentKA.toFixed(2)}</div>
                    <div class="stat-label">Fault Current (kA)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${result.asymFaultCurrentKA.toFixed(2)}</div>
                    <div class="stat-label">Peak Current (kA)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${result.xrRatio.toFixed(2)}</div>
                    <div class="stat-label">X/R Ratio</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${bus.voltage}</div>
                    <div class="stat-label">Bus Voltage (V)</div>
                </div>
            </div>
            
            <div class="result-item">
                <strong>Symmetrical Fault Current:</strong><br>
                ${result.faultCurrent.toFixed(2)} A (${result.faultCurrentKA.toFixed(3)} kA)
            </div>
            
            <div class="result-item">
                <strong>Asymmetrical (Peak) Fault Current:</strong><br>
                ${result.asymFaultCurrent.toFixed(2)} A (${result.asymFaultCurrentKA.toFixed(3)} kA)
            </div>
            
            ${methodInfo}
            
            <div class="result-item">
                <strong>System Impedance (Ohmic at ${bus.voltage}V):</strong><br>
                R = ${result.totalR.toFixed(6)} Ω | X = ${result.totalX.toFixed(6)} Ω | Z = ${result.totalZ.toFixed(6)} Ω
            </div>
            
            <div class="button-group">
                <button class="btn btn-info" onclick="exportBusReport('${bus.id}')">📄 Export Report</button>
                <button class="btn btn-primary" onclick="switchTab(null, 'calculations')">📋 View Detailed Calculations</button>
            </div>
        </div>
    `;
    
    document.getElementById('resultsContainer').innerHTML = html;
    document.getElementById('calculationSteps').innerHTML = `<div class="calculation-steps">${result.steps}</div>`;
}

/**
 * Calculate all buses
 */
function calculateAllBuses() {
    try {
        if (buses.length === 0) {
            alert('Please add at least one bus first.');
            return;
        }
        
        const nonSourceBuses = buses.filter(b => b.type !== 'source');
        
        if (nonSourceBuses.length === 0) {
            alert('Please add at least one non-source bus to calculate.');
            return;
        }
        
        const method = document.querySelector('input[name="method"]:checked').value;
        let calculated = 0;
        let failed = 0;
        let errors = [];
        
        nonSourceBuses.forEach(bus => {
            try {
                const path = traceBusPath(bus.id);
                if (path) {
                    const result = calculatePathImpedance(path, method);
                    bus.faultCurrent = result.faultCurrentKA;
                    bus.asymFaultCurrent = result.asymFaultCurrentKA;
                    bus.xrRatio = result.xrRatio;
                    bus.totalZ = result.totalZ;
                    calculated++;
                } else {
                    failed++;
                    errors.push(`${bus.name}: No path to source`);
                }
            } catch (error) {
                console.error(`Error calculating bus ${bus.name}:`, error);
                failed++;
                errors.push(`${bus.name}: ${error.message}`);
            }
        });
        
        updateBusTree();
        updateBusesContent();
        
        let summary = `✅ Calculation Complete!\n\n`;
        summary += `Method Used: ${method === 'per-unit' ? 'Per-Unit' : 'Point-to-Point'}\n`;
        summary += `Successfully calculated: ${calculated} bus(es)\n`;
        
        if (failed > 0) {
            summary += `\n⚠️ Failed: ${failed} bus(es)\n`;
            summary += `\nErrors:\n${errors.join('\n')}`;
        }
        
        alert(summary);
        
        if (calculated > 0) {
            switchTab(null, 'buses');
        }
        
        scheduleAutoSave();
        
    } catch (error) {
        console.error('Error in calculateAllBuses:', error);
        alert('Error calculating:\n\n' + error.message);
    }
}

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
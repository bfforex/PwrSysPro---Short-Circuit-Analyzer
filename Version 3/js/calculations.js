/**
 * Main Calculations Coordinator
 * Modified: 2025-11-02 16:43:15 UTC by bfforex
 * Enhanced: Feature #1 - Motor Contribution Integration
 * Enhanced: Feature #5 - Demand & Diversity Factors Integration
 * Enhanced: Arc Flash Analysis Integration (IEEE 1584-2018 & NFPA 70E-2021)
 * FIXED: Error handling, optional chaining, safe property access
 * @version 1.3.3 - Arc Flash Integration
 */

/**
 * Calculate all analyses for a bus
 * Runs Short Circuit (with Motor Contribution), Load Flow, Voltage Drop, and Arc Flash analyses
 */
function calculateBus(busId) {
    const calculationDateStamp = getCalculationTimestamp();
    
    try {
        const bus = buses.find(b => b.id === busId);
        if (!bus) {
            alert('Bus not found.');
            return;
        }
        
        console.log('\n' + '═'.repeat(80));
        console.log(`COMPREHENSIVE ANALYSIS: ${bus.name}`);
        console.log('═'.repeat(80));
        console.log(`Date: ${calculationDateStamp}`);
        console.log(`Engineer: ${document.getElementById('engineer')?.value || 'Unknown'}`);
        console.log('═'.repeat(80) + '\n');
        
        const path = traceBusPath(busId);
        if (!path) {
            alert('Cannot trace path to source. Ensure bus is connected to a source bus.');
            return;
        }
        
        const method = document.querySelector('input[name="method"]:checked')?.value || 'point-to-point';
        
        // ═══════════════════════════════════════════════════════════
        // 1. SHORT CIRCUIT ANALYSIS (SYSTEM CONTRIBUTION ONLY)
        // ═══════════════════════════════════════════════════════════
        console.log('🔥 Running Short Circuit Analysis (System Contribution)...');
        
        // ✅ DEFENSIVE CHECK: Verify function exists
        if (typeof calculateShortCircuit !== 'function') {
            const errorMsg = '❌ ERROR: calculateShortCircuit function not found!\n\n' +
                           'This usually means:\n' +
                           '1. shortCircuitCalc.js did not load\n' +
                           '2. Script loading order is incorrect\n' +
                           '3. Function export is missing\n\n' +
                           'Check browser console for loading errors.';
            console.error(errorMsg);
            alert(errorMsg);
            return;
        }
        
        const systemFaultResults = calculateShortCircuit(busId, method);
        
        // ═══════════════════════════════════════════════════════════
        // 1B. MOTOR CONTRIBUTION ANALYSIS (Feature #1)
        // ✅ NEW: 2025-10-30 02:10:26 UTC by bfforex
        // ═══════════════════════════════════════════════════════════
        console.log('⚡ Analyzing Motor Contribution...');
        
        var motorContributionResults = null;
        var shortCircuitResults = systemFaultResults;
        
        // Check if motor contribution module is loaded
        if (typeof calculateTotalMotorContribution === 'function' && 
            typeof combineSystemAndMotorFault === 'function') {
            
            console.log('✅ Motor Contribution module available');
            
            try {
                // Calculate motor contribution (interrupting duty)
                try {
                    motorContributionResults = calculateTotalMotorContribution(busId, 'interrupting');
                } catch (motorError) {
                    console.error('❌ Error in calculateTotalMotorContribution:', motorError);
                    motorContributionResults = null;
                }
                
                if (motorContributionResults && motorContributionResults.motorCount > 0) {
                    console.log(`✅ ${motorContributionResults.motorCount} motor(s) found`);
                    console.log(`   Motor Contribution: ${motorContributionResults.totalSymmetricalContribution.toFixed(3)} kA (symmetrical)`);
                    console.log(`   Motor Contribution: ${motorContributionResults.totalAsymmetricalContribution.toFixed(3)} kA (asymmetrical)`);
                    
                    // Combine system fault with motor contribution
                    shortCircuitResults = combineSystemAndMotorFault(systemFaultResults, motorContributionResults);
                    
                    console.log(`✅ Combined Fault Current: ${shortCircuitResults.faultCurrents.threePhaseSym.toFixed(3)} kA (symmetrical)`);
                    console.log(`✅ Combined Fault Current: ${shortCircuitResults.faultCurrents.threePhaseAsym.toFixed(3)} kA (asymmetrical)`);
                } else {
                    console.log('ℹ️ No motors found downstream - using system contribution only');
                    motorContributionResults = null;
                }
            } catch (motorError) {
                console.error('❌ Error in motor contribution calculation:', motorError);
                console.warn('⚠️ Continuing with system contribution only');
                motorContributionResults = null;
            }
        } else {
            console.log('⚠️ Motor Contribution module not loaded - using system contribution only');
        }
        
        // ✅ DEFENSIVE: Check fault currents exist
        if (!shortCircuitResults?.faultCurrents?.threePhaseSym) {
            alert('❌ Error: Invalid short circuit results.\n\nCheck browser console for details.');
            return;
        }
        
        // Store basic fault current data (backward compatibility)
        bus.faultCurrent = shortCircuitResults.faultCurrents.threePhaseSym;
        bus.asymFaultCurrent = shortCircuitResults.faultCurrents.threePhaseAsym;
        bus.xrRatio = shortCircuitResults.xrRatio;
        bus.totalZ = shortCircuitResults.totalImpedance?.magnitude || shortCircuitResults.totalZ;
        
        // ═══════════════════════════════════════════════════════════
        // 2. LOAD FLOW ANALYSIS (WITH DEMAND & DIVERSITY FACTORS)
        // Feature #5: Applies demand and diversity factors
        // ═══════════════════════════════════════════════════════════
        console.log('🔌 Running Load Flow Analysis (with Demand & Diversity Factors)...');
        
        var loadFlowResults = null;
        
        // ✅ DEFENSIVE CHECK: Verify function exists
        if (typeof calculateLoadFlow !== 'function') {
            console.warn('⚠️ WARNING: calculateLoadFlow function not found! Skipping load flow analysis.');
        } else {
            try {
                // ✅ CHECK: Use enhanced version if available (Feature #5)
                if (typeof calculateLoadFlowWithDemand === 'function' && typeof window.DemandFactors !== 'undefined') {
                    console.log('✅ Using enhanced load flow with demand/diversity factors');
                    loadFlowResults = calculateLoadFlowWithDemand(busId);
                    
                    // ✅ DEFENSIVE: Log demand factor application with null checks
                    if (loadFlowResults && loadFlowResults.demandFactorsApplied) {
                        try {
                            // ✅ SAFE: Optional chaining for nested properties
                            const demandFactor = loadFlowResults.demandSummary?.demandFactor;
                            const diversityFactor = loadFlowResults.demandSummary?.diversityFactor;
                            
                            if (demandFactor !== undefined && demandFactor !== null) {
                                console.log(`   📊 Demand Factor Applied: ${(demandFactor * 100).toFixed(1)}%`);
                            }
                            
                            if (diversityFactor !== undefined && diversityFactor !== null) {
                                console.log(`   📊 Diversity Factor Applied: ${(diversityFactor).toFixed(1)}%`);
                            }
                            
                            // ✅ SAFE: Check nested properties exist before access
                            const connectedCurrent = loadFlowResults.summary?.connectedCurrent;
                            if (connectedCurrent !== undefined) {
                                console.log(`   📊 Connected Load: ${connectedCurrent.toFixed(2)} A`);
                            }
                            
                            const demandCurrent = loadFlowResults.demandSummary?.demandCurrent;
                            if (demandCurrent !== undefined) {
                                console.log(`   📊 Demand Load: ${demandCurrent.toFixed(2)} A`);
                            }
                            
                            const diversityCurrent = loadFlowResults.demandSummary?.diversityCurrent;
                            if (diversityCurrent !== undefined) {
                                console.log(`   📊 Diversity Load: ${diversityCurrent.toFixed(2)} A`);
                            }
                            
                            // ✅ SAFE: Calculate savings only if both values exist and are valid
                            const connectedPower = loadFlowResults.summary?.connectedPowerKVA;
                            const diversityPower = loadFlowResults.demandSummary?.diversityPowerKVA;
                            
                            if (connectedPower !== undefined && connectedPower !== null &&
                                diversityPower !== undefined && diversityPower !== null &&
                                typeof connectedPower === 'number' && typeof diversityPower === 'number') {
                                const savings = connectedPower - diversityPower;
                                console.log(`   💰 Power Savings: ${savings.toFixed(2)} kVA`);
                            }
                        } catch (logError) {
                            console.warn('⚠️ Error logging demand factor details:', logError.message);
                        }
                    }
                } else {
                    // Fallback to standard load flow
                    console.log('⚠️ Using standard load flow (demand factors not available)');
                    loadFlowResults = calculateLoadFlow(busId);
                }
            } catch (loadFlowError) {
                console.error('❌ Error in load flow calculation:', loadFlowError);
                console.warn('⚠️ Continuing without load flow analysis');
                loadFlowResults = null;
            }
        }
        
        // ═══════════════════════════════════════════════════════════
        // 3. VOLTAGE DROP ANALYSIS
        // ═══════════════════════════════════════════════════════════
        console.log('📉 Running Voltage Drop Analysis...');
        
        // ✅ DEFENSIVE CHECK: Verify function exists
        let voltageDropResults = null;
        if (typeof calculateVoltageDrop !== 'function') {
            console.warn('⚠️ WARNING: calculateVoltageDrop function not found! Skipping voltage drop analysis.');
        } else {
            try {
                voltageDropResults = calculateVoltageDrop(busId, path, loadFlowResults);
            } catch (vdError) {
                console.error('❌ Error in voltage drop calculation:', vdError);
                console.warn('⚠️ Continuing without voltage drop analysis');
                voltageDropResults = null;
            }
        }
        
        // ═══════════════════════════════════════════════════════════
        // 4. ARC FLASH ANALYSIS (IEEE 1584-2018 & NFPA 70E-2021)
        // Added: 2025-11-02 16:43:15 UTC by bfforex
        // ═══════════════════════════════════════════════════════════
        console.log('🔥 Running Arc Flash Analysis...');
        
        let arcFlashResults = null;
        
        // ✅ DEFENSIVE CHECK: Verify function exists
        if (typeof calculateArcFlash !== 'function') {
            console.warn('⚠️ WARNING: calculateArcFlash function not found! Skipping arc flash analysis.');
        } else {
            try {
                // Arc flash requires short circuit data
                if (shortCircuitResults?.faultCurrents?.threePhaseSym) {
                    arcFlashResults = calculateArcFlash(busId, {
                        threePhaseFault: {
                            faultCurrent: shortCircuitResults.faultCurrents.threePhaseSym
                        }
                    }, {
                        equipmentType: 'VCB',        // Vacuum Circuit Breaker (default)
                        clearingTimeCycles: 2,        // Instantaneous breaker (default)
                        // Optional overrides:
                        // workingDistance: 18,       // inches (auto-calculated by voltage)
                        // electrodeGap: 32,          // mm (auto-calculated by voltage)
                    });
                    
                    // ✅ Store globally
                    if (!window.arcFlashResults) window.arcFlashResults = {};
                    window.arcFlashResults[busId] = arcFlashResults;
                    
                    console.log('✅ Arc Flash Analysis Complete');
                    console.log(`   Incident Energy: ${arcFlashResults.incidentEnergy.toFixed(2)} cal/cm²`);
                    console.log(`   Arc Flash Boundary: ${(arcFlashResults.arcFlashBoundary / 12).toFixed(2)} feet`);
                    console.log(`   PPE Category: ${arcFlashResults.ppeCategory}`);
                    console.log(`   Hazard Level: ${arcFlashResults.hazardLevel}`);
                } else {
                    console.warn('⚠️ Short circuit data incomplete - skipping arc flash analysis');
                }
            } catch (arcFlashError) {
                console.error('❌ Error in arc flash calculation:', arcFlashError);
                console.warn('⚠️ Continuing without arc flash analysis');
                arcFlashResults = null;
            }
        }
        
        // ═══════════════════════════════════════════════════════════
        // STORE ALL RESULTS WITH BASE VALUES
        // Enhanced: 2025-11-01 13:00:01 UTC by bfforex
        // Enhanced: 2025-11-02 16:43:15 UTC by bfforex
        // Added: Base kVA, baseZ, baseCurrent for per-unit analysis
        // Added: Arc flash results storage
        // ═══════════════════════════════════════════════════════════
        
        // ✅ Calculate base values for per-unit system
        const baseKVA = 10000;  // System-wide base (constant)
        const baseVoltage = bus.voltage;
        const baseZ = Math.pow(baseVoltage, 2) / (baseKVA * 1000);
        const baseCurrent = (baseKVA * 1000) / (Math.sqrt(3) * baseVoltage);
        
        // ✅ Calculate per-unit impedances if available
        let totalRpu, totalXpu, totalZpu;
        
        if (shortCircuitResults?.totalImpedance) {
            const totalZ = shortCircuitResults.totalImpedance.magnitude || 0;
            const xrRatio = shortCircuitResults.xrRatio || 1;
            
            // Calculate R and X from Z and X/R ratio
            // Z = √(R² + X²), X/R = known
            // Therefore: R = Z / √(1 + (X/R)²), X = R × (X/R)
            const r = totalZ / Math.sqrt(1 + Math.pow(xrRatio, 2));
            const x = r * xrRatio;
            
            totalRpu = r / baseZ;
            totalXpu = x / baseZ;
            totalZpu = totalZ / baseZ;
        }
        
        bus.results = {
            // Separate result sets
            shortCircuit: shortCircuitResults,
            systemFault: systemFaultResults,
            motorContribution: motorContributionResults,
            loadFlow: loadFlowResults,
            voltageDrop: voltageDropResults,
            arcFlash: arcFlashResults,
            
            // ✅ NEW: Base values for per-unit analysis
            baseKVA: baseKVA,
            baseVoltage: baseVoltage,
            baseZ: baseZ,
            baseCurrent: baseCurrent,
            
            // ✅ NEW: Per-unit impedances
            totalRpu: totalRpu,
            totalXpu: totalXpu,
            totalZpu: totalZpu,
            
            // Legacy compatibility (for existing code)
            faultCurrents: shortCircuitResults.faultCurrents,
            totalImpedance: shortCircuitResults.totalImpedance,
            xrRatio: shortCircuitResults.xrRatio,
            path: path,
            method: method,
            calculationDate: calculationDateStamp,
            
            // Additional metadata
            analysisComplete: true,
            analysisTypes: ['shortCircuit', 'loadFlow', 'voltageDrop', 'arcFlash'],
            
            // ✅ Feature #1 metadata
            includesMotorContribution: motorContributionResults?.motorCount > 0 || false,
            motorCount: motorContributionResults?.motorCount || 0,
            
            // ✅ Feature #5 metadata
            demandFactorsEnabled: loadFlowResults?.demandFactorsApplied || false,
            
            // ✅ Arc Flash metadata
            arcFlashAnalyzed: arcFlashResults !== null
        };
        
        // ✅ LOG: Verify base values calculated
        console.log(`📊 Per-Unit Base Values for ${bus.name}:`);
        console.log(`   Base kVA: ${baseKVA} kVA`);
        console.log(`   Base Voltage: ${baseVoltage} V`);
        console.log(`   Base Impedance: ${baseZ.toFixed(6)} Ω`);
        console.log(`   Base Current: ${baseCurrent.toFixed(2)} A`);
        if (totalZpu !== undefined) {
            console.log(`   Per-Unit Impedance: ${totalZpu.toFixed(6)} pu`);
        }
        
        // Store path components for analysis
        bus.pathComponents = path.map((segment, index) => ({
            sequence: index,
            bus: segment.bus,
            component: segment.component
        }));
        
        updateBusTree();
        updateBusesContent();
        
        selectedBusId = busId;
        
        // ═══════════════════════════════════════════════════════════
        // GENERATE RECOMMENDATIONS
        // ═══════════════════════════════════════════════════════════
        if (typeof recommendationEngine !== 'undefined' && recommendationEngine?.analyzeBus) {
            try {
                const busRecommendations = recommendationEngine.analyzeBus(bus);
                console.log(`📊 ${busRecommendations.length} recommendations generated`);
            } catch (recError) {
                console.warn('⚠️ Error generating recommendations:', recError);
            }
        }
        
        // ═══════════════════════════════════════════════════════════
        // DISPLAY RESULTS (NEW SEPARATED DISPLAY)
        // ═══════════════════════════════════════════════════════════
        if (typeof displayCalculationResults === 'function') {
            try {
                displayCalculationResults(busId, shortCircuitResults, loadFlowResults, voltageDropResults, arcFlashResults);
            } catch (displayError) {
                console.error('❌ Error displaying calculation results:', displayError);
                console.warn('⚠️ Results calculated but display failed');
            }
        } else {
            console.warn('⚠️ WARNING: displayCalculationResults function not found!');
        }
        
        switchTab(null, 'results');
        
        scheduleAutoSave();
        
        console.log('\n✅ ALL ANALYSES COMPLETE');
        console.log('   - Short Circuit: ✓');
        console.log('   - Motor Contribution: ' + (motorContributionResults?.motorCount > 0 ? `✓ (${motorContributionResults.motorCount} motors)` : '⚠️ No motors'));
        console.log('   - Load Flow: ' + (loadFlowResults ? '✓' : '⚠️ Skipped'));
        console.log('   - Voltage Drop: ' + (voltageDropResults ? '✓' : '⚠️ Skipped'));
        console.log('   - Arc Flash: ' + (arcFlashResults ? '✓' : '⚠️ Skipped'));
        console.log('   - Demand Factors: ' + (loadFlowResults?.demandFactorsApplied ? '✓ Applied' : '⚠️ Not Applied'));
        console.log('═'.repeat(80) + '\n');
        
    } catch (error) {
        console.error('Error calculating bus:', error);
        console.error('Stack trace:', error.stack);
        alert('Error calculating bus:\n\n' + error.message + '\n\nCheck browser console for details.');
    }
}

/**
 * Calculate arc flash for a bus (standalone function)
 * Can be called separately if needed
 */
function performArcFlashAnalysis(busId) {
    try {
        const bus = buses.find(b => b.id === busId);
        if (!bus) {
            alert('Bus not found');
            return null;
        }
        
        // Get short circuit data first
        const scResult = bus.results?.shortCircuit;
        if (!scResult) {
            alert('Please calculate short circuit first');
            return null;
        }
        
        // Calculate arc flash
        const result = calculateArcFlash(busId, {
            threePhaseFault: {
                faultCurrent: scResult.faultCurrents.threePhaseSym
            }
        }, {
            equipmentType: 'VCB',
            clearingTimeCycles: 2 // Can be adjusted
        });
        
        // Store result
        if (!window.arcFlashResults) window.arcFlashResults = {};
        window.arcFlashResults[busId] = result;
        
        // Store in bus results
        if (bus.results) {
            bus.results.arcFlash = result;
            bus.results.arcFlashAnalyzed = true;
        }
        
        // Refresh display if display function exists
        if (typeof displayCalculationResults === 'function' && bus.results) {
            displayCalculationResults(
                busId,
                bus.results.shortCircuit,
                bus.results.loadFlow,
                bus.results.voltageDrop,
                result
            );
        }
        
        console.log('✅ Arc Flash analysis complete');
        console.log(`   Incident Energy: ${result.incidentEnergy.toFixed(2)} cal/cm²`);
        console.log(`   PPE Category: ${result.ppeCategory}`);
        
        return result;
    } catch (error) {
        console.error('Arc flash calculation error:', error);
        alert(`Error: ${error.message}`);
        return null;
    }
}

/**
 * Calculate all buses in system
 */
function calculateAllBuses() {
    const calculatedBuses = buses.filter(b => b.type !== 'source' || b.utilityFaultCurrent);
    
    if (calculatedBuses.length === 0) {
        alert('No buses available for calculation. Add buses first.');
        return;
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('SYSTEM-WIDE ANALYSIS');
    console.log('═'.repeat(80));
    console.log(`Total buses: ${calculatedBuses.length}`);
    
    // ✅ Feature #1 status check
    if (typeof calculateTotalMotorContribution === 'function') {
        console.log('✅ Feature #1: Motor Contribution ENABLED');
    } else {
        console.log('⚠️ Feature #1: Motor Contribution NOT AVAILABLE');
    }
    
    // ✅ Feature #5 status check
    if (typeof calculateLoadFlowWithDemand === 'function' && typeof window.DemandFactors !== 'undefined') {
        console.log('✅ Feature #5: Demand & Diversity Factors ENABLED');
    } else {
        console.log('⚠️ Feature #5: Demand & Diversity Factors NOT AVAILABLE');
    }
    
    // ✅ Arc Flash status check
    if (typeof calculateArcFlash === 'function') {
        console.log('✅ Arc Flash Analysis: ENABLED (IEEE 1584-2018)');
    } else {
        console.log('⚠️ Arc Flash Analysis: NOT AVAILABLE');
    }
    
    console.log('═'.repeat(80) + '\n');
    
    let successCount = 0;
    let errorCount = 0;
    let motorsFoundCount = 0;
    let demandAppliedCount = 0;
    let arcFlashCount = 0;
    const errors = [];
    
    calculatedBuses.forEach(bus => {
        try {
            console.log(`\nCalculating: ${bus.name}...`);
            calculateBus(bus.id);
            successCount++;
            
            // Count buses with motor contribution
            if (bus.results?.includesMotorContribution) {
                motorsFoundCount++;
            }
            
            // Count buses with demand factors applied
            if (bus.results?.demandFactorsEnabled) {
                demandAppliedCount++;
            }
            
            // Count buses with arc flash analysis
            if (bus.results?.arcFlash) {
                arcFlashCount++;
            }
        } catch (error) {
            console.error(`Failed to calculate ${bus.name}:`, error);
            errors.push({ bus: bus.name, error: error.message });
            errorCount++;
        }
    });
    
    console.log('\n' + '═'.repeat(80));
    console.log('SYSTEM ANALYSIS COMPLETE');
    console.log('═'.repeat(80));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    
    // ✅ SAFE: Only show counts if any buses were successful
    if (successCount > 0) {
        console.log(`⚡ Motor Contribution: ${motorsFoundCount}/${successCount} buses`);
        console.log(`📊 Demand Factors Applied: ${demandAppliedCount}/${successCount} buses`);
        console.log(`🔥 Arc Flash Analysis: ${arcFlashCount}/${successCount} buses`);
    }
    
    console.log('═'.repeat(80) + '\n');
    
    if (errorCount > 0) {
        console.error('Errors:', errors);
    }
    
    let message = `Analysis complete!\n\n✅ Successful: ${successCount}\n❌ Failed: ${errorCount}`;
    
    if (motorsFoundCount > 0) {
        message += `\n\n⚡ Feature #1: Motor Contribution\n   Applied to ${motorsFoundCount} bus(es)`;
    }
    
    if (demandAppliedCount > 0) {
        message += `\n\n📊 Feature #5: Demand & Diversity Factors\n   Applied to ${demandAppliedCount} bus(es)`;
    }
    
    if (arcFlashCount > 0) {
        message += `\n\n🔥 Arc Flash Analysis (IEEE 1584-2018)\n   Completed for ${arcFlashCount} bus(es)`;
    }
    
    alert(message);
}

// ═══════════════════════════════════════════════════════════
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// ═══════════════════════════════════════════════════════════
window.calculateBus = calculateBus;
window.calculateAllBuses = calculateAllBuses;
window.performArcFlashAnalysis = performArcFlashAnalysis;

console.log('✅ Calculations coordinator v1.3.3 loaded - Arc Flash Integration');
console.log('   - calculateBus: Available');
console.log('   - calculateAllBuses: Available');
console.log('   - performArcFlashAnalysis: Available');
console.log('   - Feature #1 Integration: ' + (typeof calculateTotalMotorContribution === 'function' ? 'READY' : 'PENDING'));
console.log('   - Feature #5 Integration: ' + (typeof calculateLoadFlowWithDemand === 'function' ? 'READY' : 'PENDING'));
console.log('   - Arc Flash Integration: ' + (typeof calculateArcFlash === 'function' ? 'READY' : 'PENDING'));
console.log('   - Dependencies check: Enabled');
console.log('   - Defensive null checks: ENHANCED');
console.log('   - Error handling: COMPREHENSIVE');
console.log('   - Optional chaining: IMPLEMENTED');
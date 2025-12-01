/**
 * Main Calculations Coordinator
 * Modified: 2025-11-03 02:22:52 UTC by bfforex
 * Enhanced: Feature #1 - Motor Contribution Integration
 * Enhanced: Feature #5 - Demand & Diversity Factors Integration (FIXED)
 * Enhanced: Arc Flash Analysis Integration (IEEE 1584-2018 & NFPA 70E-2021)
 * FIXED: Demand factor application with comprehensive debugging
 * @version 1.3.4 - Demand Factor Integration Fix
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
        // ═══════════════════════════════════════════════════════════
        console.log('⚡ Analyzing Motor Contribution...');
        
        var motorContributionResults = null;
        var shortCircuitResults = systemFaultResults;
        
        // Check if motor contribution module is loaded
        if (typeof calculateTotalMotorContribution === 'function' && 
            typeof combineSystemAndMotorFault === 'function') {
            
            console.log('✅ Motor Contribution module available');
            
            try {
                motorContributionResults = calculateTotalMotorContribution(busId, 'interrupting');
                
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
        
        // ════════════════════════════════════════════════════════════════
        // 2. LOAD FLOW ANALYSIS (WITH DEMAND & DIVERSITY FACTORS)
        // Feature #5: Applies demand and diversity factors
        // ENHANCED: 2025-11-03 02:22:52 UTC - Comprehensive debugging
        // ════════════════════════════════════════════════════════════════
        console.log('🔌 Running Load Flow Analysis (with Demand & Diversity Factors)...');
        
        // Diagnostic logging
        console.log('   🔍 Checking module availability:');
        console.log(`      calculateLoadFlowWithDemand: ${typeof calculateLoadFlowWithDemand === 'function' ? '✅' : '❌'}`);
        console.log(`      applyDemandFactorsToLoadFlow: ${typeof applyDemandFactorsToLoadFlow === 'function' ? '✅' : '❌'}`);
        console.log(`      calculateLoadFlow: ${typeof calculateLoadFlow === 'function' ? '✅' : '❌'}`);
        console.log(`      DemandFactors module: ${typeof window.DemandFactors !== 'undefined' ? '✅' : '❌'}`);
        console.log(`      DEMAND_FACTORS data: ${typeof window.DEMAND_FACTORS !== 'undefined' ? '✅' : '❌'}`);
        console.log(`      DIVERSITY_FACTORS data: ${typeof window.DIVERSITY_FACTORS !== 'undefined' ? '✅' : '❌'}`);

        var loadFlowResult;
        let demandFactorsAttempted = false;
        let demandFactorsApplied = false;

        // ────────────────────────────────────────────────────────────────
        // ATTEMPT 1: Use integrated demand factor function
        // ────────────────────────────────────────────────────────────────
        if (typeof calculateLoadFlowWithDemand === 'function') {
            console.log('   📊 Attempting Method 1: calculateLoadFlowWithDemand()...');
            demandFactorsAttempted = true;
            
            try {
                loadFlowResult = calculateLoadFlowWithDemand(busId);
                
                // Verify demand factors were actually applied
                if (loadFlowResult && loadFlowResult.demandFactorsApplied === true) {
                    demandFactorsApplied = true;
                    console.log('   ✅ Method 1 SUCCESS: Demand factors applied!');
                    console.log(`      Connected Load: ${loadFlowResult.summary?.connectedCurrent?.toFixed(2) || 'N/A'} A`);
                    
                    if (loadFlowResult.demandSummary) {
                        console.log(`      Demand Load:    ${loadFlowResult.demandSummary.demandCurrent?.toFixed(2) || 'N/A'} A (${((loadFlowResult.demandSummary.demandFactor || 0) * 100).toFixed(1)}%)`);
                        console.log(`      Diversity Load: ${loadFlowResult.demandSummary.diversityCurrent?.toFixed(2) || 'N/A'} A`);
                        console.log(`      Demand Factor:  ${loadFlowResult.demandSummary.demandFactor?.toFixed(3) || 'N/A'}`);
                        console.log(`      Diversity Factor: ${loadFlowResult.demandSummary.diversityFactor?.toFixed(3) || 'N/A'}`);
                    }
                } else {
                    console.warn('   ⚠️ Method 1 PARTIAL: Function returned but demand factors not confirmed');
                    console.log('      Result structure:', {
                        hasResults: !!loadFlowResult,
                        hasDemandFlag: loadFlowResult?.demandFactorsApplied,
                        hasDemandSummary: !!loadFlowResult?.demandSummary
                    });
                    // Continue to next method
                }
            } catch (error) {
                console.error('   ❌ Method 1 ERROR:', error.message);
                console.log('      Continuing to Method 2...');
            }
        }

        // ────────────────────────────────────────────────────────────────
        // ATTEMPT 2: Calculate standard then apply demand factors
        // ────────────────────────────────────────────────────────────────
        if (!demandFactorsApplied && typeof applyDemandFactorsToLoadFlow === 'function') {
            console.log('   📊 Attempting Method 2: applyDemandFactorsToLoadFlow()...');
            demandFactorsAttempted = true;
            
            try {
                // Get standard load flow first
                const standardLF = calculateLoadFlow(busId);
                console.log(`      Standard load flow calculated: ${standardLF.summary?.totalCurrent?.toFixed(2) || 'N/A'} A`);
                
                // Apply demand factors
                loadFlowResult = applyDemandFactorsToLoadFlow(standardLF);
                
                // Verify application
                if (loadFlowResult && loadFlowResult.demandFactorsApplied === true) {
                    demandFactorsApplied = true;
                    console.log('   ✅ Method 2 SUCCESS: Demand factors applied!');
                    
                    if (loadFlowResult.demandSummary) {
                        console.log(`      Connected Load: ${loadFlowResult.demandSummary.connectedCurrent?.toFixed(2) || 'N/A'} A`);
                        console.log(`      Demand Load:    ${loadFlowResult.demandSummary.demandCurrent?.toFixed(2) || 'N/A'} A`);
                        console.log(`      Diversity Load: ${loadFlowResult.demandSummary.diversityCurrent?.toFixed(2) || 'N/A'} A`);
                        const connCurrent = loadFlowResult.demandSummary.connectedCurrent || 0;
                        const divCurrent = loadFlowResult.demandSummary.diversityCurrent || 0;
                        const savings = connCurrent - divCurrent;
                        const savingsPercent = connCurrent > 0 ? ((1 - divCurrent / connCurrent) * 100) : 0;
                        console.log(`      Savings:        ${savings.toFixed(2)} A (${savingsPercent.toFixed(1)}%)`);
                    }
                } else {
                    console.warn('   ⚠️ Method 2 FAILED: Could not apply demand factors');
                }
            } catch (error) {
                console.error('   ❌ Method 2 ERROR:', error.message);
                console.log('      Falling back to Method 3...');
            }
        }

        // ────────────────────────────────────────────────────────────────
        // FALLBACK: Use standard load flow only
        // ────────────────────────────────────────────────────────────────
        if (!demandFactorsApplied) {
            if (!loadFlowResult || !loadFlowResult.summary) {
                console.log('   📊 Using Method 3: Standard Load Flow (no demand factors)');
                loadFlowResult = calculateLoadFlow(busId);
            }
            
            console.warn('   ⚠️ DEMAND FACTORS NOT APPLIED');
            console.log('      Possible reasons:');
            console.log('      • Demand factor modules not loaded');
            console.log('      • Functions exist but returned incomplete data');
            console.log('      • Bus configuration incompatible with demand factors');
            console.log('      Using connected load (100%) - CONSERVATIVE approach');
        }

        // ────────────────────────────────────────────────────────────────
        // FINAL STATUS
        // ────────────────────────────────────────────────────────────────
        console.log('');
        console.log('   📊 LOAD FLOW ANALYSIS COMPLETE:');
        console.log(`      Total Load: ${loadFlowResult.summary?.totalCurrent?.toFixed(2) || 'N/A'} A`);
        console.log(`      Total Power: ${loadFlowResult.summary?.totalPowerKVA?.toFixed(2) || 'N/A'} kVA`);
        console.log(`      Demand Factors: ${demandFactorsApplied ? '✅ APPLIED' : '⚠️ NOT APPLIED'}`);
        console.log('');

        // ════════════════════════════════════════════════════════════════
        // ✅ CRITICAL FIX: UPDATE BUS LOAD CURRENT FOR DISPLAY
        // Added: 2025-12-01
        // Issue: Bus tree shows 0. 0A for auto-calculated loads
        // Solution: Write calculated load back to bus.loadCurrent
        // ════════════════════════════════════════════════════════════════
        if (loadFlowResult && loadFlowResult.summary) {
            let displayLoad = 0;
    
            // Use demand/diversity load if applied, otherwise use total load
            if (demandFactorsApplied && loadFlowResult.demandSummary) {
                // Use the diversity-adjusted load (most realistic)
                displayLoad = loadFlowResult.demandSummary.diversityCurrent || 
                             loadFlowResult.demandSummary.demandCurrent || 
                             loadFlowResult.summary.totalCurrent || 0;
                console.log(`   ✅ Bus ${bus.name}: Using diversity load for display: ${displayLoad.toFixed(2)} A`);
            } else {
                // Use connected load (conservative)
                displayLoad = loadFlowResult.summary.totalCurrent || 0;
                console.log(`   ✅ Bus ${bus.name}: Using connected load for display: ${displayLoad.toFixed(2)} A`);
            }
    
            // ✅ CRITICAL FIX: Check if this is a manual load or auto-calculated
            // Only update if NO manual load was specified OR if load was previously auto-calculated
            const hadManualLoad = bus.loadCurrent && bus.loadCurrent > 0 && !bus.loadCurrentAutoCalculated;
    
            if (!hadManualLoad) {
                bus.loadCurrent = displayLoad;
                bus.loadCurrentAutoCalculated = true;  // ✅ CRITICAL: Mark as auto-calculated to prevent double-counting!
                console.log(`   ✅ Bus ${bus.name}: loadCurrent set to ${bus.loadCurrent.toFixed(2)} A (AUTO-CALCULATED - for display only)`);
            } else {
                console.log(`   ℹ️ Bus ${bus.name}: Keeping manual load ${bus.loadCurrent.toFixed(2)} A (USER-SPECIFIED)`);
                bus.loadCurrentAutoCalculated = false;  // Explicitly mark as manual
            }
        }
        console.log('');
        
        // ════════════════════════════════════════════════════════════════════════════
        // DISPLAY DEMAND FACTOR CALCULATION STEPS IN UI
        // Added: 2025-11-03 14:23:38 UTC by bfforex
        // Priority 2: Show detailed demand/diversity calculations in Calculations tab
        // ════════════════════════════════════════════════════════════════════════════
        if (loadFlowResult && loadFlowResult.demandCalculationSteps) {
            console.log('📊 Adding demand factor calculation steps to UI...');
    
            // Wait for DOM to be ready (displayCalculationResults may still be rendering)
            setTimeout(() => {
                const calcStepsContainer = document.getElementById('calculationSteps');
        
                if (calcStepsContainer) {
                    // Check if demand section already exists (prevent duplicates)
                    const existingDemandSection = calcStepsContainer.querySelector('.demand-calculation-section');
                    if (existingDemandSection) {
                        console.log('ℹ️  Demand section already exists, updating...');
                        existingDemandSection.remove();
                    }
            
                    // Create demand factor section
                    const demandSection = document.createElement('div');
                    demandSection.className = 'calculation-section demand-calculation-section';
                    demandSection.style.marginTop = '30px';
                    demandSection.style.borderTop = '3px solid #667eea';
                    demandSection.style.paddingTop = '20px';
                    demandSection.style.backgroundColor = '#f8f9ff';
                    demandSection.style.padding = '20px';
                    demandSection.style.borderRadius = '8px';
                    demandSection.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.1)';
            
                    demandSection.innerHTML = `
                        <h3 style="color: #667eea; margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1.5em;">📊</span>
                            <span>Demand & Diversity Factor Calculations</span>
                        </h3>
                        <div style="background: white; border-left: 4px solid #667eea; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                            <p style="margin: 0; color: #666; font-size: 0.95em;">
                                <strong>💡 About Demand & Diversity Factors:</strong><br>
                                These calculations apply NEC Article 220 and IEEE 141-1993 standards to determine realistic operating loads 
                                based on equipment usage patterns. This ensures conservative design while accounting for actual system behavior.
                            </p>
                        </div>
                        <pre class="calculation-steps" style="
                            background: #ffffff; 
                            padding: 20px; 
                            border-radius: 8px; 
                            overflow-x: auto; 
                            line-height: 1.6; 
                            font-size: 13px;
                            font-family: 'Courier New', Courier, monospace;
                            border: 1px solid #e0e0e0;
                            box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
                            white-space: pre-wrap;
                            word-wrap: break-word;
                        ">${loadFlowResult.demandCalculationSteps}</pre>
                        <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 12px; border-radius: 4px; margin-top: 15px;">
                            <p style="margin: 0; color: #2e7d32; font-size: 0.9em;">
                                <strong>✅ Standards Applied:</strong> 
                                NEC Article 220 (Demand Factors) | 
                                NEC Article 430.24 (Motor Demand) | 
                                IEEE 141-1993 (Diversity Factors)
                            </p>
                        </div>
                    `;
            
                    // Append to calculation steps container
                    calcStepsContainer.appendChild(demandSection);
            
                    console.log('✅ Demand factor calculation steps added to UI');
                    console.log(`   Section ID: demand-calculation-section`);
                    console.log(`   Steps length: ${loadFlowResult.demandCalculationSteps.length} characters`);
                } else {
                    console.warn('⚠️  calculationSteps container not found in DOM');
                    console.warn('   Make sure displayCalculationResults() creates this container');
                }
            }, 500); // Wait 500ms for display to render
        }

        // ═══════════════════════════════════════════════════════════
        // 3. VOLTAGE DROP ANALYSIS
        // ═══════════════════════════════════════════════════════════
        console.log('📉 Running Voltage Drop Analysis...');
        
        let voltageDropResults = null;
        if (typeof calculateVoltageDrop !== 'function') {
            console.warn('⚠️ WARNING: calculateVoltageDrop function not found! Skipping voltage drop analysis.');
        } else {
            try {
                voltageDropResults = calculateVoltageDrop(busId, path, loadFlowResult);
            } catch (vdError) {
                console.error('❌ Error in voltage drop calculation:', vdError);
                console.warn('⚠️ Continuing without voltage drop analysis');
                voltageDropResults = null;
            }
        }
        
        // ═══════════════════════════════════════════════════════════
        // 4. ARC FLASH ANALYSIS (IEEE 1584-2018 & NFPA 70E-2021)
        // ═══════════════════════════════════════════════════════════
        console.log('🔥 Running Arc Flash Analysis...');
        
        let arcFlashResults = null;
        
        if (typeof calculateArcFlash !== 'function') {
            console.warn('⚠️ WARNING: calculateArcFlash function not found! Skipping arc flash analysis.');
        } else {
            try {
                if (shortCircuitResults?.faultCurrents?.threePhaseSym) {
                    arcFlashResults = calculateArcFlash(busId, {
                        threePhaseFault: {
                            faultCurrent: shortCircuitResults.faultCurrents.threePhaseSym
                        }
                    }, {
                        equipmentType: 'VCB',
                        clearingTimeCycles: 2,
                    });
                    
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
        // ═══════════════════════════════════════════════════════════
        
        const baseKVA = 10000;
        const baseVoltage = bus.voltage;
        const baseZ = Math.pow(baseVoltage, 2) / (baseKVA * 1000);
        const baseCurrent = (baseKVA * 1000) / (Math.sqrt(3) * baseVoltage);
        
        let totalRpu, totalXpu, totalZpu;
        
        if (shortCircuitResults?.totalImpedance) {
            const totalZ = shortCircuitResults.totalImpedance.magnitude || 0;
            const xrRatio = shortCircuitResults.xrRatio || 1;
            
            const r = totalZ / Math.sqrt(1 + Math.pow(xrRatio, 2));
            const x = r * xrRatio;
            
            totalRpu = r / baseZ;
            totalXpu = x / baseZ;
            totalZpu = totalZ / baseZ;
        }
        
        bus.results = {
            shortCircuit: shortCircuitResults,
            systemFault: systemFaultResults,
            motorContribution: motorContributionResults,
            loadFlow: loadFlowResult,
            voltageDrop: voltageDropResults,
            arcFlash: arcFlashResults,
            
            baseKVA: baseKVA,
            baseVoltage: baseVoltage,
            baseZ: baseZ,
            baseCurrent: baseCurrent,
            
            totalRpu: totalRpu,
            totalXpu: totalXpu,
            totalZpu: totalZpu,
            
            faultCurrents: shortCircuitResults.faultCurrents,
            totalImpedance: shortCircuitResults.totalImpedance,
            xrRatio: shortCircuitResults.xrRatio,
            path: path,
            method: method,
            calculationDate: calculationDateStamp,
            
            analysisComplete: true,
            analysisTypes: ['shortCircuit', 'loadFlow', 'voltageDrop', 'arcFlash'],
            
            includesMotorContribution: motorContributionResults?.motorCount > 0 || false,
            motorCount: motorContributionResults?.motorCount || 0,
            
            demandFactorsEnabled: demandFactorsApplied,
            demandFactorsAttempted: demandFactorsAttempted,
            
            arcFlashAnalyzed: arcFlashResults !== null
        };
        
        console.log(`📊 Per-Unit Base Values for ${bus.name}:`);
        console.log(`   Base kVA: ${baseKVA} kVA`);
        console.log(`   Base Voltage: ${baseVoltage} V`);
        console.log(`   Base Impedance: ${baseZ.toFixed(6)} Ω`);
        console.log(`   Base Current: ${baseCurrent.toFixed(2)} A`);
        if (totalZpu !== undefined) {
            console.log(`   Per-Unit Impedance: ${totalZpu.toFixed(6)} pu`);
        }
        
        bus.pathComponents = path.map((segment, index) => ({
            sequence: index,
            bus: segment.bus,
            component: segment.component
        }));
        
        updateBusTree();
        updateBusesContent();
        
        selectedBusId = busId;
        
        // Generate recommendations
        if (typeof recommendationEngine !== 'undefined' && recommendationEngine?.analyzeBus) {
            try {
                const busRecommendations = recommendationEngine.analyzeBus(bus);
                console.log(`📊 ${busRecommendations.length} recommendations generated`);
            } catch (recError) {
                console.warn('⚠️ Error generating recommendations:', recError);
            }
        }
        
        // Display results
        if (typeof displayCalculationResults === 'function') {
            try {
                displayCalculationResults(busId, shortCircuitResults, loadFlowResult, voltageDropResults, arcFlashResults);
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
        console.log('   - Load Flow: ' + (loadFlowResult ? '✓' : '⚠️ Skipped'));
        console.log('   - Voltage Drop: ' + (voltageDropResults ? '✓' : '⚠️ Skipped'));
        console.log('   - Arc Flash: ' + (arcFlashResults ? '✓' : '⚠️ Skipped'));
        console.log('   - Demand Factors: ' + (demandFactorsApplied ? '✅ APPLIED' : '⚠️ NOT APPLIED'));
        console.log('═'.repeat(80) + '\n');
        
    } catch (error) {
        console.error('Error calculating bus:', error);
        console.error('Stack trace:', error.stack);
        alert('Error calculating bus:\n\n' + error.message + '\n\nCheck browser console for details.');
    }
}

/**
 * Calculate arc flash for a bus (standalone function)
 */
function performArcFlashAnalysis(busId) {
    try {
        const bus = buses.find(b => b.id === busId);
        if (!bus) {
            alert('Bus not found');
            return null;
        }
        
        const scResult = bus.results?.shortCircuit;
        if (!scResult) {
            alert('Please calculate short circuit first');
            return null;
        }
        
        const result = calculateArcFlash(busId, {
            threePhaseFault: {
                faultCurrent: scResult.faultCurrents.threePhaseSym
            }
        }, {
            equipmentType: 'VCB',
            clearingTimeCycles: 2
        });
        
        if (!window.arcFlashResults) window.arcFlashResults = {};
        window.arcFlashResults[busId] = result;
        
        if (bus.results) {
            bus.results.arcFlash = result;
            bus.results.arcFlashAnalyzed = true;
        }
        
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
    
    if (typeof calculateTotalMotorContribution === 'function') {
        console.log('✅ Feature #1: Motor Contribution ENABLED');
    } else {
        console.log('⚠️ Feature #1: Motor Contribution NOT AVAILABLE');
    }
    
    if (typeof calculateLoadFlowWithDemand === 'function' && typeof window.DEMAND_FACTORS !== 'undefined') {
        console.log('✅ Feature #5: Demand & Diversity Factors ENABLED');
    } else {
        console.log('⚠️ Feature #5: Demand & Diversity Factors NOT AVAILABLE');
    }
    
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
            
            if (bus.results?.includesMotorContribution) {
                motorsFoundCount++;
            }
            
            if (bus.results?.demandFactorsEnabled) {
                demandAppliedCount++;
            }
            
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

// Export functions
window.calculateBus = calculateBus;
window.calculateAllBuses = calculateAllBuses;
window.performArcFlashAnalysis = performArcFlashAnalysis;

console.log('✅ Calculations coordinator v1.3.4 loaded - Demand Factor Integration Fixed');
console.log('   - calculateBus: Available');
console.log('   - calculateAllBuses: Available');
console.log('   - performArcFlashAnalysis: Available');
console.log('   - Feature #1 Integration: ' + (typeof calculateTotalMotorContribution === 'function' ? 'READY' : 'PENDING'));
console.log('   - Feature #5 Integration: ' + (typeof calculateLoadFlowWithDemand === 'function' ? 'READY' : 'PENDING'));
console.log('   - Arc Flash Integration: ' + (typeof calculateArcFlash === 'function' ? 'READY' : 'PENDING'));
console.log('   - Demand Factor Debugging: COMPREHENSIVE');
console.log('   - Multi-method attempt: ENABLED');
console.log('   - Error handling: ENHANCED');
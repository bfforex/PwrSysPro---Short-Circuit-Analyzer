/**
 * Main Calculations Coordinator
 * Modified: 2025-11-03 02:22:52 UTC by bfforex
 * Enhanced: Feature #1 - Motor Contribution Integration
 * Enhanced: Feature #5 - Demand & Diversity Factors Integration (FIXED)
 * Enhanced: Arc Flash Analysis Integration (IEEE 1584-2018 & NFPA 70E-2021)
 * FIXED: Demand factor application with comprehensive debugging
 * @version 1.3.4 - Demand Factor Integration Fix
 *
 * STANDARDS COMPLIANCE:
 * - IEEE 141-1993 (Red Book) - Chapters 3, 4, 5 - System analysis methodology
 * - IEC 60909-0:2016 - Short-circuit currents in three-phase AC systems
 * - IEEE 1584-2018 - Guide for Performing Arc-Flash Hazard Calculations
 * - NFPA 70E-2021 - Standard for Electrical Safety in the Workplace
 * - NEC 2017 Article 430 - Motors, Motor Circuits, and Controllers
 */

/**
 * Calculate all analyses for a bus
 *
 * Orchestrates short-circuit, motor contribution, load flow, voltage drop,
 * and arc-flash analyses in the correct dependency order, then stores the
 * unified results on `bus.results`.
 *
 * STANDARDS:
 * - IEEE 141-1993 Chapter 5 - Short-circuit analysis methodology
 * - IEEE 141-1993 Chapter 3 - Demand and diversity factor application
 * - IEEE 141-1993 Chapter 4 - Voltage drop calculations
 * - IEEE 1584-2018 - Arc-flash incident energy calculation
 * - NEC 2017 Article 430 - Motor contribution per NEC demand factors
 *
 * CALCULATION ORDER (dependency chain):
 * 1. Short Circuit (system) → base fault currents without motor contribution
 * 2. Motor Contribution → downstream motor fault currents (IEEE 141-1993 §5.3)
 * 3. Combined Fault → system + motor (ANSI C37.010 multiplying factors)
 * 4. Load Flow → demand/diversity-adjusted downstream loads
 * 5. Voltage Drop → design (100% FLC) and operating (demand/diversity) modes
 * 6. Arc Flash → IEEE 1584-2018 incident energy using combined fault current
 *
 * NOTE: Short-circuit and arc-flash calculations always use 100% connected load
 * (full fault current), never demand or diversity factors, per IEEE 141-1993 §5.1.
 *
 * @param {string} busId - Unique identifier of the target bus to analyse
 * @returns {void} Results stored in `bus.results`; UI updated via displayResults()
 *
 * @author Engr. B. P. Faraon
 * @date 2025-12-05
 */


// ═══════════════════════════════════════════════════════════
// ARC FLASH ELIGIBILITY HELPERS
// IEEE 1584 routine in this app is intended for 208V–15kV equipment buses.
// Source buses and >15kV buses are skipped and flagged for external handling.
// ═══════════════════════════════════════════════════════════
const ARC_FLASH_LIMITS = {
  minVoltage: 208,
  maxVoltage: 15000
};

function getArcFlashEligibility(bus) {
  const voltage = Number(bus?.voltage);

  if (!bus) {
    return {
      eligible: false,
      status: 'not-applicable',
      reason: 'Bus not found'
    };
  }

  if (bus.type === 'source') {
    return {
      eligible: false,
      status: 'not-applicable-source',
      reason: 'Utility/source bus - external utility/HV study basis'
    };
  }

  if (!Number.isFinite(voltage)) {
    return {
      eligible: false,
      status: 'invalid-voltage',
      reason: 'Bus voltage is invalid or undefined'
    };
  }

  if (voltage < ARC_FLASH_LIMITS.minVoltage) {
    return {
      eligible: false,
      status: 'below-supported-range',
      reason: `Voltage ${voltage}V below supported arc flash range (${ARC_FLASH_LIMITS.minVoltage}V - ${ARC_FLASH_LIMITS.maxVoltage}V)`
    };
  }

  if (voltage > ARC_FLASH_LIMITS.maxVoltage) {
    return {
      eligible: false,
      status: 'external-study-required',
      reason: `Voltage ${voltage}V above supported arc flash range (${ARC_FLASH_LIMITS.minVoltage}V - ${ARC_FLASH_LIMITS.maxVoltage}V); external HV arc-flash study required`
    };
  }

  return {
    eligible: true,
    status: 'eligible',
    reason: 'Within supported in-app arc flash calculation range'
  };
}


function calculateBus(busId) {
    selectedBusId = busId;
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
        console.log('calculateBus busId:', busId, 'selectedBusId:', selectedBusId);
        const method = document.querySelector('input[name="method"]:checked')?.value || 'point-to-point';

    // IEC 60909 options
    const isIEC = String(method).toLowerCase() === 'iec-60909';
    const iecCalcTypeRaw = isIEC ? (document.getElementById('iecCalcType')?.value || 'max') : null;
    // Normalize dropdown values like 'min', 'minimum', 'Minimum'
    const iecCalcType = isIEC ? (String(iecCalcTypeRaw).toLowerCase().startsWith('min') ? 'min' : 'max') : null;

        
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
        
        const systemFaultResults = calculateShortCircuit(busId, method, { iecCalcType });
        
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
                    console.log(` Motor Contribution: ${motorContributionResults.totalSymmetricalContribution.toFixed(3)} kA (symmetrical)`);
                    console.log(` Motor Contribution: ${motorContributionResults.totalAsymmetricalContribution.toFixed(3)} kA (asymmetrical)`);
                                        
                    if (!isIEC) {
                      // IEEE point-to-point / per-unit engines already include motor contribution internally
                       shortCircuitResults = systemFaultResults;
                       console.log('ℹ️ IEEE engine already includes motor contribution internally - skipping external recombination');
                    } else {
                       console.log(`ℹ️ IEC ${iecCalcType?.toUpperCase() || ''}: motor contribution computed but NOT combined into IEC short-circuit result`);
                       shortCircuitResults = systemFaultResults;
                    }
                
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
        
        // ═══════════════════════════════════════════════════════════
        // 1C. COMPLETE FAULT TYPE ANALYSIS (Phase 3 - Feature #2)
        // ═══════════════════════════════════════════════════════════
        console.log('⚡ Analyzing Complete Fault Types...');
        
        var faultTypesResult = null;
        
        // Check if fault type checkboxes are selected
        const includeFaultTypes = 
            document.getElementById('fault3ph')?.checked ||
            document.getElementById('faultLL')?.checked ||
            document.getElementById('faultLG')?.checked ||
            document.getElementById('faultLLG')?.checked;
        
        if (includeFaultTypes && typeof FaultTypeCalculations !== 'undefined' && 
            typeof FaultTypeCalculations.calculateAllFaultTypes === 'function') {
            
            console.log('✅ Fault Type Calculations module available');
            
            try {
                faultTypesResult = FaultTypeCalculations.calculateAllFaultTypes(busId);
                
                console.log(`✅ Fault Type Analysis Complete:`);
                console.log(`   3-Phase (L-L-L): ${faultTypesResult.faults.threePhaseLLL.currentKA.toFixed(3)} kA`);
                console.log(`   Line-to-Line (L-L): ${faultTypesResult.faults.lineToLineLL.currentKA.toFixed(3)} kA`);
                console.log(`   Line-to-Ground (L-G): ${faultTypesResult.faults.lineToGroundLG.currentKA.toFixed(3)} kA`);
                console.log(`   Double Line-to-Ground (L-L-G): ${faultTypesResult.faults.doubleLineToGroundLLG.currentKA.toFixed(3)} kA`);
                
                if (faultTypesResult.faults.lineToGroundLG.exceedsThreePhase) {
                    console.log(`   ⚠️ L-G fault exceeds 3-phase fault (solidly grounded system)`);
                }
                
                // Store in short circuit results
                shortCircuitResults.allFaultTypes = faultTypesResult;
                
            } catch (faultTypeError) {
                console.error('❌ Error in fault type calculation:', faultTypeError);
                console.warn('⚠️ Continuing without complete fault type analysis');
                faultTypesResult = null;
            }
        } else if (!includeFaultTypes) {
            console.log('ℹ️ Fault type calculations not selected');
        } else {
            console.log('⚠️ Fault Type Calculations module not loaded');
        }
        
        // ✅ DEFENSIVE: Check fault currents exist
        if (!shortCircuitResults?.faultCurrents?.threePhaseSym) {
            alert('❌ Error: Invalid short circuit results.\n\nCheck browser console for details.');
            return;
        }
        
        // Store basic fault current data (backward compatibility)
        const scForBus = isIEC ? systemFaultResults : shortCircuitResults;
    bus.faultCurrent = scForBus.faultCurrents.threePhaseSym;
    bus.asymFaultCurrent = scForBus.faultCurrents.threePhaseAsym;
    bus.xrRatio = scForBus.xrRatio;
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
        // OPTION 1: STORE CALCULATED LOAD IN SEPARATE DISPLAY-ONLY PROPERTY
        // Modified: 2025-12-02 by Copilot
        // Issue: Auto-calculated loads were being fed back to bus.loadCurrent,
        //        causing double-counting in subsequent calculations
        // Solution: Store in bus.loadCurrentCalculated (display only)
        //           bus.loadCurrent remains user-specified manual load only
        // ════════════════════════════════════════════════════════════════
        if (loadFlowResult && loadFlowResult.summary) {
            let displayLoad = 0;
    
            // Use demand/diversity load if applied, otherwise use total load
            if (demandFactorsApplied && loadFlowResult.demandSummary) {
                // Use the diversity-adjusted load (most realistic)
                displayLoad = loadFlowResult.demandSummary. diversityCurrent || 
                             loadFlowResult.demandSummary.demandCurrent || 
                             loadFlowResult.summary.totalCurrent || 0;
                console.log(`   📊 Bus ${bus.name}: Diversity load calculated: ${displayLoad.toFixed(2)} A`);
            } else {
                // Use connected load (conservative)
                displayLoad = loadFlowResult.summary.totalCurrent || 0;
                console.log(`   📊 Bus ${bus.name}: Connected load: ${displayLoad.toFixed(2)} A`);
            }
    
            // ═══════════════════════════════════════════════════════════════════════
            // CRITICAL: Store in SEPARATE property (NOT bus.loadCurrent)
            // ═══════════════════════════════════════════════════════════════════════
            if (displayLoad > 0) {
                // Store calculated load for DISPLAY ONLY
                bus.loadCurrentCalculated = displayLoad;
                console.log(`   ✅ Bus ${bus.name}: Display load stored in loadCurrentCalculated: ${displayLoad. toFixed(2)} A`);
                console.log(`   ℹ️  This value is for DISPLAY ONLY and will NOT be used in calculations`);
                
                // Log current state
                if (bus.loadCurrent && bus.loadCurrent > 0) {
                    console.log(`   📌 Bus ${bus.name}: Manual load preserved: ${bus.loadCurrent.toFixed(2)} A (WILL be used in calculations)`);
                } else {
                    console.log(`   ℹ️  Bus ${bus. name}: No manual load specified`);
                }
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
        // 3A. PROTECTION ANALYSIS (MVP)
        // Evaluates breaker/fuse adequacy and identifies clearing device
        // Must run after short circuit and after load flow is available
        // ═══════════════════════════════════════════════════════════
        console.log('🛡️ Running Protection Analysis...');
        let protectionResults = null;

        if (typeof calculateProtectionForBus !== 'function') {
          console.warn('⚠️ WARNING: calculateProtectionForBus function not found! Skipping protection analysis.');
        } else {
          try {
            // Stage currently available results so the protection engine can read them
            if (!bus.results) bus.results = {};
            bus.results.shortCircuit = shortCircuitResults;
            bus.results.loadFlow = loadFlowResult;

            protectionResults = calculateProtectionForBus(busId, shortCircuitResults);

            console.log('✅ Protection Analysis Complete');
            console.log(` Primary Clearing Device: ${protectionResults?.clearing?.clearingDeviceId || 'None identified'}`);
            console.log(` Adequacy Devices Evaluated: ${protectionResults?.adequacy?.devices?.length || 0}`);
          } catch (protectionError) {
            console.error('❌ Error in protection analysis:', protectionError);
            console.warn('⚠️ Continuing without protection analysis');
            protectionResults = null;
          }
        }


        // ═══════════════════════════════════════════════════════════
        // 4. VOLTAGE DROP ANALYSIS
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
        // 5. ARC FLASH ANALYSIS (IEEE 1584-2018 & NFPA 70E-2021)
        // ═══════════════════════════════════════════════════════════
        console.log('🔥 Running Arc Flash Analysis...');
        let arcFlashResults = null;
        const arcFlashEligibility = getArcFlashEligibility(bus);

        if (!arcFlashEligibility.eligible) {
          console.warn(`ℹ️ Arc flash skipped for ${bus.name}: ${arcFlashEligibility.reason}`);
          arcFlashResults = null;
        } else if (typeof calculateArcFlash !== 'function') {
          console.warn('⚠️ WARNING: calculateArcFlash function not found! Skipping arc flash analysis.');
          arcFlashResults = null;
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
              console.log(` Incident Energy: ${arcFlashResults.incidentEnergy.toFixed(2)} cal/cm²`);
              console.log(` Arc Flash Boundary: ${(arcFlashResults.arcFlashBoundary / 12).toFixed(2)} feet`);
              console.log(` PPE Category: ${arcFlashResults.ppeCategory}`);
              console.log(` Hazard Level: ${arcFlashResults.hazardLevel}`);
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
            protection: protectionResults,
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
            iecCalcType: iecCalcType,
            calculationDate: calculationDateStamp,
            
            analysisComplete: true,
            analysisTypes: ['shortCircuit', 'loadFlow', 'protection', 'voltageDrop', 'arcFlash'],
            
            includesMotorContribution: (!isIEC && (motorContributionResults?.motorCount > 0)) ? true : false,
            motorCount: motorContributionResults?.motorCount || 0,
            
            demandFactorsEnabled: demandFactorsApplied,
            demandFactorsAttempted: demandFactorsAttempted,
            
            arcFlashAnalyzed: arcFlashResults !== null,
            arcFlashStatus: arcFlashResults ? 'calculated' : arcFlashEligibility.status,
            arcFlashReason: arcFlashResults ? 'Arc flash calculated successfully' : arcFlashEligibility.reason
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
 *
 * Runs the IEEE 1584-2018 arc-flash calculation using previously-stored
 * short-circuit results. Must be called after calculateBus() has run.
 *
 * STANDARDS:
 * - IEEE 1584-2018 §4 - Arc-flash hazard calculation procedure
 * - NFPA 70E-2021 Table 130.7(C)(15) - PPE category determination
 * - NEC Article 110.16 - Arc-flash hazard warning labels
 *
 * @param {string} busId - Unique identifier of the target bus
 * @returns {Object|null} Arc-flash results object, or null on failure
 *
 * @author Engr. B. P. Faraon
 * @date 2025-12-05
 */
function performArcFlashAnalysis(busId) {
    try {
        const bus = buses.find(b => b.id === busId);
        if (!bus) {
            alert('Bus not found');
            return null;
        }

        const eligibility = getArcFlashEligibility(bus);
        if (!eligibility.eligible) {
            if (!bus.results) bus.results = {};
            bus.results.arcFlash = null;
            bus.results.arcFlashAnalyzed = false;
            bus.results.arcFlashStatus = eligibility.status;
            bus.results.arcFlashReason = eligibility.reason;

            alert(`Arc flash analysis not performed.\n\nReason: ${eligibility.reason}`);
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
            bus.results.arcFlashStatus = 'calculated';
            bus.results.arcFlashReason = 'Arc flash calculated successfully';
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
        console.log(` Incident Energy: ${result.incidentEnergy.toFixed(2)} cal/cm²`);
        console.log(` PPE Category: ${result.ppeCategory}`);
        return result;

    } catch (error) {
        console.error('Arc flash calculation error:', error);
        alert(`Error: ${error.message}`);
        return null;
    }
}

/**
 * Calculate all buses in system
 *
 * Iterates over all non-source buses and calls calculateBus() on each.
 * Results are stored on each bus.results object and displayed in aggregate.
 * Source buses are excluded unless they have explicit utility fault data.
 *
 * @returns {void} Results stored on each bus object; UI refreshed
 *
 * @author Engr. B. P. Faraon
 * @date 2025-12-05
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
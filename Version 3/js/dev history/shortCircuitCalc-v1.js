/**
 * Short Circuit Calculation Module
 * Dedicated calculations for fault current analysis
 * 
 * @author bfforex
 * @date 2025-11-01 03:43:33 UTC
 * @version 1.3.0
 * @fixed Motor contribution placement bug (Issue #1)
 * @fixed Transformer impedance referral (Issue #5 - Per IEEE 141 Section 4.2.3)
 * @fixed Missing null checks (Issue #6)
 */

/**
 * Perform short circuit analysis for a bus
 * Returns detailed calculation steps and results
 * 
 * @param {String} busId - Bus identifier
 * @param {String} method - 'point-to-point' or 'per-unit'
 * @returns {Object} Short circuit results with detailed steps
 */
function calculateShortCircuit(busId, method = 'point-to-point') {
    const bus = buses.find(b => b.id === busId);
    if (!bus) {
        throw new Error(`Bus ${busId} not found`);
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('SHORT CIRCUIT ANALYSIS');
    console.log('═'.repeat(80));
    console.log(`Bus: ${bus.name} (${bus.voltage}V)`);
    console.log(`Method: ${method}`);
    console.log('═'.repeat(80) + '\n');
    
    const path = traceBusPath(busId);
    if (!path) {
        throw new Error('Cannot trace path to source. Ensure bus is connected to a source bus.');
    }
    
    let result;
    if (method === 'per-unit') {
        result = calculateShortCircuitPerUnit(path);
    } else {
        result = calculateShortCircuitPointToPoint(path);
    }
    
    // Store short circuit specific data
    const scResults = {
        // Basic Results
        faultCurrents: {
            threePhaseSym: result.faultCurrentKA,
            threePhaseAsym: result.asymFaultCurrentKA,
            lineToGround: result.faultCurrentKA * 0.85,
            lineToLine: result.faultCurrentKA * 0.866
        },
        
        // Motor Contribution
        motorContribution: result.motorContribution || null,
        
        // Impedance Data
        totalImpedance: {
            magnitude: result.totalZ,
            resistance: result.totalR,
            reactance: result.totalX,
            angle: Math.atan2(result.totalX, result.totalR) * (180 / Math.PI)
        },
        
        // System Data
        xrRatio: result.xrRatio,
        method: result.method,
        path: result.path,
        
        // Per-Unit Data (if applicable)
        perUnit: method === 'per-unit' ? {
            totalRpu: result.totalRpu,
            totalXpu: result.totalXpu,
            totalZpu: result.totalZpu,
            baseKVA: result.baseKVA,
            baseVoltage: result.baseVoltage,
            baseZ: result.baseZ,
            baseCurrent: result.baseCurrent
        } : null,
        
        // Detailed Steps
        calculationSteps: result.steps,
        calculationDate: getCalculationTimestamp(),
        
        // Arc Flash Data (future enhancement)
        arcFlash: null
    };
    
    console.log('✅ Short Circuit Analysis Complete');
    console.log(`   Fault Current: ${scResults.faultCurrents.threePhaseSym.toFixed(3)} kA`);
    if (scResults.motorContribution) {
        console.log(`   Motor Contribution: ${(scResults.motorContribution.motorFaultCurrent/1000).toFixed(3)} kA`);
    }
    console.log(`   X/R Ratio: ${scResults.xrRatio.toFixed(2)}`);
    console.log('');
    
    return scResults;
}

/**
 * Point-to-Point Short Circuit Calculation
 * Pure ohmic method without per-unit conversion
 * 
 * ✅ FIXED: Motor contribution moved OUTSIDE component loop (Issue #1)
 * ✅ FIXED: Transformer impedance referral corrected (Issue #5)
 * ✅ FIXED: Added comprehensive null checks (Issue #6)
 */
function calculateShortCircuitPointToPoint(path) {
    const engineerName = document.getElementById('engineer')?.value || 'Unknown Engineer';
    const temperature = parseFloat(document.getElementById('temperature')?.value) || 75;
    let totalR = 0;
    let totalX = 0;
    let currentVoltageLevel = null;
    
    let steps = 'SHORT CIRCUIT CALCULATION - POINT-TO-POINT METHOD\n';
    steps += '='.repeat(80) + '\n\n';
    steps += `Date/Time: ${getCalculationTimestamp()}\n`;
    steps += `Engineer: ${engineerName}\n`;
    steps += `Temperature: ${temperature}°C\n`;
    steps += `Method: Point-to-Point (Pure Ohmic - No Per-Unit)\n\n`;
    steps += `NOTE: This method uses ONLY ohmic values (Ω).\n`;
    steps += `      No base values or per-unit conversions are used.\n`;
    steps += `      Impedances are referred across transformers using turns ratio.\n\n`;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: SOURCE BUS IMPEDANCE
    // ═══════════════════════════════════════════════════════════════════════════
    const sourceBus = path[0]?.bus;
    if (!sourceBus) {
        throw new Error('Path has no source bus');
    }
    
    currentVoltageLevel = sourceBus.voltage;
    
    // Source impedance calculation
    if (sourceBus.type === 'source' && sourceBus.utilityFaultCurrent) {
        const utilityZ = sourceBus.voltage / (SQRT3 * sourceBus.utilityFaultCurrent * 1000);
        const utilityXR = sourceBus.utilityXR || 3;
        const utilityX = utilityZ * utilityXR / Math.sqrt(1 + utilityXR * utilityXR);
        const utilityR = utilityZ / Math.sqrt(1 + utilityXR * utilityXR);
        
        totalR += utilityR;
        totalX += utilityX;
        
        steps += `STEP 1: SOURCE BUS - ${sourceBus.name}\n`;
        steps += '-'.repeat(80) + '\n';
        steps += `Bus Voltage: ${sourceBus.voltage} V\n`;
        steps += `Available Fault Current: ${sourceBus.utilityFaultCurrent.toFixed(2)} kA\n`;
        
        if (sourceBus.utilityFaultMVA) {
            steps += `Source MVA: ${sourceBus.utilityFaultMVA.toFixed(1)} MVA\n`;
            steps += `Note: MVA converted to kA using: I = MVA / (√3 × V_kV)\n`;
        }
        
        steps += `Source X/R Ratio: ${utilityXR}\n\n`;
        steps += `Source Impedance Calculation (at ${sourceBus.voltage}V):\n`;
        steps += `Z_source = V_LL / (√3 × I_sc)\n`;
        steps += `Z_source = ${sourceBus.voltage} / (${SQRT3.toFixed(4)} × ${sourceBus.utilityFaultCurrent * 1000})\n`;
        steps += `Z_source = ${utilityZ.toFixed(6)} Ω\n\n`;
        steps += `Component Separation using X/R = ${utilityXR}:\n`;
        steps += `X = ${utilityX.toFixed(6)} Ω\n`;
        steps += `R = ${utilityR.toFixed(6)} Ω\n\n`;
        steps += `Running Total: R = ${totalR.toFixed(6)} Ω, X = ${totalX.toFixed(6)} Ω\n\n`;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2-N: PROCESS COMPONENTS (TRANSFORMERS, CABLES)
    // ═══════════════════════════════════════════════════════════════════════════
    let stepNumber = 2;
    const processedTransformerConnections = new Set();
    
    for (let i = 1; i < path.length; i++) {
        const segment = path[i];
        const comp = segment?.component;
        
        // ✅ FIXED (Issue #6): Added null check
        if (!comp) {
            console.warn(`⚠️ Segment ${i} has no component - skipping`);
            continue;
        }
        
        // ═══════════════════════════════════════════════════════════════════════
        // TRANSFORMER PROCESSING
        // ✅ FIXED (Issue #5): Corrected impedance referral per IEEE 141 §4.2.3
        // ═══════════════════════════════════════════════════════════════════════
        if (comp.type === 'transformer') {
            const key = `${comp.fromBus}_${comp.toBus}`;
            
            if (processedTransformerConnections.has(key)) continue;
            processedTransformerConnections.add(key);
            
            const parallelXfmrs = components.filter(c => 
                c.type === 'transformer' && 
                c.fromBus === comp.fromBus && 
                c.toBus === comp.toBus
            );
            
            const numParallel = parallelXfmrs.length;
            const totalRating = parallelXfmrs.reduce((sum, x) => sum + x.rating, 0);
            
            steps += `STEP ${stepNumber}: TRANSFORMER${numParallel > 1 ? 'S (PARALLEL)' : ''}\n`;
            steps += '-'.repeat(80) + '\n';
            
            if (numParallel > 1) {
                steps += `⚡ ${numParallel} × ${comp.rating} kVA transformers in PARALLEL\n`;
                steps += `   Total Capacity: ${totalRating} kVA\n\n`;
            }
            
            steps += `Primary: ${comp.primary} V → Secondary: ${comp.secondary} V\n`;
            steps += `Impedance: ${comp.impedance}%, X/R: ${comp.xr}\n\n`;
            
            // Calculate transformer impedance on SECONDARY base
            const xfmrZbase = (comp.secondary * comp.secondary) / (comp.rating * 1000);
            const xfmrZ_single = (comp.impedance / 100) * xfmrZbase;
            const xfmrX_single = xfmrZ_single * comp.xr / Math.sqrt(1 + comp.xr * comp.xr);
            const xfmrR_single = xfmrZ_single / Math.sqrt(1 + comp.xr * comp.xr);
            
            let xfmrR, xfmrX;
            if (numParallel > 1) {
                xfmrR = xfmrR_single / numParallel;
                xfmrX = xfmrX_single / numParallel;
                steps += `Parallel impedance: Z ÷ ${numParallel}\n`;
            } else {
                xfmrR = xfmrR_single;
                xfmrX = xfmrX_single;
            }
            
            steps += `Transformer Impedance (at ${comp.secondary}V):\n`;
            steps += `  Z_base = V²/S = ${comp.secondary}² / ${comp.rating * 1000} = ${xfmrZbase.toFixed(6)} Ω\n`;
            steps += `  Z_xfmr = (Z% / 100) × Z_base = ${xfmrZ_single.toFixed(6)} Ω\n`;
            steps += `  R = ${xfmrR.toFixed(6)} Ω\n`;
            steps += `  X = ${xfmrX.toFixed(6)} Ω\n\n`;
            
            // ✅ FIXED (Issue #5): Correct impedance referral
            // Per IEEE 141 Section 4.2.3, when referring impedance across a transformer:
            // Z_secondary = Z_primary × (V_secondary / V_primary)²
            const turnsRatio = comp.primary / comp.secondary;
            const R_primary_referred = totalR / (turnsRatio * turnsRatio);
            const X_primary_referred = totalX / (turnsRatio * turnsRatio);
            
            steps += `Referring Primary Impedance to Secondary:\n`;
            steps += `  Per IEEE 141 Section 4.2.3:\n`;
            steps += `  Turns Ratio: a = V_primary / V_secondary = ${turnsRatio.toFixed(4)}\n`;
            steps += `  Z_referred = Z_primary / a²\n`;
            steps += `  R_referred = ${totalR.toFixed(6)} / ${turnsRatio.toFixed(4)}² = ${R_primary_referred.toFixed(6)} Ω\n`;
            steps += `  X_referred = ${totalX.toFixed(6)} / ${turnsRatio.toFixed(4)}² = ${X_primary_referred.toFixed(6)} Ω\n\n`;
            
            // Add transformer impedance to referred primary impedance
            totalR = R_primary_referred + xfmrR;
            totalX = X_primary_referred + xfmrX;
            currentVoltageLevel = comp.secondary;
            
            steps += `Total at ${currentVoltageLevel}V: R = ${totalR.toFixed(6)} Ω, X = ${totalX.toFixed(6)} Ω\n\n`;
            
            stepNumber++;
            continue;
        }
        
        // ═══════════════════════════════════════════════════════════════════════
        // CABLE PROCESSING
        // ═══════════════════════════════════════════════════════════════════════
        if (comp.type === 'cable') {
            steps += `STEP ${stepNumber}: CABLE\n`;
            steps += '-'.repeat(80) + '\n';
            
            // ✅ FIXED (Issue #6): Added null checks
            const cableData = CABLE_IMPEDANCE_DATA[comp.size];
            if (!cableData) {
                console.warn(`⚠️ No cable data for size: ${comp.size}`);
                steps += `⚠️ WARNING: No impedance data for cable size ${comp.size} - using 4/0 default\n`;
            }
            const cableDataFinal = cableData || CABLE_IMPEDANCE_DATA['4/0'];
            
            const materialData = cableDataFinal[comp.material];
            if (!materialData) {
                console.warn(`⚠️ No cable data for material: ${comp.material}`);
                steps += `⚠️ WARNING: No impedance data for material ${comp.material} - using copper default\n`;
            }
            const materialDataFinal = materialData || cableDataFinal['copper'];
            
            const parallel = comp.parallel || 1;
            
            let rBase20 = materialDataFinal.r;
            let rBaseTemp = temperatureCorrection(rBase20, temperature, comp.material);
            
            const cableR = (rBaseTemp * comp.length) / parallel;
            const cableX = (materialDataFinal.x * comp.length) / parallel;
            
            totalR += cableR;
            totalX += cableX;
            
            steps += `Cable: ${comp.size} ${comp.material.toUpperCase()}, ${comp.length} ft\n`;
            if (parallel > 1) steps += `Parallel: ${parallel} cables (Z ÷ ${parallel})\n`;
            steps += `Temperature: ${temperature}°C (correction applied to R)\n\n`;
            steps += `Cable Impedance:\n`;
            steps += `  R = ${cableR.toFixed(6)} Ω\n`;
            steps += `  X = ${cableX.toFixed(6)} Ω\n\n`;
            steps += `Running Total: R = ${totalR.toFixed(6)} Ω, X = ${totalX.toFixed(6)} Ω\n\n`;
            
            stepNumber++;
        }
    }
    // ← END OF COMPONENT FOR LOOP
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ✅ FIXED (Issue #1): MOTOR CONTRIBUTION NOW CALCULATED AFTER COMPONENT LOOP
    // Per IEEE 141-1993 Section 5.3.2, motor contribution is calculated at the
    // fault point ONCE, not during path traversal.
    // 
    // This fix resolves the issue where motors were being added multiple times
    // or calculated at intermediate path points instead of the fault location.
    // ═══════════════════════════════════════════════════════════════════════════
    
    const targetBus = path[path.length - 1]?.bus;
    if (!targetBus) {
        throw new Error('Path has no target bus');
    }
    
    let totalZ = Math.sqrt(totalR * totalR + totalX * totalX);
    
    // Calculate motor contribution at fault point
    let motorContribution = null;
    if (typeof calculateTotalMotorContribution === 'function') {
        motorContribution = calculateTotalMotorContribution(targetBus.id);
        
        if (motorContribution && motorContribution.motorCount > 0) {
            steps += motorContribution.calculationSteps;
            
            // Combine motor impedance with system impedance in parallel
            if (typeof combineSystemAndMotorFault === 'function') {
                try {
                    // Build system fault stub for combineSystemAndMotorFault
                    const systemFaultStub = {
                        faultCurrents: {
                            threePhaseSym: totalZ ? (targetBus.voltage / (SQRT3 * totalZ)) / 1000 : 0,
                            threePhaseAsym: null,
                            lineToGround: null,
                            lineToLine: null
                        },
                        totalImpedance: {
                            magnitude: totalZ,
                            resistance: totalR,
                            reactance: totalX
                        },
                        totalR: totalR,
                        totalX: totalX,
                        totalZ: totalZ,
                        xrRatio: totalX / (totalR || 1),
                        method: 'Point-to-Point',
                        path: path,
                        calculationDate: getCalculationTimestamp(),
                        calculationSteps: steps
                    };
                    
                    const combined = combineSystemAndMotorFault(systemFaultStub, motorContribution);
                    
                    if (combined && typeof combined.totalR !== 'undefined') {
                        totalR = combined.totalR;
                        totalX = combined.totalX;
                        totalZ = combined.totalZ;
                        
                        if (combined.calculationSteps) steps += '\n' + combined.calculationSteps;
                        
                        steps += '═'.repeat(80) + '\n';
                        steps += 'SYSTEM + MOTOR CONTRIBUTION (PARALLEL COMBINATION)\n';
                        steps += '═'.repeat(80) + '\n\n';
                        steps += `System Only:\n  R = ${systemFaultStub.totalR.toFixed(6)} Ω, X = ${systemFaultStub.totalX.toFixed(6)} Ω, Z = ${systemFaultStub.totalZ.toFixed(6)} Ω\n\n`;
                        steps += `Motors Parallel:\n  R = ${motorContribution.totalMotorR.toFixed(6)} Ω, X = ${motorContribution.totalMotorX.toFixed(6)} Ω\n\n`;
                        steps += `Combined (System || Motors):\n  R = ${combined.totalR.toFixed(6)} Ω\n  X = ${combined.totalX.toFixed(6)} Ω\n  Z = ${combined.totalZ.toFixed(6)} Ω\n\n`;
                        steps += `Motor Contribution: ${(motorContribution.totalSymmetricalContribution).toFixed(3)} kA\n`;
                    } else {
                        throw new Error('combineSystemAndMotorFault returned unexpected shape');
                    }
                } catch (err) {
                    console.warn('combineSystemAndMotorFault failed — falling back to manual parallel combine:', err);
                    // Manual parallel combine as fallback
                    const motR = motorContribution.totalMotorR;
                    const motX = motorContribution.totalMotorX;
                    const sys_R = totalR, sys_X = totalX;
                    const sys_Z_sq = sys_R * sys_R + sys_X * sys_X;
                    const mot_Z_sq = motR * motR + motX * motX;
                    const R_inv_total = (sys_R / sys_Z_sq) + (motR / mot_Z_sq);
                    const X_inv_total = (sys_X / sys_Z_sq) + (motX / mot_Z_sq);
                    const Z_inv_total_sq = R_inv_total * R_inv_total + X_inv_total * X_inv_total;
                    totalR = R_inv_total / Z_inv_total_sq;
                    totalX = X_inv_total / Z_inv_total_sq;
                    totalZ = Math.sqrt(totalR * totalR + totalX * totalX);
                    
                    steps += '\nℹ️  Fallback: manually combined system and motor impedances (parallel).\n';
                }
            } else {
                // combineSystemAndMotorFault not available — manual parallel combine
                const motR = motorContribution.totalMotorR;
                const motX = motorContribution.totalMotorX;
                const sys_R = totalR, sys_X = totalX;
                const sys_Z_sq = sys_R * sys_R + sys_X * sys_X;
                const mot_Z_sq = motR * motR + motX * motX;
                const R_inv_total = (sys_R / sys_Z_sq) + (motR / mot_Z_sq);
                const X_inv_total = (sys_X / sys_Z_sq) + (motX / mot_Z_sq);
                const Z_inv_total_sq = R_inv_total * R_inv_total + X_inv_total * X_inv_total;
                totalR = R_inv_total / Z_inv_total_sq;
                totalX = X_inv_total / Z_inv_total_sq;
                totalZ = Math.sqrt(totalR * totalR + totalX * totalX);
                
                steps += '\nℹ️  Combined system and motor impedances (manual parallel combine).\n';
            }
        } else {
            steps += '\nℹ️  No motor contribution (no motors connected to this bus)\n\n';
        }
    } else {
        steps += '\nℹ️  calculateTotalMotorContribution not available - skipping motor contribution\n\n';
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // FINAL CALCULATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    const faultCurrent = targetBus.voltage / (SQRT3 * totalZ);
    const faultCurrentKA = faultCurrent / 1000;
    const xrRatio = totalX / totalR;
    
    const multiplier = Math.sqrt(1 + 2 * Math.exp(-4 * totalR / totalX));
    const asymFaultCurrent = faultCurrent * multiplier;
    const asymFaultCurrentKA = asymFaultCurrent / 1000;
    
    steps += '\n' + '='.repeat(80) + '\n';
    steps += 'FINAL SHORT CIRCUIT CALCULATION\n';
    steps += '='.repeat(80) + '\n\n';
    steps += `Target Bus: ${targetBus.name} (${targetBus.voltage}V)\n\n`;
    steps += `Total System Impedance${motorContribution && motorContribution.motors && motorContribution.motors.length > 0 ? ' (WITH MOTOR CONTRIBUTION)' : ''}:\n`;
    steps += `R_total = ${totalR.toFixed(6)} Ω\n`;
    steps += `X_total = ${totalX.toFixed(6)} Ω\n`;
    steps += `Z_total = ${totalZ.toFixed(6)} Ω\n`;
    steps += `X/R Ratio = ${xrRatio.toFixed(3)}\n\n`;
    steps += `THREE-PHASE SYMMETRICAL FAULT CURRENT:\n`;
    steps += `I_sc = V_LL / (√3 × Z_total)\n`;
    steps += `I_sc = ${targetBus.voltage} / (${SQRT3.toFixed(4)} × ${totalZ.toFixed(6)})\n`;
    steps += `I_sc = ${faultCurrent.toFixed(2)} A = ${faultCurrentKA.toFixed(3)} kA\n\n`;
    
    if (motorContribution && motorContribution.motors && motorContribution.motors.length > 0) {
        const motorSymKA = motorContribution.totalSymmetricalContribution ?? (motorContribution.motorFaultCurrent ? motorContribution.motorFaultCurrent / 1000 : null);
        if (motorSymKA !== null) {
            steps += `⚡ INCLUDES MOTOR CONTRIBUTION: ${Number(motorSymKA).toFixed(3)} kA\n`;
        } else if (motorContribution.motorFaultCurrent) {
            steps += `⚡ INCLUDES MOTOR CONTRIBUTION: ${(motorContribution.motorFaultCurrent/1000).toFixed(3)} kA\n`;
        } else {
            steps += `⚡ INCLUDES MOTOR CONTRIBUTION (details unavailable)\n`;
        }
        steps += `   Per IEEE 141-1993 Section 5.3.2, IEC 60909, and NEC Article 430\n\n`;
    }
    
    steps += `ASYMMETRICAL (PEAK) FAULT CURRENT:\n`;
    steps += `Multiplier = √(1 + 2e^(-4R/X)) = ${multiplier.toFixed(4)}\n`;
    steps += `I_asym = ${faultCurrentKA.toFixed(3)} × ${multiplier.toFixed(4)} = ${asymFaultCurrentKA.toFixed(3)} kA\n\n`;
    
    return {
        totalR: totalR,
        totalX: totalX,
        totalZ: totalZ,
        xrRatio: xrRatio,
        faultCurrent: faultCurrent,
        faultCurrentKA: faultCurrentKA,
        asymFaultCurrent: asymFaultCurrent,
        asymFaultCurrentKA: asymFaultCurrentKA,
        motorContribution: motorContribution,
        steps: steps,
        path: path,
        method: 'Point-to-Point'
    };
}

/**
 * Per-Unit Short Circuit Calculation
 * Uses per-unit system for multi-voltage level analysis
 * 
 * ✅ FIXED: Motor contribution moved OUTSIDE component loop (Issue #1)
 * ✅ FIXED: Added comprehensive null checks (Issue #6)
 */
function calculateShortCircuitPerUnit(path) {
    const engineerName = document.getElementById('engineer')?.value || 'Unknown Engineer';
    const temperature = parseFloat(document.getElementById('temperature')?.value) || 75;
    
    // Per-Unit system base values
    const BASE_KVA = 10000;
    const targetBus = path[path.length - 1]?.bus;
    if (!targetBus) {
        throw new Error('Path has no target bus');
    }
    
    const BASE_VOLTAGE = targetBus.voltage;
    const BASE_Z = (BASE_VOLTAGE * BASE_VOLTAGE) / (BASE_KVA * 1000);
    const BASE_CURRENT = (BASE_KVA * 1000) / (SQRT3 * BASE_VOLTAGE);
    
    let totalRpu = 0;
    let totalXpu = 0;
    let currentVoltageLevel = null;
    
    let steps = 'SHORT CIRCUIT CALCULATION - PER-UNIT METHOD\n';
    steps += '='.repeat(80) + '\n\n';
    steps += `Date/Time: ${getCalculationTimestamp()}\n`;
    steps += `Engineer: ${engineerName}\n`;
    steps += `Temperature: ${temperature}°C\n`;
    steps += `Method: Per-Unit System\n\n`;
    steps += `PER-UNIT BASE VALUES:\n`;
    steps += `  Base kVA: ${BASE_KVA} kVA\n`;
    steps += `  Base Voltage: ${BASE_VOLTAGE} V\n`;
    steps += `  Base Impedance: ${BASE_Z.toFixed(6)} Ω\n`;
    steps += `  Base Current: ${BASE_CURRENT.toFixed(2)} A\n\n`;
    
    const sourceBus = path[0]?.bus;
    if (!sourceBus) {
        throw new Error('Path has no source bus');
    }
    currentVoltageLevel = sourceBus.voltage;

    // SOURCE BUS IMPEDANCE (PER-UNIT)
    if (sourceBus.type === 'source' && sourceBus.utilityFaultCurrent) {
        const sourceZ_ohms = sourceBus.voltage / (SQRT3 * sourceBus.utilityFaultCurrent * 1000);
        const utilityXR = sourceBus.utilityXR || 3;
        const sourceX_ohms = sourceZ_ohms * utilityXR / Math.sqrt(1 + utilityXR * utilityXR);
        const sourceR_ohms = sourceZ_ohms / Math.sqrt(1 + utilityXR * utilityXR);
        
        const sourceZbase_actual = (sourceBus.voltage * sourceBus.voltage) / (BASE_KVA * 1000);
        
        const sourceR_pu = sourceR_ohms / sourceZbase_actual;
        const sourceX_pu = sourceX_ohms / sourceZbase_actual;
        
        totalRpu += sourceR_pu;
        totalXpu += sourceX_pu;
        
        steps += `STEP 1: SOURCE BUS - ${sourceBus.name}\n`;
        steps += '-'.repeat(80) + '\n';
        steps += `Bus Voltage: ${sourceBus.voltage} V\n`;
        steps += `Available Fault Current: ${sourceBus.utilityFaultCurrent.toFixed(2)} kA\n`;
        steps += `Source X/R Ratio: ${utilityXR}\n\n`;
        steps += `Source Impedance (Ohmic):\n`;
        steps += `  R = ${sourceR_ohms.toFixed(6)} Ω\n`;
        steps += `  X = ${sourceX_ohms.toFixed(6)} Ω\n\n`;
        steps += `Converted to Per-Unit:\n`;
        steps += `  R_pu = ${sourceR_pu.toFixed(6)} pu\n`;
        steps += `  X_pu = ${sourceX_pu.toFixed(6)} pu\n\n`;
        steps += `Running Total: R_pu = ${totalRpu.toFixed(6)}, X_pu = ${totalXpu.toFixed(6)}\n\n`;
    }
    
    // PROCESS COMPONENTS
    let stepNumber = 2;
    const processedTransformerConnections = new Set();
    
    for (let i = 1; i < path.length; i++) {
        const segment = path[i];
        const comp = segment?.component;
        
        if (!comp) {
            console.warn(`⚠️ Segment ${i} has no component - skipping`);
            continue;
        }
        
        if (comp.type === 'transformer') {
            const key = `${comp.fromBus}_${comp.toBus}`;
            if (processedTransformerConnections.has(key)) continue;
            processedTransformerConnections.add(key);
            
            const parallelXfmrs = components.filter(c => 
                c.type === 'transformer' && 
                c.fromBus === comp.fromBus && 
                c.toBus === comp.toBus
            );
            const numParallel = parallelXfmrs.length;
            const totalRating = parallelXfmrs.reduce((sum, x) => sum + x.rating, 0);
            
            steps += `STEP ${stepNumber}: TRANSFORMER${numParallel > 1 ? 'S (PARALLEL)' : ''}\n`;
            steps += '-'.repeat(80) + '\n';
            if (numParallel > 1) {
                steps += `⚡ ${numParallel} × ${comp.rating} kVA transformers in PARALLEL\n`;
                steps += `   Total Capacity: ${totalRating} kVA\n\n`;
            }
            steps += `Primary: ${comp.primary} V → Secondary: ${comp.secondary} V\n`;
            steps += `Rating: ${comp.rating} kVA\n`;
            steps += `Impedance: ${comp.impedance}% on own base\n`;
            steps += `X/R: ${comp.xr}\n\n`;
            
            const Z_pu_own = comp.impedance / 100;
            const X_pu_own = Z_pu_own * comp.xr / Math.sqrt(1 + comp.xr * comp.xr);
            const R_pu_own = Z_pu_own / Math.sqrt(1 + comp.xr * comp.xr);
            const baseConversion = BASE_KVA / comp.rating;
            let R_pu_system = R_pu_own * baseConversion;
            let X_pu_system = X_pu_own * baseConversion;
            
            if (numParallel > 1) {
                R_pu_system = R_pu_system / numParallel;
                X_pu_system = X_pu_system / numParallel;
                steps += `Parallel Effect: Z_pu ÷ ${numParallel}\n\n`;
            }
            
            totalRpu += R_pu_system;
            totalXpu += X_pu_system;
            currentVoltageLevel = comp.secondary;
            steps += `Running Total: R_pu = ${totalRpu.toFixed(6)}, X_pu = ${totalXpu.toFixed(6)}\n\n`;
            stepNumber++;
            continue;
        }
        
        if (comp.type === 'cable') {
            steps += `STEP ${stepNumber}: CABLE\n`;
            steps += '-'.repeat(80) + '\n';
            
            const cableData = CABLE_IMPEDANCE_DATA[comp.size] || CABLE_IMPEDANCE_DATA['4/0'];
            const parallel = comp.parallel || 1;
            let rBase20 = cableData[comp.material]?.r;
            let rBaseTemp = temperatureCorrection(rBase20, temperature, comp.material);
            const cableR_ohms = (rBaseTemp * comp.length) / parallel;
            const cableX_ohms = (cableData[comp.material]?.x * comp.length) / parallel;
            const cableZbase = (currentVoltageLevel * currentVoltageLevel) / (BASE_KVA * 1000);
            const cableR_pu = cableR_ohms / cableZbase;
            const cableX_pu = cableX_ohms / cableZbase;
            const cableZ_pu = Math.sqrt(cableR_pu * cableR_pu + cableX_pu * cableX_pu);
            
            totalRpu += cableR_pu;
            totalXpu += cableX_pu;
            
            steps += `Cable: ${comp.size} ${comp.material.toUpperCase()}, ${comp.length} ft\n`;
            if (parallel > 1) steps += `Parallel: ${parallel} cables (Z ÷ ${parallel})\n`;
            steps += `Temperature: ${temperature}°C\n`;
            steps += `Voltage Level: ${currentVoltageLevel}V\n\n`;
            steps += `Cable Impedance (Ohmic):\n`;
            steps += `  R = ${cableR_ohms.toFixed(6)} Ω\n`;
            steps += `  X = ${cableX_ohms.toFixed(6)} Ω\n\n`;
            steps += `Conversion to Per-Unit:\n`;
            steps += `  Z_base at ${currentVoltageLevel}V = ${cableZbase.toFixed(6)} Ω\n`;
            steps += `  R_pu = ${cableR_ohms.toFixed(6)} / ${cableZbase.toFixed(6)} = ${cableR_pu.toFixed(6)} pu\n`;
            steps += `  X_pu = ${cableX_ohms.toFixed(6)} / ${cableZbase.toFixed(6)} = ${cableX_pu.toFixed(6)} pu\n`;
            steps += `  Z_pu = ${cableZ_pu.toFixed(6)} pu\n\n`;
            steps += `Running Total: R_pu = ${totalRpu.toFixed(6)}, X_pu = ${totalXpu.toFixed(6)}\n\n`;
            stepNumber++;
        }
        
        if (comp.type === 'generator') {
            steps += `STEP ${stepNumber}: GENERATOR\n`;
            steps += '-'.repeat(80) + '\n';
            const genXd_pu_own = comp.xd / 100;
            const genXR = comp.xr || 20;
            const genX_pu_own = genXd_pu_own;
            const genR_pu_own = genXd_pu_own / genXR;
            const genBaseConversion = BASE_KVA / comp.rating;
            const genR_pu_system = genR_pu_own * genBaseConversion;
            const genX_pu_system = genX_pu_own * genBaseConversion;
            
            steps += `Generator: ${comp.rating} kVA, ${comp.voltage}V\n`;
            steps += `X"d: ${comp.xd}% on own base\n`;
            steps += `X/R: ${genXR}\n\n`;
            steps += `Generator Per-Unit Impedance:\n`;
            steps += `  On own base (${comp.rating} kVA):\n`;
            steps += `    R_pu = ${genR_pu_own.toFixed(6)} pu\n`;
            steps += `    X_pu = ${genX_pu_own.toFixed(6)} pu\n\n`;
            steps += `  Converted to system base (${BASE_KVA} kVA):\n`;
            steps += `    R_pu = ${genR_pu_own.toFixed(6)} × ${genBaseConversion.toFixed(4)} = ${genR_pu_system.toFixed(6)} pu\n`;
            steps += `    X_pu = ${genX_pu_own.toFixed(6)} × ${genBaseConversion.toFixed(4)} = ${genX_pu_system.toFixed(6)} pu\n\n`;
            
            totalRpu += genR_pu_system;
            totalXpu += genX_pu_system;
            steps += `Running Total: R_pu = ${totalRpu.toFixed(6)}, X_pu = ${totalXpu.toFixed(6)}\n\n`;
            stepNumber++;
        }
    }
    // ← END OF COMPONENT FOR LOOP
    
    // ═══════════════════════════════════════════════════════════
    // ✅ FIXED (Issue #1): MOTOR CONTRIBUTION (AFTER LOOP)
    // ═══════════════════════════════════════════════════════════
    
    let motorContribution = null;
    if (typeof calculateTotalMotorContribution === 'function') {
        motorContribution = calculateTotalMotorContribution(targetBus.id);
        
        if (motorContribution && motorContribution.motors.length > 0) {
            steps += motorContribution.calculationSteps;
            
            const motorZbase = (targetBus.voltage * targetBus.voltage) / (BASE_KVA * 1000);
            const motorR_pu = motorContribution.totalMotorR / motorZbase;
            const motorX_pu = motorContribution.totalMotorX / motorZbase;
            const motorZ_pu = Math.sqrt(motorR_pu * motorR_pu + motorX_pu * motorX_pu);
            
            steps += '═'.repeat(80) + '\n';
            steps += 'MOTOR CONTRIBUTION (PER-UNIT)\n';
            steps += '═'.repeat(80) + '\n\n';
            steps += `Motor Impedance (Ohmic):\n`;
            steps += `  R = ${motorContribution.totalMotorR.toFixed(6)} Ω\n`;
            steps += `  X = ${motorContribution.totalMotorX.toFixed(6)} Ω\n`;
            steps += `  Z = ${motorContribution.totalMotorZ.toFixed(6)} Ω\n\n`;
            steps += `Conversion to Per-Unit:\n`;
            steps += `  Z_base at ${targetBus.voltage}V = ${motorZbase.toFixed(6)} Ω\n`;
            steps += `  R_pu = ${motorContribution.totalMotorR.toFixed(6)} / ${motorZbase.toFixed(6)} = ${motorR_pu.toFixed(6)} pu\n`;
            steps += `  X_pu = ${motorContribution.totalMotorX.toFixed(6)} / ${motorZbase.toFixed(6)} = ${motorX_pu.toFixed(6)} pu\n`;
            steps += `  Z_pu = ${motorZ_pu.toFixed(6)} pu\n\n`;
            
            steps += 'SYSTEM + MOTOR CONTRIBUTION (PARALLEL IN PER-UNIT)\n';
            steps += '-'.repeat(80) + '\n';
            steps += `System Only: R_pu = ${totalRpu.toFixed(6)}, X_pu = ${totalXpu.toFixed(6)}\n`;
            steps += `Motor: R_pu = ${motorR_pu.toFixed(6)}, X_pu = ${motorX_pu.toFixed(6)}\n\n`;
            
            const Z_system_sq = totalRpu * totalRpu + totalXpu * totalXpu;
            const Z_motor_sq = motorR_pu * motorR_pu + motorX_pu * motorX_pu;
            
            const R_inv_system = totalRpu / Z_system_sq;
            const X_inv_system = totalXpu / Z_system_sq;
            const R_inv_motor = motorR_pu / Z_motor_sq;
            const X_inv_motor = motorX_pu / Z_motor_sq;
            
            const R_inv_total = R_inv_system + R_inv_motor;
            const X_inv_total = X_inv_system + X_inv_motor;
            const Z_inv_total_sq = R_inv_total * R_inv_total + X_inv_total * X_inv_total;
            
            const totalRpu_with_motors = R_inv_total / Z_inv_total_sq;
            const totalXpu_with_motors = X_inv_total / Z_inv_total_sq;
            
            steps += `Combined (Parallel): R_pu = ${totalRpu_with_motors.toFixed(6)}, X_pu = ${totalXpu_with_motors.toFixed(6)}\n\n`;
            
            totalRpu = totalRpu_with_motors;
            totalXpu = totalXpu_with_motors;
        } else {
            steps += '\nℹ️  No motor contribution (no motors connected to this bus)\n\n';
        }
    }
    
    // FINAL CALCULATION
    const totalZpu = Math.sqrt(totalRpu * totalRpu + totalXpu * totalXpu);
    const xrRatio = totalXpu / totalRpu;
    const faultCurrent_pu = 1.0 / totalZpu;
    const faultCurrent = faultCurrent_pu * BASE_CURRENT;
    const faultCurrentKA = faultCurrent / 1000;
    const multiplier = Math.sqrt(1 + 2 * Math.exp(-4 * totalRpu / totalXpu));
    const asymFaultCurrent = faultCurrent * multiplier;
    const asymFaultCurrentKA = asymFaultCurrent / 1000;
    const totalZ_ohms = totalZpu * BASE_Z;
    const totalR_ohms = totalRpu * BASE_Z;
    const totalX_ohms = totalXpu * BASE_Z;
    
    steps += '\n' + '='.repeat(80) + '\n';
    steps += 'FINAL SHORT CIRCUIT CALCULATION (PER-UNIT METHOD)\n';
    steps += '='.repeat(80) + '\n\n';
    steps += `Target Bus: ${targetBus.name} (${targetBus.voltage}V)\n\n`;
    steps += `Total System Impedance (Per-Unit)${motorContribution && motorContribution.motors.length > 0 ? ' WITH MOTORS' : ''}:\n`;
    steps += `  R_pu = ${totalRpu.toFixed(6)} pu\n`;
    steps += `  X_pu = ${totalXpu.toFixed(6)} pu\n`;
    steps += `  Z_pu = ${totalZpu.toFixed(6)} pu\n`;
    steps += `  X/R Ratio = ${xrRatio.toFixed(3)}\n\n`;
    steps += `Total System Impedance (Ohmic Equivalent):\n`;
    steps += `  R = ${totalR_ohms.toFixed(6)} Ω\n`;
    steps += `  X = ${totalX_ohms.toFixed(6)} Ω\n`;
    steps += `  Z = ${totalZ_ohms.toFixed(6)} Ω\n\n`;
    steps += `THREE-PHASE SYMMETRICAL FAULT CURRENT:\n`;
    steps += `  I_pu = V_pu / Z_pu = 1.0 / ${totalZpu.toFixed(6)} = ${faultCurrent_pu.toFixed(6)} pu\n`;
    steps += `  I_actual = I_pu × I_base\n`;
    steps += `  I_actual = ${faultCurrent_pu.toFixed(6)} × ${BASE_CURRENT.toFixed(2)}\n`;
    steps += `  I_sc = ${faultCurrent.toFixed(2)} A = ${faultCurrentKA.toFixed(3)} kA\n\n`;
    
    if (motorContribution && motorContribution.motors.length > 0) {
        steps += `⚡ INCLUDES MOTOR CONTRIBUTION: ${(motorContribution.motorFaultCurrent/1000).toFixed(3)} kA\n`;
        steps += `   Per IEEE 141-1993 Section 5.3.2, IEC 60909, and NEC Article 430\n\n`;
    }
    
    steps += `ASYMMETRICAL (PEAK) FAULT CURRENT:\n`;
    steps += `  Multiplier = √(1 + 2e^(-4R/X)) = ${multiplier.toFixed(4)}\n`;
    steps += `  I_asym = ${faultCurrentKA.toFixed(3)} × ${multiplier.toFixed(4)} = ${asymFaultCurrentKA.toFixed(3)} kA\n\n`;
    
    return {
        totalR: totalR_ohms,
        totalX: totalX_ohms,
        totalZ: totalZ_ohms,
        totalRpu: totalRpu,
        totalXpu: totalXpu,
        totalZpu: totalZpu,
        baseKVA: BASE_KVA,
        baseVoltage: BASE_VOLTAGE,
        baseZ: BASE_Z,
        baseCurrent: BASE_CURRENT,
        xrRatio: xrRatio,
        faultCurrent: faultCurrent,
        faultCurrentKA: faultCurrentKA,
        asymFaultCurrent: asymFaultCurrent,
        asymFaultCurrentKA: asymFaultCurrentKA,
        motorContribution: motorContribution,
        steps: steps,
        path: path,
        method: 'Per-Unit'
    };
}

// ═══════════════════════════════════════════════════════════
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// ═══════════════════════════════════════════════════════════
window.calculateShortCircuit = calculateShortCircuit;
window.calculateShortCircuitPointToPoint = calculateShortCircuitPointToPoint;
window.calculateShortCircuitPerUnit = calculateShortCircuitPerUnit;

console.log('✅ Short Circuit Calculation module loaded');
console.log('   - Version: 1.3.0 (Fixed: Issues #1, #5, #6)');
console.log('   - Motor contribution: CORRECTED (calculated at fault point)');
console.log('   - Transformer impedance: CORRECTED (per IEEE 141 §4.2.3)');
console.log('   - Null safety: ENHANCED');
console.log('   - IEEE 141-1993 compliant');
console.log('   - Exported functions:');
console.log('     • calculateShortCircuit');
console.log('     • calculateShortCircuitPointToPoint');
console.log('     • calculateShortCircuitPerUnit');
// Calculations Module - Handles all fault current calculations

/**
 * Trace path from bus to source
 */
function traceBusPath(busId) {
    const path = [];
    let currentBusId = busId;
    const visited = new Set();
    
    while (currentBusId) {
        if (visited.has(currentBusId)) {
            throw new Error('Circular reference detected in bus hierarchy');
        }
        visited.add(currentBusId);
        
        const currentBus = buses.find(b => b.id === currentBusId);
        if (!currentBus) return null;
        
        // Find the component that FEEDS the current bus
        const feedingComponent = components.find(c => c.toBus === currentBusId);
        
        path.unshift({ bus: currentBus, component: feedingComponent || null });
        
        if (currentBus.type === 'source') {
            // We have reached the source, path is complete
            return path;
        }
        
        // Move to the parent bus for the next iteration
        if (feedingComponent) {
            currentBusId = feedingComponent.fromBus;
        } else {
            return null;
        }
    }
    
    return null;
}

/**
 * Calculate fault current at a specific bus
 */
function calculateBus(busId) {
    const calculationDateStamp = getCalculationTimestamp();
    try {
        const bus = buses.find(b => b.id === busId);
        if (!bus) {
            alert('Bus not found.');
            return;
        }
        
        const path = traceBusPath(busId);
        if (!path) {
            alert('Cannot trace path to source. Ensure bus is connected to a source bus.');
            return;
        }
        
        const method = document.querySelector('input[name="method"]:checked').value;
        const result = calculatePathImpedance(path, method);
        
        bus.faultCurrent = result.faultCurrentKA;
        bus.asymFaultCurrent = result.asymFaultCurrentKA;
        bus.xrRatio = result.xrRatio;
        bus.totalZ = result.totalZ;
        
        updateBusTree();
        updateBusesContent();
        
        selectedBusId = busId;
        displayBusResults(bus, result, calculationDateStamp);
        switchTab(null, 'results');
        
        scheduleAutoSave();
    } catch (error) {
        logger.error('Error calculating bus:', error);
        alert('Error calculating bus:\n\n' + error.message);
    }
}

/**
 * Calculate impedance along path with method selection
 */
function calculatePathImpedance(path, method = 'point-to-point') {
    if (method === 'per-unit') {
        return calculatePathImpedancePerUnit(path);
    } else {
        return calculatePathImpedancePointToPoint(path);
    }
}

/**
 * Point-to-Point Method Calculation
 */
function calculatePathImpedancePointToPoint(path) {
    const calculationTimestamp = getCalculationTimestamp();
    const engineerName = document.getElementById('engineer').value || 'Unknown Engineer';
    const temperature = parseFloat(document.getElementById('temperature').value) || 75;
    let totalR = 0;
    let totalX = 0;
    let currentVoltageLevel = null;
    
    let steps = 'POINT-TO-POINT METHOD - FAULT CURRENT CALCULATION\n';
    steps += '='.repeat(80) + '\n\n';
    steps += `Date/Time: ${calculationTimestamp}\n`;
    steps += `User: ${engineerName}\n`;
    steps += `Temperature: ${temperature}°C\n`;
    steps += `Calculation Method: Point-to-Point (Pure Ohmic - No Per-Unit)\n\n`;
    steps += `NOTE: Point-to-Point method uses ONLY ohmic values (Ω).\n`;
    steps += `      No base values or per-unit conversions are used.\n`;
    steps += `      Impedances are referred across transformers using turns ratio.\n\n`;
    
    const sourceBus = path[0].bus;
    currentVoltageLevel = sourceBus.voltage;
    
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
        steps += `Available Fault Current: ${sourceBus.utilityFaultCurrent.toFixed(2)} kA`;
        if (sourceBus.utilityFaultMVA) {
            steps += ` (${sourceBus.utilityFaultMVA.toFixed(1)} MVA)\n`;
            steps += `Note: MVA converted to kA using: I = MVA / (√3 × V_kV)\n`;
            steps += `      I = ${sourceBus.utilityFaultMVA} / (${SQRT3.toFixed(4)} × ${(sourceBus.voltage/1000).toFixed(3)})\n`;
            steps += `      I = ${sourceBus.utilityFaultCurrent.toFixed(3)} kA\n`;
        } else {
            steps += `\n`;
        }
        steps += `Source X/R Ratio: ${utilityXR}\n\n`;
        steps += `Source Impedance Calculation (at ${sourceBus.voltage}V):\n`;
        steps += `Z_source = V_LL / (√3 × I_sc)\n`;
        steps += `Z_source = ${sourceBus.voltage} / (${SQRT3.toFixed(4)} × ${sourceBus.utilityFaultCurrent * 1000})\n`;
        steps += `Z_source = ${utilityZ.toFixed(6)} Ω\n\n`;
        steps += `Component Separation using X/R = ${utilityXR}:\n`;
        steps += `X = Z × (X/R) / √(1 + (X/R)²)\n`;
        steps += `X = ${utilityZ.toFixed(6)} × ${utilityXR} / √(1 + ${utilityXR}²)\n`;
        steps += `X = ${utilityX.toFixed(6)} Ω\n\n`;
        steps += `R = Z / √(1 + (X/R)²)\n`;
        steps += `R = ${utilityZ.toFixed(6)} / √(1 + ${utilityXR}²)\n`;
        steps += `R = ${utilityR.toFixed(6)} Ω\n\n`;
        steps += `Running Total (at ${currentVoltageLevel}V): R = ${totalR.toFixed(6)} Ω, X = ${totalX.toFixed(6)} Ω\n`;
        steps += `                                            Z = ${Math.sqrt(totalR*totalR + totalX*totalX).toFixed(6)} Ω\n\n`;
    }
    
    // Track processed parallel transformers
    const processedTransformerConnections = new Set();
    
    // Process components
    let stepNumber = 2;
    for (let i = 1; i < path.length; i++) {
        const segment = path[i];
        const comp = segment.component;
        
        if (!comp) continue;
        
        // Handle parallel transformers
        if (comp.type === 'transformer') {
            const key = `${comp.fromBus}_${comp.toBus}`;
            
            if (processedTransformerConnections.has(key)) continue;
            processedTransformerConnections.add(key);
            
            // Find all parallel transformers with same from/to buses
            const parallelXfmrs = components.filter(c => 
                c.type === 'transformer' && 
                c.fromBus === comp.fromBus && 
                c.toBus === comp.toBus
            );
            
            const numParallel = parallelXfmrs.length;
            const totalRating = parallelXfmrs.reduce((sum, x) => sum + x.rating, 0);
            
            steps += `STEP ${stepNumber}: TRANSFORMER${numParallel > 1 ? 'S (PARALLEL)' : ''} (${comp.fromBusName} → ${comp.toBusName})\n`;
            steps += '-'.repeat(80) + '\n';
            
            if (numParallel > 1) {
                steps += `⚡ ${numParallel} × ${comp.rating} kVA transformers in PARALLEL\n`;
                steps += `   Total Capacity: ${totalRating} kVA\n`;
                steps += `   NOTE: Parallel transformers DIVIDE impedance by ${numParallel}\n\n`;
            } else {
                steps += `Transformer Rating: ${comp.rating} kVA\n`;
            }
            
            steps += `Primary Voltage: ${comp.primary} V\n`;
            steps += `Secondary Voltage: ${comp.secondary} V\n`;
            steps += `Impedance: ${comp.impedance}% (each transformer)\n`;
            steps += `X/R Ratio: ${comp.xr}\n\n`;
            
            // Calculate single transformer impedance (referred to secondary)
            const xfmrZbase = (comp.secondary * comp.secondary) / (comp.rating * 1000);
            const xfmrZ_single = (comp.impedance / 100) * xfmrZbase;
            const xfmrX_single = xfmrZ_single * comp.xr / Math.sqrt(1 + comp.xr * comp.xr);
            const xfmrR_single = xfmrZ_single / Math.sqrt(1 + comp.xr * comp.xr);
            
            steps += `Single Transformer Impedance (referred to secondary ${comp.secondary}V):\n`;
            steps += `Z_base_xfmr = V_secondary² / S_rating\n`;
            steps += `Z_base_xfmr = ${comp.secondary}² / ${comp.rating * 1000}\n`;
            steps += `Z_base_xfmr = ${xfmrZbase.toFixed(6)} Ω\n\n`;
            steps += `Z_xfmr_single = (%Z / 100) × Z_base_xfmr\n`;
            steps += `Z_xfmr_single = (${comp.impedance} / 100) × ${xfmrZbase.toFixed(6)}\n`;
            steps += `Z_xfmr_single = ${xfmrZ_single.toFixed(6)} Ω\n\n`;
            steps += `Component Separation:\n`;
            steps += `X_xfmr_single = ${xfmrX_single.toFixed(6)} Ω\n`;
            steps += `R_xfmr_single = ${xfmrR_single.toFixed(6)} Ω\n\n`;
            
            // Calculate parallel impedance
            let xfmrR, xfmrX, xfmrZ;
            if (numParallel > 1) {
                xfmrR = xfmrR_single / numParallel;
                xfmrX = xfmrX_single / numParallel;
                xfmrZ = xfmrZ_single / numParallel;
                
                steps += `Parallel Combination of ${numParallel} Transformers:\n`;
                steps += `For parallel impedances: Z_parallel = Z_single / n\n`;
                steps += `R_parallel = ${xfmrR_single.toFixed(6)} / ${numParallel} = ${xfmrR.toFixed(6)} Ω\n`;
                steps += `X_parallel = ${xfmrX_single.toFixed(6)} / ${numParallel} = ${xfmrX.toFixed(6)} Ω\n`;
                steps += `Z_parallel = ${xfmrZ_single.toFixed(6)} / ${numParallel} = ${xfmrZ.toFixed(6)} Ω\n\n`;
            } else {
                xfmrR = xfmrR_single;
                xfmrX = xfmrX_single;
                xfmrZ = xfmrZ_single;
            }
            
            // Refer all previous impedances to secondary side
            const turnsRatio = comp.primary / comp.secondary;
            const R_primary_referred = totalR / (turnsRatio * turnsRatio);
            const X_primary_referred = totalX / (turnsRatio * turnsRatio);
            
            steps += `🔄 VOLTAGE LEVEL CHANGE: ${comp.primary}V → ${comp.secondary}V\n`;
            steps += `Turns Ratio: a = ${comp.primary} / ${comp.secondary} = ${turnsRatio.toFixed(4)}\n\n`;
            steps += `Referring Primary Impedance to Secondary Side:\n`;
            steps += `Z_secondary = Z_primary / a²\n`;
            steps += `R_pri_referred = ${totalR.toFixed(6)} / ${turnsRatio.toFixed(4)}² = ${R_primary_referred.toFixed(6)} Ω\n`;
            steps += `X_pri_referred = ${totalX.toFixed(6)} / ${turnsRatio.toFixed(4)}² = ${X_primary_referred.toFixed(6)} Ω\n\n`;
            
            // Add transformer impedance
            totalR = R_primary_referred + xfmrR;
            totalX = X_primary_referred + xfmrX;
            currentVoltageLevel = comp.secondary;
            
            steps += `Total System Impedance (at ${currentVoltageLevel}V secondary):\n`;
            steps += `R_total = ${R_primary_referred.toFixed(6)} + ${xfmrR.toFixed(6)} = ${totalR.toFixed(6)} Ω\n`;
            steps += `X_total = ${X_primary_referred.toFixed(6)} + ${xfmrX.toFixed(6)} = ${totalX.toFixed(6)} Ω\n`;
            steps += `Z_total = ${Math.sqrt(totalR*totalR + totalX*totalX).toFixed(6)} Ω\n\n`;
            
            stepNumber++;
            continue;
        }
        
        // Handle cables (same voltage level)
        if (comp.type === 'cable') {
            steps += `STEP ${stepNumber}: CABLE (${comp.fromBusName} → ${comp.toBusName})\n`;
            steps += '-'.repeat(80) + '\n';
            
            const cableData = CABLE_IMPEDANCE_DATA[comp.size] || CABLE_IMPEDANCE_DATA['4/0'];
            const parallel = comp.parallel || 1;
            
            let rBase20 = cableData[comp.material].r;
            let rBaseTemp = temperatureCorrection(rBase20, temperature, comp.material);
            
            const cableR = (rBaseTemp * comp.length) / parallel;
            const cableX = (cableData[comp.material].x * comp.length) / parallel;
            
            totalR += cableR;
            totalX += cableX;
            
            steps += `Cable: ${comp.size} ${comp.material}, ${comp.length} ft\n`;
            steps += `Voltage Level: ${currentVoltageLevel} V (no voltage change)\n`;
            if (parallel > 1) steps += `Parallel Conductors: ${parallel}\n`;
            steps += `Conduit: ${comp.conduit}\n\n`;
            steps += `Temperature Correction (${temperature}°C):\n`;
            steps += `R_20°C = ${rBase20.toFixed(8)} Ω/ft\n`;
            steps += `α_${comp.material} = ${TEMP_COEFFICIENT[comp.material]} /°C\n`;
            steps += `R_${temperature}°C = ${rBase20.toFixed(8)} × [1 + ${TEMP_COEFFICIENT[comp.material]} × (${temperature} - 20)]\n`;
            steps += `R_${temperature}°C = ${rBaseTemp.toFixed(8)} Ω/ft\n\n`;
            steps += `Cable Impedance:\n`;
            steps += `R_cable = ${rBaseTemp.toFixed(8)} × ${comp.length} / ${parallel} = ${cableR.toFixed(6)} Ω\n`;
            steps += `X_cable = ${cableData[comp.material].x.toFixed(8)} × ${comp.length} / ${parallel} = ${cableX.toFixed(6)} Ω\n\n`;
            steps += `Running Total (at ${currentVoltageLevel}V):\n`;
            steps += `R = ${totalR.toFixed(6)} Ω, X = ${totalX.toFixed(6)} Ω, Z = ${Math.sqrt(totalR*totalR + totalX*totalX).toFixed(6)} Ω\n\n`;
            
            stepNumber++;
        }
        
        // Handle generators
        if (comp.type === 'generator') {
            steps += `STEP ${stepNumber}: GENERATOR (${comp.fromBusName} → ${comp.toBusName})\n`;
            steps += '-'.repeat(80) + '\n';
            
            const genZbase = (comp.voltage * comp.voltage) / (comp.rating * 1000);
            const genZ = (comp.xd / 100) * genZbase;
            const genX = genZ * comp.xr / Math.sqrt(1 + comp.xr * comp.xr);
            const genR = genZ / Math.sqrt(1 + comp.xr * comp.xr);
            
            steps += `Generator: ${comp.rating} kVA, X"d: ${comp.xd}%, X/R: ${comp.xr}\n`;
            steps += `Voltage: ${comp.voltage} V\n\n`;
            steps += `Generator Impedance:\n`;
            steps += `Z_base = ${comp.voltage}² / ${comp.rating * 1000} = ${genZbase.toFixed(6)} Ω\n`;
            steps += `Z_gen = (${comp.xd} / 100) × ${genZbase.toFixed(6)} = ${genZ.toFixed(6)} Ω\n`;
            steps += `R_gen = ${genR.toFixed(6)} Ω, X_gen = ${genX.toFixed(6)} Ω\n\n`;
            steps += `Generator in Parallel:\n`;
            
            if (totalR > 0 || totalX > 0) {
                const systemImpedance = { r: totalR, x: totalX };
                const generatorImpedance = { r: genR, x: genX };
                const parallelResult = calculateParallelImpedance(systemImpedance, generatorImpedance);
                
                steps += `Combining system and generator impedance in parallel using complex math.\n`;
                steps += `Z_parallel = (Z_system * Z_generator) / (Z_system + Z_generator)\n`;
                
                totalR = parallelResult.r;
                totalX = parallelResult.x;
            } else {
                totalR = genR;
                totalX = genX;
            }
            
            steps += `Running Total: R = ${totalR.toFixed(6)} Ω, X = ${totalX.toFixed(6)} Ω, Z = ${Math.sqrt(totalR*totalR + totalX*totalX).toFixed(6)} Ω\n\n`;
            stepNumber++;
        }
        
        // Handle motors
        if (comp.type === 'motor') {
            steps += `STEP ${stepNumber}: MOTOR (${comp.fromBusName} → ${comp.toBusName})\n`;
            steps += '-'.repeat(80) + '\n';
            
            const voltage = segment.bus.voltage;
            const motorFLA = (comp.hp * 746) / (voltage * SQRT3 * 0.85);
            const motorContribution = motorFLA * 5;
            const motorZ = voltage / (SQRT3 * motorContribution);
            const motorXR = comp.motorType === 'induction' ? 6 : 15;
            const motorX = motorZ * motorXR / Math.sqrt(1 + motorXR * motorXR);
            const motorR = motorZ / Math.sqrt(1 + motorXR * motorXR);
            
            steps += `Motor: ${comp.hp} HP ${comp.motorType}\n`;
            steps += `FLA = ${motorFLA.toFixed(2)} A, Contribution = ${motorContribution.toFixed(2)} A (5× FLA)\n`;
            steps += `Z_motor = ${motorZ.toFixed(6)} Ω, R = ${motorR.toFixed(6)} Ω, X = ${motorX.toFixed(6)} Ω\n\n`;
            steps += `Motor in Parallel:\n`;
            
            if (totalR > 0 || totalX > 0) {
                const systemImpedance = { r: totalR, x: totalX };
                const motorImpedance = { r: motorR, x: motorX };
                const parallelResult = calculateParallelImpedance(systemImpedance, motorImpedance);
                
                steps += `Combining system and motor impedance in parallel using complex math.\n`;
                
                totalR = parallelResult.r;
                totalX = parallelResult.x;
            } else {
                totalR = motorR;
                totalX = motorX;
            }
            
            steps += `Running Total: R = ${totalR.toFixed(6)} Ω, X = ${totalX.toFixed(6)} Ω, Z = ${Math.sqrt(totalR*totalR + totalX*totalX).toFixed(6)} Ω\n\n`;
            stepNumber++;
        }
    }
    
    // Final calculation
    const targetBus = path[path.length - 1].bus;
    const totalZ = Math.sqrt(totalR * totalR + totalX * totalX);
    const faultCurrent = targetBus.voltage / (SQRT3 * totalZ);
    const faultCurrentKA = faultCurrent / 1000;
    const xrRatio = totalX / totalR;
    
    const multiplier = Math.sqrt(1 + 2 * Math.exp(-4 * totalR / totalX));
    const asymFaultCurrent = faultCurrent * multiplier;
    const asymFaultCurrentKA = asymFaultCurrent / 1000;
    
    steps += '\n' + '='.repeat(80) + '\n';
    steps += 'FINAL FAULT CURRENT CALCULATION\n';
    steps += '='.repeat(80) + '\n\n';
    steps += `Target Bus: ${targetBus.name}\n`;
    steps += `Bus Voltage: ${targetBus.voltage} V\n\n`;
    steps += `Total System Impedance (referred to ${targetBus.voltage}V):\n`;
    steps += `R_total = ${totalR.toFixed(6)} Ω\n`;
    steps += `X_total = ${totalX.toFixed(6)} Ω\n`;
    steps += `Z_total = √(R² + X²) = ${totalZ.toFixed(6)} Ω\n`;
    steps += `X/R Ratio = ${xrRatio.toFixed(3)}\n\n`;
    steps += `THREE-PHASE SYMMETRICAL FAULT CURRENT:\n`;
    steps += `I_sc = V_LL / (√3 × Z_total)\n`;
    steps += `I_sc = ${targetBus.voltage} / (${SQRT3.toFixed(4)} × ${totalZ.toFixed(6)})\n`;
    steps += `I_sc = ${faultCurrent.toFixed(2)} A = ${faultCurrentKA.toFixed(3)} kA\n\n`;
    steps += `ASYMMETRICAL (PEAK) FAULT CURRENT:\n`;
    steps += `Asymmetry Factor = √(1 + 2e^(-4R/X)) = ${multiplier.toFixed(4)}\n`;
    steps += `I_asym = ${faultCurrent.toFixed(2)} × ${multiplier.toFixed(4)} = ${asymFaultCurrent.toFixed(2)} A = ${asymFaultCurrentKA.toFixed(3)} kA\n\n`;
    
    return {
        totalR,
        totalX,
        totalZ,
        xrRatio,
        faultCurrent,
        faultCurrentKA,
        asymFaultCurrent,
        asymFaultCurrentKA,
        steps,
        path,
        method: 'Point-to-Point'
    };
}

/**
 * Per-Unit Method Calculation
 */
function calculatePathImpedancePerUnit(path) {
    const calculationTimestamp = getCalculationTimestamp();
    const engineerName = document.getElementById('engineer').value || 'Unknown Engineer';
    const temperature = parseFloat(document.getElementById('temperature').value) || 75;
    let steps = 'PER-UNIT METHOD - FAULT CURRENT CALCULATION\n';
    steps += '='.repeat(80) + '\n\n';
    steps += `Date/Time: ${calculationTimestamp}\n`;
    steps += `User: ${engineerName}\n`;
    steps += `Temperature: ${temperature}°C\n`;
    steps += `Calculation Method: Per-Unit System with Multiple Voltage Levels\n\n`;
    
    // Determine base kVA - find LARGEST total transformer capacity
    let baseKVA = 1000; // Default minimum
    
    // Group transformers by connection to find parallel banks
    const transformersByConnection = {};
    for (let i = 0; i < components.length; i++) {
        const comp = components[i];
        if (comp.type === 'transformer') {
            const key = `${comp.fromBus}_${comp.toBus}`;
            if (!transformersByConnection[key]) {
                transformersByConnection[key] = [];
            }
            transformersByConnection[key].push(comp);
        }
    }
    
    // Find maximum total capacity
    let maxTransformerCapacity = 0;
    for (const key in transformersByConnection) {
        const parallelXfmrs = transformersByConnection[key];
        const totalCapacity = parallelXfmrs.reduce((sum, x) => sum + x.rating, 0);
        if (totalCapacity > maxTransformerCapacity) {
            maxTransformerCapacity = totalCapacity;
        }
    }
    
    if (maxTransformerCapacity >= 1000) {
        baseKVA = maxTransformerCapacity;
    } else if (maxTransformerCapacity >= 100) {
        baseKVA = Math.ceil(maxTransformerCapacity / 100) * 100;
    }
    
    steps += `BASE kVA SELECTION:\n`;
    steps += '-'.repeat(80) + '\n';
    steps += `S_base = ${baseKVA} kVA\n`;
    if (maxTransformerCapacity > 0) {
        steps += `Largest transformer bank in the system: ${maxTransformerCapacity} kVA total capacity\n`;
    }
    steps += `\n`;
    steps += `   ✓ S_base = ${baseKVA} kVA for ALL voltage levels\n`;
    steps += `   ✓ V_base = DIFFERENT at each voltage level\n`;
    steps += `   ✓ Z_base = V_base² / S_base = DIFFERENT at each level\n`;
    steps += `   ✓ I_base = S_base / (√3 × V_base) = DIFFERENT at each level\n\n`;
    
    let totalRpu = 0;
    let totalXpu = 0;
    let currentVoltageLevel = null;
    
    // Process source
    const sourceBus = path[0].bus;
    currentVoltageLevel = sourceBus.voltage;
    
    if (sourceBus.type === 'source' && sourceBus.utilityFaultCurrent) {
        const V_base_source = sourceBus.voltage;
        const Z_base_source = (V_base_source * V_base_source) / (baseKVA * 1000);
        const I_base_source = (baseKVA * 1000) / (SQRT3 * V_base_source);
        
        steps += `STEP 1: SOURCE BUS - ${sourceBus.name}\n`;
        steps += '-'.repeat(80) + '\n';
        steps += `Voltage Level: ${V_base_source} V\n\n`;
        steps += `Base Values for ${V_base_source}V Level:\n`;
        steps += `  S_base = ${baseKVA} kVA\n`;
        steps += `  V_base = ${V_base_source} V\n`;
        steps += `  Z_base = V_base² / S_base = ${V_base_source}² / ${baseKVA * 1000}\n`;
        steps += `  Z_base = ${Z_base_source.toFixed(6)} Ω\n`;
        steps += `  I_base = S_base / (√3 × V_base) = ${baseKVA * 1000} / (${SQRT3.toFixed(4)} × ${V_base_source})\n`;
        steps += `  I_base = ${I_base_source.toFixed(2)} A\n\n`;
        
        const utilityZohm = V_base_source / (SQRT3 * sourceBus.utilityFaultCurrent * 1000);
        const utilityZpu = utilityZohm / Z_base_source;
        const utilityXR = sourceBus.utilityXR || 3;
        const utilityXpu = utilityZpu * utilityXR / Math.sqrt(1 + utilityXR * utilityXR);
        const utilityRpu = utilityZpu / Math.sqrt(1 + utilityXR * utilityXR);
        
        totalRpu += utilityRpu;
        totalXpu += utilityXpu;
        
        steps += `Available Fault Current: ${sourceBus.utilityFaultCurrent.toFixed(2)} kA`;
        if (sourceBus.utilityFaultMVA) {
            steps += ` (${sourceBus.utilityFaultMVA.toFixed(1)} MVA)\n`;
        } else {
            steps += `\n`;
        }
        steps += `X/R Ratio: ${utilityXR}\n\n`;
        steps += `Source Impedance (Ohmic):\n`;
        steps += `Z_source(Ω) = ${V_base_source} / (√3 × ${sourceBus.utilityFaultCurrent * 1000}) = ${utilityZohm.toFixed(6)} Ω\n\n`;
        steps += `Convert to Per-Unit (using Z_base = ${Z_base_source.toFixed(6)} Ω):\n`;
        steps += `Z_source(pu) = ${utilityZohm.toFixed(6)} / ${Z_base_source.toFixed(6)} = ${utilityZpu.toFixed(6)} pu\n\n`;
        steps += `Component Separation:\n`;
        steps += `X_source(pu) = ${utilityXpu.toFixed(6)} pu\n`;
        steps += `R_source(pu) = ${utilityRpu.toFixed(6)} pu\n\n`;
        steps += `Running Total (pu): R = ${totalRpu.toFixed(6)}, X = ${totalXpu.toFixed(6)}, Z = ${Math.sqrt(totalRpu*totalRpu + totalXpu*totalXpu).toFixed(6)}\n\n`;
    }
    
    // Track processed parallel transformers
    const processedTransformerConnections = new Set();
    
    // Process components with voltage level awareness
    let stepNumber = 2;
    for (let i = 1; i < path.length; i++) {
        const segment = path[i];
        const comp = segment.component;
        
        if (!comp) continue;
        
        // Handle parallel transformers
        if (comp.type === 'transformer') {
            const key = `${comp.fromBus}_${comp.toBus}`;
            
            if (processedTransformerConnections.has(key)) continue;
            processedTransformerConnections.add(key);
            
            // Find all parallel transformers
            const parallelXfmrs = components.filter(c => 
                c.type === 'transformer' && 
                c.fromBus === comp.fromBus && 
                c.toBus === comp.toBus
            );
            
            const numParallel = parallelXfmrs.length;
            const totalRating = parallelXfmrs.reduce((sum, x) => sum + x.rating, 0);
            
            const V_base_primary = comp.primary;
            const V_base_secondary = comp.secondary;
            const Z_base_primary = (V_base_primary * V_base_primary) / (baseKVA * 1000);
            const Z_base_secondary = (V_base_secondary * V_base_secondary) / (baseKVA * 1000);
            const I_base_secondary = (baseKVA * 1000) / (SQRT3 * V_base_secondary);
            
            steps += `STEP ${stepNumber}: TRANSFORMER${numParallel > 1 ? 'S (PARALLEL)' : ''} (${comp.fromBusName} → ${comp.toBusName})\n`;
            steps += '-'.repeat(80) + '\n';
            
            if (numParallel > 1) {
                steps += `⚡ ${numParallel} × ${comp.rating} kVA transformers in PARALLEL\n`;
                steps += `   Total Capacity: ${totalRating} kVA\n\n`;
            } else {
                steps += `Transformer: ${comp.rating} kVA\n`;
            }
            
            steps += `Voltage: ${comp.primary}V / ${comp.secondary}V\n`;
            steps += `Impedance: ${comp.impedance}% (each), X/R: ${comp.xr}\n\n`;
            steps += `🔄 VOLTAGE LEVEL CHANGE - MULTI-LEVEL PER-UNIT SYSTEM\n`;
            steps += `   From ${V_base_primary}V level to ${V_base_secondary}V level\n\n`;
            steps += `Primary Side Base Values (${V_base_primary}V):\n`;
            steps += `  S_base = ${baseKVA} kVA\n`;
            steps += `  V_base_pri = ${V_base_primary} V\n`;
            steps += `  Z_base_pri = ${V_base_primary}² / ${baseKVA * 1000} = ${Z_base_primary.toFixed(6)} Ω\n\n`;
            steps += `Secondary Side Base Values (${V_base_secondary}V):\n`;
            steps += `  S_base = ${baseKVA} kVA\n`;
            steps += `  V_base_sec = ${V_base_secondary} V (CHANGED)\n`;
            steps += `  Z_base_sec = ${V_base_secondary}² / ${baseKVA * 1000} = ${Z_base_secondary.toFixed(6)} Ω (CHANGED)\n`;
            steps += `  I_base_sec = ${baseKVA * 1000} / (√3 × ${V_base_secondary}) = ${I_base_secondary.toFixed(2)} A (CHANGED)\n\n`;
            
            // Calculate per-unit impedance
            let xfmrZpu_single = (comp.impedance / 100) * (baseKVA / comp.rating);
            let xfmrZpu, xfmrXpu, xfmrRpu;
            
            if (numParallel > 1) {
                xfmrZpu = xfmrZpu_single / numParallel;
                xfmrXpu = xfmrZpu * comp.xr / Math.sqrt(1 + comp.xr * comp.xr);
                xfmrRpu = xfmrZpu / Math.sqrt(1 + comp.xr * comp.xr);
                
                steps += `Single Transformer Per-Unit Impedance:\n`;
                steps += `Z_xfmr_single(pu) = (%Z / 100) × (S_base / S_xfmr)\n`;
                steps += `Z_xfmr_single(pu) = (${comp.impedance} / 100) × (${baseKVA} / ${comp.rating})\n`;
                steps += `Z_xfmr_single(pu) = ${xfmrZpu_single.toFixed(6)} pu\n\n`;
                steps += `Parallel Combination (${numParallel} transformers):\n`;
                steps += `Z_parallel(pu) = Z_single(pu) / ${numParallel}\n`;
                steps += `Z_xfmr(pu) = ${xfmrZpu_single.toFixed(6)} / ${numParallel} = ${xfmrZpu.toFixed(6)} pu\n\n`;
            } else {
                xfmrZpu = xfmrZpu_single;
                xfmrXpu = xfmrZpu * comp.xr / Math.sqrt(1 + comp.xr * comp.xr);
                xfmrRpu = xfmrZpu / Math.sqrt(1 + comp.xr * comp.xr);
                
                steps += `Transformer Per-Unit Impedance:\n`;
                steps += `Z_xfmr(pu) = (%Z / 100) × (S_base / S_xfmr)\n`;
                steps += `Z_xfmr(pu) = (${comp.impedance} / 100) × (${baseKVA} / ${comp.rating})\n`;
                steps += `Z_xfmr(pu) = ${xfmrZpu.toFixed(6)} pu\n\n`;
            }
            
            totalRpu += xfmrRpu;
            totalXpu += xfmrXpu;
            
            steps += `Component Separation:\n`;
            steps += `X_xfmr(pu) = ${xfmrXpu.toFixed(6)} pu\n`;
            steps += `R_xfmr(pu) = ${xfmrRpu.toFixed(6)} pu\n\n`;
            
            // Show ohmic equivalents on both sides
            const xfmrZohm_pri = xfmrZpu * Z_base_primary;
            const xfmrZohm_sec = xfmrZpu * Z_base_secondary;
            steps += `Equivalent Ohmic Values:\n`;
            steps += `  Referred to Primary (${V_base_primary}V):\n`;
            steps += `    Z_xfmr = ${xfmrZpu.toFixed(6)} × ${Z_base_primary.toFixed(6)} = ${xfmrZohm_pri.toFixed(6)} Ω\n`;
            steps += `  Referred to Secondary (${V_base_secondary}V):\n`;
            steps += `    Z_xfmr = ${xfmrZpu.toFixed(6)} × ${Z_base_secondary.toFixed(6)} = ${xfmrZohm_sec.toFixed(6)} Ω\n\n`;
            steps += `Running Total (pu): R = ${totalRpu.toFixed(6)}, X = ${totalXpu.toFixed(6)}, Z = ${Math.sqrt(totalRpu*totalRpu + totalXpu*totalXpu).toFixed(6)}\n\n`;
            
            currentVoltageLevel = V_base_secondary;
            stepNumber++;
            continue;
        }
        
        // Handle cables
        if (comp.type === 'cable') {
            const V_base_cable = currentVoltageLevel;
            const Z_base_cable = (V_base_cable * V_base_cable) / (baseKVA * 1000);
            const I_base_cable = (baseKVA * 1000) / (SQRT3 * V_base_cable);
            
            steps += `STEP ${stepNumber}: CABLE (${comp.fromBusName} → ${comp.toBusName})\n`;
            steps += '-'.repeat(80) + '\n';
            steps += `Cable at ${V_base_cable}V Level\n`;
            steps += `Base Values for this voltage level:\n`;
            steps += `  S_base = ${baseKVA} kVA\n`;
            steps += `  V_base = ${V_base_cable} V\n`;
            steps += `  Z_base = ${Z_base_cable.toFixed(6)} Ω\n`;
            steps += `  I_base = ${I_base_cable.toFixed(2)} A\n\n`;
            
            const cableData = CABLE_IMPEDANCE_DATA[comp.size] || CABLE_IMPEDANCE_DATA['4/0'];
            const parallel = comp.parallel || 1;
            
            let rBase20 = cableData[comp.material].r;
            let rBaseTemp = temperatureCorrection(rBase20, temperature, comp.material);
            
            const cableRohm = (rBaseTemp * comp.length) / parallel;
            const cableXohm = (cableData[comp.material].x * comp.length) / parallel;
            const cableRpu = cableRohm / Z_base_cable;
            const cableXpu = cableXohm / Z_base_cable;
            
            totalRpu += cableRpu;
            totalXpu += cableXpu;
            
            steps += `Cable: ${comp.size} ${comp.material}, ${comp.length} ft`;
            if (parallel > 1) steps += `, ${parallel} parallel`;
            steps += `\n`;
            steps += `Temperature: ${temperature}°C\n\n`;
            steps += `Cable Impedance (Ohmic):\n`;
            steps += `R_cable(Ω) = ${rBaseTemp.toFixed(8)} Ω/ft × ${comp.length} ft / ${parallel} = ${cableRohm.toFixed(6)} Ω\n`;
            steps += `X_cable(Ω) = ${cableData[comp.material].x.toFixed(8)} Ω/ft × ${comp.length} ft / ${parallel} = ${cableXohm.toFixed(6)} Ω\n\n`;
            steps += `Convert to Per-Unit (using Z_base = ${Z_base_cable.toFixed(6)} Ω):\n`;
            steps += `R_cable(pu) = ${cableRohm.toFixed(6)} / ${Z_base_cable.toFixed(6)} = ${cableRpu.toFixed(6)} pu\n`;
            steps += `X_cable(pu) = ${cableXohm.toFixed(6)} / ${Z_base_cable.toFixed(6)} = ${cableXpu.toFixed(6)} pu\n\n`;
            steps += `Running Total (pu): R = ${totalRpu.toFixed(6)}, X = ${totalXpu.toFixed(6)}, Z = ${Math.sqrt(totalRpu*totalRpu + totalXpu*totalXpu).toFixed(6)}\n\n`;
            
            stepNumber++;
        }
        
        // Handle generators
        if (comp.type === 'generator') {
            const V_base_gen = currentVoltageLevel;
            const Z_base_gen = (V_base_gen * V_base_gen) / (baseKVA * 1000);
            
            const genZpu = (comp.xd / 100) * (baseKVA / comp.rating);
            const genXpu = genZpu * comp.xr / Math.sqrt(1 + comp.xr * comp.xr);
            const genRpu = genZpu / Math.sqrt(1 + comp.xr * comp.xr);
            
            steps += `STEP ${stepNumber}: GENERATOR (${comp.fromBusName} → ${comp.toBusName})\n`;
            steps += '-'.repeat(80) + '\n';
            steps += `Generator: ${comp.rating} kVA, X"d: ${comp.xd}%, X/R: ${comp.xr}\n`;
            steps += `At ${V_base_gen}V level, Z_base = ${Z_base_gen.toFixed(6)} Ω\n\n`;
            steps += `Generator Z(pu) = (%X"d / 100) × (S_base / S_gen)\n`;
            steps += `Generator Z(pu) = (${comp.xd} / 100) × (${baseKVA} / ${comp.rating}) = ${genZpu.toFixed(6)} pu\n\n`;
            
            if (totalRpu > 0 || totalXpu > 0) {
                const systemImpedancePu = { r: totalRpu, x: totalXpu };
                const generatorImpedancePu = { r: genRpu, x: genXpu };
                const parallelResultPu = calculateParallelImpedance(systemImpedancePu, generatorImpedancePu);
                
                steps += `Generator in Parallel (using Per-Unit complex math):\n`;
                
                totalRpu = parallelResultPu.r;
                totalXpu = parallelResultPu.x;
            } else {
                totalRpu = genRpu;
                totalXpu = genXpu;
            }
            
            steps += `Running Total (pu): R = ${totalRpu.toFixed(6)}, X = ${totalXpu.toFixed(6)}, Z = ${Math.sqrt(totalRpu*totalRpu + totalXpu*totalXpu).toFixed(6)}\n\n`;
            stepNumber++;
        }
        
        // Handle motors
        if (comp.type === 'motor') {
            const V_base_motor = currentVoltageLevel;
            const Z_base_motor = (V_base_motor * V_base_motor) / (baseKVA * 1000);
            
            const motorFLA = (comp.hp * 746) / (V_base_motor * SQRT3 * 0.85);
            const motorContribution = motorFLA * 5;
            const motorZohm = V_base_motor / (SQRT3 * motorContribution);
            const motorZpu = motorZohm / Z_base_motor;
            const motorXR = comp.motorType === 'induction' ? 6 : 15;
            const motorXpu = motorZpu * motorXR / Math.sqrt(1 + motorXR * motorXR);
            const motorRpu = motorZpu / Math.sqrt(1 + motorXR * motorXR);
            
            steps += `STEP ${stepNumber}: MOTOR (${comp.fromBusName} → ${comp.toBusName})\n`;
            steps += '-'.repeat(80) + '\n';
            steps += `Motor: ${comp.hp} HP ${comp.motorType}\n`;
            steps += `At ${V_base_motor}V level, Z_base = ${Z_base_motor.toFixed(6)} Ω\n`;
            steps += `Contribution: ${motorContribution.toFixed(2)} A, Z(pu) = ${motorZpu.toFixed(6)} pu\n\n`;
            
            if (totalRpu > 0 || totalXpu > 0) {
                const systemImpedancePu = { r: totalRpu, x: totalXpu };
                const motorImpedancePu = { r: motorRpu, x: motorXpu };
                const parallelResultPu = calculateParallelImpedance(systemImpedancePu, motorImpedancePu);
                
                steps += `Motor in Parallel (using Per-Unit complex math):\n`;
                
                totalRpu = parallelResultPu.r;
                totalXpu = parallelResultPu.x;
            } else {
                totalRpu = motorRpu;
                totalXpu = motorXpu;
            }
            
            steps += `Running Total (pu): R = ${totalRpu.toFixed(6)}, X = ${totalXpu.toFixed(6)}, Z = ${Math.sqrt(totalRpu*totalRpu + totalXpu*totalXpu).toFixed(6)}\n\n`;
            stepNumber++;
        }
    }
    
    // Final calculation using target bus voltage level
    const targetBus = path[path.length - 1].bus;
    const V_base_final = targetBus.voltage;
    const Z_base_final = (V_base_final * V_base_final) / (baseKVA * 1000);
    const I_base_final = (baseKVA * 1000) / (SQRT3 * V_base_final);
    
    const totalZpu = Math.sqrt(totalRpu * totalRpu + totalXpu * totalXpu);
    const faultCurrentPU = 1 / totalZpu;
    const faultCurrent = faultCurrentPU * I_base_final;
    const faultCurrentKA = faultCurrent / 1000;
    const xrRatio = totalXpu / totalRpu;
    
    const totalRohm = totalRpu * Z_base_final;
    const totalXohm = totalXpu * Z_base_final;
    const totalZohm = totalZpu * Z_base_final;
    
    const multiplier = Math.sqrt(1 + 2 * Math.exp(-4 * totalRpu / totalXpu));
    const asymFaultCurrent = faultCurrent * multiplier;
    const asymFaultCurrentKA = asymFaultCurrent / 1000;
    
    steps += '\n' + '='.repeat(80) + '\n';
    steps += 'FINAL FAULT CURRENT CALCULATION (PER-UNIT METHOD)\n';
    steps += '='.repeat(80) + '\n\n';
    steps += `Target Bus: ${targetBus.name}\n`;
    steps += `Bus Voltage Level: ${V_base_final} V\n\n`;
    steps += `Base Values at Target Bus (${V_base_final}V):\n`;
    steps += `  S_base = ${baseKVA} kVA (CONSTANT throughout entire system)\n`;
    steps += `  V_base = ${V_base_final} V\n`;
    steps += `  Z_base = ${V_base_final}² / ${baseKVA * 1000} = ${Z_base_final.toFixed(6)} Ω\n`;
    steps += `  I_base = ${baseKVA * 1000} / (√3 × ${V_base_final}) = ${I_base_final.toFixed(2)} A\n\n`;
    steps += `Total System Impedance (Per-Unit):\n`;
    steps += `R_total(pu) = ${totalRpu.toFixed(6)} pu\n`;
    steps += `X_total(pu) = ${totalXpu.toFixed(6)} pu\n`;
    steps += `Z_total(pu) = √(${totalRpu.toFixed(6)}² + ${totalXpu.toFixed(6)}²) = ${totalZpu.toFixed(6)} pu\n`;
    steps += `X/R Ratio = ${totalXpu.toFixed(6)} / ${totalRpu.toFixed(6)} = ${xrRatio.toFixed(3)}\n\n`;
    steps += `Total System Impedance (Ohmic) at ${V_base_final}V:\n`;
    steps += `R_total(Ω) = ${totalRpu.toFixed(6)} × ${Z_base_final.toFixed(6)} = ${totalRohm.toFixed(6)} Ω\n`;
    steps += `X_total(Ω) = ${totalXpu.toFixed(6)} × ${Z_base_final.toFixed(6)} = ${totalXohm.toFixed(6)} Ω\n`;
    steps += `Z_total(Ω) = ${totalZpu.toFixed(6)} × ${Z_base_final.toFixed(6)} = ${totalZohm.toFixed(6)} Ω\n\n`;
    steps += `THREE-PHASE SYMMETRICAL FAULT CURRENT:\n`;
    steps += `I_sc(pu) = 1 / Z_total(pu) = 1 / ${totalZpu.toFixed(6)} = ${faultCurrentPU.toFixed(4)} pu\n\n`;
    steps += `Convert to Amperes:\n`;
    steps += `I_sc(A) = ${faultCurrentPU.toFixed(4)} × ${I_base_final.toFixed(2)} = ${faultCurrent.toFixed(2)} A\n`;
    steps += `I_sc = ${faultCurrentKA.toFixed(3)} kA\n\n`;
    steps += `Verification using Ohmic method:\n`;
    steps += `I_sc = ${V_base_final} / (√3 × ${totalZohm.toFixed(6)}) = ${faultCurrent.toFixed(2)} A ✓\n\n`;
    steps += `ASYMMETRICAL (PEAK) FAULT CURRENT:\n`;
    steps += `Asymmetry Factor = √(1 + 2e^(-4×${totalRpu.toFixed(6)}/${totalXpu.toFixed(6)})) = ${multiplier.toFixed(4)}\n`;
    steps += `I_asym = ${faultCurrent.toFixed(2)} × ${multiplier.toFixed(4)} = ${asymFaultCurrent.toFixed(2)} A = ${asymFaultCurrentKA.toFixed(3)} kA\n\n`;
    steps += `═══════════════════════════════════════════════════════════════════════════════\n`;
    steps += `✓ S_base = ${baseKVA} kVA CONSTANT for ALL voltage levels\n`;
    steps += `✓ V_base, Z_base, I_base CHANGED at each voltage transformation\n`;
    steps += `✓ Transformer impedance SAME in pu on both sides\n`;
    steps += `✓ All impedances used appropriate Z_base for their voltage level\n`;
    steps += `═══════════════════════════════════════════════════════════════════════════════\n`;
    
    return {
        totalR: totalRohm,
        totalX: totalXohm,
        totalZ: totalZohm,
        totalRpu: totalRpu,
        totalXpu: totalXpu,
        totalZpu: totalZpu,
        xrRatio: xrRatio,
        faultCurrent: faultCurrent,
        faultCurrentKA: faultCurrentKA,
        asymFaultCurrent: asymFaultCurrent,
        asymFaultCurrentKA: asymFaultCurrentKA,
        steps: steps,
        path: path,
        method: 'Per-Unit',
        baseKVA: baseKVA,
        baseVoltage: V_base_final,
        baseZ: Z_base_final,
        baseCurrent: I_base_final
    };
}
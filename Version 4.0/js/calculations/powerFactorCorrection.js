/**
 * Power Factor Correction Module
 * 
 * Calculate capacitor bank sizing for power factor improvement
 * 
 * @author bfforex
 * @date 2026-02-02
 * @version 1.0.0
 * @standard IEEE 1036 - Guide for Application of Shunt Power Capacitors
 * @standard PEC 2017 - Article 4.60
 */

console.log('🔧 Loading Power Factor Correction Module v1.0.0...');

// Standard capacitor bank sizes (kVAR)
const STANDARD_CAPACITOR_SIZES = [5, 10, 15, 20, 25, 30, 50, 75, 100, 150, 200, 300, 400, 500, 600, 750, 1000];

/**
 * Calculate required capacitor size for power factor correction
 * 
 * @param {Number} loadKW - Active load in kW
 * @param {Number} currentPF - Current power factor (0.0-1.0)
 * @param {Number} targetPF - Target power factor (default 0.95)
 * @param {Number} utilityRate - Electricity rate in $/kWh (for savings calculation)
 * @returns {Object} Capacitor sizing results
 */
function calculateCapacitorSize(loadKW, currentPF, targetPF = 0.95, utilityRate = 0.12) {
    console.log('\n' + '═'.repeat(80));
    console.log('POWER FACTOR CORRECTION CALCULATION');
    console.log('═'.repeat(80));
    
    // Validate inputs
    if (currentPF <= 0 || currentPF > 1.0) {
        throw new Error('Current power factor must be between 0.0 and 1.0');
    }
    if (targetPF <= currentPF || targetPF > 1.0) {
        throw new Error('Target power factor must be greater than current PF and ≤ 1.0');
    }
    
    // Calculate angles
    const currentAngle = Math.acos(currentPF);
    const targetAngle = Math.acos(targetPF);
    
    // Calculate reactive power
    const currentKVAR = loadKW * Math.tan(currentAngle);
    const targetKVAR = loadKW * Math.tan(targetAngle);
    const requiredKVAR = currentKVAR - targetKVAR;
    
    console.log(`Load: ${loadKW} kW`);
    console.log(`Current Power Factor: ${currentPF.toFixed(3)} (${(currentPF * 100).toFixed(1)}%)`);
    console.log(`Target Power Factor: ${targetPF.toFixed(3)} (${(targetPF * 100).toFixed(1)}%)`);
    console.log(`\nCurrent Conditions:`);
    console.log(`  θ_current = ${(currentAngle * 180 / Math.PI).toFixed(2)}°`);
    console.log(`  Q_current = P × tan(θ) = ${loadKW} kW × tan(${(currentAngle * 180 / Math.PI).toFixed(2)}°)`);
    console.log(`  Q_current = ${currentKVAR.toFixed(2)} kVAR`);
    console.log(`\nTarget Conditions:`);
    console.log(`  θ_target = ${(targetAngle * 180 / Math.PI).toFixed(2)}°`);
    console.log(`  Q_target = P × tan(θ) = ${loadKW} kW × tan(${(targetAngle * 180 / Math.PI).toFixed(2)}°)`);
    console.log(`  Q_target = ${targetKVAR.toFixed(2)} kVAR`);
    console.log(`\nRequired Capacitor:`);
    console.log(`  Q_capacitor = Q_current - Q_target`);
    console.log(`  Q_capacitor = ${currentKVAR.toFixed(2)} - ${targetKVAR.toFixed(2)}`);
    console.log(`  Q_capacitor = ${requiredKVAR.toFixed(2)} kVAR`);
    
    // Find nearest standard size
    let recommendedSize = STANDARD_CAPACITOR_SIZES[0];
    let minDiff = Math.abs(requiredKVAR - recommendedSize);
    
    for (const size of STANDARD_CAPACITOR_SIZES) {
        const diff = Math.abs(requiredKVAR - size);
        if (diff < minDiff) {
            minDiff = diff;
            recommendedSize = size;
        }
        // Prefer slightly oversized to meet target
        if (size >= requiredKVAR && size - requiredKVAR < requiredKVAR * 0.1) {
            recommendedSize = size;
            break;
        }
    }
    
    console.log(`\nRecommended Standard Size: ${recommendedSize} kVAR`);
    
    // Calculate actual achieved PF with standard size
    const actualKVAR = targetKVAR + (recommendedSize > requiredKVAR ? requiredKVAR - recommendedSize : 0);
    const actualPF = Math.cos(Math.atan(actualKVAR / loadKW));
    
    console.log(`Actual Achieved PF: ${actualPF.toFixed(3)} (${(actualPF * 100).toFixed(1)}%)`);
    
    // Calculate savings
    const currentKVA = loadKW / currentPF;
    const improvedKVA = loadKW / targetPF;
    const kVAReduction = currentKVA - improvedKVA;
    
    // Estimate annual savings (assuming demand charges of $10/kVA/month)
    const demandCharge = 10; // $/kVA/month
    const monthlyDemandSavings = kVAReduction * demandCharge;
    const annualSavings = monthlyDemandSavings * 12;
    
    // Energy savings from reduced losses (simplified)
    const lossReduction = 0.02; // 2% typical
    const annualEnergySavings = loadKW * lossReduction * 8760 * utilityRate;
    
    const totalAnnualSavings = annualSavings + annualEnergySavings;
    
    console.log(`\nECONOMIC ANALYSIS:`);
    console.log('─'.repeat(80));
    console.log(`Current Apparent Power: ${currentKVA.toFixed(2)} kVA`);
    console.log(`Improved Apparent Power: ${improvedKVA.toFixed(2)} kVA`);
    console.log(`kVA Reduction: ${kVAReduction.toFixed(2)} kVA`);
    console.log(`\nEstimated Savings:`);
    console.log(`  Demand Charge Savings: $${monthlyDemandSavings.toFixed(2)}/month`);
    console.log(`  Annual Demand Savings: $${annualSavings.toFixed(2)}/year`);
    console.log(`  Annual Energy Savings: $${annualEnergySavings.toFixed(2)}/year`);
    console.log(`  Total Annual Savings: $${totalAnnualSavings.toFixed(2)}/year`);
    
    // Simple payback (assuming $50/kVAR installed cost)
    const installCost = recommendedSize * 50;
    const simplePayback = installCost / totalAnnualSavings;
    
    console.log(`\nEstimated Installation Cost: $${installCost.toFixed(2)}`);
    console.log(`Simple Payback Period: ${simplePayback.toFixed(1)} years`);
    
    console.log('\n' + '═'.repeat(80) + '\n');
    
    return {
        load: {
            kW: loadKW,
            currentPF: currentPF,
            targetPF: targetPF
        },
        capacitor: {
            requiredKVAR: requiredKVAR,
            recommendedSize: recommendedSize,
            actualAchievedPF: actualPF
        },
        economics: {
            kVAReduction: kVAReduction,
            annualSavings: totalAnnualSavings,
            installCost: installCost,
            paybackYears: simplePayback
        },
        standard: 'IEEE 1036 / PEC 4.60'
    };
}

/**
 * Create power factor correction comparison table
 * 
 * @param {Number} loadKW - Load in kW
 * @param {Number} currentPF - Current power factor
 * @returns {Object} Comparison table
 */
function comparePFTargets(loadKW, currentPF) {
    console.log('\n' + '═'.repeat(80));
    console.log('POWER FACTOR CORRECTION COMPARISON');
    console.log('═'.repeat(80));
    
    const targets = [0.90, 0.92, 0.95, 0.97, 0.99];
    const results = [];
    
    console.log('\nTarget PF | Cap Size | Annual Savings | Payback');
    console.log('─'.repeat(80));
    
    for (const targetPF of targets) {
        if (targetPF <= currentPF) continue;
        
        const result = calculateCapacitorSize(loadKW, currentPF, targetPF, 0.12);
        results.push(result);
        
        console.log(`${(targetPF * 100).toFixed(0)}%       | ${result.capacitor.recommendedSize.toString().padStart(8)} | $${result.economics.annualSavings.toFixed(2).padStart(13)} | ${result.economics.paybackYears.toFixed(1)} years`);
    }
    
    console.log('─'.repeat(80));
    console.log('\nRecommendation: Target 95% PF for optimal economics\n');
    console.log('═'.repeat(80) + '\n');
    
    return results;
}

// Export to global scope
window.calculateCapacitorSize = calculateCapacitorSize;
window.comparePFTargets = comparePFTargets;
window.STANDARD_CAPACITOR_SIZES = STANDARD_CAPACITOR_SIZES;

console.log('✅ Power Factor Correction Module loaded successfully');

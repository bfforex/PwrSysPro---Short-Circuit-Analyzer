/**
 * Transformer Inrush Current Calculation Module
 * 
 * Calculates transformer magnetizing inrush current for protection coordination
 * 
 * @author bfforex
 * @date 2026-02-02
 * @version 1.0.0
 * @standard IEEE C57.12.00 - General Requirements for Liquid-Immersed Distribution Transformers
 */

console.log('🔧 Loading Transformer Inrush Current Module v1.0.0...');

const SQRT3 = Math.sqrt(3);

/**
 * Calculate transformer inrush current
 * 
 * @param {Object} transformer - Transformer object with rating and secondary voltage
 * @returns {Object} Inrush current calculation results
 */
function calculateTransformerInrush(transformer) {
    console.log('\n' + '═'.repeat(80));
    console.log('TRANSFORMER INRUSH CURRENT CALCULATION');
    console.log('═'.repeat(80));
    
    const ratedCurrent = (transformer.rating * 1000) / (SQRT3 * transformer.secondary);
    const inrushMultiplier = 12;  // Conservative (8-12x typical)
    const inrushCurrent = ratedCurrent * inrushMultiplier;
    const inrushDuration = 0.1;   // seconds (approx 6 cycles at 60Hz)
    const peakAsymmetrical = inrushCurrent * 1.8;  // Peak asymmetrical component
    
    console.log(`Transformer: ${transformer.rating} kVA, ${transformer.primary}V/${transformer.secondary}V`);
    console.log(`\nRated Current:`);
    console.log(`  I_rated = S / (√3 × V)`);
    console.log(`  I_rated = ${transformer.rating} kVA / (√3 × ${transformer.secondary}V)`);
    console.log(`  I_rated = ${ratedCurrent.toFixed(2)} A`);
    console.log(`\nInrush Current:`);
    console.log(`  I_inrush = I_rated × ${inrushMultiplier}`);
    console.log(`  I_inrush = ${ratedCurrent.toFixed(2)} A × ${inrushMultiplier}`);
    console.log(`  I_inrush = ${inrushCurrent.toFixed(2)} A`);
    console.log(`  Peak Asymmetrical = ${peakAsymmetrical.toFixed(2)} A`);
    console.log(`  Duration ≈ ${inrushDuration} seconds (6 cycles)`);
    console.log('\n' + '═'.repeat(80) + '\n');
    
    return {
        ratedCurrent: ratedCurrent,
        inrushCurrent: inrushCurrent,
        inrushMultiplier: inrushMultiplier,
        duration: inrushDuration,
        peakAsymmetrical: peakAsymmetrical,
        standard: 'IEEE C57.12.00',
        notes: 'Conservative value for protection coordination'
    };
}

// Export to global scope
window.calculateTransformerInrush = calculateTransformerInrush;

console.log('✅ Transformer Inrush Current Module loaded successfully');

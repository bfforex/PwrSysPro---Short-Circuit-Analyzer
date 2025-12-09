#!/usr/bin/env node
/**
 * Test Report Fixes
 * Validates that the report fixes are working correctly by checking the generated code
 * 
 * @author GitHub Copilot
 * @date 2025-12-09
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Report Fixes...\n');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST: Check source code for required fixes
// ═══════════════════════════════════════════════════════════════════════════════

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName, errorMessage) {
    testsRun++;
    if (condition) {
        testsPassed++;
        console.log(`✅ PASS: ${testName}`);
        return true;
    } else {
        testsFailed++;
        console.error(`❌ FAIL: ${testName}`);
        console.error(`   ${errorMessage}`);
        return false;
    }
}

// Load the source code
const reportPath = path.join(__dirname, '../js/exportEnhancedSystemReport.js');
const reportCode = fs.readFileSync(reportPath, 'utf8');

console.log('TEST 1: System Load Analysis removed per-bus aggregates');
console.log('─'.repeat(80));

// Should NOT call computeSystemLoadAggregates in generateSystemLoadAnalysis
const systemLoadFunctionMatch = reportCode.match(/function generateSystemLoadAnalysis\([\s\S]*?\n\}/);
if (systemLoadFunctionMatch) {
    const functionBody = systemLoadFunctionMatch[0];
    
    assert(
        !functionBody.includes('computeSystemLoadAggregates(buses)'),
        'generateSystemLoadAnalysis does not call computeSystemLoadAggregates',
        'Still calling computeSystemLoadAggregates in system load analysis'
    );
    
    assert(
        !functionBody.includes('sum of all buses'),
        'System load analysis does not reference "sum of all buses"',
        'Still has confusing per-bus aggregate language'
    );
    
    assert(
        functionBody.includes('double-count'),
        'System load analysis contains double-counting warning',
        'Missing warning about double-counting'
    );
    
    assert(
        functionBody.includes('getSystemEntryTotals'),
        'System load analysis uses getSystemEntryTotals',
        'Not using getSystemEntryTotals for entry bus totals'
    );
} else {
    assert(false, 'Found generateSystemLoadAnalysis function', 'Function not found in code');
}

console.log('\nTEST 2: Load Flow Operational Analysis function exists');
console.log('─'.repeat(80));

assert(
    reportCode.includes('function generateLoadFlowOperationalAnalysis'),
    'generateLoadFlowOperationalAnalysis function exists',
    'New function not found in code'
);

assert(
    reportCode.includes('LOAD FLOW ANALYSIS - OPERATIONAL PERFORMANCE'),
    'Load flow operational analysis has correct header',
    'Header not found'
);

assert(
    reportCode.includes('Design VD(%)') && reportCode.includes('Operating VD(%)'),
    'Load flow shows both design and operating VD columns',
    'VD columns not found'
);

console.log('\nTEST 3: Design vs Operating Comparison uses entry totals');
console.log('─'.repeat(80));

const comparisonFunctionMatch = reportCode.match(/function generateDesignVsOperatingComparison\([\s\S]*?(?=\nfunction |\n\/\*\*)/);
if (comparisonFunctionMatch) {
    const functionBody = comparisonFunctionMatch[0];
    
    assert(
        functionBody.includes('getSystemEntryTotals'),
        'Comparison function uses getSystemEntryTotals',
        'Not using entry totals'
    );
    
    assert(
        !functionBody.includes('= computeSystemLoadAggregates(buses)'),
        'Comparison does not use computeSystemLoadAggregates',
        'Still using per-bus aggregates'
    );
    
    assert(
        functionBody.includes('diversityCurrent / ') && functionBody.includes('.summary?.totalCurrent'),
        'Comparison calculates operating VD using current ratios',
        'Not using proper current ratio calculation'
    );
} else {
    assert(false, 'Found generateDesignVsOperatingComparison function', 'Function not found');
}

console.log('\nTEST 4: Voltage Drop Compliance uses proper current ratios');
console.log('─'.repeat(80));

const complianceFunctionMatch = reportCode.match(/function generateVoltageDropComplianceAnalysis\([\s\S]*?(?=\nfunction |\n\/\*\*)/);
if (complianceFunctionMatch) {
    const functionBody = complianceFunctionMatch[0];
    
    assert(
        functionBody.includes('diversityCurrent') && functionBody.includes('currentRatio'),
        'Compliance function calculates operating VD using diversity current ratios',
        'Not using proper current ratios'
    );
    
    assert(
        functionBody.includes('Design Case (100% FLC)'),
        'Compliance shows design case label',
        'Design case label not found'
    );
    
    assert(
        functionBody.includes('Operating Case'),
        'Compliance shows operating case label',
        'Operating case label not found'
    );
} else {
    assert(false, 'Found generateVoltageDropComplianceAnalysis function', 'Function not found');
}

console.log('\nTEST 5: Load Flow Operational Analysis is called from main function');
console.log('─'.repeat(80));

// Just check if the call exists anywhere in the code
assert(
    reportCode.includes('generateLoadFlowOperationalAnalysis(calculatedBuses, analytics)'),
    'Main function calls generateLoadFlowOperationalAnalysis',
    'New function not called from main report generation'
);

console.log('\n' + '═'.repeat(80));
console.log(`Test Results: ${testsPassed} passed, ${testsFailed} failed out of ${testsRun} tests`);
console.log('═'.repeat(80));

if (testsFailed > 0) {
    console.error('\n❌ Some tests failed!');
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}

#!/usr/bin/env node
/**
 * Test System Totals Module (Node.js version)
 * Simple test to verify system totals functions work correctly
 * 
 * @author bfforex
 * @date 2025-12-03
 * @version 1.0.0
 */

// Load the system totals module (simulate browser globals)
const fs = require('fs');
const path = require('path');

// Create a mock window object
global.window = {};

// Read and evaluate the systemTotals.js file
const systemTotalsPath = path.join(__dirname, '../js/systemTotals.js');
const systemTotalsCode = fs.readFileSync(systemTotalsPath, 'utf8');

// NOTE: Using eval() here is acceptable for testing purposes in a controlled environment
// The code is from our own source file and not from external input
// For production use, consider using ES6 modules or a proper module system
// Evaluate the code in a function scope to avoid redeclaration
(function() {
    eval(systemTotalsCode);
})();

// Get the functions from window
const getSystemEntryBuses = global.window.getSystemEntryBuses;
const getPrimarySystemEntryBus = global.window.getPrimarySystemEntryBus;
const getSystemEntryTotals = global.window.getSystemEntryTotals;
const computeSystemLoadAggregates = global.window.computeSystemLoadAggregates;

console.log('🧪 Running System Totals Tests (Node.js)...\n');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST DATA: Mock buses structure
// ═══════════════════════════════════════════════════════════════════════════════

const testBuses = [
    {
        id: 'bus-1',
        name: 'MERALCO-CCP',
        type: 'source',
        voltage: 13800,
        parentBus: null,
        results: {
            loadFlow: {
                summary: {
                    connectedCurrent: 500,
                    totalCurrent: 500
                }
            }
        }
    },
    {
        id: 'bus-2',
        name: 'MV Substation 1',
        type: 'distribution',
        voltage: 13800,
        parentBus: 'bus-1',
        results: {
            loadFlow: {
                summary: {
                    connectedCurrent: 250,
                    totalCurrent: 250
                },
                demandSummary: {
                    demandCurrent: 237.5,
                    diversityCurrent: 208.3
                },
                demandFactorsApplied: true
            }
        }
    },
    {
        id: 'bus-3',
        name: 'LV Distribution',
        type: 'distribution',
        voltage: 480,
        parentBus: 'bus-2',
        results: {
            loadFlow: {
                summary: {
                    connectedCurrent: 1200,
                    totalCurrent: 1200
                },
                demandSummary: {
                    demandCurrent: 1140,
                    diversityCurrent: 1000
                },
                demandFactorsApplied: true
            }
        }
    },
    {
        id: 'bus-4',
        name: 'Motor Control Center',
        type: 'branch',
        voltage: 480,
        parentBus: 'bus-3',
        results: {
            loadFlow: {
                summary: {
                    connectedCurrent: 800,
                    totalCurrent: 800
                }
            }
        }
    }
];

let testsPassed = 0;
let testsFailed = 0;

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 1: getSystemEntryBuses
// ═══════════════════════════════════════════════════════════════════════════════

console.log('TEST 1: getSystemEntryBuses()');
console.log('─'.repeat(80));

try {
    const entryBuses = getSystemEntryBuses(testBuses);
    
    console.log(`   Found ${entryBuses.length} entry bus(es)`);
    
    if (entryBuses.length !== 1) {
        console.error(`❌ Expected 1 entry bus, found ${entryBuses.length}`);
        testsFailed++;
    } else if (entryBuses[0].name !== 'MERALCO-CCP') {
        console.error(`❌ Expected entry bus name 'MERALCO-CCP', found '${entryBuses[0].name}'`);
        testsFailed++;
    } else {
        console.log(`✅ Correct entry bus: ${entryBuses[0].name}`);
        testsPassed++;
    }
} catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    testsFailed++;
}

console.log('');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 2: getPrimarySystemEntryBus
// ═══════════════════════════════════════════════════════════════════════════════

console.log('TEST 2: getPrimarySystemEntryBus()');
console.log('─'.repeat(80));

try {
    const primaryBus = getPrimarySystemEntryBus(testBuses);
    
    if (!primaryBus) {
        console.error('❌ No primary bus found');
        testsFailed++;
    } else if (primaryBus.name !== 'MERALCO-CCP') {
        console.error(`❌ Expected 'MERALCO-CCP', found '${primaryBus.name}'`);
        testsFailed++;
    } else if (primaryBus.voltage !== 13800) {
        console.error(`❌ Expected voltage 13800V, found ${primaryBus.voltage}V`);
        testsFailed++;
    } else {
        console.log(`✅ Primary bus: ${primaryBus.name} @ ${primaryBus.voltage}V`);
        testsPassed++;
    }
} catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    testsFailed++;
}

console.log('');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 3: getSystemEntryTotals
// ═══════════════════════════════════════════════════════════════════════════════

console.log('TEST 3: getSystemEntryTotals()');
console.log('─'.repeat(80));

try {
    const totals = getSystemEntryTotals(testBuses);
    
    const expectedA = 500;
    const expectedKVA = (500 * 13800 * Math.sqrt(3)) / 1000;
    
    console.log(`   Total Connected: ${totals.totalConnectedA.toFixed(2)} A`);
    console.log(`   Total kVA: ${totals.totalConnectedKVA.toFixed(2)} kVA`);
    console.log(`   Entry buses: ${totals.entryBuses.length}`);
    
    if (Math.abs(totals.totalConnectedA - expectedA) < 0.01) {
        console.log(`✅ Correct current: ${totals.totalConnectedA.toFixed(2)} A`);
        testsPassed++;
    } else {
        console.error(`❌ Expected ${expectedA} A, got ${totals.totalConnectedA.toFixed(2)} A`);
        testsFailed++;
    }
    
    if (Math.abs(totals.totalConnectedKVA - expectedKVA) < 0.01) {
        console.log(`✅ Correct power: ${totals.totalConnectedKVA.toFixed(2)} kVA`);
        testsPassed++;
    } else {
        console.error(`❌ Expected ${expectedKVA.toFixed(2)} kVA, got ${totals.totalConnectedKVA.toFixed(2)} kVA`);
        testsFailed++;
    }
    
    // Store for later comparison
    global.testTotals = totals;
    
} catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    testsFailed++;
}

console.log('');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 4: computeSystemLoadAggregates
// ═══════════════════════════════════════════════════════════════════════════════

console.log('TEST 4: computeSystemLoadAggregates()');
console.log('─'.repeat(80));

try {
    const aggregates = computeSystemLoadAggregates(testBuses);
    
    // Expected totals (sum of all buses)
    const expectedConnected = 500 + 250 + 1200 + 800; // 2750 A
    
    console.log(`   Connected: ${aggregates.totalConnected.toFixed(2)} A`);
    console.log(`   Demand: ${aggregates.totalDemand.toFixed(2)} A`);
    console.log(`   Diversity: ${aggregates.totalDiversity.toFixed(2)} A`);
    console.log(`   Buses with demand data: ${aggregates.busesWithDemandData}`);
    
    if (Math.abs(aggregates.totalConnected - expectedConnected) < 0.01) {
        console.log(`✅ Correct aggregate: ${aggregates.totalConnected.toFixed(2)} A`);
        testsPassed++;
    } else {
        console.error(`❌ Expected ${expectedConnected} A, got ${aggregates.totalConnected.toFixed(2)} A`);
        testsFailed++;
    }
    
    if (aggregates.busesWithDemandData === 2) {
        console.log(`✅ Correct demand data count: ${aggregates.busesWithDemandData}`);
        testsPassed++;
    } else {
        console.error(`❌ Expected 2 buses with demand data, got ${aggregates.busesWithDemandData}`);
        testsFailed++;
    }
    
    console.log(`\n📊 Key Insight: System Entry Total (${global.testTotals.totalConnectedA.toFixed(2)} A) != Per-Bus Aggregate (${aggregates.totalConnected.toFixed(2)} A)`);
    console.log(`   This is EXPECTED - entry total is authoritative for system capacity`);
    console.log(`   Per-bus aggregate is for MD/diversity analysis only`);
    
} catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    testsFailed++;
}

console.log('');
console.log('═'.repeat(80));
console.log(`Test Results: ${testsPassed} passed, ${testsFailed} failed`);
console.log('═'.repeat(80));

// Exit with appropriate code
process.exit(testsFailed > 0 ? 1 : 0);

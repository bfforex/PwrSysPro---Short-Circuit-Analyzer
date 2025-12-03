/**
 * Test System Totals Module
 * Simple test to verify system totals functions work correctly
 * 
 * @author bfforex
 * @date 2025-12-03
 * @version 1.0.0
 */

console.log('🧪 Running System Totals Tests...\n');

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

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 1: getSystemEntryBuses
// ═══════════════════════════════════════════════════════════════════════════════

console.log('TEST 1: getSystemEntryBuses()');
console.log('─'.repeat(80));

try {
    const entryBuses = getSystemEntryBuses(testBuses);
    
    console.log(`✅ Found ${entryBuses.length} entry bus(es)`);
    
    if (entryBuses.length !== 1) {
        console.error(`❌ Expected 1 entry bus, found ${entryBuses.length}`);
    } else if (entryBuses[0].name !== 'MERALCO-CCP') {
        console.error(`❌ Expected entry bus name 'MERALCO-CCP', found '${entryBuses[0].name}'`);
    } else {
        console.log(`✅ Correct entry bus: ${entryBuses[0].name}`);
    }
} catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
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
    } else if (primaryBus.name !== 'MERALCO-CCP') {
        console.error(`❌ Expected 'MERALCO-CCP', found '${primaryBus.name}'`);
    } else if (primaryBus.voltage !== 13800) {
        console.error(`❌ Expected voltage 13800V, found ${primaryBus.voltage}V`);
    } else {
        console.log(`✅ Primary bus: ${primaryBus.name} @ ${primaryBus.voltage}V`);
    }
} catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
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
    } else {
        console.error(`❌ Expected ${expectedA} A, got ${totals.totalConnectedA.toFixed(2)} A`);
    }
    
    if (Math.abs(totals.totalConnectedKVA - expectedKVA) < 0.01) {
        console.log(`✅ Correct power: ${totals.totalConnectedKVA.toFixed(2)} kVA`);
    } else {
        console.error(`❌ Expected ${expectedKVA.toFixed(2)} kVA, got ${totals.totalConnectedKVA.toFixed(2)} kVA`);
    }
} catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
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
    } else {
        console.error(`❌ Expected ${expectedConnected} A, got ${aggregates.totalConnected.toFixed(2)} A`);
    }
    
    if (aggregates.busesWithDemandData === 2) {
        console.log(`✅ Correct demand data count: ${aggregates.busesWithDemandData}`);
    } else {
        console.error(`❌ Expected 2 buses with demand data, got ${aggregates.busesWithDemandData}`);
    }
    
    // Get the entry totals for comparison
    const entryTotals = getSystemEntryTotals(testBuses);
    
    console.log(`\n📊 Key Insight: System Entry Total (${entryTotals.totalConnectedA.toFixed(2)} A) != Per-Bus Aggregate (${aggregates.totalConnected.toFixed(2)} A)`);
    console.log(`   This is EXPECTED - entry total is authoritative for system capacity`);
    console.log(`   Per-bus aggregate is for MD/diversity analysis only`);
    
} catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
}

console.log('');
console.log('═'.repeat(80));
console.log('✅ All System Totals Tests Complete');
console.log('═'.repeat(80));

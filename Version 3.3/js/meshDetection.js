/**
 * Mesh Detection & Graph Analysis Module
 * Handles electrical network topology analysis for bus tie configurations
 * 
 * @author bfforex
 * @date 2025-11-04
 * @version 1.0.0 - Bus Tie Feature
 * 
 * FEATURES:
 * - Graph representation of electrical system
 * - Cycle/loop detection using Depth-First Search (DFS)
 * - Path finding between any two buses
 * - Bus tie identification in paths
 * - Support for parallel paths and mesh networks
 * 
 * STANDARDS COMPLIANCE:
 * - IEEE 141-1993: Bus tie configurations and parallel operation
 * - Graph theory: DFS for cycle detection and path finding
 */

console.log('🔍 Loading Mesh Detection Module v1.0...');

// ═══════════════════════════════════════════════════════════════════════════
// GRAPH CONSTRUCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build adjacency list representation of electrical network
 * @param {Array} components - Array of all system components
 * @param {Array} buses - Array of all buses
 * @returns {Object} Graph as adjacency list with additional metadata
 */
function buildNetworkGraph(components, buses) {
    console.log('\n📊 Building network graph...');
    
    // Initialize adjacency list
    const graph = {};
    const busIds = new Set();
    
    // Add all buses to graph
    buses.forEach(bus => {
        graph[bus.id] = {
            name: bus.name,
            voltage: bus.voltage,
            tag: bus.tag,
            neighbors: []
        };
        busIds.add(bus.id);
    });
    
    // Add edges from components
    let edgeCount = 0;
    components.forEach(comp => {
        if (comp.fromBus && comp.toBus && busIds.has(comp.fromBus) && busIds.has(comp.toBus)) {
            // Add edge in both directions (undirected graph)
            graph[comp.fromBus].neighbors.push({
                toBusId: comp.toBus,
                componentId: comp.id,
                componentType: comp.type,
                isBusTie: comp.type === 'bus-tie',
                impedance: comp.impedance || 0,
                state: comp.currentState || comp.normalState || 'closed',
                tag: comp.tag || `${comp.type}-${comp.id}`
            });
            
            graph[comp.toBus].neighbors.push({
                toBusId: comp.fromBus,
                componentId: comp.id,
                componentType: comp.type,
                isBusTie: comp.type === 'bus-tie',
                impedance: comp.impedance || 0,
                state: comp.currentState || comp.normalState || 'closed',
                tag: comp.tag || `${comp.type}-${comp.id}`
            });
            
            edgeCount++;
        }
    });
    
    console.log(`✅ Graph built: ${buses.length} nodes, ${edgeCount} edges`);
    return graph;
}

// ═══════════════════════════════════════════════════════════════════════════
// PATH FINDING ALGORITHMS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Find all paths between two buses using Depth-First Search
 * Considers only components in their current operating state
 * @param {string} fromBusId - Source bus ID
 * @param {string} toBusId - Destination bus ID
 * @param {Object} graph - Network graph (adjacency list)
 * @param {boolean} includeOpenTies - Whether to include open bus ties (default: false)
 * @returns {Array} Array of paths, each path is an array of {busId, componentId, componentTag}
 */
function findAllPaths(fromBusId, toBusId, graph, includeOpenTies = false) {
    console.log(`\n🔍 Finding all paths from ${graph[fromBusId]?.name || fromBusId} to ${graph[toBusId]?.name || toBusId}...`);
    console.log(`   Include open ties: ${includeOpenTies}`);
    
    if (!graph[fromBusId] || !graph[toBusId]) {
        console.warn('⚠️ Invalid bus IDs provided');
        return [];
    }
    
    const allPaths = [];
    const visited = new Set();
    const currentPath = [];
    
    /**
     * DFS helper function to explore all paths
     * @param {string} currentBusId - Current bus in traversal
     */
    function dfsExplore(currentBusId) {
        // Base case: reached destination
        if (currentBusId === toBusId) {
            // Copy current path
            allPaths.push([...currentPath]);
            return;
        }
        
        // Mark as visited
        visited.add(currentBusId);
        
        // Explore neighbors
        const node = graph[currentBusId];
        if (node && node.neighbors) {
            for (const edge of node.neighbors) {
                // Skip if already visited (avoid cycles within a single path)
                if (visited.has(edge.toBusId)) {
                    continue;
                }
                
                // Skip open bus ties unless explicitly requested
                if (edge.isBusTie && edge.state === 'open' && !includeOpenTies) {
                    continue;
                }
                
                // Add edge to path
                currentPath.push({
                    fromBusId: currentBusId,
                    toBusId: edge.toBusId,
                    componentId: edge.componentId,
                    componentType: edge.componentType,
                    componentTag: edge.tag,
                    isBusTie: edge.isBusTie,
                    state: edge.state,
                    impedance: edge.impedance
                });
                
                // Recurse
                dfsExplore(edge.toBusId);
                
                // Backtrack
                currentPath.pop();
            }
        }
        
        // Unmark as visited (backtrack)
        visited.delete(currentBusId);
    }
    
    // Start DFS
    dfsExplore(fromBusId);
    
    console.log(`✅ Found ${allPaths.length} path(s)`);
    
    return allPaths;
}

/**
 * Find the shortest path between two buses (minimum impedance)
 * @param {string} fromBusId - Source bus ID
 * @param {string} toBusId - Destination bus ID
 * @param {Object} graph - Network graph
 * @returns {Array|null} Shortest path or null if no path exists
 */
function findShortestPath(fromBusId, toBusId, graph) {
    const allPaths = findAllPaths(fromBusId, toBusId, graph);
    
    if (allPaths.length === 0) {
        return null;
    }
    
    // Calculate total impedance for each path
    const pathsWithImpedance = allPaths.map(path => ({
        path: path,
        totalImpedance: path.reduce((sum, edge) => sum + (edge.impedance || 0), 0)
    }));
    
    // Sort by impedance and return shortest
    pathsWithImpedance.sort((a, b) => a.totalImpedance - b.totalImpedance);
    
    return pathsWithImpedance[0].path;
}

// ═══════════════════════════════════════════════════════════════════════════
// BUS TIE ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a path contains any bus ties
 * @param {Array} path - Path to check (array of edges)
 * @returns {boolean} True if path contains at least one bus tie
 */
function isBusTieInPath(path) {
    if (!path || !Array.isArray(path)) {
        return false;
    }
    
    return path.some(edge => edge.isBusTie === true);
}

/**
 * Get all bus ties in a path
 * @param {Array} path - Path to analyze
 * @returns {Array} Array of bus tie edges in the path
 */
function getBusTiesInPath(path) {
    if (!path || !Array.isArray(path)) {
        return [];
    }
    
    return path.filter(edge => edge.isBusTie === true);
}

/**
 * Calculate parallel impedance for multiple paths
 * Formula: 1/Z_total = 1/Z1 + 1/Z2 + ... + 1/Zn
 * @param {Array} paths - Array of paths, each with impedance
 * @returns {number} Parallel impedance
 */
function calculateParallelImpedance(paths) {
    if (!paths || paths.length === 0) {
        return Infinity;
    }
    
    if (paths.length === 1) {
        return paths[0].reduce((sum, edge) => sum + (edge.impedance || 0), 0);
    }
    
    // Calculate impedance for each path
    const impedances = paths.map(path => 
        path.reduce((sum, edge) => sum + (edge.impedance || 0), 0)
    );
    
    // Calculate parallel impedance
    let sum = 0;
    for (const z of impedances) {
        if (z > 0) {
            sum += 1 / z;
        }
    }
    
    return sum > 0 ? 1 / sum : Infinity;
}

// ═══════════════════════════════════════════════════════════════════════════
// MESH/CYCLE DETECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect all meshes (cycles) in the network
 * A mesh is created when multiple paths exist between buses (typically from bus ties)
 * @param {Object} graph - Network graph
 * @returns {Array} Array of detected meshes
 */
function detectMeshes(components, buses) {
    console.log('\n🔍 Detecting meshes in network...');
    
    const graph = buildNetworkGraph(components, buses);
    const meshes = [];
    const visited = new Set();
    
    /**
     * DFS to detect cycles
     * @param {string} currentBusId - Current bus
     * @param {string} parentBusId - Parent bus (to avoid false cycle detection)
     * @param {Array} path - Current path
     */
    function detectCycle(currentBusId, parentBusId, path) {
        visited.add(currentBusId);
        
        const node = graph[currentBusId];
        if (!node || !node.neighbors) return;
        
        for (const edge of node.neighbors) {
            // Skip if it's the parent (we came from there)
            if (edge.toBusId === parentBusId) {
                continue;
            }
            
            // Skip open bus ties
            if (edge.isBusTie && edge.state === 'open') {
                continue;
            }
            
            // If neighbor is visited, we found a cycle
            if (visited.has(edge.toBusId)) {
                // Check if this forms a new mesh
                const cycleStart = path.findIndex(p => p.busId === edge.toBusId);
                if (cycleStart !== -1) {
                    const cycle = path.slice(cycleStart);
                    cycle.push({ busId: currentBusId, edge: edge });
                    
                    // Check if this mesh was already detected
                    const meshKey = cycle.map(p => p.busId).sort().join('-');
                    if (!meshes.find(m => m.key === meshKey)) {
                        meshes.push({
                            key: meshKey,
                            buses: cycle.map(p => p.busId),
                            busNames: cycle.map(p => graph[p.busId]?.name || p.busId),
                            edges: cycle.map(p => p.edge).filter(e => e),
                            hasBusTie: cycle.some(p => p.edge && p.edge.isBusTie)
                        });
                    }
                }
            } else {
                // Continue DFS
                const newPath = [...path, { busId: currentBusId, edge: edge }];
                detectCycle(edge.toBusId, currentBusId, newPath);
            }
        }
    }
    
    // Start DFS from each unvisited bus
    for (const busId in graph) {
        if (!visited.has(busId)) {
            detectCycle(busId, null, []);
        }
    }
    
    console.log(`✅ Detected ${meshes.length} mesh(es) in network`);
    
    // Log mesh details
    meshes.forEach((mesh, index) => {
        console.log(`\n   Mesh ${index + 1}:`);
        console.log(`     Buses: ${mesh.busNames.join(' → ')}`);
        console.log(`     Contains bus tie: ${mesh.hasBusTie ? 'YES' : 'NO'}`);
    });
    
    return meshes;
}

// ═══════════════════════════════════════════════════════════════════════════
// FAULT CURRENT PATH ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analyze fault current paths for a given bus
 * Considers both normal paths and paths through closed bus ties
 * @param {string} faultBusId - Bus where fault occurs
 * @param {Array} sourceBuses - Array of source buses (generators, utility connections)
 * @param {Object} graph - Network graph
 * @returns {Object} Analysis results with paths and impedances
 */
function analyzeFaultCurrentPaths(faultBusId, sourceBuses, graph) {
    console.log(`\n⚡ Analyzing fault current paths to ${graph[faultBusId]?.name || faultBusId}...`);
    
    const analysis = {
        faultBusId: faultBusId,
        faultBusName: graph[faultBusId]?.name || faultBusId,
        sourcePaths: [],
        totalPaths: 0,
        pathsWithBusTies: 0,
        parallelImpedance: 0
    };
    
    // Find paths from each source bus
    sourceBuses.forEach(sourceBus => {
        const paths = findAllPaths(sourceBus.id, faultBusId, graph);
        
        if (paths.length > 0) {
            const pathsWithTies = paths.filter(p => isBusTieInPath(p));
            
            analysis.sourcePaths.push({
                sourceBusId: sourceBus.id,
                sourceBusName: sourceBus.name,
                allPaths: paths,
                pathsWithBusTies: pathsWithTies,
                pathCount: paths.length,
                parallelImpedance: calculateParallelImpedance(paths)
            });
            
            analysis.totalPaths += paths.length;
            analysis.pathsWithBusTies += pathsWithTies.length;
        }
    });
    
    console.log(`✅ Found ${analysis.totalPaths} total path(s), ${analysis.pathsWithBusTies} with bus ties`);
    
    return analysis;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

window.buildNetworkGraph = buildNetworkGraph;
window.findAllPaths = findAllPaths;
window.findShortestPath = findShortestPath;
window.isBusTieInPath = isBusTieInPath;
window.getBusTiesInPath = getBusTiesInPath;
window.calculateParallelImpedance = calculateParallelImpedance;
window.detectMeshes = detectMeshes;
window.analyzeFaultCurrentPaths = analyzeFaultCurrentPaths;

console.log('✅ Mesh Detection Module v1.0 loaded');
console.log('   - Graph building: READY');
console.log('   - Path finding: READY');
console.log('   - Mesh detection: READY');
console.log('   - Bus tie analysis: READY');

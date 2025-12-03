interface CommunityResult {
    [nodeId: string]: number;
}

/**
 * A simplified implementation of the Louvain method for community detection.
 * This is a heuristic method that is based on modularity optimization.
 */
export function detectCommunities(nodes: { id: string }[], links: { source: string; target: string; value: number }[]): CommunityResult {
    // 1. Initialize each node in its own community
    let nodeCommunity: { [key: string]: number } = {};
    nodes.forEach((node, index) => {
        nodeCommunity[node.id] = index;
    });

    const adj: { [key: string]: { [key: string]: number } } = {};
    const nodeWeights: { [key: string]: number } = {};
    let totalWeight = 0;

    // Build adjacency list and calculate node weights (degrees)
    nodes.forEach(n => {
        adj[n.id] = {};
        nodeWeights[n.id] = 0;
    });

    links.forEach(l => {
        const s = l.source;
        const t = l.target;
        const w = l.value;

        if (!adj[s]) adj[s] = {};
        if (!adj[t]) adj[t] = {};

        adj[s][t] = (adj[s][t] || 0) + w;
        adj[t][s] = (adj[t][s] || 0) + w;

        nodeWeights[s] = (nodeWeights[s] || 0) + w;
        nodeWeights[t] = (nodeWeights[t] || 0) + w;
        totalWeight += w;
    });

    // Optimization phase (simplified: single pass or few passes)
    let improvement = true;
    let maxIter = 10; // Limit iterations for performance

    while (improvement && maxIter > 0) {
        improvement = false;
        maxIter--;

        nodes.forEach(node => {
            const nodeId = node.id;
            const currentComm = nodeCommunity[nodeId];
            const neighbors = adj[nodeId];

            // Calculate current modularity contribution (simplified)
            // We want to maximize: Sum_in - (Sum_tot * k_i) / (2m)
            // Where Sum_in is sum of weights to neighbors in community C
            // Sum_tot is sum of weights of all nodes in community C
            // k_i is degree of node i
            // m is total weight of all edges

            // Find best community
            const neighborCommunities: { [comm: number]: number } = {};

            // Weights to communities
            Object.entries(neighbors).forEach(([neighborId, weight]) => {
                const comm = nodeCommunity[neighborId];
                neighborCommunities[comm] = (neighborCommunities[comm] || 0) + weight;
            });

            // Calculate gain for moving to each neighbor community
            // Gain = (Sum_in_new - Sum_tot_new * k_i / m) - (Sum_in_old - Sum_tot_old * k_i / m)
            // Simplified: just look at local modularity gain

            // Pre-calculate community totals
            // This is expensive to do fully correctly in every step for a simple implementation,
            // so we use a greedy approach based mainly on connection strength (Sum_in)

            let maxLinkWeight = 0;
            let bestLinkComm = -1;

            Object.entries(neighborCommunities).forEach(([commStr, weight]) => {
                const comm = parseInt(commStr);
                if (weight > maxLinkWeight) {
                    maxLinkWeight = weight;
                    bestLinkComm = comm;
                }
            });

            // If the best connected community is different, move there
            // This is a "Label Propagation" style simplification of Louvain which works well for visual grouping
            if (bestLinkComm !== -1 && bestLinkComm !== currentComm) {
                // Check if it's actually better (simple check: is the connection to the new community stronger than to the current?)
                const currentLinkWeight = neighborCommunities[currentComm] || 0;
                if (maxLinkWeight > currentLinkWeight) {
                    nodeCommunity[nodeId] = bestLinkComm;
                    improvement = true;
                }
            }
        });
    }

    // Renumber communities to be 0-indexed and sequential
    const uniqueComms = Array.from(new Set(Object.values(nodeCommunity)));
    const commMap = new Map<number, number>();
    uniqueComms.forEach((c, i) => commMap.set(c, i));

    const finalResult: CommunityResult = {};
    Object.keys(nodeCommunity).forEach(n => {
        finalResult[n] = commMap.get(nodeCommunity[n])!;
    });

    return finalResult;
}

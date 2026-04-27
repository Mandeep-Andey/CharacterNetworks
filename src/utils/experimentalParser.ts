export interface Participant {
    canonical_id: string;
    display_name: string;
    role_in_event: string;
}

export interface InteractionEvent {
    event_id: string;
    scene_id: string;
    chapter_num: number;
    book_num: number;
    participants: Participant[];
    interaction_kind: string;
    direction: string;
    medium: string;
    evidence_xml_ids: string[];
    evidence_texts: string[];
    dialogue_quote_ids: string[];
    provenance: Record<string, any>;
    flags: string[];
}

export interface ExperimentalNode {
    id: string;
    group: number;
    groupName: string;
    degree?: number;
    community?: number;
}

export interface ExperimentalInteractionDetail {
    type: string;
    snippet: string;
    flags: string[];
    medium: string;
    eventId: string;
}

export interface ExperimentalLink {
    source: string;
    target: string;
    value: number;
    interactions: ExperimentalInteractionDetail[];
    interactionTypes: string[];
}

export interface ExperimentalGraphData {
    nodes: ExperimentalNode[];
    links: ExperimentalLink[];
}

export interface LintReport {
    chapter_num: number;
    passed: boolean;
    total_events: number;
    passed_events: number;
    failed_events: number;
    total_violations: number;
    rule_counts: Record<string, number>;
    events: any[];
    generated_at: string;
}

/**
 * Parses raw JSONL string into an array of InteractionEvent objects.
 */
export function parseInteractionsJsonl(rawJsonl: string): InteractionEvent[] {
    if (!rawJsonl || rawJsonl.trim() === '') return [];
    
    // Split by newline and parse each line
    return rawJsonl
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            try {
                return JSON.parse(line) as InteractionEvent;
            } catch (e) {
                console.error("Failed to parse jsonl line", e);
                return null;
            }
        })
        .filter((event): event is InteractionEvent => event !== null);
}

/**
 * Transforms an array of InteractionEvent into GraphData (Nodes and Links)
 */
export function buildExperimentalGraphData(events: InteractionEvent[]): ExperimentalGraphData {
    const nodesMap = new Map<string, ExperimentalNode>();
    const linksMap = new Map<string, ExperimentalLink>();

    for (const event of events) {
        // Build nodes
        for (const p of event.participants) {
            if (!nodesMap.has(p.canonical_id)) {
                nodesMap.set(p.canonical_id, {
                    id: p.canonical_id,
                    group: 0, // In experimental, we might lack precomputed groups without Louvain or metadata
                    groupName: 'Unknown',
                    degree: 0,
                    community: 0
                });
            }
        }

        // Build edges
        // If there's multiple participants, create clique edges between them
        if (event.participants.length > 1) {
            for (let i = 0; i < event.participants.length; i++) {
                for (let j = i + 1; j < event.participants.length; j++) {
                    const p1 = event.participants[i].canonical_id;
                    const p2 = event.participants[j].canonical_id;

                    const [source, target] = [p1, p2].sort();
                    const edgeKey = `${source}|${target}`;

                    let link = linksMap.get(edgeKey);
                    if (!link) {
                        link = {
                            source,
                            target,
                            value: 0,
                            interactions: [],
                            interactionTypes: []
                        };
                        linksMap.set(edgeKey, link);
                    }

                    link.value += 1;
                    link.interactions.push({
                        type: event.interaction_kind,
                        snippet: event.evidence_texts.join(' '),
                        flags: event.flags || [],
                        medium: event.medium,
                        eventId: event.event_id
                    });
                    
                    if (!link.interactionTypes.includes(event.interaction_kind)) {
                        link.interactionTypes.push(event.interaction_kind);
                    }
                }
            }
        }
    }

    // Compute simple degree
    const links = Array.from(linksMap.values());
    const degreeMap = new Map<string, number>();
    for (const link of links) {
        degreeMap.set(link.source, (degreeMap.get(link.source) || 0) + link.value);
        degreeMap.set(link.target, (degreeMap.get(link.target) || 0) + link.value);
    }

    const nodes = Array.from(nodesMap.values());
    for (const node of nodes) {
        node.degree = degreeMap.get(node.id) || 0;
    }

    return { nodes, links };
}

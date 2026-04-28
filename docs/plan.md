# Integration Plan: NLP Network Knowledge Dashboard

## Objective
To build an impressive, elegant, and highly interactive character network dashboard that utilizes pre-processed NLP insights from `network_knowledge.json`. The design must balance a beautiful, uncluttered default experience for casual visitors with a powerful "Analytics Mode" for deep literature analysis.

## Core Principles
1. **Premium & Elegant UX:** Fluid physics, beautiful color palettes, smooth transitions, and tactile interactions.
2. **Progressive Disclosure:** Prevent information overload by hiding complex metrics behind an explicit toggle and click events.
3. **Clarity & Guidance:** Ensure all metrics and interactions are clearly explained to the user via a dedicated "About / Guide" section and tooltips.

## Feature Roadmap & Execution Steps

### Phase 1: Data Integration & App State
1. **Load Data:** Update the data loading logic to ingest `network_knowledge.json` instead of old mock data.
2. **Global State:** Introduce new state variables in `App.tsx` (or Context):
   - `isAnalyticsMode` (boolean)
   - `selectedNode` (object | null)
   - `selectedEdge` (object | null)

### Phase 2: Core Graph Enhancements (D3)
1. **Visual Polish:** Refine D3 force simulation parameters to feel "alive". Improve hover states (glows, link highlighting).
2. **Event Handlers:** 
   - Ensure clicking a node sets `selectedNode`.
   - Ensure clicking an edge sets `selectedEdge`.
3. **Dynamic Styling:** Allow node colors and sizes to update reactively based on state (e.g., color by clique, size by agency score) when Analytics Mode is active.

### Phase 3: Analytics Mode & Control Panel (Left Panel)
1. **Toggle Switch:** Build an elegant toggle switch for Analytics Mode.
2. **Advanced Controls:** When Analytics Mode is active, render dropdowns for:
   - Node Color By (Community, Social Class, Gender)
   - Node Size By (Uniform, Total Events, Agency Score)
3. **Filters:** Add checkboxes to filter out specific cliques or social classes.

### Phase 4: The Knowledge Panel (Right Panel)
1. **Character Profile (Node Selection):**
   - Render basic info.
   - If Analytics Mode is active, render beautiful visual gauges/bars for `agency_score` and `influence_ratio`.
2. **Relationship Evidence (Edge Selection):**
   - Display total relationship weight.
   - Render a scrollable list of text excerpts (`evidence.text`) formatted as blockquotes with citations.

### Phase 5: Guidance & "About" Modal
1. **Modal Component:** Create an "About / Guide" modal.
2. **Content - Mechanics:** Briefly explain how to pan, zoom, and interact with the graph.
3. **Content - Glossary:** Explain narrative metrics (`agency_score`, `influence_ratio`, etc.) and how they are useful for literary analysis.

## Next Steps
Following this document, we will immediately begin execution starting with Phase 1 (Data Integration) and Phase 2 (D3 Graph enhancements), proceeding step-by-step to build out the UI.

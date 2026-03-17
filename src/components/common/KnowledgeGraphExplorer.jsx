import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';

// Register extensions
cytoscape.use(coseBilkent);

// ─── Colours & Config (Premium Style) ──────────────────────────────────────────
const TYPE_COLORS = {
    "hub":                      { color: "#1e293b", border: "#0f172a", size: 52 }, // Deep Navy
    "node":                     { color: "#94a3b8", border: "#64748b", size: 30 }, // Slate
    "cohort memberships":       { color: "#6366f1", border: "#4338ca", size: 34 }, // Indigo
    "content items":            { color: "#8b5cf6", border: "#6d28d9", size: 34 }, // Violet
    "content usage":            { color: "#0ea5e9", border: "#0369a1", size: 32 }, // Sky Blue (Replaced Pink)
    "employee org membership":  { color: "#64748b", border: "#334155", size: 32 }, // Slate Grey
    "employees":                { color: "#3b82f6", border: "#1d4ed8", size: 34 }, // Blue
    "goals":                    { color: "#10b981", border: "#047857", size: 34 }, // Emerald
    "nudges":                   { color: "#ef4444", border: "#b91c1c", size: 32 }, // Red (Replaced Rose)
    "reasoning events":         { color: "#f97316", border: "#c2410c", size: 34 }, // Orange
    "sessions":                 { color: "#f59e0b", border: "#d97706", size: 32 }, // Amber
    "org units":                { color: "#14b8a6", border: "#0f766e", size: 34 }, // Teal
    "programs":                 { color: "#84cc16", border: "#4d7c0f", size: 34 }, // Lime (Replaced Fuchsia)
    "employee":                 { color: "#06b6d4", border: "#0891b2", size: 34 }, // Cyan
    "session":                  { color: "#f59e0b", border: "#d97706", size: 32 }, // Amber
    "nudge":                    { color: "#ef4444", border: "#b91c1c", size: 32 }, // Red (Replaced Rose)
};

const getCfg = (type) => {
    const t = type?.toLowerCase().replace(/_/g, ' ');
    return TYPE_COLORS[t] || TYPE_COLORS["node"];
}

const KnowledgeGraphExplorer = ({ searchQuery: externalSearchQuery, onStatsUpdate }) => {
    const containerRef = useRef(null);
    const cyRef = useRef(null);

    const [status, setStatus] = useState('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
    const [expandedTypes, setExpandedTypes] = useState(new Set());
    const [hoveredNode, setHoveredNode] = useState(null);
    const [internalSearch, setInternalSearch] = useState('');
    const [stats, setStats] = useState({ totalNodes: 0, totalEdges: 0, types: {} });
    const [highlightType, setHighlightType] = useState(null);

    const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearch;

    // Report stats to parent
    useEffect(() => {
        if (onStatsUpdate) onStatsUpdate(stats);
    }, [stats, onStatsUpdate]);

    // ── Load JSON with Sampling ───────────────────────────────────────────────
    useEffect(() => {
        fetch('/knowledge_graph.json')
            .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
            .then(text => {
                const clean = text.replace(/:\s*NaN([,\}\]])/g, ': null$1');
                return JSON.parse(clean);
            })
            .then(raw => {
                const totalTarget = 650; 
                const nodesByType = {};
                (raw.nodes || []).forEach(n => {
                    if (!nodesByType[n.type]) nodesByType[n.type] = [];
                    nodesByType[n.type].push(n);
                });

                let sampledNodes = [];
                Object.keys(nodesByType).forEach(t => { sampledNodes = sampledNodes.concat(nodesByType[t].slice(0, 45)); });

                const nodeIds = new Set(sampledNodes.map(n => n.id));
                const sampledEdges = (raw.edges || []).filter(e => nodeIds.has(e.source) && nodeIds.has(e.target)).slice(0, 900);

                const finalTypes = {};
                sampledNodes.forEach(n => { finalTypes[n.type] = (finalTypes[n.type] || 0) + 1; });

                setStats({ totalNodes: sampledNodes.length, totalEdges: sampledEdges.length, types: finalTypes });
                setGraphData({ nodes: sampledNodes, edges: sampledEdges });
                setStatus('ready');
            })
            .catch(e => { setErrorMsg(String(e.message)); setStatus('error'); });
    }, []);

    // ── Build Elements for Cytoscape ──────────────────────────────────────────
    const elements = useMemo(() => {
        const els = [];

        // 1. Central Hub Node
        els.push({
            data: { id: 'hub', label: 'Knowledge Hub', type: 'hub', isCluster: 0, isHub: 1 }
        });

        // 2. Cluster nodes representing each data type
        Object.keys(stats.types).forEach(type => {
            els.push({
                data: {
                    id: `C::${type}`,
                    label: type.replace(/_/g, ' '),
                    type,
                    isCluster: 1,
                    count: stats.types[type]
                }
            });
            // Connect cluster to Hub
            els.push({
                data: { id: `H::C::${type}`, source: 'hub', target: `C::${type}`, label: 'HAS' }
            });
        });

        // 3. Individual nodes when a category is expanded
        expandedTypes.forEach(et => {
            graphData.nodes.filter(n => n.type === et).forEach(n => {
                const fullName = String(n.data?.name || n.data?.employee_id || n.id);
                const lbl = fullName.length > 35 ? fullName.slice(0, 32) + '...' : fullName;
                els.push({ data: { id: n.id, label: lbl, type: n.type, isCluster: 0, rawData: n.data } });

                // Connect individual node to its cluster
                els.push({
                    data: { id: `C::N::${n.id}`, source: `C::${et}`, target: n.id, label: 'MEMB' }
                });
            });
        });

        // 4. Edges connecting individual nodes (cross-category relations)
        graphData.edges.forEach(e => {
            const sNode = graphData.nodes.find(n => n.id === e.source);
            const tNode = graphData.nodes.find(n => n.id === e.target);
            if (!sNode || !tNode) return;

            if (expandedTypes.has(sNode.type) && expandedTypes.has(tNode.type)) {
                const eid = `E::${e.source}::${e.target}::${e.relation}`;
                if (!els.some(el => el.data.id === eid)) {
                    els.push({ data: { id: eid, source: e.source, target: e.target, label: e.relation } });
                }
            }
        });

        return els;
    }, [graphData, expandedTypes, stats]);

    // ── Cytoscape Main Setup ──────────────────────────────────────────────────
    useEffect(() => {
        if (status !== 'ready' || !containerRef.current || elements.length === 0) return;

        // If already initialized, update elements and run a stable layout
        if (cyRef.current && !cyRef.current.destroyed()) {
            const cy = cyRef.current;
            try {
                cy.stop(); // Stop any running layout/animation
                cy.batch(() => {
                    cy.elements().remove();
                    cy.add(elements);
                });
                
                cy.layout({
                    name: 'cose-bilkent',
                    animate: true,
                    randomize: false, // Prevents jumping
                    fit: false, 
                    padding: 50,
                    idealEdgeLength: 200,
                    nodeRepulsion: 8000,
                    edgeElasticity: 0.3,
                    nestingFactor: 0.1,
                    gravity: 0.15,
                    numIter: 3000,
                    tile: true,
                    animationDuration: 1000
                }).run();
                
                setTimeout(() => { if (!cy.destroyed()) cy.resize(); }, 50);
            } catch (err) {
                console.error("Cytoscape update failed, re-initializing:", err);
                cy.destroy();
                cyRef.current = null;
            }
            if (cyRef.current) return;
        }

        const cy = cytoscape({
            container: containerRef.current,
            elements,
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': n => getCfg(n.data('type')).color,
                        'border-color': n => getCfg(n.data('type')).border,
                        'border-width': 2,
                        'label': 'data(label)',
                        'color': '#fff',
                        'font-family': 'Inter, sans-serif',
                        'font-weight': 700,
                        'font-size': '9px',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'text-outline-width': 1,
                        'text-outline-color': n => getCfg(n.data('type')).border,
                        'width': n => n.data('isCluster') ? 120 : 85,
                        'height': n => n.data('isCluster') ? 120 : 85,
                        'text-wrap': 'wrap',
                        'text-max-width': '75px',
                        'overlay-padding': 6,
                        'overlay-opacity': 0,
                        'ghost': 'yes',
                        'ghost-offset-x': 2,
                        'ghost-offset-y': 2,
                        'ghost-opacity': 0.1
                    }
                },
                {
                    selector: 'node[isCluster = 1]',
                    style: {
                        label: n => `${n.data('label').toUpperCase()}\n(${n.data('count')})`,
                        'width': 130, 'height': 130,
                        'font-size': '11px',
                        'border-width': 4
                    }
                },
                {
                    selector: 'node[isHub = 1]',
                    style: {
                        'label': '⬡\nGRM HUB',
                        'width': 150, 'height': 150,
                        'background-color': '#3b82f6',
                        'border-color': '#1d4ed8',
                        'border-width': 4,
                        'font-size': '13px',
                        'color': '#fff'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 1.5,
                        'line-color': '#e2e8f0',
                        'target-arrow-color': '#cbd5e1',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'label': 'data(label)',
                        'font-size': '8px',
                        'color': '#94a3b8',
                        'text-background-opacity': 1,
                        'text-background-color': '#f8fafc',
                        'text-background-padding': '2px'
                    }
                },
                {
                    selector: 'node.highlighted',
                    style: { 'border-width': 5, 'border-color': '#3b82f6' }
                },
                {
                    selector: '.dimmed',
                    style: { 'opacity': 0.15 }
                }
            ],
            layout: {
                name: 'cose-bilkent',
                animate: true,
                fit: true,
                padding: 70,
                idealEdgeLength: 200,
                nodeRepulsion: 8000,
                edgeElasticity: 0.3,
                nestingFactor: 0.1,
                gravity: 0.15,
                numIter: 3000,
                tile: true
            }
        });

        cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            if (node.data('isCluster')) {
                setExpandedTypes(prev => {
                    const n = new Set(prev);
                    n.has(node.data('type')) ? n.delete(node.data('type')) : n.add(node.data('type'));
                    return n;
                });
            }
        });

        cy.on('mouseover', 'node', (evt) => {
            const node = evt.target;
            if (node.data('isCluster') || node.data('isHub')) return;
            setHoveredNode({
                id: node.id(),
                type: node.data('type'),
                data: node.data('rawData') || {},
                x: evt.originalEvent.clientX,
                y: evt.originalEvent.clientY
            });
        });

        cy.on('mouseout', 'node', () => setHoveredNode(null));

        cy.on('mouseover', 'edge', (evt) => {
            const edge = evt.target;
            setHoveredNode({
                id: edge.id(),
                type: 'Relationship',
                isEdge: true,
                data: {
                    source: edge.source().id(),
                    target: edge.target().id(),
                    relation: edge.data('label')
                },
                x: evt.originalEvent.clientX,
                y: evt.originalEvent.clientY
            });
        });

        cy.on('mouseout', 'edge', () => setHoveredNode(null));

        cyRef.current = cy;

        const resizeObserver = new ResizeObserver(() => {
            if (cyRef.current) {
                cyRef.current.resize();
            }
        });
        if (containerRef.current) resizeObserver.observe(containerRef.current);

        return () => { 
            if (cyRef.current) cyRef.current.destroy();
            resizeObserver.disconnect();
        };
    }, [elements, status]);

    // ── Search & Filter Logic ───────────────────────────────────────────────
    useEffect(() => {
        const cy = cyRef.current;
        if (!cy) return;
        if (!searchQuery.trim()) { cy.elements().removeClass('dimmed highlighted'); return; }
        const q = searchQuery.toLowerCase();
        cy.nodes().forEach(n => {
            const match = [n.data('label'), n.id(), n.data('type')].some(v => String(v || '').toLowerCase().includes(q));
            n.toggleClass('highlighted', match);
            n.toggleClass('dimmed', !match);
        });
        cy.edges().addClass('dimmed');
    }, [searchQuery]);

    useEffect(() => {
        const cy = cyRef.current;
        if (!cy) return;
        if (highlightType) {
            cy.nodes().forEach(n => {
                n.toggleClass('highlighted', n.data('type') === highlightType);
                n.toggleClass('dimmed', n.data('type') !== highlightType);
            });
            cy.edges().addClass('dimmed');
        } else {
            cy.elements().removeClass('dimmed highlighted');
        }
    }, [highlightType]);

    const fitGraph = useCallback(() => cyRef.current?.fit(undefined, 60), []);
    const zoomIn = useCallback(() => cyRef.current?.zoom(cyRef.current.zoom() * 1.3), []);
    const zoomOut = useCallback(() => cyRef.current?.zoom(cyRef.current.zoom() / 1.3), []);

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 220px)', minHeight: '500px', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>

            <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '15px', overflowX: 'auto', flexShrink: 0 }} className="kg-scroll">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'fit-content', paddingRight: '12px', borderRight: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#0f172a', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categories</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', minWidth: 'fit-content' }}>
                    {Object.entries(stats.types).sort(([, a], [, b]) => b - a).map(([type, count]) => (
                        <div
                            key={type}
                            onClick={() => setExpandedTypes(prev => { const n = new Set(prev); n.has(type) ? n.delete(type) : n.add(type); return n; })}
                            onMouseEnter={() => setHighlightType(type)}
                            onMouseLeave={() => setHighlightType(null)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
                                background: expandedTypes.has(type) ? '#eff6ff' : '#f8fafc',
                                transition: 'all 0.2s',
                                border: expandedTypes.has(type) ? '1px solid #dbeafe' : '1px solid transparent',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getCfg(type).color, boxShadow: `0 0 6px ${getCfg(type).color}33` }} />
                            <span style={{ color: expandedTypes.has(type) ? '#1d4ed8' : '#475569', fontSize: '11px', fontWeight: 600 }}>{type.replace(/_/g, ' ')}</span>
                            <span style={{ color: expandedTypes.has(type) ? '#3b82f6' : '#94a3b8', fontSize: '10px', fontWeight: 700, paddingLeft: '4px' }}>
                                {expandedTypes.has(type) ? '▼' : count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <main style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
                <div style={{ flex: 1, position: 'relative', background: '#f8fafc' }}>
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                    <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '8px', zIndex: 100 }}>
                        <button className="zoom-btn" onClick={zoomIn} title="Zoom In">+</button>
                        <button className="zoom-btn" onClick={zoomOut} title="Zoom Out">−</button>
                        <button className="zoom-btn" onClick={fitGraph} title="Fit View">⊞</button>
                    </div>
                    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />
                </div>

                {/* Floating Hover Card */}
                {hoveredNode && (
                    <div 
                        style={{ 
                            position: 'fixed', 
                            left: `${hoveredNode.x + 20}px`, 
                            top: hoveredNode.y > window.innerHeight - 320 ? 'auto' : `${hoveredNode.y + 10}px`,
                            bottom: hoveredNode.y > window.innerHeight - 320 ? `${window.innerHeight - hoveredNode.y + 10}px` : 'auto',
                            zIndex: 1000,
                            width: '280px',
                            background: 'rgba(255, 255, 255, 0.98)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid #e2e8f0',
                            borderRadius: '16px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                            padding: '16px',
                            pointerEvents: 'none',
                            animation: 'fadeIn 0.15s ease-out'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: hoveredNode.isEdge ? '#94a3b8' : getCfg(hoveredNode.type).color }} />
                            <span style={{ color: hoveredNode.isEdge ? '#64748b' : getCfg(hoveredNode.type).color, fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {hoveredNode.type}
                            </span>
                        </div>
                        <h4 style={{ color: '#0f172a', fontSize: '14px', fontWeight: 800, margin: '0 0 12px 0' }}>
                            {hoveredNode.isEdge ? 'Relation Details' : (hoveredNode.data.name || hoveredNode.id)}
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {Object.entries(hoveredNode.data).slice(0, 6).map(([k, v]) => (
                                <div key={k} style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                                    <label style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', display: 'block' }}>{k.replace(/_/g, ' ')}</label>
                                    <div style={{ color: '#1e293b', fontSize: '12px', fontWeight: 600, marginTop: '2px', wordBreak: 'break-all' }}>{String(v ?? '—')}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {status === 'loading' && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '4px solid #eff6ff', borderTopColor: '#3b82f6', animation: 'spin 1s linear infinite' }} />
                        <p style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 700, marginTop: '20px' }}>Mapping Knowledge Graph...</p>
                    </div>
                )}
            </main>

            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .kg-scroll::-webkit-scrollbar { height: 2px; width: 2px; }
                .kg-scroll::-webkit-scrollbar-track { background: transparent; }
                .kg-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .kg-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
                .zoom-btn { width:32px; height:32px; border-radius:7px; border:1px solid #e2e8f0; background:#fff; font-size:16px; font-weight:700; color:#475569; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 4px rgba(0,0,0,0.08); transition:all 0.12s; }
                .zoom-btn:hover { background:#f1f5f9; color:#1e293b; }
            `}</style>
        </div>
    );
};

export default KnowledgeGraphExplorer;

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

import combinedChapters from './data/combined_chapters_all_books_1_86_merged_final.json'
import aliasData from './data/data.json'
import groupedCharactersData from './data/middlemarch_characters_grouped.json'

// Colors inspired by George Eliot Archive
const GROUP_COLORS = {
  'Central Characters': '#e6194B',         // strong red
  'Brooke / Chettam Circle': '#3cb44b',    // bright green
  'Vincy Family': '#4363d8',               // deep blue
  'Garth Family': '#f58231',               // vivid orange
  'Featherstone / Waule Family': '#911eb4',// purple
  'Bulstrodes': '#ffe119',                 // bright yellow
  'Clergy & Families': '#42d4f4',          // cyan
  'Cadwalladers': '#f032e6',               // magenta
  'Middlemarch Townspeople & Officials': '#a9a9a9' // neutral grey
}

const BOOKS = [
  { id: 1, title: 'Miss Brooke', chapters: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { id: 2, title: 'Old and Young', chapters: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22] },
  { id: 3, title: 'Waiting for Death', chapters: [23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33] },
  { id: 4, title: 'Three Love Problems', chapters: [34, 35, 36, 37, 38, 39, 40, 41, 42] },
  { id: 5, title: 'The Dead Hand', chapters: [43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53] },
  { id: 6, title: 'The Widow and the Wife', chapters: [54, 55, 56, 57, 58, 59, 60, 61, 62] },
  { id: 7, title: 'Two Temptations', chapters: [63, 64, 65, 66, 67, 68, 69, 70, 71] },
  { id: 8, title: 'Sunset and Sunrise', chapters: [72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86] },
]

// Create a map of chapter to book
const CHAPTER_TO_BOOK = {}
BOOKS.forEach(book => {
  book.chapters.forEach(ch => {
    CHAPTER_TO_BOOK[ch] = book
  })
})

const TOTAL_CHAPTERS = 86

// ---------- helpers to mimic Flask logic (aliases + graph) ----------

// build alias_index like in app.py (from data.json -> aliases_full)
const aliasIndex = (() => {
  const idx = {}
  const entries = aliasData.aliases_full || []
  for (const entry of entries) {
    const canon = (entry.canonical_name || '').trim()
    if (!canon) continue
    for (const a of entry.aliases || []) {
      idx[a.trim().toLowerCase()] = canon
    }
    // include canonical itself
    idx[canon.toLowerCase()] = canon
  }
  return idx
})()

function cleanName(s) {
  if (!s) return ''
  return s.trim().replace(/\s+/g, ' ')
}

function canonicalize(name) {
  if (!name) return ''
  const key = name.trim().toLowerCase()
  return aliasIndex[key] || cleanName(name)
}

function chapterKey(chNumber) {
  return `Chapter ${chNumber}`
}

// NEW: display name changes based on chapter (marriage name changes, etc.)
function getDisplayName(name, chapter) {
  if (!name) return name

  if (name === 'Mary Garth' && chapter === 86) {
    return 'Mary Vincy'
  }

  if (name === 'Celia Brooke' && chapter >= 34) {
    return 'Celia Chettam'
  }

  if (name === 'Dorothea Brooke' && chapter >= 19) {
    return 'Dorothea Casaubon'
  }

  if (name === 'Rosamond Vincy' && chapter >= 42) {
    return 'Rosamond Lydgate'
  }

  return name
}

// Build a graph for a single chapter using the same idea as Flask build_graph()
function buildGraphForChapter(chNumber, minConn) {
  const key = chapterKey(chNumber)
  const chapterObj = combinedChapters[key] || {}
  const interactions = chapterObj.interactions || []

  const names = new Set()
  const edgeCounter = new Map() // "u|||v" -> weight

  for (const it of interactions) {
    const a = canonicalize(it.character_1 || '')
    const b = canonicalize(it.character_2 || '')
    if (!a || !b || a === b) continue

    const [u, v] = [a, b].sort()
    const edgeKey = `${u}|||${v}`
    edgeCounter.set(edgeKey, (edgeCounter.get(edgeKey) || 0) + 1)
    names.add(u)
    names.add(v)
  }

  const edges = []
  const threshold = Math.max(1, parseInt(minConn, 10) || 1)

  for (const [keyPair, w] of edgeCounter.entries()) {
    if (w >= threshold) {
      const [u, v] = keyPair.split('|||')
      edges.push({ source: u, target: v, weight: w })
    }
  }

  const nodes = Array.from(names).map(n => ({ id: n }))

  return { nodes, links: edges }
}

// ----------------- React component -----------------

export default function CharacterNetwork(){
  const [currentChapter, setCurrentChapter] = useState(1)

  // init with local groupedCharactersData instead of fetch
  const [characterGroups] = useState(groupedCharactersData)
  
  const [minConn, setMinConn] = useState(1)
  const [layout, setLayout] = useState(220)
  const [stats, setStats] = useState({nodes:0, links:0, max:0})
  const [graph, setGraph] = useState({nodes:[], links:[]})
  const svgRef = useRef(null)
  const simRef = useRef(null)

  // Get current book info
  const currentBook = CHAPTER_TO_BOOK[currentChapter]

  // Helper function to find which group a character belongs to
  const getCharacterGroup = (characterName) => {
    for (const [groupName, members] of Object.entries(characterGroups || {})) {
      if (members.includes(characterName)) {
        return groupName
      }
    }
    return 'Middlemarch Townspeople & Officials' // default
  }

  // Build graph data when chapter or minConn changes
  useEffect(()=>{
    const data = buildGraphForChapter(currentChapter, minConn)
    const graphData = data || { nodes: [], links: [] }

    // Calculate node degrees
    const degreeMap = {}
    graphData.nodes.forEach(n => { degreeMap[n.id] = 0 })
    graphData.links.forEach(l => {
      degreeMap[l.source] = (degreeMap[l.source] || 0) + 1
      degreeMap[l.target] = (degreeMap[l.target] || 0) + 1
    })
    
    // Add degree and group info to nodes
    graphData.nodes.forEach(n => {
      n.connections = degreeMap[n.id] || 0
      n.group = getCharacterGroup(n.id)
    })
    
    setGraph(graphData)
    
    const totalCharacters = graphData.nodes.length
    const totalConnections = graphData.links.length
    const maxConnections = totalCharacters ? Math.max(0, ...graphData.nodes.map(n => n.connections || 0)) : 0
    setStats({nodes: totalCharacters, links: totalConnections, max: maxConnections})
  }, [currentChapter, minConn, characterGroups])

  useEffect(()=>{
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const width = svgRef.current?.clientWidth || 900
    
    // Detect separate components first to determine height
    const visited = new Set()
    const adjacency = new Map()
    const tempComponents = []
    
    // Build adjacency list
    graph.nodes.forEach(n => adjacency.set(n.id, []))
    graph.links.forEach(l => {
      const source = typeof l.source === 'object' ? l.source.id : l.source
      const target = typeof l.target === 'object' ? l.target.id : l.target
      adjacency.get(source).push(target)
      adjacency.get(target).push(source)
    })
    
    // Find connected components
    graph.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const component = []
        const queue = [node.id]
        visited.add(node.id)
        
        while (queue.length > 0) {
          const current = queue.shift()
          component.push(current)
          
          adjacency.get(current).forEach(neighbor => {
            if (!visited.has(neighbor)) {
              visited.add(neighbor)
              queue.push(neighbor)
            }
          })
        }
        
        tempComponents.push(component)
      }
    })
    
    // Calculate dynamic height based on number of components
    const componentHeight = 300
    const height = Math.max(600, tempComponents.length * componentHeight + 150)
    svg.attr('viewBox', [0,0,width,height])

    const g = svg.append('g')
    
    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
    
    svg.call(zoom)
    const tooltip = d3.select('body').append('div')
      .style('position','absolute').style('pointer-events','none')
      .style('background','#fdf7ee').style('color','#3a2a22')
      .style('border','1px solid #d4c7b4')
      .style('padding','8px 10px').style('border-radius','6px')
      .style('font','12px Georgia, "Times New Roman", serif')
      .style('opacity',0)
      .style('z-index', '9999')

    // Use the components we already calculated
    const components = tempComponents
    
    // Sort components by size (largest first)
    components.sort((a, b) => b.length - a.length)
    
    const nodeMap = new Map()
    graph.nodes.forEach(n => nodeMap.set(n.id, n))

    components.forEach((comp, idx) => {
      const baseY = (height / (components.length + 1)) * (idx + 1)

      comp.forEach(nodeId => {
        const node = nodeMap.get(nodeId)
        if (node) {
          node.componentIndex = idx

          // vertical jitter so they don't all sit on one line
          if (node.jitterY == null) {
            node.jitterY = (Math.random() - 0.5) * 80   // ±40px
          }

          node.targetY = baseY + node.jitterY
        }
      })
    })

    const simulation = d3.forceSimulation(graph.nodes)
      .force(
        'link',
        d3.forceLink(graph.links)
          .id(d => d.id)
          .strength(0.15)
          .distance(d => 120 + (d.weight || 1) * 15)
      )
      .force('charge', d3.forceManyBody().strength(-Number(layout) * 3.5))
      .force('collision', d3.forceCollide().radius(d => 35 + 5 * Math.sqrt(d.connections || 0)))
      .force(
        'y',
        d3.forceY(d => d.targetY ?? (height / 2)).strength(0.12)
      )
      .force('x', d3.forceX(width / 2).strength(0.05))
      .alphaDecay(0.01)
      .velocityDecay(0.4)
    
    simRef.current = simulation
    
    // Stop simulation after nodes settle
    setTimeout(() => {
      simulation.stop()
    }, 15000)

    const link = g.append('g').selectAll('line')
      .data(graph.links).enter().append('line')
      .attr('stroke','#b89b7a')
      .attr('stroke-opacity',0.55)
      .attr('stroke-width', d=>0.8 + 1.2*Math.sqrt((d.weight ?? 1)))

    const getColor = (node) => {
      return GROUP_COLORS[node.group] || '#8a7b6a'
    }

    const node = g.append('g').selectAll('circle')
      .data(graph.nodes).enter().append('circle')
      .attr('r', d=>5 + 2.5*Math.sqrt(d.connections||1))
      .attr('fill', d=>getColor(d))
      .attr('stroke','#5c4638')
      .attr('stroke-width',1.6)
      .style('cursor','pointer')
      .call(d3.drag()
        .on('start', (event,d)=>{ 
          if(!event.active) simulation.alphaTarget(0.3).restart()
          d.fx=d.x
          d.fy=d.y
        })
        .on('drag', (event,d)=>{ 
          d.fx = event.x
          d.fy = event.y
        })
        .on('end',  (event,d)=>{ 
          if(!event.active) simulation.alphaTarget(0)
          d.fx = event.x
          d.fy = event.y
        }))
      .on('mouseover', (event,d)=>{
        tooltip.transition().duration(120).style('opacity',0.97)
        tooltip.html(
          `<strong>${getDisplayName(d.id, currentChapter)}</strong><br/>Group: ${d.group}<br/>Connections: ${d.connections||0}`
        )
          .style('left', (event.pageX+10)+'px').style('top', (event.pageY-28)+'px')
      })
      .on('mouseout', ()=> tooltip.transition().duration(200).style('opacity',0))

    const label = g.append('g').selectAll('text')
      .data(graph.nodes.filter(n=>n.group === 'Central Characters' || n.connections >= 15))
      .enter().append('text')
      .text(d=> {
        const display = getDisplayName(d.id, currentChapter)

        // Show full name for central characters
        if (d.group === 'Central Characters') {
          return display
        }

        // Last name only for others
        return display.includes(' ')
          ? display.split(' ').slice(-1)[0]
          : display
      })
      .attr('text-anchor','middle')
      .attr('dy', -15)
      .style('fill','#3b2b26')
      .style('font','bold 12px Georgia, "Times New Roman", serif')
      .style('pointer-events','none')

    simulation.on('tick', ()=>{
      link.attr('x1', d=>d.source.x).attr('y1', d=>d.source.y)
          .attr('x2', d=>d.target.x).attr('y2', d=>d.target.y)
      node.attr('cx', d=>d.x).attr('cy', d=>d.y)
      label.attr('x', d=>d.x).attr('y', d=>d.y - 15)
    })

    return ()=>{ simulation.stop(); tooltip.remove() }
  }, [graph, layout, currentChapter])

  const groupDistribution = graph.nodes.reduce((acc, n) => {
    acc[n.group] = (acc[n.group] || 0) + 1
    return acc
  }, {})

  return (
    <div
      style={{
        fontFamily:'Georgia, "Times New Roman", serif',
        color:'#3b2b26',
        background:'#ffffff',
        minHeight:'100vh'
      }}
    >
      <div style={{maxWidth:1100, margin:'0 auto', padding:'24px 16px 32px'}}>
        <div
          style={{
            background:'#f5f0e6',
            borderRadius:8,
            padding:20,
            textAlign:'center',
            border:'1px solid #d4c7b4'
          }}
        >
          <h1 style={{margin:0, fontSize:28, color:'#b22a2f', letterSpacing:0.5}}>
            Middlemarch — Character Network
          </h1>
          <p style={{margin:6, opacity:.95}}>
            Characters colored by family and social groups; edges show interaction counts.
          </p>
        </div>

        {/* Chronological Slider Section */}
        <div
          style={{
            background:'#f5f0e6',
            borderRadius:8,
            padding:20,
            marginTop:16,
            border:'1px solid #d4c7b4'
          }}
        >
          <div style={{textAlign:'center', marginBottom:16}}>
            <div style={{fontSize:18, fontWeight:600, marginBottom:4}}>
              Book {currentBook.id}: {currentBook.title}
            </div>
            <div style={{fontSize:24, fontWeight:700, color:'#b22a2f'}}>
              Chapter {currentChapter}
            </div>
          </div>

          <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:16}}>
            <button
              onClick={() => setCurrentChapter(1)}
              style={{
                padding:'8px 14px',
                borderRadius:4,
                border:'1px solid #b22a2f',
                background:'#b22a2f',
                color:'#fff',
                fontSize:13,
                cursor:'pointer',
                fontWeight:500
              }}
            >
              Reset
            </button>
            <div style={{flex:1, display:'flex', alignItems:'center', gap:8}}>
              <span style={{fontSize:12, minWidth:30}}>Ch 1</span>
              <input
                type="range"
                min={1}
                max={TOTAL_CHAPTERS}
                value={currentChapter}
                onChange={(e) => setCurrentChapter(Number(e.target.value))}
                style={{
                  flex:1,
                  cursor:'pointer',
                  height:6,
                  borderRadius:3,
                  appearance:'none',
                  background:`linear-gradient(to right, #b22a2f ${(currentChapter/TOTAL_CHAPTERS)*100}%, #e0d4c2 ${(currentChapter/TOTAL_CHAPTERS)*100}%)`
                }}
              />
              <span style={{fontSize:12, minWidth:30, textAlign:'right'}}>Ch 86</span>
            </div>
          </div>

          {/* Book markers */}
          <div style={{position:'relative', height:20, marginTop:8}}>
            {BOOKS.map(book => {
              const startCh = book.chapters[0]
              const endCh = book.chapters[book.chapters.length - 1]
              const leftPercent = ((startCh - 1) / TOTAL_CHAPTERS) * 100
              const widthPercent = ((endCh - startCh + 1) / TOTAL_CHAPTERS) * 100
              const isCurrentBook = currentBook.id === book.id
              
              return (
                <div
                  key={book.id}
                  style={{
                    position:'absolute',
                    left:`${leftPercent}%`,
                    width:`${widthPercent}%`,
                    height:18,
                    background: isCurrentBook ? '#b22a2f11' : '#e0d4c2',
                    borderRadius:3,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    fontSize:10,
                    fontWeight: isCurrentBook ? 600 : 400,
                    color: isCurrentBook ? '#b22a2f' : '#4a3a30',
                    border: isCurrentBook ? '1px solid #b22a2f' : '1px solid #d4c7b4'
                  }}
                >
                  Book {book.id}
                </div>
              )
            })}
          </div>
        </div>

        <div
          style={{
            display:'flex',
            flexWrap:'wrap',
            gap:12,
            marginTop:12,
            background:'#f5f0e6',
            padding:16,
            borderRadius:8,
            border:'1px solid #d4c7b4'
          }}
        >
          <div style={{display:'flex', flexDirection:'column', minWidth:180}}>
            <label style={{marginBottom:6, fontSize:13}}>
              Min Connections: <span style={{fontWeight:600}}>{minConn}</span>
            </label>
            <input 
              type="range" 
              min={1} 
              max={10} 
              value={minConn} 
              onChange={e=>setMinConn(Number(e.target.value))}
              style={{cursor:'pointer'}}
            />
          </div>

          <div style={{display:'flex', flexDirection:'column', minWidth:180}}>
            <label style={{marginBottom:6, fontSize:13}}>
              Layout Force: <span style={{fontWeight:600}}>{layout}</span>
            </label>
            <input 
              type="range" 
              min={50} 
              max={500} 
              value={layout} 
              onChange={e=>setLayout(Number(e.target.value))}
              style={{cursor:'pointer'}}
            />
          </div>
        </div>

        <div
          style={{
            background:'#f9f5ef',
            borderRadius:8,
            padding:12,
            marginTop:12,
            border:'1px solid #d4c7b4'
          }}
        >
          <div style={{marginBottom:8, fontSize:12, opacity:0.9, fontStyle:'italic'}}>
            💡 Use mouse wheel to zoom, drag to pan • Drag nodes to reposition them
          </div>
          <svg
            ref={svgRef}
            style={{
              width:'100%',
              minHeight:600,
              maxHeight:1200,
              height:'auto',
              display:'block',
              background:'#f9f5ef',
              borderRadius:6
            }}
          />
        </div>

        <div
          style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',
            gap:12,
            marginTop:12
          }}
        >
          <CardStat label="Characters shown" value={stats.nodes} />
          <CardStat label="Connections" value={stats.links} />
          <CardStat label="Max degree" value={stats.max} />
        </div>

        <div
          style={{
            background:'#f5f0e6',
            borderRadius:8,
            padding:16,
            marginTop:12,
            border:'1px solid #d4c7b4'
          }}
        >
          <h3 style={{margin:'0 0 12px 0', fontSize:16, color:'#b22a2f'}}>
            Character Groups
          </h3>
          <div
            style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',
              gap:12
            }}
          >
            {Object.entries(GROUP_COLORS).map(([groupName, color]) => (
              <LegendItem 
                key={groupName}
                color={color} 
                label={groupName} 
                count={groupDistribution[groupName] || 0} 
              />
            ))}
          </div>
          <div
            style={{
              fontSize:12,
              opacity:0.85,
              fontStyle:'italic',
              marginTop:12
            }}
          >
            Central characters and highly connected characters (15+ connections) show labels.
          </div>
        </div>
      </div>
    </div>
  )
}

function CardStat({label, value}){
  return (
    <div
      style={{
        background:'#f5f0e6',
        borderRadius:8,
        padding:12,
        textAlign:'center',
        border:'1px solid #d4c7b4'
      }}
    >
      <div style={{fontSize:24, fontWeight:700, color:'#b22a2f'}}>{value}</div>
      <div style={{opacity:.9, fontSize:13}}>{label}</div>
    </div>
  )
}

function LegendItem({color, label, count}){
  return (
    <div style={{display:'flex', alignItems:'center', gap:8, fontSize:13}}>
      <div
        style={{
          width:14,
          height:14,
          borderRadius:'50%',
          background:color,
          border:'1px solid #5c4638'
        }}
      />
      <span style={{opacity:.95}}>{label} ({count})</span>
    </div>
  )
}

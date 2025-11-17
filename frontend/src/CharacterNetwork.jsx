import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

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

const GROUP_COLORS = {
  'Central Characters': '#ff4757',
  'Brooke / Chettam Circle': '#ffa502',
  'Vincy Family': '#1e90ff',
  'Garth Family': '#2ed573',
  'Featherstone / Waule Family': '#a55eea',
  'Bulstrodes': '#fd79a8',
  'Clergy & Families': '#00b894',
  'Cadwalladers': '#fdcb6e',
  'Middlemarch Townspeople & Officials': '#b8b8b8'
}

// Create a map of chapter to book
const CHAPTER_TO_BOOK = {}
BOOKS.forEach(book => {
  book.chapters.forEach(ch => {
    CHAPTER_TO_BOOK[ch] = book
  })
})

const TOTAL_CHAPTERS = 86

export default function CharacterNetwork(){
  const [currentChapter, setCurrentChapter] = useState(1)
  const [characterGroups, setCharacterGroups] = useState({})
  
  const [minConn, setMinConn] = useState(1)
  const [layout, setLayout] = useState(220)
  const [stats, setStats] = useState({nodes:0, links:0, avg:0, max:0})
  const [graph, setGraph] = useState({nodes:[], links:[]})
  const svgRef = useRef(null)
  const simRef = useRef(null)

  // Get current book info
  const currentBook = CHAPTER_TO_BOOK[currentChapter]

  // Fetch character groups on mount
  useEffect(() => {
    fetch(`${API_BASE}/characters/grouped`)
      .then(r => r.json())
      .then(data => {
        setCharacterGroups(data)
      })
      .catch(e => console.error('Failed to fetch character groups:', e))
  }, [])

  // Helper function to find which group a character belongs to
  const getCharacterGroup = (characterName) => {
    for (const [groupName, members] of Object.entries(characterGroups)) {
      if (members.includes(characterName)) {
        return groupName
      }
    }
    return 'Middlemarch Townspeople & Officials' // default
  }

  // Fetch graph data when chapter changes
  useEffect(()=>{
    const params = new URLSearchParams()
    params.set('start', String(currentChapter))
    params.set('end', String(currentChapter))
    params.set('minConn', String(minConn))

    fetch(`${API_BASE}/graph?${params.toString()}`)
      .then(r=>r.json())
      .then(res=>{
        const data = res?.graph || {nodes:[], links:[]}
        
        // Calculate node degrees
        const degreeMap = {}
        data.nodes.forEach(n => degreeMap[n.id] = 0)
        data.links.forEach(l => {
          degreeMap[l.source] = (degreeMap[l.source] || 0) + 1
          degreeMap[l.target] = (degreeMap[l.target] || 0) + 1
        })
        
        // Add degree and group info to nodes
        data.nodes.forEach(n => {
          n.connections = degreeMap[n.id] || 0
          n.group = getCharacterGroup(n.id)
        })
        
        setGraph(data)
        
        const totalCharacters = data.nodes.length
        const totalConnections = data.links.length
        const avgConnections = totalCharacters ? (totalConnections * 2 / totalCharacters).toFixed(1) : 0
        const maxConnections = totalCharacters ? Math.max(0, ...data.nodes.map(n => n.connections || 0)) : 0
        setStats({nodes: totalCharacters, links: totalConnections, avg: avgConnections, max: maxConnections})
      })
      .catch(e=>{
        console.error('Failed to fetch graph:', e)
      })
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
      .style('background','rgba(0,0,0,0.9)').style('color','#fff')
      .style('padding','8px 10px').style('border-radius','10px')
      .style('font','12px system-ui').style('opacity',0)
      .style('z-index', '9999')

    // Use the components we already calculated
    const components = tempComponents
    
    // Sort components by size (largest first)
    components.sort((a, b) => b.length - a.length)
    
    // Assign target positions for each component
    const componentSpacing = 300
    const nodeMap = new Map()
    graph.nodes.forEach(n => nodeMap.set(n.id, n))
    
    components.forEach((comp, idx) => {
      const yOffset = idx * componentSpacing
      comp.forEach(nodeId => {
        const node = nodeMap.get(nodeId)
        if (node) {
          node.componentIndex = idx
          node.yOffset = yOffset
        }
      })
    })

    const simulation = d3.forceSimulation(graph.nodes)
      .force('link', d3.forceLink(graph.links).id(d=>d.id).strength(0.15).distance(d => 120 + (d.weight || 1) * 15))
      .force('charge', d3.forceManyBody().strength(-Number(layout) * 3.5))
      .force('collision', d3.forceCollide().radius(d=>35 + 5*Math.sqrt(d.connections || 0)))
      .force('y', d3.forceY(d => (height / (components.length + 1)) * (d.componentIndex + 1) + d.yOffset).strength(0.3))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .alphaDecay(0.01)
      .velocityDecay(0.4)
    
    simRef.current = simulation
    
    // Stop simulation after nodes settle, but don't auto-fix positions
    setTimeout(() => {
      simulation.stop()
    }, 15000)

    const link = g.append('g').selectAll('line')
      .data(graph.links).enter().append('line')
      .attr('stroke','#fff').attr('stroke-opacity',0.4)
      .attr('stroke-width', d=>0.8 + 1.2*Math.sqrt((d.weight ?? 1)))

    const getColor = (node) => {
      return GROUP_COLORS[node.group] || '#b8b8b8'
    }

    const node = g.append('g').selectAll('circle')
      .data(graph.nodes).enter().append('circle')
      .attr('r', d=>5 + 2.5*Math.sqrt(d.connections||1))
      .attr('fill', d=>getColor(d))
      .attr('stroke','#fff').attr('stroke-width',2)
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
          // Keep node fixed where user dragged it
          d.fx = event.x
          d.fy = event.y
        }))
      .on('mouseover', (event,d)=>{
        tooltip.transition().duration(120).style('opacity',0.95)
        tooltip.html(`<strong>${d.id}</strong><br/>Group: ${d.group}<br/>Connections: ${d.connections||0}`)
          .style('left', (event.pageX+10)+'px').style('top', (event.pageY-28)+'px')
      })
      .on('mouseout', ()=> tooltip.transition().duration(200).style('opacity',0))

    const label = g.append('g').selectAll('text')
      .data(graph.nodes.filter(n=>n.group === 'Central Characters' || n.connections >= 15))
      .enter().append('text')
      .text(d=> {
        // Show full name for central characters, last name only for others
        if (d.group === 'Central Characters') {
          return d.id
        }
        return d.id.includes(' ') ? d.id.split(' ').slice(-1)[0] : d.id
      })
      .attr('text-anchor','middle')
      .attr('dy', -15)
      .style('fill','#fff').style('font','bold 12px system-ui').style('pointer-events','none')
      .style('text-shadow','1px 1px 4px rgba(0,0,0,.95), -1px -1px 4px rgba(0,0,0,.95), 1px -1px 4px rgba(0,0,0,.95), -1px 1px 4px rgba(0,0,0,.95)')

    simulation.on('tick', ()=>{
      link.attr('x1', d=>d.source.x).attr('y1', d=>d.source.y)
          .attr('x2', d=>d.target.x).attr('y2', d=>d.target.y)
      node.attr('cx', d=>d.x).attr('cy', d=>d.y)
      label.attr('x', d=>d.x).attr('y', d=>d.y - 15)
    })

    return ()=>{ simulation.stop(); tooltip.remove() }
  }, [graph, layout])

  const groupDistribution = graph.nodes.reduce((acc, n) => {
    acc[n.group] = (acc[n.group] || 0) + 1
    return acc
  }, {})

  return (
    <div style={{fontFamily:'system-ui, -apple-system, Segoe UI, Roboto', color:'#fff', background:'linear-gradient(135deg,#667eea,#764ba2)', minHeight:'100vh'}}>
      <div style={{maxWidth:1100, margin:'0 auto', padding:'20px'}}>
        <div style={{background:'rgba(255,255,255,.1)', borderRadius:16, padding:20, textAlign:'center'}}>
          <h1 style={{margin:0, fontSize:28}}>Middlemarch — Character Network</h1>
          <p style={{margin:6, opacity:.95}}>Characters colored by family/social groups; edges show interaction counts.</p>
        </div>

        {/* Chronological Slider Section */}
        <div style={{background:'rgba(255,255,255,.1)', borderRadius:14, padding:20, marginTop:16}}>
          <div style={{textAlign:'center', marginBottom:16}}>
            <div style={{fontSize:20, fontWeight:600, marginBottom:4}}>
              Book {currentBook.id}: {currentBook.title}
            </div>
            <div style={{fontSize:28, fontWeight:700}}>
              Chapter {currentChapter}
            </div>
          </div>

          <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:16}}>
            <button
              onClick={() => setCurrentChapter(1)}
              style={{
                padding:'10px 16px',
                borderRadius:8,
                border:'none',
                background:'rgba(255,255,255,.2)',
                color:'#fff',
                fontSize:14,
                cursor:'pointer',
                fontWeight:500
              }}
            >
              Reset
            </button>
            <div style={{flex:1, display:'flex', alignItems:'center', gap:8}}>
              <span style={{fontSize:13, minWidth:30}}>Ch 1</span>
              <input
                type="range"
                min={1}
                max={TOTAL_CHAPTERS}
                value={currentChapter}
                onChange={(e) => setCurrentChapter(Number(e.target.value))}
                style={{
                  flex:1,
                  cursor:'pointer',
                  height:8,
                  borderRadius:4,
                  appearance:'none',
                  background:`linear-gradient(to right, rgba(255,255,255,.4) 0%, rgba(255,255,255,.4) ${(currentChapter/TOTAL_CHAPTERS)*100}%, rgba(255,255,255,.15) ${(currentChapter/TOTAL_CHAPTERS)*100}%, rgba(255,255,255,.15) 100%)`
                }}
              />
              <span style={{fontSize:13, minWidth:30, textAlign:'right'}}>Ch 86</span>
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
                    height:20,
                    background: isCurrentBook ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.1)',
                    borderRadius:4,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    fontSize:11,
                    fontWeight: isCurrentBook ? 600 : 400,
                    opacity: isCurrentBook ? 1 : 0.7,
                    border: isCurrentBook ? '2px solid rgba(255,255,255,.5)' : 'none'
                  }}
                >
                  Book {book.id}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{display:'flex', flexWrap:'wrap', gap:12, marginTop:12, background:'rgba(255,255,255,.1)', padding:16, borderRadius:14}}>
          <div style={{display:'flex', flexDirection:'column', minWidth:180}}>
            <label style={{marginBottom:6, fontSize:14}}>Min Connections: {minConn}</label>
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
            <label style={{marginBottom:6, fontSize:14}}>Layout Force: {layout}</label>
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

        <div style={{background:'rgba(255,255,255,.08)', borderRadius:16, padding:12, marginTop:12}}>
          <div style={{marginBottom:8, fontSize:13, opacity:0.9, fontStyle:'italic'}}>
            💡 Use mouse wheel to zoom, drag to pan • Drag nodes to reposition them
          </div>
          <svg ref={svgRef} style={{width:'100%', minHeight:600, maxHeight:1200, height:'auto', display:'block', background:'rgba(0,0,0,.15)', borderRadius:12}} />
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12, marginTop:12}}>
          <CardStat label="Characters shown" value={stats.nodes} />
          <CardStat label="Connections" value={stats.links} />
          <CardStat label="Avg degree" value={stats.avg} />
          <CardStat label="Max degree" value={stats.max} />
        </div>

        <div style={{background:'rgba(255,255,255,.1)', borderRadius:12, padding:16, marginTop:12}}>
          <h3 style={{margin:'0 0 12px 0', fontSize:16}}>Character Groups</h3>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12}}>
            {Object.entries(GROUP_COLORS).map(([groupName, color]) => (
              <LegendItem 
                key={groupName}
                color={color} 
                label={groupName} 
                count={groupDistribution[groupName] || 0} 
              />
            ))}
          </div>
          <div style={{fontSize:13, opacity:0.85, fontStyle:'italic', marginTop:12}}>
            Central characters and highly connected characters (15+ connections) show labels.
          </div>
        </div>
      </div>
    </div>
  )
}

function CardStat({label, value}){
  return (
    <div style={{background:'rgba(255,255,255,.1)', borderRadius:12, padding:12, textAlign:'center'}}>
      <div style={{fontSize:28, fontWeight:700}}>{value}</div>
      <div style={{opacity:.9}}>{label}</div>
    </div>
  )
}

function LegendItem({color, label, count}){
  return (
    <div style={{display:'flex', alignItems:'center', gap:8}}>
      <div style={{width:16, height:16, borderRadius:'50%', background:color, border:'2px solid #fff'}} />
      <span style={{fontSize:13, opacity:.95}}>{label} ({count})</span>
    </div>
  )
}
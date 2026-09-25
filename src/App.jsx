import React, { useMemo, useState } from 'react'

const modules = [
  ['today','Today'],['projects','Projects'],['activities','Activities'],['reports','Daily Reports'],
  ['materials','Materials'],['quality','Quality'],['drawings','Drawings'],['rfis','RFIs & Issues'],
  ['schedule','P6 Schedule'],['photos','Photos'],['team','Team']
]

const demo = {
  project: { code:'SITE-001', name:'Sample Construction Project', location:'Project Location', progress:42 },
  activities:[
    {code:'ACT-001',name:'Foundation Works',progress:60,status:'In Progress'},
    {code:'ACT-002',name:'Structural Works',progress:35,status:'In Progress'},
    {code:'ACT-003',name:'Utility Works',progress:10,status:'Planned'}
  ],
  materials:[
    {code:'MAT-001',name:'Reinforcing Steel',stock:24,unit:'t'},
    {code:'MAT-002',name:'Concrete Additive',stock:8,unit:'t'}
  ]
}

export default function App(){
  const [page,setPage]=useState('today')
  const [query,setQuery]=useState('')
  const visibleActivities=useMemo(()=>demo.activities.filter(x=>`${x.code} ${x.name}`.toLowerCase().includes(query.toLowerCase())),[query])
  return <div className="shell">
    <aside>
      <div className="brand">SiteOS</div>
      <nav>{modules.map(([id,label])=><button key={id} className={page===id?'active':''} onClick={()=>setPage(id)}>{label}</button>)}</nav>
      <small>Open-source construction operations</small>
    </aside>
    <main>
      <header><div><h1>{modules.find(x=>x[0]===page)?.[1]}</h1><p>{demo.project.code} · {demo.project.name}</p></div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search project data" /></header>
      {page==='today' && <Dashboard />}
      {page==='activities' && <Activities rows={visibleActivities} />}
      {page==='materials' && <Materials />}
      {!['today','activities','materials'].includes(page) && <Empty title={modules.find(x=>x[0]===page)?.[1]} />}
    </main>
  </div>
}

function Dashboard(){return <div className="grid">
  <Card title="Project Progress" value="42%" />
  <Card title="Active Activities" value="3" />
  <Card title="Open Issues" value="0" />
  <Card title="Quality Records" value="0" />
  <section className="panel wide"><h2>Activity Progress</h2>{demo.activities.map(x=><div className="row" key={x.code}><span>{x.code} · {x.name}</span><b>{x.progress}%</b></div>)}</section>
  <section className="panel wide"><h2>Project Data Policy</h2><p>This repository contains synthetic demonstration data only. Real client, company, project, personnel and site data must never be committed.</p></section>
</div>}
function Activities({rows}){return <section className="panel"><h2>Activities</h2><table><thead><tr><th>ID</th><th>Name</th><th>Progress</th><th>Status</th></tr></thead><tbody>{rows.map(x=><tr key={x.code}><td>{x.code}</td><td>{x.name}</td><td>{x.progress}%</td><td>{x.status}</td></tr>)}</tbody></table></section>}
function Materials(){return <section className="panel"><h2>Materials</h2><table><thead><tr><th>Code</th><th>Name</th><th>Stock</th></tr></thead><tbody>{demo.materials.map(x=><tr key={x.code}><td>{x.code}</td><td>{x.name}</td><td>{x.stock} {x.unit}</td></tr>)}</tbody></table></section>}
function Card({title,value}){return <section className="card"><small>{title}</small><strong>{value}</strong></section>}
function Empty({title}){return <section className="panel"><h2>{title}</h2><p>This module is part of the SiteOS roadmap and will be implemented through public issues and pull requests.</p></section>}

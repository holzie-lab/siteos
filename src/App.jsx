import React, { useEffect, useMemo, useState } from 'react'
import { isConfigured, supabase } from './lib/supabase'
import { normalizeActivity, normalizeArea, normalizeProject, validateActivity, validateArea, validateProject } from './lib/domain'

const modules = [
  ['today','Today'],['projects','Projects'],['activities','Activities'],['reports','Daily Reports'],
  ['materials','Materials'],['quality','Quality'],['drawings','Drawings'],['rfis','RFIs & Issues'],
  ['schedule','P6 Schedule'],['photos','Photos'],['team','Team']
]

const demo = {
  projects:[{id:'demo-project',code:'SITE-001',name:'Sample Construction Project',location:'Project Location'}],
  areas:[{id:'demo-area-1',project_id:'demo-project',code:'AREA-01',name:'Main Work Area'}],
  activities:[
    {id:'demo-act-1',project_id:'demo-project',area_id:'demo-area-1',code:'ACT-001',name:'Foundation Works',progress:60,status:'in_progress',unit:'m3',quantity:120},
    {id:'demo-act-2',project_id:'demo-project',area_id:'demo-area-1',code:'ACT-002',name:'Structural Works',progress:35,status:'in_progress',unit:'t',quantity:42},
    {id:'demo-act-3',project_id:'demo-project',area_id:null,code:'ACT-003',name:'Utility Works',progress:10,status:'planned',unit:'m',quantity:300}
  ]
}

export default function App(){
  const [page,setPage]=useState('today')
  const [query,setQuery]=useState('')
  const [projects,setProjects]=useState(demo.projects)
  const [areas,setAreas]=useState(demo.areas)
  const [activities,setActivities]=useState(demo.activities)
  const [activeProjectId,setActiveProjectId]=useState(demo.projects[0].id)
  const [loading,setLoading]=useState(false)
  const [message,setMessage]=useState(isConfigured ? '' : 'Demo mode: configure Supabase to persist data.')

  useEffect(()=>{ if(isConfigured) loadData() },[])

  async function loadData(){
    setLoading(true)
    const [p,a,w]=await Promise.all([
      supabase.from('projects').select('*').order('code'),
      supabase.from('areas').select('*').order('code'),
      supabase.from('activities').select('*').order('code')
    ])
    const error=p.error||a.error||w.error
    if(error){setMessage(error.message);setLoading(false);return}
    setProjects(p.data||[]);setAreas(a.data||[]);setActivities(w.data||[])
    setActiveProjectId(current => (p.data||[]).some(x=>x.id===current) ? current : p.data?.[0]?.id || '')
    setMessage('');setLoading(false)
  }

  const activeProject=projects.find(x=>x.id===activeProjectId)
  const projectActivities=activities.filter(x=>x.project_id===activeProjectId)
  const visibleActivities=useMemo(()=>projectActivities.filter(x=>`${x.code} ${x.name}`.toLowerCase().includes(query.toLowerCase())),[projectActivities,query])
  const progress=projectActivities.length?Math.round(projectActivities.reduce((s,x)=>s+Number(x.progress||0),0)/projectActivities.length):0

  async function createProject(values){
    const normalized=normalizeProject(values); const errors=validateProject(normalized)
    if(errors.length) return setMessage(errors.join(' '))
    if(!isConfigured){
      const row={id:crypto.randomUUID(),...normalized}; setProjects(x=>[...x,row]);setActiveProjectId(row.id);setMessage('Project added in demo mode.');return
    }
    const {data,error}=await supabase.from('projects').insert(normalized).select('*').single()
    if(error)return setMessage(error.message)
    setProjects(x=>[...x,data]);setActiveProjectId(data.id);setMessage('Project saved.')
  }

  async function createArea(values){
    if(!activeProjectId)return setMessage('Create or select a project first.')
    const normalized=normalizeArea({...values,project_id:activeProjectId}); const errors=validateArea(normalized)
    if(errors.length)return setMessage(errors.join(' '))
    if(!isConfigured){setAreas(x=>[...x,{id:crypto.randomUUID(),...normalized}]);setMessage('Area added in demo mode.');return}
    const {data,error}=await supabase.from('areas').insert(normalized).select('*').single()
    if(error)return setMessage(error.message)
    setAreas(x=>[...x,data]);setMessage('Area saved.')
  }

  async function createActivity(values){
    if(!activeProjectId)return setMessage('Create or select a project first.')
    const normalized=normalizeActivity({...values,project_id:activeProjectId}); const errors=validateActivity(normalized)
    if(errors.length)return setMessage(errors.join(' '))
    if(!isConfigured){setActivities(x=>[...x,{id:crypto.randomUUID(),...normalized}]);setMessage('Activity added in demo mode.');return}
    const {data,error}=await supabase.from('activities').insert(normalized).select('*').single()
    if(error)return setMessage(error.message)
    setActivities(x=>[...x,data]);setMessage('Activity saved.')
  }

  async function deleteActivity(id){
    if(!isConfigured){setActivities(x=>x.filter(a=>a.id!==id));return setMessage('Activity removed in demo mode.')}
    const {error}=await supabase.from('activities').delete().eq('id',id)
    if(error)return setMessage(error.message)
    setActivities(x=>x.filter(a=>a.id!==id));setMessage('Activity removed.')
  }

  return <div className="shell">
    <aside>
      <div className="brand">SiteOS</div>
      <nav>{modules.map(([id,label])=><button key={id} className={page===id?'active':''} onClick={()=>setPage(id)}>{label}</button>)}</nav>
      <small>Open-source construction operations</small>
    </aside>
    <main>
      <header>
        <div><h1>{modules.find(x=>x[0]===page)?.[1]}</h1><p>{activeProject ? `${activeProject.code} · ${activeProject.name}` : 'No project selected'}</p></div>
        <div className="toolbar">
          <select value={activeProjectId} onChange={e=>setActiveProjectId(e.target.value)}><option value="">Select project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search project data" />
        </div>
      </header>
      {message&&<div className="notice">{message}</div>}
      {loading&&<div className="notice">Loading…</div>}
      {page==='today'&&<Dashboard progress={progress} activities={projectActivities} areas={areas.filter(x=>x.project_id===activeProjectId)} />}
      {page==='projects'&&<Projects projects={projects} areas={areas.filter(x=>x.project_id===activeProjectId)} onProject={createProject} onArea={createArea} />}
      {page==='activities'&&<Activities rows={visibleActivities} areas={areas.filter(x=>x.project_id===activeProjectId)} onCreate={createActivity} onDelete={deleteActivity} />}
      {!['today','projects','activities'].includes(page)&&<Empty title={modules.find(x=>x[0]===page)?.[1]} />}
    </main>
  </div>
}

function Dashboard({progress,activities,areas}){return <div className="grid">
  <Card title="Project Progress" value={`${progress}%`} />
  <Card title="Activities" value={activities.length} />
  <Card title="Areas" value={areas.length} />
  <Card title="Active" value={activities.filter(x=>x.status==='in_progress').length} />
  <section className="panel wide"><h2>Activity Progress</h2>{activities.map(x=><div className="row" key={x.id}><span>{x.code} · {x.name}</span><b>{x.progress}%</b></div>)}</section>
  <section className="panel wide"><h2>Project Data Policy</h2><p>This repository contains synthetic demonstration data only. Real client, company, project, personnel and site data must never be committed.</p></section>
</div>}

function Projects({projects,areas,onProject,onArea}){
  const [project,setProject]=useState({code:'',name:'',location:''})
  const [area,setArea]=useState({code:'',name:''})
  return <div className="stack">
    <section className="panel"><h2>Projects</h2><form className="form" onSubmit={e=>{e.preventDefault();onProject(project);setProject({code:'',name:'',location:''})}}>
      <input placeholder="Project code" value={project.code} onChange={e=>setProject({...project,code:e.target.value})}/>
      <input placeholder="Project name" value={project.name} onChange={e=>setProject({...project,name:e.target.value})}/>
      <input placeholder="Location" value={project.location} onChange={e=>setProject({...project,location:e.target.value})}/>
      <button>Add project</button>
    </form>
    <table><thead><tr><th>Code</th><th>Name</th><th>Location</th></tr></thead><tbody>{projects.map(p=><tr key={p.id}><td>{p.code}</td><td>{p.name}</td><td>{p.location||'—'}</td></tr>)}</tbody></table></section>
    <section className="panel"><h2>Areas</h2><form className="form compact" onSubmit={e=>{e.preventDefault();onArea(area);setArea({code:'',name:''})}}>
      <input placeholder="Area code" value={area.code} onChange={e=>setArea({...area,code:e.target.value})}/>
      <input placeholder="Area name" value={area.name} onChange={e=>setArea({...area,name:e.target.value})}/>
      <button>Add area</button>
    </form>
    <table><thead><tr><th>Code</th><th>Name</th></tr></thead><tbody>{areas.map(a=><tr key={a.id}><td>{a.code}</td><td>{a.name}</td></tr>)}</tbody></table></section>
  </div>
}

function Activities({rows,areas,onCreate,onDelete}){
  const [form,setForm]=useState({code:'',name:'',area_id:'',progress:0,status:'planned',quantity:'',unit:''})
  return <section className="panel"><h2>Activities</h2>
    <form className="form activity-form" onSubmit={e=>{e.preventDefault();onCreate(form);setForm({code:'',name:'',area_id:'',progress:0,status:'planned',quantity:'',unit:''})}}>
      <input placeholder="Activity code" value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/>
      <input placeholder="Activity name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <select value={form.area_id} onChange={e=>setForm({...form,area_id:e.target.value})}><option value="">No area</option>{areas.map(a=><option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}</select>
      <input type="number" min="0" max="100" placeholder="Progress %" value={form.progress} onChange={e=>setForm({...form,progress:e.target.value})}/>
      <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="on_hold">On hold</option><option value="completed">Completed</option></select>
      <input type="number" min="0" step="0.01" placeholder="Quantity" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/>
      <input placeholder="Unit" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}/>
      <button>Add activity</button>
    </form>
    <table><thead><tr><th>ID</th><th>Name</th><th>Area</th><th>Quantity</th><th>Progress</th><th>Status</th><th></th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{x.code}</td><td>{x.name}</td><td>{areas.find(a=>a.id===x.area_id)?.code||'—'}</td><td>{x.quantity??'—'} {x.unit||''}</td><td>{x.progress}%</td><td>{x.status}</td><td><button className="link danger" onClick={()=>onDelete(x.id)}>Delete</button></td></tr>)}</tbody></table></section>
}

function Card({title,value}){return <section className="card"><small>{title}</small><strong>{value}</strong></section>}
function Empty({title}){return <section className="panel"><h2>{title}</h2><p>This module is part of the SiteOS roadmap and will be implemented through public issues and pull requests.</p></section>}

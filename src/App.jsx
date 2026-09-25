import React, { useEffect, useMemo, useState } from 'react'
import { isConfigured, supabase } from './lib/supabase'
import { normalizeActivity, normalizeArea, normalizeDrawing, normalizeProject, normalizeQuality, normalizeRfi, validateActivity, validateArea, validateDrawing, validateProject, validateQuality, validateRfi } from './lib/domain'
import { parseXerText } from './lib/xer'

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
  ],
  quality:[
    {id:'demo-q-1',project_id:'demo-project',activity_id:'demo-act-1',record_no:'Q-001',record_type:'inspection',title:'Foundation pre-pour inspection',status:'approved',result:'passed',record_date:'2026-09-01'}
  ],
  drawings:[
    {id:'demo-d-1',project_id:'demo-project',activity_id:'demo-act-2',drawing_no:'DRW-001',title:'General arrangement',revision:'A',status:'current',issued_at:'2026-09-02'}
  ],
  rfis:[
    {id:'demo-rfi-1',project_id:'demo-project',activity_id:'demo-act-2',rfi_no:'RFI-001',subject:'Clarify interface detail',status:'open',priority:'normal',due_date:'2026-09-30'}
  ]
}

export default function App(){
  const [page,setPage]=useState('today')
  const [query,setQuery]=useState('')
  const [projects,setProjects]=useState(demo.projects)
  const [areas,setAreas]=useState(demo.areas)
  const [activities,setActivities]=useState(demo.activities)
  const [quality,setQuality]=useState(demo.quality)
  const [drawings,setDrawings]=useState(demo.drawings)
  const [rfis,setRfis]=useState(demo.rfis)
  const [activeProjectId,setActiveProjectId]=useState(demo.projects[0].id)
  const [loading,setLoading]=useState(false)
  const [message,setMessage]=useState(isConfigured ? '' : 'Demo mode: configure Supabase to persist data.')

  useEffect(()=>{ if(isConfigured) loadData() },[])

  async function loadData(){
    setLoading(true)
    const [p,a,w,q,d,r]=await Promise.all([
      supabase.from('projects').select('*').order('code'),
      supabase.from('areas').select('*').order('code'),
      supabase.from('activities').select('*').order('code'),
      supabase.from('quality_records').select('*').order('record_no'),
      supabase.from('drawings').select('*').order('drawing_no'),
      supabase.from('rfis').select('*').order('rfi_no')
    ])
    const error=p.error||a.error||w.error||q.error||d.error||r.error
    if(error){setMessage(error.message);setLoading(false);return}
    setProjects(p.data||[]);setAreas(a.data||[]);setActivities(w.data||[]);setQuality(q.data||[]);setDrawings(d.data||[]);setRfis(r.data||[])
    setActiveProjectId(current => (p.data||[]).some(x=>x.id===current) ? current : p.data?.[0]?.id || '')
    setMessage('');setLoading(false)
  }

  const activeProject=projects.find(x=>x.id===activeProjectId)
  const projectActivities=activities.filter(x=>x.project_id===activeProjectId)
  const visibleActivities=useMemo(()=>projectActivities.filter(x=>`${x.code} ${x.name}`.toLowerCase().includes(query.toLowerCase())),[projectActivities,query])
  const progress=projectActivities.length?Math.round(projectActivities.reduce((s,x)=>s+Number(x.progress||0),0)/projectActivities.length):0
  const projectQuality=quality.filter(x=>x.project_id===activeProjectId)
  const projectDrawings=drawings.filter(x=>x.project_id===activeProjectId)
  const projectRfis=rfis.filter(x=>x.project_id===activeProjectId)

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

  async function createQuality(values){
    if(!activeProjectId)return setMessage('Create or select a project first.')
    const normalized=normalizeQuality({...values,project_id:activeProjectId}); const errors=validateQuality(normalized)
    if(errors.length)return setMessage(errors.join(' '))
    if(!isConfigured){setQuality(x=>[...x,{id:crypto.randomUUID(),...normalized}]);setMessage('Quality record added in demo mode.');return}
    const {data,error}=await supabase.from('quality_records').insert(normalized).select('*').single()
    if(error)return setMessage(error.message)
    setQuality(x=>[...x,data]);setMessage('Quality record saved.')
  }

  async function createDrawing(values){
    if(!activeProjectId)return setMessage('Create or select a project first.')
    const normalized=normalizeDrawing({...values,project_id:activeProjectId}); const errors=validateDrawing(normalized)
    if(errors.length)return setMessage(errors.join(' '))
    if(!isConfigured){setDrawings(x=>[...x,{id:crypto.randomUUID(),...normalized}]);setMessage('Drawing added in demo mode.');return}
    const {data,error}=await supabase.from('drawings').insert(normalized).select('*').single()
    if(error)return setMessage(error.message)
    setDrawings(x=>[...x,data]);setMessage('Drawing saved.')
  }

  async function createRfi(values){
    if(!activeProjectId)return setMessage('Create or select a project first.')
    const normalized=normalizeRfi({...values,project_id:activeProjectId}); const errors=validateRfi(normalized)
    if(errors.length)return setMessage(errors.join(' '))
    if(!isConfigured){setRfis(x=>[...x,{id:crypto.randomUUID(),...normalized}]);setMessage('RFI added in demo mode.');return}
    const {data,error}=await supabase.from('rfis').insert(normalized).select('*').single()
    if(error)return setMessage(error.message)
    setRfis(x=>[...x,data]);setMessage('RFI saved.')
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
      {page==='quality'&&<Quality rows={projectQuality} activities={projectActivities} query={query} onCreate={createQuality} />}
      {page==='drawings'&&<Drawings rows={projectDrawings} activities={projectActivities} query={query} onCreate={createDrawing} />}
      {page==='rfis'&&<Rfis rows={projectRfis} activities={projectActivities} query={query} onCreate={createRfi} />}
      {page==='schedule'&&<Schedule />}
      {!['today','projects','activities','quality','drawings','rfis','schedule'].includes(page)&&<Empty title={modules.find(x=>x[0]===page)?.[1]} />}
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


function activityLabel(activities,id){const row=activities.find(x=>x.id===id);return row?`${row.code} · ${row.name}`:'—'}

function Quality({rows,activities,query,onCreate}){
  const [form,setForm]=useState({record_no:'',record_type:'inspection',title:'',activity_id:'',status:'open',result:'pending',record_date:''})
  const visible=rows.filter(x=>`${x.record_no} ${x.title} ${x.record_type} ${x.status} ${x.result}`.toLowerCase().includes(query.toLowerCase()))
  return <section className="panel"><h2>Quality Register</h2>
    <form className="form register-form" onSubmit={e=>{e.preventDefault();onCreate(form);setForm({record_no:'',record_type:'inspection',title:'',activity_id:'',status:'open',result:'pending',record_date:''})}}>
      <input placeholder="Record no" value={form.record_no} onChange={e=>setForm({...form,record_no:e.target.value})}/>
      <select value={form.record_type} onChange={e=>setForm({...form,record_type:e.target.value})}><option value="inspection">Inspection</option><option value="itp">ITP</option><option value="ncr">NCR</option><option value="test">Test</option></select>
      <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
      <select value={form.activity_id} onChange={e=>setForm({...form,activity_id:e.target.value})}><option value="">General project</option>{activities.map(a=><option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}</select>
      <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="open">Open</option><option value="closed">Closed</option><option value="approved">Approved</option></select>
      <select value={form.result} onChange={e=>setForm({...form,result:e.target.value})}><option value="pending">Pending</option><option value="passed">Passed</option><option value="failed">Failed</option><option value="conditional">Conditional</option></select>
      <input type="date" value={form.record_date} onChange={e=>setForm({...form,record_date:e.target.value})}/>
      <button>Add quality record</button>
    </form>
    <table><thead><tr><th>No</th><th>Type</th><th>Title</th><th>Activity</th><th>Result</th><th>Status</th></tr></thead><tbody>{visible.map(x=><tr key={x.id}><td>{x.record_no}</td><td>{x.record_type}</td><td>{x.title}</td><td>{activityLabel(activities,x.activity_id)}</td><td>{x.result}</td><td>{x.status}</td></tr>)}</tbody></table>
  </section>
}

function Drawings({rows,activities,query,onCreate}){
  const [form,setForm]=useState({drawing_no:'',title:'',revision:'',activity_id:'',status:'current',issued_at:''})
  const visible=rows.filter(x=>`${x.drawing_no} ${x.title} ${x.revision} ${x.status}`.toLowerCase().includes(query.toLowerCase()))
  return <section className="panel"><h2>Drawing & Revision Register</h2>
    <form className="form register-form" onSubmit={e=>{e.preventDefault();onCreate(form);setForm({drawing_no:'',title:'',revision:'',activity_id:'',status:'current',issued_at:''})}}>
      <input placeholder="Drawing no" value={form.drawing_no} onChange={e=>setForm({...form,drawing_no:e.target.value})}/>
      <input placeholder="Drawing title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
      <input placeholder="Revision" value={form.revision} onChange={e=>setForm({...form,revision:e.target.value})}/>
      <select value={form.activity_id} onChange={e=>setForm({...form,activity_id:e.target.value})}><option value="">General project</option>{activities.map(a=><option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}</select>
      <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="current">Current</option><option value="superseded">Superseded</option><option value="hold">Hold</option><option value="approved">Approved</option></select>
      <input type="date" value={form.issued_at} onChange={e=>setForm({...form,issued_at:e.target.value})}/>
      <button>Add drawing</button>
    </form>
    <table><thead><tr><th>No</th><th>Title</th><th>Rev</th><th>Activity</th><th>Issued</th><th>Status</th></tr></thead><tbody>{visible.map(x=><tr key={x.id}><td>{x.drawing_no}</td><td>{x.title}</td><td>{x.revision}</td><td>{activityLabel(activities,x.activity_id)}</td><td>{x.issued_at||'—'}</td><td>{x.status}</td></tr>)}</tbody></table>
  </section>
}

function Rfis({rows,activities,query,onCreate}){
  const [form,setForm]=useState({rfi_no:'',subject:'',activity_id:'',status:'open',priority:'normal',due_date:''})
  const visible=rows.filter(x=>`${x.rfi_no} ${x.subject} ${x.status} ${x.priority}`.toLowerCase().includes(query.toLowerCase()))
  return <section className="panel"><h2>RFI & Issue Register</h2>
    <form className="form register-form" onSubmit={e=>{e.preventDefault();onCreate(form);setForm({rfi_no:'',subject:'',activity_id:'',status:'open',priority:'normal',due_date:''})}}>
      <input placeholder="RFI no" value={form.rfi_no} onChange={e=>setForm({...form,rfi_no:e.target.value})}/>
      <input placeholder="Subject" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/>
      <select value={form.activity_id} onChange={e=>setForm({...form,activity_id:e.target.value})}><option value="">General project</option>{activities.map(a=><option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}</select>
      <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="open">Open</option><option value="answered">Answered</option><option value="closed">Closed</option></select>
      <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select>
      <input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/>
      <button>Add RFI</button>
    </form>
    <table><thead><tr><th>No</th><th>Subject</th><th>Activity</th><th>Priority</th><th>Due</th><th>Status</th></tr></thead><tbody>{visible.map(x=><tr key={x.id}><td>{x.rfi_no}</td><td>{x.subject}</td><td>{activityLabel(activities,x.activity_id)}</td><td>{x.priority}</td><td>{x.due_date||'—'}</td><td>{x.status}</td></tr>)}</tbody></table>
  </section>
}


function Schedule(){
  const [schedule,setSchedule]=useState(null)
  const [error,setError]=useState('')

  async function loadFile(e){
    const file=e.target.files?.[0]
    if(!file)return
    setError('');setSchedule(null)
    if(!file.name.toLowerCase().endsWith('.xer')){setError('Select a .xer file.');return}
    if(file.size>25*1024*1024){setError('XER file must be 25 MB or smaller.');return}
    try{
      const text=await file.text()
      setSchedule(parseXerText(text))
    }catch(err){
      setError(err.message||'XER could not be parsed.')
    }finally{
      e.target.value=''
    }
  }

  return <div className="stack">
    <section className="panel">
      <h2>P6 XER Preview</h2>
      <p>Select a local XER export for in-browser preview. The selected file is not committed to the repository and this preview does not persist the original file.</p>
      <input type="file" accept=".xer,text/plain" onChange={loadFile}/>
      {error&&<div className="notice">{error}</div>}
    </section>
    {schedule&&<>
      <div className="grid">
        <Card title="Projects" value={schedule.summary.project_count}/>
        <Card title="WBS" value={schedule.summary.wbs_count}/>
        <Card title="Activities" value={schedule.summary.activity_count}/>
        <Card title="Critical / ≤0 float" value={schedule.summary.critical_count}/>
      </div>
      <section className="panel"><h2>Projects</h2><table><thead><tr><th>Code</th><th>Name</th><th>Data Date</th></tr></thead><tbody>{schedule.projects.map(x=><tr key={x.id}><td>{x.code}</td><td>{x.name}</td><td>{x.data_date||'—'}</td></tr>)}</tbody></table></section>
      <section className="panel"><h2>Activities</h2><table><thead><tr><th>ID</th><th>Name</th><th>WBS</th><th>Status</th><th>Physical %</th><th>Total Float</th><th>Start</th><th>Finish</th></tr></thead><tbody>{schedule.activities.slice(0,200).map(x=><tr key={x.id}><td>{x.code}</td><td>{x.name}</td><td>{x.wbs_code||'—'}</td><td>{x.status}</td><td>{x.physical_percent??'—'}</td><td>{x.total_float_hours??'—'} h</td><td>{x.planned_start||'—'}</td><td>{x.planned_end||'—'}</td></tr>)}</tbody></table></section>
      <section className="panel"><h2>Relationships</h2><table><thead><tr><th>Predecessor</th><th>Type</th><th>Successor</th><th>Lag</th></tr></thead><tbody>{schedule.relationships.slice(0,200).map((x,i)=><tr key={i}><td>{x.predecessor_code||x.predecessor_id}</td><td>{x.type}</td><td>{x.successor_code||x.successor_id}</td><td>{x.lag_hours} h</td></tr>)}</tbody></table></section>
    </>}
  </div>
}

function Card({title,value}){return <section className="card"><small>{title}</small><strong>{value}</strong></section>}
function Empty({title}){return <section className="panel"><h2>{title}</h2><p>This module is part of the SiteOS roadmap and will be implemented through public issues and pull requests.</p></section>}

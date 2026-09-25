import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeActivity, normalizeArea, normalizeProject, validateActivity, validateArea, validateProject } from '../src/lib/domain.js'

test('normalizes and validates a project',()=>{
  const value=normalizeProject({code:' site-002 ',name:' Generic Project ',location:' Sample Location '})
  assert.deepEqual(value,{code:'SITE-002',name:'Generic Project',location:'Sample Location'})
  assert.deepEqual(validateProject(value),[])
})

test('requires project and area identity',()=>{
  assert.ok(validateArea(normalizeArea({project_id:'',code:'',name:''})).length>=3)
})

test('validates activity progress and quantity/unit pair',()=>{
  const bad=normalizeActivity({project_id:'p1',code:'A1',name:'Work',progress:120,status:'planned',quantity:2,unit:''})
  const errors=validateActivity(bad)
  assert.ok(errors.some(x=>x.includes('Progress')))
  assert.ok(errors.some(x=>x.includes('Unit')))
})

test('accepts a complete activity',()=>{
  const value=normalizeActivity({project_id:'p1',area_id:'a1',code:' act-010 ',name:'Concrete Works',progress:45,status:'in_progress',quantity:'25.5',unit:'m3'})
  assert.equal(value.code,'ACT-010')
  assert.equal(value.quantity,25.5)
  assert.deepEqual(validateActivity(value),[])
})

test('validates quality records', async()=>{
  const { normalizeQuality, validateQuality } = await import('../src/lib/domain.js')
  const value=normalizeQuality({project_id:'p1',record_no:' q-001 ',title:'Concrete inspection',record_type:'inspection',status:'open',result:'pending'})
  assert.equal(value.record_no,'Q-001')
  assert.deepEqual(validateQuality(value),[])
})

test('requires drawing revision', async()=>{
  const { normalizeDrawing, validateDrawing } = await import('../src/lib/domain.js')
  const errors=validateDrawing(normalizeDrawing({project_id:'p1',drawing_no:'d-1',title:'Plan',revision:''}))
  assert.ok(errors.some(x=>x.includes('Revision')))
})

test('validates RFI identity and workflow', async()=>{
  const { normalizeRfi, validateRfi } = await import('../src/lib/domain.js')
  const value=normalizeRfi({project_id:'p1',rfi_no:' rfi-010 ',subject:'Clarify opening',status:'open',priority:'high'})
  assert.equal(value.rfi_no,'RFI-010')
  assert.deepEqual(validateRfi(value),[])
})

test('validates a synthetic daily report', async()=>{
  const { normalizeDailyReport, validateDailyReport } = await import('../src/lib/domain.js')
  const value=normalizeDailyReport({
    project_id:'demo-project',
    activity_id:'demo-activity',
    report_date:'2026-09-25',
    weather:'Clear',
    manpower:'12',
    progress_notes:'Synthetic progress update for Nova Build Demo.',
    status:'submitted'
  })
  assert.equal(value.manpower,12)
  assert.deepEqual(validateDailyReport(value),[])
})

test('validates synthetic materials and calculates stock', async()=>{
  const { normalizeMaterial, validateMaterial, normalizeMaterialMovement, validateMaterialMovement, calculateStock } = await import('../src/lib/domain.js')
  const material=normalizeMaterial({project_id:'demo-project',code:' mat-01 ',name:'Demo Reinforcement Steel',unit:'t',minimum_stock:'5'})
  assert.equal(material.code,'MAT-01')
  assert.deepEqual(validateMaterial(material),[])
  const moveIn=normalizeMaterialMovement({project_id:'demo-project',material_id:'m1',movement_type:'in',quantity:'10',movement_date:'2026-09-25'})
  const moveOut=normalizeMaterialMovement({project_id:'demo-project',material_id:'m1',movement_type:'out',quantity:'3',movement_date:'2026-09-25'})
  assert.deepEqual(validateMaterialMovement(moveIn),[])
  assert.equal(calculateStock('m1',[moveIn,moveOut]),7)
})

test('project roles follow least-privilege capability rules', async()=>{
  const { roleCan } = await import('../src/lib/domain.js')
  assert.equal(roleCan('viewer','view'),true)
  assert.equal(roleCan('viewer','core'),false)
  assert.equal(roleCan('site_engineer','core'),true)
  assert.equal(roleCan('site_engineer','quality'),false)
  assert.equal(roleCan('qa_qc','quality'),true)
  assert.equal(roleCan('qa_qc','planning'),false)
  assert.equal(roleCan('planner','planning'),true)
  assert.equal(roleCan('planner','manage'),false)
  assert.equal(roleCan('technical_office','core'),true)
  assert.equal(roleCan('technical_office','quality'),true)
  assert.equal(roleCan('technical_office','planning'),true)
  assert.equal(roleCan('project_manager','manage'),true)
  assert.equal(roleCan('admin','manage'),true)
})

test('validates project memberships', async()=>{
  const { normalizeMembership, validateMembership } = await import('../src/lib/domain.js')
  const value=normalizeMembership({project_id:'demo-project',user_id:'00000000-0000-4000-8000-000000000001',role:'viewer'})
  assert.deepEqual(validateMembership(value),[])
  assert.ok(validateMembership(normalizeMembership({project_id:'demo-project',user_id:'',role:'unknown'})).length>=2)
})

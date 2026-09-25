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

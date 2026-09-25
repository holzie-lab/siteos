const trim = value => String(value ?? '').trim()
const numberOrNull = value => value === '' || value === null || value === undefined ? null : Number(value)

export function normalizeProject(input){
  return { code: trim(input.code).toUpperCase(), name: trim(input.name), location: trim(input.location) || null }
}
export function validateProject(project){
  const errors=[]
  if(!project.code) errors.push('Project code is required.')
  if(!project.name) errors.push('Project name is required.')
  if(project.code.length>40) errors.push('Project code must be 40 characters or fewer.')
  return errors
}
export function normalizeArea(input){
  return { project_id: input.project_id, code: trim(input.code).toUpperCase(), name: trim(input.name) }
}
export function validateArea(area){
  const errors=[]
  if(!area.project_id) errors.push('Project is required.')
  if(!area.code) errors.push('Area code is required.')
  if(!area.name) errors.push('Area name is required.')
  return errors
}
export function normalizeActivity(input){
  return {
    project_id: input.project_id,
    area_id: input.area_id || null,
    code: trim(input.code).toUpperCase(),
    name: trim(input.name),
    progress: Number(input.progress || 0),
    status: input.status || 'planned',
    quantity: numberOrNull(input.quantity),
    unit: trim(input.unit) || null
  }
}
export function validateActivity(activity){
  const errors=[]
  const statuses=new Set(['planned','in_progress','on_hold','completed'])
  if(!activity.project_id) errors.push('Project is required.')
  if(!activity.code) errors.push('Activity code is required.')
  if(!activity.name) errors.push('Activity name is required.')
  if(!Number.isFinite(activity.progress)||activity.progress<0||activity.progress>100) errors.push('Progress must be between 0 and 100.')
  if(!statuses.has(activity.status)) errors.push('Activity status is invalid.')
  if(activity.quantity!==null&&(!Number.isFinite(activity.quantity)||activity.quantity<0)) errors.push('Quantity must be zero or greater.')
  if(activity.quantity!==null&&!activity.unit) errors.push('Unit is required when quantity is set.')
  return errors
}

export function normalizeQuality(input){
  return {
    project_id: input.project_id,
    activity_id: input.activity_id || null,
    record_no: trim(input.record_no).toUpperCase(),
    record_type: input.record_type || 'inspection',
    title: trim(input.title),
    status: input.status || 'open',
    result: input.result || 'pending',
    record_date: input.record_date || null
  }
}
export function validateQuality(row){
  const errors=[]
  if(!row.project_id) errors.push('Project is required.')
  if(!row.record_no) errors.push('Quality record number is required.')
  if(!row.title) errors.push('Quality title is required.')
  if(!new Set(['inspection','itp','ncr','test']).has(row.record_type)) errors.push('Quality record type is invalid.')
  if(!new Set(['open','closed','approved']).has(row.status)) errors.push('Quality status is invalid.')
  if(!new Set(['pending','passed','failed','conditional']).has(row.result)) errors.push('Quality result is invalid.')
  return errors
}
export function normalizeDrawing(input){
  return {
    project_id: input.project_id,
    activity_id: input.activity_id || null,
    drawing_no: trim(input.drawing_no).toUpperCase(),
    title: trim(input.title),
    revision: trim(input.revision).toUpperCase(),
    status: input.status || 'current',
    issued_at: input.issued_at || null
  }
}
export function validateDrawing(row){
  const errors=[]
  if(!row.project_id) errors.push('Project is required.')
  if(!row.drawing_no) errors.push('Drawing number is required.')
  if(!row.title) errors.push('Drawing title is required.')
  if(!row.revision) errors.push('Revision is required.')
  if(!new Set(['current','superseded','hold','approved']).has(row.status)) errors.push('Drawing status is invalid.')
  return errors
}
export function normalizeRfi(input){
  return {
    project_id: input.project_id,
    activity_id: input.activity_id || null,
    rfi_no: trim(input.rfi_no).toUpperCase(),
    subject: trim(input.subject),
    status: input.status || 'open',
    priority: input.priority || 'normal',
    due_date: input.due_date || null
  }
}
export function validateRfi(row){
  const errors=[]
  if(!row.project_id) errors.push('Project is required.')
  if(!row.rfi_no) errors.push('RFI number is required.')
  if(!row.subject) errors.push('RFI subject is required.')
  if(!new Set(['open','answered','closed']).has(row.status)) errors.push('RFI status is invalid.')
  if(!new Set(['low','normal','high']).has(row.priority)) errors.push('RFI priority is invalid.')
  return errors
}

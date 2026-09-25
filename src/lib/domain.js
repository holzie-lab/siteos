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

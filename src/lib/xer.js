const clean = value => String(value ?? '').trim()

export function parseXerText(text) {
  if (!text || !clean(text)) throw new Error('XER input is empty.')

  const tables = {}
  let table = null
  let fields = []

  for (const rawLine of String(text).replace(/^\uFEFF/, '').split(/\r?\n/)) {
    if (!rawLine) continue
    const parts = rawLine.split('\t')
    const marker = parts[0]

    if (marker === '%T') {
      table = clean(parts[1])
      fields = []
      if (table) tables[table] ??= []
      continue
    }

    if (marker === '%F') {
      fields = parts.slice(1).map(clean)
      continue
    }

    if (marker === '%R' && table && fields.length) {
      const values = parts.slice(1)
      const row = Object.fromEntries(fields.map((field, index) => [field, values[index] ?? '']))
      tables[table].push(row)
    }
  }

  if (!tables.PROJECT?.length) throw new Error('XER PROJECT table is missing.')
  if (!tables.TASK?.length) throw new Error('XER TASK table is missing.')

  return normalizeSchedule(tables)
}

function toNumber(value) {
  if (value === '' || value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toDate(value) {
  const v = clean(value)
  return v || null
}

function statusFromP6(value) {
  const v = clean(value).toLowerCase()
  if (v.includes('complete') || v.includes('tk_complete')) return 'completed'
  if (v.includes('active')) return 'in_progress'
  return 'planned'
}

function relationType(value) {
  const v = clean(value).toUpperCase()
  if (v.includes('SS')) return 'SS'
  if (v.includes('FF')) return 'FF'
  if (v.includes('SF')) return 'SF'
  return 'FS'
}

export function normalizeSchedule(tables) {
  const projects = tables.PROJECT || []
  const wbsRows = tables.PROJWBS || []
  const tasks = tables.TASK || []
  const preds = tables.TASKPRED || []

  const wbsById = new Map(wbsRows.map(row => [row.wbs_id, row]))
  const taskById = new Map(tasks.map(row => [row.task_id, row]))

  const wbs = wbsRows.map(row => ({
    id: clean(row.wbs_id),
    parent_id: clean(row.parent_wbs_id) || null,
    project_id: clean(row.proj_id),
    code: clean(row.wbs_short_name),
    name: clean(row.wbs_name),
    sequence: toNumber(row.seq_num)
  }))

  const activities = tasks.map(row => ({
    id: clean(row.task_id),
    project_id: clean(row.proj_id),
    wbs_id: clean(row.wbs_id) || null,
    wbs_code: clean(wbsById.get(row.wbs_id)?.wbs_short_name),
    code: clean(row.task_code),
    name: clean(row.task_name),
    status: statusFromP6(row.status_code),
    planned_start: toDate(row.target_start_date || row.start_date),
    planned_end: toDate(row.target_end_date || row.end_date),
    actual_start: toDate(row.act_start_date),
    actual_end: toDate(row.act_end_date),
    physical_percent: toNumber(row.phys_complete_pct),
    total_float_hours: toNumber(row.total_float_hr_cnt),
    free_float_hours: toNumber(row.free_float_hr_cnt),
    target_duration_hours: toNumber(row.target_drtn_hr_cnt),
    remaining_duration_hours: toNumber(row.remain_drtn_hr_cnt)
  }))

  const relationships = preds.map(row => ({
    successor_id: clean(row.task_id),
    predecessor_id: clean(row.pred_task_id),
    successor_code: clean(taskById.get(row.task_id)?.task_code),
    predecessor_code: clean(taskById.get(row.pred_task_id)?.task_code),
    type: relationType(row.pred_type),
    lag_hours: toNumber(row.lag_hr_cnt) ?? 0
  }))

  return {
    projects: projects.map(row => ({
      id: clean(row.proj_id),
      code: clean(row.proj_short_name),
      name: clean(row.proj_name),
      data_date: toDate(row.last_recalc_date || row.data_date)
    })),
    wbs,
    activities,
    relationships,
    summary: {
      project_count: projects.length,
      wbs_count: wbs.length,
      activity_count: activities.length,
      relationship_count: relationships.length,
      critical_count: activities.filter(row => row.total_float_hours !== null && row.total_float_hours <= 0).length
    }
  }
}

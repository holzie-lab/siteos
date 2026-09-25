import test from 'node:test'
import assert from 'node:assert/strict'
import { parseXerText } from '../src/lib/xer.js'

const syntheticXer = [
  'ERMHDR\t19.12\t2026-01-01',
  '%T\tPROJECT',
  '%F\tproj_id\tproj_short_name\tproj_name\tlast_recalc_date',
  '%R\t100\tDEMO-01\tSynthetic Schedule\t2026-01-15 17:00',
  '%T\tPROJWBS',
  '%F\twbs_id\tparent_wbs_id\tproj_id\twbs_short_name\twbs_name\tseq_num',
  '%R\t10\t\t100\tWBS-01\tPrimary Works\t1',
  '%T\tTASK',
  '%F\ttask_id\tproj_id\twbs_id\ttask_code\ttask_name\tstatus_code\tphys_complete_pct\ttarget_start_date\ttarget_end_date\ttarget_drtn_hr_cnt\tremain_drtn_hr_cnt\ttotal_float_hr_cnt\tfree_float_hr_cnt',
  '%R\t501\t100\t10\tACT-101\tSynthetic Activity One\tTK_Active\t50\t2026-01-01 08:00\t2026-01-05 17:00\t40\t20\t0\t0',
  '%R\t502\t100\t10\tACT-102\tSynthetic Activity Two\tTK_NotStart\t0\t2026-01-06 08:00\t2026-01-10 17:00\t40\t40\t16\t8',
  '%T\tTASKPRED',
  '%F\ttask_id\tpred_task_id\tpred_type\tlag_hr_cnt\tproj_id',
  '%R\t502\t501\tPR_FS\t0\t100',
  '%E'
].join('\n')

test('parses synthetic XER into a normalized schedule', () => {
  const schedule = parseXerText(syntheticXer)
  assert.equal(schedule.summary.project_count, 1)
  assert.equal(schedule.summary.wbs_count, 1)
  assert.equal(schedule.summary.activity_count, 2)
  assert.equal(schedule.summary.relationship_count, 1)
  assert.equal(schedule.summary.critical_count, 1)
  assert.equal(schedule.activities[0].code, 'ACT-101')
  assert.equal(schedule.activities[0].physical_percent, 50)
  assert.equal(schedule.relationships[0].type, 'FS')
  assert.equal(schedule.relationships[0].predecessor_code, 'ACT-101')
})

test('fails explicitly when PROJECT is missing', () => {
  assert.throws(() => parseXerText('%T\tTASK\n%F\ttask_id\n%R\t1'), /PROJECT table is missing/)
})

test('fails explicitly when TASK is missing', () => {
  assert.throws(() => parseXerText('%T\tPROJECT\n%F\tproj_id\n%R\t1'), /TASK table is missing/)
})

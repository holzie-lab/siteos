import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)

const blockedExtensions = [
  '.xer', '.xlsx', '.xls', '.csv', '.pdf', '.docx', '.doc',
  '.zip', '.rar', '.7z', '.heic', '.mov', '.mp4'
]

test('repository does not track project export or field-document formats', () => {
  const blocked = tracked.filter(path =>
    blockedExtensions.some(ext => path.toLowerCase().endsWith(ext))
  )
  assert.deepEqual(blocked, [])
})

test('tracked text does not contain common credential material', () => {
  const textExtensions = ['.js','.jsx','.mjs','.json','.md','.sql','.html','.css','.yml','.yaml','.webmanifest','.txt']
  const suspicious = [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /\bAKIA[A-Z0-9]{16}\b/,
    /\bsk-[A-Za-z0-9_-]{20,}\b/,
    /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/
  ]

  const findings = []
  for (const path of tracked) {
    if (!textExtensions.some(ext => path.toLowerCase().endsWith(ext))) continue
    const content = readFileSync(path, 'utf8')
    for (const pattern of suspicious) {
      if (pattern.test(content)) findings.push(path)
      pattern.lastIndex = 0
    }
  }
  assert.deepEqual([...new Set(findings)], [])
})

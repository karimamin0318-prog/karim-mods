import { describe, expect, test } from 'claude-code/testing'

import { ancestors, fmtTime, isCommitCommand, isInside, lineDiff, parseNumstat, parseStatus, relTo, tagFor } from './model'

describe('model', () => {
  test('lineDiff counts a one-line change as +1 -1', () => {
    expect(lineDiff('export const MAX_RETRIES = 2;', 'export const MAX_RETRIES = 3;')).toEqual({ added: 1, removed: 1 })
    expect(lineDiff('', 'a\nb\nc\n')).toEqual({ added: 3, removed: 0 })
    expect(lineDiff('a\nb', 'a\nb\nc')).toEqual({ added: 1, removed: 0 })
  })

  test('paths compare across slashes and case', () => {
    expect(isInside('C:\\Users\\k\\proj', 'c:/users/k/proj/src/a.js')).toBe(true)
    expect(isInside('C:/Users/k/proj', 'C:/Users/k/project/a.js')).toBe(false)
    expect(relTo('C:\\Users\\k\\proj', 'C:\\Users\\k\\proj\\src\\api\\client.js')).toBe('src/api/client.js')
    expect(ancestors('C:/p', 'C:/p/src/api/client.js')).toEqual(['C:/p/src', 'C:/p/src/api'])
  })

  test('git status and numstat parse', () => {
    const s = parseStatus('## main...origin/main [ahead 1]\n M src/api/client.js\n?? notes.md\n')
    expect(s.branch).toBe('main')
    expect(s.ahead).toBe(1)
    expect(s.entries.map(x => x.path)).toEqual(['src/api/client.js', 'notes.md'])
    expect(parseStatus('## No commits yet on master\n').branch).toBe('master')
    expect(parseNumstat('1\t1\tsrc/api/client.js\n-\t-\tlogo.png\n')['src/api/client.js']).toEqual({ added: 1, removed: 1 })
  })

  test('numstat counts a rename under its new path', () => {
    const n = parseNumstat('2\t1\tsrc/{old.js => new.js}\n3\t0\tdocs/a.md => docs/b.md\n')
    expect(n['src/new.js']).toEqual({ added: 2, removed: 1 })
    expect(n['docs/b.md']).toEqual({ added: 3, removed: 0 })
  })

  test('commit commands are spotted', () => {
    expect(isCommitCommand('git commit -am "Raise MAX_RETRIES to 3"')).toBe(true)
    expect(isCommitCommand('git -C repo add . ; git status')).toBe(false)
  })

  test('tags and times', () => {
    expect(tagFor('client.js').label).toBe('JS')
    expect(tagFor('.gitignore').label).toBe('GIT')
    expect(tagFor('package.json').label).toBe('{ }')
    expect(tagFor('Photo.JPEG').label).toBe('IMG')
    expect(tagFor('pane.tsx').label).toBe('TSX')
    expect(tagFor('.env.local').label).toBe('ENV')
    expect(tagFor('data.xyz').label).toBe('XYZ')
    expect(tagFor('Makefile').label).toBe('FILE')
    const t = new Date(2026, 9, 10, 15, 40).getTime()
    expect(fmtTime(t, t)).toBe('15:40')
    expect(fmtTime(new Date(2026, 8, 20).getTime(), t)).toBe('20 Sep')
  })
})

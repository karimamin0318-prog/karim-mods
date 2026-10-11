export type Accent = 'grey' | 'purple' | 'orange' | 'green' | 'blue' | 'red'
export type Icon = 'spark' | 'eye' | 'pencil' | 'check' | 'search' | 'terminal' | 'stop'

export type Now = {
  isLive: boolean
  label: string
  title: string
  sub: string
  accent: Accent
  icon: Icon
  added: number
  removed: number
  stamp: number
}

export type TouchStatus = 'reading' | 'opened' | 'editing' | 'edited' | 'created' | 'committed'

export type Touched = {
  key: string
  path: string
  name: string
  dir: string
  status: TouchStatus
  added: number
  removed: number
}

export type GitFile = { added: number; removed: number; code: string }

export type GitInfo = {
  isRepo: boolean
  branch: string
  ahead: number
  files: Record<string, GitFile>
  added: number
  removed: number
}

export type View = {
  root: string
  showSizes: boolean
  hideHidden: boolean
  query: string
  expanded: string[]
  /** The tree jumps to wherever Claude works. */
  follow: boolean
}

export type Commit = { hash: string; count: number }

declare module 'claude-code' {
  interface PluginState {
    'live-files': {
      now: Now
      touched: Touched[]
      git: GitInfo
      view: View
      project: string
      commit: Commit
    }
  }
}

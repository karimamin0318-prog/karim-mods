// An invisible click target over one row (of the tree or the touched card).
// Each row has its own, so a click needs no position: its target names it.

import type { ClientSurface } from 'claude-code'

type HitProps = { i: number }

type State = { ref: { props: HitProps } }

export default function Hit(props: HitProps, surface: ClientSurface<State>) {
  const { Box } = surface.elements
  let state = surface.state
  if (state === undefined) {
    state = { ref: { props } }
    const first = state
    surface.setState(first)
    surface.onPointer(ev => {
      if (ev.type === 'down' && ev.button === 'left') {
        surface.post({ t: 'click', i: (surface.state ?? first).ref.props.i })
      }
    })
  }
  state.ref.props = props
  return <Box width={Math.max(1, surface.columns)} height={Math.max(1, surface.rows)} />
}

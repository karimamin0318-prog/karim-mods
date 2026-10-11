/**
 * The crab's scenes: each one is a small SVG with its own CSS animation,
 * drawn once and left to play. Nothing here touches the engine, so tests can
 * build every scene directly.
 */

import { at, BASE, CH, clampX, CONFETTI, crab, CW, EYE, H, INK, label, ORANGE, puff, r, TOP, TRICKS, U, wrap, type Built, type Kind, type Scene, type Trick } from './kit.ts'
import { ANIME_BUILD } from './anime.ts'
import { ANIME2_BUILD } from './anime2.ts'

export { H, CW, TRICKS, clampX, type Built, type Kind, type Scene, type Trick }


function run(s: Scene, W: number): Built {
  const x0 = clampX(s.x, W)
  const x1 = clampX(s.to ?? s.x, W)
  // The Naruto run: twice as fast, leaning in, claws trailing behind.
  const naruto = s.kind === 'naruto'
  const d = Math.max(naruto ? 0.8 : 1.2, Math.abs(x1 - x0) / (naruto ? 260 : 130))
  // Turned around in place: every g scales about its own center (BASE).
  const flip = x1 < x0 ? 'transform="scale(-1,1)"' : ''
  const css = `
.mv{animation:mv ${d}s linear forwards}
@keyframes mv{from{transform:translateX(${x0}px)}to{transform:translateX(${x1}px)}}
.legA{animation:step .24s steps(1) infinite}.legB{animation:step .24s steps(1) infinite -.12s}
@keyframes step{0%{transform:translateY(-${U}px)}50%{transform:translateY(0)}}
.body{animation:bob .24s infinite}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
.dust{animation:dust .48s infinite}.dust2{animation:dust .48s infinite -.24s}
@keyframes dust{0%{opacity:.7;transform:translateX(0) scale(.6)}100%{opacity:0;transform:translateX(-14px) scale(1.4)}}${naruto ? `
.lean{transform:rotate(12deg);transform-origin:bottom}
.clawL{transform:translate(-6px,2px)}.clawR{transform:translate(-50px,6px)}
.legA{animation-duration:.14s}.legB{animation-duration:.14s;animation-delay:-.07s}
.sl{animation:sl .3s linear infinite}.sl2{animation:sl .3s linear infinite -.15s}
@keyframes sl{0%{opacity:.8;transform:translateX(0)}100%{opacity:0;transform:translateX(-18px)}}` : ''}`
  const body = `<g class="mv"><g transform="translate(0,${TOP})"><g ${flip}>`
    + `<circle class="dust" cx="-4" cy="${CH - 3}" r="3" fill="#c9c3bc"/><circle class="dust2" cx="-2" cy="${CH - 6}" r="2" fill="#c9c3bc"/>`
    + (naruto ? `<rect class="sl" x="-14" y="6" width="10" height="1.5" fill="#c9c3bc"/><rect class="sl2" x="-18" y="14" width="12" height="1.5" fill="#c9c3bc"/><rect class="sl" x="-12" y="22" width="8" height="1.5" fill="#c9c3bc"/>` : '')
    + `<g class="lean">${crab()}</g></g></g></g>`
  return { alt: naruto ? 'Claude crab doing the Naruto run' : 'Claude crab scuttling across', ms: d * 1000 + 300, ...wrap(W, css, body) }
}

function weights(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 12)
  const plates = (px: number) => `<rect x="${px}" y="2" width="5" height="16" fill="#5f5f66"/><rect x="${px + (px < 0 ? 4 : -3)}" y="5" width="4" height="10" fill="#80808a"/>`
  const css = `
.lift,.clawL,.clawR{animation:lift 1.6s ease-in-out infinite}
@keyframes lift{0%,15%,85%,100%{transform:translateY(0)}42%,62%{transform:translateY(-12px)}}
.body{animation:strain 1.6s ease-in-out infinite;transform-origin:bottom}
@keyframes strain{0%,15%,85%,100%{transform:scale(1,1)}42%,62%{transform:scale(1.05,.92)}}
.plus{animation:plus 1.6s infinite}
@keyframes plus{0%,45%{opacity:0;transform:translateY(0)}55%{opacity:1}80%,100%{opacity:0;transform:translateY(-8px)}}
.drop{animation:drop 3.2s infinite}
@keyframes drop{0%,40%{opacity:0;transform:translateY(0)}50%{opacity:1}75%,100%{opacity:0;transform:translateY(12px)}}`
  const bar = `<g class="lift"><rect x="-12" y="9" width="${CW + 24}" height="3" fill="#9a9aa3"/>${plates(-17)}${plates(CW + 12)}</g>`
  const body = at(x, crab() + bar + label(CW + 18, 4, '+1', 12, 'plus', '#2dd4bf') + `<path class="drop" d="M-4 2 q3 4 0 6 q-3 -2 0 -6z" fill="#5ab0ff"/>`)
  return { alt: 'Claude crab lifting weights', ms: 12800, ...wrap(W, css, body) }
}

function rasengan(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 84)
  const signs = ['Rat', 'Ox', 'Tiger']
  const css = `
.clawL{animation:clL 10s forwards}.clawR{animation:clR 10s forwards}
@keyframes clL{0%{transform:translate(0,0)}5%,31%{transform:translate(14px,-9px)}10%,20%{transform:translate(12px,-11px)}15%,25%{transform:translate(16px,-7px)}36%,100%{transform:translate(0,0)}}
@keyframes clR{0%{transform:translate(0,0)}5%,31%{transform:translate(-14px,-9px)}10%,20%{transform:translate(-16px,-7px)}15%,25%{transform:translate(-12px,-11px)}36%{transform:translate(0,0)}40%,86%{transform:translate(4px,-6px)}92%,100%{transform:translate(0,0)}}
${signs.map((_, i) => `.s${i}{opacity:0;animation:sign 10s forwards}.s${i}{animation-name:sign${i}}
@keyframes sign${i}{0%,${3 + i * 10}%{opacity:0}${4 + i * 10}%,${11 + i * 10}%{opacity:1}${12 + i * 10}%,100%{opacity:0}}`).join('\n')}
.ball{animation:ball 10s forwards}
@keyframes ball{0%,36%{opacity:0;transform:scale(0)}50%{opacity:1;transform:scale(1)}60%{transform:scale(.9)}70%{transform:scale(1.08)}86%{opacity:1;transform:scale(1)}96%,100%{opacity:0;transform:scale(1.7)}}
.spin{animation:spin .45s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.shout{opacity:0;animation:shout 10s forwards}
@keyframes shout{0%,48%{opacity:0;transform:scale(.4)}54%{opacity:1;transform:scale(1.15)}58%,86%{opacity:1;transform:scale(1)}92%,100%{opacity:0}}
.mvx{animation:thrust 10s forwards}
@keyframes thrust{0%,84%{transform:translateX(0)}89%{transform:translateX(10px)}96%,100%{transform:translateX(0)}}`
  const cx = CW + 10
  const ball = `<g class="ball"><circle cx="${cx}" cy="2" r="11" fill="#7fd3ff" opacity=".3"/><circle cx="${cx}" cy="2" r="7" fill="#d4f1ff"/>`
    + `<g class="spin"><path d="M${cx - 8} 2 A8 8 0 0 1 ${cx} -6" stroke="#2a9df4" stroke-width="1.8" fill="none"/><path d="M${cx + 8} 2 A8 8 0 0 1 ${cx} 10" stroke="#2a9df4" stroke-width="1.8" fill="none"/><path d="M${cx - 4} -2 A5 5 0 0 1 ${cx + 4} 6" stroke="#5ab0ff" stroke-width="1.4" fill="none"/></g></g>`
  const body = at(x, `<g class="mvx">${crab()}${ball}</g>`
    + signs.map((k, i) => label(CW + 16, 14, k, 11, `s${i}`)).join('')
    + label(CW + 58, 10, 'Rasengan!', 13, 'shout', '#2a9df4'))
  return { alt: 'Claude crab doing hand signs and a Rasengan', ms: 10000, ...wrap(W, css, body) }
}

function clones(s: Scene, W: number): Built {
  const x = clampX(s.x, W)
  const side = (dx: number) => (x + dx >= 8 && x + dx <= W - CW - 8 ? x + dx : x - dx * 2)
  const spots = [side(-60), side(60)].map(v => clampX(v, W))
  const css = `
.clawL{animation:cl 10s forwards}.clawR{animation:cr 10s forwards}
@keyframes cl{0%{transform:translate(0,0)}6%,24%{transform:translate(14px,-9px)}30%,100%{transform:translate(0,0)}}
@keyframes cr{0%{transform:translate(0,0)}6%,24%{transform:translate(-12px,-11px)}30%,100%{transform:translate(0,0)}}
.say{opacity:0;animation:say 10s forwards}
@keyframes say{0%,4%{opacity:0;transform:scale(.5)}9%,30%{opacity:1;transform:scale(1)}36%,100%{opacity:0}}
.puffA{opacity:0;animation:puff 10s forwards}.puffB{opacity:0;animation:puffB 10s forwards}
@keyframes puff{0%,26%{opacity:0;transform:scale(.2)}30%{opacity:1;transform:scale(1)}40%,100%{opacity:0;transform:scale(1.5)}}
@keyframes puffB{0%,84%{opacity:0;transform:scale(.2)}88%{opacity:1;transform:scale(1)}97%,100%{opacity:0;transform:scale(1.5)}}
.clone{opacity:0;animation:clone 10s forwards}
@keyframes clone{0%,29%{opacity:0}32%,86%{opacity:.75}89%,100%{opacity:0}}
.jump{animation:jump .7s ease-in-out infinite 3.2s}
@keyframes jump{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}`
  const one = (px: number, cls = '') => at(px, `<g class="${cls}"><g class="jump">${crab()}</g></g>`)
  const body = spots.map(px => one(px, 'clone')).join('') + one(x)
    + spots.map(px => puff(px + CW / 2, TOP + 14, 'puffA') + puff(px + CW / 2, TOP + 14, 'puffB')).join('')
    + label(x + CW / 2, TOP - 3, 'Shadow Clone Jutsu!', 11, 'say', '#D97757')
  return { alt: 'Claude crab doing the shadow clone jutsu', ms: 10000, ...wrap(W, css, body) }
}

function ball(s: Scene, W: number): Built {
  const x = clampX(s.x, W)
  const css = `
.hop{animation:hop .6s infinite}
@keyframes hop{0%,100%{transform:translateY(-2px)}20%,80%{transform:translateY(0)}}
.jx{animation:jx 1.2s ease-in-out infinite alternate}
@keyframes jx{from{transform:translateX(0)}to{transform:translateX(${CW}px)}}
.jy{animation:jy 1.2s infinite}
@keyframes jy{0%,100%{transform:translateY(0);animation-timing-function:ease-out}50%{transform:translateY(-14px);animation-timing-function:ease-in}}
.roll{animation:spin 1.2s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}`
  const beach = `<g class="jx"><g class="jy"><g class="roll"><circle cx="0" cy="4" r="6" fill="#f5b83d"/><path d="M-6 4 A6 6 0 0 0 6 4Z" fill="#e5533d"/><rect x="-6" y="3" width="12" height="2" fill="#fff"/></g></g></g>`
  const body = at(x, `<g class="hop">${crab()}</g>${beach}`)
  return { alt: 'Claude crab juggling a ball', ms: 10800, ...wrap(W, css, body) }
}

function dance(s: Scene, W: number): Built {
  const x = clampX(s.x, W)
  const css = `
.groove{animation:groove 1s ease-in-out infinite;transform-origin:bottom}
@keyframes groove{0%,100%{transform:translateX(-6px) rotate(-9deg)}25%,75%{transform:translateY(-7px)}50%{transform:translateX(6px) rotate(9deg)}}
.clawL{animation:up .5s steps(1) infinite}.clawR{animation:up .5s steps(1) infinite -.25s}
@keyframes up{0%{transform:translateY(-6px)}50%{transform:translateY(0)}}
.n0{animation:fadeup 2s infinite}.n1{animation:fadeup 2s infinite .7s}.n2{animation:fadeup 2s infinite 1.4s}`
  const body = at(x, `<g class="groove">${crab()}</g>`
    + label(-8, 4, '♪', 15, 'n0', '#a78bfa') + label(CW + 8, 4, '♫', 15, 'n1', '#f472b6') + label(CW + 18, 10, '♪', 13, 'n2', '#5ab0ff'))
  return { alt: 'Claude crab dancing', ms: 10000, ...wrap(W, css, body) }
}

function nap(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 20)
  const css = `
.legA,.legB{transform:translateY(-${2 * U}px)}
.body{animation:breathe 2.6s ease-in-out infinite;transform-origin:bottom}
@keyframes breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.03,1.07)}}
.z0{animation:zz 3s infinite}.z1{animation:zz 3s infinite 1s}.z2{animation:zz 3s infinite 2s}
@keyframes zz{0%{opacity:0;transform:translate(0,0)}20%{opacity:1}100%{opacity:0;transform:translate(14px,-12px)}}`
  const body = at(x, `<g transform="translate(0,${2 * U})">${crab(true)}</g>`
    + label(CW, 14, 'z', 11, 'z0') + label(CW + 4, 12, 'z', 13, 'z1') + label(CW + 8, 10, 'Z', 15, 'z2'))
  return { alt: 'Claude crab taking a nap', ms: 12000, ...wrap(W, css, body) }
}

/** A short break between tricks: sit, look around, or hum, for `s.ms`. */
function chill(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 16)
  const v = (s.variant ?? 0) % 3
  const css = [
    `.legA,.legB{transform:translateY(-${U}px)}
.sway{animation:sway 3.4s ease-in-out infinite;transform-origin:bottom}
@keyframes sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}`,
    `.eyes rect{animation:look 4.5s ease-in-out infinite}
@keyframes look{0%,18%,88%,100%{transform:translateX(0)}26%,44%{transform:translateX(-3px)}56%,74%{transform:translateX(3px)}}`,
    `.sway{animation:hum 1.2s ease-in-out infinite}
@keyframes hum{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
.legA{animation:tap .6s steps(1) infinite}
@keyframes tap{0%{transform:translateY(-2px)}50%{transform:translateY(0)}}
.n0{opacity:0;animation:fadeup 3s infinite .5s}.n1{opacity:0;animation:fadeup 3s infinite 2s}`,
  ][v]!
  const sunk = v === 0 ? ` transform="translate(0,${U})"` : ''
  const notes = v === 2 ? label(CW + 6, 8, '♪', 12, 'n0', '#a78bfa') + label(CW + 14, 12, '♫', 12, 'n1', '#5ab0ff') : ''
  const body = at(x, `<g${sunk}><g class="sway">${crab()}</g></g>${notes}`)
  const alt = ['Claude crab sitting and chilling', 'Claude crab looking around', 'Claude crab humming a tune'][v]!
  return { alt, ms: s.ms ?? 6000, ...wrap(W, css, body) }
}

/** Claude finished: a happy double jump and confetti. */
function done(s: Scene, W: number): Built {
  const x = clampX(s.x, W)
  const bits = CONFETTI.concat(CONFETTI).map((c, i) => {
    const dx = Math.round(Math.cos((i / 12) * Math.PI) * (26 + (i % 3) * 10))
    const up = 6 + ((i * 7) % 8)
    return `<rect class="cf${i}" x="${CW / 2 - 2}" y="6" width="4" height="${i % 2 ? 4 : 6}" fill="${c}" opacity="0"/>`
      + `<style>.cf${i}{animation:cf${i} 1.6s ease-out forwards ${(i % 4) * 0.05}s}@keyframes cf${i}{0%{opacity:1;transform:translate(0,0) rotate(0)}45%{opacity:1;transform:translate(${dx}px,-${up}px) rotate(200deg)}100%{opacity:0;transform:translate(${Math.round(dx * 1.3)}px,${12}px) rotate(420deg)}}</style>`
  }).join('')
  const css = `
.yay{animation:yay .7s ease-in-out 2}
@keyframes yay{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.clawL,.clawR{animation:cheer 1.4s forwards}
@keyframes cheer{0%,80%{transform:translateY(-8px)}100%{transform:translateY(0)}}
.word{animation:pop 3.6s forwards}
@keyframes pop{0%{opacity:0;transform:scale(.3)}12%{opacity:1;transform:scale(1.2)}20%,80%{opacity:1;transform:scale(1)}100%{opacity:0}}`
  const body = at(x, `<g class="yay">${crab()}</g>${bits}` + label(CW + 30, 16, 'done!', 14, 'word', '#2dd4bf'))
  return { alt: 'Claude crab celebrating: done!', ms: 3600, ...wrap(W, css, body) }
}

/** Claude is working: out comes the laptop, and the crab types until the turn ends. */
function work(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 76)
  const css = `
.lap{animation:pull .6s ease-out both;transform-origin:bottom}
@keyframes pull{from{opacity:0;transform:translateY(16px) scaleY(.2)}to{opacity:1;transform:none}}
.clawL{animation:tap .18s steps(1) infinite .6s}.clawR{animation:tap .18s steps(1) infinite .69s}
@keyframes tap{0%{transform:translate(0,${U + 3}px)}50%{transform:translate(0,${U}px)}}
.clawL,.clawR{transform:translate(0,${U}px)}
.glow{animation:glow 1.3s ease-in-out infinite .6s;opacity:0}
@keyframes glow{0%,100%{opacity:.05}50%{opacity:.14}}
.c0{opacity:0;animation:fadeup 2.4s infinite 1s}.c1{opacity:0;animation:fadeup 2.4s infinite 1.8s}.c2{opacity:0;animation:fadeup 2.4s infinite 2.6s}
.steam{animation:steam 2s ease-in-out infinite}.steam2{animation:steam 2s ease-in-out infinite -1s}
@keyframes steam{0%{opacity:0;transform:translateY(2px)}40%{opacity:.7}100%{opacity:0;transform:translateY(-8px)}}`
  const spark = (cx: number, cy: number) => [0, 45, 90, 135].map(a => `<rect x="${cx - 0.75}" y="${cy - 4}" width="1.5" height="8" fill="${ORANGE}" transform="rotate(${a} ${cx} ${cy})"/>`).join('')
  const laptop = `<g class="lap"><rect x="3" y="13" width="${CW - 6}" height="20" rx="2" fill="#d5d8dd" stroke="#9aa0a6" stroke-width="1"/>`
    + `${spark(CW / 2, 23)}<rect x="-2" y="32" width="${CW + 4}" height="3" rx="1" fill="#9aa0a6"/></g>`
  const mug = `<g transform="translate(${CW + 8},${CH - 10})"><rect x="0" y="0" width="9" height="10" rx="1" fill="#e9e3dc" stroke="#b9b2aa"/><path d="M9 2 h3 v5 h-3" fill="none" stroke="#b9b2aa" stroke-width="1.5"/>`
    + `<path class="steam" d="M3 -2 q-2 -3 0 -6" stroke="#c9c3bc" stroke-width="1.2" fill="none"/><path class="steam2" d="M6 -2 q2 -3 0 -6" stroke="#c9c3bc" stroke-width="1.2" fill="none"/></g>`
  const code = ['{ }', '&lt;/&gt;', '01'].map((t, i) => label(CW + 36 + i * 16, 16, t, 11, `c${i}`, ['#5ab0ff', '#a78bfa', '#2dd4bf'][i])).join('')
  const body = at(x, `${crab()}<rect class="glow" x="${U}" y="0" width="${9 * U}" height="13" fill="#9fd8ff"/>${laptop}${mug}${code}`)
  return { alt: 'Claude crab typing on a laptop', ms: 0, ...wrap(W, css, body) }
}


const BUILD: Record<Kind, (s: Scene, W: number) => Built> = { run, naruto: run, chill, weights, rasengan, clones, ball, dance, nap, done, work, ...ANIME_BUILD, ...ANIME2_BUILD }

/** Builds a scene laid out W wide and drawn k times bigger. */
export function build(s: Scene, W: number, k = 1): Built {
  const b = BUILD[s.kind](s, W)
  if (k === 1) return b
  return { ...b, source: b.source.replace(`width="${W}" height="${H}"`, `width="${Math.round(W * k)}" height="${Math.round(H * k)}"`) }
}

/** Where the crab is standing once a scene is over. */
export function spotOf(s: Scene): number {
  return s.kind === 'run' || s.kind === 'naruto' ? (s.to ?? s.x) : s.x
}

/** A new spot to run to, far enough away to be worth the trip. */
export function nextSpot(from: number, W: number, rand: () => number): number {
  const lo = 8
  const hi = Math.max(lo, W - CW - 60)
  for (let i = 0; i < 6; i++) {
    const to = lo + rand() * (hi - lo)
    if (Math.abs(to - from) >= Math.min(140, (hi - lo) / 3)) return Math.round(to)
  }
  return Math.round(from < (lo + hi) / 2 ? hi : lo)
}

/** A trick other than the last one. */
export function nextTrick(last: Kind | undefined, rand: () => number): Trick {
  const pool = TRICKS.filter(t => t !== last)
  return pool[Math.floor(rand() * pool.length) % pool.length]!
}

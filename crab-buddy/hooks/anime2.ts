/**
 * The second batch of anime tricks, in the same 48px lane as anime.ts: the
 * picture's top is local y -13, the ground local y 32. Every trick ends back
 * on the spot it started from.
 */

import { ANIME2, at, clampX, crab, CW, label, puff, wrap, type Built, type Scene } from './kit.ts'

type Anime2 = (typeof ANIME2)[number]

/** `@keyframes name`: hidden, shown from a% to b%, hidden again after. */
const vis = (name: string, a: number, b: number) =>
  `@keyframes ${name}{0%,${Math.max(0, a - 2)}%{opacity:0}${a}%,${b}%{opacity:1}${Math.min(100, b + 2)}%,100%{opacity:0}}`
/** A class shown from a% to b% of a scene `ms` long. */
const shown = (cls: string, a: number, b: number, ms: number) => `.${cls}{opacity:0;animation:${cls} ${ms / 1000}s forwards}${vis(cls, a, b)}`

const GOLD = '#f2c94c'
const PALE = '#e8e2da'

/** Points of a burst star around (cx, cy). */
const star = (cx: number, cy: number, R: number, r: number) => Array.from({ length: 16 }, (_, i) => {
  const a = (i * Math.PI) / 8
  const d = i % 2 ? r : R
  return `${(cx + Math.cos(a) * d).toFixed(1)},${(cy + Math.sin(a) * d).toFixed(1)}`
}).join(' ')

/** Spiky hair on the crab's head. */
const spikes = (fill: string) => `<polygon points="8,1 6,-9 14,-2 18,-13 24,-3 30,-12 32,-2 39,-8 37,1" fill="${fill}"/>`

function thunder(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 100)
  const L = Math.max(40, Math.min(130, W - x - CW - 16))
  const zig = Array.from({ length: Math.ceil(L / 10) + 1 }, (_, i) => `${CW / 2 + Math.min(i * 10, L)},${i % 2 ? 10 : 20}`).join(' ')
  const css = `
.dash{animation:dash 10s forwards}
@keyframes dash{0%,20%{transform:translate(0,0)}26%,42%{transform:translate(0,3px)}43%,70%{transform:translate(${L}px,0)}71%,100%{transform:translate(0,0)}}
.st1{opacity:0;animation:st1 10s forwards}@keyframes st1{0%,42%{opacity:0}43%{opacity:1}52%,100%{opacity:0}}
.st2{opacity:0;animation:st2 10s forwards}@keyframes st2{0%,70%{opacity:0}71%{opacity:1}80%,100%{opacity:0}}
${shown('spk', 24, 42, 10000)}
.zap{animation:zap .2s steps(2) infinite}@keyframes zap{50%{opacity:0}}
.zz{opacity:0;animation:zz 10s forwards}@keyframes zz{0%,1%{opacity:0}3%,24%{opacity:1}26%,80%{opacity:0}82%,100%{opacity:1}}
.z0{animation:fadeup 1.8s infinite}.z1{animation:fadeup 1.8s infinite .6s}.z2{animation:fadeup 1.8s infinite 1.2s}
${shown('tb', 22, 42, 10000)}
${shown('tf', 44, 66, 10000)}`
  const streak = (cls: string) => `<polyline class="${cls}" points="${zig}" stroke="${GOLD}" stroke-width="3" fill="none"/><polyline class="${cls}" points="${zig}" stroke="#fff6b0" stroke-width="1" fill="none"/>`
  const sparks = `<g class="spk">${[[-6, 6], [CW + 2, 4], [CW / 2, -6]].map(([a, b], i) => `<polyline class="zap" style="animation-delay:${i * 0.07}s" points="${a},${b} ${a! + 3},${b! + 4} ${a},${b! + 6} ${a! + 3},${b! + 10}" stroke="${GOLD}" stroke-width="1.4" fill="none"/>`).join('')}</g>`
  const hair = `<polygon points="8,1 10,-6 15,-1 21,-8 27,-1 33,-6 36,1" fill="${GOLD}"/>`
  const sword = `<rect x="-8" y="18" width="26" height="2.5" fill="#2b2b2b"/><rect x="18" y="17" width="1.5" height="4.5" fill="${GOLD}"/><rect x="19.5" y="18.2" width="8" height="2" fill="#f4f1ea"/>`
  const body = at(x, streak('st1') + streak('st2') + `<g class="dash">${crab(true)}${hair}${sword}${sparks}</g>`
    + `<g class="zz">${label(CW + 2, 2, 'z', 9, 'z0')}${label(CW + 6, 0, 'z', 11, 'z1')}${label(CW + 10, -2, 'Z', 12, 'z2')}</g>`
    + label(CW + 46, -2, 'Thunder Breathing…', 10, 'tb', GOLD) + label(CW / 2 + L / 2, -2, 'Thunderclap and Flash!', 11, 'tf', GOLD))
  return { alt: 'Claude crab doing Thunderclap and Flash in its sleep', ms: 10000, ...wrap(W, css, body) }
}

function domain(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 70)
  const stars = Array.from({ length: 22 }, (_, i) =>
    `<circle class="tk" style="animation-delay:${((i * 0.23) % 1.6).toFixed(2)}s" cx="${-x + 6 + ((i * 53) % Math.max(20, W - 12))}" cy="${-11 + ((i * 17) % 44)}" r="${i % 3 ? 0.8 : 1.3}" fill="#dfe8ff"/>`).join('')
  const css = `
.void{opacity:0;animation:void 11s forwards}
@keyframes void{0%,38%{opacity:0;transform:scale(0)}48%,86%{opacity:.95;transform:scale(1)}94%,100%{opacity:0;transform:scale(1)}}
${shown('vs', 46, 88, 11000)}
.tk{animation:tk 1.6s ease-in-out infinite}@keyframes tk{50%{opacity:.2}}
.ring{animation:spin 6s linear infinite}.ring2{animation:spin 9s linear infinite reverse}@keyframes spin{to{transform:rotate(360deg)}}
.fold{animation:fold 11s forwards}@keyframes fold{0%,26%{transform:translateY(0);opacity:1}32%{transform:translateY(-7px);opacity:1}38%,100%{transform:translateY(-7px);opacity:0}}
${shown('blue', 32, 92, 11000)}
.clawR{animation:sign 11s forwards}@keyframes sign{0%,34%{transform:translate(0,0)}38%,88%{transform:translate(-8px,-9px)}92%,100%{transform:translate(0,0)}}
${shown('de', 36, 50, 11000)}
${shown('iv', 52, 86, 11000)}`
  const rings = `<g class="ring"><circle cx="${CW / 2}" cy="16" r="24" fill="none" stroke="#7c5cff" stroke-width="1" stroke-dasharray="4 6"/></g>`
    + `<g class="ring2"><circle cx="${CW / 2}" cy="16" r="32" fill="none" stroke="#4fc3f7" stroke-width="1" stroke-dasharray="2 8"/></g>`
  const hair = `<polygon points="6,1 8,-7 13,-2 17,-11 23,-3 28,-10 32,-2 38,-7 38,1" fill="#f0f0f0"/>`
  const eye = (ex: number) => `<circle cx="${ex + 2}" cy="8" r="5" fill="#5ec8ff" opacity=".45"/><rect x="${ex}" y="4" width="4" height="8" fill="#8fe3ff"/><rect x="${ex + 1}" y="6" width="2" height="3" fill="#fff"/>`
  const body = at(x, `<circle class="void" cx="${CW / 2}" cy="16" r="${W + 40}" fill="#07051a"/><g class="vs">${rings}${stars}</g>`
    + crab() + hair + `<rect class="fold" x="4" y="3" width="36" height="9" fill="#111"/>` + `<g class="blue">${eye(12)}${eye(28)}</g>`
    + label(CW + 46, -2, 'Domain Expansion…', 10, 'de', '#8ab4ff') + label(CW + 44, 6, 'Infinite Void', 13, 'iv', '#cfe3ff'))
  return { alt: 'Claude crab using Domain Expansion: Infinite Void', ms: 11000, ...wrap(W, css, body) }
}

function onepunch(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 100)
  const G = Math.max(36, Math.min(80, W - x - CW - 40))
  const M = CW + G
  const reach = G - 8
  const roar = Array.from({ length: 10 }, (_, i) => `${12 + i * 2}%{opacity:1;transform:translateX(${i % 2 ? 1.5 : -1.5}px)}`).join('')
  const css = `
.mon{opacity:0;animation:mon 10s forwards}
@keyframes mon{0%,3%{opacity:0;transform:translateX(16px)}10%{opacity:1;transform:translateX(0)}${roar}32%,46%{opacity:1;transform:translate(0,0) rotate(0)}56%{opacity:.8;transform:translate(70px,-50px) rotate(220deg)}60%,100%{opacity:0;transform:translate(80px,-60px) rotate(260deg)}}
.walk{animation:walk 10s forwards}@keyframes walk{0%,34%{transform:translateX(0)}44%,70%{transform:translateX(${reach}px)}82%,100%{transform:translateX(0)}}
.clawR{animation:tap 10s forwards}@keyframes tap{0%,44%{transform:translate(0,0)}46%{transform:translate(7px,0)}49%,100%{transform:translate(0,0)}}
.cape{transform-origin:right top;animation:flap .8s ease-in-out infinite}@keyframes flap{50%{transform:skewY(4deg) scaleX(1.1)}}
.hit{opacity:0;animation:hit 10s forwards}@keyframes hit{0%,45%{opacity:0;transform:scale(.3)}47%{opacity:1;transform:scale(1.3)}54%,100%{opacity:0;transform:scale(1.6)}}
${shown('gr', 12, 32, 10000)}
${shown('yawn', 16, 34, 10000)}
${shown('op', 47, 60, 10000)}
${shown('ok', 60, 76, 10000)}`
  const monster = `<rect x="0" y="-4" width="34" height="36" rx="8" fill="#5b7f2a"/><polygon points="4,-2 2,-12 10,-4" fill="${PALE}"/><polygon points="30,-2 32,-12 24,-4" fill="${PALE}"/>`
    + `<rect x="7" y="4" width="6" height="4" fill="#ff3b30"/><rect x="21" y="4" width="6" height="4" fill="#ff3b30"/><rect x="6" y="14" width="22" height="8" fill="#2b0f0f"/>`
    + `<polyline points="6,14 9,18 12,14 15,18 18,14 21,18 24,14 27,18 28,14" fill="#f4f1ea"/><circle cx="26" cy="26" r="2" fill="#7e57c2"/><circle cx="8" cy="27" r="1.5" fill="#7e57c2"/>`
  const body = at(x, `<g class="walk"><g class="cape"><path d="M6 3 L-8 22 L-4 30 L8 28 Z" fill="#c62828"/></g>${crab()}</g>`
    + `<g transform="translate(${M},0)"><g class="mon">${monster}</g></g>`
    + `<g class="hit"><polygon points="${star(M, 12, 11, 4)}" fill="${GOLD}"/></g>`
    + label(M + 17, -4, 'GRAAAH!', 11, 'gr', '#7cb342') + label(CW / 2, -4, '*yawn*', 10, 'yawn')
    + label(M, -4, 'ONE PUNCH!', 12, 'op', '#c62828') + label(CW / 2 + reach, -4, 'OK.', 12, 'ok', PALE))
  return { alt: 'Claude crab beating a monster with one punch', ms: 10000, ...wrap(W, css, body) }
}

function smash(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 110)
  const L = Math.max(50, Math.min(130, W - x - CW - 12))
  const GREEN = '#4ade80'
  const css = `
${shown('ofa', 8, 78, 10000)}
.zap{animation:zap .18s steps(2) infinite}@keyframes zap{50%{opacity:0}}
.crouch{animation:crouch 10s forwards}@keyframes crouch{0%,8%{transform:translateY(0)}14%,40%{transform:translateY(2px)}44%,100%{transform:translateY(0)}}
.clawR{animation:smash 10s forwards}@keyframes smash{0%,28%{transform:translate(0,0)}36%,40%{transform:translate(-7px,1px)}43%,64%{transform:translate(12px,-1px)}70%,100%{transform:translate(0,0)}}
.blast{opacity:0;transform-origin:left center;animation:blast 10s forwards}@keyframes blast{0%,41%{opacity:0;transform:scaleX(0)}46%{opacity:1;transform:scaleX(1)}64%{opacity:.8;transform:scaleX(1)}74%,100%{opacity:0;transform:scaleX(1)}}
.a0,.a1,.a2{opacity:0;animation:arc 10s forwards}.a1{animation-delay:.25s}.a2{animation-delay:.5s}
@keyframes arc{0%,42%{opacity:0;transform:translateX(0)}44%{opacity:1}62%,100%{opacity:0;transform:translateX(${L}px)}}
${shown('ofl', 12, 40, 10000)}
.ds{opacity:0;animation:ds 10s forwards}@keyframes ds{0%,42%{opacity:0;transform:scale(.4)}46%{opacity:1;transform:scale(1.2)}50%,72%{opacity:1;transform:scale(1)}76%,100%{opacity:0}}`
  const zaps = `<g class="ofa">${[[-8, 4], [-4, 18], [CW + 4, 2], [CW + 2, 20], [CW / 2 - 4, -8]].map(([a, b], i) => `<polyline class="zap" style="animation-delay:${(i * 0.05).toFixed(2)}s" points="${a},${b} ${a! + 4},${b! + 3} ${a! + 1},${b! + 6} ${a! + 5},${b! + 10}" stroke="${GREEN}" stroke-width="1.4" fill="none"/>`).join('')}</g>`
  const blast = `<g class="blast">${[2, 8, 14, 20].map((by, i) => `<rect x="${CW + 6}" y="${by}" width="${L - i * 8}" height="1.5" fill="#eafff0" opacity=".8"/>`).join('')}</g>`
  const arcs = [0, 1, 2].map(i => `<path class="a${i}" d="M${CW + 10} -6 Q${CW + 20} 12 ${CW + 10} 30" stroke="#d1fae5" stroke-width="2" fill="none"/>`).join('')
  const body = at(x, `<g class="crouch">${crab()}${zaps}</g>` + blast + arcs
    + label(CW + 48, -2, 'One For All… 100%!', 10, 'ofl', GREEN) + label(CW + L / 2 + 6, -2, 'DETROIT SMASH!', 13, 'ds', '#22c55e'))
  return { alt: 'Claude crab throwing a Detroit Smash', ms: 10000, ...wrap(W, css, body) }
}

function jajanken(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 70)
  const NEN = '#ffd166'
  const words: Array<[string, number, number]> = [['Rock…', 8, 22], ['Paper…', 23, 37], ['Scissors…', 38, 54]]
  const css = `
.clawR,.fist{animation:jab 10s forwards}
@keyframes jab{0%,6%{transform:translate(0,0)}10%,56%{transform:translate(-5px,2px)}60%,76%{transform:translate(16px,-1px)}84%,100%{transform:translate(0,0)}}
.grow{animation:grow 10s forwards}@keyframes grow{0%,8%{opacity:0;transform:scale(.3)}56%{opacity:1;transform:scale(1.4)}60%,76%{opacity:1;transform:scale(1.7)}84%,100%{opacity:0;transform:scale(.3)}}
.pulse{animation:pulse .35s ease-in-out infinite}@keyframes pulse{50%{transform:scale(1.15)}}
${shown('aura', 10, 80, 10000)}
.flick{animation:flick .2s steps(2) infinite}@keyframes flick{50%{opacity:.5}}
${words.map((w, i) => shown(`w${i}`, w[1], w[2], 10000)).join('\n')}
.rk{opacity:0;animation:rk 10s forwards}@keyframes rk{0%,58%{opacity:0;transform:scale(.4)}61%{opacity:1;transform:scale(1.3)}64%,80%{opacity:1;transform:scale(1)}84%,100%{opacity:0}}
.boom{opacity:0;animation:boom 10s forwards}@keyframes boom{0%,59%{opacity:0;transform:scale(.3)}61%{opacity:1;transform:scale(1.2)}68%,100%{opacity:0;transform:scale(1.7)}}`
  const fist = `<g class="fist"><g class="grow"><g class="pulse"><circle cx="42" cy="12" r="5" fill="${NEN}" opacity=".55"/><circle cx="42" cy="12" r="2.5" fill="#fff6d5"/></g></g></g>`
  const body = at(x, `<g class="aura"><ellipse class="flick" cx="${CW / 2}" cy="16" rx="30" ry="20" fill="none" stroke="${NEN}" stroke-width="1.5" opacity=".7"/></g>`
    + crab() + spikes('#1a1a1a') + fist + `<g class="boom"><polygon points="${star(CW + 22, 12, 10, 4)}" fill="${NEN}"/></g>`
    + words.map((w, i) => label(CW + 34, -2, w[0], 10, `w${i}`, '#f2b705')).join('') + label(CW + 36, 4, 'ROCK!!', 14, 'rk', '#f59e0b'))
  return { alt: 'Claude crab doing Jajanken: Rock!', ms: 10000, ...wrap(W, css, body) }
}

function chainsaw(s: Scene, W: number): Built {
  const x = Math.max(26, clampX(s.x, W, 40))
  const css = `
.clawL{animation:pull 10s forwards}@keyframes pull{0%,4%{transform:translate(0,0)}10%,14%{transform:translate(16px,-12px)}19%{transform:translate(4px,-13px)}24%,100%{transform:translate(0,0)}}
.cord{opacity:0;animation:cord 10s forwards}@keyframes cord{0%,8%{opacity:0;transform:translate(0,0)}10%,14%{opacity:1;transform:translate(0,0)}19%{opacity:1;transform:translate(-12px,-1px)}22%,100%{opacity:0;transform:translate(0,0)}}
.saw{opacity:0;animation:saw 10s forwards}@keyframes saw{0%,20%{opacity:0;transform:scale(.3)}24%{opacity:1;transform:scale(1.15)}27%,84%{opacity:1;transform:scale(1)}90%,100%{opacity:0;transform:scale(.3)}}
.chain{stroke-dasharray:2 2;animation:chain .12s linear infinite}@keyframes chain{to{stroke-dashoffset:4}}
.spin{animation:twirl .45s linear 9 3.4s}@keyframes twirl{0%,100%{transform:scaleX(1)}50%{transform:scaleX(-1)}}
.shake{animation:shake .1s steps(2) infinite}@keyframes shake{50%{transform:translateY(1px)}}
${shown('pl', 10, 21, 10000)}
${shown('vr', 24, 84, 10000)}
${shown('sm', 24, 86, 10000)}
.p0{animation:fadeup 1s infinite}.p1{animation:fadeup 1s infinite .5s}`
  const chain = (x1: number, y1: number, x2: number, y2: number) => `<line class="chain" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#4b4f56" stroke-width="1.2"/>`
  const bar = (bx: number, by: number, w: number, h: number) => `<rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="1" fill="#b8bcc4"/>`
  const saws = bar(19, -12, 6, 12) + chain(19, -12, 19, 0) + chain(25, -12, 25, 0)
    + bar(-18, 9.5, 18, 5) + chain(-18, 9.5, 0, 9.5) + chain(-18, 14.5, 0, 14.5)
    + bar(44, 9.5, 18, 5) + chain(44, 9.5, 62, 9.5) + chain(44, 14.5, 62, 14.5)
  const cord = `<g class="cord"><line x1="22" y1="0" x2="22" y2="-8" stroke="#555" stroke-width="1"/><rect x="18" y="-11" width="8" height="3" rx="1" fill="#c62828"/></g>`
  const body = at(x, `<g class="sm"><circle class="p0" cx="-4" cy="2" r="2.5" fill="#9e9e9e"/><circle class="p1" cx="0" cy="-2" r="2" fill="#9e9e9e"/></g>`
    + `<g class="spin">${crab()}<g class="saw"><g class="shake">${saws}</g></g></g>` + cord
    + label(CW + 14, -4, '*pull*', 10, 'pl') + label(CW + 44, -2, 'VRRRRMM!', 12, 'vr', '#f97316'))
  return { alt: 'Claude crab turning into Chainsaw Man', ms: 10000, ...wrap(W, css, body) }
}

function deathnote(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 110)
  const scrib = Array.from({ length: 14 }, (_, i) => `${8 + i * 3}%{transform:translate(${i % 2 ? 2 : -1}px,${i % 2 ? 1 : 0}px)}`).join('')
  const laugh = Array.from({ length: 16 }, (_, i) => `${56 + i * 2}%{transform:translateY(${i % 2 ? -1.5 : 0}px)}`).join('')
  const css = `
.clawR{animation:wr 11s forwards}@keyframes wr{0%,6%{transform:translate(0,0)}${scrib}50%,100%{transform:translate(0,0)}}
.book{animation:book 11s forwards}@keyframes book{0%,48%{opacity:1}52%,100%{opacity:0}}
.ink{stroke-dasharray:40;stroke-dashoffset:40;animation:ink 11s forwards}@keyframes ink{0%,8%{stroke-dashoffset:40}46%,100%{stroke-dashoffset:0}}
.chip{opacity:0;animation:chip 11s forwards}@keyframes chip{0%,40%{opacity:0;transform:translate(0,0)}42%{opacity:1;transform:translate(0,0)}48%{opacity:1;transform:translate(-14px,-4px)}50%,100%{opacity:0;transform:translate(-14px,-4px)}}
.lg{animation:lg 11s forwards}@keyframes lg{0%,54%{transform:translateY(0)}${laugh}88%,100%{transform:translateY(0)}}
${shown('red', 56, 90, 11000)}
${shown('c1', 26, 38, 11000)}
${shown('c2', 40, 52, 11000)}
${shown('h1', 56, 64, 11000)}
${shown('h2', 65, 72, 11000)}
${shown('h3', 74, 92, 11000)}
.apple{animation:apple 11s linear forwards}@keyframes apple{0%,10%{opacity:0;transform:translate(0,0)}14%,86%{opacity:1}92%,100%{opacity:0;transform:translate(${-(W - 30)}px,0)}}
.bob{animation:bob 1.2s ease-in-out infinite}@keyframes bob{50%{transform:translateY(3px)}}`
  const book = `<g class="book"><rect x="40" y="6" width="17" height="19" rx="1" fill="#111" stroke="#444" stroke-width=".6"/><text x="48.5" y="10.8" font-size="4.2" fill="#f4f1ea" text-anchor="middle">DEATH NOTE</text>`
    + `<rect x="42" y="13" width="13" height="10" fill="#f4f1ea"/><path class="ink" d="M43 15 h10 M43 17 h9 M43 19 h10 M43 21 h6" stroke="#222" stroke-width=".7" fill="none"/></g>`
  const apple = `<g transform="translate(${W - x - 14},-8)"><g class="apple"><g class="bob"><circle cx="0" cy="0" r="3.5" fill="#d62828"/><rect x="-0.5" y="-5.5" width="1" height="2.5" fill="#5d4037"/><path d="M0.5 -4 q3 -2 4 0 q-2 1.5 -4 0z" fill="#4caf50"/></g></g></g>`
  const red = `<g class="red"><rect x="12" y="4" width="4" height="8" fill="#ff1a1a"/><rect x="28" y="4" width="4" height="8" fill="#ff1a1a"/></g>`
  const body = at(x, `<g class="lg">${crab()}${red}</g>` + book + `<ellipse class="chip" cx="40" cy="8" rx="2.5" ry="1.8" fill="${GOLD}"/>` + apple
    + label(CW + 56, -2, "I'll take a potato chip…", 9, 'c1', PALE) + label(CW + 40, -2, '…and EAT IT!', 11, 'c2', PALE)
    + label(CW + 12, -2, 'Ha…', 10, 'h1', '#d62828') + label(CW + 18, -2, 'ha ha…', 10, 'h2', '#d62828') + label(CW + 28, 0, 'HAHAHA!', 13, 'h3', '#d62828'))
  return { alt: 'Claude crab writing in a Death Note', ms: 11000, ...wrap(W, css, body) }
}

function fusion(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 80)
  const gap = 24
  const D = CW + gap
  const step = gap / 2 - 1
  const mid = CW + gap / 2
  const css = `
.me{animation:me 12s forwards}@keyframes me{0%,10%{transform:translate(0,0) rotate(0)}30%{transform:translate(${step / 2}px,0)}48%{transform:translate(${step}px,0)}52%,58%{transform:translate(${step}px,0) rotate(8deg)}62%,88%{transform:translate(${step}px,0) rotate(0)}96%,100%{transform:translate(0,0)}}
.yu{opacity:0;animation:yu 12s forwards}@keyframes yu{0%,2%{opacity:0;transform:translate(0,0) rotate(0)}8%,10%{opacity:1;transform:translate(0,0)}30%{opacity:1;transform:translate(${step / 2}px,0)}48%{opacity:1;transform:translate(${step}px,0)}52%,58%{opacity:1;transform:translate(${step}px,0) rotate(8deg)}60%,100%{opacity:0;transform:translate(${step}px,0) rotate(8deg)}}
.clawL{animation:fl 12s forwards}@keyframes fl{0%,10%{transform:translate(0,0)}14%,30%{transform:translate(-4px,-8px)}34%,48%{transform:translate(8px,-6px)}52%,100%{transform:translate(0,0)}}
.clawR{animation:fr 12s forwards}@keyframes fr{0%,10%{transform:translate(0,0)}14%,30%{transform:translate(-8px,-6px)}34%,48%{transform:translate(4px,-8px)}52%,58%{transform:translate(5px,-2px)}62%,100%{transform:translate(0,0)}}
.legB{animation:knee 12s forwards}@keyframes knee{0%,32%{transform:translateY(0)}36%,46%{transform:translateY(-5px)}50%,100%{transform:translateY(0)}}
.fx{opacity:0;animation:fx 12s forwards}@keyframes fx{0%,57%{opacity:0;transform:scale(.3)}60%{opacity:.95;transform:scale(1)}68%,100%{opacity:0;transform:scale(1.3)}}
.pin{opacity:0;animation:pin 12s forwards}@keyframes pin{0%{opacity:0;transform:scale(.4)}3%{opacity:1;transform:scale(1.1)}9%,100%{opacity:0;transform:scale(1.4)}}
.hA{animation:hA 12s forwards}@keyframes hA{0%,59%{opacity:1}61%,100%{opacity:0}}
${shown('hB', 61, 98, 12000)}
${shown('gk', 62, 92, 12000)}
.flick{animation:flick .16s steps(2) infinite}@keyframes flick{50%{opacity:.55}}
${shown('f1', 12, 30, 12000)}
${shown('f2', 32, 48, 12000)}
${shown('f3', 50, 58, 12000)}
${shown('fd', 64, 90, 12000)}`
  // Trunks' lilac bowl cut on the partner; Gotenks' two-tone spikes after the fusion.
  const trunks = `<rect x="6" y="-4" width="32" height="5" rx="2" fill="#b39ddb"/><rect x="6" y="1" width="4" height="4" fill="#b39ddb"/><rect x="34" y="1" width="4" height="4" fill="#b39ddb"/>`
  const gotenks = `<polygon points="8,1 4,-10 13,-3 15,-13 22,-4 27,-13 30,-3 40,-10 36,1" fill="#1a1a1a"/><polygon points="13,-3 15,-13 22,-4 27,-13 30,-3 22,0" fill="#7e57c2"/>`
  const body = at(x, puff(D + CW / 2, 16, 'pin')
    + `<g style="transform-origin:0 0" transform="translate(${D + CW},0) scale(-1,1)"><g class="yu">${crab()}${trunks}</g></g>`
    + `<g class="me"><g class="gk"><ellipse class="flick" cx="${CW / 2}" cy="16" rx="30" ry="21" fill="none" stroke="#ffe680" stroke-width="2"/></g>${crab()}<g class="hA">${spikes('#1a1a1a')}</g><g class="hB">${gotenks}</g></g>`
    + `<circle class="fx" cx="${mid}" cy="14" r="26" fill="#fff6c8"/>`
    + label(mid, -4, 'FU…', 12, 'f1', GOLD) + label(mid, -4, '…SION…', 12, 'f2', GOLD) + label(mid, -2, 'HA!', 14, 'f3', GOLD)
    + label(mid + 10, -4, 'Fusion complete!', 11, 'fd', GOLD))
  return { alt: 'Claude crab doing the fusion dance', ms: 12000, ...wrap(W, css, body) }
}

function noface(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 80)
  const D = CW + Math.max(34, Math.min(56, W - x - CW - 30))
  const no = Array.from({ length: 6 }, (_, i) => `${46 + i * 2}%{transform:rotate(${i % 2 ? 6 : -6}deg)}`).join('')
  const css = `
.nf{opacity:0;animation:nf 11s forwards}@keyframes nf{0%,4%{opacity:0}14%,74%{opacity:.92}88%,100%{opacity:0}}
.arm{transform-origin:right center;animation:arm 11s forwards}@keyframes arm{0%,16%{transform:scaleX(0)}22%,62%{transform:scaleX(1)}68%,100%{transform:scaleX(0)}}
.gold{opacity:0;animation:gold 11s forwards}@keyframes gold{0%,21%{opacity:0;transform:translateY(0)}24%,61%{opacity:1;transform:translateY(0)}68%,100%{opacity:0;transform:translateY(14px)}}
.glint{animation:tk 1s ease-in-out infinite}@keyframes tk{50%{opacity:.3}}
.lean{animation:lean 11s forwards}@keyframes lean{0%,28%{transform:translate(0,0)}34%,40%{transform:translate(4px,0)}44%{transform:translate(0,0)}${no}58%,100%{transform:rotate(0)}}
.mask{animation:tilt 11s forwards}@keyframes tilt{0%,64%{transform:rotate(0)}68%,100%{transform:rotate(-12deg)}}
.clawR{animation:wave 11s forwards}@keyframes wave{0%,78%{transform:translate(0,0)}80%,84%,88%{transform:translate(1px,-8px)}82%,86%,90%{transform:translate(3px,-5px)}93%,100%{transform:translate(0,0)}}
${shown('ahh', 16, 40, 11000)}
${shown('ex', 30, 40, 11000)}
${shown('no', 44, 64, 11000)}
${shown('sad', 66, 78, 11000)}
${shown('bye', 80, 94, 11000)}`
  const mask = `<g class="mask"><ellipse cx="11" cy="-2" rx="5" ry="6.5" fill="#f5f3ee"/><rect x="8.3" y="-4" width="1.6" height="1.6" fill="#111"/><rect x="12.3" y="-4" width="1.6" height="1.6" fill="#111"/>`
    + `<rect x="8.5" y="-6.8" width="1.2" height="1.8" fill="#7e57c2"/><rect x="12.5" y="-6.8" width="1.2" height="1.8" fill="#7e57c2"/><rect x="8.5" y="-1.8" width="1.2" height="2.2" fill="#7e57c2"/><rect x="12.5" y="-1.8" width="1.2" height="2.2" fill="#7e57c2"/>`
    + `<rect x="9.8" y="1.6" width="2.4" height=".8" fill="#111"/></g>`
  const gold = `<g class="gold">${[[-11, 10], [-7, 9], [-9, 7]].map(([gx, gy], i) => `<circle class="glint" style="animation-delay:${i * 0.3}s" cx="${gx}" cy="${gy}" r="1.8" fill="${GOLD}"/>`).join('')}</g>`
  const figure = `<path d="M2 32 C0 14 2 -2 11 -10 C20 -2 22 14 20 32 Z" fill="#141414"/><g class="arm"><rect x="-10" y="12" width="13" height="2.5" rx="1" fill="#141414"/></g>${gold}${mask}`
  const body = at(x, `<g class="lean">${crab()}</g>` + `<g transform="translate(${D},0)"><g class="nf">${figure}</g></g>`
    + label(D - 16, 2, 'Ah… ah…', 10, 'ahh', '#9e9e9e') + label(CW / 2, -4, '!', 13, 'ex', GOLD) + label(CW / 2 + 6, -4, 'No thanks!', 11, 'no', PALE)
    + label(D - 8, 2, '…', 12, 'sad', '#9e9e9e') + label(CW + 10, -2, 'Bye!', 10, 'bye'))
  return { alt: 'Claude crab saying no thanks to No-Face', ms: 11000, ...wrap(W, css, body) }
}

function odm(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 100)
  const L = Math.max(40, Math.min(130, W - x - CW - 12))
  type At = [number, number, number]
  // Where the crab is, as an offset from its spot, through the swing out and back.
  const out: At[] = [[20, 0, 0], [26, 0.2 * L, -6], [32, 0.45 * L, -11], [38, 0.7 * L, -11], [44, 0.9 * L, -5], [48, L, 0]]
  const back: At[] = [[64, L, 0], [70, 0.8 * L, -6], [76, 0.55 * L, -11], [82, 0.3 * L, -11], [88, 0.1 * L, -5], [92, 0, 0]]
  const mv = `@keyframes mv{0%,20%{transform:translate(0,0)}${[...out, ...back].map(([t, px, py]) => `${t}%{transform:translate(${px.toFixed(1)}px,${py}px)}`).join('')}100%{transform:translate(0,0)}}`
  // A cable runs from the hook on the crab's back (22, 2) to an anchor at the top edge.
  const aim = (px: number, py: number, ax: number) => {
    const dx = ax - (22 + px)
    const dy = -13 - (2 + py)
    return `rotate(${((Math.atan2(dy, dx) * 180) / Math.PI).toFixed(1)}deg) scaleX(${Math.hypot(dx, dy).toFixed(1)})`
  }
  const cable = (name: string, ax: number, shoot: number, seg: At[], off: number) => {
    const [, sx, sy] = seg[0]!
    const [, lx, ly] = seg[seg.length - 1]!
    const zero = aim(sx, sy, ax).replace(/scaleX\([^)]*\)/, 'scaleX(0)')
    return `.${name}{opacity:0;animation:${name} 11s forwards}@keyframes ${name}{0%,${shoot}%{opacity:0;transform:${zero}}${shoot + 1}%{opacity:1;transform:${zero}}`
      + seg.map(([t, px, py]) => `${t}%{opacity:1;transform:${aim(px, py, ax)}}`).join('') + `${off}%,100%{opacity:0;transform:${aim(lx, ly, ax)}}}`
  }
  const css = `
.mv{animation:mv 11s forwards}${mv}
.cb1,.cb2{transform-box:view-box;transform-origin:0 0}
${cable('cb1', 22 + 0.6 * L, 14, out.slice(0, 5), 46)}
${cable('cb2', 22 + 0.4 * L, 58, back.slice(0, 5), 90)}
.gasw{opacity:0;animation:gasw 11s forwards}@keyframes gasw{0%,19%{opacity:0}21%,47%{opacity:1}49%,63%{opacity:0}65%,91%{opacity:1}93%,100%{opacity:0}}
.g0{animation:fadeup .8s infinite}.g1{animation:fadeup .8s infinite .4s}
.cape{transform-origin:right top;animation:flap .6s ease-in-out infinite}@keyframes flap{50%{transform:skewY(5deg) scaleX(1.12)}}
${shown('sas', 50, 62, 11000)}`
  const gear = `<rect x="-3" y="12" width="5" height="8" rx="1" fill="#9aa3ad"/><rect x="42" y="12" width="5" height="8" rx="1" fill="#9aa3ad"/>`
  const cables = `<g transform="translate(22,2)"><line class="cb1" x1="0" y1="0" x2="1" y2="0" stroke="#d7dbe0" stroke-width="1"/><line class="cb2" x1="0" y1="0" x2="1" y2="0" stroke="#d7dbe0" stroke-width="1"/></g>`
  const gas = `<g class="gasw"><circle class="g0" cx="-4" cy="14" r="2.2" fill="#e8e2da"/><circle class="g1" cx="-6" cy="18" r="1.8" fill="#e8e2da"/></g>`
  const body = at(x, `<g class="mv">${cables}<g class="cape"><path d="M6 4 L-6 24 L8 28 Z" fill="#2e7d32"/></g>${crab()}${gear}${gas}</g>`
    + label(CW / 2 + L - 10, -4, 'Dedicate your hearts!', 10, 'sas', PALE))
  return { alt: 'Claude crab swinging on ODM gear', ms: 11000, ...wrap(W, css, body) }
}

export const ANIME2_BUILD: Record<Anime2, (s: Scene, W: number) => Built> = { thunder, domain, onepunch, smash, jajanken, chainsaw, deathnote, fusion, noface, odm }

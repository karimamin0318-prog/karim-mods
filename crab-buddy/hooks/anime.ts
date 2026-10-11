/**
 * The anime tricks. Each is one SVG with CSS animation, sized for the crab's
 * lane in the context row: 48px tall, so nothing reaches above the crab by more
 * than its hat or hair (local y -13 is the top of the picture).
 */

import { ANIME, at, clampX, crab, CW, label, ORANGE, puff, r, wrap, type Built, type Scene } from './kit.ts'

type Anime = (typeof ANIME)[number]

/** `@keyframes name`: hidden, shown from a% to b%, hidden again after. */
const vis = (name: string, a: number, b: number) =>
  `@keyframes ${name}{0%,${Math.max(0, a - 2)}%{opacity:0}${a}%,${b}%{opacity:1}${Math.min(100, b + 2)}%,100%{opacity:0}}`

const GOLD = '#f2c94c'
const PURPLE = '#a855f7'
const BLUSH = '#ff8fa3'
const blush = (cls: string) => `<g class="${cls}">${r(2, 3, 1.5, 0.75, BLUSH)}${r(7.5, 3, 1.5, 0.75, BLUSH)}</g>`
const sparkle = (x: number, y: number, cls: string, fill = GOLD, size = 11) => label(x, y, '✦', size, cls, fill)

function kamehameha(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 110)
  const len = Math.max(40, W - x - CW - 12)
  const syl = ['Ka', 'me', 'ha', 'me…']
  const css = `
.clawL{animation:kL 10s forwards}.clawR{animation:kR 10s forwards}
@keyframes kL{0%{transform:translate(0,0)}8%,46%{transform:translate(38px,5px)}50%,84%{transform:translate(42px,1px)}92%,100%{transform:translate(0,0)}}
@keyframes kR{0%{transform:translate(0,0)}8%,46%{transform:translate(-2px,-4px)}50%,84%{transform:translate(2px,0)}92%,100%{transform:translate(0,0)}}
.orb{opacity:0;animation:orb 10s forwards}
@keyframes orb{0%,8%{opacity:0;transform:scale(.2)}20%{opacity:1;transform:scale(.6)}46%{opacity:1;transform:scale(1.25)}50%,100%{opacity:0;transform:scale(.5)}}
.pulse{animation:pulse .3s ease-in-out infinite}
@keyframes pulse{50%{transform:scale(1.15)}}
.beam{opacity:0;animation:beam 10s forwards;transform-origin:left}
@keyframes beam{0%,48%{opacity:0;transform:scaleX(0)}52%{opacity:1;transform:scaleX(.6)}58%,82%{opacity:1;transform:scaleX(1)}90%,100%{opacity:0;transform:scaleX(1)}}
.jit{animation:jit .1s steps(2) infinite}
@keyframes jit{50%{transform:translateY(1px)}}
${syl.map((_, i) => `.y${i}{opacity:0;animation:y${i} 10s forwards}${vis(`y${i}`, 12 + i * 8, 46)}`).join('\n')}
.ha{opacity:0;animation:ha 10s forwards}${vis('ha', 50, 82)}`
  const orb = `<g class="orb"><g class="pulse"><circle cx="${CW + 6}" cy="12" r="9" fill="#5ab0ff" opacity=".35"/><circle cx="${CW + 6}" cy="12" r="5.5" fill="#bfe9ff"/><circle cx="${CW + 6}" cy="12" r="2.5" fill="#fff"/></g></g>`
  const beam = `<g class="beam"><g class="jit"><rect x="${CW + 2}" y="6" width="${len}" height="12" rx="6" fill="#7fd3ff" opacity=".45"/><rect x="${CW + 2}" y="9" width="${len}" height="6" rx="3" fill="#eaf8ff"/><circle cx="${CW + 2 + len}" cy="12" r="7" fill="#bfe9ff"/></g></g>`
  const body = at(x, crab() + orb + beam
    + syl.map((t, i) => label(CW + 16 + i * 21, -2, t, 10, `y${i}`, '#5ab0ff')).join('')
    + label(CW / 2, -2, 'HA!', 12, 'ha', '#2a9df4'))
  return { alt: 'Claude crab firing a Kamehameha', ms: 10000, ...wrap(W, css, body) }
}

function saiyan(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 24)
  // A shake while powering up: little jolts from 4% to 28%.
  const jolts = Array.from({ length: 12 }, (_, i) => `${4 + i * 2}%{transform:translateX(${i % 2 ? 1.5 : -1.5}px)}`).join('')
  const css = `
.pow{animation:pow 10s forwards}
@keyframes pow{0%,3%{transform:translateX(0)}${jolts}30%,100%{transform:translateX(0)}}
.aura{opacity:0;animation:aura 10s forwards}
@keyframes aura{0%,24%{opacity:0;transform:scale(.6)}30%{opacity:.9;transform:scale(1.12)}36%,86%{opacity:.7;transform:scale(1)}94%,100%{opacity:0}}
.flick{animation:flick .16s steps(2) infinite}
@keyframes flick{50%{opacity:.55}}
.gold{opacity:0;animation:gold 10s forwards}${vis('gold', 30, 90)}
.zap{opacity:0;animation:zap .5s steps(2) infinite 3s}
@keyframes zap{50%{opacity:1}}`
  const hair = `<polygon points="6,2 7,-10 13,-1 17,-13 22,-2 27,-13 31,-1 37,-10 38,2" fill="${GOLD}"/>`
  const gold = `<g class="gold">${hair}${r(1, 0, 9, 5, GOLD)}${r(0, 2, 1, 2, GOLD)}${r(10, 2, 1, 2, GOLD)}`
    + `${[2, 4, 6, 8].map(l => r(l, 5, 1, 3, GOLD)).join('')}${r(3, 1, 1, 2, '#138a7e')}${r(7, 1, 1, 2, '#138a7e')}</g>`
  const zap = (zx: number, zy: number) => `<polyline class="zap" points="${zx},${zy} ${zx + 3},${zy + 5} ${zx},${zy + 7} ${zx + 3},${zy + 12}" stroke="#fff6b0" stroke-width="1.4" fill="none"/>`
  const body = at(x, `<g class="aura"><ellipse class="flick" cx="${CW / 2}" cy="16" rx="32" ry="22" fill="none" stroke="#ffe680" stroke-width="2.5"/><ellipse class="flick" cx="${CW / 2}" cy="17" rx="27" ry="18" fill="none" stroke="#fff6b0" stroke-width="1.2"/></g>`
    + `<g class="pow">${crab()}${gold}</g>${zap(-8, 2)}${zap(CW + 5, 8)}`)
  return { alt: 'Claude crab going Super Saiyan', ms: 10000, ...wrap(W, css, body) }
}

function pistol(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 150)
  const L = Math.max(30, Math.min(120, W - x - CW - 16))
  const css = `
.clawR{animation:pR 9s forwards}
@keyframes pR{0%,5%{transform:translate(0,0)}10%,18%,26%{transform:translate(-6px,-2px)}14%,22%,30%{transform:translate(-3px,-3px)}38%,52%{transform:translate(${L}px,0)}57%{transform:translate(-4px,0)}62%,100%{transform:translate(0,0)}}
.arm{animation:arm 9s forwards;transform-origin:left}
@keyframes arm{0%,30%{transform:scaleX(0)}38%,52%{transform:scaleX(1)}57%,100%{transform:scaleX(0)}}
.gomu{opacity:0;animation:gomu 9s forwards}${vis('gomu', 8, 34)}
.pist{opacity:0;animation:pist 9s forwards}${vis('pist', 38, 56)}
.bam{opacity:0;animation:bam 9s forwards}
@keyframes bam{0%,37%{opacity:0;transform:scale(.3)}40%{opacity:1;transform:scale(1.3)}50%{opacity:1;transform:scale(1)}54%,100%{opacity:0}}`
  const hat = `<rect x="2" y="-3" width="40" height="3" rx="1" fill="#e8c468"/><rect x="11" y="-10" width="22" height="8" rx="2" fill="#f2d27a"/><rect x="11" y="-4" width="22" height="2" fill="#c0392b"/>`
  const fx = 44 + L + 4
  const bam = `<g class="bam">${[0, 45, 90, 135].map(a => `<rect x="${fx - 0.75}" y="6" width="1.5" height="12" fill="${GOLD}" transform="rotate(${a} ${fx} 12)"/>`).join('')}</g>`
  const body = at(x, `<rect class="arm" x="42" y="10" width="${L}" height="3" fill="${ORANGE}"/>${crab()}${hat}${bam}`
    + label(CW + 52, 4, 'Gomu Gomu no…', 10, 'gomu', '#c0392b') + label(CW + L / 2 + 4, 4, 'PISTOL!', 12, 'pist', '#c0392b'))
  return { alt: 'Claude crab doing Gomu Gomu no Pistol', ms: 9000, ...wrap(W, css, body) }
}

function water(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 125)
  const css = `
.sword{opacity:0;animation:sw 9s forwards}
@keyframes sw{0%,8%{opacity:0;transform:rotate(-40deg)}14%,32%{opacity:1;transform:rotate(-40deg)}42%{transform:rotate(100deg)}48%,80%{opacity:1;transform:rotate(100deg)}88%,100%{opacity:0;transform:rotate(100deg)}}
.wave,.foam{stroke-dasharray:220;stroke-dashoffset:220;animation:wave 9s forwards}
@keyframes wave{0%,36%{stroke-dashoffset:220;opacity:1}52%,80%{stroke-dashoffset:0;opacity:1}92%,100%{stroke-dashoffset:0;opacity:0}}
.drop{opacity:0;animation:drop 9s forwards}
@keyframes drop{0%,48%{opacity:0;transform:translateY(0)}54%{opacity:1}80%,100%{opacity:0;transform:translateY(10px)}}
.say{opacity:0;animation:say 9s forwards}${vis('say', 10, 34)}`
  // The sword turns about its grip at (44, 12): an unpainted line below makes that its centre.
  const sword = `<g class="sword"><rect x="44" y="12" width="0.1" height="24" fill="none"/><rect x="43.25" y="-12" width="1.5" height="17" fill="#cfe9ff"/><rect x="41" y="5" width="6" height="1.5" fill="#c9a227"/><rect x="43" y="6.5" width="2" height="6" fill="#3b2f2f"/></g>`
  const wave = `<path class="wave" d="M${CW + 2} 6 C${CW + 30} -12 ${CW + 58} -2 ${CW + 62} 16 C${CW + 64} 30 ${CW + 40} 30 ${CW + 44} 18" stroke="#3aa0ff" stroke-width="4" fill="none" stroke-linecap="round"/>`
    + `<path class="foam" d="M${CW + 6} 4 C${CW + 30} -10 ${CW + 54} -1 ${CW + 58} 15" stroke="#eaf6ff" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
  const drops = [[CW + 20, 0], [CW + 40, -4], [CW + 60, 4]].map(([dx, dy]) => `<circle class="drop" cx="${dx}" cy="${dy}" r="1.6" fill="#7fc4ff"/>`).join('')
  const body = at(x, crab() + sword + wave + drops + label(CW + 30, -2, 'Water Breathing!', 10, 'say', '#3aa0ff'))
  return { alt: 'Claude crab using Water Breathing', ms: 9000, ...wrap(W, css, body) }
}

function jojo(s: Scene, W: number): Built {
  const x = Math.max(20, clampX(s.x, W, 40))
  const spots: Array<[number, number, number]> = [[-10, 10, 14], [CW + 8, 2, 13], [CW + 22, 16, 15], [-6, -2, 12], [CW + 34, 4, 12]]
  const css = `
.pose{animation:pose 9s forwards;transform-origin:bottom}
@keyframes pose{0%,6%{transform:rotate(0)}12%,48%{transform:rotate(-10deg)}56%,92%{transform:scaleX(-1) rotate(-10deg)}100%{transform:rotate(0)}}
.clawR{animation:up 9s forwards}.clawL{animation:face 9s forwards}
@keyframes up{0%,6%,96%,100%{transform:translate(0,0)}12%,92%{transform:translate(2px,-11px)}}
@keyframes face{0%,6%,96%,100%{transform:translate(0,0)}12%,92%{transform:translate(9px,-5px)}}
${spots.map((_, i) => `.g${i}{opacity:0;animation:menace 1.8s ease-out infinite ${0.5 + i * 0.35}s}`).join('')}
@keyframes menace{0%{opacity:0;transform:translateY(3px) scale(.8)}30%{opacity:1}100%{opacity:0;transform:translateY(-8px) scale(1.1)}}`
  const body = at(x, `<g class="pose">${crab()}</g>` + spots.map(([gx, gy, size], i) => label(gx, gy, 'ゴ', size, `g${i}`, PURPLE)).join(''))
  return { alt: 'Claude crab striking a JoJo pose, menacingly', ms: 9000, ...wrap(W, css, body) }
}

function ramen(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 44)
  const b = CW + 2
  const css = `
.noodle{stroke-dasharray:60;animation:slurp 1.6s ease-in infinite .6s;stroke-dashoffset:60}
@keyframes slurp{0%{stroke-dashoffset:60}45%{stroke-dashoffset:0}85%,100%{stroke-dashoffset:-60}}
.chop{animation:chop 1.6s ease-in-out infinite .6s}
@keyframes chop{0%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}
.blush{opacity:0;animation:blush 10s forwards}
@keyframes blush{0%,30%{opacity:0}40%,100%{opacity:.85}}
.zz{opacity:0;animation:fadeup 1.6s infinite .9s}
.st{animation:fadeup 2.2s infinite}.st2{animation:fadeup 2.2s infinite 1.1s}`
  const bowl = `<path d="M${b} 20 h32 a16 12 0 0 1 -32 0 z" fill="#c0392b"/><rect x="${b - 1}" y="18" width="34" height="3" rx="1.5" fill="#f4e9dc"/>`
    + `<path d="M${b + 4} 18 q4 -3 8 0 q4 -3 8 0 q4 -3 8 0" stroke="${GOLD}" stroke-width="1.5" fill="none"/>`
    + `<circle cx="${b + 24}" cy="17" r="3" fill="#fff"/><path d="M${b + 23} 17 a1.2 1.2 0 1 1 1.5 1" stroke="#ff7aa2" stroke-width="0.8" fill="none"/>`
    + `<path class="st" d="M${b + 10} 12 q-2 -3 0 -6" stroke="#c9c3bc" stroke-width="1.2" fill="none"/><path class="st2" d="M${b + 20} 12 q2 -3 0 -6" stroke="#c9c3bc" stroke-width="1.2" fill="none"/>`
  const chop = `<g class="chop"><line x1="${b - 4}" y1="4" x2="${b + 14}" y2="18" stroke="#8d6e63" stroke-width="1.5"/><line x1="${b - 2}" y1="2" x2="${b + 16}" y2="17" stroke="#a1887f" stroke-width="1.5"/></g>`
  const noodle = `<path class="noodle" d="M${b + 12} 18 Q${b + 2} 2 24 16" stroke="${GOLD}" stroke-width="2" fill="none" stroke-linecap="round"/>`
  const body = at(x, crab() + blush('blush') + bowl + noodle + chop + label(CW + 22, -3, 'slurp', 10, 'zz'))
  return { alt: 'Claude crab slurping Ichiraku ramen', ms: 10000, ...wrap(W, css, body) }
}

function sharingan(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 30)
  const css = `
.shar{opacity:0;animation:shar 8s forwards}
@keyframes shar{0%,12%{opacity:0;transform:scale(.3)}18%{opacity:1;transform:scale(1.15)}22%,86%{opacity:1;transform:scale(1)}92%,100%{opacity:0;transform:scale(.3)}}
.spinE{animation:spinE 1.1s linear infinite}
@keyframes spinE{to{transform:rotate(360deg)}}
.kanji{opacity:0;animation:kanji 8s forwards}${vis('kanji', 20, 84)}`
  const eye = (cx: number, cy: number) => {
    const tomoe = [0, 120, 240].map(a => {
      const t = (a * Math.PI) / 180
      return `<circle cx="${(cx + Math.cos(t) * 3.1).toFixed(2)}" cy="${(cy + Math.sin(t) * 3.1).toFixed(2)}" r="1.1" fill="#111"/>`
    }).join('')
    return `<g class="shar"><g class="spinE"><circle cx="${cx}" cy="${cy}" r="5" fill="#d62828"/><circle cx="${cx}" cy="${cy}" r="3.1" fill="none" stroke="#111" stroke-width=".5"/><circle cx="${cx}" cy="${cy}" r="1.3" fill="#111"/>${tomoe}</g></g>`
  }
  const body = at(x, crab() + eye(14, 8) + eye(30, 8) + label(CW + 16, 14, 'Sharingan', 11, 'kanji', '#d62828'))
  return { alt: 'Claude crab activating its Sharingan', ms: 8000, ...wrap(W, css, body) }
}

function sailor(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 110)
  const css = `
.twirl{animation:twirl .4s linear 10 .8s}
@keyframes twirl{0%,100%{transform:scaleX(1)}50%{transform:scaleX(-1)}}
.rib{opacity:0;animation:rib 10s forwards}${vis('rib', 8, 50)}
.ribspin{animation:spin 1.2s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.clawR{animation:pose 10s forwards}.clawL{animation:pose2 10s forwards}
@keyframes pose{0%,52%{transform:translate(0,0)}58%,94%{transform:translate(3px,-11px)}100%{transform:translate(0,0)}}
@keyframes pose2{0%,52%{transform:translate(0,0)}58%,94%{transform:translate(8px,-3px)}100%{transform:translate(0,0)}}
.moon{opacity:0;animation:moon 10s forwards}
@keyframes moon{0%,54%{opacity:0;transform:scale(.3) rotate(-40deg)}60%,94%{opacity:1;transform:scale(1) rotate(0)}100%{opacity:0}}
.mp{opacity:0;animation:mp 10s forwards}${vis('mp', 10, 50)}
.mu{opacity:0;animation:mu 10s forwards}${vis('mu', 58, 94)}
${[0, 1, 2, 3, 4].map(i => `.k${i}{opacity:0;animation:tw 1.2s ease-in-out infinite ${0.4 + i * 0.25}s}`).join('')}
@keyframes tw{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1)}}`
  const c = { x: CW / 2, y: 16 }
  // The ribbons circle the crab: an unpainted ring makes the crab's middle their centre.
  const ribbons = `<g class="rib"><g class="ribspin"><circle cx="${c.x}" cy="${c.y}" r="27" fill="none"/>`
    + `<path d="M${c.x - 27} ${c.y} A27 27 0 0 1 ${c.x} ${c.y - 27}" stroke="#f472b6" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
    + `<path d="M${c.x + 27} ${c.y} A27 27 0 0 1 ${c.x} ${c.y + 27}" stroke="#60a5fa" stroke-width="2.2" fill="none" stroke-linecap="round"/></g></g>`
  const moon = `<g class="moon"><path transform="translate(${CW + 2},-12) scale(.65)" d="M10 0 A10 10 0 1 0 10 20 A7.5 7.5 0 1 1 10 0 Z" fill="${GOLD}"/></g>`
  const stars = [[-8, 0], [CW + 8, 22], [-4, 26], [CW + 14, 2], [CW / 2, -6]].map(([sx, sy], i) => sparkle(sx!, sy!, `k${i}`, i % 2 ? '#f472b6' : GOLD, 10)).join('')
  const body = at(x, ribbons + `<g class="twirl">${crab()}</g>` + moon + stars
    + label(CW + 64, 8, 'Moon Prism Power…', 10, 'mp', '#f472b6') + label(CW + 40, 14, 'Make up!', 12, 'mu', '#f472b6'))
  return { alt: 'Claude crab doing a Sailor Moon transformation', ms: 10000, ...wrap(W, css, body) }
}

function onigiri(s: Scene, W: number): Built {
  const x = clampX(s.x, W, 44)
  const css = `
.clawR{animation:hold 8s forwards}
@keyframes hold{0%,78%{transform:translate(-2px,-4px)}84%,100%{transform:translate(0,0)}}
.o0{animation:o0 8s forwards}@keyframes o0{0%,29%{opacity:1}31%,100%{opacity:0}}
.o1{opacity:0;animation:o1 8s forwards}@keyframes o1{0%,29%{opacity:0}31%,54%{opacity:1}56%,100%{opacity:0}}
.o2{opacity:0;animation:o2 8s forwards}@keyframes o2{0%,54%{opacity:0}56%,77%{opacity:1}79%,100%{opacity:0}}
.body{animation:chomp 8s forwards}
@keyframes chomp{0%,26%,34%,51%,59%,74%,82%,100%{transform:translateY(0)}30%,55%,78%{transform:translateY(2px)}}
.crumb{opacity:0;animation:crumb 8s forwards}.crumb2{opacity:0;animation:crumb 8s forwards 2s}.crumb3{opacity:0;animation:crumb 8s forwards 3.8s}
@keyframes crumb{0%,29%{opacity:0;transform:translateY(0)}31%{opacity:1}42%,100%{opacity:0;transform:translateY(12px)}}
.happy{opacity:0;animation:happy 8s forwards}
@keyframes happy{0%,80%{opacity:0}86%,100%{opacity:1}}
.mg{opacity:0;animation:mg 8s forwards}${vis('mg', 8, 78)}
${[0, 1, 2].map(i => `.k${i}{opacity:0;animation:tw 1s ease-in-out infinite ${6.6 + i * 0.3}s}`).join('')}
@keyframes tw{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1)}}`
  const nori = `<rect x="4" y="9" width="8" height="5" fill="#1f2a1f"/>`
  const rice = (pts: string, cls: string) => `<g class="${cls}"><polygon points="${pts}" fill="#f7f4ee" stroke="#d8d2c8" stroke-width=".6"/>${nori}</g>`
  const ball = `<g transform="translate(${CW - 6},-4)">${rice('8,0 16,14 0,14', 'o0')}${rice('3,6 13,6 16,14 0,14', 'o1')}${rice('1,10 15,10 16,14 0,14', 'o2')}</g>`
  const crumbs = ['crumb', 'crumb2', 'crumb3'].map((c, i) => `<rect class="${c}" x="${CW - 2 + i * 3}" y="10" width="2" height="2" fill="#f7f4ee"/>`).join('')
  const body = at(x, crab() + ball + crumbs + blush('happy')
    + [[-6, 2], [CW + 10, 0], [CW / 2, -6]].map(([sx, sy], i) => sparkle(sx!, sy!, `k${i}`)).join('')
    + label(CW + 30, 4, 'nom nom', 10, 'mg'))
  return { alt: 'Claude crab eating an onigiri', ms: 8000, ...wrap(W, css, body) }
}

function totoro(s: Scene, W: number): Built {
  const x = Math.max(28, clampX(s.x, W, 28))
  // Raindrops: those over the leaf stop on it, the others fall to the ground.
  const drops = [-22, -14, -2, 10, 22, 34, 46, 58, 66].map((dx, i) => {
    const under = dx > -8 && dx < 52
    const fall = under ? 6 : 42
    const heavy = i % 3 === 2
    return `<style>.rd${i}{opacity:0;animation:rd${i} .9s linear infinite ${(i * 0.27) % 0.9 + (heavy ? 4.5 : 0)}s}@keyframes rd${i}{0%{opacity:.9;transform:translateY(0)}100%{opacity:${under ? 0 : 0.6};transform:translateY(${fall}px)}}</style>`
      + `<rect class="rd${i}" x="${dx}" y="-13" width="1.2" height="4" fill="#7fb8ff"/>`
  }).join('')
  const css = `
.hop{animation:hop 10s forwards}
@keyframes hop{0%,44%{transform:translateY(0)}48%{transform:translateY(-6px)}52%,100%{transform:translateY(0)}}
.clawR{transform:translate(-4px,-3px)}`
  const leaf = `<line x1="40" y1="11" x2="28" y2="-6" stroke="#2e7d32" stroke-width="1.8"/><path d="M-8 -3 Q22 -17 52 -3 Q22 -8 -8 -3 Z" fill="#4caf50"/><path d="M-6 -3.5 Q22 -12 50 -3.5" stroke="#2e7d32" stroke-width=".8" fill="none"/>`
  const body = at(x, drops + `<g class="hop">${crab()}${leaf}</g>`)
  return { alt: 'Claude crab under a leaf umbrella in the rain', ms: 10000, ...wrap(W, css, body) }
}

function titan(s: Scene, W: number): Built {
  const x = Math.max(16, clampX(s.x, W, 24))
  const jolts = Array.from({ length: 20 }, (_, i) => `${32 + i * 2}%{transform:scale(1.35) translateX(${i % 2 ? 1 : -1}px)}`).join('')
  const css = `
.clawR{animation:bite 11s forwards}
@keyframes bite{0%,4%{transform:translate(0,0)}8%,16%{transform:translate(-14px,-2px)}20%,100%{transform:translate(0,0)}}
.ti{transform-origin:center bottom;animation:ti 11s forwards}
@keyframes ti{0%,22%{transform:scale(1)}28%{transform:scale(1.45)}30%{transform:scale(1.35)}${jolts}72%,82%{transform:scale(1.35)}88%,100%{transform:scale(1)}}
.mus{opacity:0;animation:mus 11s forwards}${vis('mus', 26, 84)}
.bolt{opacity:0;animation:bolt 11s forwards}
@keyframes bolt{0%,15%{opacity:0}16%,18%{opacity:1}19%{opacity:0}20%,22%{opacity:1}24%,100%{opacity:0}}
.flash{opacity:0;animation:flash 11s forwards}
@keyframes flash{0%,19%{opacity:0}21%{opacity:.8}27%,100%{opacity:0}}
.p0{opacity:0;animation:boom 11s forwards}.p1{opacity:0;animation:boom 11s forwards;animation-delay:-.2s}
@keyframes boom{0%,21%{opacity:0;transform:scale(.3)}25%{opacity:1;transform:scale(1.2)}34%{opacity:0;transform:scale(1.6)}84%{opacity:0;transform:scale(.4)}87%{opacity:1;transform:scale(1.1)}94%,100%{opacity:0;transform:scale(1.4)}}
.st{opacity:0;animation:fadeup 1.4s infinite}
.steam{opacity:0;animation:steam 11s forwards}${vis('steam', 30, 84)}
.ex{opacity:0;animation:ex 11s forwards}${vis('ex', 6, 15)}
.roar{opacity:0;animation:roar 11s forwards}
@keyframes roar{0%,34%{opacity:0;transform:scale(.4)}38%{opacity:1;transform:scale(1.2)}42%,70%{opacity:1;transform:scale(1)}74%,100%{opacity:0}}`
  // Exposed muscle and the titan's grin, drawn on the crab while it is big.
  const muscle = `<g class="mus">${[10, 16, 22, 28, 34].map(mx => `<rect x="${mx}" y="12" width="1.5" height="7" fill="#9b2f1f"/>`).join('')}`
    + `<rect x="9" y="15" width="26" height="4" fill="#f4ede4"/>${[13, 17, 21, 25, 29].map(tx => `<rect x="${tx}" y="15" width="1" height="4" fill="#6b2a1f"/>`).join('')}</g>`
  const steam = `<g class="steam">${[[4, 0], [20, -4], [38, 0], [12, 2]].map(([sx, sy], i) => `<path class="st" style="animation-delay:${i * 0.35}s" d="M${sx} ${sy} q-3 -4 0 -8 q3 -4 0 -8" stroke="#e8e2da" stroke-width="2" fill="none"/>`).join('')}</g>`
  const bolt = `<polyline class="bolt" points="26,-13 20,-4 27,-4 19,8" stroke="${GOLD}" stroke-width="2.5" fill="none" stroke-linejoin="round"/>`
  const body = at(x, `<circle class="flash" cx="22" cy="14" r="30" fill="#fff6c8"/>` + `<g class="ti">${crab()}${muscle}</g>` + steam + bolt
    + puff(4, 20, 'p0') + puff(40, 20, 'p1')
    + label(CW + 6, -4, '!', 13, 'ex', '#c0392b') + label(CW + 34, 6, 'RAAAAH!', 13, 'roar', '#c0392b'))
  return { alt: 'Claude crab turning into a Titan', ms: 11000, ...wrap(W, css, body) }
}

function ghoul(s: Scene, W: number): Built {
  const x = Math.max(48, clampX(s.x, W, 70))
  const css = `
.clawR{animation:crack 11s forwards}
@keyframes crack{0%,3%,14%,100%{transform:translate(0,0)}5%,9%{transform:translate(-2px,-3px)}7%,11%{transform:translate(-2px,-1px)}}
.cr{opacity:0;animation:cr 11s forwards}${vis('cr', 4, 12)}
.kaku{opacity:0;animation:kaku 11s forwards}
@keyframes kaku{0%,14%{opacity:0}18%,88%{opacity:1}92%,100%{opacity:0}}
.glow{animation:glow 1s ease-in-out infinite}
@keyframes glow{50%{opacity:.35}}
.kg{transform-origin:right bottom;animation:kg 11s forwards}
@keyframes kg{0%,24%{transform:scale(0)}32%{transform:scale(1.12)}36%,84%{transform:scale(1)}92%,100%{transform:scale(0)}}
.w0,.w1,.w2,.w3{transform-origin:right bottom}
.w0{animation:sway 1.6s ease-in-out infinite}.w1{animation:sway 1.6s ease-in-out infinite -.4s}
.w2{animation:sway 1.6s ease-in-out infinite -.8s}.w3{animation:sway 1.6s ease-in-out infinite -1.2s}
@keyframes sway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(6deg)}}
.line{opacity:0;animation:line 11s forwards}${vis('line', 40, 80)}`
  const tent = ['M6 12 C-6 6 -14 -4 -30 -9', 'M6 14 C-8 12 -20 8 -42 4', 'M6 16 C-6 20 -18 22 -36 17', 'M8 10 C0 -2 -6 -9 -16 -13']
    .map((d, i) => `<g class="w${i}"><path d="${d}" stroke="#6d0a14" stroke-width="6" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#e01e37" stroke-width="3" fill="none" stroke-linecap="round"/></g>`).join('')
  // One eye turns: a red iris in the dark, with veins running out of it.
  const kakugan = `<g class="kaku"><circle class="glow" cx="14" cy="8" r="5" fill="#ff1a1a" opacity=".6"/><rect x="12" y="4" width="4" height="8" fill="#111"/><rect x="13" y="6.5" width="2" height="3" fill="#ff2a2a"/>`
    + `<path d="M12 9 l-4 2 l-2 -1 M12 6 l-5 -2 M16 10 l3 3" stroke="#c1121f" stroke-width=".8" fill="none"/></g>`
  const body = at(x, `<g class="kg">${tent}</g>` + crab() + kakugan
    + label(CW + 18, 2, '*crack*', 10, 'cr') + label(CW + 34, 10, "I'm a ghoul.", 11, 'line', '#e01e37'))
  return { alt: 'Claude crab awakening as a ghoul', ms: 11000, ...wrap(W, css, body) }
}

function bankai(s: Scene, W: number): Built {
  const x = Math.max(24, clampX(s.x, W, 120))
  const L = Math.max(40, Math.min(110, W - x - CW - 20))
  const css = `
.clawR{transform:translate(0,-2px)}
.clawL{animation:mask 13s forwards}
@keyframes mask{0%,54%{transform:translate(0,0)}58%{transform:translate(12px,-6px)}61%{transform:translate(30px,-6px)}64%,100%{transform:translate(0,0)}}
.shi{animation:shi 13s forwards}@keyframes shi{0%,27%{opacity:1}29%,100%{opacity:0}}
.ten{opacity:0;animation:ten 13s forwards}@keyframes ten{0%,27%{opacity:0}29%,94%{opacity:1}98%,100%{opacity:0}}
.coat{opacity:0;transform-origin:right top;animation:coat 13s forwards}
@keyframes coat{0%,27%{opacity:0;transform:scaleX(.2)}31%,94%{opacity:1;transform:scaleX(1)}98%,100%{opacity:0}}
.flap{transform-origin:right top;animation:flap .7s ease-in-out infinite}
@keyframes flap{50%{transform:scaleX(1.12) skewY(3deg)}}
.rei{opacity:0;animation:rei 13s forwards}
@keyframes rei{0%,8%{opacity:0;transform:scaleY(.3)}20%{opacity:.9;transform:scaleY(1)}26%{opacity:1;transform:scaleY(1.2)}34%,90%{opacity:.75;transform:scaleY(1)}96%,100%{opacity:0}}
.fl{animation:flick .18s steps(2) infinite}
@keyframes flick{50%{opacity:.55}}
.ban{opacity:0;animation:ban 13s forwards}${vis('ban', 10, 22)}
.bk{opacity:0;animation:bk 13s forwards}
@keyframes bk{0%,23%{opacity:0;transform:scale(.4)}26%{opacity:1;transform:scale(1.25)}29%,40%{opacity:1;transform:scale(1)}43%,100%{opacity:0}}
.hm{opacity:0;transform-origin:left center;animation:hm 13s forwards}
@keyframes hm{0%,57%{opacity:0;transform:scaleX(0)}62%{opacity:1;transform:scaleX(1)}92%{opacity:1}95%{opacity:.6;transform:translateY(1px)}98%,100%{opacity:0;transform:translateY(4px)}}
.gt{opacity:0;animation:gt 13s forwards}${vis('gt', 66, 84)}
.slash{opacity:0;animation:slash 13s forwards}
@keyframes slash{0%,72%{opacity:0;transform:translateX(0)}74%{opacity:1}86%{opacity:1;transform:translateX(${L}px)}90%,100%{opacity:0;transform:translateX(${L + 10}px)}}`
  // Zangetsu: the big cleaver first, then the slim black Bankai blade.
  const shikai = `<g class="shi"><rect x="43" y="-12" width="7" height="20" fill="#d9dde3"/><rect x="43" y="-12" width="2" height="20" fill="#f4f6f8"/><rect x="44.5" y="8" width="4" height="7" fill="#e8e2da"/></g>`
  const tensa = `<g class="ten"><rect x="45" y="-12" width="2.5" height="21" fill="#111"/><rect x="47.5" y="-12" width=".8" height="21" fill="#c1121f"/><rect x="42.5" y="8" width="7.5" height="2" fill="#555"/><rect x="45" y="10" width="2.5" height="5" fill="#222"/></g>`
  const coat = `<g class="coat"><g class="flap"><path d="M8 4 L-14 10 L-9 17 L-20 24 L-9 29 L-16 32 L6 31 Z" fill="#111"/><path d="M8 4 L-14 10" stroke="#c1121f" stroke-width="1"/></g></g>`
  const rei = `<g class="rei">${[[-8, 0], [CW / 2, -2], [CW + 4, 0]].map(([fx, fy], i) => `<path class="fl" style="animation-delay:${i * 0.06}s" d="M${fx! - 6} 32 Q${fx! - 8} ${fy! + 14} ${fx} ${fy! - 10} Q${fx! + 8} ${fy! + 14} ${fx! + 6} 32 Z" fill="#141014" stroke="#c1121f" stroke-width="1.2" opacity=".85"/>`).join('')}</g>`
  // The hollow mask over the crab's face: white, red stripes, gold eyes in black.
  const mask = `<g class="hm"><rect x="5" y="-1" width="34" height="17" rx="4" fill="#f5f3ee" stroke="#cfcac2" stroke-width=".6"/>`
    + `<rect x="8" y="-1" width="2" height="16" fill="#c1121f"/><rect x="11.5" y="0" width="1.5" height="14" fill="#c1121f"/>`
    + `<rect x="12" y="4" width="6" height="6" fill="#111"/><rect x="26" y="4" width="6" height="6" fill="#111"/><rect x="14" y="6" width="2" height="2" fill="${GOLD}"/><rect x="28" y="6" width="2" height="2" fill="${GOLD}"/>`
    + `<rect x="13" y="12" width="18" height="1" fill="#555"/>${[15, 18, 21, 24, 27, 30].map(tx => `<rect x="${tx}" y="11" width=".8" height="3" fill="#555"/>`).join('')}</g>`
  const slash = `<g class="slash"><path d="M${CW + 8} -12 Q${CW + 26} 10 ${CW + 8} 32 Q${CW + 16} 10 ${CW + 8} -12 Z" fill="#111" stroke="#e01e37" stroke-width="1.5"/></g>`
  const body = at(x, rei + coat + crab() + shikai + tensa + mask + slash
    + label(CW + 30, 4, 'Ban…', 11, 'ban', '#c1121f') + label(CW + 34, 4, 'BANKAI!', 14, 'bk', '#c1121f') + label(CW + 46, -3, 'Getsuga Tensho!', 10, 'gt', '#e01e37'))
  return { alt: 'Claude crab releasing its Bankai and a hollow mask', ms: 13000, ...wrap(W, css, body) }
}

function stand(s: Scene, W: number): Built {
  const x = Math.max(24, clampX(s.x, W, 150))
  const G = Math.max(60, Math.min(120, W - x - CW - 26))
  const D = CW + G
  const mid = CW + G / 2
  const SP = '#8b5cf6'
  // DIO: blond hair, yellow jacket, green hearts.
  const dio = `<rect x="1" y="-4" width="14" height="5" fill="${GOLD}"/><rect x="0" y="0" width="3" height="7" fill="${GOLD}"/><rect x="13" y="0" width="3" height="7" fill="${GOLD}"/>`
    + `<rect x="3" y="0" width="10" height="8" fill="#f1c9a5"/><rect x="5" y="3" width="2" height="1.5" fill="#2b211d"/><rect x="9" y="3" width="2" height="1.5" fill="#2b211d"/><rect x="6" y="6" width="4" height="1" fill="#b5452f"/>`
    + `<rect x="1" y="8" width="14" height="12" fill="#e0b83a"/><rect x="7" y="8" width="2" height="12" fill="#2b2b2b"/><rect x="-1" y="9" width="2" height="9" fill="#e0b83a"/><rect x="15" y="9" width="2" height="9" fill="#e0b83a"/>`
    + `<rect x="2" y="20" width="5" height="12" fill="#e0b83a"/><rect x="9" y="20" width="5" height="12" fill="#e0b83a"/><rect x="3" y="24" width="3" height="2.5" fill="#4caf50"/><rect x="10" y="24" width="3" height="2.5" fill="#4caf50"/>`
  // The stands: big ghostly figures behind each fighter.
  const ghost = (gx: number, fill: string, hair: string) => `<rect x="${gx + 4}" y="-12" width="14" height="4" fill="${hair}"/><rect x="${gx + 5}" y="-8" width="12" height="9" fill="${fill}"/>`
    + `<rect x="${gx + 8}" y="-5" width="2" height="2" fill="#fff"/><rect x="${gx + 13}" y="-5" width="2" height="2" fill="#fff"/><rect x="${gx}" y="1" width="22" height="16" fill="${fill}"/><rect x="${gx + 3}" y="17" width="16" height="10" fill="${fill}"/>`
  const fists = (n: number, from: number, to: number, fill: string, cls: string) => Array.from({ length: n }, (_, i) =>
    `<rect class="${cls}" style="animation-delay:${(i * 0.045).toFixed(3)}s" x="${from}" y="${-8 + ((i * 7) % 28)}" width="7" height="5" rx="2" fill="${fill}"/>`).join('')
  const shouts = (word: string, cx: number, fill: string, cls: string) => [[-14, 0], [6, 9], [-4, 18], [12, -3]].map(([dx, dy], i) =>
    `<text class="${cls}" style="animation-delay:${i * 0.16}s" x="${cx + dx!}" y="${dy}" font-size="10" fill="${fill}" text-anchor="middle">${word}</text>`).join('')
  const css = `
.dio{opacity:0;animation:dio 12s forwards}
@keyframes dio{0%,3%{opacity:0;transform:translateX(12px)}9%,72%{opacity:1;transform:translateX(0)}78%{opacity:1;transform:translateX(${Math.round(G / 3) + 18}px) rotate(30deg)}84%,100%{opacity:0;transform:translateX(${Math.round(G / 3) + 26}px) rotate(40deg)}}
.sp{opacity:0;animation:sp 12s forwards}
@keyframes sp{0%,12%{opacity:0;transform:scale(.5)}18%,80%{opacity:.5;transform:scale(1)}88%,100%{opacity:0;transform:scale(1.1)}}
.tw{opacity:0;animation:tw 12s forwards}
@keyframes tw{0%,12%{opacity:0;transform:scale(.5)}18%,72%{opacity:.5;transform:scale(1)}76%,100%{opacity:0}}
.brawl{opacity:0;animation:brawl 12s forwards}${vis('brawl', 22, 72)}
.fa{animation:fa .24s linear infinite}@keyframes fa{0%{transform:translateX(0);opacity:1}100%{transform:translateX(${Math.round(mid - CW - 4)}px);opacity:.2}}
.fb{animation:fb .24s linear infinite}@keyframes fb{0%{transform:translateX(0);opacity:1}100%{transform:translateX(${-Math.round(D - mid - 4)}px);opacity:.2}}
.ora,.muda{animation:pop .65s ease-out infinite}
@keyframes pop{0%{opacity:0;transform:scale(.6)}25%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:scale(1)}}
.clawR{animation:jab 12s forwards}
@keyframes jab{0%,22%,72%{transform:translate(0,0)}${Array.from({ length: 24 }, (_, i) => `${23 + i * 2}%{transform:translate(${i % 2 ? 4 : 0}px,0)}`).join('')}75%{transform:translate(10px,-2px)}80%,100%{transform:translate(0,0)}}
.appr{opacity:0;animation:appr 12s forwards}${vis('appr', 8, 20)}
.fin{opacity:0;animation:fin 12s forwards}
@keyframes fin{0%,72%{opacity:0;transform:scale(.4)}75%{opacity:1;transform:scale(1.3)}78%,84%{opacity:1;transform:scale(1)}87%,100%{opacity:0}}
.yare{opacity:0;animation:yare 12s forwards}${vis('yare', 89, 98)}`
  const body = at(x, `<g class="sp">${ghost(-16, SP, '#3b2a6b')}</g>` + crab()
    + `<g transform="translate(${D},0)"><g class="dio"><g class="tw">${ghost(-14, GOLD, '#b8860b')}</g>${dio}</g></g>`
    + `<g class="brawl">${fists(8, CW + 2, 0, SP, 'fa')}${fists(8, D - 9, 0, GOLD, 'fb')}${shouts('ORA', CW + G / 4, SP, 'ora')}${shouts('MUDA', D - G / 4, '#c99a00', 'muda')}</g>`
    + label(mid + 4, -4, "Oh? You're approaching me?", 9, 'appr', '#c99a00')
    + label(mid, 8, 'ORA!', 16, 'fin', SP) + label(CW + 30, 0, 'Yare yare daze.', 10, 'yare', SP))
  return { alt: 'Claude crab and its Stand fighting DIO: ORA ORA ORA!', ms: 12000, ...wrap(W, css, body) }
}

export const ANIME_BUILD: Record<Anime, (s: Scene, W: number) => Built> = { kamehameha, saiyan, pistol, water, jojo, ramen, sharingan, sailor, onigiri, totoro, titan, ghoul, bankai, stand }


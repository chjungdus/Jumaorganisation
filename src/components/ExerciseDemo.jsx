import { useEffect, useState } from 'react'

// Animierte Strichfigur (Seitenansicht), die eine Übung ausführt.
// Gelenke werden aus Winkeln berechnet (0° = nach unten, 90° = nach vorn/rechts,
// 180° = nach oben, 270° = nach hinten/links), dadurch bleiben die Gliedmaßen immer gleich lang.

const GROUND = 142
const L = { torso: 44, ua: 25, fa: 23, th: 36, sh: 36, head: 8, foot: 15 }

const rad = d => (d * Math.PI) / 180
const dir = a => [Math.sin(rad(a)), Math.cos(rad(a))]
const add = (p, a, len) => { const d = dir(a); return [p[0] + d[0] * len, p[1] + d[1] * len] }
const lerp = (a, b, t) => a + (b - a) * t
const lerp2 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)]
const smooth = x => x * x * (3 - 2 * x)
const pt = p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`

// Knie aus Hüfte und Fuß berechnen (zwei gleich lange Segmente)
function ik(hip, foot, bend) {
  const dx = foot[0] - hip[0], dy = foot[1] - hip[1]
  const full = Math.hypot(dx, dy) || 1
  const d = Math.min(full, L.th + L.sh - 0.01)
  const ux = dx / full, uy = dy / full
  const h = Math.sqrt(Math.max(L.th * L.th - (d / 2) * (d / 2), 0))
  let px = -uy, py = ux
  if (px * bend < 0) { px = -px; py = -py }
  return [hip[0] + ux * d / 2 + px * h, hip[1] + uy * d / 2 + py * h]
}

function solve(p) {
  const hip = p.hip
  const sho = add(hip, p.torso, L.torso)
  const head = add(sho, p.torso, 6 + L.head)
  const el = add(sho, p.a1, L.ua)
  const ha = add(el, p.a2, L.fa)
  let kn, ft, kn2 = null, ft2 = null, toe = null, toe2 = null
  if (p.feet) {
    ft = p.feet.front; ft2 = p.feet.back
    kn = ik(hip, ft, 1); kn2 = ik(hip, ft2, 1)
    toe = [ft[0] + 13, ft[1]]; toe2 = [ft2[0] + 13, ft2[1]]
  } else {
    kn = add(hip, p.th, L.th)
    ft = add(kn, p.sh, L.sh)
    if (p.foot !== undefined) toe = add(ft, p.foot, L.foot)
  }
  return { hip, sho, head, el, ha, kn, ft, kn2, ft2, toe, toe2 }
}

function mix(a, b, t) {
  const out = {}
  for (const k of Object.keys(a)) {
    if (k === 'feet') out.feet = a.feet
    else if (Array.isArray(a[k])) out[k] = lerp2(a[k], b[k], t)
    else out[k] = lerp(a[k], b[k], t)
  }
  return out
}

// ── Grundhaltungen ───────────────────────────────
const STAND = { hip: [100, 70], torso: 180, th: 0, sh: 0, foot: 90 }
const SEAT = { hip: [90, 106], torso: 184, th: 90, sh: 0 }
const HANDLES_SIDE = { a1: 42, a2: 58 } // Arme halten Griffe seitlich am Sitz

const DEMOS = {
  curl: {
    a: { ...STAND, a1: 12, a2: 8 },
    b: { ...STAND, a1: 12, a2: 168 },
    weight: 'hand', hl: ['arm'],
  },
  pushdown: {
    a: { ...STAND, torso: 172, a1: 8, a2: 88 },
    b: { ...STAND, torso: 172, a1: 8, a2: 6 },
    cable: { top: true }, weight: 'hand', hl: ['arm'],
  },
  shoulderpress: {
    a: { ...SEAT, torso: 182, a1: 15, a2: 172 },
    b: { ...SEAT, torso: 182, a1: 182, a2: 180 },
    seat: true, weight: 'hand', hl: ['arm'],
  },
  chestpress: {
    a: { ...SEAT, torso: 186, a1: 275, a2: 85 },
    b: { ...SEAT, torso: 186, a1: 90, a2: 90 },
    seat: true, weight: 'hand', hl: ['arm', 'torso'],
  },
  inclinepress: {
    a: { ...SEAT, torso: 205, a1: 272, a2: 98 },
    b: { ...SEAT, torso: 205, a1: 125, a2: 125 },
    seat: true, weight: 'hand', hl: ['arm', 'torso'],
  },
  butterfly: {
    a: { ...SEAT, torso: 186, a1: 262, a2: 278 },
    b: { ...SEAT, torso: 186, a1: 88, a2: 92 },
    seat: true, weight: 'hand', hl: ['arm', 'torso'],
  },
  reversebutterfly: {
    a: { ...SEAT, torso: 174, a1: 88, a2: 92 },
    b: { ...SEAT, torso: 174, a1: 262, a2: 278 },
    seatOnly: true, padFront: true, weight: 'hand', hl: ['arm', 'torso'],
  },
  latpulldown: {
    a: { ...SEAT, torso: 194, a1: 172, a2: 176 },
    b: { ...SEAT, torso: 194, a1: 335, a2: 125 },
    seat: true, cable: { top: true }, weight: 'hand', hl: ['arm', 'torso'],
  },
  verticalrow: {
    a: { ...SEAT, torso: 182, a1: 88, a2: 90 },
    b: { ...SEAT, torso: 182, a1: 272, a2: 88 },
    seatOnly: true, padFront: true, weight: 'hand', hl: ['arm', 'torso'],
  },
  cablerow: {
    a: { ...SEAT, torso: 176, a1: 88, a2: 90 },
    b: { ...SEAT, torso: 188, a1: 272, a2: 88 },
    seatOnly: true, cable: { rel: [68, 0] }, weight: 'hand', hl: ['arm', 'torso'],
  },
  facepull: {
    a: { ...STAND, a1: 90, a2: 90 },
    b: { ...STAND, a1: 262, a2: 113 },
    cable: { rel: [68, 0] }, weight: 'hand', hl: ['arm', 'torso'],
  },
  legpress: {
    a: { hip: [85, 106], torso: 228, th: 158, sh: 52, ...HANDLES_SIDE },
    b: { hip: [85, 106], torso: 228, th: 118, sh: 118, ...HANDLES_SIDE },
    seat: 12, plate: true, hl: ['leg'],
  },
  legcurl: {
    a: { ...SEAT, torso: 186, sh: 75, a1: 15, a2: 70 },
    b: { ...SEAT, torso: 186, sh: 5, a1: 15, a2: 70 },
    seat: true, weight: 'shin', hl: ['leg'],
  },
  legextension: {
    a: { ...SEAT, torso: 188, sh: 0, a1: 15, a2: 70 },
    b: { ...SEAT, torso: 188, sh: 92, a1: 15, a2: 70 },
    seat: true, weight: 'shin', hl: ['leg'],
  },
  lunge: {
    a: { hip: [99, 88], torso: 180, a1: 0, a2: 0, feet: { front: [140, GROUND], back: [58, GROUND] } },
    b: { hip: [104, 106], torso: 180, a1: 0, a2: 0, feet: { front: [140, GROUND], back: [58, GROUND] } },
    weight: 'hand', hl: ['leg'],
  },
  calfstanding: {
    a: { ...STAND, hip: [100, 70], a1: 12, a2: 8 },
    b: { ...STAND, hip: [100, 58], foot: 37, a1: 12, a2: 8 },
    weight: 'sho', hl: ['leg'],
  },
  calfseated: {
    a: { ...SEAT, torso: 182, foot: 90, a1: 30, a2: 100 },
    b: { ...SEAT, torso: 182, th: 109, foot: 37, a1: 30, a2: 100 },
    seat: true, weight: 'knee', hl: ['leg'],
  },
  crunch: {
    a: { hip: [110, 136], torso: 270, th: 135, sh: 15, a1: 95, a2: 95 },
    b: { hip: [110, 136], torso: 232, th: 135, sh: 15, a1: 120, a2: 125 },
    mat: true, hl: ['torso'],
  },
  lateralraise: { front: true, hl: ['arm'] },
}

export const DEMO_IDS = Object.keys(DEMOS)

// ── Zeichnen ─────────────────────────────────────
function Equipment({ d }) {
  const A = d.a
  if (!A) return null
  const jA = solve(A)
  const els = []
  if (d.seat || d.seatOnly || d.padFront) {
    const [tx, ty] = dir(A.torso)
    const back = [ty, -tx]
    const hip = A.hip
    const bx = hip[0] + back[0] * 9, by = hip[1] + back[1] * 9
    const seatLen = typeof d.seat === 'number' ? d.seat : 34
    els.push(<line key="seatbase" className="exd-equip" x1={bx} y1={hip[1] + 9} x2={hip[0] + seatLen} y2={hip[1] + 9} />)
    els.push(<line key="post" className="exd-equip thin" x1={hip[0]} y1={hip[1] + 9} x2={hip[0]} y2={GROUND} />)
    if (d.seat === true || typeof d.seat === 'number') {
      els.push(<line key="back" className="exd-equip" x1={bx - tx * 6} y1={by - ty * 6} x2={bx + tx * 54} y2={by + ty * 54} />)
    }
    if (d.padFront) {
      const fx = hip[0] - back[0] * 9, fy = hip[1] - back[1] * 9
      els.push(<line key="pad" className="exd-equip" x1={fx + tx * 14} y1={fy + ty * 14} x2={fx + tx * 40} y2={fy + ty * 40} />)
    }
  }
  if (d.cable) {
    const anchor = d.cable.top ? [jA.ha[0], 6] : [jA.ha[0] + d.cable.rel[0], jA.ha[1] + d.cable.rel[1]]
    els.push(<circle key="pulley" className="exd-equip-dot" cx={anchor[0]} cy={anchor[1]} r="3.5" />)
  }
  return <g>{els}</g>
}

function Figure({ pose, d, ghost }) {
  const j = solve(pose)
  const hl = d.hl || []
  const c = name => 'exd-seg' + (hl.includes(name) ? ' hl' : '')
  const footPts = j.toe ? ` ${pt(j.toe)}` : ''
  let weight = null
  if (!ghost && d.weight === 'hand') weight = <circle className="exd-weight" cx={j.ha[0]} cy={j.ha[1]} r="5" />
  if (!ghost && d.weight === 'sho') weight = <circle className="exd-weight" cx={j.sho[0]} cy={j.sho[1]} r="6" />
  if (!ghost && d.weight === 'knee') weight = <circle className="exd-weight" cx={j.kn[0]} cy={j.kn[1] - 2} r="6" />
  if (!ghost && d.weight === 'shin') {
    const p = lerp2(j.kn, j.ft, 0.85)
    weight = <circle className="exd-weight" cx={p[0]} cy={p[1]} r="5.5" />
  }
  let plate = null
  if (!ghost && d.plate) {
    const vx = j.ft[0] - j.hip[0], vy = j.ft[1] - j.hip[1]
    const n = Math.hypot(vx, vy) || 1
    const px = -vy / n, py = vx / n
    plate = <line className="exd-plate" x1={j.ft[0] - px * 18} y1={j.ft[1] - py * 18} x2={j.ft[0] + px * 18} y2={j.ft[1] + py * 18} />
  }
  let cable = null
  if (!ghost && d.cable) {
    const jA = solve(d.a)
    const anchor = d.cable.top ? [jA.ha[0], 6] : [jA.ha[0] + d.cable.rel[0], jA.ha[1] + d.cable.rel[1]]
    cable = <line className="exd-cable" x1={anchor[0]} y1={anchor[1]} x2={j.ha[0]} y2={j.ha[1]} />
  }
  return (
    <g className={ghost ? 'exd-ghost' : 'exd-fig'}>
      {cable}
      {j.kn2 && <polyline className={c('leg') + ' back'} points={`${pt(pose.hip)} ${pt(j.kn2)} ${pt(j.ft2)} ${pt(j.toe2)}`} />}
      <polyline className={c('leg')} points={`${pt(pose.hip)} ${pt(j.kn)} ${pt(j.ft)}${footPts}`} />
      <line className={c('torso')} x1={pose.hip[0]} y1={pose.hip[1]} x2={j.sho[0]} y2={j.sho[1]} />
      <circle className="exd-head" cx={j.head[0]} cy={j.head[1]} r={L.head} />
      <polyline className={c('arm')} points={`${pt(j.sho)} ${pt(j.el)} ${pt(j.ha)}`} />
      {plate}
      {weight}
    </g>
  )
}

// Seitheben wird von vorn gezeigt, sonst sieht man die Bewegung nicht
function FrontFigure({ t, ghost }) {
  const theta = lerp(8, 88, t)
  const cx = 120, shY = 36
  const arm = s => {
    const sx = cx + s * 22
    const e = [sx + s * Math.sin(rad(theta)) * L.ua, shY + Math.cos(rad(theta)) * L.ua]
    const th2 = theta - 10
    const h = [e[0] + s * Math.sin(rad(th2)) * L.fa, e[1] + Math.cos(rad(th2)) * L.fa]
    return { sx, e, h }
  }
  const L1 = arm(-1), R1 = arm(1)
  return (
    <g className={ghost ? 'exd-ghost' : 'exd-fig'}>
      <polyline className="exd-seg" points={`${cx},84 ${cx - 12},${GROUND} `} />
      <polyline className="exd-seg" points={`${cx},84 ${cx + 12},${GROUND}`} />
      <line className="exd-seg" x1={cx} y1={shY} x2={cx} y2="84" />
      <line className="exd-seg" x1={cx - 22} y1={shY} x2={cx + 22} y2={shY} />
      <circle className="exd-head" cx={cx} cy="20" r={L.head + 1} />
      <polyline className="exd-seg hl" points={`${L1.sx},${shY} ${pt(L1.e)} ${pt(L1.h)}`} />
      <polyline className="exd-seg hl" points={`${R1.sx},${shY} ${pt(R1.e)} ${pt(R1.h)}`} />
      {!ghost && <circle className="exd-weight" cx={L1.h[0]} cy={L1.h[1]} r="5" />}
      {!ghost && <circle className="exd-weight" cx={R1.h[0]} cy={R1.h[1]} r="5" />}
    </g>
  )
}

const PERIOD = 3800
function cycle(ph) {
  if (ph < 0.08) return 0
  if (ph < 0.42) return smooth((ph - 0.08) / 0.34)
  if (ph < 0.54) return 1
  if (ph < 0.9) return 1 - smooth((ph - 0.54) / 0.36)
  return 0
}

// frame: feste Stellung 0..1 (ohne Animation), nützlich für Tests
export default function ExerciseDemo({ demo, frame }) {
  const d = DEMOS[demo]
  const [t, setT] = useState(frame ?? 0)

  useEffect(() => {
    if (!d || frame !== undefined) return
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setT(1)
      return
    }
    let raf, start
    const tick = ts => {
      if (start === undefined) start = ts
      setT(cycle(((ts - start) % PERIOD) / PERIOD))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [demo, frame])

  if (!d) return null
  const tt = frame ?? t

  return (
    <svg className="exd-svg" viewBox="0 -14 240 176" role="img" aria-label="Animierte Darstellung der Übung">
      <line className="exd-floor" x1="8" y1={GROUND + (d.mat ? 4 : 0)} x2="232" y2={GROUND + (d.mat ? 4 : 0)} />
      {d.front ? (
        <>
          <FrontFigure t={1} ghost />
          <FrontFigure t={tt} />
        </>
      ) : (
        <>
          <Equipment d={d} />
          <Figure pose={d.b} d={d} ghost />
          <Figure pose={mix(d.a, d.b, tt)} d={d} />
        </>
      )}
    </svg>
  )
}

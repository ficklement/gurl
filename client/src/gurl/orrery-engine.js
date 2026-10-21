// Framework-free orrery: three gyroscope rings (Sun, Moon, Rising) around Kaiser's medallion.
// React wraps it in Orrery.jsx; the engine owns the SVG and the animation loop.
import { GLYPHS, SIGNS, signOf } from './astro.js';

const NS = 'http://www.w3.org/2000/svg';
const C = 320;
const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
const pt = (deg, r) => [C + r * Math.sin(deg * Math.PI / 180), C - r * Math.cos(deg * Math.PI / 180)];
const easeOutQuint = t => 1 - Math.pow(1 - t, 5);
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const RING_CONFIG = {
  sun:    { r0: 252, r1: 300, glyph: 19, name: 11.5, tilt: 64, prec: 0.16, phase: 0.0, idle: 5,  pitch: 1.0 },
  moon:   { r0: 196, r1: 240, glyph: 16, name: 9.2,  tilt: 56, prec: -0.21, phase: 2.2, idle: -8, pitch: 1.25 },
  rising: { r0: 142, r1: 184, glyph: 19, name: 0,    tilt: 70, prec: 0.27, phase: 4.1, idle: 11, pitch: 1.5 },
};

export function createOrrery(root, { faceSrc, reducedMotion, onTick } = {}) {
  const reduced = reducedMotion ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('orrery');
  root.innerHTML = '';
  const stage = document.createElement('div'); stage.className = 'stage'; root.appendChild(stage);

  // back plate: meridian ring + alignment beam glow
  const back = el('svg', { viewBox: '0 0 640 640', 'aria-hidden': 'true' }, stage);
  el('circle', { cx: C, cy: C, r: 311, class: 'mer-band', 'stroke-width': 14 }, back);
  el('circle', { cx: C, cy: C, r: 304, class: 'meridian', 'stroke-width': 1 }, back);
  el('circle', { cx: C, cy: C, r: 318, class: 'meridian', 'stroke-width': 1 }, back);
  let d = '';
  for (let i = 0; i < 360; i += 2) { const len = i % 10 === 0 ? 5 : 2.5; const a = pt(i, 304), b = pt(i, 304 + len); d += `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`; }
  el('path', { d, class: 'mer-tick' }, back);
  for (let i = 30; i < 360; i += 30) { const [x, y] = pt(i, 313); el('text', { x, y, class: 'mer-num', transform: `rotate(${i} ${x} ${y})` }, back).textContent = String(i).padStart(3, '0'); }
  el('line', { x1: C, y1: 14, x2: C, y2: C - 128, class: 'beam-glow' }, back);

  const rings = {};
  for (const key of ['sun', 'moon', 'rising']) rings[key] = buildRing(key);

  const med = document.createElement('div'); med.className = 'medallion';
  const img = document.createElement('img'); img.alt = 'Kaiser'; if (faceSrc) img.src = faceSrc; med.appendChild(img); stage.appendChild(med);

  const front = el('svg', { viewBox: '0 0 640 640', 'aria-hidden': 'true' }, stage);
  el('line', { x1: C, y1: 14, x2: C, y2: C - 128, class: 'beam' }, front);
  el('path', { d: `M${C - 9} 2 L${C + 9} 2 L${C} 20 Z`, class: 'pointer' }, front);

  function buildRing(key) {
    const cfg = RING_CONFIG[key];
    const host = document.createElement('div'); host.className = `ring-layer ring-${key}`; host.dataset.ring = key; stage.appendChild(host);
    const s = el('svg', { viewBox: '0 0 640 640', 'aria-hidden': 'true' }, host);
    const f = el('filter', { id: `gurl-glow-${key}`, x: '-50%', y: '-50%', width: '200%', height: '200%' }, el('defs', {}, s));
    el('feGaussianBlur', { stdDeviation: 2.4, result: 'b' }, f);
    const m = el('feMerge', {}, f); el('feMergeNode', { in: 'b' }, m); el('feMergeNode', { in: 'SourceGraphic' }, m);
    const g = el('g', {}, s);
    const mid = (cfg.r0 + cfg.r1) / 2, span = cfg.r1 - cfg.r0;
    el('circle', { cx: C, cy: C, r: mid, class: 'band', 'stroke-width': span }, g);
    const hls = [], gls = [], nms = [];
    for (let k = 0; k < 12; k++) {
      const a0 = k * 30, a1 = a0 + 30;
      hls.push(el('path', { class: 'hl', d: `M${pt(a0, cfg.r1)}A${cfg.r1} ${cfg.r1} 0 0 1 ${pt(a1, cfg.r1)}L${pt(a1, cfg.r0)}A${cfg.r0} ${cfg.r0} 0 0 0 ${pt(a0, cfg.r0)}Z` }, g));
    }
    let ticks = '', bounds = '';
    for (let i = 0; i < 360; i++) {
      const len = i % 30 === 0 ? 0 : i % 5 === 0 ? 8 : 4;
      if (len) { const a = pt(i, cfg.r1), b = pt(i, cfg.r1 - len); ticks += `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`; }
    }
    for (let k = 0; k < 12; k++) bounds += `M${pt(k * 30, cfg.r1)}L${pt(k * 30, cfg.r0)}`;
    el('path', { d: ticks, class: 'ticks' }, g);
    el('path', { d: bounds, class: 'bounds' }, g);
    el('circle', { cx: C, cy: C, r: cfg.r1, class: 'edge' }, g);
    el('circle', { cx: C, cy: C, r: cfg.r0, class: 'edge' }, g);
    for (let k = 0; k < 12; k++) {
      const ang = k * 30 + 15, gr = cfg.name ? cfg.r0 + span * 0.6 : mid - 1;
      const gt = el('text', { x: C, y: C - gr, class: 'sg', 'font-size': cfg.glyph, transform: `rotate(${ang} ${C} ${C})` }, g); gt.textContent = GLYPHS[k]; gls.push(gt);
      if (cfg.name) { const nt = el('text', { x: C, y: C - (cfg.r0 + 6), class: 'sn', 'font-size': cfg.name, transform: `rotate(${ang} ${C} ${C})` }, g); nt.textContent = SIGNS[k].toUpperCase(); nms.push(nt); }
    }
    return { key, cfg, host, g, hls, gls, nms, rot: Math.random() * 360, tilt: cfg.tilt, prec: cfg.phase * 57.3, settled: false, anim: null, lon: null, lastSeg: null };
  }

  function mark(R, sign) {
    R.hls.forEach((h, i) => h.classList.toggle('lit', i === sign));
    R.gls.forEach((t, i) => { t.classList.toggle('on', i === sign); t.setAttribute('filter', i === sign ? `url(#gurl-glow-${R.key})` : ''); });
    R.nms.forEach((t, i) => t.classList.toggle('on', i === sign));
  }

  /** mode 'full' = roulette spin (3+ turns); 'adjust' = short glide along the shortest path */
  function spinTo(key, lon, mode = 'full', { approx = false } = {}) {
    const R = rings[key];
    return new Promise(resolve => {
      let to = -lon;
      if (mode === 'full') { while (to > R.rot - 360 * 3) to -= 360; }
      else { while (to - R.rot > 180) to -= 360; while (to - R.rot < -180) to += 360; }
      R.lon = lon;
      R.host.classList.toggle('approx', approx);
      R.host.classList.remove('mystery');
      if (mode === 'adjust') mark(R, signOf(lon));
      R.anim = { from: R.rot, to, t0: performance.now(), dur: reduced ? 1 : mode === 'full' ? 3600 : 1100, tiltFrom: R.tilt,
        done: () => { mark(R, signOf(lon)); R.host.classList.add('settled'); resolve(); } };
    });
  }
  function unsettle(key, mystery = false) {
    const R = rings[key];
    R.settled = false; R.anim = null; R.lon = null;
    R.host.classList.remove('settled', 'approx'); R.host.classList.toggle('mystery', mystery);
    mark(R, -1);
  }
  const setAligned = (on) => root.classList.toggle('aligned', !!on);
  const setFace = (src) => {
    if (!src || img.getAttribute('src') === src) return;
    img.classList.add('blink');
    setTimeout(() => { img.src = src; img.classList.remove('blink'); }, 160);
  };
  const isSettled = (key) => rings[key].settled || !!rings[key].anim;

  let last = performance.now(), raf = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (const k in rings) {
      const R = rings[k];
      if (R.anim) {
        const t = Math.min(1, (now - R.anim.t0) / R.anim.dur);
        R.rot = R.anim.from + (R.anim.to - R.anim.from) * easeOutQuint(t);
        R.tilt = R.anim.tiltFrom * (1 - easeInOut(Math.min(1, t * 1.7)));
        if (t >= 1) { const done = R.anim.done; R.anim = null; R.settled = true; R.tilt = 0; R.rot = ((R.rot % 360) + 360) % 360 - 360; done(); }
      } else if (!R.settled) {
        if (reduced) R.tilt = R.cfg.tilt;
        else { R.tilt += (R.cfg.tilt - R.tilt) * Math.min(1, dt * 1.2); R.prec += R.cfg.prec * 60 * dt; R.rot += R.cfg.idle * dt; }
      }
      const seg = Math.floor(R.rot / 30);
      if (R.anim && seg !== R.lastSeg && onTick) onTick(R.cfg.pitch);
      R.lastSeg = seg;
      R.g.setAttribute('transform', `rotate(${R.rot.toFixed(2)} ${C} ${C})`);
      R.host.style.transform = `rotateZ(${R.prec.toFixed(2)}deg) rotateX(${R.tilt.toFixed(2)}deg) rotateZ(${(-R.prec).toFixed(2)}deg)`;
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return { spinTo, unsettle, setAligned, setFace, isSettled, destroy: () => { cancelAnimationFrame(raf); root.innerHTML = ''; } };
}

/** Tiny roulette click via WebAudio; only call after a user gesture. */
export function makeTicker() {
  let ctx = null;
  return (pitch = 1) => {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = 1700 * pitch;
      g.gain.setValueAtTime(0.035, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
      o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.035);
    } catch { /* audio unavailable */ }
  };
}

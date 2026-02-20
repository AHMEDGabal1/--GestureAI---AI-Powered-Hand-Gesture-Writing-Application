// ─────────────────────────────────────────────────────────────────────────────
// $1 Unistroke Recognizer — accurate stroke-to-letter matching
// Based on: Wobbrock et al. 2007 "Gestures without libraries, toolkits or training"
// Extended with a full A–Z + 0–9 template library
// ─────────────────────────────────────────────────────────────────────────────

const NUM_POINTS = 64          // resample resolution
const SQUARE_SIZE = 250.0      // reference square side
const ORIGIN = { x: 0, y: 0 }
const DIAGONAL = Math.sqrt(SQUARE_SIZE * SQUARE_SIZE + SQUARE_SIZE * SQUARE_SIZE)
const HALF_DIAGONAL = 0.5 * DIAGONAL
const ANGLE_RANGE = Math.PI   // ±180°
const ANGLE_PRECISION = Math.PI / 90  // 2° step
const PHI = 0.5 * (-1 + Math.sqrt(5)) // golden ratio

// ─── Point helpers ────────────────────────────────────────────────────────────
function pathLength(pts) {
  let d = 0
  for (let i = 1; i < pts.length; i++) {
    d += dist(pts[i - 1], pts[i])
  }
  return d
}

function dist(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

function centroid(pts) {
  let cx = 0, cy = 0
  for (const p of pts) { cx += p.x; cy += p.y }
  return { x: cx / pts.length, y: cy / pts.length }
}

// ─── Resample to N equally-spaced points ──────────────────────────────────────
function resample(pts, n) {
  const I = pathLength(pts) / (n - 1)
  let D = 0
  const newPts = [{ x: pts[0].x, y: pts[0].y }]
  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i - 1], pts[i])
    if (D + d >= I) {
      const qx = pts[i - 1].x + ((I - D) / d) * (pts[i].x - pts[i - 1].x)
      const qy = pts[i - 1].y + ((I - D) / d) * (pts[i].y - pts[i - 1].y)
      newPts.push({ x: qx, y: qy })
      pts = [{ x: qx, y: qy }, ...pts.slice(i)]
      i = 1
      D = 0
    } else {
      D += d
    }
  }
  if (newPts.length === n - 1) {
    newPts.push({ x: pts[pts.length - 1].x, y: pts[pts.length - 1].y })
  }
  return newPts
}

// ─── Rotate around centroid by angle θ ────────────────────────────────────────
function rotateBy(pts, theta) {
  const c = centroid(pts)
  return pts.map(p => ({
    x: (p.x - c.x) * Math.cos(theta) - (p.y - c.y) * Math.sin(theta) + c.x,
    y: (p.x - c.x) * Math.sin(theta) + (p.y - c.y) * Math.cos(theta) + c.y
  }))
}

// ─── Indicative angle: angle from centroid to first point ────────────────────
function indicativeAngle(pts) {
  const c = centroid(pts)
  return Math.atan2(c.y - pts[0].y, c.x - pts[0].x)
}

// ─── Scale to reference square, keeping aspect ratio ─────────────────────────
function scaleTo(pts, size) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const p of pts) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y
  }
  const w = maxX - minX, h = maxY - minY
  const scale = size / Math.max(w, h)
  return pts.map(p => ({ x: p.x * scale, y: p.y * scale }))
}

// ─── Translate centroid to origin ────────────────────────────────────────────
function translateTo(pts, pt) {
  const c = centroid(pts)
  return pts.map(p => ({ x: p.x + pt.x - c.x, y: p.y + pt.y - c.y }))
}

// ─── Path distance between two point arrays ────────────────────────────────
function pathDistance(a, b) {
  let d = 0
  for (let i = 0; i < a.length; i++) d += dist(a[i], b[i])
  return d / a.length
}

// ─── Golden ratio search ─────────────────────────────────────────────────────
function distanceAtBestAngle(pts, T, a, b, threshold) {
  let x1 = PHI * a + (1 - PHI) * b
  let f1 = distanceAtAngle(pts, T, x1)
  let x2 = (1 - PHI) * a + PHI * b
  let f2 = distanceAtAngle(pts, T, x2)
  while (Math.abs(b - a) > threshold) {
    if (f1 < f2) { b = x2; x2 = x1; f2 = f1; x1 = PHI * a + (1 - PHI) * b; f1 = distanceAtAngle(pts, T, x1) }
    else { a = x1; x1 = x2; f1 = f2; x2 = (1 - PHI) * a + PHI * b; f2 = distanceAtAngle(pts, T, x2) }
  }
  return Math.min(f1, f2)
}

function distanceAtAngle(pts, T, theta) {
  const newPts = rotateBy(pts, theta)
  return pathDistance(newPts, T)
}

// ─── Preprocess a stroke into canonical form ──────────────────────────────────
function preprocess(pts) {
  let p = resample(pts, NUM_POINTS)
  const theta = indicativeAngle(p)
  p = rotateBy(p, -theta)
  p = scaleTo(p, SQUARE_SIZE)
  p = translateTo(p, ORIGIN)
  return p
}

// ─── Generate a template by preprocessing hand-authored point paths ───────────
function makeTemplate(name, points) {
  return { name, pts: preprocess(points) }
}

// ─── Hand-authored templates for A–Z ─────────────────────────────────────────
// Points are in a 0–100 coordinate space, top-left origin.
// Each letter is a single continuous stroke path.

/* eslint-disable no-multi-spaces */
const RAW_TEMPLATES = [
  // A — two down-strokes meeting at peak, with crossbar
  ['A', [
    { x: 50, y: 0 }, { x: 20, y: 100 }, { x: 25, y: 70 }, { x: 75, y: 70 }, { x: 80, y: 100 }, { x: 50, y: 0 }
  ]],
  // B — vertical stroke then two bumps right
  ['B', [
    { x: 20, y: 0 }, { x: 20, y: 100 }, { x: 20, y: 0 }, { x: 60, y: 5 }, { x: 70, y: 15 }, { x: 60, y: 40 }, { x: 20, y: 45 },
    { x: 65, y: 50 }, { x: 75, y: 65 }, { x: 60, y: 85 }, { x: 20, y: 100 }
  ]],
  // C — arc opening right
  ['C', [
    { x: 80, y: 20 }, { x: 60, y: 5 }, { x: 30, y: 5 }, { x: 10, y: 30 }, { x: 10, y: 70 }, { x: 30, y: 95 }, { x: 60, y: 95 }, { x: 80, y: 80 }
  ]],
  // D — vertical then large right bump
  ['D', [
    { x: 20, y: 0 }, { x: 20, y: 100 }, { x: 20, y: 0 }, { x: 55, y: 5 }, { x: 75, y: 25 }, { x: 80, y: 50 }, { x: 75, y: 75 }, { x: 55, y: 95 }, { x: 20, y: 100 }
  ]],
  // E — vertical + three horizontals (simplified as zigzag)
  ['E', [
    { x: 70, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 50 }, { x: 60, y: 50 }, { x: 20, y: 50 }, { x: 20, y: 100 }, { x: 70, y: 100 }
  ]],
  // F — vertical + two horizontals
  ['F', [
    { x: 70, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 50 }, { x: 60, y: 50 }, { x: 20, y: 50 }, { x: 20, y: 100 }
  ]],
  // G — C arc + horizontal inward
  ['G', [
    { x: 80, y: 20 }, { x: 60, y: 5 }, { x: 30, y: 5 }, { x: 10, y: 30 }, { x: 10, y: 70 }, { x: 30, y: 95 }, { x: 60, y: 95 },
    { x: 80, y: 75 }, { x: 80, y: 55 }, { x: 55, y: 55 }
  ]],
  // H — two verticals + crossbar
  ['H', [
    { x: 20, y: 0 }, { x: 20, y: 100 }, { x: 20, y: 50 }, { x: 80, y: 50 }, { x: 80, y: 0 }, { x: 80, y: 100 }
  ]],
  // I — single vertical
  ['I', [
    { x: 50, y: 0 }, { x: 50, y: 100 }
  ]],
  // J — vertical then hook left at bottom
  ['J', [
    { x: 70, y: 0 }, { x: 70, y: 80 }, { x: 55, y: 100 }, { x: 30, y: 95 }, { x: 25, y: 75 }
  ]],
  // K — vertical + two diagonals
  ['K', [
    { x: 20, y: 0 }, { x: 20, y: 100 }, { x: 20, y: 50 }, { x: 70, y: 0 }, { x: 20, y: 50 }, { x: 70, y: 100 }
  ]],
  // L — vertical + horizontal right
  ['L', [
    { x: 30, y: 0 }, { x: 30, y: 100 }, { x: 80, y: 100 }
  ]],
  // M — up, two zig-zag peaks, down
  ['M', [
    { x: 10, y: 100 }, { x: 10, y: 0 }, { x: 50, y: 60 }, { x: 90, y: 0 }, { x: 90, y: 100 }
  ]],
  // N — up, diagonal down-right, up again
  ['N', [
    { x: 15, y: 100 }, { x: 15, y: 0 }, { x: 85, y: 100 }, { x: 85, y: 0 }
  ]],
  // O — full oval clockwise
  ['O', [
    { x: 50, y: 0 }, { x: 80, y: 20 }, { x: 90, y: 50 }, { x: 80, y: 80 }, { x: 50, y: 100 }, { x: 20, y: 80 }, { x: 10, y: 50 }, { x: 20, y: 20 }, { x: 50, y: 0 }
  ]],
  // P — vertical + top-right bump
  ['P', [
    { x: 20, y: 100 }, { x: 20, y: 0 }, { x: 55, y: 5 }, { x: 70, y: 20 }, { x: 55, y: 45 }, { x: 20, y: 45 }
  ]],
  // Q — oval + diagonal tick lower-right
  ['Q', [
    { x: 45, y: 0 }, { x: 75, y: 15 }, { x: 85, y: 45 }, { x: 75, y: 75 }, { x: 45, y: 90 }, { x: 15, y: 75 }, { x: 5, y: 45 },
    { x: 15, y: 15 }, { x: 45, y: 0 }, { x: 55, y: 65 }, { x: 85, y: 100 }
  ]],
  // R — vertical + bump + diagonal
  ['R', [
    { x: 20, y: 100 }, { x: 20, y: 0 }, { x: 55, y: 5 }, { x: 70, y: 20 }, { x: 55, y: 45 }, { x: 20, y: 45 }, { x: 70, y: 100 }
  ]],
  // S — two opposing curves
  ['S', [
    { x: 75, y: 15 }, { x: 55, y: 0 }, { x: 25, y: 5 }, { x: 15, y: 20 }, { x: 25, y: 40 }, { x: 50, y: 50 },
    { x: 75, y: 60 }, { x: 80, y: 80 }, { x: 65, y: 98 }, { x: 35, y: 100 }, { x: 20, y: 85 }
  ]],
  // T — horizontal then vertical drop
  ['T', [
    { x: 10, y: 0 }, { x: 90, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 100 }
  ]],
  // U — down, curve, up
  ['U', [
    { x: 20, y: 0 }, { x: 20, y: 70 }, { x: 30, y: 90 }, { x: 50, y: 100 }, { x: 70, y: 90 }, { x: 80, y: 70 }, { x: 80, y: 0 }
  ]],
  // V — down-right then up-right
  ['V', [
    { x: 10, y: 0 }, { x: 50, y: 100 }, { x: 90, y: 0 }
  ]],
  // W — down, up, down, up
  ['W', [
    { x: 5, y: 0 }, { x: 25, y: 100 }, { x: 50, y: 50 }, { x: 75, y: 100 }, { x: 95, y: 0 }
  ]],
  // X — diagonal down-right then diagonal down-left crossing
  ['X', [
    { x: 10, y: 0 }, { x: 90, y: 100 }, { x: 50, y: 50 }, { x: 10, y: 100 }, { x: 90, y: 0 }
  ]],
  // Y — two upper diagonals meeting mid + drop
  ['Y', [
    { x: 10, y: 0 }, { x: 50, y: 50 }, { x: 90, y: 0 }, { x: 50, y: 50 }, { x: 50, y: 100 }
  ]],
  // Z — horizontal, diagonal, horizontal
  ['Z', [
    { x: 10, y: 0 }, { x: 90, y: 0 }, { x: 10, y: 100 }, { x: 90, y: 100 }
  ]],

  // 0–9 digits
  ['0', [
    { x: 50, y: 0 }, { x: 80, y: 20 }, { x: 90, y: 50 }, { x: 80, y: 80 }, { x: 50, y: 100 }, { x: 20, y: 80 }, { x: 10, y: 50 }, { x: 20, y: 20 }, { x: 50, y: 0 }
  ]],
  ['1', [
    { x: 30, y: 20 }, { x: 50, y: 0 }, { x: 50, y: 100 }
  ]],
  ['2', [
    { x: 15, y: 25 }, { x: 30, y: 5 }, { x: 65, y: 5 }, { x: 80, y: 25 }, { x: 80, y: 45 }, { x: 10, y: 90 }, { x: 10, y: 100 }, { x: 90, y: 100 }
  ]],
  ['3', [
    { x: 15, y: 10 }, { x: 50, y: 0 }, { x: 80, y: 15 }, { x: 70, y: 40 }, { x: 45, y: 50 }, { x: 75, y: 60 }, { x: 85, y: 80 }, { x: 65, y: 98 }, { x: 30, y: 100 }, { x: 10, y: 85 }
  ]],
  ['4', [
    { x: 65, y: 0 }, { x: 10, y: 70 }, { x: 90, y: 70 }, { x: 65, y: 70 }, { x: 65, y: 0 }, { x: 65, y: 100 }
  ]],
  ['5', [
    { x: 80, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 45 }, { x: 55, y: 40 }, { x: 80, y: 55 }, { x: 75, y: 85 }, { x: 50, y: 100 }, { x: 20, y: 90 }
  ]],
  ['6', [
    { x: 70, y: 5 }, { x: 40, y: 0 }, { x: 15, y: 25 }, { x: 10, y: 60 }, { x: 20, y: 90 }, { x: 50, y: 100 }, { x: 75, y: 85 }, { x: 80, y: 60 }, { x: 65, y: 45 }, { x: 25, y: 45 }
  ]],
  ['7', [
    { x: 10, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 10 }, { x: 40, y: 100 }
  ]],
  ['8', [
    { x: 50, y: 50 }, { x: 75, y: 30 }, { x: 65, y: 10 }, { x: 35, y: 10 }, { x: 25, y: 30 }, { x: 50, y: 50 },
    { x: 80, y: 70 }, { x: 70, y: 95 }, { x: 30, y: 95 }, { x: 20, y: 70 }, { x: 50, y: 50 }
  ]],
  ['9', [
    { x: 50, y: 0 }, { x: 80, y: 15 }, { x: 85, y: 45 }, { x: 65, y: 65 }, { x: 35, y: 65 }, { x: 15, y: 45 }, { x: 20, y: 15 }, { x: 50, y: 0 },
    { x: 75, y: 65 }, { x: 60, y: 100 }
  ]]
]
/* eslint-enable no-multi-spaces */

// Build template bank — each letter appears once
const TEMPLATES = RAW_TEMPLATES.map(([name, pts]) => makeTemplate(name, pts))

// ─── Core $1 recognition ──────────────────────────────────────────────────────
function dollarRecognize(rawPoints) {
  const pts = preprocess(rawPoints)
  let bestScore = Infinity
  let bestTemplate = null

  for (const t of TEMPLATES) {
    const d = distanceAtBestAngle(pts, t.pts, -ANGLE_RANGE, ANGLE_RANGE, ANGLE_PRECISION)
    if (d < bestScore) {
      bestScore = d
      bestTemplate = t
    }
  }

  // Convert distance to confidence  (empirically: score=0 → conf=1, score=HALF_DIAGONAL → conf=0)
  const confidence = Math.max(0, 1 - bestScore / HALF_DIAGONAL)
  return { letter: bestTemplate ? bestTemplate.name : '?', confidence, score: bestScore }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function recognizeLetter(strokePoints) {
  if (!strokePoints || strokePoints.length < 10) return null
  const cleaned = strokePoints.filter(p => typeof p.x === 'number' && typeof p.y === 'number')
  if (cleaned.length < 10) return null
  return dollarRecognize(cleaned)
}

export function normalizeStroke(points) {
  if (!points || points.length === 0) return []
  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const w = maxX - minX || 1, h = maxY - minY || 1
  return points.map(p => ({
    x: ((p.x - minX) / w) * 100,
    y: ((p.y - minY) / h) * 100,
    timestamp: p.timestamp
  }))
}

export function predictWord(currentText) {
  const commonWords = [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with',
    'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
    'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'hello', 'world', 'write', 'gesture', 'ai', 'thank', 'please', 'sorry', 'yes', 'no', 'ok'
  ]
  if (!currentText || currentText.length < 2) return null
  const lastWord = currentText.split(' ').pop().toLowerCase()
  if (lastWord.length < 2) return null
  const match = commonWords.find(w => w.startsWith(lastWord))
  return match || null
}

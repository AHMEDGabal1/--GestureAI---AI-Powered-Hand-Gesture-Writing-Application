export function movingAverage(points, windowSize = 5) {
  if (!points || points.length < windowSize) return points
  
  const result = []
  
  for (let i = 0; i < points.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2))
    const end = Math.min(points.length, i + Math.ceil(windowSize / 2))
    
    let sumX = 0
    let sumY = 0
    let count = 0
    
    for (let j = start; j < end; j++) {
      sumX += points[j].x
      sumY += points[j].y
      count++
    }
    
    result.push({
      x: sumX / count,
      y: sumY / count,
      timestamp: points[i].timestamp
    })
  }
  
  return result
}

export function bezierSmooth(points, segments = 10) {
  if (!points || points.length < 3) return points
  
  const result = []
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    
    for (let t = 0; t < segments; t++) {
      const s = t / segments
      const x = catmullRom(p0.x, p1.x, p2.x, p3.x, s)
      const y = catmullRom(p0.y, p1.y, p2.y, p3.y, s)
      
      result.push({ x, y, timestamp: p1.timestamp })
    }
  }
  
  result.push(points[points.length - 1])
  
  return result
}

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t
  const t3 = t2 * t
  
  return 0.5 * (
    2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  )
}

export function simplifyStroke(points, tolerance = 2) {
  if (!points || points.length < 3) return points
  
  const simplified = [points[0]]
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = simplified[simplified.length - 1]
    const curr = points[i]
    
    const dist = perpendicularDistance(curr, prev, points[i + 1])
    
    if (dist > tolerance) {
      simplified.push(curr)
    }
  }
  
  simplified.push(points[points.length - 1])
  
  return simplified
}

function perpendicularDistance(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  
  const length = Math.sqrt(dx * dx + dy * dy)
  
  if (length === 0) return Math.hypot(point.x - lineStart.x, point.y - lineStart.y)
  
  const t = Math.max(0, Math.min(1, 
    ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (length * length)
  ))
  
  const projX = lineStart.x + t * dx
  const projY = lineStart.y + t * dy
  
  return Math.hypot(point.x - projX, point.y - projY)
}

export function applySmoothing(points, options = {}) {
  const { 
    movingAvgWindow = 5, 
    useBezier = true,
    simplify = true,
    simplifyTolerance = 1.5
  } = options
  
  let result = [...points]
  
  if (simplify && result.length > 10) {
    result = simplifyStroke(result, simplifyTolerance)
  }
  
  if (result.length > movingAvgWindow) {
    result = movingAverage(result, movingAvgWindow)
  }
  
  if (useBezier && result.length > 5) {
    result = bezierSmooth(result, 5)
  }
  
  return result
}

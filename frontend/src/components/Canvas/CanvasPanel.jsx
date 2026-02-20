import React, { useEffect, useRef, useState } from 'react'

function CanvasPanel({ mode, strokePoints, onCanvasUpdate, clearTrigger }) {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef(null)
  const pointsRef = useRef([])
  const [showClearBtn, setShowClearBtn] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctxRef.current = ctx

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      // Fill background so canvas never appears white
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#16161d'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    if (clearTrigger) {
      const ctx = ctxRef.current
      const canvas = canvasRef.current
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#16161d'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        pointsRef.current = []
      }
      onCanvasUpdate?.({ cleared: true })
    }
  }, [clearTrigger, onCanvasUpdate])

  useEffect(() => {
    if (!strokePoints || strokePoints.length === 0) return

    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return

    const isDrawing = mode === 'writing' || mode === 'text'

    if (isDrawing && strokePoints.length > 0) {
      const rect = canvas.getBoundingClientRect()
      const scaleX = rect.width / 100
      const scaleY = rect.height / 100

      const points = strokePoints.slice(-20).map(p => ({
        x: p.x * scaleX,
        y: p.y * scaleY
      }))

      if (points.length > 1) {
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)

        for (let i = 1; i < points.length; i++) {
          const xc = (points[i].x + points[i - 1].x) / 2
          const yc = (points[i].y + points[i - 1].y) / 2
          ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc)
        }

        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)

        const gradient = ctx.createLinearGradient(
          points[0].x, points[0].y,
          points[points.length - 1].x, points[points.length - 1].y
        )
        gradient.addColorStop(0, '#00d4aa')
        gradient.addColorStop(1, '#7c3aed')

        ctx.strokeStyle = gradient
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        ctx.shadowColor = '#00d4aa'
        ctx.shadowBlur = 10
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      setShowClearBtn(true)
    }
  }, [strokePoints, mode])

  const handleClear = () => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#16161d'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      pointsRef.current = []
      setShowClearBtn(false)
    }
  }

  const getModeHint = () => {
    switch (mode) {
      case 'writing':
        return '✍️ Move finger to write'
      case 'text':
        return '✌️ Move fingers to recognize'
      case 'erase':
        return '🧽 Palm detected - Erasing!'
      case 'control':
        return '🎮 Swipe to control'
      default:
        return '✋ Show hand to begin'
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Drawing Canvas</span>
      </div>
      <div className="panel-content">
        <canvas
          ref={canvasRef}
          className="drawing-canvas"
        />

        {showClearBtn && (
          <div className="canvas-overlay">
            <button className="canvas-btn" onClick={handleClear}>
              Clear Canvas
            </button>
          </div>
        )}

        <div className="gesture-hint">
          {getModeHint()}
        </div>
      </div>
    </div>
  )
}

export default CanvasPanel

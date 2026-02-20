import React, { useState, useCallback, useRef, useEffect } from 'react'
import Header from './components/Header/Header'
import CameraPanel from './components/Camera/CameraPanel'
import CanvasPanel from './components/Canvas/CanvasPanel'
import OutputPanel from './components/Output/OutputPanel'
import { detectGesture, getFingerStates } from './utils/gestureDetector'
import { recognizeLetter } from './utils/strokeRecognizer'

function App() {
  const [theme, setTheme] = useState('dark')
  const [mode, setMode] = useState('waiting')
  const [outputText, setOutputText] = useState([])
  const [canvasData, setCanvasData] = useState(null)
  const [isModelReady, setIsModelReady] = useState(false)
  const [fps, setFps] = useState(0)
  const [confidence, setConfidence] = useState(0)
  const [predictedWord, setPredictedWord] = useState('')

  const handDataRef = useRef(null)
  const lastFrameTime = useRef(performance.now())
  const frameCount = useRef(0)
  const strokePoints = useRef([])
  const controlModeTimer = useRef(null)
  const lastPalmTime = useRef(0)
  const isControlMode = useRef(false)
  const swipeStartPos = useRef(null)
  const controlModeStartTime = useRef(0)
  const lastModeRef = useRef('waiting')        // avoid redundant setMode calls
  const handLostRef = useRef(false)            // track hand-lost state

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const handleHandResults = useCallback((results, video) => {
    const now = performance.now()
    frameCount.current++

    if (now - lastFrameTime.current >= 1000) {
      setFps(Math.round(frameCount.current * 1000 / (now - lastFrameTime.current)))
      frameCount.current = 0
      lastFrameTime.current = now
    }

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      handDataRef.current = null
      // Only update state once when hand is actually lost (not every frame)
      if (!handLostRef.current) {
        handLostRef.current = true
        lastModeRef.current = 'waiting'
        setMode('waiting')
      }
      return
    }
    handLostRef.current = false

    const landmarks = results.multiHandLandmarks[0]
    handDataRef.current = landmarks

    const fingerStates = getFingerStates(landmarks)
    const gesture = detectGesture(fingerStates, landmarks)

    const indexTip = landmarks[8]
    const middleTip = landmarks[12]
    const pinkyTip = landmarks[20]

    if (gesture === 'control') {
      if (!isControlMode.current) {
        if (!controlModeTimer.current) {
          controlModeStartTime.current = now
          controlModeTimer.current = setTimeout(() => {
            isControlMode.current = true
            setMode('control')
          }, 2000)
        }
      } else {
        if (swipeStartPos.current) {
          const dx = indexTip.x - swipeStartPos.current.x
          const dy = indexTip.y - swipeStartPos.current.y

          if (Math.abs(dx) > 0.15 || Math.abs(dy) > 0.15) {
            if (Math.abs(dx) > Math.abs(dy)) {
              if (dx > 0) {
                setOutputText(prev => [...prev, { char: ' ', confidence: 1 }])
              } else {
                setOutputText(prev => prev.slice(0, -1))
              }
            } else {
              if (dy < 0) {
                console.log('Submit text')
              } else {
                setOutputText([])
              }
            }
            swipeStartPos.current = { x: indexTip.x, y: indexTip.y }
          }
        } else {
          swipeStartPos.current = { x: indexTip.x, y: indexTip.y }
        }
      }
    } else {
      if (controlModeTimer.current) {
        clearTimeout(controlModeTimer.current)
        controlModeTimer.current = null
      }
      if (gesture === 'writing') {
        isControlMode.current = false
        swipeStartPos.current = null
        // Only call setMode when gesture actually changed
        if (lastModeRef.current !== 'writing') { lastModeRef.current = 'writing'; setMode('writing') }

        const x = (1 - indexTip.x) * 100
        const y = indexTip.y * 100

        if (strokePoints.current.length === 0 ||
          Math.hypot(x - strokePoints.current[strokePoints.current.length - 1].x,
            y - strokePoints.current[strokePoints.current.length - 1].y) > 1.5) {
          strokePoints.current.push({ x, y, timestamp: now })
        }
      } else if (gesture === 'text') {
        isControlMode.current = false
        swipeStartPos.current = null
        if (lastModeRef.current !== 'text') { lastModeRef.current = 'text'; setMode('text') }

        const x = (1 - indexTip.x) * 100
        const y = indexTip.y * 100

        if (strokePoints.current.length === 0 ||
          Math.hypot(x - strokePoints.current[strokePoints.current.length - 1].x,
            y - strokePoints.current[strokePoints.current.length - 1].y) > 1.5) {
          strokePoints.current.push({ x, y, timestamp: now })
        }
      } else if (gesture === 'erase') {
        isControlMode.current = false
        swipeStartPos.current = null
        if (lastModeRef.current !== 'erase') { lastModeRef.current = 'erase'; setMode('erase') }
        strokePoints.current = []
        setCanvasData({ clear: true })
      } else if (gesture === 'idle') {
        isControlMode.current = false
        swipeStartPos.current = null
        if (lastModeRef.current !== 'idle') { lastModeRef.current = 'idle' }

        if (strokePoints.current.length > 8) {
          const result = recognizeLetter(strokePoints.current)
          if (result && result.letter) {
            setOutputText(prev => [...prev, {
              char: result.letter,
              confidence: result.confidence
            }])
            setConfidence(result.confidence)
          }
        }
        strokePoints.current = []
      }
    }

    return { landmarks, fingerStates, gesture }
  }, [])

  const handleCanvasUpdate = useCallback((data) => {
    setCanvasData(data)
  }, [])

  const handleClearCanvas = useCallback(() => {
    setCanvasData({ clear: true })
    strokePoints.current = []
  }, [])

  const handleSavePNG = useCallback(() => {
    const canvas = document.querySelector('.drawing-canvas')
    if (canvas) {
      const link = document.createElement('a')
      link.download = 'gestureai-drawing.png'
      link.href = canvas.toDataURL()
      link.click()
    }
  }, [])

  const handleSaveTXT = useCallback(() => {
    const text = outputText.map(t => t.char).join('')
    const blob = new Blob([text], { type: 'text/plain' })
    const link = document.createElement('a')
    link.download = 'gestureai-text.txt'
    link.href = URL.createObjectURL(blob)
    link.click()
  }, [outputText])

  const handleCopyText = useCallback(() => {
    const text = outputText.map(t => t.char).join('')
    navigator.clipboard.writeText(text)
  }, [outputText])

  const handleClearOutput = useCallback(() => {
    setOutputText([])
    setPredictedWord('')
  }, [])

  return (
    <div className="app">
      <Header
        theme={theme}
        mode={mode}
        onToggleTheme={toggleTheme}
      />

      <div className="main-content">
        <CameraPanel
          onHandResults={handleHandResults}
          onModelReady={setIsModelReady}
        />

        <CanvasPanel
          mode={mode}
          strokePoints={strokePoints.current}
          onCanvasUpdate={handleCanvasUpdate}
          clearTrigger={canvasData?.clear}
        />
      </div>

      <OutputPanel
        outputText={outputText}
        confidence={confidence}
        predictedWord={predictedWord}
        onSavePNG={handleSavePNG}
        onSaveTXT={handleSaveTXT}
        onCopyText={handleCopyText}
        onClearOutput={handleClearOutput}
      />

      <div className="footer-stats">
        <div className="stats-item">
          <span className={`status-dot ${isModelReady ? 'active' : ''}`}></span>
          <span>AI Model: {isModelReady ? 'Ready' : 'Loading...'}</span>
        </div>
        <div className="stats-item">
          <span>FPS: {fps}</span>
        </div>
        <div className="stats-item">
          <span>Strokes: {strokePoints.current.length}</span>
        </div>
      </div>
    </div>
  )
}

export default App

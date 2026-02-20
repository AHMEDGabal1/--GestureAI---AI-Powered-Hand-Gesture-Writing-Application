import React, { useEffect, useRef, useState } from 'react'

function CameraPanel({ onHandResults, onModelReady }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const cameraRef = useRef(null)
  const processingRef = useRef(false)   // prevent frame pile-up
  const frameSkipRef = useRef(0)        // throttle: process every Nth frame
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)

  useEffect(() => {
    const initializeMediaPipe = async () => {
      try {
        const HandsClass = window.Hands
        const CameraClass = window.Camera
        const drawConnectorsFn = window.drawConnectors
        const drawLandmarksFn = window.drawLandmarks
        const HAND_CONNECTIONS = window.HAND_CONNECTIONS

        if (!HandsClass || !CameraClass) {
          throw new Error('MediaPipe failed to load from CDN. Check your internet connection.')
        }

        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d', { willReadFrequently: false })

        const hands = new HandsClass({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        })

        // modelComplexity 0 = "Lite" — much faster, still accurate enough
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,           // ← was 1 (Full). Lite = ~2× faster
          minDetectionConfidence: 0.6,  // slightly lower = less missed frames
          minTrackingConfidence: 0.5
        })

        hands.onResults((results) => {
          processingRef.current = false  // ready for next frame

          // Fast canvas draw — only redraw if we have landmarks
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          if (results.multiHandLandmarks?.length > 0) {
            for (const landmarks of results.multiHandLandmarks) {
              drawConnectorsFn?.(ctx, landmarks, HAND_CONNECTIONS,
                { color: '#00d4aa', lineWidth: 2 })
              drawLandmarksFn?.(ctx, landmarks,
                { color: '#f472b6', lineWidth: 1, radius: 3 })
            }
          }

          onHandResults?.(results, video)
        })

        const camera = new CameraClass(video, {
          onFrame: async () => {
            // Skip frame if previous is still processing (prevents queue pile-up)
            if (processingRef.current) return

            // Throttle: only process every 2nd frame (halves CPU load)
            frameSkipRef.current = (frameSkipRef.current + 1) % 2
            if (frameSkipRef.current !== 0) return

            processingRef.current = true
            await hands.send({ image: video })
          },
          width: 320,   // ← was 640. Lower res = much faster inference
          height: 240   // ← was 480
        })

        await camera.start()
        cameraRef.current = camera
        setCameraReady(true)
        setLoading(false)
        onModelReady?.(true)

      } catch (err) {
        console.error('MediaPipe initialization error:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    const timer = setTimeout(initializeMediaPipe, 500)
    return () => {
      clearTimeout(timer)
      if (cameraRef.current) cameraRef.current.stop()
    }
  }, [onHandResults, onModelReady])

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video && canvas) {
      const onMeta = () => {
        canvas.width = video.videoWidth || 320
        canvas.height = video.videoHeight || 240
      }
      video.addEventListener('loadedmetadata', onMeta)
      return () => video.removeEventListener('loadedmetadata', onMeta)
    }
  }, [])

  if (error) {
    return (
      <div className="panel">
        <div className="panel-header"><span className="panel-title">Camera Feed</span></div>
        <div className="panel-content">
          <div className="permission-prompt">
            <h3>Camera Error</h3>
            <p>{error}</p>
            <button className="start-btn" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="panel-header"><span className="panel-title">Camera Feed</span></div>
      <div className="panel-content">
        <div className="camera-container">
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <span className="loading-text">Loading AI Model...</span>
            </div>
          )}
          <video ref={videoRef} className="camera-video" playsInline muted autoPlay />
          <canvas ref={canvasRef} className="camera-canvas" />
          <div className="camera-status">
            <span className={`status-dot ${cameraReady ? 'active' : ''}`}></span>
            <span>{cameraReady ? 'Camera active' : 'Initializing...'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CameraPanel

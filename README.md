# GestureAI - AI-Powered Hand Gesture Writing Application

A full-stack web application that uses AI hand tracking to enable virtual writing, erasing, and gesture-based UI control in real-time.

## Features

### Core Gestures

| Gesture | Action |
|---------|--------|
| ✍️ **1 Finger (Index)** | Writing Mode - Draw on canvas |
| ✌️ **2 Fingers** | Text Recognition Mode - Predict letters from movement |
| 🧽 **5 Fingers (Open Palm)** | Erase Mode - Clear canvas |
| ✋ **Palm (2 seconds)** | Control Mode - Swipe to control |

### Control Mode Swipes
- **Swipe Left**: Delete last character
- **Swipe Right**: Add space
- **Swipe Up**: Submit text
- **Swipe Down**: Clear all text

### Smart Features
- Bézier curve smoothing for smooth handwriting
- Word prediction with common word dictionary
- Save as PNG or TXT
- Dark/Light theme toggle
- Real-time confidence scores
- FPS indicator

## Tech Stack

- **Frontend**: React 18 + Vite
- **AI/ML**: MediaPipe Hands (Google) - 21-point hand landmark detection
- **Drawing**: Canvas API
- **Styling**: Custom CSS with glassmorphism

## Quick Start

### Prerequisites
- Node.js 18+
- Modern browser with webcam access

### Installation

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## How It Works

### 1. Hand Detection
MediaPipe Hands provides 21 3D hand landmarks in real-time. We use these landmarks to determine finger states (raised/lowered).

### 2. Gesture Recognition
The system analyzes finger states to determine the current mode:
- **Index up only** → Writing mode
- **Index + Middle up** → Text mode  
- **All 5 fingers up** → Erase mode
- **Palm open for 2s** → Control mode

### 3. Stroke-to-Letter
When in text mode or when fingers are lowered after writing:
1. Stroke points are normalized
2. Features extracted (direction, curvature, aspect ratio)
3. Matched against letter patterns
4. Character with confidence score returned

### 4. Canvas Drawing
- Bezier curves for smooth lines
- Gradient coloring
- Shadow effects for visual appeal

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Camera/        # WebRTC + MediaPipe integration
│   │   ├── Canvas/        # Drawing canvas
│   │   ├── Header/        # App header with mode indicator
│   │   └── Output/        # Text output panel
│   ├── utils/
│   │   ├── gestureDetector.js   # Finger state & gesture detection
│   │   ├── strokeRecognizer.js  # Stroke-to-letter conversion
│   │   └── smoothing.js         # Bezier smoothing algorithms
│   ├── styles/
│   │   └── global.css      # Dark theme styling
│   ├── App.jsx            # Main application component
│   └── main.jsx           # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## AI Model

### MediaPipe Hands
- **Model**: MediaPipe Hands (full palm)
- **Input**: WebRTC video frame
- **Output**: 21 3D hand landmarks
- **Performance**: 30 FPS on modern devices
- **Confidence**: 70% detection threshold

### MIMX2 Compatibility
This application follows MIMX2 principles:
- Lightweight inference (runs in browser)
- Quantized model (MediaPipe's optimized version)
- Low latency (<100ms per frame)
- No cloud dependency

## Customization

### Change Detection Confidence
In `CameraPanel.jsx`, modify:
```javascript
hands.setOptions({
  minDetectionConfidence: 0.7,  // Increase for stricter detection
  minTrackingConfidence: 0.5
})
```

### Add More Gestures
Modify `gestureDetector.js`:
```javascript
export function detectGesture(fingerStates, landmarks) {
  // Add your custom gesture logic here
}
```

### Customize Letter Recognition
Modify `strokeRecognizer.js` to add more letter templates or use a different recognition approach.

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome 80+ | ✅ Full |
| Firefox 75+ | ✅ Full |
| Safari 14+ | ✅ Full |
| Edge 80+ | ✅ Full |

## Troubleshooting

### Camera Not Working
- Ensure you're using HTTPS or localhost
- Check browser permissions
- Try a different browser

### Low FPS
- Close other camera apps
- Use a computer with better specs
- Reduce browser tabs

### Model Not Loading
- Check internet connection (CDN)
- Clear browser cache
- Try a different browser

## License

MIT License - Feel free to use and modify!

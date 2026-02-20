# GestureAI - AI-Powered Hand Gesture Writing Application

## Project Overview
- **Project Name**: GestureAI
- **Type**: Full-stack Web Application
- **Core Functionality**: Real-time hand gesture recognition for virtual writing, erasing, and UI control using AI vision
- **Target Users**: Anyone wanting to write in air using hand gestures, control interfaces hands-free

## Technology Stack

### Frontend
- React 18 + Vite
- TensorFlow.js + MediaPipe Hands (client-side inference for real-time performance)
- Canvas API for drawing
- WebRTC for camera access
- CSS Modules for styling

### Backend (Optional/Deployment)
- FastAPI for production deployment
- WebSocket support for real-time streaming

### AI/ML
- MediaPipe Hands (Google) - 21 hand
- TensorFlow.js runtime
- landmarks detection Custom stroke-to-letter recognition model

---

## UI/UX Specification

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo + Mode Indicator + Theme Toggle + Controls    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐  ┌────────────────────────────┐  │
│  │                      │  │                            │  │
│  │   Camera Feed        │  │   Drawing Canvas           │  │
│  │   (with landmarks)   │  │   (virtual writing area)   │  │
│  │                      │  │                            │  │
│  └──────────────────────┘  └────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Output Text Display + Actions (Save/Clear/Copy)           │
├─────────────────────────────────────────────────────────────┤
│  Confidence Score + FPS Indicator                           │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints
- **Desktop**: >= 1024px - Side-by-side camera and canvas
- **Tablet**: 768px - 1023px - Stacked layout
- **Mobile**: < 768px - Full width stacked, smaller controls

### Visual Design

#### Color Palette
- **Background Dark**: #0a0a0f
- **Surface Dark**: #16161d
- **Surface Light**: #1e1e28
- **Primary**: #00d4aa (Cyan-Mint)
- **Secondary**: #7c3aed (Violet)
- **Accent**: #f472b6 (Pink)
- **Text Primary**: #f8fafc
- **Text Secondary**: #94a3b8
- **Success**: #22c55e
- **Warning**: #eab308
- **Error**: #ef4444

#### Typography
- **Font Family**: 'Outfit' (headings), 'JetBrains Mono' (code/display)
- **Headings**: 
  - H1: 2.5rem, 700 weight
  - H2: 1.75rem, 600 weight
  - H3: 1.25rem, 500 weight
- **Body**: 1rem, 400 weight
- **Mono**: 0.875rem for output text

#### Spacing System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px

#### Visual Effects
- Glassmorphism on cards: backdrop-blur(12px), semi-transparent backgrounds
- Subtle glow effects on active elements
- Smooth transitions: 200ms ease-out
- Canvas drawing: smooth anti-aliased lines with shadow

### Components

#### Header
- Logo: "GestureAI" with animated icon
- Mode Badge: Shows current mode (Writing/Erase/Text/Control)
- Theme Toggle: Sun/Moon icon button
- Settings: Gear icon dropdown

#### Camera Panel
- Live video feed with hand landmark overlay
- Skeleton visualization with landmark points
- Connection status indicator
- FPS counter

#### Drawing Canvas
- Dark bordered area with subtle grid pattern
- Real-time stroke rendering
- Gesture trail visualization
- Clear button overlay

#### Output Panel
- Recognized text display area
- Character-by-character with confidence indicator
- Action buttons: Save PNG, Save TXT, Copy, Clear

#### Mode Indicator
- Large icon + label for current mode
- Animated transitions between modes
- Gesture hints below

---

## Functionality Specification

### Core Features

#### 1. Camera Integration
- Request camera permission on load
- Display live feed with 30fps target
- Mirror mode for natural interaction
- Handle camera errors gracefully

#### 2. Hand Landmark Detection
- Use MediaPipe Hands for 21-point detection
- Track dominant hand
- Calculate finger states (raised/lowered)
- Detect palm openness (0-1 scale)

#### 3. Gesture Recognition

**✍️ Writing Mode (1 finger raised)**
- Index finger up, others down
- Track index tip position
- Draw smooth stroke on canvas
- Collect stroke data for letter recognition

**🧽 Erase Mode (5 fingers - open palm)**
- All 5 fingers detected as raised
- Clear entire canvas
- Visual feedback: flash effect

**✌️ Text Mode (2 fingers raised)**
- Index + Middle fingers up
- Similar to writing but triggers prediction
- Uses trajectory for letter prediction

**✋ Control Mode (Open palm 2 seconds)**
- Timer starts when palm detected
- After 2 seconds, enter control mode
- Track hand movement direction:
  - Swipe left: Delete last character
  - Swipe right: Add space
  - Swipe up: Submit text
  - Swipe down: Clear output

#### 4. Stroke-to-Letter Recognition
- Simple template matching approach
- Normalize strokes to grid
- Compare against letter templates
- Return top prediction with confidence

#### 5. Smart Features
- **Bézier smoothing**: Apply curve fitting to strokes
- **Stroke smoothing**: Moving average for points
- **Auto-complete**: Basic word prediction from dictionary

### User Interactions
1. Grant camera permission → See feed with landmarks
2. Raise 1 finger → Start writing, see strokes
3. Raise 2 fingers → Get letter prediction
4. Open palm → Erase canvas
5. Open palm 2s → Control mode → Swipe gestures
6. Click Save → Download as PNG/TXT

### Edge Cases
- No hand detected: Show "Waiting for hand..."
- Multiple hands: Use dominant (first detected)
- Poor lighting: Show warning message
- Camera denied: Show permission request UI
- Low confidence: Show "Try again" message

---

## Acceptance Criteria

### Visual Checkpoints
- [ ] Dark theme loads by default with correct colors
- [ ] Camera feed displays with landmark overlay
- [ ] Canvas shows drawn strokes smoothly
- [ ] Mode indicator updates in real-time
- [ ] Text output appears with confidence scores
- [ ] All buttons have hover/active states
- [ ] Responsive layout works on all breakpoints

### Functional Checkpoints
- [ ] Camera permission flow works
- [ ] Hand landmarks detected at 15+ FPS
- [ ] 1 finger → Writing mode activates
- [ ] 2 fingers → Text prediction works
- [ ] 5 fingers → Canvas clears
- [ ] 2s palm → Control mode with swipe detection
- [ ] Save PNG downloads image
- [ ] Save TXT downloads text
- [ ] Theme toggle switches dark/light
- [ ] No console errors in normal operation

### Performance Checkpoints
- [ ] Frame processing < 100ms
- [ ] Smooth drawing without lag
- [ ] Memory stable over 5 minutes
- [ ] Works on mid-range devices

---

## File Structure
```
gestureai/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Camera/
│   │   │   ├── Canvas/
│   │   │   ├── Header/
│   │   │   ├── Output/
│   │   │   └── ModeIndicator/
│   │   ├── hooks/
│   │   │   ├── useHandTracking.js
│   │   │   ├── useGestureRecognition.js
│   │   │   └── useCanvas.js
│   │   ├── utils/
│   │   │   ├── gestureDetector.js
│   │   │   ├── strokeRecognizer.js
│   │   │   └── smoothing.js
│   │   ├── styles/
│   │   │   └── global.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── README.md
└── SPEC.md
```

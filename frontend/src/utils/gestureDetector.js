export function getFingerStates(landmarks) {
  const fingerTips = [8, 12, 16, 20]
  const fingerPips = [6, 10, 14, 18]
  const thumbTip = 4
  const thumbIp = 3
  const wrist = 0

  const wristY = landmarks[wrist].y
  const wristX = landmarks[wrist].x

  const fingers = {
    thumb: false,
    index: false,
    middle: false,
    ring: false,
    pinky: false
  }

  const thumbExtended = landmarks[thumbTip].x > landmarks[thumbIp].x + 0.02 ||
                        landmarks[thumbTip].x < landmarks[thumbIp].x - 0.02
  fingers.thumb = thumbExtended

  for (let i = 0; i < fingerTips.length; i++) {
    const tip = fingerTips[i]
    const pip = fingerPips[i]
    fingers[['index', 'middle', 'ring', 'pinky'][i]] = 
      landmarks[tip].y < landmarks[pip].y - 0.02
  }

  const raisedCount = Object.values(fingers).filter(Boolean).length

  const palmOpen = landmarks[9].y < wristY + 0.1

  return { fingers, raisedCount, palmOpen }
}

export function detectGesture(fingerStates, landmarks) {
  const { fingers, raisedCount, palmOpen } = fingerStates
  
  const indexUp = fingers.index
  const middleUp = fingers.middle
  const ringUp = fingers.ring
  const pinkyUp = fingers.pinky
  const thumbUp = fingers.thumb

  if (indexUp && !middleUp && !ringUp && !pinkyUp) {
    return 'writing'
  }

  if (indexUp && middleUp && !ringUp && !pinkyUp) {
    return 'text'
  }

  if (raisedCount === 5 && palmOpen) {
    return 'erase'
  }

  if (raisedCount >= 4 && palmOpen) {
    return 'control'
  }

  if (raisedCount === 0) {
    return 'idle'
  }

  return 'idle'
}

export function getIndexTipPosition(landmarks) {
  if (!landmarks || landmarks.length < 9) return null
  return {
    x: landmarks[8].x,
    y: landmarks[8].y
  }
}

export function getHandDirection(landmarks, prevLandmarks) {
  if (!landmarks || !prevLandmarks) return null
  
  const currentIndex = landmarks[8]
  const prevIndex = prevLandmarks[8]
  
  const dx = currentIndex.x - prevIndex.x
  const dy = currentIndex.y - prevIndex.y
  
  const threshold = 0.02
  
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
    return 'none'
  }
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left'
  } else {
    return dy > 0 ? 'down' : 'up'
  }
}

export function calculatePalmOpenness(landmarks) {
  const thumbTip = landmarks[4]
  const indexTip = landmarks[8]
  const pinkyTip = landmarks[20]
  const wrist = landmarks[0]
  
  const handWidth = Math.abs(indexTip.x - pinkyTip.x)
  const handHeight = Math.abs(Math.max(indexTip.y, pinkyTip.y) - wrist.y)
  
  const ratio = handWidth / (handHeight + 0.001)
  
  return Math.min(1, Math.max(0, ratio / 2))
}

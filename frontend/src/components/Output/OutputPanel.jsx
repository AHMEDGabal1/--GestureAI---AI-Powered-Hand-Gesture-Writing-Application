import React from 'react'

function OutputPanel({ 
  outputText, 
  confidence, 
  predictedWord,
  onSavePNG, 
  onSaveTXT, 
  onCopyText,
  onClearOutput 
}) {
  const text = outputText.map(t => t.char).join('')

  return (
    <section className="output-section">
      <div className="output-container">
        <div className="output-label">Recognized Text</div>
        
        <div className="output-text">
          {outputText.length === 0 ? (
            <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              Your text will appear here...
            </span>
          ) : (
            outputText.map((item, index) => (
              <span key={index} className="output-char">
                {item.char === ' ' ? '\u00A0' : item.char}
                <span className="confidence-badge">
                  {Math.round(item.confidence * 100)}%
                </span>
              </span>
            ))
          )}
        </div>

        {predictedWord && (
          <div className="word-prediction">
            Did you mean: <span>{predictedWord}</span>?
          </div>
        )}

        <div className="output-actions">
          <button className="action-btn" onClick={onCopyText}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy
          </button>
          
          <button className="action-btn" onClick={onSavePNG}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Save PNG
          </button>
          
          <button className="action-btn" onClick={onSaveTXT}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Save TXT
          </button>
          
          <button className="action-btn primary" onClick={onClearOutput}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Clear Text
          </button>
        </div>
      </div>
    </section>
  )
}

export default OutputPanel

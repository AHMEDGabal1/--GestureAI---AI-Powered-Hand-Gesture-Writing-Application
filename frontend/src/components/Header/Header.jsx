import React from 'react'

const modeConfig = {
  waiting: { label: 'Waiting for hand...', icon: '✋', className: '' },
  writing: { label: 'Writing Mode', icon: '✍️', className: 'writing' },
  erase: { label: 'Erase Mode', icon: '🧽', className: 'erase' },
  text: { label: 'Text Recognition', icon: '✌️', className: 'text' },
  control: { label: 'Control Mode', icon: '🎮', className: 'control' }
}

function Header({ theme, mode, onToggleTheme }) {
  return (
    <header className="header">
      <div className="logo">
        <div className="logo-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <span>GestureAI</span>
      </div>
      
      <div className="header-controls">
        <div className={`mode-badge ${modeConfig[mode]?.className || ''}`}>
          <span>{modeConfig[mode]?.icon || '✋'}</span>
          <span>{modeConfig[mode]?.label || 'Waiting...'}</span>
        </div>
        
        <button className="icon-btn" onClick={onToggleTheme} title="Toggle theme">
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}

export default Header

import React from 'react';

interface LoadingIndicatorProps {
  assistantName: string;
  accentColor: string;
  secondaryTextColor: string;
  showAvatar: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ assistantName, accentColor, secondaryTextColor, showAvatar }) => (
  <div className="message-row assistant loading-row" aria-live="polite">
    <div className="message-stack loading-stack">
      <div className="message-meta" style={{ color: secondaryTextColor }}>
        <div className="message-author">
          {showAvatar ? (
            <div className="message-avatar" aria-hidden="true">
              <span>AI</span>
            </div>
          ) : null}
          <span>{assistantName}</span>
        </div>
      </div>
      <div className="loading-card">
        <span className="loading-label" style={{ color: secondaryTextColor }}>Thinking</span>
        <div className="loading-indicator">
          <span className="dot" style={{ backgroundColor: accentColor }} />
          <span className="dot" style={{ backgroundColor: accentColor }} />
          <span className="dot" style={{ backgroundColor: accentColor }} />
        </div>
      </div>
    </div>
  </div>
);

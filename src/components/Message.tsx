import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from '../models/ChatMessage';
import { formatTimestamp } from '../utils/formatting';
import { sanitizeMarkdown } from '../utils/sanitization';
import { ChatFormattingSettings } from './ChatApp';

interface MessageProps {
  message: ChatMessage;
  renderedContent?: string;
  formatting: ChatFormattingSettings;
  assistantName: string;
}

export const Message: React.FC<MessageProps> = ({ message, renderedContent, formatting, assistantName }) => {
  const isUser = message.role === 'user';
  const safeContent = sanitizeMarkdown(renderedContent ?? message.content);
  const formattedTimestamp = formatTimestamp(message.timestamp);
  const bubbleStyle: React.CSSProperties = {
    backgroundColor: isUser ? formatting.userMessageBackgroundColor : formatting.assistantMessageBackgroundColor,
    color: isUser ? formatting.userTextColor : formatting.primaryTextColor,
    borderColor: formatting.borderColor,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderRadius: formatting.messageCornerRadius
  };

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-stack">
        <div className="message-meta" style={{ color: formatting.secondaryTextColor }}>
          <div className="message-author">
            {!isUser && formatting.showAvatar ? (
              <div className="message-avatar" aria-hidden="true">
                <span>AI</span>
              </div>
            ) : null}
            <span>{isUser ? 'You' : assistantName}</span>
          </div>
          {formatting.showTimestamps ? (
            <span className="message-time">{formattedTimestamp}</span>
          ) : null}
        </div>
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`} style={bubbleStyle}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{safeContent}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

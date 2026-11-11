import React from 'react';
import { ChatMessage } from '../models/ChatMessage';
import { DataContext } from '../models/DataContext';
import { Message } from './Message';
import { InputBox } from './InputBox';
import { SuggestedQuestions } from './SuggestedQuestions';
import { LoadingIndicator } from './LoadingIndicator';

export interface ChatFormattingSettings {
  chatBackgroundColor: string;
  userMessageBackgroundColor: string;
  assistantMessageBackgroundColor: string;
  userTextColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  borderColor: string;
  accentColor: string;
  showHeader: boolean;
  headerBackgroundColor: string;
  headerTextColor: string;
  headerHeight: number;
  showSubtitle: boolean;
  bodyFontSize: number;
  messageFontSize: number;
  headerFontSize: number;
  messageSpacing: number;
  messageCornerRadius: number;
  compactMode: boolean;
  autoScroll: boolean;
  showTimestamps: boolean;
  showSuggestedQuestions: boolean;
  showAvatar: boolean;
  inputHeight: number;
  sendButtonSize: number;
  inputCornerRadius: number;
  inputBackgroundColor: string;
  inputTextColor: string;
  inputBorderColor: string;
  placeholderColor: string;
  sendButtonColor: string;
  sendButtonTextColor: string;
}

interface ChatAppProps {
  context?: DataContext;
  messages: ChatMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isProcessing: boolean;
  assistantName?: string;
  welcomeMessage?: string;
  formatting: ChatFormattingSettings;
}

export const ChatApp: React.FC<ChatAppProps> = ({
  context,
  messages,
  inputValue,
  onInputChange,
  onSend,
  isProcessing,
  assistantName = 'AI Data Copilot',
  welcomeMessage = 'Ask questions about your Power BI data.',
  formatting
}) => {
  const appRef = React.useRef<HTMLDivElement | null>(null);
  const messagesRef = React.useRef<HTMLDivElement | null>(null);
  const footerRef = React.useRef<HTMLDivElement | null>(null);
  const revealTimeoutRef = React.useRef<number | null>(null);
  const activeRevealIdRef = React.useRef<string | null>(null);
  const previousMessageIdsRef = React.useRef<string[]>([]);
  const shouldStickToBottomRef = React.useRef(true);
  const [revealedContent, setRevealedContent] = React.useState<Record<string, string>>({});
  const [revealingMessageId, setRevealingMessageId] = React.useState<string | null>(null);
  const messageCount = messages.length;

  const clearRevealTimer = React.useCallback(() => {
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  }, []);

  const startRevealAnimation = React.useCallback((message: ChatMessage) => {
    clearRevealTimer();
    activeRevealIdRef.current = message.id;
    setRevealingMessageId(message.id);

    const segments = message.content.match(/\S+\s*/g) ?? [message.content];
    const totalSegments = segments.length;
    let cursor = 0;

    const getChunkSize = (remaining: number): number => {
      if (totalSegments >= 100) {
        return remaining > 24 ? 3 : 2;
      }

      if (totalSegments >= 48) {
        return remaining > 12 ? 2 : 1;
      }

      return 1;
    };

    const getDelay = (remaining: number): number => {
      if (totalSegments >= 100) {
        return remaining > 24 ? 34 : 26;
      }

      if (totalSegments >= 48) {
        return remaining > 12 ? 48 : 36;
      }

      return remaining > 8 ? 64 : 48;
    };

    setRevealedContent((prev) => ({
      ...prev,
      [message.id]: ''
    }));

    const step = () => {
      if (activeRevealIdRef.current !== message.id) {
        return;
      }

      const remaining = totalSegments - cursor;
      const chunkSize = Math.min(getChunkSize(remaining), remaining);
      const nextChunk = segments.slice(cursor, cursor + chunkSize).join('');
      cursor += chunkSize;

      setRevealedContent((prev) => ({
        ...prev,
        [message.id]: `${prev[message.id] ?? ''}${nextChunk}`
      }));

      if (cursor < totalSegments) {
        revealTimeoutRef.current = window.setTimeout(step, getDelay(totalSegments - cursor));
        return;
      }

      activeRevealIdRef.current = null;
      setRevealingMessageId(null);
      revealTimeoutRef.current = null;
    };

    revealTimeoutRef.current = window.setTimeout(step, 220);
  }, [clearRevealTimer]);

  React.useEffect(() => () => {
    clearRevealTimer();
    activeRevealIdRef.current = null;
  }, [clearRevealTimer]);

  React.useEffect(() => {
    const messageIds = messages.map((message) => message.id);
    const previousIds = previousMessageIdsRef.current;
    const newMessages = messages.filter((message) => !previousIds.includes(message.id));
    previousMessageIdsRef.current = messageIds;

    setRevealedContent((prev) => {
      const next: Record<string, string> = {};
      const validIds = new Set(messageIds);

      Object.entries(prev).forEach(([id, value]) => {
        if (validIds.has(id)) {
          next[id] = value;
        }
      });

      messages.forEach((message) => {
        if (message.role !== 'assistant' || message.status !== 'complete') {
          next[message.id] = message.content;
        }
      });

      return next;
    });

    if (newMessages.some((message) => message.role === 'user')) {
      shouldStickToBottomRef.current = true;
    }

    const latestNewAssistant = [...newMessages].reverse().find((message) => message.role === 'assistant' && message.status === 'complete');

    if (!latestNewAssistant) {
      messages.forEach((message) => {
        if (message.role === 'assistant' && message.status === 'complete') {
          setRevealedContent((prev) => {
            if (prev[message.id] !== undefined) {
              return prev;
            }

            return {
              ...prev,
              [message.id]: message.content
            };
          });
        }
      });
      setRevealingMessageId(null);
      return;
    }

    startRevealAnimation(latestNewAssistant);
  }, [messages, startRevealAnimation]);

  const handleMessagesScroll = React.useCallback(() => {
    const el = messagesRef.current;
    if (!el) {
      return;
    }

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 64;
  }, []);

  const scrollMessagesToBottom = React.useCallback((smooth: boolean) => {
    const el = messagesRef.current;
    if (!el) {
      return;
    }

    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  React.useEffect(() => {
    if (formatting.autoScroll && shouldStickToBottomRef.current) {
      scrollMessagesToBottom(messageCount > 0);
    }
  }, [messageCount, isProcessing, formatting.autoScroll, revealedContent, scrollMessagesToBottom]);

  // Compact mode scales down spacing/sizing without introducing separate settings.
  const compactScale = formatting.compactMode ? 0.65 : 1;
  const effective: ChatFormattingSettings = {
    ...formatting,
    headerFontSize: Math.max(14, Math.round(formatting.headerFontSize * (formatting.compactMode ? 0.92 : 1))),
    bodyFontSize: Math.max(12, Math.round(formatting.bodyFontSize * (formatting.compactMode ? 0.95 : 1))),
    messageFontSize: Math.max(12, Math.round(formatting.messageFontSize * (formatting.compactMode ? 0.96 : 1))),
    messageSpacing: Math.max(4, Math.round(formatting.messageSpacing * compactScale)),
    headerHeight: formatting.compactMode ? Math.max(40, Math.round(formatting.headerHeight * 0.82)) : formatting.headerHeight,
    inputHeight: formatting.compactMode ? Math.max(38, Math.round(formatting.inputHeight * 0.82)) : formatting.inputHeight,
    sendButtonSize: formatting.compactMode ? Math.max(32, Math.round(formatting.sendButtonSize * 0.86)) : formatting.sendButtonSize
  };

  const appStyle: React.CSSProperties & Record<string, string | number> = {
    backgroundColor: effective.chatBackgroundColor,
    color: effective.primaryTextColor,
    fontSize: `${effective.bodyFontSize}px`,
    '--chat-bg': effective.chatBackgroundColor,
    '--primary-text': effective.primaryTextColor,
    '--secondary-text': effective.secondaryTextColor,
    '--accent-color': effective.accentColor,
    '--border-color': effective.borderColor,
    '--assistant-bg': effective.assistantMessageBackgroundColor,
    '--user-bg': effective.userMessageBackgroundColor,
    '--user-text': effective.userTextColor,
    '--header-bg': effective.headerBackgroundColor,
    '--header-text': effective.headerTextColor,
    '--header-height': `${effective.headerHeight}px`,
    '--body-font-size': `${effective.bodyFontSize}px`,
    '--message-font-size': `${effective.messageFontSize}px`,
    '--message-spacing': `${effective.messageSpacing}px`,
    '--bubble-radius': `${effective.messageCornerRadius}px`,
    '--input-bg': effective.inputBackgroundColor,
    '--input-text': effective.inputTextColor,
    '--input-border': effective.inputBorderColor,
    '--placeholder-color': effective.placeholderColor,
    '--send-button-bg': effective.sendButtonColor,
    '--send-button-text': effective.sendButtonTextColor,
    '--input-height': `${effective.inputHeight}px`,
    '--input-corner-radius': `${effective.inputCornerRadius}px`,
    '--send-button-size': `${effective.sendButtonSize}px`
  };

  return (
    <div className={`chat-panel${formatting.compactMode ? ' compact' : ''}`} style={appStyle} ref={appRef}>
      {formatting.showHeader ? (
        <header className="chat-header" style={{ backgroundColor: effective.headerBackgroundColor, color: effective.headerTextColor }}>
          <div className="chat-header-icon" aria-hidden="true">
            <span>AI</span>
          </div>
          <div className="chat-header-copy">
            <h3 style={{ fontSize: effective.headerFontSize }}>{assistantName}</h3>
            {formatting.showSubtitle ? (
              <p style={{ color: effective.secondaryTextColor }}>{welcomeMessage}</p>
            ) : null}
          </div>
          <span className="chat-header-status" style={{ backgroundColor: effective.accentColor }} aria-hidden="true" />
        </header>
      ) : null}

      <div className="chat-messages" ref={messagesRef} onScroll={handleMessagesScroll}>
        {messageCount === 0 ? (
          <div className="empty-state">
            <p className="subtle" style={{ color: effective.secondaryTextColor }}>
              Ask a question about the current Power BI dataset to get started.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isWaitingToReveal = message.role === 'assistant'
              && message.id === revealingMessageId
              && !(revealedContent[message.id] ?? '').trim();

            if (isWaitingToReveal) {
              return null;
            }

            return (
              <Message
                key={message.id}
                message={message}
                renderedContent={message.role === 'assistant' ? (revealedContent[message.id] ?? message.content) : message.content}
                formatting={effective}
                assistantName={assistantName}
              />
            );
          })
        )}

        {isProcessing || (revealingMessageId !== null && !(revealedContent[revealingMessageId] ?? '').trim()) ? (
          <LoadingIndicator
            assistantName={assistantName}
            accentColor={effective.accentColor}
            secondaryTextColor={effective.secondaryTextColor}
            showAvatar={effective.showAvatar}
          />
        ) : null}
      </div>

      <div className="chat-footer" ref={footerRef}>
        {formatting.showSuggestedQuestions ? (
          <SuggestedQuestions context={context} onSelect={onInputChange} accentColor={effective.accentColor} />
        ) : null}
        <InputBox
          value={inputValue}
          onChange={onInputChange}
          onSend={onSend}
          disabled={isProcessing}
          placeholder="Ask about your data..."
          formatting={effective}
        />
      </div>
    </div>
  );
};


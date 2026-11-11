import React from 'react';
import { ChatFormattingSettings } from './ChatApp';

interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  placeholder?: string;
  formatting: ChatFormattingSettings;
}

export const InputBox: React.FC<InputBoxProps> = ({ value, onChange, onSend, disabled, placeholder, formatting }) => {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useLayoutEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    const textarea = textareaRef.current;
    const maxHeight = Math.max(formatting.inputHeight * 2.4, formatting.inputHeight + 24);
    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value, formatting.inputHeight]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: formatting.inputHeight,
    backgroundColor: formatting.inputBackgroundColor,
    borderColor: formatting.inputBorderColor,
    borderRadius: formatting.inputCornerRadius
  };

  const textareaStyle: React.CSSProperties = {
    minHeight: formatting.inputHeight - 18,
    color: formatting.inputTextColor,
    fontSize: formatting.bodyFontSize
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: formatting.sendButtonColor,
    color: formatting.sendButtonTextColor,
    width: formatting.sendButtonSize,
    height: formatting.sendButtonSize,
    minWidth: formatting.sendButtonSize
  };

  return (
    <div className="input-wrapper">
      <div className="input-box" style={containerStyle}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          style={textareaStyle}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          aria-label={disabled ? 'Sending' : 'Send message'}
          style={buttonStyle}
        >
          {disabled ? '...' : '➤'}
        </button>
      </div>
    </div>
  );
};

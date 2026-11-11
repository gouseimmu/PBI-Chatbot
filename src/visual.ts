import powerbi from 'powerbi-visuals-api';
import React from 'react';
import ReactDOM from 'react-dom/client';
import '../style/visual.less';
import { DataContextBuilder } from './context/DataContextBuilder';
import { ChatApiService } from './services/ChatApiService';
import { ChatApp, ChatFormattingSettings } from './components/ChatApp';
import { ChatMessage } from './models/ChatMessage';
import { DataContext } from './models/DataContext';
import { getColorValue } from './utils/formatting';

import IVisual = powerbi.extensibility.IVisual;
import VisualUpdateOptions = powerbi.extensibility.VisualUpdateOptions;
import IVisualHost = powerbi.extensibility.IVisualHost;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import VisualConstructorOptions = powerbi.extensibility.VisualConstructorOptions;
import FormattingModel = powerbi.visuals.FormattingModel;

type VisualUpdateOptionsWithData = VisualUpdateOptions & {
  dataViews?: powerbi.DataView[];
  viewport?: {
    width?: number;
    height?: number;
  };
};

type VisualHostWithEventService = IVisualHost & {
  eventService?: IVisualEventService;
};

type VisualConstructorOptionsWithHost = VisualConstructorOptions & {
  host?: VisualHostWithEventService;
  element?: HTMLElement;
};

export class Visual implements IVisual {
  private root: ReactDOM.Root | null = null;
  private container: HTMLElement | null = null;
  private host: IVisualHost;
  private eventService: IVisualEventService;
  private dataContextBuilder = new DataContextBuilder();
  private chatApi = new ChatApiService();
  private context: DataContext | undefined;
  private messages: ChatMessage[] = [];
  private inputValue = '';
  private isProcessing = false;
  private assistantName = 'AI Data Copilot';
  private welcomeMessage = 'Ask questions about your Power BI data.';
  private formatting: ChatFormattingSettings = {
    chatBackgroundColor: '#f4f7fb',
    userMessageBackgroundColor: '#1d4ed8',
    assistantMessageBackgroundColor: '#ffffff',
    userTextColor: '#ffffff',
    primaryTextColor: '#0f172a',
    secondaryTextColor: '#64748b',
    borderColor: '#d7deea',
    accentColor: '#2563eb',
    showHeader: true,
    headerBackgroundColor: '#f8fbff',
    headerTextColor: '#0f172a',
    headerHeight: 64,
    showSubtitle: true,
    bodyFontSize: 13,
    messageFontSize: 13,
    headerFontSize: 16,
    messageSpacing: 14,
    messageCornerRadius: 18,
    compactMode: false,
    autoScroll: true,
    showTimestamps: true,
    showSuggestedQuestions: true,
    showAvatar: true,
    inputHeight: 52,
    sendButtonSize: 40,
    inputCornerRadius: 18,
    inputBackgroundColor: '#ffffff',
    inputTextColor: '#111827',
    inputBorderColor: '#d1d5db',
    placeholderColor: '#94a3b8',
    sendButtonColor: '#2563eb',
    sendButtonTextColor: '#ffffff'
  };
  private lastUpdateOptions?: VisualUpdateOptionsWithData;

  constructor(options?: VisualConstructorOptionsWithHost) {
    const host = options?.host;
    this.host = (host ?? {}) as IVisualHost;
    this.eventService = host?.eventService ?? {
      renderingStarted: () => undefined,
      renderingFinished: () => undefined,
      renderingFailed: () => undefined
    };
    this.container = options?.element ?? null;
    this.root = this.container ? ReactDOM.createRoot(this.container) : null;
  }

  public update(options: VisualUpdateOptionsWithData): void {
    this.lastUpdateOptions = options;
    this.applyViewportSizing(options);
    this.formatting = this.getFormattingState(options);
    this.context = this.dataContextBuilder.build(options.dataViews?.[0], {
      title: this.getVisualTitle(options),
      formatting: {
        compactMode: this.formatting.compactMode,
        showSuggestedQuestions: this.formatting.showSuggestedQuestions,
        showAvatar: this.formatting.showAvatar
      }
    });

    this.render();
  }

  public destroy(): void {
    this.root?.unmount();
  }

  public getFormattingModel(): FormattingModel {
    const colorSlice = (uid: string, displayName: string, objectName: string, propertyName: string, colorValue: string): powerbi.visuals.FormattingSlice => ({
      uid,
      displayName,
      control: {
        type: powerbi.visuals.FormattingComponent.ColorPicker,
        properties: {
          descriptor: { objectName, propertyName },
          value: { value: colorValue }
        }
      }
    });

    const toggleSlice = (uid: string, displayName: string, objectName: string, propertyName: string, boolValue: boolean): powerbi.visuals.FormattingSlice => ({
      uid,
      displayName,
      control: {
        type: powerbi.visuals.FormattingComponent.ToggleSwitch,
        properties: {
          descriptor: { objectName, propertyName },
          value: boolValue
        }
      }
    });

    const sliderSlice = (uid: string, displayName: string, objectName: string, propertyName: string, numValue: number): powerbi.visuals.FormattingSlice => ({
      uid,
      displayName,
      control: {
        type: powerbi.visuals.FormattingComponent.Slider,
        properties: {
          descriptor: { objectName, propertyName },
          value: numValue
        }
      }
    });

    return {
      cards: [
        {
          uid: 'appearance',
          displayName: 'Appearance',
          groups: [
            {
              uid: 'colors',
              displayName: 'Colors',
              slices: [
                colorSlice('chatBackgroundColor', 'Chat Background', 'appearance', 'chatBackgroundColor', this.formatting.chatBackgroundColor),
                colorSlice('userMessageBackgroundColor', 'User Bubble Color', 'appearance', 'userMessageBackgroundColor', this.formatting.userMessageBackgroundColor),
                colorSlice('assistantMessageBackgroundColor', 'Assistant Bubble Color', 'appearance', 'assistantMessageBackgroundColor', this.formatting.assistantMessageBackgroundColor),
                colorSlice('userTextColor', 'User Text Color', 'appearance', 'userTextColor', this.formatting.userTextColor),
                colorSlice('primaryTextColor', 'Primary Text Color', 'appearance', 'primaryTextColor', this.formatting.primaryTextColor),
                colorSlice('secondaryTextColor', 'Secondary Text Color', 'appearance', 'secondaryTextColor', this.formatting.secondaryTextColor),
                colorSlice('borderColor', 'Border Color', 'appearance', 'borderColor', this.formatting.borderColor),
                colorSlice('accentColor', 'Accent Color', 'appearance', 'accentColor', this.formatting.accentColor)
              ]
            }
          ]
        },
        {
          uid: 'header',
          displayName: 'Header',
          groups: [
            {
              uid: 'headerGroup',
              displayName: 'Header',
              slices: [
                toggleSlice('showHeader', 'Show Header', 'header', 'showHeader', this.formatting.showHeader),
                colorSlice('headerBackgroundColor', 'Header Background', 'header', 'headerBackgroundColor', this.formatting.headerBackgroundColor),
                colorSlice('headerTextColor', 'Header Text', 'header', 'headerTextColor', this.formatting.headerTextColor),
                sliderSlice('headerHeight', 'Header Height', 'header', 'headerHeight', this.formatting.headerHeight),
                toggleSlice('showSubtitle', 'Show Subtitle', 'header', 'showSubtitle', this.formatting.showSubtitle)
              ]
            }
          ]
        },
        {
          uid: 'typography',
          displayName: 'Typography',
          groups: [
            {
              uid: 'fonts',
              displayName: 'Fonts',
              slices: [
                sliderSlice('bodyFontSize', 'Font Size', 'typography', 'bodyFontSize', this.formatting.bodyFontSize),
                sliderSlice('messageFontSize', 'Message Font Size', 'typography', 'messageFontSize', this.formatting.messageFontSize),
                sliderSlice('headerFontSize', 'Header Font Size', 'typography', 'headerFontSize', this.formatting.headerFontSize)
              ]
            }
          ]
        },
        {
          uid: 'layout',
          displayName: 'Layout',
          groups: [
            {
              uid: 'spacing',
              displayName: 'Spacing',
              slices: [
                sliderSlice('messageSpacing', 'Message Spacing', 'layout', 'messageSpacing', this.formatting.messageSpacing),
                sliderSlice('messageCornerRadius', 'Bubble Radius', 'layout', 'messageCornerRadius', this.formatting.messageCornerRadius),
                toggleSlice('compactMode', 'Compact Mode', 'layout', 'compactMode', this.formatting.compactMode)
              ]
            }
          ]
        },
        {
          uid: 'behavior',
          displayName: 'Behavior',
          groups: [
            {
              uid: 'toggles',
              displayName: 'Toggles',
              slices: [
                toggleSlice('autoScroll', 'Auto Scroll', 'behavior', 'autoScroll', this.formatting.autoScroll),
                toggleSlice('showTimestamps', 'Show Timestamps', 'behavior', 'showTimestamps', this.formatting.showTimestamps),
                toggleSlice('showSuggestedQuestions', 'Show Suggested Questions', 'behavior', 'showSuggestedQuestions', this.formatting.showSuggestedQuestions),
                toggleSlice('showAvatar', 'Show AI Avatar', 'behavior', 'showAvatar', this.formatting.showAvatar)
              ]
            }
          ]
        },
        {
          uid: 'input',
          displayName: 'Input',
          groups: [
            {
              uid: 'inputGroup',
              displayName: 'Input',
              slices: [
                sliderSlice('inputHeight', 'Input Height', 'input', 'inputHeight', this.formatting.inputHeight),
                sliderSlice('sendButtonSize', 'Send Button Size', 'input', 'sendButtonSize', this.formatting.sendButtonSize),
                sliderSlice('inputCornerRadius', 'Input Corner Radius', 'input', 'inputCornerRadius', this.formatting.inputCornerRadius),
                colorSlice('inputBackgroundColor', 'Input Background', 'input', 'inputBackgroundColor', this.formatting.inputBackgroundColor),
                colorSlice('inputTextColor', 'Input Text Color', 'input', 'inputTextColor', this.formatting.inputTextColor),
                colorSlice('inputBorderColor', 'Input Border Color', 'input', 'inputBorderColor', this.formatting.inputBorderColor),
                colorSlice('placeholderColor', 'Placeholder Color', 'input', 'placeholderColor', this.formatting.placeholderColor),
                colorSlice('sendButtonColor', 'Send Button Color', 'input', 'sendButtonColor', this.formatting.sendButtonColor),
                colorSlice('sendButtonTextColor', 'Send Button Text', 'input', 'sendButtonTextColor', this.formatting.sendButtonTextColor)
              ]
            }
          ]
        }
      ]
    };
  }

  private render(): void {
    if (!this.root || !this.container) {
      return;
    }

    const updateOptions = this.lastUpdateOptions ?? ({} as VisualUpdateOptionsWithData);
    this.eventService.renderingStarted(updateOptions);

    this.root.render(
      React.createElement(ChatApp, {
        context: this.context,
        messages: this.messages,
        inputValue: this.inputValue,
        onInputChange: (value: string) => {
          this.inputValue = value;
          this.render();
        },
        onSend: () => this.sendMessage(),
        isProcessing: this.isProcessing,
        assistantName: this.assistantName,
        welcomeMessage: this.welcomeMessage,
        formatting: this.formatting
      })
    );

    this.eventService.renderingFinished(updateOptions);
  }

  private async sendMessage(): Promise<void> {
    const question = this.inputValue.trim();
    if (!question) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
      status: 'complete'
    };

    this.messages = [...this.messages, userMessage];
    this.inputValue = '';
    this.isProcessing = true;
    this.render();

    try {
      const resp = await this.chatApi.postChat(question, this.context as DataContext);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: resp.answer,
        timestamp: new Date().toISOString(),
        status: 'complete',
        metadata: {
          source: resp.source,
          model: resp.model
        }
      };

      this.messages = [...this.messages, assistantMessage];
    } catch (err) {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: 'The AI service is temporarily unavailable. Please try again.',
        timestamp: new Date().toISOString(),
        status: 'complete',
        metadata: { source: 'error' }
      };
      this.messages = [...this.messages, assistantMessage];
    } finally {
      this.isProcessing = false;
      this.render();
    }
  }

  private getVisualTitle(options: VisualUpdateOptionsWithData): string | undefined {
    return options.viewport?.width && options.viewport?.width > 0 ? 'AI Data Copilot' : undefined;
  }

  private applyViewportSizing(options: VisualUpdateOptionsWithData): void {
    if (!this.container) {
      return;
    }

    const width = options.viewport?.width;
    const height = options.viewport?.height;

    if (typeof width === 'number' && width > 0) {
      this.container.style.width = `${width}px`;
    }

    if (typeof height === 'number' && height > 0) {
      this.container.style.height = `${height}px`;
    }

    this.container.style.minWidth = '0';
    this.container.style.minHeight = '0';
    this.container.style.boxSizing = 'border-box';
    this.container.style.overflow = 'hidden';
  }

  private getFormattingState(options: VisualUpdateOptionsWithData): ChatFormattingSettings {
    const objects = options.dataViews?.[0]?.metadata?.objects;

    const getObjectValue = <T>(objectName: string, propertyName: string, defaultValue: T): T => {
      const objectValue = objects?.[objectName] as { [key: string]: unknown } | undefined;
      const value = objectValue?.[propertyName];
      return value === undefined ? defaultValue : (value as T);
    };

    const getObjectColor = (objectName: string, propertyName: string, defaultValue: string): string => {
      const objectValue = objects?.[objectName] as { [key: string]: unknown } | undefined;
      return getColorValue(objectValue?.[propertyName], defaultValue);
    };

    return {
      chatBackgroundColor: getObjectColor('appearance', 'chatBackgroundColor', this.formatting.chatBackgroundColor),
      userMessageBackgroundColor: getObjectColor('appearance', 'userMessageBackgroundColor', this.formatting.userMessageBackgroundColor),
      assistantMessageBackgroundColor: getObjectColor('appearance', 'assistantMessageBackgroundColor', this.formatting.assistantMessageBackgroundColor),
      userTextColor: getObjectColor('appearance', 'userTextColor', this.formatting.userTextColor),
      primaryTextColor: getObjectColor('appearance', 'primaryTextColor', this.formatting.primaryTextColor),
      secondaryTextColor: getObjectColor('appearance', 'secondaryTextColor', this.formatting.secondaryTextColor),
      borderColor: getObjectColor('appearance', 'borderColor', this.formatting.borderColor),
      accentColor: getObjectColor('appearance', 'accentColor', this.formatting.accentColor),
      showHeader: getObjectValue('header', 'showHeader', this.formatting.showHeader),
      headerBackgroundColor: getObjectColor('header', 'headerBackgroundColor', this.formatting.headerBackgroundColor),
      headerTextColor: getObjectColor('header', 'headerTextColor', this.formatting.headerTextColor),
      headerHeight: getObjectValue('header', 'headerHeight', this.formatting.headerHeight),
      showSubtitle: getObjectValue('header', 'showSubtitle', this.formatting.showSubtitle),
      bodyFontSize: getObjectValue('typography', 'bodyFontSize', this.formatting.bodyFontSize),
      messageFontSize: getObjectValue('typography', 'messageFontSize', this.formatting.messageFontSize),
      headerFontSize: getObjectValue('typography', 'headerFontSize', this.formatting.headerFontSize),
      messageSpacing: getObjectValue('layout', 'messageSpacing', this.formatting.messageSpacing),
      messageCornerRadius: getObjectValue('layout', 'messageCornerRadius', this.formatting.messageCornerRadius),
      compactMode: getObjectValue('layout', 'compactMode', this.formatting.compactMode),
      autoScroll: getObjectValue('behavior', 'autoScroll', this.formatting.autoScroll),
      showTimestamps: getObjectValue('behavior', 'showTimestamps', this.formatting.showTimestamps),
      showSuggestedQuestions: getObjectValue('behavior', 'showSuggestedQuestions', this.formatting.showSuggestedQuestions),
      showAvatar: getObjectValue('behavior', 'showAvatar', this.formatting.showAvatar),
      inputHeight: getObjectValue('input', 'inputHeight', this.formatting.inputHeight),
      sendButtonSize: getObjectValue('input', 'sendButtonSize', this.formatting.sendButtonSize),
      inputCornerRadius: getObjectValue('input', 'inputCornerRadius', this.formatting.inputCornerRadius),
      inputBackgroundColor: getObjectColor('input', 'inputBackgroundColor', this.formatting.inputBackgroundColor),
      inputTextColor: getObjectColor('input', 'inputTextColor', this.formatting.inputTextColor),
      inputBorderColor: getObjectColor('input', 'inputBorderColor', this.formatting.inputBorderColor),
      placeholderColor: getObjectColor('input', 'placeholderColor', this.formatting.placeholderColor),
      sendButtonColor: getObjectColor('input', 'sendButtonColor', this.formatting.sendButtonColor),
      sendButtonTextColor: getObjectColor('input', 'sendButtonTextColor', this.formatting.sendButtonTextColor)
    };
  }
}

export default Visual;

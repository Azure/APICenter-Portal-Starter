import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Badge, Button, Input, Spinner, Tab, TabList } from '@fluentui/react-components';
import {
  Send24Regular,
  Bot24Regular,
  ThumbLike20Regular,
  ThumbDislike20Regular,
  DocumentRegular,
  ChatRegular,
} from '@fluentui/react-icons';
import { Link, useParams } from 'react-router-dom';
import { useApiDeployments } from '@/hooks/useApiDeployments';
import { LocationsService } from '@/services/LocationsService';
import { useLanguageModel } from '@/hooks/useLanguageModel';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import styles from './ModelPlayground.module.scss';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Parses an SSE stream from the Chat Completions API, invoking onDelta for each text token
 * and onComplete when the stream ends.
 */
async function readSSEStream(
  response: Response,
  onDelta: (text: string) => void,
  onComplete: () => void
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No readable stream in response');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') continue;

        try {
          const chunk = JSON.parse(payload);
          // Chat Completions streaming format: choices[0].delta.content
          const content = chunk?.choices?.[0]?.delta?.content;
          if (content) {
            onDelta(content);
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  } finally {
    reader.releaseLock();
    onComplete();
  }
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString(undefined, {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

enum PlaygroundTabs {
  PLAYGROUND = 'playground',
  DOCUMENTATION = 'documentation',
}

const CHAT_PATH = '/chat/completions';

export const ModelPlayground: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const model = useLanguageModel(name);
  const deployments = useApiDeployments(name, 'languageModels');

  const runtimeUrl = (() => {
    const list = deployments.data ?? [];
    const preferred = list.find((d) => d.recommended) ?? list[0];
    const base = preferred?.server?.runtimeUri?.[0];
    if (!base) return undefined;
    return base.replace(/\/$/, '') + CHAT_PATH;
  })();
  const [activeTab, setActiveTab] = useState<PlaygroundTabs>(PlaygroundTabs.PLAYGROUND);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed, timestamp: new Date() };
    const updatedMessages = [...messages, userMessage];
    setMessages([...updatedMessages, { role: 'assistant', content: '', timestamp: new Date() }]);
    setInput('');
    setIsLoading(true);

    try {
      if (!runtimeUrl) {
        throw new Error('No deployment runtime URL available for this model');
      }

      const apiMessages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        ...updatedMessages.map(({ role, content }) => ({ role, content })),
      ];

      const response = await fetch(runtimeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model.data?.modelName,
          messages: apiMessages,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Model responded with status ${response.status}`);
      }

      await readSSEStream(
        response,
        (delta) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = { ...last, content: last.content + delta };
            return updated;
          });
        },
        () => setIsLoading(false)
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === 'assistant' && !last.content) {
          updated[updated.length - 1] = { ...last, content: `Error: ${errorMessage}` };
        } else {
          updated.push({ role: 'assistant', content: `Error: ${errorMessage}`, timestamp: new Date() });
        }
        return updated;
      });
      setIsLoading(false);
    }
  }, [input, isLoading, runtimeUrl, messages, model.data]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage]
  );

  const modelTitle = model.data?.title || name || 'Model';
  const modelSummary = model.data?.summary || model.data?.description;
  const lastUpdated = model.data?.lastUpdated ? new Date(model.data.lastUpdated).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : undefined;

  return (
    <div className={styles.modelPlayground}>
      <section className={styles.modelHeader}>
        <div className={styles.headerLeft}>
          <h1>{modelTitle}</h1>
          <div className={styles.badges}>
            <Badge appearance="filled" color="brand">Model</Badge>
            {model.data?.lifecycleStage && <Badge appearance="outline">{model.data.lifecycleStage.toUpperCase()}</Badge>}
          </div>
          {modelSummary && <p className={styles.summary}>{modelSummary}</p>}
          <div className={styles.meta}>
            {model.data?.modelProvider && <span><strong>PROVIDER</strong><br />{model.data.modelProvider}</span>}
            {model.data?.modelName && <span><strong>MODEL</strong><br />{model.data.modelName}</span>}
            {lastUpdated && <span><strong>LAST UPDATED</strong><br />{lastUpdated}</span>}
          </div>
        </div>
      </section>

      <section className={styles.tabBar}>
        <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value as PlaygroundTabs)}>
          <Tab icon={<ChatRegular />} value={PlaygroundTabs.PLAYGROUND}>Model playground</Tab>
          <Tab icon={<DocumentRegular />} value={PlaygroundTabs.DOCUMENTATION}>Documentation</Tab>
        </TabList>
      </section>

      {activeTab === PlaygroundTabs.PLAYGROUND && (
        <section className={styles.chatContainer}>
          <div className={styles.messages}>
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                Start a conversation with the model. Ask anything to explore its capabilities.
              </div>
            )}
            {messages.map((msg, i) =>
              msg.role === 'assistant' && !msg.content ? null : (
                <div key={i} className={styles.messageRow}>
                  {msg.role === 'assistant' && (
                    <div className={styles.avatar}>
                      <Bot24Regular />
                    </div>
                  )}
                  <div className={`${styles.messageBubble} ${msg.role === 'user' ? styles.userBubble : styles.assistantBubble}`}>
                    {msg.role === 'assistant' && (
                      <div className={styles.messageHeader}>
                        <span className={styles.senderName}>{modelTitle}</span>
                        <span className={styles.timestamp}>{formatTimestamp(msg.timestamp)}</span>
                      </div>
                    )}
                    <div className={styles.messageContent}>
                      {msg.role === 'assistant' ? <MarkdownRenderer markdown={msg.content} /> : msg.content}
                    </div>
                    {msg.role === 'assistant' && msg.content && (
                      <div className={styles.feedback}>
                        <button className={styles.feedbackBtn} title="Helpful"><ThumbLike20Regular /></button>
                        <button className={styles.feedbackBtn} title="Not helpful"><ThumbDislike20Regular /></button>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
            {isLoading && (
              <div className={styles.messageRow}>
                <div className={styles.avatar}>
                  <Bot24Regular />
                </div>
                <div className={styles.thinkingIndicator}>
                  <Spinner size="tiny" label="Model is thinking..." />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputArea}>
            <div className={styles.inputWrapper}>
              <Input
                className={styles.inputField}
                value={input}
                onChange={(_, data) => setInput(data.value)}
                onKeyDown={handleKeyDown}
                placeholder="Send a message..."
                disabled={isLoading}
              />
              <Button
                className={styles.sendBtn}
                appearance="transparent"
                icon={<Send24Regular />}
                onClick={() => void sendMessage()}
                disabled={!input.trim() || isLoading}
              />
            </div>
            <p className={styles.disclaimer}>
              AI-generated content might be incorrect, so review carefully before use. Do not include personal or confidential information in the chat.
            </p>
          </div>
        </section>
      )}

      {activeTab === PlaygroundTabs.DOCUMENTATION && (
        <section className={styles.documentationTab}>
          {model.data?.description ? (
            <MarkdownRenderer markdown={model.data.description} />
          ) : (
            <p className={styles.emptyState}>No documentation available for this model.</p>
          )}
        </section>
      )}
    </div>
  );
};

export default React.memo(ModelPlayground);

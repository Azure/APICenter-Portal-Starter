import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Input, Spinner, Tab, TabList, Badge } from '@fluentui/react-components';
import {
  Send24Regular,
  Bot24Regular,
  ThumbLike20Regular,
  ThumbDislike20Regular,
  Share24Regular,
  Open24Regular,
  DocumentRegular,
  ChatRegular,
} from '@fluentui/react-icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LocationsService } from '@/services/LocationsService';
import { useApi } from '@/hooks/useApi';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import styles from './AgentChat.module.scss';

const AGENT_ENDPOINT = 'https://apimsynctesting.azure-api.net/comms-agent/responses';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Parses an SSE stream from the Responses API, invoking onDelta for each text token
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
      // Keep the last potentially-incomplete line in the buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') continue;

        try {
          const event = JSON.parse(payload);
          if (event.type === 'response.output_text.delta' && event.delta) {
            onDelta(event.delta);
          } else if (event.type === 'response.completed' && event.response) {
            const output = event.response.output;
            if (Array.isArray(output)) {
              for (const item of output) {
                if (Array.isArray(item?.content)) {
                  for (const c of item.content) {
                    if (c?.text) onDelta(c.text);
                  }
                }
              }
            }
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

enum AgentTabs {
  PLAYGROUND = 'playground',
  DOCUMENTATION = 'documentation',
}

export const AgentChat: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const api = useApi(name);
  const [activeTab, setActiveTab] = useState<AgentTabs>(AgentTabs.PLAYGROUND);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);

    try {
      const response = await fetch(AGENT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: trimmed,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Agent responded with status ${response.status}`);
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
  }, [input, isLoading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage]
  );

  const agentTitle = api.data?.title || name || 'Agent';
  const agentSummary = api.data?.summary || api.data?.description;
  const agentKind = api.data?.kind;
  const lastUpdated = api.data?.lastUpdated ? new Date(api.data.lastUpdated).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : undefined;

  return (
    <div className={styles.agentPage}>
      <section className={styles.agentHeader}>
        <div className={styles.headerLeft}>
          <h1>{agentTitle}</h1>
          <div className={styles.badges}>
            {agentKind && <Badge appearance="filled" color="brand">{agentKind.toUpperCase()}</Badge>}
            {api.data?.lifecycleStage && <Badge appearance="outline">{api.data.lifecycleStage.toUpperCase()}</Badge>}
          </div>
          {agentSummary && <p className={styles.summary}>{agentSummary}</p>}
          <div className={styles.meta}>
            {api.data?.customProperties?.['version'] && <span><strong>VERSION</strong><br />{String(api.data.customProperties['version'])}</span>}
            {api.data?.contacts?.[0]?.name && <span><strong>AUTHOR</strong><br />{api.data.contacts[0].name}</span>}
            {lastUpdated && <span><strong>LAST UPDATED</strong><br />{lastUpdated}</span>}
          </div>
        </div>
        <div className={styles.headerActions}>
          <Button appearance="secondary" icon={<Share24Regular />}>Share</Button>
          <Button appearance="primary" icon={<Open24Regular />}>Open in VS Code</Button>
        </div>
      </section>

      <section className={styles.tabBar}>
        <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value as AgentTabs)}>
          <Tab icon={<ChatRegular />} value={AgentTabs.PLAYGROUND}>Agent playground</Tab>
          <Tab icon={<DocumentRegular />} value={AgentTabs.DOCUMENTATION}>Documentation</Tab>
        </TabList>
      </section>

      {activeTab === AgentTabs.PLAYGROUND && (
        <section className={styles.chatContainer}>
          <div className={styles.messages}>
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                Start a conversation with the agent. Ask anything about its capabilities.
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
                        <span className={styles.senderName}>{agentTitle}</span>
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
                  <Spinner size="tiny" label="Agent is thinking..." />
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
                placeholder="Ask the agent something..."
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

      {activeTab === AgentTabs.DOCUMENTATION && (
        <section className={styles.documentationTab}>
          {api.data?.description ? (
            <MarkdownRenderer markdown={api.data.description} />
          ) : (
            <p className={styles.emptyState}>No documentation available for this agent.</p>
          )}
        </section>
      )}
    </div>
  );
};

export default React.memo(AgentChat);

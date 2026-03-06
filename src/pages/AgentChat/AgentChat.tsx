import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Input, Spinner } from '@fluentui/react-components';
import { Send24Regular, Bot24Regular } from '@fluentui/react-icons';
import { Link, useNavigate } from 'react-router-dom';
import { LocationsService } from '@/services/LocationsService';
import styles from './AgentChat.module.scss';

const AGENT_ENDPOINT = 'https://apimsynctesting.azure-api.net/comms-agent/responses';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTextFromResponse(data: any): string {
  // Response shape: { output, content, message, response, ... }
  // output/content may be an array of items with { type: "output_text", text: "..." }
  // or an array of message objects with their own content arrays
  const candidates = [data.output, data.content, data.message, data.response];
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      return candidate;
    }
    if (Array.isArray(candidate)) {
      const texts = candidate.map((item: any) => {
        if (typeof item === 'string') return item;
        if (item?.text) return item.text;
        if (Array.isArray(item?.content)) {
          return item.content
            .map((c: any) => (typeof c === 'string' ? c : c?.text ?? ''))
            .filter(Boolean)
            .join('');
        }
        return '';
      }).filter(Boolean);
      if (texts.length) return texts.join('\n');
    }
  }
  return JSON.stringify(data);
}

export const AgentChat: React.FC = () => {
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

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(AGENT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: trimmed,
        }),
      });

      if (!response.ok) {
        throw new Error(`Agent responded with status ${response.status}`);
      }

      const data = await response.json();
      const assistantContent = extractTextFromResponse(data);
      setMessages((prev) => [...prev, { role: 'assistant', content: assistantContent }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${errorMessage}` }]);
    } finally {
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

  return (
    <div className={styles.chatPage}>
      <div className={styles.chatHeader}>
        <Bot24Regular />
        <h2>APIM SRE Agent</h2>
        <Link to={LocationsService.getHomeUrl()} className={styles.backLink}>
          ← Back to APIs
        </Link>
      </div>

      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.thinkingIndicator}>
            Start a conversation with the APIM SRE Agent. Ask about Azure API Management service live site issues.
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className={styles.thinkingIndicator}>
            <Spinner size="tiny" label="Agent is thinking..." />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <Input
          className={styles.inputField}
          value={input}
          onChange={(_, data) => setInput(data.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <Button
          appearance="primary"
          icon={<Send24Regular />}
          onClick={() => void sendMessage()}
          disabled={!input.trim() || isLoading}
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default React.memo(AgentChat);

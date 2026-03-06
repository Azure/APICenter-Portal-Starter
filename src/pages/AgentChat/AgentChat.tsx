import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Input, Spinner } from '@fluentui/react-components';
import { Send24Regular, Bot24Regular } from '@fluentui/react-icons';
import { Link, useNavigate } from 'react-router-dom';
import { LocationsService } from '@/services/LocationsService';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import styles from './AgentChat.module.scss';

const AGENT_ENDPOINT = 'https://apimsynctesting.azure-api.net/comms-agent/responses';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
          // Responses API streaming events:
          //   response.output_text.delta  → incremental text token
          //   response.completed          → full response (fallback)
          if (event.type === 'response.output_text.delta' && event.delta) {
            onDelta(event.delta);
          } else if (event.type === 'response.completed' && event.response) {
            // Fallback: if we somehow missed deltas, extract full text
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

    // Add an empty assistant message that we'll stream into
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

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
          // Append each token to the last (assistant) message
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
          updated.push({ role: 'assistant', content: `Error: ${errorMessage}` });
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
            {msg.role === 'assistant' ? <MarkdownRenderer markdown={msg.content} /> : msg.content}
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

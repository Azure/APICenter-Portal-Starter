import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Spinner, Textarea } from '@coreai-microsoft/manifold-fluentui-react';
import { ArrowRight24Regular, Bot24Regular } from '@fluentui/react-icons';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import styles from './ModelChatPlayground.module.scss';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ModelChatPlaygroundProps {
  runtimeUrl: string;
  modelTitle: string;
  modelName?: string;
}

async function readSSEStream(
  response: Response,
  onDelta: (text: string) => void,
  onComplete: () => void
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No readable stream in response');

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
          const content = chunk?.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          // Skip malformed JSON
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

const CHAT_PATH = '/chat/completions';

export const ModelChatPlayground: React.FC<ModelChatPlaygroundProps> = ({ runtimeUrl, modelTitle, modelName }) => {
  const chatUrl = runtimeUrl.replace(/\/$/, '') + CHAT_PATH;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed, timestamp: new Date() };
    const updatedMessages = [...messages, userMessage];
    setMessages([...updatedMessages, { role: 'assistant', content: '', timestamp: new Date() }]);
    setInput('');
    setIsLoading(true);

    try {
      const apiMessages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        ...updatedMessages.map(({ role, content }) => ({ role, content })),
      ];

      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
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
  }, [input, isLoading, chatUrl, messages, modelName]);

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
    <div className={styles.chatContainer}>
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
          <Textarea
            className={styles.inputField}
            textarea={{ ref: textareaRef }}
            value={input}
            onChange={(_, data) => { setInput(data.value); autoGrow(); }}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            disabled={isLoading}
            resize="none"
          />
          <Button
            className={`${styles.sendBtn} ${input.trim() ? styles.sendBtnActive : ''}`}
            appearance="transparent"
            icon={<ArrowRight24Regular />}
            onClick={() => void sendMessage()}
            disabled={!input.trim() || isLoading}
          />
        </div>
        <p className={styles.disclaimer}>
          AI-generated content might be incorrect, so review carefully before use. Do not include personal or confidential information in the chat.
        </p>
      </div>
    </div>
  );
};

export default React.memo(ModelChatPlayground);

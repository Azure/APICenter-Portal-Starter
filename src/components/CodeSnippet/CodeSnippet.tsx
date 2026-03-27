import React, { useCallback, useState } from 'react';
import { Button, Tooltip } from '@fluentui/react-components';
import styles from './CodeSnippet.module.scss';

interface CodeSnippetProps {
  code: string;
  language?: string;
  title?: string;
}

export const CodeSnippet: React.FC<CodeSnippetProps> = ({ code, language, title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  return (
    <div className={styles.codeSnippet}>
      <div className={styles.header}>
        {(title || language) && (
          <span className={styles.label}>{title || language}</span>
        )}
        <Tooltip
          content={copied ? 'Copied!' : 'Copy to clipboard'}
          positioning="above"
          relationship="label"
        >
          <Button
            appearance="subtle"
            className={styles.copyBtn}
            size="small"
            onClick={handleCopy}
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </Button>
        </Tooltip>
      </div>
      <pre className={styles.code}>
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default React.memo(CodeSnippet);

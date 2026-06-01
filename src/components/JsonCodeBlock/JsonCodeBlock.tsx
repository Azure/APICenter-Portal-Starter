import React, { useMemo, useState } from 'react';
import { Button, Tooltip } from '@fluentui/react-components';
import { CopyRegular, CheckmarkRegular } from '@fluentui/react-icons';
import styles from './JsonCodeBlock.module.scss';

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightJson(json: string): string {
  return json.replace(
    /("(?:\\.|[^"\\])*")\s*(:)?|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match, str, colon, keyword, num) => {
      if (str && colon) {
        return `<span class="${styles.jsonKey}">${escapeHtml(str)}</span>:`;
      }
      if (str) {
        return `<span class="${styles.jsonString}">${escapeHtml(str)}</span>`;
      }
      if (keyword) {
        return `<span class="${styles.jsonKeyword}">${keyword}</span>`;
      }
      if (num) {
        return `<span class="${styles.jsonNumber}">${num}</span>`;
      }
      return escapeHtml(match);
    }
  );
}

interface JsonCodeBlockProps {
  /** The JSON string or object to display. Objects are pretty-printed automatically. */
  value: string | object;
}

export const JsonCodeBlock: React.FC<JsonCodeBlockProps> = ({ value }) => {
  const [copied, setCopied] = useState(false);

  const jsonText = useMemo(() => {
    if (typeof value === 'string') {
      // Re-parse and re-format to ensure consistent 2-space indentation
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }
    return JSON.stringify(value, null, 2);
  }, [value]);

  const handleCopy = () => {
    void navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.jsonCodeBlock}>
      <Tooltip content={copied ? 'Copied!' : 'Copy'} relationship="label">
        <Button
          appearance="subtle"
          size="small"
          icon={copied ? <CheckmarkRegular /> : <CopyRegular />}
          aria-label="Copy JSON"
          className={styles.copyBtn}
          onClick={handleCopy}
        />
      </Tooltip>
      <div className={styles.lineNumbers}>
        {jsonText.split('\n').map((_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
      <pre className={styles.codeContent}>
        <code dangerouslySetInnerHTML={{ __html: highlightJson(jsonText) }} />
      </pre>
    </div>
  );
};

export default React.memo(JsonCodeBlock);

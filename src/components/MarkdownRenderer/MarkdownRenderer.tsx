import React from 'react';
import classNames from 'classnames';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeTruncate from 'rehype-truncate';
// TODO: upgrade this package and all related ones when https://github.com/hashicorp/next-mdx-remote/issues/403 fixed
import ReactMarkdown from 'react-markdown';

interface Props {
  markdown: string;
  maxLength?: number;
  shouldTruncate?: boolean;
}

export const MarkdownRenderer: React.FC<Props> = ({ markdown, maxLength, shouldTruncate }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        rehypeRaw,
        [
          rehypeTruncate,
          {
            maxChars: maxLength,
            disable: typeof maxLength === 'undefined',
          },
        ],
      ]}
      className={classNames(shouldTruncate && 'markdown-truncate')}
    >
      {markdown}
    </ReactMarkdown>
  );
};

export default React.memo(MarkdownRenderer);

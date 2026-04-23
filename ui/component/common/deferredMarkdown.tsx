import React from 'react';
import { lazyImport } from 'util/lazyImport';

const MarkdownPreview = lazyImport(
  () =>
    import(
      'component/common/markdown-preview'
      /* webpackChunkName: "markdown-preview" */
    )
);

const PLAIN_TEXT_STYLE = {
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
} as const;

const MARKDOWN_PATTERN =
  /(^|\n)\s{0,3}(#{1,6}|\*|-|\d+\.)\s|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|`{1,3}|[*_~]{1,2}|<\/?[a-z][^>]*>|lbry:\/\/|odysee:\/\/|www\.|https?:\/\/|\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b|:\+1:|:-1:|:[\w-]+:|\b\d{1,2}:\d{2}(?::\d{2})?\b/m;

type Props = {
  strip?: boolean;
  content: string | null | undefined;
  simpleLinks?: boolean;
  noDataStore?: boolean;
  className?: string;
  parentCommentId?: string;
  isMarkdownPost?: boolean;
  disableTimestamps?: boolean;
  stakedLevel?: number;
  setUserMention?: (arg0: boolean) => void;
  hasMembership?: boolean;
  isComment?: boolean;
  isMinimal?: boolean;
  promptLinks?: boolean;
};

function shouldLoadMarkdownPreview(content: string) {
  return MARKDOWN_PATTERN.test(content);
}

export default function DeferredMarkdown(props: Props) {
  const { content, className } = props;

  if (!content) {
    return null;
  }

  if (!shouldLoadMarkdownPreview(content)) {
    return (
      <div className={className} style={PLAIN_TEXT_STYLE}>
        {content}
      </div>
    );
  }

  return (
    <React.Suspense
      fallback={
        <div className={className} style={PLAIN_TEXT_STYLE}>
          {content}
        </div>
      }
    >
      <MarkdownPreview {...props} />
    </React.Suspense>
  );
}

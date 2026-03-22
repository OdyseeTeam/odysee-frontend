import React from 'react';
import classnames from 'classnames';
import MarkdownPreview from 'component/common/markdown-preview';
import { openContextMenu } from 'util/context-menu';

type Props = {
  className?: string;
  disabled?: boolean;
  id: string;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  onChange?: (value: string) => void;
  placeholder?: string | number;
  value?: string | number;
};

type CursorState = {
  start: number;
  end: number;
};

type MarkdownUpdate = {
  selectionEnd: number;
  selectionStart: number;
  value: string;
};

const LINK_PLACEHOLDER = 'https://';

function clampSelection(value: string, start: number, end: number): CursorState {
  return {
    start: Math.min(start, value.length),
    end: Math.min(end, value.length),
  };
}

function wrapSelection(
  value: string,
  start: number,
  end: number,
  prefix: string,
  suffix: string,
  placeholder: string
): MarkdownUpdate {
  const selected = value.slice(start, end);
  const inner = selected || placeholder;
  const nextValue = `${value.slice(0, start)}${prefix}${inner}${suffix}${value.slice(end)}`;
  const innerStart = start + prefix.length;

  return {
    value: nextValue,
    selectionStart: innerStart,
    selectionEnd: innerStart + inner.length,
  };
}

function prefixSelectedLines(
  value: string,
  start: number,
  end: number,
  buildPrefix: (lineIndex: number) => string
): MarkdownUpdate {
  const blockStart = value.lastIndexOf('\n', start - 1) + 1;
  const nextBreak = value.indexOf('\n', end);
  const blockEnd = nextBreak === -1 ? value.length : nextBreak;
  const selectedBlock = value.slice(blockStart, blockEnd);
  const lines = selectedBlock.split('\n');
  const prefixedBlock = lines.map((line, index) => `${buildPrefix(index)}${line}`).join('\n');
  const nextValue = `${value.slice(0, blockStart)}${prefixedBlock}${value.slice(blockEnd)}`;

  return {
    value: nextValue,
    selectionStart: blockStart,
    selectionEnd: blockStart + prefixedBlock.length,
  };
}

function insertLink(value: string, start: number, end: number): MarkdownUpdate {
  const selected = value.slice(start, end);
  const label = selected || __('link text');
  const prefix = `[${label}](`;
  const nextValue = `${value.slice(0, start)}${prefix}${LINK_PLACEHOLDER})${value.slice(end)}`;
  const selectionStart = start + prefix.length;

  return {
    value: nextValue,
    selectionStart,
    selectionEnd: selectionStart + LINK_PLACEHOLDER.length,
  };
}

function getWordCount(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function getLineAndColumn(value: string, cursorIndex: number): { column: number; line: number } {
  const beforeCursor = value.slice(0, cursorIndex);
  const lines = beforeCursor.split('\n');
  const line = lines.length;
  const column = (lines[lines.length - 1] || '').length + 1;

  return {
    line,
    column,
  };
}

export default function MarkdownEditor(props: Props) {
  const { className, disabled, id, inputRef, onChange, placeholder, value } = props;
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [cursor, setCursor] = React.useState<CursorState>({
    start: 0,
    end: 0,
  });
  const stringValue = typeof value === 'string' ? value : value === undefined || value === null ? '' : String(value);
  const lineCount = stringValue ? stringValue.split('\n').length : 1;
  const wordCount = getWordCount(stringValue);
  const { line, column } = getLineAndColumn(stringValue, cursor.end);

  const syncCursor = React.useCallback(() => {
    const input = inputRef.current;

    if (input) {
      setCursor(
        clampSelection(stringValue, input.selectionStart || 0, input.selectionEnd || input.selectionStart || 0)
      );
    }
  }, [inputRef, stringValue]);

  React.useEffect(() => {
    setCursor((prev) => clampSelection(stringValue, prev.start, prev.end));
  }, [stringValue]);

  const applyMarkdown = React.useCallback(
    (update: MarkdownUpdate) => {
      if (!onChange) return;

      onChange(update.value);
      window.setTimeout(() => {
        const input = inputRef.current;

        if (input) {
          input.focus();
          input.setSelectionRange(update.selectionStart, update.selectionEnd);
          setCursor({
            start: update.selectionStart,
            end: update.selectionEnd,
          });
        }
      }, 0);
    },
    [inputRef, onChange]
  );

  const runAction = React.useCallback(
    (action: (value: string, start: number, end: number) => MarkdownUpdate) => {
      if (disabled) return;

      const input = inputRef.current;
      const start = input ? input.selectionStart || 0 : cursor.start;
      const end = input ? input.selectionEnd || start : cursor.end;

      applyMarkdown(action(stringValue, start, end));
    },
    [applyMarkdown, cursor.end, cursor.start, disabled, inputRef, stringValue]
  );

  const toolbarButtons = [
    {
      label: __('Bold'),
      shortLabel: 'B',
      action: () => runAction((content, start, end) => wrapSelection(content, start, end, '**', '**', __('bold text'))),
    },
    {
      label: __('Italic'),
      shortLabel: 'I',
      action: () => runAction((content, start, end) => wrapSelection(content, start, end, '*', '*', __('italic text'))),
    },
    {
      label: __('Strikethrough'),
      shortLabel: 'S',
      action: () =>
        runAction((content, start, end) => wrapSelection(content, start, end, '~~', '~~', __('struck text'))),
    },
    {
      label: __('Quote'),
      shortLabel: '"',
      action: () => runAction((content, start, end) => prefixSelectedLines(content, start, end, () => '> ')),
    },
    {
      label: __('Bulleted list'),
      shortLabel: __('UL'),
      action: () => runAction((content, start, end) => prefixSelectedLines(content, start, end, () => '- ')),
    },
    {
      label: __('Numbered list'),
      shortLabel: __('OL'),
      action: () =>
        runAction((content, start, end) => prefixSelectedLines(content, start, end, (index) => `${index + 1}. `)),
    },
    {
      label: __('Link'),
      shortLabel: __('Link'),
      action: () => runAction(insertLink),
    },
    {
      label: __('Code block'),
      shortLabel: '</>',
      action: () =>
        runAction((content, start, end) => wrapSelection(content, start, end, '```\n', '\n```', __('code'))),
    },
  ];

  return (
    <div className={classnames('markdown-editor', className, previewOpen && 'markdown-editor--preview')}>
      <div className="markdown-editor__toolbar" role="toolbar" aria-label={__('Markdown formatting options')}>
        <div className="markdown-editor__toolbar-group">
          {toolbarButtons.map((button) => (
            <button
              key={button.label}
              type="button"
              className="markdown-editor__toolbar-button"
              aria-label={button.label}
              title={button.label}
              disabled={disabled || previewOpen}
              onClick={button.action}
            >
              {button.shortLabel}
            </button>
          ))}
        </div>
        <div className="markdown-editor__toolbar-group">
          <button
            type="button"
            className="markdown-editor__toolbar-button markdown-editor__toolbar-button--preview"
            aria-pressed={previewOpen}
            onClick={() => setPreviewOpen((value) => !value)}
          >
            {previewOpen ? __('Edit') : __('Preview')}
          </button>
        </div>
      </div>

      <textarea
        id={id}
        ref={inputRef}
        className={classnames('markdown-editor__textarea', previewOpen && 'markdown-editor__textarea--hidden')}
        disabled={disabled}
        placeholder={placeholder === undefined || placeholder === null ? undefined : String(placeholder)}
        value={stringValue}
        onChange={(event) => {
          onChange?.(event.target.value);
          syncCursor();
        }}
        onClick={syncCursor}
        onKeyUp={syncCursor}
        onSelect={syncCursor}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            runAction(insertLink);
          }
        }}
        onContextMenu={(event) => {
          try {
            openContextMenu(
              event.nativeEvent,
              [],
              true,
              event.currentTarget.value.slice(
                event.currentTarget.selectionStart || 0,
                event.currentTarget.selectionEnd || 0
              )
            );
            event.preventDefault();
          } catch {}
        }}
      />

      <div className={classnames('markdown-editor__preview', !previewOpen && 'markdown-editor__preview--hidden')}>
        <MarkdownPreview content={stringValue} noDataStore />
      </div>

      <div className="markdown-editor__statusbar">
        <span className="editor-statusbar__upload-hint">{__('Attach images by pasting or drag-and-drop.')}</span>
        <span>{__('Lines: %count%', { count: lineCount })}</span>
        <span>{__('Words: %count%', { count: wordCount })}</span>
        <span>{__('Cursor: %line%:%column%', { line, column })}</span>
      </div>
    </div>
  );
}

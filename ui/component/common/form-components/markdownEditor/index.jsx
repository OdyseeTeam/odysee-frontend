// @flow
import React from 'react';
import { lowlight } from 'lowlight';

import './styles.scss';

import * as TipTap from '@tiptap/react';

import { getMarkdownOutput } from './internal/util/markdown';

// -- Plugins --
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';

import MarkdownPasteHandler from './internal/customPlugins/markdown-paste-handler';

// -- End Plugins --

import Button from 'component/button';
import MarkdownPreview from 'component/common/markdown-preview';
import MenuBar from './internal/menuBar';

type Props = {
  value: string,
  disabled: boolean,
  placeholder: string,
  textAreaMaxLength?: number,
  onChange?: (value: string) => void,
};

const MarkdownEditor = (props: Props) => {
  const { value, placeholder, textAreaMaxLength, onChange } = props;

  const [cursor, setCursor] = React.useState({ line: 0, ch: 0 });
  const [markdownOutput, setMarkdownOutput] = React.useState('');
  const [viewMode, setViewMode] = React.useState(1);

  function handleUpdate({ editor }) {
    const markdownTxt = getMarkdownOutput(editor);
    setMarkdownOutput(markdownTxt);

    if (onChange) {
      onChange(markdownTxt);
    }
  }

  const editor = TipTap.useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: textAreaMaxLength }),
      Link.configure({ protocols: ['ftp', 'mailto', 'lbry'], openOnClick: false }),
      MarkdownPasteHandler,
    ],
    onCreate: ({ editor }) => setMarkdownOutput(getMarkdownOutput(editor)),
    onUpdate: handleUpdate,
    onSelectionUpdate: ({ editor }) => {
      const { anchor: cursorAnchor } = editor.state.selection;
      const editorText = editor.getText();
      const textBeforeAnchor = editorText.substring(0, cursorAnchor - 1);
      const linesToAnchor = textBeforeAnchor.split('\n\n');
      const currentLine = linesToAnchor.length;
      const currentLineCh = linesToAnchor[linesToAnchor.length - 1].length;

      setCursor({ line: currentLine, ch: currentLineCh });
    },
    editorProps: {},
    content: value,
    parseOptions: { to: 10 },
  });

  React.useEffect(() => {
    if (markdownOutput && onChange) {
      onChange(markdownOutput);
    }
  }, [markdownOutput, onChange]);

  if (!editor) return null;

  return (
    <div id="content_post-wrapper">
      <div className="EasyMDEContainer">
        <div className="toolbar-editor">
          <MenuBar editor={editor} />
        </div>

        <div style={{ display: viewMode === 0 && 'flex' }}>
          <div style={{ width: viewMode === 0 && '50%' }} className="CodeMirror cm-s-easymde CodeMirror-wrap">
            <TipTap.EditorContent editor={editor} />
          </div>

          {viewMode === 0 && (
            <div style={{ width: '50%' }} className="CodeMirror cm-s-easymde CodeMirror-wrap">
              <MarkdownPreview content={markdownOutput} />
            </div>
          )}
        </div>

        <div className="tiptap-editor__actions">
          <Button className={viewMode === 0 && 'is-active'} label={__('Markdown')} onClick={() => setViewMode(0)} />
          <Button className={viewMode === 1 && 'is-active'} label={__('WYSIWYG')} onClick={() => setViewMode(1)} />
        </div>

        <div className="editor-statusbar">
          <span className="editor-statusbar__upload-hint">{__('Attach images by pasting or drag-and-drop.')}</span>
          <span className="lines">{editor.getJSON().content.length}</span>
          <span className="words">{editor.storage.characterCount.words()}</span>
          <span className="cursor">
            {cursor.line}:{cursor.ch}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;

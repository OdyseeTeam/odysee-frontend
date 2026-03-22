import * as React from 'react';
import { basicSetup } from 'codemirror';
import { Compartment, EditorSelection, EditorState } from '@codemirror/state';
import { StreamLanguage } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import { openContextMenu } from 'util/context-menu';
import { clike } from '@codemirror/legacy-modes/mode/clike';
import { css } from '@codemirror/legacy-modes/mode/css';
import { go } from '@codemirror/legacy-modes/mode/go';
import { javascript } from '@codemirror/legacy-modes/mode/javascript';
import { python } from '@codemirror/legacy-modes/mode/python';
import { ruby } from '@codemirror/legacy-modes/mode/ruby';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { xml } from '@codemirror/legacy-modes/mode/xml';

type Props = {
  theme: string;
  value: string | null | undefined;
  contentType: string;
};

function getLanguageExtension(contentType: string) {
  const type = (contentType || '').toLowerCase();

  if (
    type.includes('javascript') ||
    type.includes('ecmascript') ||
    type.includes('json') ||
    type.includes('jsx') ||
    type.includes('typescript')
  ) {
    return StreamLanguage.define(javascript);
  }

  if (type.includes('css') || type.includes('scss')) {
    return StreamLanguage.define(css);
  }

  if (type.includes('html') || type.includes('xml') || type.includes('svg')) {
    return StreamLanguage.define(xml);
  }

  if (type.includes('ruby')) {
    return StreamLanguage.define(ruby);
  }

  if (
    type.includes('java') ||
    type.includes('c++') ||
    type.includes('cpp') ||
    type.includes('csharp') ||
    type.includes('c#') ||
    type.includes('x-c') ||
    type.includes('x-csrc') ||
    type.includes('x-c++src')
  ) {
    return StreamLanguage.define(clike);
  }

  if (type.includes('shell') || type.includes('bash') || type.includes('sh')) {
    return StreamLanguage.define(shell);
  }

  if (type.includes('python')) {
    return StreamLanguage.define(python);
  }

  if (type.includes('go')) {
    return StreamLanguage.define(go);
  }

  return [];
}

function createThemeExtension(theme: string) {
  const isDark = theme === 'dark';

  return [
    EditorView.theme(
      {
        '&': {
          height: '100%',
          fontSize: 'var(--font-small)',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: 'var(--font-monospace)',
        },
        '.cm-content': {
          padding: 'var(--spacing-s) 0',
          letterSpacing: '0.1rem',
        },
        '.cm-line': {
          paddingLeft: 'var(--spacing-m)',
        },
        '.cm-gutters': {
          backgroundColor: isDark ? '#212529' : 'var(--color-gray-1)',
          borderRight: isDark ? '0' : '1px solid var(--color-gray-4)',
          color: 'var(--color-gray-5)',
          paddingRight: 'var(--spacing-m)',
        },
        '.cm-activeLineGutter': {
          backgroundColor: 'transparent',
        },
        '.cm-activeLine': {
          backgroundColor: isDark ? '#373831' : 'rgba(0, 0, 0, 0.03)',
        },
        '.cm-selectionBackground, ::selection': {
          backgroundColor: isDark ? '#717273 !important' : 'rgba(25, 118, 210, 0.18) !important',
        },
        '.cm-cursor, .cm-dropCursor': {
          borderLeftColor: isDark ? '#f8f8f0' : 'var(--color-text)',
        },
        '.cm-focused': {
          outline: 'none',
        },
      },
      { dark: isDark }
    ),
    ...(isDark ? [oneDark] : []),
  ];
}

export default function CodeViewer(props: Props) {
  const { theme, value, contentType } = props;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const viewRef = React.useRef<EditorView | null>(null);
  const themeCompartment = React.useRef(new Compartment());
  const languageCompartment = React.useRef(new Compartment());

  React.useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      parent: containerRef.current,
      state: EditorState.create({
        doc: value || '',
        extensions: [
          basicSetup,
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
          EditorView.lineWrapping,
          themeCompartment.current.of(createThemeExtension(theme)),
          languageCompartment.current.of(getLanguageExtension(contentType)),
          EditorView.domEventHandlers({
            contextmenu: (event, editorView) => {
              const selection = editorView.state.sliceDoc(
                editorView.state.selection.main.from,
                editorView.state.selection.main.to
              );
              openContextMenu(
                event,
                [
                  {
                    label: 'Select All',
                    accelerator: 'CmdOrCtrl+A',
                    role: 'selectall',
                    click: () => {
                      editorView.dispatch({
                        selection: EditorSelection.range(0, editorView.state.doc.length),
                      });
                    },
                    enabled: editorView.state.doc.length > 0,
                  },
                ],
                false,
                selection
              );
              event.preventDefault();
            },
          }),
        ],
      }),
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const view = viewRef.current;

    if (!view) return;

    const currentDoc = view.state.doc.toString();
    const nextDoc = value || '';

    if (currentDoc !== nextDoc) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: nextDoc,
        },
      });
    }
  }, [value]);

  React.useEffect(() => {
    const view = viewRef.current;

    if (!view) return;

    view.dispatch({
      effects: themeCompartment.current.reconfigure(createThemeExtension(theme)),
    });
  }, [theme]);

  React.useEffect(() => {
    const view = viewRef.current;

    if (!view) return;

    view.dispatch({
      effects: languageCompartment.current.reconfigure(getLanguageExtension(contentType)),
    });
  }, [contentType]);

  return <div className="file-render__content" ref={containerRef} />;
}

interface MenuTemplate {
  label?: string;
  accelerator?: string;
  role?: string;
  type?: string;
  click?: () => void;
  enabled?: boolean;
}

interface CodeMirrorEditor {
  doc: {
    getValue: () => string;
    getSelection: () => string;
  };
  execCommand: (command: string) => void;
}

export function openContextMenu(
  _event: MouseEvent,
  _templates: MenuTemplate[] = [],
  _canEdit: boolean = false,
  _selection: string = ''
): boolean {
  // Electron-specific menu support was removed.
  // Return false so callers can allow the browser's native context menu.
  return false;
}

export function openEditorMenu(codeMirror: CodeMirrorEditor, event: MouseEvent): boolean {
  const selection = codeMirror.doc.getSelection();
  return openContextMenu(event, [], true, selection);
}

export function openSnippetMenu(codeMirror: CodeMirrorEditor, event: MouseEvent): boolean {
  const selection = codeMirror.doc.getSelection();
  return openContextMenu(event, [], false, selection);
}

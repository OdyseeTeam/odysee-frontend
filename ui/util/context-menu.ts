import { clipboard, remote } from 'electron';

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

const isDev = process.env.NODE_ENV !== 'production';

function injectDevelopmentTemplate(event: MouseEvent, templates: MenuTemplate[]): MenuTemplate[] {
  if (!isDev) return templates;
  const { screenX, screenY } = event;
  const separator = {
    type: 'separator',
  };
  const developmentTemplateAddition = [
    {
      label: 'Inspect element',
      accelerator: 'CmdOrCtrl+Shift+I',
      click: () => {
        remote.getCurrentWindow().inspectElement(screenX, screenY);
      },
    },
  ];

  if (templates.length > 0) {
    templates.push(separator);
  }

  templates.push(...developmentTemplateAddition);
  return templates;
}

export function openContextMenu(
  event: MouseEvent,
  templates: MenuTemplate[] = [],
  canEdit: boolean = false,
  selection: string = ''
): void {
  const { type, value } = event.target;
  const isInput = event.target.matches('input') && (type === 'text' || type === 'number');
  const isTextField = canEdit || isInput || event.target.matches('textarea');
  const isSomethingSelected = selection.length > 0 || window.getSelection().toString().length > 0;
  templates.push({
    label: 'Copy',
    accelerator: 'CmdOrCtrl+C',
    role: 'copy',
    enabled: isSomethingSelected,
  });
  // If context menu is opened on Input and there is text on the input and something is selected.
  const { selectionStart, selectionEnd } = event.target;

  if (!!value && isTextField && selectionStart !== selectionEnd) {
    templates.push({
      label: 'Cut',
      accelerator: 'CmdOrCtrl+X',
      role: 'cut',
    });
  }

  // If context menu is opened on Input and text is present on clipboard
  if (clipboard.readText().length > 0 && isTextField) {
    templates.push({
      label: 'Paste',
      accelerator: 'CmdOrCtrl+V',
      role: 'paste',
    });
  }

  // If context menu is opened on Input
  if (isTextField && value) {
    templates.push({
      label: 'Select All',
      accelerator: 'CmdOrCtrl+A',
      role: 'selectall',
    });
  }

  injectDevelopmentTemplate(event, templates);
  remote.Menu.buildFromTemplate(templates).popup({});
}
// This function is used for the markdown description on the publish page
export function openEditorMenu(codeMirror: CodeMirrorEditor, event: MouseEvent): void {
  const value = codeMirror.doc.getValue();
  const selection = codeMirror.doc.getSelection();
  const templates = [
    {
      label: 'Select All',
      accelerator: 'CmdOrCtrl+A',
      role: 'selectall',
      click: () => {
        codeMirror.execCommand('selectAll');
      },
      enabled: value.length > 0,
    },
    {
      label: 'Cut',
      accelerator: 'CmdOrCtrl+X',
      role: 'cut',
      enabled: selection.length > 0,
    },
  ];
  openContextMenu(event, templates, true, selection);
}
// This function is used for the CodeViewer component
export function openSnippetMenu(codeMirror: CodeMirrorEditor, event: MouseEvent): void {
  const value = codeMirror.doc.getValue();
  const selection = codeMirror.doc.getSelection();
  const templates = [
    {
      label: 'Select All',
      accelerator: 'CmdOrCtrl+A',
      role: 'selectall',
      click: () => {
        codeMirror.execCommand('selectAll');
      },
      // Enabled if there is text to select
      enabled: value.length > 0,
    },
  ];
  openContextMenu(event, templates, false, selection);
}

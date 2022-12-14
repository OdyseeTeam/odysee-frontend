// @flow
// https://github.com/ueberdosis/tiptap/issues/2874#issuecomment-1153479930
import MarkdownIt from 'markdown-it';

import { Plugin, PluginKey } from 'prosemirror-state';
import { Extension, generateJSON } from '@tiptap/core';

import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';

const MarkdownPasteHandler = Extension.create({
  name: 'eventHandler',

  addProseMirrorPlugins() {
    const { editor } = this;

    return [
      new Plugin({
        key: new PluginKey('eventHandler'),
        props: {
          handlePaste(view, event, slice) {
            const md = new MarkdownIt();

            const mdContents = event.clipboardData.getData('text/plain');
            const jsonContent = generateJSON(md.render(mdContents), [
              MarkdownPasteHandler,
              StarterKit,
              Link.configure({ openOnClick: false }),
            ]);

            editor.commands.insertContent(jsonContent.content.length > 1 ? jsonContent : mdContents, {
              parseOptions: { preserveWhitespace: false },
            });

            return true;
          },
        },
      }),
    ];
  },
});

export default MarkdownPasteHandler;

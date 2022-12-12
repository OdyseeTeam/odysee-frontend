// @flow
// thanks to https://github.com/justinmoon/tiptap-markdown-demo

import {
  MarkdownSerializer as ProseMirrorMarkdownSerializer,
  defaultMarkdownSerializer,
} from 'prosemirror-markdown/src/to_markdown';

import Paragraph from '@tiptap/extension-paragraph';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Strike from '@tiptap/extension-strike';
import Italic from '@tiptap/extension-italic';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import HardBreak from '@tiptap/extension-hard-break';
import Code from '@tiptap/extension-code';
import Bold from '@tiptap/extension-bold';
import Blockquote from '@tiptap/extension-blockquote';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';

const tableMap = new WeakMap();

function isInTable(node) {
  return tableMap.has(node);
}

export function renderHardBreak(state, node, parent, index) {
  const br = isInTable(parent) ? '<br>' : '\\\n';
  for (let i = index + 1; i < parent.childCount; i += 1) {
    if (parent.child(i).type !== node.type) {
      state.write(br);
      return;
    }
  }
}

export function renderOrderedList(state, node) {
  const { parens } = node.attrs;
  const start = node.attrs.start || 1;
  const maxW = String(start + node.childCount - 1).length;
  const space = state.repeat(' ', maxW + 2);
  const delimiter = parens ? ')' : '.';
  state.renderList(node, space, (i) => {
    const nStr = String(start + i);
    return `${state.repeat(' ', maxW - nStr.length) + nStr}${delimiter} `;
  });
}

export function isPlainURL(link, parent, index, side) {
  if (link.attrs.title || !/^\w+:/.test(link.attrs.href)) return false;
  const content = parent.child(index + (side < 0 ? -1 : 0));
  if (!content.isText || content.text !== link.attrs.href || content.marks[content.marks.length - 1] !== link) {
    return false;
  }
  if (index === (side < 0 ? 1 : parent.childCount - 1)) return true;
  const next = parent.child(index + (side < 0 ? -2 : 1));
  return !link.isInSet(next.marks);
}

const serializerMarks = {
  ...defaultMarkdownSerializer.marks,
  [Bold.name]: defaultMarkdownSerializer.marks.strong,
  [Strike.name]: {
    open: '~~',
    close: '~~',
    mixable: true,
    expelEnclosingWhitespace: true,
  },
  [Italic.name]: {
    open: '_',
    close: '_',
    mixable: true,
    expelEnclosingWhitespace: true,
  },
  [Code.name]: defaultMarkdownSerializer.marks.code,
  [Link.name]: {
    open(state, mark, parent, index) {
      return isPlainURL(mark, parent, index, 1) ? '<' : '[';
    },
    close(state, mark, parent, index) {
      const href = mark.attrs.canonicalSrc || mark.attrs.href;

      return isPlainURL(mark, parent, index, -1)
        ? '>'
        : `](${state.esc(href)}${mark.attrs.title ? ` ${state.quote(mark.attrs.title)}` : ''})`;
    },
  },
};

const serializerNodes = {
  ...defaultMarkdownSerializer.nodes,
  [Paragraph.name]: defaultMarkdownSerializer.nodes.paragraph,
  [BulletList.name]: defaultMarkdownSerializer.nodes.bullet_list,
  [ListItem.name]: defaultMarkdownSerializer.nodes.list_item,
  [HorizontalRule.name]: defaultMarkdownSerializer.nodes.horizontal_rule,
  [OrderedList.name]: renderOrderedList,
  [HardBreak.name]: renderHardBreak,
  [CodeBlockLowlight.name]: (state, node) => {
    state.write(`\`\`\`${node.attrs.language || ''}\n`);
    state.text(node.textContent, false);
    state.ensureNewLine();
    state.write('```');
    state.closeBlock(node);
  },
  [Blockquote.name]: (state, node) => {
    if (node.attrs.multiline) {
      state.write('>>>');
      state.ensureNewLine();
      state.renderContent(node);
      state.ensureNewLine();
      state.write('>>>');
      state.closeBlock(node);
    } else {
      state.wrapBlock('> ', null, node, () => state.renderContent(node));
    }
  },
};

function serialize(schema, content) {
  const proseMirrorDocument = schema.nodeFromJSON(content);
  const serializer = new ProseMirrorMarkdownSerializer(serializerNodes, serializerMarks);

  return serializer.serialize(proseMirrorDocument, { tightLists: true });
}

export function getMarkdownOutput(editor) {
  return serialize(editor.schema, editor.getJSON());
}

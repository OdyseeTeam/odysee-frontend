import { EMOTES_48px as EMOTES, TWEMOTEARRAY } from 'constants/emotes';
import { visit } from 'unist-util-visit';

const EMOTE_NODE_TYPE = 'emote';
const RE_EMOTE = /:\+1:|:-1:|:[\w-]+:/;

type MdastNode = {
  type: string;
  value?: string;
  url?: string;
  title?: string;
  alt?: string;
  data?: { hProperties?: Record<string, unknown> };
  children?: MdastNode[];
};

function findNextEmote(value: string, fromIndex: number, strictlyFromIndex: boolean) {
  let begin = 0;

  while (begin < value.length) {
    const match = value.substring(begin).match(RE_EMOTE);

    if (!match) {
      return null;
    }

    match.index = (match.index || 0) + begin;

    if (strictlyFromIndex && match.index !== fromIndex) {
      if (match.index > fromIndex) {
        return null;
      }

      begin = match.index + match[0].length;
      continue;
    }

    if (fromIndex > 0 && fromIndex > match.index && fromIndex < match.index + match[0].length) {
      begin = match.index + match[0].length;
      continue;
    }

    const text = match[0];

    if (EMOTES.some(({ name }) => text === name) || TWEMOTEARRAY.some(({ name }) => text === name)) {
      return {
        text,
        index: match.index,
      };
    }

    if (strictlyFromIndex && match.index >= fromIndex) {
      return null;
    }

    begin = match.index + match[0].length;
  }

  return null;
}

function createTextNode(value: string): MdastNode {
  return {
    type: 'text',
    value,
  };
}

function createEmoteNode(text: string): MdastNode {
  const emote = EMOTES.find(({ name }) => text === name) || TWEMOTEARRAY.find(({ name }) => text === name);

  if (!emote) {
    return createTextNode(text);
  }

  return {
    type: 'image',
    url: emote.url,
    title: text,
    alt: text,
    children: [
      {
        type: 'text',
        value: text,
      },
    ],
    data: {
      hProperties: {
        emote: true,
      },
    },
  };
}

function splitTextNode(value: string): MdastNode[] {
  const nodes: MdastNode[] = [];
  let index = 0;

  while (index < value.length) {
    const emote = findNextEmote(value, index, false);

    if (!emote) {
      nodes.push(createTextNode(value.slice(index)));
      break;
    }

    if (emote.index > index) {
      nodes.push(createTextNode(value.slice(index, emote.index)));
    }

    nodes.push(createEmoteNode(emote.text));
    index = emote.index + emote.text.length;
  }

  return nodes.length ? nodes : [createTextNode(value)];
}

const transform = (tree) => {
  visit(tree, 'text', (node: MdastNode, index: number | undefined, parent: MdastNode | undefined) => {
    if (typeof index !== 'number' || !parent || parent.type !== 'paragraph' || !node.value) {
      return undefined;
    }

    const nextChildren = splitTextNode(node.value);

    if (nextChildren.length === 1 && nextChildren[0].type === 'text' && nextChildren[0].value === node.value) {
      return undefined;
    }

    parent.children?.splice(index, 1, ...nextChildren);
    return index + nextChildren.length;
  });
};

export const inlineEmote = () => transform;
export const formattedEmote = () => transform;

import { EMOTES_48px as EMOTES, TWEMOTEARRAY } from 'constants/emotes';
import { visit } from 'unist-util-visit';

const RE_EMOTE_GLOBAL = /:\+1:|:-1:|:[\w-]+:/g;

const emoteMap = new Map<string, { name: string; url: string }>();
for (const emote of EMOTES as Array<{ name: string; url: string }>) {
  emoteMap.set(emote.name, emote);
}
for (const emote of TWEMOTEARRAY as Array<{ name: string; url: string }>) {
  if (!emoteMap.has(emote.name)) {
    emoteMap.set(emote.name, emote);
  }
}

type MdastNode = {
  type: string;
  value?: string;
  url?: string;
  title?: string;
  alt?: string;
  data?: { hProperties?: Record<string, unknown> };
  children?: MdastNode[];
};

function createTextNode(value: string): MdastNode {
  return {
    type: 'text',
    value,
  };
}

function createEmoteNode(text: string, emote: { name: string; url: string }): MdastNode {
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
  let lastIndex = 0;

  RE_EMOTE_GLOBAL.lastIndex = 0;
  let match;
  while ((match = RE_EMOTE_GLOBAL.exec(value)) !== null) {
    const emote = emoteMap.get(match[0]);
    if (!emote) continue;

    if (match.index > lastIndex) {
      nodes.push(createTextNode(value.slice(lastIndex, match.index)));
    }

    nodes.push(createEmoteNode(match[0], emote));
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < value.length) {
    nodes.push(createTextNode(value.slice(lastIndex)));
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

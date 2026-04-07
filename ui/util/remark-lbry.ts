import { visit } from 'unist-util-visit';
import { parseURI } from 'util/lbryURI';

interface MdastNode {
  type: string;
  url?: string;
  value?: string;
  title?: string | null;
  data?: { hProperties?: Record<string, unknown> };
  children?: MdastNode[];
}

const protocol = 'lbry://';
const uriRegex = /(lbry:\/\/)[^\s"]*[^)]/;
export const punctuationMarks = [',', '.', '!', '?', ':', ';', '-', ']', ')', '}'];
const mentionToken = '@';
const invalidRegex = /[-_.+=?!@#$%^&*:;,{}<>\w/\\]/;
const mentionRegex = /@[^\s"=?!@$%^&*;,{}<>/\\]*/;

function createTextNode(value: string): MdastNode {
  return {
    type: 'text',
    value,
  };
}

function handlePunctuation(value: string): string {
  const protocolIndex = value.indexOf(protocol) === 0 ? protocol.length - 1 : 0;
  const channelModifierIndex =
    (value.indexOf(':', protocolIndex) >= 0 && value.indexOf(':', protocolIndex)) ||
    (value.indexOf('#', protocolIndex) >= 0 && value.indexOf('#', protocolIndex));
  const claimModifierIndex =
    (value.indexOf(':', channelModifierIndex + 1) >= 0 && value.indexOf(':', channelModifierIndex + 1)) ||
    (value.indexOf('#', channelModifierIndex + 1) >= 0 && value.indexOf('#', channelModifierIndex + 1)) ||
    channelModifierIndex;
  let punctuationIndex;

  punctuationMarks.some((character) => {
    if (claimModifierIndex) {
      punctuationIndex =
        value.indexOf(character, claimModifierIndex + 1) >= 0 && value.indexOf(character, claimModifierIndex + 1);
    }

    return punctuationIndex;
  });

  return punctuationIndex ? value.substring(0, punctuationIndex) : value;
}

function locateMention(value: string, fromIndex: number): number {
  const index = value.indexOf(mentionToken, fromIndex);

  if (index > 0 && invalidRegex.test(value.charAt(index - 1))) {
    return locateMention(value, index + 1);
  }

  return index;
}

function locateURI(value: string, fromIndex: number): number {
  const index = value.indexOf(protocol, fromIndex);

  if (index > 0 && invalidRegex.test(value.charAt(index - 1))) {
    return locateMention(value, index + 1);
  }

  return index;
}

const createURI = (text: string, uri: string, embed: boolean = false): MdastNode => ({
  type: 'link',
  url: (uri.startsWith(protocol) ? '' : protocol) + uri,
  data: {
    hProperties: {
      embed,
    },
  },
  children: [
    {
      type: 'text',
      value: text,
    },
  ],
});

function createLinkNode(rawText: string): { node?: MdastNode; consumedText: string } {
  const consumedText = rawText.startsWith(protocol) ? handlePunctuation(rawText) : rawText;

  try {
    const uri = parseURI(consumedText);
    const isValid = uri && uri.claimName;
    const isChannel = uri.isChannel && uri.path === uri.claimName;

    if (isValid) {
      if (isChannel) {
        return {
          node: createURI(uri.claimName, consumedText, false),
          consumedText,
        };
      }

      return {
        node: createURI(consumedText, consumedText, true),
        consumedText,
      };
    }
  } catch (err) {
    // Ignore malformed inline values.
  }

  return { consumedText };
}

function splitTextNode(value: string): MdastNode[] {
  const nodes: MdastNode[] = [];
  let cursor = 0;

  while (cursor < value.length) {
    const nextMention = locateMention(value, cursor);
    const nextUri = locateURI(value, cursor);
    const candidates = [nextMention, nextUri].filter((candidate) => candidate >= 0);

    if (!candidates.length) {
      nodes.push(createTextNode(value.slice(cursor)));
      break;
    }

    const nextIndex = Math.min(...candidates);

    if (nextIndex > cursor) {
      nodes.push(createTextNode(value.slice(cursor, nextIndex)));
    }

    const nextValue = value.slice(nextIndex);
    const rawMatch = nextIndex === nextUri ? nextValue.match(uriRegex)?.[0] : nextValue.match(mentionRegex)?.[0];

    if (!rawMatch) {
      nodes.push(createTextNode(value.charAt(nextIndex)));
      cursor = nextIndex + 1;
      continue;
    }

    const { node, consumedText } = createLinkNode(rawMatch);

    if (node) {
      nodes.push(node);
      cursor = nextIndex + consumedText.length;
      continue;
    }

    nodes.push(createTextNode(value.charAt(nextIndex)));
    cursor = nextIndex + 1;
  }

  return nodes.length ? nodes : [createTextNode(value)];
}

function setAutoEmbed(node: MdastNode) {
  if (!node.url) {
    return;
  }

  try {
    const uri = parseURI(node.url);
    const isValid = uri && uri.claimName;
    const isChannel = uri.isChannel && uri.path === uri.claimName;

    if (isValid && !isChannel) {
      node.data = {
        ...node.data,
        hProperties: {
          embed: true,
          ...node.data?.hProperties,
        },
      };
    }
  } catch (err) {
    // Ignore malformed links.
  }
}

const transform = (tree: MdastNode): void => {
  visit(tree, 'text', (node: MdastNode, index: number | undefined, parent: MdastNode | undefined) => {
    if (typeof index !== 'number' || !parent || !node.value || parent.type === 'link') {
      return undefined;
    }

    const nextChildren = splitTextNode(node.value);

    if (nextChildren.length === 1 && nextChildren[0].type === 'text' && nextChildren[0].value === node.value) {
      return undefined;
    }

    parent.children?.splice(index, 1, ...nextChildren);
    return index + nextChildren.length;
  });

  visit(tree, 'link', (node: MdastNode, _index: number | undefined, parent: MdastNode | undefined) => {
    if (parent?.type === 'paragraph') {
      setAutoEmbed(node);
    }
  });
};

export const formattedLinks = (): ((tree: MdastNode) => void) => transform;

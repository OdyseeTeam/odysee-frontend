import { visit } from 'unist-util-visit';

const RE_TIMESTAMP_GLOBAL = /(?<!\w)(\d{1,2}:\d{2}(?::\d{2})?)(?![\w:])/g;

type MdastNode = {
  type: string;
  value?: string;
  url?: string;
  title?: string;
  children?: MdastNode[];
};

function isValidTimestamp(text: string): boolean {
  switch (text.length) {
    case 4:
      return /^[0-9]:[0-5][0-9]$/.test(text);
    case 5:
      return /^[0-5][0-9]:[0-5][0-9]$/.test(text);
    case 7:
      return /^[0-9]:[0-5][0-9]:[0-5][0-9]$/.test(text);
    case 8:
      return /^[0-9][0-9]:[0-5][0-9]:[0-5][0-9]$/.test(text);
    default:
      return false;
  }
}

function strToSeconds(stime: string) {
  const parts = stime.split(':').slice().reverse();
  return (parts.length >= 3 ? +parts[2] : 0) * 60 * 60 + (parts.length >= 2 ? +parts[1] : 0) * 60 + +parts[0];
}

function createTextNode(value: string): MdastNode {
  return {
    type: 'text',
    value,
  };
}

function createTimestampNode(text: string): MdastNode {
  return {
    type: 'link',
    url: `?t=${strToSeconds(text)}`,
    title: text,
    children: [
      {
        type: 'text',
        value: text,
      },
    ],
  };
}

function splitTextNode(value: string): MdastNode[] {
  const nodes: MdastNode[] = [];
  let lastIndex = 0;

  RE_TIMESTAMP_GLOBAL.lastIndex = 0;
  let match;
  while ((match = RE_TIMESTAMP_GLOBAL.exec(value)) !== null) {
    if (!isValidTimestamp(match[1])) continue;

    if (match.index > lastIndex) {
      nodes.push(createTextNode(value.slice(lastIndex, match.index)));
    }

    nodes.push(createTimestampNode(match[1]));
    lastIndex = match.index + match[1].length;
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

export const inlineTimestamp = () => transform;
export const formattedTimestamp = () => transform;

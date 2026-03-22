import { visit } from 'unist-util-visit';

const TIMESTAMP_NODE_TYPE = 'timestamp';

type MdastNode = {
  type: string;
  value?: string;
  url?: string;
  title?: string;
  children?: MdastNode[];
};

function findNextTimestamp(value: string, fromIndex: number, strictlyFromIndex: boolean) {
  let begin = 0;

  while (begin < value.length) {
    const match = value.substring(begin).match(/[0-9:]+/);

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

    if (fromIndex > 0 && fromIndex >= match.index && fromIndex < match.index + match[0].length) {
      begin = match.index + match[0].length;
      continue;
    }

    const text = match[0].replace(/:+$/, '');
    let isValidTimestamp = false;

    switch (text.length) {
      case 4:
        isValidTimestamp = /^[0-9]:[0-5][0-9]$/.test(text);
        break;

      case 5:
        isValidTimestamp = /^[0-5][0-9]:[0-5][0-9]$/.test(text);
        break;

      case 7:
        isValidTimestamp = /^[0-9]:[0-5][0-9]:[0-5][0-9]$/.test(text);
        break;

      case 8:
        isValidTimestamp = /^[0-9][0-9]:[0-5][0-9]:[0-5][0-9]$/.test(text);
        break;

      default:
        break;
    }

    if (isValidTimestamp) {
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

function strToSeconds(stime: string) {
  const parts = stime.split(':').toReversed();
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
  let index = 0;

  while (index < value.length) {
    const timestamp = findNextTimestamp(value, index, false);

    if (!timestamp) {
      nodes.push(createTextNode(value.slice(index)));
      break;
    }

    if (timestamp.index > index) {
      nodes.push(createTextNode(value.slice(index, timestamp.index)));
    }

    nodes.push(createTimestampNode(timestamp.text));
    index = timestamp.index + timestamp.text.length;
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

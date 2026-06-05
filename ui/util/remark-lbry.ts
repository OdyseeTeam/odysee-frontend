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

const BARE_LINK_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'twitter.com',
  'x.com',
  'facebook.com',
  'fb.com',
  'instagram.com',
  'tiktok.com',
  'reddit.com',
  'twitch.tv',
  'kick.com',
  'rumble.com',
  'bitchute.com',
  'github.com',
  'discord.gg',
  'discord.com',
  't.me',
  'telegram.me',
  'open.spotify.com',
  'spotify.com',
  'soundcloud.com',
  'linkedin.com',
  'medium.com',
  'substack.com',
  'patreon.com',
  'gofundme.com',
  'odysee.com',
];
const bareDomainPattern = BARE_LINK_DOMAINS.map((d) => d.replace(/\./g, '\\.')).join('|');
const bareLinkRegex = new RegExp(
  `(?:^|(?<=\\s))((?:(?:https?://|www\\.)[^\\s<>"']+|(?:https?://)?(?:${bareDomainPattern})(?:/[^\\s<>"']*)?))`,
  'i'
);
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
  if (value.includes('?')) {
    return stripTrailingPunctuation(value);
  }

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

const TRAILING_PAIRS: Array<[string, string]> = [
  ['(', ')'],
  ['[', ']'],
  ['{', '}'],
];
const TRAILING_PUNCTUATION = '.,;:!?';

// Strip trailing punctuation from a bare URL, but keep paired brackets balanced
// so links like https://en.wikipedia.org/wiki/Mark_Levine_(disambiguation) survive.
function stripTrailingPunctuation(url: string): string {
  let end = url.length;
  while (end > 0) {
    const last = url.charAt(end - 1);
    if (TRAILING_PUNCTUATION.includes(last)) {
      end--;
      continue;
    }
    const pair = TRAILING_PAIRS.find(([, close]) => close === last);
    if (pair) {
      const slice = url.slice(0, end);
      let opens = 0;
      let closes = 0;
      for (let i = 0; i < slice.length; i++) {
        if (slice[i] === pair[0]) opens++;
        else if (slice[i] === pair[1]) closes++;
      }
      if (closes > opens) {
        end--;
        continue;
      }
    }
    break;
  }
  return url.slice(0, end);
}

function countCharacter(value: string, character: string): number {
  let count = 0;
  for (let i = 0; i < value.length; i++) {
    if (value[i] === character) count++;
  }
  return count;
}

function getBalancingClosers(url: string, nextText: string): string {
  let closers = '';

  while (closers.length < nextText.length) {
    const nextCharacter = nextText[closers.length];
    const pair = TRAILING_PAIRS.find(([, close]) => close === nextCharacter);

    if (!pair) break;

    const candidateUrl = `${url}${closers}`;
    const opens = countCharacter(candidateUrl, pair[0]);
    const closes = countCharacter(candidateUrl, pair[1]);

    if (opens <= closes) break;

    closers += nextCharacter;
  }

  return closers;
}

function mergeBalancingPunctuation(node: MdastNode, index: number | undefined, parent: MdastNode | undefined) {
  if (typeof index !== 'number' || !parent?.children || !node.url) {
    return;
  }

  const nextNode = parent.children[index + 1];

  if (nextNode?.type !== 'text' || !nextNode.value) {
    return;
  }

  const closers = getBalancingClosers(node.url, nextNode.value);

  if (!closers) {
    return;
  }

  node.url += closers;
  node.children?.forEach((child) => {
    if (child.type === 'text' && child.value === node.url.slice(0, -closers.length)) {
      child.value = node.url || child.value;
    }
  });

  nextNode.value = nextNode.value.slice(closers.length);
  if (!nextNode.value) {
    parent.children.splice(index + 1, 1);
  }
}

function locateBareLink(value: string, fromIndex: number): number {
  const sub = value.slice(fromIndex);
  const match = bareLinkRegex.exec(sub);
  if (!match) return -1;
  const idx = fromIndex + (match.index ?? 0);
  if (idx > 0 && /\S/.test(value.charAt(idx - 1))) return locateBareLink(value, idx + 1);
  return idx;
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
    const nextBare = locateBareLink(value, cursor);
    const candidates = [nextMention, nextUri, nextBare].filter((candidate) => candidate >= 0);

    if (!candidates.length) {
      nodes.push(createTextNode(value.slice(cursor)));
      break;
    }

    const nextIndex = Math.min(...candidates);

    if (nextIndex > cursor) {
      nodes.push(createTextNode(value.slice(cursor, nextIndex)));
    }

    const nextValue = value.slice(nextIndex);
    let rawMatch: string | undefined;
    if (nextIndex === nextBare && nextIndex !== nextUri && nextIndex !== nextMention) {
      rawMatch = nextValue.match(bareLinkRegex)?.[0];
    } else {
      rawMatch = nextIndex === nextUri ? nextValue.match(uriRegex)?.[0] : nextValue.match(mentionRegex)?.[0];
    }

    if (!rawMatch) {
      nodes.push(createTextNode(value.charAt(nextIndex)));
      cursor = nextIndex + 1;
      continue;
    }

    const isBareLink = nextIndex === nextBare && nextIndex !== nextUri && nextIndex !== nextMention;
    if (isBareLink) {
      const cleaned = stripTrailingPunctuation(rawMatch);
      const url = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
      nodes.push({
        type: 'link',
        url,
        children: [{ type: 'text', value: cleaned }],
      });
      cursor = nextIndex + cleaned.length;
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

  visit(tree, 'link', (node: MdastNode, index: number | undefined, parent: MdastNode | undefined) => {
    mergeBalancingPunctuation(node, index, parent);

    if (parent?.type === 'paragraph') {
      setAutoEmbed(node);
    }
  });
};

export const formattedLinks = (): ((tree: MdastNode) => void) => transform;

import { parseURI } from 'util/lbryURI';
import visit from 'unist-util-visit';
import { parseEntities as decode } from 'parse-entities';

interface MdastNode {
  type: string;
  url?: string;
  value?: string;
  data?: { hProperties?: Record<string, unknown> };
  children?: MdastNode[];
}

type EatFunction = {
  (value: string): (node: MdastNode) => MdastNode;
  now: () => { line: number; column: number; offset: number };
};

const protocol = 'lbry://';
const uriRegex = /(lbry:\/\/)[^\s"]*[^)]/g;
export const punctuationMarks = [',', '.', '!', '?', ':', ';', '-', ']', ')', '}'];
const mentionToken = '@';
// const mentionTokenCode = 64; // @
const invalidRegex = /[-_.+=?!@#$%^&*:;,{}<>\w/\\]/;
const mentionRegex = /@[^\s"=?!@$%^&*;,{}<>/\\]*/gm;

function handlePunctuation(value: string): string {
  const protocolIndex = value.indexOf('lbry://') === 0 ? protocol.length - 1 : 0;
  const channelModifierIndex =
    (value.indexOf(':', protocolIndex) >= 0 && value.indexOf(':', protocolIndex)) ||
    (value.indexOf('#', protocolIndex) >= 0 && value.indexOf('#', protocolIndex));
  const claimModifierIndex =
    (value.indexOf(':', channelModifierIndex + 1) >= 0 && value.indexOf(':', channelModifierIndex + 1)) ||
    (value.indexOf('#', channelModifierIndex + 1) >= 0 && value.indexOf('#', channelModifierIndex + 1)) ||
    channelModifierIndex;
  let punctuationIndex;
  punctuationMarks.some((p) => {
    if (claimModifierIndex) {
      punctuationIndex = value.indexOf(p, claimModifierIndex + 1) >= 0 && value.indexOf(p, claimModifierIndex + 1);
    }

    return punctuationIndex;
  });
  return punctuationIndex ? value.substring(0, punctuationIndex) : value;
}

// Find channel mention
function locateMention(value: string, fromIndex: number): number {
  const index = value.indexOf(mentionToken, fromIndex);

  // Skip invalid mention
  if (index > 0 && invalidRegex.test(value.charAt(index - 1))) {
    return locateMention(value, index + 1);
  }

  return index;
}

// Find claim url
function locateURI(value: string, fromIndex: number): number {
  var index = value.indexOf(protocol, fromIndex);

  // Skip invalid uri
  if (index > 0 && invalidRegex.test(value.charAt(index - 1))) {
    return locateMention(value, index + 1);
  }

  return index;
}

// Generate a valid markdown link
const createURI = (text: string, uri: string, embed: boolean = false): MdastNode => ({
  type: 'link',
  url: (uri.startsWith(protocol) ? '' : protocol) + uri,
  data: {
    // Custom attribute
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

const validateURI = (match: RegExpMatchArray | null, eat: EatFunction): MdastNode | undefined => {
  if (match) {
    try {
      const text = match[0];
      const newText = handlePunctuation(text);
      const uri = parseURI(newText);
      const isValid = uri && uri.claimName;
      const isChannel = uri.isChannel && uri.path === uri.claimName;

      if (isValid) {
        // Create channel link
        if (isChannel) {
          return eat(newText)(createURI(uri.claimName, newText, false));
        }

        // Create claim link
        return eat(newText)(createURI(newText, newText, true));
      }
    } catch (err) {
      // Silent errors: console.error(err)
    }
  }
};

// Generate a markdown link from channel name
function tokenizeMention(eat: EatFunction, value: string, silent: boolean): true | MdastNode | undefined {
  if (silent) {
    return true;
  }

  const match = value.match(mentionRegex);
  return validateURI(match, eat, self);
}

// Generate a markdown link from lbry url
function tokenizeURI(eat: EatFunction, value: string, silent: boolean): true | MdastNode | undefined {
  if (silent) {
    return true;
  }

  const match = value.match(uriRegex);
  return validateURI(match, eat);
}

// Configure tokenizer for lbry urls
tokenizeURI.locator = locateURI;
tokenizeURI.notInList = false;
tokenizeURI.notInLink = true;
tokenizeURI.notInBlock = false;
// Configure tokenizer for lbry channels
tokenizeMention.locator = locateMention;
tokenizeMention.notInList = false;
tokenizeMention.notInLink = true;
tokenizeMention.notInBlock = false;

const visitor = (node: MdastNode, index: number, parent: MdastNode): void => {
  if (node.type === 'link' && parent && parent.type === 'paragraph') {
    try {
      const uri = parseURI(node.url);
      const isValid = uri && uri.claimName;
      const isChannel = uri.isChannel && uri.path === uri.claimName;

      if (isValid && !isChannel) {
        if (!node.data || !node.data.hProperties) {
          // Create new node data
          node.data = {
            hProperties: {
              embed: true,
            },
          };
        } else if (node.data.hProperties) {
          // Don't overwrite current attributes
          node.data.hProperties = {
            embed: true,
            ...node.data.hProperties,
          };
        }
      }
    } catch (err) {
      // Silent errors: console.error(err)
    }
  }
};

// transform
const transform = (tree: MdastNode): void => {
  visit(tree, ['link'], visitor);
};

export const formattedLinks = (): ((tree: MdastNode) => void) => transform;
const URL_PROTOCOLS = ['http://', 'https://', 'mailto:'];
const RE_WHITESPACE = /\s/;
const TRAILING_PUNCTUATION = '.,:;"\'';

// Fix for remark-parse's url tokenizer incorrectly terminating at ')' before
// its paren-balancing logic runs, clipping URLs like Wikipedia disambiguation links.
function tokenizeUrl(
  this: {
    options: { gfm: boolean };
    enterLink: () => () => void;
    tokenizeInline: (value: string, position: { line: number; column: number; offset: number }) => MdastNode[];
  },
  eat: EatFunction,
  value: string,
  silent: boolean
): true | MdastNode | undefined {
  if (!this.options.gfm) return;
  let subvalue = '';
  let matchedProtocol;

  for (const p of URL_PROTOCOLS) {
    if (value.slice(0, p.length).toLowerCase() === p) {
      subvalue = value.slice(0, p.length);
      matchedProtocol = p;
      break;
    }
  }

  if (!subvalue) return;
  let index = subvalue.length;
  const length = value.length;
  let queue = '';
  let parenCount = 0;
  let bracketCount = 0;

  while (index < length) {
    const character = value.charAt(index);
    if (RE_WHITESPACE.test(character) || character === '<') break;

    if (character === ')') {
      if (parenCount > 0) {
        parenCount--;
        queue += character;
        index++;
        continue;
      }

      break;
    }

    if (character === ']') {
      if (bracketCount > 0) {
        bracketCount--;
        queue += character;
        index++;
        continue;
      }

      break;
    }

    if (TRAILING_PUNCTUATION.includes(character)) {
      const next = value.charAt(index + 1);
      if (!next || RE_WHITESPACE.test(next)) break;
    }

    if (character === '(') parenCount++;
    if (character === '[') bracketCount++;
    queue += character;
    index++;
  }

  if (!queue) return;
  subvalue += queue;

  if (matchedProtocol === 'mailto:') {
    const atPos = queue.indexOf('@');
    if (atPos <= 0 || atPos === queue.length - 1) return;
  }

  if (silent) return true;
  const exit = this.enterLink();
  const content = this.tokenizeInline(subvalue, eat.now());
  exit();
  return eat(subvalue)({
    type: 'link',
    title: null,
    url: decode(subvalue, {
      nonTerminated: false,
    }),
    children: content,
  });
}

tokenizeUrl.locator = function locateUrl(
  this: { options: { gfm: boolean } },
  value: string,
  fromIndex: number
): number {
  if (!this.options.gfm) return -1;
  let min = -1;

  for (const p of URL_PROTOCOLS) {
    const pos = value.indexOf(p, fromIndex);
    if (pos !== -1 && (pos < min || min === -1)) min = pos;
  }

  return min;
};

tokenizeUrl.notInLink = true;
// Main module
export function inlineLinks(this: {
  Parser: { prototype: { inlineTokenizers: Record<string, Function>; inlineMethods: string[] } };
}): void {
  // oxlint-disable-next-line no-this-in-exported-function
  const Parser = this.Parser;
  const tokenizers = Parser.prototype.inlineTokenizers;
  const methods = Parser.prototype.inlineMethods;
  tokenizers.url = tokenizeUrl; // replaces built-in to fix paren handling

  tokenizers.uri = tokenizeURI;
  tokenizers.mention = tokenizeMention;
  // Run it just before `text`.
  methods.splice(methods.indexOf('text'), 0, 'uri');
  methods.splice(methods.indexOf('text'), 0, 'mention');
}

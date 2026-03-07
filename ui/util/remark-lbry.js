import { parseURI } from 'util/lbryURI';
import visit from 'unist-util-visit';
import locate from 'remark-parse/lib/locate/url';
import decode from 'parse-entities';

const protocol = 'lbry://';
const uriRegex = /(lbry:\/\/)[^\s"]*[^)]/g;
export const punctuationMarks = [',', '.', '!', '?', ':', ';', '-', ']', ')', '}'];

const mentionToken = '@';
// const mentionTokenCode = 64; // @

const invalidRegex = /[-_.+=?!@#$%^&*:;,{}<>\w/\\]/;
const mentionRegex = /@[^\s"=?!@$%^&*;,{}<>/\\]*/gm;

function handlePunctuation(value) {
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
function locateMention(value, fromIndex) {
  const index = value.indexOf(mentionToken, fromIndex);

  // Skip invalid mention
  if (index > 0 && invalidRegex.test(value.charAt(index - 1))) {
    return locateMention(value, index + 1);
  }

  return index;
}

// Find claim url
function locateURI(value, fromIndex) {
  var index = value.indexOf(protocol, fromIndex);

  // Skip invalid uri
  if (index > 0 && invalidRegex.test(value.charAt(index - 1))) {
    return locateMention(value, index + 1);
  }

  return index;
}

// Generate a valid markdown link
const createURI = (text, uri, embed = false) => ({
  type: 'link',
  url: (uri.startsWith(protocol) ? '' : protocol) + uri,
  data: {
    // Custom attribute
    hProperties: { embed },
  },
  children: [{ type: 'text', value: text }],
});

const validateURI = (match, eat) => {
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
function tokenizeMention(eat, value, silent) {
  if (silent) {
    return true;
  }

  const match = value.match(mentionRegex);

  return validateURI(match, eat, self);
}

// Generate a markdown link from lbry url
function tokenizeURI(eat, value, silent) {
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

const visitor = (node, index, parent) => {
  if (node.type === 'link' && parent && parent.type === 'paragraph') {
    try {
      const uri = parseURI(node.url);
      const isValid = uri && uri.claimName;
      const isChannel = uri.isChannel && uri.path === uri.claimName;
      if (isValid && !isChannel) {
        if (!node.data || !node.data.hProperties) {
          // Create new node data
          node.data = {
            hProperties: { embed: true },
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
const transform = (tree) => {
  visit(tree, ['link'], visitor);
};

export const formattedLinks = () => transform;

const URL_PROTOCOLS = ['http://', 'https://', 'mailto:'];
const RE_WHITESPACE = /\s/;
const TRAILING_PUNCTUATION = '.,:;"\'';

// Fix for remark-parse's url tokenizer incorrectly terminating at ')' before
// its paren-balancing logic runs, clipping URLs like Wikipedia disambiguation links.
function tokenizeUrl(eat, value, silent) {
  const self = this;
  if (!self.options.gfm) return;

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

  while (index < length) {
    const character = value.charAt(index);

    if (RE_WHITESPACE.test(character) || character === '<') break;

    if (character === ')' || character === ']') {
      if (parenCount > 0) {
        parenCount--;
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

    if (character === '(' || character === '[') parenCount++;

    queue += character;
    index++;
  }

  if (!queue) return;

  subvalue += queue;

  if (matchedProtocol === 'mailto:') {
    const atPos = queue.indexOf('@');
    if (atPos === -1 || atPos === queue.length - 1) return;
  }

  if (silent) return true;

  const exit = self.enterLink();
  const content = self.tokenizeInline(subvalue, eat.now());
  exit();

  return eat(subvalue)({
    type: 'link',
    title: null,
    url: decode(subvalue, { nonTerminated: false }),
    children: content,
  });
}

tokenizeUrl.locator = locate;
tokenizeUrl.notInLink = true;

// Main module
export function inlineLinks() {
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

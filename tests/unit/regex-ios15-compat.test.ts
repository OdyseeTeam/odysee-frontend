import { beforeAll, describe, expect, it } from 'vite-plus/test';

let inlineTimestamp: any;

type Node = { type: string; value?: string; url?: string; children?: Node[] };

const paragraph = (text: string) => ({
  type: 'root',
  children: [{ type: 'paragraph', children: [{ type: 'text', value: text }] }],
});

const run = (text: string): Node[] => {
  const tree: any = paragraph(text);
  inlineTimestamp()(tree);
  return tree.children[0].children;
};

beforeAll(async () => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { i18n_messages: {}, navigator: { language: 'en' } },
  });

  const mod = await import('../../ui/util/remark-timestamp');
  inlineTimestamp = mod.inlineTimestamp;
});

// Safari only gained regex lookbehind in 16.4. A literal that uses it is a parse
// error, not a catchable one, so it takes down the whole chunk -- which is how
// iOS 15 ended up with a blank page. These regexes were rewritten to capture the
// leading boundary instead, and the offset arithmetic that came with that is
// what the cases below pin down.
describe('timestamp linking without lookbehind', () => {
  it('links a bare timestamp and keeps the text around it', () => {
    const out = run('see 1:23 for the bit');
    expect(out.map((n) => n.type)).toEqual(['text', 'link', 'text']);
    expect(out[0].value).toBe('see ');
    expect(out[1].children?.[0].value).toBe('1:23');
    expect(out[1].url).toBe('?t=83');
    expect(out[2].value).toBe(' for the bit');
  });

  it('links a timestamp at the very start', () => {
    const out = run('1:23 opening');
    expect(out[0].type).toBe('link');
    expect(out[0].children?.[0].value).toBe('1:23');
  });

  it('links hours:minutes:seconds', () => {
    const out = run('at 1:02:03 there');
    const link = out.find((n) => n.type === 'link');
    expect(link?.children?.[0].value).toBe('1:02:03');
    expect(link?.url).toBe('?t=3723');
  });

  it('links two timestamps separated by a single character', () => {
    const out = run('1:23,4:56');
    const links = out.filter((n) => n.type === 'link');
    expect(links.map((n) => n.children?.[0].value)).toEqual(['1:23', '4:56']);
    // The separator survives rather than being swallowed into a match.
    expect(out.map((n) => n.value ?? '').join('')).toContain(',');
  });

  it('leaves a timestamp glued to a word alone', () => {
    const out = run('v1:23');
    expect(out.map((n) => n.type)).toEqual(['text']);
    expect(out[0].value).toBe('v1:23');
  });

  it('leaves something already looking like a longer time alone', () => {
    const out = run('1:23:45:67');
    expect(out.every((n) => n.type === 'text')).toBe(true);
  });

  it('rejects out-of-range minutes', () => {
    const out = run('at 1:99 nope');
    expect(out.every((n) => n.type === 'text')).toBe(true);
  });

  it('preserves the original text when nothing matches', () => {
    const out = run('no timestamps here');
    expect(out).toHaveLength(1);
    expect(out[0].value).toBe('no timestamps here');
  });
});

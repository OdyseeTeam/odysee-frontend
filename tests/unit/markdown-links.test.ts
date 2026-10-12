import { beforeAll, describe, expect, it } from 'vite-plus/test';
import defaultSchema from 'hast-util-sanitize/lib/github.json';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

let formattedLinks: any;
let isEmbedOptIn: any;
let isEmbedOptOut: any;
let normalizeHttpUrlProtocol: any;

beforeAll(async () => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { i18n_messages: {}, navigator: { language: 'en' } },
  });

  const links = await import('../../ui/util/remark-lbry');
  formattedLinks = links.formattedLinks;
  isEmbedOptIn = links.isEmbedOptIn;
  isEmbedOptOut = links.isEmbedOptOut;
  normalizeHttpUrlProtocol = links.normalizeHttpUrlProtocol;
});

describe('markdown links', () => {
  it('normalizes mixed-case HTTP protocols for sanitization', () => {
    expect(normalizeHttpUrlProtocol('Https://www.c60evo.com/YAFTV')).toBe('https://www.c60evo.com/YAFTV');
    expect(normalizeHttpUrlProtocol('HTTP://example.com/path')).toBe('http://example.com/path');
  });

  it('normalizes the target of a mixed-case bare link', () => {
    const tree: any = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'Visit Https://www.c60evo.com/YAFTV today' }],
        },
      ],
    };

    formattedLinks()(tree);

    const link = tree.children[0].children.find((node) => node.type === 'link');
    expect(link.url).toBe('https://www.c60evo.com/YAFTV');
    expect(link.children[0].value).toBe('Https://www.c60evo.com/YAFTV');
  });

  it('normalizes the target of an explicit link, a reference definition and an image', () => {
    const tree: any = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'link', url: 'Https://www.c60evo.com/YAFTV', children: [{ type: 'text', value: 'LINK' }] },
            { type: 'image', url: 'HTTPS://example.com/a.png', children: [] },
          ],
        },
        { type: 'definition', identifier: 'r', url: 'Https://example.com/ref' },
      ],
    };

    formattedLinks()(tree);

    expect(tree.children[0].children[0].url).toBe('https://www.c60evo.com/YAFTV');
    expect(tree.children[0].children[1].url).toBe('https://example.com/a.png');
    expect(tree.children[1].url).toBe('https://example.com/ref');
  });

  it('leaves a relative claim link untouched', () => {
    const tree: any = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'link', url: 'lbry://@Channel:9/Https-Guide:4', children: [{ type: 'text', value: 'x' }] },
          ],
        },
      ],
    };

    formattedLinks()(tree);

    expect(tree.children[0].children[0].url).toBe('lbry://@Channel:9/Https-Guide:4');
  });

  it('treats a sanitizer-removed href as having no embed options', () => {
    expect(isEmbedOptIn(undefined)).toBe(false);
    expect(isEmbedOptOut(undefined)).toBe(false);
  });
});

// Guards the whole path that produced the "can't access property indexOf, e is
// undefined" crash: hast-util-sanitize matches protocols case-sensitively, so
// before the fix a `Https://` link reached the renderer with no href at all.
describe('markdown link sanitization', () => {
  const schema: any = {
    ...defaultSchema,
    protocols: {
      ...(defaultSchema as any).protocols,
      href: Array.from(new Set([...((defaultSchema as any).protocols?.href || []), 'lbry'])),
    },
  };

  function renderedHrefs(markdown: string): Array<string | undefined> {
    const processor = unified().use(remarkParse).use(remarkGfm).use(formattedLinks).use(remarkRehype);
    const tree = unified()
      .use(rehypeSanitize, schema)
      .runSync(processor.runSync(processor.parse(markdown)) as any);

    const hrefs: Array<string | undefined> = [];
    visit(tree as any, 'element', (node: any) => {
      if (node.tagName === 'a') hrefs.push(node.properties?.href);
    });
    return hrefs;
  }

  it('keeps the href of a mixed-case bare link', () => {
    expect(renderedHrefs('LINK: Https://www.c60evo.com/YAFTV')).toEqual(['https://www.c60evo.com/YAFTV']);
  });

  it('keeps the href of a mixed-case explicit link', () => {
    expect(renderedHrefs('[c60](Https://www.c60evo.com/YAFTV)')).toEqual(['https://www.c60evo.com/YAFTV']);
  });

  it('keeps the href of a mixed-case reference link', () => {
    expect(renderedHrefs('[c60][r]\n\n[r]: Https://www.c60evo.com/YAFTV')).toEqual(['https://www.c60evo.com/YAFTV']);
  });

  it('keeps lowercase links working', () => {
    expect(renderedHrefs('[c60](https://www.c60evo.com/YAFTV)')).toEqual(['https://www.c60evo.com/YAFTV']);
  });
});

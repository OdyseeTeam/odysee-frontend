import { CHANNEL_STAKED_LEVEL_VIDEO_COMMENTS, MISSING_THUMB_DEFAULT } from 'config';
import { platform } from 'util/platform';
import { formattedEmote } from 'util/remark-emote';
import { formattedLinks } from 'util/remark-lbry';
import { formattedTimestamp } from 'util/remark-timestamp';
import { getThumbnailCdnUrl } from 'util/thumbnail';
import * as ICONS from 'constants/icons';
import * as React from 'react';
import Button from 'component/button';
import classnames from 'classnames';
import defaultSchema from 'hast-util-sanitize/lib/github.json';
import MarkdownLink from 'component/markdownLink';
import OptimizedImage from 'component/optimizedImage';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { remark } from 'remark';
import remarkBreaks from 'remark-breaks';
import remarkEmoji from 'remark-emoji';
import remarkFrontMatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkStrip from 'strip-markdown';
import ZoomableImage from 'component/zoomableImage';
// import { TWEMOTEARRAY } from 'constants/emotes';
// const visit = require('unist-util-visit');
const RE_EMOTE = /:\+1:|:-1:|:[\w-]+:/;

function isEmote(title, src) {
  return (
    title &&
    RE_EMOTE.test(title) &&
    (src.includes('static.odycdn.com/emoticons') || src.includes('/public/img/emoticons'))
  );
}

function isStakeEnoughForPreview(stakedLevel) {
  return !stakedLevel || stakedLevel >= CHANNEL_STAKED_LEVEL_VIDEO_COMMENTS;
}

type SimpleTextProps = {
  children?: React.ReactNode;
};
type SimpleLinkProps = {
  href?: string;
  title?: string;
  embed?: boolean;
  children?: React.ReactNode;
};
type ImageLinkProps = {
  src: string;
  title?: string;
  alt?: string;
  helpText?: string;
};
type MarkdownProps = {
  strip?: boolean;
  content: string | null | undefined;
  simpleLinks?: boolean;
  noDataStore?: boolean;
  className?: string;
  parentCommentId?: string;
  isMarkdownPost?: boolean;
  disableTimestamps?: boolean;
  stakedLevel?: number;
  setUserMention?: (arg0: boolean) => void;
  hasMembership?: boolean;
  isComment?: boolean;
  isMinimal?: boolean;
};

// ****************************************************************************
// ****************************************************************************
const SimpleText = (props: SimpleTextProps) => {
  return <span>{props.children}</span>;
};

/*
const remarkTwemoji = (tree) => {
  const RE_TWEMOJI = new RegExp(
    '(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])'
  );

  function transformer(tree) {
    visit(tree, 'text', (node) => {
      if (RE_TWEMOJI.test(node.value)) {
        let code = node.value.match(RE_TWEMOJI)[0];
        // @ts-ignore
        const emote = TWEMOTEARRAY.find(({ unicode }) => code === unicode);

        if (emote) {
          node.type = 'image';
          node.url = emote.url;
          node.title = emote.name;
          node.children = [{ type: 'text', value: emote.name }];
          if (!node.data || !node.data.hProperties) {
            // Create new node data
            node.data = {
              hProperties: { emote: true },
            };
          } else if (node.data.hProperties) {
            // Don't overwrite current attributes
            node.data.hProperties = {
              emote: true,
              ...node.data.hProperties,
            };
          }
        }
      }
    });
  }

  return transformer;
};
*/
// ****************************************************************************
// ****************************************************************************
const SimpleLink = (props: SimpleLinkProps) => {
  const { title, children, href, embed } = props;

  if (!href) {
    return children || null;
  }

  if (!href.startsWith('lbry:/')) {
    return (
      <a href={href} title={title} target={'_blank'} rel={'noreferrer noopener'}>
        {children}
      </a>
    );
  }

  const [uri, search] = href.split('?');
  const urlParams = new URLSearchParams(search);
  const embedParam = urlParams.get('embed');

  if (embed || embedParam) {
    // Decode this since users might just copy it from the url bar
    const decodedUri = decodeURI(uri);
    return (
      <div className="embed__inline-button embed__inline-button--preview">
        <pre>{decodedUri}</pre>
      </div>
    );
  }

  // Dummy link (no 'href')
  return <a title={title}>{children}</a>;
};

// ****************************************************************************
// ****************************************************************************
const SimpleImageLink = (props: ImageLinkProps) => {
  const { src, title, alt, helpText } = props;

  if (!src) {
    return null;
  }

  if (isEmote(title, src)) {
    return <OptimizedImage src={src} title={title} className="emote" waitLoad loading="lazy" />;
  }

  return (
    <Button
      button="link"
      iconRight={ICONS.EXTERNAL}
      label={title || alt || src}
      title={helpText || title || alt || src}
      className="button--external-link"
      href={src}
    />
  );
};

// ****************************************************************************
// ****************************************************************************
// Use github sanitation schema
const schema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    href: Array.from(new Set([...(defaultSchema.protocols?.href || []), 'lbry'])),
  },
  attributes: {
    ...defaultSchema.attributes,
    a: Array.from(new Set([...(defaultSchema.attributes?.a || []), 'embed'])),
  },
};
const REPLACE_REGEX = /(?:<iframe\s+src=["'])(.*?(?=))(?:["']\s*><\/iframe>)/g; // ****************************************************************************
// ****************************************************************************
const identityUrl = (url) => url;

export default React.memo<MarkdownProps>(function MarkdownPreview(props: MarkdownProps) {
  const {
    // content,
    strip,
    simpleLinks,
    noDataStore,
    className,
    parentCommentId,
    isMarkdownPost,
    disableTimestamps,
    stakedLevel,
    setUserMention,
    hasMembership,
    isComment,
    isMinimal,
  } = props;
  const { content } = props;

  if (typeof content === 'object') {
    // Due to an unfortunate typo that corrupted the collection field, we need
    // to do this so affected users don't keep crashing.
    return '';
  }

  const strippedContent = content
    ? content.replace(REPLACE_REGEX, (iframeHtml, iframeUrl) => {
        if (platform.isSafari()) {
          return iframeUrl;
        }

        // Let the browser try to create an iframe to see if the markup is valid
        const outer = document.createElement('div');
        outer.innerHTML = iframeHtml;
        const iframe = outer.querySelector('iframe') as any as HTMLIFrameElement | null | undefined;

        if (iframe) {
          const src = iframe.src;

          if (src && src.startsWith('lbry://')) {
            return src;
          }
        }

        return iframeHtml;
      })
    : '';
  // Comments use a lighter plugin chain to avoid CPU hangs on pages with many comments.
  // The full pipeline (remarkGfm, formattedTimestamp, remarkFrontMatter) is expensive
  // and can lock up pages with 50+ comments containing URLs/timestamps.
  const isCommentBody = Boolean(parentCommentId);
  const remarkPlugins = isCommentBody
    ? [formattedLinks, formattedEmote, remarkEmoji, remarkBreaks]
    : [
        remarkGfm,
        formattedLinks,
        ...(disableTimestamps || isMarkdownPost ? [] : [formattedTimestamp]),
        formattedEmote,
        remarkEmoji,
        remarkBreaks,
        [remarkFrontMatter, ['yaml']],
      ];

  // Strip all content and just render text
  if (strip) {
    // Use plain text extraction instead of running the full remark pipeline
    // synchronously. The remark strip path (processSync) can hang indefinitely
    // on certain content patterns (many URLs, timestamps, special characters).
    const strippedText = content
      ? content
          .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // remove images
          .replace(/\[[^\]]*\]\([^)]*\)/g, (m) => m.replace(/\[([^\]]*)\]\([^)]*\)/, '$1')) // extract link text
          .replace(/[#*_~`>]/g, '') // remove markdown formatting
          .replace(/\n+/g, ' ') // collapse newlines
          .replace(/\s+/g, ' ')
          .trim()
      : '';

    return (
      <span dir="auto" className="markdown-preview">
        <SimpleText>{strippedText}</SimpleText>
      </span>
    );
  }

  return (
    <div dir="auto" className={classnames('notranslate markdown-preview', className)}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={[[rehypeSanitize, schema]]}
        urlTransform={identityUrl}
        components={{
          a: ({ node, children, href, title }) => {
            const embed = Boolean((node as any)?.properties?.embed);

            if (noDataStore) {
              return (
                <SimpleLink href={href} title={title} embed={embed}>
                  {children}
                </SimpleLink>
              );
            }

            return (
              <MarkdownLink
                href={href}
                title={title}
                embed={embed}
                parentCommentId={parentCommentId}
                simpleLinks={simpleLinks}
                allowPreview={(isStakeEnoughForPreview(stakedLevel) || hasMembership) && !isMinimal}
                setUserMention={setUserMention}
                isComment={isComment}
              >
                {children}
              </MarkdownLink>
            );
          },
          img: ({ src, alt, title }) => {
            const imageCdnUrl =
              getThumbnailCdnUrl({
                thumbnail: src,
                width: 0,
                height: 0,
                quality: 85,
              }) || MISSING_THUMB_DEFAULT;

            if (noDataStore) {
              return (
                <div className="file-viewer file-viewer--document">
                  <img alt={alt} title={title} src={imageCdnUrl} />
                </div>
              );
            }

            if ((isStakeEnoughForPreview(stakedLevel) || hasMembership) && !isEmote(title, src)) {
              return <ZoomableImage alt={alt} title={title} src={imageCdnUrl} />;
            }

            return (
              <SimpleImageLink
                src={imageCdnUrl}
                alt={alt}
                title={title}
                helpText={__('Odysee Premium required to enable image previews')}
              />
            );
          },
        }}
      >
        {strippedContent}
      </ReactMarkdown>
    </div>
  );
});

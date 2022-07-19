// @flow
import { KNOWN_APP_DOMAINS } from 'config';
import * as ICONS from 'constants/icons';
import * as React from 'react';
import { isURIValid } from 'util/lbryURI';
import Button from 'component/button';
import CommentMenuList from 'component/commentMenuList';
import ChannelTitle from 'component/channelTitle';

import ClaimLink from 'component/claimLink';
import { Menu, MenuButton } from '@reach/menu-button';
import { useIsMobile } from 'effects/use-screensize';

type Props = {
  href: string,
  title?: string,
  embed?: boolean,
  allowPreview?: boolean,
  children: React.Node,
  parentCommentId?: string,
  isMarkdownPost?: boolean,
  simpleLinks?: boolean,
  // myChannelUrls: ?Array<string>,
  activeChannelClaim: any,
  setUserMention?: (boolean) => void,
  isComment?: boolean,
};

function MarkdownLink(props: Props) {
  const {
    children,
    href,
    title,
    embed = false,
    allowPreview = false,
    parentCommentId,
    isMarkdownPost,
    simpleLinks = false,
    // myChannelUrls,
    setUserMention,
    isComment,
    activeChannelClaim,
  } = props;

  const isMobile = useIsMobile();

  let decodedUri;
  try {
    decodedUri = decodeURI(href);
  } catch (e) {}

  let element = <span>{children}</span>;

  // Regex for url protocol
  const protocolRegex = new RegExp('^(https?|lbry|mailto)+:', 'i');
  const protocol = href ? protocolRegex.exec(href) : null;
  const isMention = href && href.startsWith('lbry://@');
  // const mentionedMyChannel = isMention && (myChannelUrls ? myChannelUrls.some((url) => url.replace('#', ':') === href) : false);
  const mentionedMyChannel =
    isMention && activeChannelClaim && activeChannelClaim.canonical_url.replace('#', ':') === href;

  React.useEffect(() => {
    if (mentionedMyChannel && setUserMention) setUserMention(true);
  }, [mentionedMyChannel, setUserMention]);

  if (!href || !decodedUri) return children || null;

  let linkUrlObject;
  try {
    linkUrlObject = new URL(decodedUri);
  } catch (e) {}

  let lbryUrlFromLink;
  if (linkUrlObject && !href.startsWith('mailto:')) {
    const linkDomain = linkUrlObject.host;
    const isKnownAppDomainLink = KNOWN_APP_DOMAINS.includes(linkDomain);
    if (isKnownAppDomainLink) {
      let linkPathname;
      try {
        // This could be anything
        linkPathname = decodeURIComponent(
          linkUrlObject.pathname.startsWith('//') ? linkUrlObject.pathname.slice(2) : linkUrlObject.pathname.slice(1)
        );
      } catch (e) {}

      const linkPathPlusHash = linkPathname ? `${linkPathname}${linkUrlObject.hash}` : undefined;
      const possibleLbryUrl = linkPathPlusHash ? `lbry://${linkPathPlusHash.replace(/:/g, '#')}` : undefined;

      const lbryLinkIsValid = possibleLbryUrl && isURIValid(possibleLbryUrl);
      const isMarkdownLinkWithLabel =
        children && Array.isArray(children) && React.Children.count(children) === 1 && children.toString() !== href;

      if (lbryLinkIsValid && !isMarkdownLinkWithLabel) {
        lbryUrlFromLink = possibleLbryUrl;
      }
    }
  }

  // Return timestamp link if it starts with '?t=' (only possible from remark-timestamp).
  // Return plain text if no valid url.
  // Return external link if protocol is http or https.
  // Return local link if protocol is lbry uri.
  if (href.startsWith('?t=')) {
    // Video timestamp markers
    element = (
      <Button
        button="link"
        iconRight={undefined}
        title={title || decodedUri}
        label={children}
        className="button--external-link"
        onClick={() => {
          if (window.player) {
            window.player.currentTime(parseInt(href.substr(3)));
            window.scrollTo(0, 0);
          }
        }}
      />
    );
  } else if (!simpleLinks && ((protocol && protocol[0] === 'lbry:' && isURIValid(decodedUri)) || lbryUrlFromLink)) {
    if (isComment && setUserMention) {
      element = (
        <Menu>
          <MenuButton className="menu__button" onClick={(e) => e.stopPropagation()}>
            <ChannelTitle uri={decodedUri} fallback={children} isComment />
          </MenuButton>

          <CommentMenuList
            uri={lbryUrlFromLink || decodedUri}
            // commentId={commentId}
            authorUri={lbryUrlFromLink || decodedUri}
            // authorName={comment && comment.channel_name}
            // commentIsMine={commentIsMine}
            // isPinned={isPinned}
            // isTopLevel
            // disableEdit
            // disableRemove={comment.removed}
            isLiveComment
            // handleDismissPin={handleDismissPin}
            // setQuickReply={handleCommentClick}
          />
        </Menu>
      );
    } else {
      element = (
        <ClaimLink
          uri={lbryUrlFromLink || decodedUri}
          autoEmbed={embed}
          parentCommentId={parentCommentId}
          isMarkdownPost={isMarkdownPost}
          allowPreview={allowPreview}
        >
          {children}
        </ClaimLink>
      );
    }
  } else if (
    simpleLinks ||
    (protocol && (protocol[0] === 'http:' || protocol[0] === 'https:' || protocol[0] === 'mailto:'))
  ) {
    const isLbryLink = href.startsWith('lbry://');
    element = (
      <Button
        button="link"
        iconRight={isLbryLink ? undefined : ICONS.EXTERNAL}
        iconSize={isMobile && 12}
        title={title || decodedUri}
        label={children}
        className="button--external-link"
        navigate={isLbryLink ? href : undefined}
        href={isLbryLink ? undefined : href}
      />
    );
  }

  return <>{element}</>;
}

export default MarkdownLink;

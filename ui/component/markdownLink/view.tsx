import { KNOWN_APP_DOMAINS } from 'config';
import * as ICONS from 'constants/icons';
import * as React from 'react';
import { isURIValid } from 'util/lbryURI';
import { isEmbedOptIn, isEmbedOptOut } from 'util/remark-lbry';
import Button from 'component/button';
import CommentMenuList from 'component/commentMenuList';
import ChannelTitle from 'component/channelTitle';
import ClaimLink from 'component/claimLink';
import { Menu, MenuButton } from 'component/common/menu';
import { useIsMobile } from 'effects/use-screensize';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { doResolveClaimId as doResolveClaimIdAction } from 'redux/actions/claims';
import { doFetchThumbnailClaimsForCollectionIds as doFetchThumbnailClaimsForCollectionIdsAction } from 'redux/actions/collections';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectClaimForClaimId } from 'redux/selectors/claims';
type Props = {
  href: string;
  title?: string;
  embed?: boolean;
  allowPreview?: boolean;
  children: React.ReactNode;
  parentCommentId?: string;
  simpleLinks?: boolean;
  setUserMention?: (arg0: boolean) => void;
  isComment?: boolean;
};

function isMe(claim, title) {
  return claim && title && claim.replace('#', ':') === title;
}

function getLbryUrlFromKnownAppLink(linkPathPlusHash: string, search: string = ''): string | undefined {
  const candidate = `lbry://${linkPathPlusHash}${search}`;

  if (isURIValid(candidate)) {
    return candidate;
  }

  const legacyCandidate = `lbry://${linkPathPlusHash.replace(/:/g, '#')}${search}`;

  if (legacyCandidate !== candidate && isURIValid(legacyCandidate)) {
    return legacyCandidate;
  }
}

type PlaylistLinkProps = {
  claimId: string;
  children: React.ReactNode;
  parentCommentId?: string;
  allowPreview: boolean;
};

function PlaylistLink(props: PlaylistLinkProps) {
  const { claimId, children, parentCommentId, allowPreview } = props;
  const dispatch = useAppDispatch();
  const claim = useAppSelector((state) => selectClaimForClaimId(state, claimId));
  const claimUri = claim && (claim.canonical_url || claim.permanent_url);

  React.useEffect(() => {
    if (claim === undefined) {
      dispatch(doResolveClaimIdAction(claimId));
    }
  }, [claim, claimId, dispatch]);

  React.useEffect(() => {
    if (claim?.value_type === 'collection') {
      dispatch(doFetchThumbnailClaimsForCollectionIdsAction({ collectionIds: [claimId], pageSize: 3 }));
    }
  }, [claim?.value_type, claimId, dispatch]);

  if (!claimUri || claim?.value_type !== 'collection') {
    return <span>{children}</span>;
  }

  return (
    <ClaimLink uri={claimUri} parentCommentId={parentCommentId} allowPreview={allowPreview}>
      {children}
    </ClaimLink>
  );
}

function MarkdownLink(props: Props) {
  const {
    children,
    href,
    title,
    embed = false,
    allowPreview = false,
    parentCommentId,
    simpleLinks = false,
    setUserMention,
    isComment,
  } = props;
  const activeChannelClaim = useAppSelector(selectActiveChannelClaim);
  const isMobile = useIsMobile();
  let decodedUri;

  try {
    decodedUri = decodeURI(href);
  } catch (e) {}

  const isChannel = decodedUri && decodedUri.replace('#', ':').substring(decodedUri.indexOf('@')).indexOf('/') === -1;
  let element = <span>{children}</span>;
  // Regex for url protocol
  const protocolRegex = new RegExp('^(https?|lbry|mailto)+:', 'i');
  const protocol = href ? protocolRegex.exec(href) : null;
  const embedOptOut = isEmbedOptOut(href, title);
  const embedOptIn = isEmbedOptIn(href, title);
  const isMention = href && href.startsWith('lbry://@');
  const mentionedMyChannel =
    isMention &&
    activeChannelClaim &&
    activeChannelClaim.canonical_url &&
    activeChannelClaim.canonical_url.replace('#', ':') === href;
  React.useEffect(() => {
    if (mentionedMyChannel && setUserMention) setUserMention(true);
  }, [mentionedMyChannel, setUserMention]);
  if (!href || !decodedUri) return children || null;
  let linkUrlObject;

  try {
    linkUrlObject = new URL(decodedUri);
  } catch (e) {}

  let lbryUrlFromLink;
  let playlistClaimIdFromLink;

  if (linkUrlObject && !href.startsWith('mailto:')) {
    const linkDomain = linkUrlObject.hostname;
    const normalizedLinkDomain = linkDomain.replace(/^www\./, '');
    const isKnownAppDomainLink =
      KNOWN_APP_DOMAINS.includes(linkDomain) || KNOWN_APP_DOMAINS.includes(normalizedLinkDomain);

    if (isKnownAppDomainLink) {
      let linkPathname;

      try {
        // This could be anything
        linkPathname = decodeURIComponent(
          linkUrlObject.pathname.startsWith('//') ? linkUrlObject.pathname.slice(2) : linkUrlObject.pathname.slice(1)
        );
      } catch (e) {}

      const linkPathPlusHash = linkPathname ? `${linkPathname}${linkUrlObject.hash}` : undefined;
      const possibleLbryUrl = linkPathPlusHash
        ? getLbryUrlFromKnownAppLink(linkPathPlusHash, linkUrlObject.search)
        : undefined;
      const isMarkdownLinkWithLabel =
        children && Array.isArray(children) && React.Children.count(children) === 1 && children.toString() !== href;
      const shouldAutoEmbedKnownAppLink = !isMarkdownLinkWithLabel && (!isComment || Boolean(parentCommentId));
      const playlistRouteMatch = linkPathname?.match(/^\$\/playlist\/([a-f0-9]{40})\/?$/i);

      if (playlistRouteMatch && !embedOptOut && (embedOptIn || shouldAutoEmbedKnownAppLink)) {
        playlistClaimIdFromLink = playlistRouteMatch[1];
      } else if (possibleLbryUrl && !embedOptOut && (embedOptIn || shouldAutoEmbedKnownAppLink)) {
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
  } else if (!simpleLinks && playlistClaimIdFromLink) {
    const allowKnownAppPreview = Boolean(parentCommentId || isComment);
    element = (
      <PlaylistLink
        claimId={playlistClaimIdFromLink}
        parentCommentId={parentCommentId}
        allowPreview={!embedOptOut && (embed || embedOptIn || allowPreview || allowKnownAppPreview)}
      >
        {children}
      </PlaylistLink>
    );
  } else if (!simpleLinks && ((protocol && protocol[0] === 'lbry:' && isURIValid(decodedUri)) || lbryUrlFromLink)) {
    if (isComment && isChannel && isMention && setUserMention) {
      element = (
        <Menu>
          <MenuButton className="menu__button" onClick={(e) => e.stopPropagation()}>
            <ChannelTitle uri={decodedUri} fallback={children} isComment />
          </MenuButton>

          <CommentMenuList
            uri={lbryUrlFromLink || decodedUri}
            authorUri={lbryUrlFromLink || decodedUri}
            commentIsMine={isMe(activeChannelClaim && activeChannelClaim.short_url, lbryUrlFromLink || decodedUri)}
            isLiveComment
          />
        </Menu>
      );
    } else {
      const allowKnownAppPreview = Boolean((parentCommentId || isComment) && lbryUrlFromLink);
      element = (
        <ClaimLink
          uri={lbryUrlFromLink || decodedUri}
          parentCommentId={parentCommentId}
          allowPreview={!embedOptOut && (embed || embedOptIn || allowPreview || allowKnownAppPreview)}
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
    const isMailto = href.startsWith('mailto:');
    const faviconUrl = !isLbryLink && !isMailto && linkUrlObject ? `/$/favicon?d=${linkUrlObject.host}` : null;
    element = (
      <span className="button--external-link-wrap">
        {faviconUrl && (
          <span
            ref={(el) => {
              if (!el || el.dataset.init) return;
              el.dataset.init = '1';
              const img = new Image();
              img.addEventListener(
                'load',
                () => {
                  el.style.backgroundImage = `url(${faviconUrl})`;
                },
                { once: true }
              );
              img.addEventListener(
                'error',
                () => {
                  el.style.display = 'none';
                },
                { once: true }
              );
              img.src = faviconUrl;
            }}
            className="markdown-link-favicon"
          />
        )}
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
      </span>
    );
  }

  return <>{element}</>;
}

export default MarkdownLink;

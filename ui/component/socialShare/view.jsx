// @flow
import type { Node } from 'react';

import type { ShareUrlProps, ShareUrl } from './thunk';
import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import React from 'react';
import Button from 'component/button';
import CopyableText from 'component/copyableText';
import EmbedTextArea from 'component/embedTextArea';
import Spinner from 'component/spinner';
import { generateDownloadUrl, generateNewestUrl } from 'util/web';
import { useIsMobile } from 'effects/use-screensize';
import { FormField } from 'component/common/form';
import { getClaimScheduledState, isClaimUnlisted } from 'util/claim';
import { hmsToSeconds, secondsToHms } from 'util/time';
import { generateLbryContentUrl, generateRssUrl } from 'util/url';
import { URL as SITE_URL, TWITTER_ACCOUNT, SHARE_DOMAIN_URL } from 'config';

const SHARE_DOMAIN = SHARE_DOMAIN_URL || SITE_URL;
const IOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
const SUPPORTS_SHARE_API = typeof navigator.share !== 'undefined';

// Twitter share
const TWITTER_INTENT_API = 'https://twitter.com/intent/tweet?';

// ****************************************************************************
// ****************************************************************************

type SpinnerStateProps = {|
  uri: string,
  claim: StreamClaim,
  inviteStatusFetched: boolean,
|};

type SpinnerDispatchProps = {|
  doFetchInviteStatus: (boolean) => void,
  doFetchUriAccessKey: (uri: string) => Promise<?UriAccessKey>,
|};

type SocialShareStateProps = {|
  claim: StreamClaim,
  title: ?string,
  webShareable: boolean,
  referralCode: string,
  user: any,
  position: number,
  collectionId?: number,
  disableDownloadButton: boolean,
  isMature: boolean,
  isMembershipProtected: boolean,
  isFiatRequired: boolean,
  uriAccessKey: ?UriAccessKey,
  doGenerateShareUrl: (props: ShareUrlProps) => Promise<ShareUrl>,
|};

// ****************************************************************************
// withLoadingSpinner
// ****************************************************************************

const FETCHING_ACCESS_KEY = -1;

function withSpinner(Component: (props: any) => React$Element<any>) {
  return function LoadingSpinner(props: SpinnerStateProps & SpinnerDispatchProps) {
    const { uri, claim, inviteStatusFetched, doFetchInviteStatus, doFetchUriAccessKey } = props;
    const [accessKey, setAccessKey] = React.useState(FETCHING_ACCESS_KEY);

    React.useEffect(() => {
      if (!inviteStatusFetched) {
        doFetchInviteStatus(false);
      }
    }, [inviteStatusFetched, doFetchInviteStatus]);

    React.useEffect(() => {
      doFetchUriAccessKey(uri)
        .then((accessKey: ?UriAccessKey) => setAccessKey(accessKey))
        .catch();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount
    }, []);

    if (!claim) {
      return null;
    } else if (!inviteStatusFetched || accessKey === FETCHING_ACCESS_KEY) {
      return (
        <div className="main--empty">
          <Spinner />
        </div>
      );
    }

    const componentProps = { ...props, uriAccessKey: accessKey };

    return <Component {...componentProps} />;
  };
}

// ****************************************************************************
// SocialShare
// ****************************************************************************

function SocialShare(props: SocialShareStateProps) {
  const {
    claim,
    title,
    referralCode,
    user,
    webShareable,
    position,
    collectionId,
    disableDownloadButton,
    isMature,
    isMembershipProtected,
    isFiatRequired,
    uriAccessKey,
    doGenerateShareUrl,
  } = props;

  const [showEmbed, setShowEmbed] = React.useState(false);
  const [includeCollectionId, setIncludeCollectionId] = React.useState(Boolean(collectionId)); // unless it *is* a collection?
  const [showClaimLinks, setShowClaimLinks] = React.useState(false);
  const [includeStartTime, setincludeStartTime]: [boolean, any] = React.useState(false);
  const [startTime, setStartTime]: [string, any] = React.useState(secondsToHms(position));
  const showAdditionalShareOptions = getClaimScheduledState(claim) !== 'scheduled';
  const startTimeSeconds: number = hmsToSeconds(startTime);
  const isMobile = useIsMobile();

  const { canonical_url: canonicalUrl, permanent_url: permanentUrl, name, claim_id: claimId } = claim;
  const isChannel = claim.value_type === 'channel';
  const isCollection = claim.value_type === 'collection';
  const isStream = claim.value_type === 'stream';
  const isVideo = isStream && claim.value.stream_type === 'video';
  const isAudio = isStream && claim.value.stream_type === 'audio';
  const isUnlisted = isClaimUnlisted(claim);
  const showStartAt = isVideo || isAudio;
  const rewardsApproved = user && user.is_reward_approved;
  const lbryUrl: string = generateLbryContentUrl(canonicalUrl, permanentUrl);
  const rssUrl = isChannel && generateRssUrl(SHARE_DOMAIN, claim);

  const [shareUrl, setShareUrl] = React.useState<?ShareUrl>();

  const downloadUrl = `${generateDownloadUrl(name, claimId)}`;
  const claimLinkElements: Array<Node> = getClaimLinkElements();

  // Tweet params
  let tweetIntentParams = {
    url: shareUrl?.url || '',
    text: title || claim.name,
    hashtags: 'Odysee',
  };

  if (TWITTER_ACCOUNT) {
    // $FlowFixMe
    tweetIntentParams.via = TWITTER_ACCOUNT;
  }

  // Generate twitter web intent url
  const tweetIntent = TWITTER_INTENT_API + new URLSearchParams(tweetIntentParams).toString();

  function handleWebShareClick() {
    if (navigator.share) {
      navigator.share({
        title: title || claim.name,
        url: window.location.href,
      });
    }
  }

  function getClaimLinkElements() {
    const elements: Array<Node> = [];

    if (
      Boolean(isStream) &&
      !disableDownloadButton &&
      !isMature &&
      !isMembershipProtected &&
      !isFiatRequired &&
      !isUnlisted
    ) {
      elements.push(<CopyableText label={__('Download Link')} copyable={downloadUrl} key="download" />);
    }

    if (rssUrl) {
      elements.push(<CopyableText label={__('RSS Url')} copyable={rssUrl} key="rss" />);
    }

    if (isChannel) {
      elements.push(
        <>
          <CopyableText
            label={__('Latest Content Link')}
            copyable={generateNewestUrl(name, PAGES.LATEST)}
            key="latest"
          />
          <CopyableText
            label={__('Current Livestream Link')}
            copyable={generateNewestUrl(name, PAGES.LIVE_NOW)}
            key="current"
          />
        </>
      );
    }

    return elements;
  }

  React.useEffect(() => {
    if (shareUrl) {
      const url = new URL(shareUrl.url);
      const urlNoReferral = new URL(shareUrl.urlNoReferral);
      if (includeStartTime) {
        url.searchParams.set('t', startTimeSeconds.toString());
        urlNoReferral.searchParams.set('t', startTimeSeconds.toString());
      } else {
        url.searchParams.delete('t');
        urlNoReferral.searchParams.delete('t');
      }
      setShareUrl({ url: url.toString(), urlNoReferral: urlNoReferral.toString() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `shareUrl` excluded
  }, [includeStartTime, startTimeSeconds]);

  React.useEffect(function initUrls() {
    doGenerateShareUrl({
      domain: SHARE_DOMAIN,
      lbryURI: lbryUrl,
      referralCode: rewardsApproved ? referralCode : '',
      startTimeSeconds: includeStartTime && startTimeSeconds ? startTimeSeconds : null,
      collectionId: collectionId && includeCollectionId ? collectionId : null,
      uriAccessKey: uriAccessKey,
      useShortUrl: Boolean(uriAccessKey), // or isUnlisted
    })
      .then((result) => setShareUrl(result))
      .catch((err) => assert(false, 'SocialShare', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount
  }, []);

  if (!shareUrl) {
    return (
      <div className="main--empty">
        <Spinner />
      </div>
    );
  }

  return (
    <React.Fragment>
      <CopyableText copyable={shareUrl.url} />
      {showStartAt && (
        <div className="section__checkbox">
          <FormField
            type="checkbox"
            name="share_start_at_checkbox"
            onChange={() => setincludeStartTime(!includeStartTime)}
            checked={includeStartTime}
            label={__('Start at')}
          />
          <FormField
            type="text"
            name="share_start_at"
            value={startTime}
            disabled={!includeStartTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
        </div>
      )}
      {Boolean(collectionId) && (
        <div className="section__checkbox">
          <FormField
            type="checkbox"
            name="share_collection_id_checkbox"
            onChange={() => setIncludeCollectionId(!includeCollectionId)}
            checked={includeCollectionId}
            label={__('Include Playlist ID')}
          />
        </div>
      )}
      {showAdditionalShareOptions && (
        <>
          <div className="section__actions">
            <Button className="share" iconSize={24} icon={ICONS.TWITTER} title={__('Share on X')} href={tweetIntent} />
            <Button
              className="share"
              iconSize={24}
              icon={ICONS.FACEBOOK}
              title={__('Share on Facebook')}
              target="_blank"
              href={`https://facebook.com/sharer/sharer.php?u=${shareUrl.urlNoReferral}`}
            />
            <Button
              className="share"
              iconSize={24}
              icon={ICONS.REDDIT}
              title={__('Share on Reddit')}
              target="_blank"
              href={`https://reddit.com/submit?url=${shareUrl.urlNoReferral}`}
            />
            {!isMobile ? (
              <Button
                className="share"
                iconSize={24}
                icon={ICONS.WHATSAPP}
                title={__('Share on WhatsApp')}
                target="_blank"
                href={`https://web.whatsapp.com/send?text=${shareUrl.urlNoReferral}`}
              />
            ) : (
              <Button
                className="share"
                iconSize={24}
                icon={ICONS.WHATSAPP}
                title={__('Share on WhatsApp')}
                href={`whatsapp://send?text=${shareUrl.urlNoReferral}`}
              />
            )}
            {!IOS ? (
              <Button
                className="share"
                iconSize={24}
                icon={ICONS.TELEGRAM}
                title={__('Share on Telegram')}
                target="_blank"
                href={`https://t.me/share/url?url=${shareUrl.urlNoReferral}`}
              />
            ) : (
              // Only ios client supports share urls
              <Button
                className="share"
                iconSize={24}
                icon={ICONS.TELEGRAM}
                title={__('Share on Telegram')}
                href={`tg://msg_url?url=${shareUrl.urlNoReferral}&amp;text=text`}
              />
            )}
            {webShareable && !isCollection && (
              <Button
                className="share"
                iconSize={24}
                icon={ICONS.EMBED}
                title={__('Embed this content')}
                onClick={() => {
                  setShowEmbed(!showEmbed);
                  setShowClaimLinks(false);
                }}
              />
            )}
            {claimLinkElements.length > 0 && (
              <Button
                className="share"
                iconSize={24}
                icon={ICONS.SHARE_LINK}
                title={__('Links')}
                onClick={() => {
                  setShowClaimLinks(!showClaimLinks);
                  setShowEmbed(false);
                }}
              />
            )}
          </div>
          {SUPPORTS_SHARE_API && isMobile && (
            <div className="section__actions">
              <Button icon={ICONS.SHARE} button="primary" label={__('Share via...')} onClick={handleWebShareClick} />
            </div>
          )}
          {showEmbed &&
            (!isChannel ? (
              <EmbedTextArea
                label={__('Embedded')}
                claim={claim}
                includeStartTime={includeStartTime}
                startTime={startTimeSeconds}
                referralCode={referralCode}
                uriAccessKey={uriAccessKey}
              />
            ) : (
              <>
                <EmbedTextArea label={__('Embedded Latest Video Content')} claim={claim} newestType={PAGES.LATEST} />
                <EmbedTextArea label={__('Embedded Current Livestream')} claim={claim} newestType={PAGES.LIVE_NOW} />
              </>
            ))}
          {showClaimLinks && <div className="section">{claimLinkElements}</div>}
        </>
      )}
    </React.Fragment>
  );
}

export default withSpinner(SocialShare);

// @flow
import React from 'react';

import Spinner from 'component/spinner';
import Button from 'component/button';
import Card from 'component/common/card';
import Yrbl from 'component/yrbl';
import { parseURI } from 'util/lbryURI';
import * as MODALS from 'constants/modal_types';
import * as PUBLISH_TYPES from 'constants/publish_types';
import useIsVisibilityRestricted from 'effects/use-is-visibility-restricted';

type Props = {
  uri: string,
  delayed?: boolean,
  Wrapper?: any,
  ClaimRenderWrapper?: any,
  // -- redux --
  claim: ?StreamClaim,
  hasClaim: ?boolean,
  isClaimBlackListed: boolean,
  isClaimFiltered: boolean,
  claimIsMine: ?boolean,
  isUnlisted: boolean,
  isAuthenticated: boolean,
  isGlobalMod: boolean,
  uriAccessKey: ?UriAccessKey,
  geoRestriction: ?GeoRestriction,
  gblAvailable: boolean,
  preferEmbed: boolean,
  verifyClaimSignature: (params: VerifyClaimSignatureParams) => Promise<VerifyClaimSignatureResponse>,
  doResolveUri: (uri: string, returnCached?: boolean, resolveReposts?: boolean, options?: any) => void,
  doBeginPublish: (type: PublishType, name: ?string) => void,
  doOpenModal: (string, {}) => void,
};

/**
 * HigherOrderComponent to resolve a claim and return the correct states for render, such as loading, failed, restricted, etc
 *
 * @param Component: FunctionalComponentParam
 * @returns {FunctionalComponent}
 */
const withResolvedClaimRender = (ClaimRenderComponent: FunctionalComponentParam) => {
  const ClaimRenderWrapper = (props: Props) => {
    const {
      uri,
      delayed,
      Wrapper = React.Fragment,
      ClaimRenderWrapper = React.Fragment,
      // -- redux --
      claim,
      hasClaim,
      isClaimBlackListed,
      isClaimFiltered,
      claimIsMine,
      isUnlisted,
      isGlobalMod,
      isAuthenticated,
      uriAccessKey,
      geoRestriction,
      gblAvailable,
      preferEmbed,
      verifyClaimSignature,
      doResolveUri,
      doBeginPublish,
      doOpenModal,

      ...otherProps
    } = props;

    const { streamName, /* channelName, */ isChannel } = parseURI(uri);

    const claimIsRestricted =
      !claimIsMine && (geoRestriction !== null || isClaimBlackListed || (isClaimFiltered && !preferEmbed));

    const resolveRequired =
      claim === undefined || (claim && claim.value?.fee && claim.purchase_receipt === undefined && isAuthenticated);

    const isVisibilityRestricted = useIsVisibilityRestricted(
      claim,
      claimIsMine,
      isGlobalMod,
      uriAccessKey,
      verifyClaimSignature
    );

    const LoadingSpinner = React.useMemo(
      () =>
        ({ text }: { text: string }) =>
          (
            <Wrapper>
              <div className="main--empty">
                <Spinner delayed={delayed} text={text} />
              </div>
            </Wrapper>
          ),
      [delayed]
    );

    const resolveClaim = React.useCallback(
      () =>
        doResolveUri(
          uri,
          false,
          true,
          isAuthenticated ? { include_is_my_output: true, include_purchase_receipt: true } : {}
        ),
      [doResolveUri, isAuthenticated, uri]
    );

    React.useEffect(() => {
      if (resolveRequired) {
        resolveClaim();
      }
    }, [resolveRequired, resolveClaim]);

    if (!hasClaim) {
      if (hasClaim === undefined) {
        return <LoadingSpinner text={__('Resolving...')} />;
      }

      return (
        <Wrapper>
          <div className="main--empty">
            <Yrbl
              title={isChannel ? __('Channel Not Found') : __('No Content Found')}
              subtitle={
                <div className="section__actions">
                  {!isChannel && (
                    <Button
                      button="primary"
                      // label={__(isChannel ? 'Claim this handle' : 'Publish Something')} -- only support non-channels for now
                      label={__('Publish Something')}
                      onClick={() => doBeginPublish(PUBLISH_TYPES.FILE, streamName)}
                    />
                  )}

                  {!isChannel && (
                    <Button
                      button="secondary"
                      label={__('Repost Something')}
                      onClick={() => doOpenModal(MODALS.REPOST, { streamName })}
                    />
                  )}
                </div>
              }
            />
          </div>
        </Wrapper>
      );
    }

    if (claimIsRestricted && geoRestriction === undefined) {
      if (!gblAvailable) {
        return (
          <Wrapper>
            <div className="main--empty">
              <Yrbl
                title={__('Oops! Something went wrong.')}
                subtitle={
                  <>
                    <p>{__(HELP.GBL_NA_LINE_1)}</p>
                    <p>{__(HELP.GBL_NA_LINE_2)}</p>
                  </>
                }
                type="sad"
                alwaysShow
              />
            </div>
          </Wrapper>
        );
      } else {
        return <LoadingSpinner text={__('Resolving...')} />;
      }
    }

    if (isVisibilityRestricted !== false) {
      if (isVisibilityRestricted === undefined) {
        return <LoadingSpinner text={__('Resolving...')} />;
      }

      return (
        <Wrapper>
          <div className="main--empty">
            <Yrbl
              title={__(isChannel ? 'Channel unavailable' : 'Content unavailable')}
              subtitle={__('Reach out to the creator to obtain the full URL for access.')}
              type="sad"
              alwaysShow
            />
          </div>
        </Wrapper>
      );
    }

    if (claimIsRestricted && isChannel) {
      if (geoRestriction) {
        return (
          <Wrapper>
            <div className="main--empty">
              <Yrbl
                title={__(isChannel ? 'Channel unavailable' : 'Content unavailable')}
                subtitle={geoRestriction.message ? __(geoRestriction.message) : ''}
                type="sad"
                alwaysShow
              />
            </div>
          </Wrapper>
        );
      }
    }

    // -- Channels are handled differently than content
    if (claimIsRestricted && !isChannel) {
      if (geoRestriction) {
        return (
          <Wrapper>
            <div className="main--empty">
              <Yrbl
                title={__(isChannel ? 'Channel unavailable' : 'Content unavailable')}
                subtitle={geoRestriction.message ? __(geoRestriction.message) : ''}
                type="sad"
                alwaysShow
              />
            </div>
          </Wrapper>
        );
      }

      if (isClaimBlackListed) {
        return (
          <Wrapper>
            <div className="main--empty">
              <Card
                title={uri}
                subtitle={__(
                  'In response to a complaint we received under the US Digital Millennium Copyright Act, we have blocked access to this content from our applications. Content may also be blocked due to DMCA Red Flag rules which are obvious copyright violations we come across, are discussed in public channels, or reported to us.'
                )}
                actions={
                  <div className="section__actions">
                    <Button button="link" href="https://help.odysee.tv/copyright/" label={__('Read More')} />
                  </div>
                }
              />
            </div>
          </Wrapper>
        );
      }

      if (isClaimFiltered && !preferEmbed) {
        return (
          <Wrapper>
            <div className="main--empty">
              <Card
                title={uri}
                subtitle={__('This content violates the terms and conditions of Odysee and has been filtered.')}
              />
            </div>
          </Wrapper>
        );
      }
    }

    return (
      <React.Suspense fallback={<LoadingSpinner text={__('Loading...')} />}>
        <ClaimRenderWrapper>
          <ClaimRenderComponent uri={uri} {...otherProps} />
        </ClaimRenderWrapper>
      </React.Suspense>
    );
  };

  return ClaimRenderWrapper;
};

// prettier-ignore
const HELP = {
  GBL_NA_LINE_1: 'It looks like there was a problem with the network connection or one of your extensions is blocking the request.',
  GBL_NA_LINE_2: 'Please check your internet connection and try again. If the problem persists, email help@odysee.com.',
};

export default withResolvedClaimRender;

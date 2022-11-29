// @flow
import React from 'react';
import Spinner from 'component/spinner';
import Button from 'component/button';
import Card from 'component/common/card';
import Yrbl from 'component/yrbl';
import { parseURI } from 'util/lbryURI';
import * as MODALS from 'constants/modal_types';

type Props = {
  uri: string,
  delayed?: boolean,
  Wrapper?: any,
  ClaimRenderWrapper?: any,
  // -- redux --
  hasClaim: ?boolean,
  isClaimBlackListed: boolean,
  isClaimFiltered: boolean,
  claimIsMine: boolean,
  isAuthenticated: boolean,
  geoRestriction: ?GeoRestriction,
  preferEmbed: boolean,
  doResolveUri: (uri: string, returnCached?: boolean, resolveReposts?: boolean, options?: any) => void,
  doBeginPublish: (name: ?string) => void,
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
      hasClaim,
      isClaimBlackListed,
      isClaimFiltered,
      claimIsMine,
      isAuthenticated,
      geoRestriction,
      preferEmbed,
      doResolveUri,
      doBeginPublish,
      doOpenModal,

      ...otherProps
    } = props;

    const { streamName, channelName, isChannel } = parseURI(uri);

    const claimIsRestricted =
      !claimIsMine && (geoRestriction || isClaimBlackListed || (isClaimFiltered && !preferEmbed));

    const LoadingSpinner = React.useMemo(
      () => ({ text }: { text: string }) => (
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
      if (hasClaim === undefined) {
        resolveClaim();
      }
    }, [hasClaim, resolveClaim]);

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
                  <Button
                    button="primary"
                    label={__(isChannel ? 'Claim this handle' : 'Publish Something')}
                    onClick={() => doBeginPublish(channelName)}
                  />

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
                  'In response to a complaint we received under the US Digital Millennium Copyright Act, we have blocked access to this content from our applications.'
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

export default withResolvedClaimRender;

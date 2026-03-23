import React from 'react';
import Comments from 'comments';
import Spinner from 'component/spinner';
import Button from 'component/button';
import Card from 'component/common/card';
import Yrbl from 'component/yrbl';
import { parseURI } from 'util/lbryURI';
import * as MODALS from 'constants/modal_types';
import * as PUBLISH_TYPES from 'constants/publish_types';
import useIsVisibilityRestricted from 'effects/use-is-visibility-restricted';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectBlackListedDataForUri, selectFilteredDataForUri } from 'lbryinc';
import { selectGblAvailable } from 'redux/selectors/blocked';
import {
  selectClaimForUri,
  selectHasClaimForUri,
  selectClaimIsMine,
  selectGeoRestrictionForUri,
  selectIsUriUnlisted,
} from 'redux/selectors/claims';
import { selectContentStates } from 'redux/selectors/content';
import { selectUser, selectUserVerifiedEmail } from 'redux/selectors/user';
import { doResolveUri } from 'redux/actions/claims';
import { doBeginPublish } from 'redux/actions/publish';
import { doOpenModal } from 'redux/actions/app';

type Props = {
  uri: string;
  delayed?: boolean;
  Wrapper?: any;
  ClaimRenderWrapper?: any;
};

const withResolvedClaimRender = (ClaimRenderComponent: FunctionalComponentParam) => {
  const ResolvedClaimRender = (props: Props) => {
    const {
      uri,
      delayed,
      Wrapper = React.Fragment,
      ClaimRenderWrapper: ClaimWrapperComponent = React.Fragment,
      ...otherProps
    } = props;

    const dispatch = useAppDispatch();
    const claim = useAppSelector((state) => selectClaimForUri(state, uri));
    const hasClaim = useAppSelector((state) => selectHasClaimForUri(state, uri));
    const isClaimBlackListed = useAppSelector((state) => Boolean(selectBlackListedDataForUri(state, uri)));
    const filterData = useAppSelector((state) => selectFilteredDataForUri(state, uri));
    const isClaimFiltered = filterData && filterData.tag_name !== 'internal-hide-trending';
    const claimIsMine = useAppSelector((state) => selectClaimIsMine(state, claim));
    const isUnlisted = useAppSelector((state) => selectIsUriUnlisted(state, uri));
    const isAuthenticated = useAppSelector(selectUserVerifiedEmail);
    const isGlobalMod = useAppSelector((state) => Boolean(selectUser(state)?.global_mod));
    const uriAccessKey = useAppSelector((state) => selectContentStates(state).uriAccessKeys[uri]);
    const geoRestriction = useAppSelector((state) => selectGeoRestrictionForUri(state, uri));
    const gblAvailable = useAppSelector(selectGblAvailable);
    const verifyClaimSignature = Comments.verify_claim_signature;

    const {
      streamName,
      /* channelName, */
      isChannel,
    } = parseURI(uri);
    const claimIsRestricted = !claimIsMine && (geoRestriction !== null || isClaimBlackListed || isClaimFiltered);
    const resolveRequired =
      claim === undefined || (claim && claim.value?.fee && claim.purchase_receipt === undefined && isAuthenticated);
    const lastResolveKeyRef = React.useRef<string | undefined>();
    const isVisibilityRestricted = useIsVisibilityRestricted(
      claim,
      claimIsMine,
      isGlobalMod,
      uriAccessKey,
      verifyClaimSignature
    );
    const LoadingSpinner = React.useMemo(
      () =>
        ({ text }: { text: string }) => (
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
        dispatch(
          doResolveUri(
            uri,
            false,
            true,
            isAuthenticated
              ? {
                  include_is_my_output: true,
                  include_purchase_receipt: true,
                }
              : {}
          )
        ),
      [dispatch, isAuthenticated, uri]
    );
    React.useEffect(() => {
      const resolveKey = `${uri}:${String(isAuthenticated)}:${claim?.claim_id || 'none'}:${String(claim?.purchase_receipt)}`;

      if (!resolveRequired) {
        lastResolveKeyRef.current = undefined;
        return;
      }

      if (lastResolveKeyRef.current !== resolveKey) {
        lastResolveKeyRef.current = resolveKey;
        resolveClaim();
      }
    }, [claim?.claim_id, claim?.purchase_receipt, isAuthenticated, resolveRequired, resolveClaim, uri]);

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
                      button="primary" // label={__(isChannel ? 'Claim this handle' : 'Publish Something')} -- only support non-channels for now
                      label={__('Publish Something')}
                      onClick={() => dispatch(doBeginPublish(PUBLISH_TYPES.FILE, streamName))}
                    />
                  )}

                  {!isChannel && (
                    <Button
                      button="secondary"
                      label={__('Repost Something')}
                      onClick={() =>
                        dispatch(
                          doOpenModal(MODALS.REPOST, {
                            streamName,
                          })
                        )
                      }
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

      if (isClaimFiltered) {
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
        <ClaimWrapperComponent>
          <ClaimRenderComponent uri={uri} {...otherProps} />
        </ClaimWrapperComponent>
      </React.Suspense>
    );
  };

  ResolvedClaimRender.displayName = `withResolvedClaimRender(${ClaimRenderComponent.displayName || ClaimRenderComponent.name || 'Component'})`;
  return ResolvedClaimRender;
};

// prettier-ignore
const HELP = {
  GBL_NA_LINE_1: 'It looks like there was a problem with the network connection or one of your extensions is blocking the request.',
  GBL_NA_LINE_2: 'Please check your internet connection and try again. If the problem persists, email help@odysee.com.'
};
export default withResolvedClaimRender;

import * as ICONS from 'constants/icons';
import * as PAGES from 'constants/pages';
import { MINIMUM_PUBLISH_BID, INVALID_NAME_ERROR } from 'constants/claim';
import React from 'react';
import Card from 'component/common/card';
import Button from 'component/button';
import ChannelSelector from 'component/channelSelector';
import { FormField } from 'component/common/form';
import { parseURI, isNameValid, isURIValid, normalizeURI } from 'util/lbryURI';
import { creditsToString } from 'util/format-credits';
import analytics from 'analytics';
import LbcSymbol from 'component/common/lbc-symbol';
import ClaimPreview from 'component/claimPreview';
import { URL as SITE_URL, URL_LOCAL, URL_DEV } from 'config';
import HelpLink from 'component/common/help-link';
import WalletSpendableBalanceHelp from 'component/walletSpendableBalanceHelp';
import BidHelpText from 'component/publish/shared/publishBid/bid-help-text';
import Spinner from 'component/spinner';
import { REPOST_PARAMS } from 'page/repost/view';
import './style.scss';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import {
  makeSelectClaimForUri,
  selectTitleForUri,
  selectRepostError,
  selectRepostLoading,
  selectMyClaimsWithoutChannels,
  makeSelectEffectiveAmountForUri,
  selectIsUriResolving,
  selectFetchingMyChannels,
} from 'redux/selectors/claims';
import { selectBalance } from 'redux/selectors/wallet';
import {
  doRepost,
  doClearRepostError,
  doCheckPublishNameAvailability,
  doCheckPendingClaims,
} from 'redux/actions/claims';
import { doToast } from 'redux/actions/notifications';
import { selectActiveChannelClaim, selectIncognito } from 'redux/selectors/app';
import { doHideModal } from 'redux/actions/app';

type Props = {
  uri: string;
  name: string;
  contentUri: string;
  setRepostUri: (arg0: string) => void;
  setContentUri: (arg0: string) => void;
  isRepostPage?: boolean;
};

const addLbryIfNot = (term) => {
  return term.startsWith('lbry://') ? term : `lbry://${term}`;
};

function RepostCreate(props: Props) {
  const {
    uri,
    // ?from
    name,
    // ?to
    contentUri,
    setRepostUri,
    setContentUri,
    isRepostPage,
  } = props;

  const dispatch = useAppDispatch();
  const claim = useAppSelector((state) => makeSelectClaimForUri(uri)(state));
  const passedRepostClaim = useAppSelector((state) => makeSelectClaimForUri(name, false)(state));
  const passedRepostAmount = useAppSelector((state) => makeSelectEffectiveAmountForUri(name)(state));
  const enteredContentClaim = useAppSelector((state) => makeSelectClaimForUri(contentUri)(state));
  const enteredRepostClaim = useAppSelector((state) => makeSelectClaimForUri(props.name, false)(state));
  const enteredRepostAmount = useAppSelector((state) => makeSelectEffectiveAmountForUri(props.name)(state));
  const title = useAppSelector((state) => selectTitleForUri(state, uri));
  const balance = useAppSelector(selectBalance);
  const error = useAppSelector(selectRepostError);
  const reposting = useAppSelector(selectRepostLoading);
  const myClaims = useAppSelector(selectMyClaimsWithoutChannels);
  const isResolvingPassedRepost = useAppSelector((state) => name && selectIsUriResolving(state, `lbry://${name}`));
  const isResolvingEnteredRepost = useAppSelector(
    (state) => props.name && selectIsUriResolving(state, `lbry://${props.name}`)
  );
  const activeChannelClaim = useAppSelector(selectActiveChannelClaim);
  const fetchingMyChannels = useAppSelector(selectFetchingMyChannels);
  const incognito = useAppSelector(selectIncognito);

  const defaultName = name || (claim && claim.name) || '';
  const contentClaimId = claim && claim.claim_id;
  const enteredClaimId = enteredContentClaim && enteredContentClaim.claim_id;
  const [repostBid, setRepostBid] = React.useState(0.01);
  const [repostBidError, setRepostBidError] = React.useState(undefined);
  const [enteredRepostName, setEnteredRepostName] = React.useState(defaultName);
  const [available, setAvailable] = React.useState(true);
  const [enteredContent, setEnteredContentUri] = React.useState(undefined);
  const [contentError, setContentError] = React.useState('');
  const resolvingRepost = isResolvingEnteredRepost || isResolvingPassedRepost;
  const repostUrlName = `lbry://${incognito || !activeChannelClaim ? '' : `${activeChannelClaim.name}/`}`;
  const contentFirstRender = React.useRef(true);

  const setAutoRepostBid = (amount) => {
    if (balance && balance > 0.02) {
      if (uri) {
        setRepostBid(0.01);
      } else if (balance > amount) {
        setRepostBid(Number(amount.toFixed(2)));
      } else {
        setRepostBid(0.01);
      }
    }
  };

  function getSearchUri(value) {
    const WEB_DEV_PREFIX = `${URL_DEV}/`;
    const WEB_LOCAL_PREFIX = `${URL_LOCAL}/`;
    const WEB_PROD_PREFIX = `${SITE_URL}/`;
    const ODYSEE_PREFIX = `https://odysee.com/`;
    const includesLbryTvProd = value.includes(WEB_PROD_PREFIX);
    const includesOdysee = value.includes(ODYSEE_PREFIX);
    const includesLbryTvLocal = value.includes(WEB_LOCAL_PREFIX);
    const includesLbryTvDev = value.includes(WEB_DEV_PREFIX);
    const wasCopiedFromWeb = includesLbryTvDev || includesLbryTvLocal || includesLbryTvProd || includesOdysee;
    const isLbryUrl = value.startsWith('lbry://') && value !== 'lbry://';
    const error = '';

    if (wasCopiedFromWeb) {
      let prefix = WEB_PROD_PREFIX;
      if (includesLbryTvLocal) prefix = WEB_LOCAL_PREFIX;
      if (includesLbryTvDev) prefix = WEB_DEV_PREFIX;
      if (includesOdysee) prefix = ODYSEE_PREFIX;
      let query = (value && value.slice(prefix.length).replace(/:/g, '#')) || '';

      try {
        const lbryUrl = `lbry://${query}`;
        parseURI(lbryUrl);
        return [lbryUrl, null];
      } catch (e) {
        return [query, 'error'];
      }
    }

    if (!isLbryUrl) {
      if (value.startsWith('@')) {
        if (isNameValid(value.slice(1))) {
          return [value, null];
        } else {
          return [value, error];
        }
      }

      return [addLbryIfNot(value), null];
    } else {
      try {
        const isValid = isURIValid(value);

        if (isValid) {
          let uri;

          try {
            uri = normalizeURI(value);
          } catch (e) {
            return [value, null];
          }

          return [uri, null];
        } else {
          return [value, null];
        }
      } catch (e) {
        return [value, 'error'];
      }
    }
  }

  // repostName
  let repostNameError;

  if (!enteredRepostName) {
    repostNameError = __('A name is required');
  } else if (!isNameValid(enteredRepostName)) {
    repostNameError = INVALID_NAME_ERROR;
  } else if (!available) {
    repostNameError = __('You already have a claim with this name.');
  }

  // contentName
  let contentNameError;

  if (!enteredContent && enteredContent !== undefined) {
    contentNameError = __('A name is required');
  }

  React.useEffect(() => {
    if (enteredRepostName && isNameValid(enteredRepostName)) {
      dispatch(doCheckPublishNameAvailability(enteredRepostName)).then((r) => setAvailable(r));
    }
  }, [enteredRepostName, dispatch]);
  // takeover amount, bid suggestion
  React.useEffect(() => {
    const repostTakeoverAmount = Number(enteredRepostAmount)
      ? Number(enteredRepostAmount) + 0.01
      : Number(passedRepostAmount) + 0.01;

    if (repostTakeoverAmount) {
      setAutoRepostBid(repostTakeoverAmount);
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: should include setAutoRepostBid + useCallback
  }, [enteredRepostAmount, passedRepostAmount]);
  // repost bid error
  React.useEffect(() => {
    let rBidError;

    if (repostBid === 0) {
      rBidError = __('Deposit cannot be 0');
    } else if (balance === repostBid) {
      rBidError = __('Please decrease your deposit to account for transaction fees');
    } else if (balance < repostBid) {
      rBidError = __('Deposit cannot be higher than your available balance');
    } else if (repostBid < MINIMUM_PUBLISH_BID) {
      rBidError = __('Your deposit must be higher');
    }

    setRepostBidError(rBidError);
  }, [balance, setRepostBidError, repostBidError, repostBid]);
  // setContentUri given enteredUri
  React.useEffect(() => {
    if (!enteredContent && !contentFirstRender.current) {
      setContentError(__('A name is required'));
    }

    if (enteredContent) {
      contentFirstRender.current = false;
      const [searchContent, error] = getSearchUri(enteredContent);

      if (error) {
        setContentError(__('Something not quite right..'));
      } else {
        setContentError('');
      }

      try {
        const { streamName, channelName, isChannel } = parseURI(searchContent);

        if (!isChannel && streamName && isNameValid(streamName)) {
          // contentNameValid = true;
          setContentUri(searchContent);
        } else if (isChannel && channelName && isNameValid(channelName)) {
          // contentNameValid = true;
          setContentUri(searchContent);
        }
      } catch (e) {
        if (enteredContent !== '@') setContentError('');
        setContentUri(``);
      }
    }
  }, [enteredContent, setContentUri, setContentError]);
  // setRepostName
  React.useEffect(() => {
    if (enteredRepostName) {
      let isValid = false;

      try {
        parseURI(enteredRepostName);
        isValid = true;
      } catch (e) {
        isValid = false;
      }

      if (isValid) {
        setRepostUri(enteredRepostName);
      }
    }
  }, [enteredRepostName, setRepostUri]);
  const repostClaimId = contentClaimId || enteredClaimId;

  function handleSubmit() {
    if (enteredRepostName && repostBid && repostClaimId) {
      dispatch(
        doRepost({
          name: enteredRepostName,
          bid: creditsToString(repostBid),
          channel_id: activeChannelClaim && !incognito ? activeChannelClaim.claim_id : undefined,
          claim_id: repostClaimId,
        })
      ).then((repostClaim: StreamClaim) => {
        dispatch(doCheckPendingClaims());
        analytics.apiLog.publish(repostClaim);
        dispatch(
          doToast({
            message: __('Woohoo! Successfully reposted this claim.'),
            linkText: __('Uploads'),
            linkTarget: '/uploads',
          })
        );
        dispatch(doHideModal());
      });
    }
  }

  function cancelIt() {
    dispatch(doClearRepostError());
    dispatch(doHideModal());
  }

  if (fetchingMyChannels) {
    return (
      <div className="main--empty">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <Card
        title={__('Repost')}
        className="repost-wrapper"
        subtitle={
          isRepostPage ? undefined : (
            <Button
              button="link"
              label={__('Open Repost in new tab')}
              iconRight={ICONS.EXTERNAL}
              href={`/$/${PAGES.REPOST_NEW}?${REPOST_PARAMS.FROM}=${encodeURIComponent(uri)}&to=${encodeURIComponent(enteredRepostName)}`}
              navigateTarget="_blank"
            />
          )
        }
        actions={
          <div>
            <fieldset-section>
              <fieldset-group class="fieldset-group--smushed fieldset-group--disabled-prefix">
                <fieldset-section>
                  <label htmlFor="auth_first_channel">
                    {repostNameError ? (
                      <span className="error__text">{repostNameError}</span>
                    ) : (
                      <span>
                        {__('Repost URL')}
                        <HelpLink href="https://help.odysee.tv/category-blockchain/category-staking/naming/" />
                      </span>
                    )}
                  </label>
                  <div className="form-field__prefix">{repostUrlName}</div>
                </fieldset-section>
                <FormField
                  type="text"
                  name="repost_name"
                  value={enteredRepostName}
                  onChange={(event) => setEnteredRepostName(event.target.value)}
                  placeholder={__('MyFunName')}
                />
              </fieldset-group>
            </fieldset-section>

            {uri && (
              <fieldset-section
                style={{
                  marginTop: 'var(--spacing-m)',
                  marginBottom: 'calc(-1 * var(--spacing-m))',
                }}
              >
                <ClaimPreview key={uri} uri={uri} actions={''} showNullPlaceholder />
              </fieldset-section>
            )}
            {!uri && name && (
              <>
                <FormField
                  label={__('Content to repost')}
                  type="text"
                  name="content_url"
                  value={enteredContent}
                  error={contentError}
                  onChange={(event) => setEnteredContentUri(event.target.value)}
                  placeholder={__('Enter a name or %domain% URL', {
                    domain: SITE_URL,
                  })}
                />
              </>
            )}

            {!uri && (
              <fieldset-section>
                <ClaimPreview key={contentUri} uri={contentUri} actions={''} type={'large'} showNullPlaceholder />
              </fieldset-section>
            )}

            <div
              style={{
                marginTop: 'var(--spacing-m)',
                display: 'flex',
                gap: 'var(--spacing-m)',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  minWidth: '10em',
                }}
              >
                <FormField
                  type="number"
                  name="repost_bid"
                  min="0"
                  step="any"
                  placeholder="0.123"
                  className="form-field--price-amount"
                  label={<LbcSymbol postfix={__('Support --[button to support a claim]--')} size={14} />}
                  value={repostBid}
                  error={repostBidError}
                  disabled={!enteredRepostName || resolvingRepost}
                  onChange={(event) => setRepostBid(event.target.value)}
                  onWheel={(e) => e.stopPropagation()}
                />
                <WalletSpendableBalanceHelp inline />
              </div>
              <div
                className="form-field__help"
                style={{
                  marginTop: 'var(--spacing-xs)',
                }}
              >
                <BidHelpText
                  uri={'lbry://' + enteredRepostName}
                  amountNeededForTakeover={enteredRepostAmount}
                  isResolvingUri={isResolvingEnteredRepost}
                />
              </div>
            </div>

            <div
              className="section__actions publish__actions"
              style={{
                marginTop: 'var(--spacing-m)',
              }}
            >
              <Button
                icon={ICONS.REPOST}
                disabled={
                  resolvingRepost ||
                  reposting ||
                  repostBidError ||
                  repostNameError ||
                  ((!uri || enteredContent) && contentNameError) ||
                  (!uri && !enteredContentClaim)
                }
                button="primary"
                label={reposting ? __('Reposting') : __('Repost')}
                onClick={handleSubmit}
              />
              <ChannelSelector isPublishMenu />
              <Button button="link" label={__('Cancel')} onClick={cancelIt} />
            </div>
          </div>
        }
      />
    </>
  );
}

export default RepostCreate;

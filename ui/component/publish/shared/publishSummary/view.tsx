import React from 'react';
import Tag from 'component/tag';
import Icon from 'component/common/icon';
import LbcSymbol from 'component/common/lbc-symbol';
import ChannelThumbnail from 'component/channelThumbnail';
import MarkdownPreview from 'component/common/markdown-preview';
import * as ICONS from 'constants/icons';
import * as STRIPE from 'constants/stripe';
import { PAYWALL } from 'constants/publish';
import { TO_SECONDS } from 'util/stripe';
import { removeInternalTags } from 'util/tags';
import { secondsToDhms } from 'util/time';
import { getLanguageName } from 'constants/languages';
import { COPYRIGHT, OTHER } from 'constants/licenses';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectPublishFormValues, selectMemberRestrictionStatus } from 'redux/selectors/publish';
import { selectMyChannelClaims } from 'redux/selectors/claims';
import { selectMembershipTiersForCreatorId } from 'redux/selectors/memberships';
import ClaimPreviewTile from 'component/claimPreviewTile';
import { buildURI, isNameValid } from 'util/lbryURI';
import * as ACTIONS from 'constants/action_types';
import './style.scss';

function createRow(label: string, value: any, hide?: boolean) {
  if (hide) return null;
  return (
    <tr>
      <td>{label}</td>
      <td>{value || <span style={{ color: 'var(--color-text-subtitle)' }}>—</span>}</td>
    </tr>
  );
}

function truncate(str: string | undefined, max: number) {
  return str && str.length > max ? str.slice(0, max).trim() + '...' : str;
}

export default function PublishSummary() {
  const dispatch = useAppDispatch();
  const pf = useAppSelector(selectPublishFormValues);
  const myChannels = useAppSelector(selectMyChannelClaims);
  const memberRestrictionStatus = useAppSelector(selectMemberRestrictionStatus);
  const myMembershipTiers = useAppSelector((state) => selectMembershipTiersForCreatorId(state, pf.channelId));
  const activeFormId = pf.activeFormId;
  const previewClaimId = `__preview_${activeFormId || 'default'}__`;

  const {
    title,
    description,
    channel,
    uri,
    bid,
    language,
    tags,
    paywall,
    fee,
    fiatPurchaseEnabled,
    fiatPurchaseFee,
    fiatRentalEnabled,
    fiatRentalFee,
    fiatRentalExpiration,
    visibility,
    scheduledShow,
    licenseType,
    otherLicenseDescription,
    licenseUrl,
    memberRestrictionTierIds,
    thumbnail,
    filePath,
    fileDur,
    type,
  } = pf;

  const channelClaim: any = myChannels && myChannels.find((x: any) => x.name === channel);
  const previewUri = React.useMemo(() => {
    const name = pf.name || 'untitled';
    if (!isNameValid(name)) return null;
    try {
      return buildURI({ streamName: name, channelName: channel || undefined } as any, true);
    } catch {
      return null;
    }
  }, [pf.name, channel]);

  const previewBlobUrl = React.useMemo(() => {
    if (filePath instanceof File) return URL.createObjectURL(filePath);
    return null;
  }, [filePath]);

  React.useEffect(() => {
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [previewBlobUrl]);

  React.useEffect(() => {
    if (!pf.name || !isNameValid(pf.name) || !previewUri) return;
    const fakeClaim: any = {
      claim_id: previewClaimId,
      name: pf.name,
      permanent_url: previewUri,
      canonical_url: previewUri,
      short_url: previewUri,
      type: 'claim',
      value_type: 'stream',
      confirmations: 0,
      is_channel_signature_valid: !!channelClaim,
      value: {
        title,
        description,
        thumbnail: { url: thumbnail },
        languages: language ? [language] : [],
        tags: tags.map((t: any) => t.name),
        source: { media_type: type === 'post' ? 'text/markdown' : 'video/mp4' },
        ...(type !== 'post' ? { video: { duration: fileDur || 60 } } : {}),
      },
      signing_channel: channelClaim
        ? {
            claim_id: channelClaim.claim_id,
            name: channelClaim.name,
            permanent_url: channelClaim.permanent_url,
            canonical_url: channelClaim.canonical_url,
            value: channelClaim.value,
          }
        : undefined,
      txid: previewClaimId,
      nout: 0,
      meta: { effective_amount: '0' },
      timestamp: Math.floor(Date.now() / 1000),
    };
    dispatch({
      type: ACTIONS.UPDATE_PENDING_CLAIMS,
      data: {
        claims: [fakeClaim],
        options: { overrideTags: true, overrideSigningChannel: true },
      },
    });
    if (previewBlobUrl) {
      const outpoint = `${previewClaimId}:0`;
      dispatch({
        type: ACTIONS.FETCH_FILE_INFO_COMPLETED,
        data: {
          outpoint,
          fileInfo: { outpoint, streaming_url: previewBlobUrl },
        },
      });
    }
  }, [title, description, thumbnail, channel, pf.name, language, tags, channelClaim, previewBlobUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  function getPriceValue() {
    switch (paywall) {
      case PAYWALL.FREE:
        return __('Free');
      case PAYWALL.SDK:
        return fee.currency === 'LBC' ? <LbcSymbol postfix={fee.amount} /> : `${fee.amount} ${fee.currency}`;
      case PAYWALL.FIAT: {
        const rentalSeconds = fiatRentalExpiration.value * (TO_SECONDS[fiatRentalExpiration.unit] || 3600);
        return (
          <>
            {fiatPurchaseEnabled && fiatPurchaseFee && (
              <div className="publish-summary__price-row">
                <Icon icon={ICONS.BUY} />
                {__('Purchase for %currency%%amount%', {
                  currency: STRIPE.CURRENCY[fiatPurchaseFee.currency].symbol,
                  amount: fiatPurchaseFee.amount,
                })}
              </div>
            )}
            {fiatRentalEnabled && fiatRentalFee && (
              <div className="publish-summary__price-row">
                <Icon icon={ICONS.TIME} />
                {__('Rent %duration% for %currency%%amount%', {
                  duration: secondsToDhms(rentalSeconds),
                  currency: STRIPE.CURRENCY[fiatRentalFee.currency].symbol,
                  amount: fiatRentalFee.amount,
                })}
              </div>
            )}
          </>
        );
      }
      default:
        return __('Free');
    }
  }

  function getVisibility() {
    switch (visibility) {
      case 'public':
        return __('Public');
      case 'scheduled':
        return __(scheduledShow ? 'Scheduled (Upcoming)' : 'Scheduled');
      case 'unlisted':
        return __('Unlisted');
      default:
        return '';
    }
  }

  function getLicense() {
    if (licenseType === COPYRIGHT) return `© ${otherLicenseDescription}`;
    if (licenseType === OTHER) return `${otherLicenseDescription} — ${licenseUrl}`;
    return licenseType ? __(licenseType) : '';
  }

  const visibleTags = removeInternalTags(tags);

  return (
    <div className="publish-summary">
      <div className="publish-summary__columns">
        <div className="publish-summary__left">
          <h3 className="publish-details__title">{__('Summary')}</h3>
          <table className="table table--condensed table--publish-preview">
            <tbody>
              {createRow(__('Title'), truncate(title, 128))}
              {createRow(
                __('Description'),
                description ? (
                  <div className="publish-summary__description">
                    <MarkdownPreview content={description} simpleLinks />
                  </div>
                ) : null
              )}
              {createRow(
                __('Channel'),
                channel ? (
                  <div className="publish-summary__channel">
                    {channelClaim && (
                      <ChannelThumbnail
                        key={channelClaim.claim_id}
                        xsmall
                        noLazyLoad
                        uri={channelClaim.permanent_url}
                      />
                    )}
                    {channel}
                  </div>
                ) : (
                  <div className="publish-summary__channel">
                    <Icon sectionIcon icon={ICONS.ANONYMOUS} />
                    <i>{__('Anonymous')}</i>
                  </div>
                )
              )}
              {createRow(__('URL'), truncate(uri, 128))}
              {createRow(__('Visibility'), getVisibility())}
              {createRow(__('Price'), getPriceValue(), visibility !== 'public')}
              {createRow(__('Language'), language ? getLanguageName(language) : null)}
              {createRow(__('License'), getLicense())}
              {createRow(__('Deposit'), <LbcSymbol postfix={`${bid || 0.001}`} size={14} />)}
              {memberRestrictionStatus.isRestricting &&
                createRow(
                  __('Restricted to'),
                  myMembershipTiers
                    ?.filter((t: any) => memberRestrictionTierIds.includes(t.membership_id))
                    .map((t: any) => t.name)
                    .join(', ')
                )}
              {visibleTags.length > 0 &&
                createRow(
                  __('Tags'),
                  <div className="publish-summary__tags">
                    {visibleTags.map((tag) => (
                      <Tag key={tag.name} name={tag.name} type="flow" onClick={() => {}} />
                    ))}
                  </div>
                )}
            </tbody>
          </table>
        </div>

        <div className="publish-summary__right">
          <h3 className="publish-details__title">{__('Preview')}</h3>
          <div className="publish-summary__preview-wrap">{previewUri && <ClaimPreviewTile uri={previewUri} />}</div>
        </div>
      </div>
    </div>
  );
}

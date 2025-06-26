// @flow
import React from 'react';
import moment from 'moment';
import type { DoPublishDesktop } from 'redux/actions/publish';

import './style.scss';
import Button from 'component/button';
import { Form, FormField } from 'component/common/form';
import { Modal } from 'modal/modal';
import Card from 'component/common/card';
import Tag from 'component/tag';
import MarkdownPreview from 'component/common/markdown-preview';
import { getLanguageName } from 'constants/languages';
import { COPYRIGHT, OTHER } from 'constants/licenses';
import LbcSymbol from 'component/common/lbc-symbol';
import ChannelThumbnail from 'component/channelThumbnail';
import * as ICONS from 'constants/icons';
import Icon from 'component/common/icon';
import { NO_FILE, PAYWALL } from 'constants/publish';
import * as PUBLISH_TYPES from 'constants/publish_types';
import * as STRIPE from 'constants/stripe';
import { TO_SECONDS } from 'util/stripe';
import { removeInternalTags } from 'util/tags';
import { secondsToDhms } from 'util/time';

type Props = {
  publishPayload: PublishParams,
  previewResponse: PublishResponse,
  // --- internal ---
  type: PublishType,
  liveCreateType: LiveCreateType,
  liveEditType: LiveEditType,
  filePath: string | WebFile,
  optimize: boolean,
  channel: ?string,
  bid: ?number,
  uri: ?string,
  paywall: Paywall,
  fee: Price,
  fiatPurchaseEnabled: boolean,
  fiatPurchaseFee: Price,
  fiatRentalEnabled: boolean,
  fiatRentalFee: Price,
  fiatRentalExpiration: Duration,
  language: string,
  releaseTime: ?number,
  licenseType: string,
  otherLicenseDescription: ?string,
  licenseUrl: ?string,
  tags: Array<Tag>,
  isVid: boolean,
  ffmpegStatus: any,
  publish: DoPublishDesktop,
  closeModal: () => void,
  enablePublishPreview: boolean,
  setEnablePublishPreview: (boolean) => void,
  isStillEditing: boolean,
  myChannels: ?Array<ChannelClaim>,
  // publishSuccess: boolean,
  publishing: boolean,
  isLivestreamClaim: boolean,
  remoteFile: ?string,
  myMembershipTiers: MembershipTiers,
  memberRestrictionTierIds: Array<number>,
  memberRestrictionStatus: MemberRestrictionStatus,
  visibility: Visibility,
  scheduledShow: boolean,
};

// class ModalPublishPreview extends React.PureComponent<Props> {
const ModalPublishPreview = (props: Props) => {
  const {
    publishPayload: payload,
    previewResponse,

    type,
    liveCreateType,
    liveEditType,
    optimize,
    channel,
    bid,
    uri,
    paywall,
    fee,

    fiatPurchaseEnabled,
    fiatPurchaseFee,
    fiatRentalEnabled,
    fiatRentalFee,
    fiatRentalExpiration,

    language,
    releaseTime: rtStore,
    licenseType,
    otherLicenseDescription,
    licenseUrl,
    tags,
    isVid,
    ffmpegStatus = {},
    enablePublishPreview,
    setEnablePublishPreview,
    isStillEditing,
    myChannels,
    // publishSuccess,
    publishing,
    publish,
    closeModal,
    isLivestreamClaim,
    myMembershipTiers,
    memberRestrictionTierIds,
    memberRestrictionStatus,
    visibility,
    scheduledShow,
  } = props;

  const { description, file_path: filePath, remote_url, release_time: rtPayload, title } = payload;

  const releaseTimeInfo = React.useMemo(() => {
    return {
      userEntered: rtStore !== undefined,
      value: rtPayload,
      valueIsInFuture: rtPayload && moment(rtPayload * 1000).isAfter(),
    };
  }, [rtPayload, rtStore]);

  const livestream =
    (uri && isLivestreamClaim) ||
    //   $FlowFixMe
    (previewResponse?.outputs[0] && previewResponse.outputs[0].value && !previewResponse.outputs[0].value.source);
  // leave the confirm modal up if we're not going straight to upload/reflecting

  const formattedTitle = truncateWithEllipsis(title, 128);
  const formattedUri = truncateWithEllipsis(uri, 128);
  const txFee = previewResponse ? previewResponse['total_fee'] : null;
  const isOptimizeAvail = filePath && filePath !== '' && isVid && ffmpegStatus.available;
  const modalTitle = getModalTitle();
  const confirmBtnText = getConfirmButtonText();

  assert(
    !memberRestrictionStatus.isApplicable || memberRestrictionStatus.isSelectionValid,
    'Something wrong:',
    memberRestrictionStatus
  );

  // **************************************************************************
  // **************************************************************************

  function createRow(label: string, value: any, hide?: boolean) {
    return hide ? null : (
      <tr>
        <td>{label}</td>
        <td>{value}</td>
      </tr>
    );
  }

  function truncateWithEllipsis(str, maxChars) {
    if (str && str.length > maxChars) {
      return str.slice(0, maxChars).trim() + '...';
    }
    return str;
  }

  function getFilePathName(filePath: ?string | WebFile) {
    if (!filePath) {
      return NO_FILE;
    }

    if (typeof filePath === 'string') {
      return filePath;
    } else {
      return filePath.name;
    }
  }

  function getModalTitle() {
    if (isStillEditing) {
      if (livestream || isLivestreamClaim) {
        return __('Confirm Update');
      } else {
        return __('Confirm Edit');
      }
    } else if (livestream || isLivestreamClaim || remote_url) {
      return releaseTimeInfo.valueIsInFuture
        ? __('Schedule Livestream')
        : (!livestream || !isLivestreamClaim) && remote_url
        ? __('Publish Replay')
        : __('Create Livestream');
    } else if (type === PUBLISH_TYPES.POST) {
      return __('Confirm Post');
    } else {
      return __('Confirm Upload');
    }
  }

  function getConfirmButtonText() {
    if (!publishing) {
      return __('Confirm');
    } else {
      return __('Confirming...');
    }
  }

  function getDescription() {
    return description ? (
      <div className="media__info-text-preview">
        <MarkdownPreview content={description} simpleLinks />
      </div>
    ) : null;
  }

  function getLicense() {
    return licenseType === COPYRIGHT ? (
      <p>© {otherLicenseDescription}</p>
    ) : licenseType === OTHER ? (
      <p>
        {otherLicenseDescription}
        <br />
        {licenseUrl}
      </p>
    ) : (
      <p>{__(licenseType)}</p>
    );
  }

  function getDeposit() {
    return bid ? <LbcSymbol postfix={`${bid}`} size={14} /> : <p>---</p>;
  }

  function getPriceLabel() {
    if (paywall === PAYWALL.FIAT) {
      return `${__('Price')} *`;
    }
    return __('Price');
  }

  function getPriceValue() {
    switch (paywall) {
      case PAYWALL.FREE:
        return __('Free');

      case PAYWALL.SDK:
        if (fee.currency === 'LBC') {
          return <LbcSymbol postfix={fee.amount} />;
        } else {
          return `${fee.amount} ${fee.currency}`;
        }

      case PAYWALL.FIAT:
        const rentalSeconds = fiatRentalExpiration.value * (TO_SECONDS[fiatRentalExpiration.unit] || 3600);
        return (
          <>
            {fiatPurchaseEnabled && fiatPurchaseFee && (
              <div className="publish-preview__fiat-price">
                <Icon icon={ICONS.BUY} />
                <p>
                  {__('Purchase for %currency%%amount%', {
                    currency: STRIPE.CURRENCY[fiatPurchaseFee.currency].symbol,
                    amount: fiatPurchaseFee.amount,
                  })}
                </p>
              </div>
            )}
            {fiatRentalEnabled && fiatRentalFee && fiatRentalExpiration && (
              <div className="publish-preview__fiat-price">
                <Icon icon={ICONS.TIME} />
                <p>
                  {__('Rent %duration% for %currency%%amount%', {
                    duration: secondsToDhms(rentalSeconds),
                    currency: STRIPE.CURRENCY[fiatRentalFee.currency].symbol,
                    amount: fiatRentalFee.amount,
                  })}
                </p>
              </div>
            )}
          </>
        );

      default:
        console.error(`Unhandled paywall type: ${paywall}`); // eslint-disable-line no-console
        return '?';
    }
  }

  function getTagsValue(tags) {
    const visibleTags = removeInternalTags(tags);
    return visibleTags.map((tag) => (
      <Tag
        key={tag.name}
        title={tag.name}
        name={tag.name}
        type="flow"
        onClick={() => {}} // Do nothing. Don't set to null since that results in "View Tag" action.
      />
    ));
  }

  function getChannelValue(channel) {
    const channelClaim = myChannels && myChannels.find((x) => x.name === channel);
    return channel ? (
      <div className="channel-value">
        {channelClaim && <ChannelThumbnail xsmall noLazyLoad uri={channelClaim.permanent_url} />}
        {channel}
      </div>
    ) : (
      <div className="channel-value">
        <Icon sectionIcon icon={ICONS.ANONYMOUS} />
        <i>{__('Anonymous')}</i>
      </div>
    );
  }

  function getReleaseTimeLabel() {
    return releaseTimeInfo.valueIsInFuture ? __('Scheduled for') : __('Release date');
  }

  function getReleaseTimeValue() {
    if (releaseTimeInfo.value) {
      return moment(new Date(releaseTimeInfo.value * 1000)).format('LLL');
    } else {
      return '';
    }
  }

  function getTierRestrictionValue() {
    if (hideTierRestrictions()) {
      return null;
    }

    return (
      <div className="publish-preview__tier-restrictions">
        {myMembershipTiers.map((tier: MembershipTier) => {
          const tierId = tier?.membership_id || '0';
          const tierSelected = memberRestrictionTierIds.includes(tierId);

          return tierSelected ? (
            <FormField
              key={tierId}
              name={tierId}
              type="checkbox"
              defaultChecked
              label={tier?.name || tierId}
            />
          ) : (
            <div key={tierId} className="dummy-tier" />
          );
        })}
      </div>
    );
  }

  function hideTierRestrictions() {
    return !memberRestrictionStatus.isRestricting;
  }

  function getVisibilityValue() {
    switch (visibility) {
      case 'public':
        return __('Public');
      case 'scheduled':
        return __(scheduledShow ? 'Scheduled (show in Upcoming section)' : 'Scheduled (hide from Upcoming section)');
      case 'unlisted':
        return __('Unlisted');
      default:
        assert(false);
        return '';
    }
  }

  function getReplayValue() {
    // Include both to detect errors visually
    return `${__(filePath ? getFilePathName(filePath) : '')}${__(remote_url ? 'Remote File Selected' : '')}`;
  }

  function hideReplayRow() {
    const show =
      type === 'livestream' &&
      (liveCreateType === 'choose_replay' || (liveCreateType === 'edit_placeholder' && liveEditType !== 'update_only'));
    return !show;
  }

  function onConfirmed() {
    // Publish for real:
    publish(getFilePathName(filePath), false);
    // @if TARGET='app'
    closeModal();
    // @endif
  }

  // **************************************************************************
  // **************************************************************************

  // @if TARGET='web'
  /*
  React.useEffect(() => {
    if (publishing && !livestream) {
      closeModal();
    } else if (publishSuccess) {
      closeModal();
    }
  }, [publishSuccess, publishing, livestream, closeModal]);
  // @endif
 */
  // **************************************************************************
  // **************************************************************************

  return (
    <Modal isOpen contentLabel={modalTitle} type="card" onAborted={closeModal}>
      <Form onSubmit={onConfirmed}>
        <Card
          title={modalTitle}
          body={
            <>
              <div className="section">
                <table className="table table--condensed table--publish-preview">
                  <tbody>
                    {!livestream && type !== PUBLISH_TYPES.POST && createRow(__('File'), getFilePathName(filePath))}
                    {createRow(__('Replay'), getReplayValue(), hideReplayRow())}
                    {isOptimizeAvail && createRow(__('Transcode'), optimize ? __('Yes') : __('No'))}
                    {createRow(__('Title'), formattedTitle)}
                    {createRow(__('Description'), getDescription())}
                    {createRow(__('Channel'), getChannelValue(channel))}
                    {createRow(__('URL'), formattedUri)}
                    {createRow(__('Deposit'), getDeposit())}
                    {createRow(getPriceLabel(), getPriceValue(), visibility !== 'public')}
                    {createRow(__('Language'), language ? getLanguageName(language) : '')}
                    {createRow(__('Visibility'), getVisibilityValue())}
                    {createRow(getReleaseTimeLabel(), getReleaseTimeValue(), !releaseTimeInfo.userEntered)}
                    {createRow(__('License'), getLicense())}
                    {createRow(__('Restricted to'), getTierRestrictionValue(), hideTierRestrictions())}
                    {createRow(__('Tags'), getTagsValue(tags))}
                  </tbody>
                </table>
              </div>
              {paywall === PAYWALL.FIAT && (
                <div className="publish-preview__fee-footnote">{`* ${__('processing and platform fees apply')}`}</div>
              )}
              {txFee && (
                <div className="publish-preview__blockchain-fee" aria-label={__('Estimated transaction fee:')}>
                  <b>{__('Est. transaction fee:')}</b>&nbsp;&nbsp;
                  <em>
                    <LbcSymbol postfix={txFee} />
                  </em>
                </div>
              )}
            </>
          }
          actions={
            <>
              <div className="section__actions">
                <Button autoFocus button="primary" disabled={publishing} label={confirmBtnText} onClick={onConfirmed} />
                <Button button="link" label={__('Cancel')} onClick={closeModal} />
              </div>
              <p className="help">{__('Once the transaction is sent, it cannot be reversed.')}</p>
              <FormField
                type="checkbox"
                name="sync_toggle"
                label={__('Skip preview and confirmation')}
                checked={!enablePublishPreview}
                onChange={() => setEnablePublishPreview(!enablePublishPreview)}
              />
            </>
          }
        />
      </Form>
    </Modal>
  );
};

export default ModalPublishPreview;

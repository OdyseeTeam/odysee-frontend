// @flow

import 'scss/component/_comment-create.scss';

import { buildValidSticker } from 'util/comments';
import { FF_MAX_CHARS_IN_COMMENT, FF_MAX_CHARS_IN_LIVESTREAM_COMMENT } from 'constants/form-field';
import { FormField, Form } from 'component/common/form';
import { Lbryio } from 'lbryinc';
import { SIMPLE_SITE } from 'config';
import { useHistory } from 'react-router';
import * as ICONS from 'constants/icons';
import * as KEYCODES from 'constants/keycodes';
import * as PAGES from 'constants/pages';
import * as MODALS from 'constants/modal_types';
import * as STRIPE from 'constants/stripe';
import Button from 'component/button';
import classnames from 'classnames';
import CommentSelectors, { SELECTOR_TABS } from './comment-selectors';
import React from 'react';
import type { ElementRef } from 'react';
import usePersistedState from 'effects/use-persisted-state';
import WalletTipAmountSelector from 'component/walletTipAmountSelector';
import { useIsMobile } from 'effects/use-screensize';
import { StickerReviewBox, StickerActionButton } from './sticker-contents';
import { TipReviewBox, TipActionButton } from './tip-contents';
import { FormChannelSelector, HelpText } from './extra-contents';

import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

const TAB_FIAT = 'TabFiat';
const TAB_LBC = 'TabLBC';

type TipParams = { tipAmount: number, tipChannelName: string, channelClaimId: string };
type UserParams = { activeChannelName: ?string, activeChannelId: ?string };

type Props = {
  activeChannelClaimId?: string,
  activeChannelName?: string,
  activeChannelUrl?: string,
  bottom: boolean,
  hasChannels: boolean,
  claimId?: string,
  channelClaimId?: string,
  tipChannelName?: string,
  claimIsMine: boolean,
  embed?: boolean,
  isFetchingChannels: boolean,
  isNested: boolean,
  isReply: boolean,
  isLivestream?: boolean,
  parentId: string,
  settingsByChannelId: { [channelId: string]: PerChannelSettings },
  shouldFetchComment: boolean,
  supportDisabled: boolean,
  uri: string,
  disableInput?: boolean,
  canReceiveFiatTips: ?boolean,
  onSlimInputClose?: () => void,
  setQuickReply: (any) => void,
  onCancelReplying?: () => void,
  onDoneReplying?: () => void,
  // redux
  doCommentCreate: (uri: string, isLivestream?: boolean, params: CommentSubmitParams) => Promise<any>,
  doFetchCreatorSettings: (channelId: string) => Promise<any>,
  doToast: ({ message: string }) => void,
  doCommentById: (commentId: string, toastIfNotFound: boolean) => Promise<any>,
  doSendCashTip: (
    TipParams,
    anonymous: boolean,
    UserParams,
    claimId: string,
    stripe: ?string,
    preferredCurrency: string,
    (any) => void
  ) => string,
  doSendTip: (
    params: {},
    isSupport: boolean,
    successCb: (any) => void,
    errorCb: (any) => void,
    boolean,
    string
  ) => void,
  doOpenModal: (id: string, any) => void,
  preferredCurrency: string,
  myChannelClaimIds: ?Array<string>,
  myCommentedChannelIds: ?Array<string>,
  doFetchMyCommentedChannels: (claimId: ?string) => void,
  doTipAccountCheckForUri: (uri: string) => void,
  textInjection?: string,
};

export function CommentCreate(props: Props) {
  const {
    activeChannelClaimId,
    activeChannelName,
    activeChannelUrl,
    bottom,
    hasChannels,
    claimId,
    channelClaimId,
    tipChannelName,
    claimIsMine,
    embed,
    isFetchingChannels,
    isNested,
    isReply,
    isLivestream,
    parentId,
    settingsByChannelId,
    shouldFetchComment,
    supportDisabled,
    uri,
    disableInput,
    canReceiveFiatTips,
    onSlimInputClose,
    doCommentCreate,
    doFetchCreatorSettings,
    doToast,
    doCommentById,
    onCancelReplying,
    onDoneReplying,
    doSendCashTip,
    doSendTip,
    setQuickReply,
    doOpenModal,
    preferredCurrency,
    myChannelClaimIds,
    myCommentedChannelIds,
    doFetchMyCommentedChannels,
    doTipAccountCheckForUri,
    textInjection,
  } = props;

  const isMobile = useIsMobile();

  const formFieldRef: ElementRef<any> = React.useRef();
  const buttonRef: ElementRef<any> = React.useRef();
  const slimInputButtonRef: ElementRef<any> = React.useRef();

  const {
    push,
    location: { pathname },
  } = useHistory();

  const [isSubmitting, setSubmitting] = React.useState(false);
  const [commentFailure, setCommentFailure] = React.useState(false);
  const [successTip, setSuccessTip] = React.useState({ txid: undefined, tipAmount: undefined });
  const [tipSelectorOpen, setTipSelector] = React.useState();
  const [isReviewingSupportComment, setReviewingSupportComment] = React.useState();
  const [isReviewingStickerComment, setReviewingStickerComment] = React.useState();
  const [selectedSticker, setSelectedSticker] = React.useState();
  const [tipAmount, setTipAmount] = React.useState(1);
  const [convertedAmount, setConvertedAmount] = React.useState();
  const [commentValue, setCommentValue] = React.useState('');
  const [advancedEditor, setAdvancedEditor] = usePersistedState('comment-editor-mode', false);
  const [activeTab, setActiveTab] = React.useState();
  const [tipError, setTipError] = React.useState();
  const [deletedComment, setDeletedComment] = React.useState(false);
  const [showSelectors, setShowSelectors] = React.useState({ tab: undefined, open: false });
  const [disableReviewButton, setDisableReviewButton] = React.useState();
  const [exchangeRate, setExchangeRate] = React.useState();
  const [tipModalOpen, setTipModalOpen] = React.useState(undefined);

  const charCount = commentValue ? commentValue.length : 0;
  const hasNothingToSumbit = !commentValue.length && !selectedSticker;
  const disabled = deletedComment || isSubmitting || isFetchingChannels || hasNothingToSumbit || disableInput;
  const channelSettings = channelClaimId ? settingsByChannelId[channelClaimId] : undefined;
  const minSuper = (channelSettings && channelSettings.min_tip_amount_super_chat) || 0;
  const minTip = (channelSettings && channelSettings.min_tip_amount_comment) || 0;
  const minAmount = minTip || minSuper || 0;
  const minAmountMet = activeTab !== TAB_LBC || minAmount === 0 || tipAmount >= minAmount;
  const stickerPrice = selectedSticker && selectedSticker.price;
  const tipSelectorError = tipError || disableReviewButton;
  const fiatIcon = STRIPE.CURRENCY[preferredCurrency].icon;

  const minAmountRef = React.useRef(minAmount);
  minAmountRef.current = minAmount;

  const addEmoteToComment = React.useCallback((emote: string) => {
    setCommentValue((prev) => prev + (prev && prev.charAt(prev.length - 1) !== ' ' ? ` ${emote} ` : `${emote} `));
  }, []);

  const handleSelectSticker = React.useCallback(
    (sticker: any) => {
      // $FlowFixMe
      setSelectedSticker(sticker);
      setReviewingStickerComment(true);
      setTipAmount(sticker.price || 0);
      setShowSelectors((prev) => ({ tab: prev.tab || undefined, open: false }));

      // added this here since selecting a sticker can cause scroll issues
      if (onSlimInputClose) onSlimInputClose();

      if (sticker.price && sticker.price > 0) {
        setActiveTab(canReceiveFiatTips ? TAB_FIAT : TAB_LBC);
        setTipSelector(true);
      }
    },
    [canReceiveFiatTips, onSlimInputClose]
  );

  const commentSelectorsProps = React.useMemo(() => {
    return {
      claimIsMine,
      addEmoteToComment,
      handleSelectSticker,
      isOpen: showSelectors.open,
      openTab: showSelectors.tab || undefined,
    };
  }, [claimIsMine, addEmoteToComment, handleSelectSticker, showSelectors.open, showSelectors.tab]);

  const submitButtonProps = { button: 'primary', type: 'submit', requiresAuth: true };
  const actionButtonProps = { button: 'alt' };
  const tipButtonProps = {
    ...actionButtonProps,
    disabled: !commentValue.length && !selectedSticker,
    tipSelectorOpen,
    activeTab,
    onClick: handleSelectTipComment,
  };
  const cancelButtonProps = { button: 'link', label: __('Cancel') };
  const stickerReviewProps = {
    activeChannelUrl,
    src: selectedSticker ? selectedSticker.url : '',
    price: selectedSticker ? selectedSticker.price : 0,
    exchangeRate,
  };

  const commentSelectorElem = React.useMemo(
    () => (
      <CommentSelectors
        {...commentSelectorsProps}
        closeSelector={() => setShowSelectors((prev) => ({ tab: prev.tab || undefined, open: false }))}
      />
    ),
    [commentSelectorsProps]
  );

  // **************************************************************************
  // Functions
  // **************************************************************************

  function handleSelectTipComment(tab: string) {
    setActiveTab(tab);

    if (isMobile) {
      setTipModalOpen(true);
      doOpenModal(MODALS.SEND_TIP, {
        uri,
        isTipOnly: true,
        hasSelectedTab: tab,
        customText: __('Preview Comment Tip'),
        setAmount: (amount) => {
          setTipAmount(amount);
          setReviewingSupportComment(true);
        },
      });
    } else {
      setTipSelector(true);
    }

    if (onSlimInputClose) onSlimInputClose();
  }

  function handleStickerComment() {
    if (selectedSticker) {
      setReviewingStickerComment(false);
      setSelectedSticker(undefined);
      setShowSelectors({ tab: SELECTOR_TABS.STICKER, open: true });
    } else {
      setShowSelectors({ tab: showSelectors.tab || undefined, open: !showSelectors.open });
    }

    setTipSelector(false);
  }

  function handleCancelSticker() {
    setReviewingStickerComment(false);
    setSelectedSticker(null);
    setShowSelectors({ tab: undefined, open: false });
    if (onSlimInputClose) onSlimInputClose();
  }

  function handleCancelSupport() {
    if (!isReviewingSupportComment) setTipSelector(false);
    setReviewingSupportComment(false);

    if (stickerPrice) {
      setReviewingStickerComment(false);
      setShowSelectors({ tab: showSelectors.tab || undefined, open: false });
      setSelectedSticker(null);
    }

    if (onSlimInputClose) onSlimInputClose();
  }

  function handleSupportComment() {
    if (!activeChannelClaimId) return;

    if (!channelClaimId) {
      doToast({
        message: __('Unable to verify channel settings. Try refreshing the page.'),
        isError: true,
      });
      return;
    }

    // if comment post didn't work, but tip was already made, try again to create comment
    if (commentFailure && tipAmount === successTip.tipAmount) {
      handleCreateComment(successTip.txid);
      return;
    } else {
      setSuccessTip({ txid: undefined, tipAmount: undefined });
    }

    // !! Beware of stale closure when editing the then-block, including doSubmitTip().
    doFetchCreatorSettings(channelClaimId).then(() => {
      const lockedMinAmount = minAmount; // value during closure.
      const currentMinAmount = minAmountRef.current; // value from latest doFetchCreatorSettings().

      if (lockedMinAmount !== currentMinAmount) {
        doToast({
          message: __('The creator just updated the minimum setting. Please revise or double-check your tip amount.'),
          isError: true,
        });
        setReviewingSupportComment(false);
        return;
      }

      doSubmitTip();
    });
  }

  function doSubmitTip() {
    if (!claimId || !channelClaimId || !activeChannelName || !activeChannelClaimId || isSubmitting || !tipChannelName) {
      return;
    }

    setSubmitting(true);

    const params = { amount: tipAmount, claim_id: claimId, channel_id: activeChannelClaimId };

    if (activeTab === TAB_LBC) {
      // call doSendTip and then run the callback from the response
      // second parameter is callback
      doSendTip(
        params,
        false,
        (response) => {
          const { txid } = response;
          // todo: why the setTimeout?
          setTimeout(() => {
            handleCreateComment(txid);
          }, 1500);

          doToast({
            message: __('Tip successfully sent.'),
            subMessage: __("I'm sure they appreciate it!"),
            linkText: `${tipAmount} LBC ⇒ ${tipChannelName}`, // force show decimal places
            linkTarget: `/${PAGES.WALLET}?tab=fiat-payment-history`,
          });

          setSuccessTip({ txid, tipAmount });
        },
        () => {
          // reset the frontend so people can send a new comment
          setSubmitting(false);
        },
        false,
        'comment'
      );
    } else {
      const tipParams: TipParams = { tipAmount: Math.round(tipAmount * 100) / 100, tipChannelName, channelClaimId };
      const userParams: UserParams = { activeChannelName, activeChannelId: activeChannelClaimId };

      doSendCashTip(
        tipParams,
        false,
        userParams,
        claimId,
        stripeEnvironment,
        preferredCurrency,
        (customerTipResponse) => {
          const { payment_intent_id } = customerTipResponse;

          handleCreateComment(null, payment_intent_id, stripeEnvironment);

          setCommentValue('');
          setReviewingSupportComment(false);
          setTipSelector(false);
          setCommentFailure(false);
          setSubmitting(false);
        }
      );
    }
  }

  /**
   *
   * @param {string} [txid] Optional transaction id generated by
   * @param {string} [payment_intent_id] Optional payment_intent_id from Stripe payment
   * @param {string} [environment] Optional environment for Stripe (test|live)
   */
  function handleCreateComment(txid, payment_intent_id, environment) {
    if (isSubmitting || disableInput || !claimId) return;

    setSubmitting(true);

    const stickerValue = selectedSticker && buildValidSticker(selectedSticker.name);

    doCommentCreate(uri, isLivestream, {
      comment: stickerValue || commentValue,
      claim_id: claimId,
      parent_id: parentId,
      txid,
      payment_intent_id,
      environment,
      sticker: !!stickerValue,
    })
      .then((res) => {
        setSubmitting(false);
        if (setQuickReply) setQuickReply(res);

        if (res && res.signature) {
          if (!stickerValue) setCommentValue('');
          setReviewingSupportComment(false);
          setTipSelector(false);
          setCommentFailure(false);

          if (onDoneReplying) {
            onDoneReplying();
          }
        }
      })
      .catch(() => {
        setSubmitting(false);
        setCommentFailure(true);

        if (channelClaimId) {
          // It could be that the creator added a minimum tip setting.
          // Manually update for now until a websocket msg is available.
          doFetchCreatorSettings(channelClaimId);
        }
      });
  }

  function handleSubmitSticker() {
    if (isReviewingSupportComment) {
      handleSupportComment();
    } else {
      handleCreateComment();
    }

    setSelectedSticker(null);
    setReviewingStickerComment(false);
    setShowSelectors({ tab: showSelectors.tab || undefined, open: false });
    setTipSelector(false);
  }

  // **************************************************************************
  // Effects
  // **************************************************************************

  // Fetch channel constraints if not already.
  React.useEffect(() => {
    if (!channelSettings && channelClaimId) {
      doFetchCreatorSettings(channelClaimId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // change sticker selection
  React.useEffect(() => {
    if (isMobile && showSelectors.tab && slimInputButtonRef && slimInputButtonRef.current) {
      slimInputButtonRef.current.click();
    }
  }, [isMobile, showSelectors.tab]);

  // Notifications: Fetch top-level comments to identify if it has been deleted and can reply to it
  React.useEffect(() => {
    if (shouldFetchComment && doCommentById) {
      doCommentById(parentId, false).then((result) => {
        setDeletedComment(String(result).includes('Error'));
      });
    }
  }, [doCommentById, shouldFetchComment, parentId]);

  // Stickers: Get LBC-USD exchange rate if hasn't yet and selected a paid sticker
  React.useEffect(() => {
    if (stickerPrice && !exchangeRate) Lbryio.getExchangeRates().then(({ LBC_USD }) => setExchangeRate(LBC_USD));
  }, [exchangeRate, stickerPrice]);

  React.useEffect(() => {
    if (canReceiveFiatTips === undefined) {
      doTipAccountCheckForUri(uri);
    }
  }, [canReceiveFiatTips, doTipAccountCheckForUri, uri]);

  // Handle keyboard shortcut comment creation
  React.useEffect(() => {
    function altEnterListener(e: SyntheticKeyboardEvent<*>) {
      const inputRef = formFieldRef && formFieldRef.current && formFieldRef.current.input;

      if (inputRef && inputRef.current === document.activeElement) {
        // $FlowFixMe
        const isTyping = Boolean(e.target.attributes['typing-term']);

        if (((isLivestream && !isTyping) || e.ctrlKey || e.metaKey) && e.keyCode === KEYCODES.ENTER) {
          e.preventDefault();
          buttonRef.current.click();
        }

        if (isLivestream && isTyping && e.keyCode === KEYCODES.ENTER) {
          inputRef.current.removeAttribute('typing-term');
        }
      }
    }

    window.addEventListener('keydown', altEnterListener);

    // removes the listener so it doesn't cause problems elsewhere in the app
    return () => {
      window.removeEventListener('keydown', altEnterListener);
    };
  }, [isLivestream]);

  // Determine my channels that have commented
  React.useEffect(() => {
    if (myCommentedChannelIds === undefined && claimId && myChannelClaimIds) {
      doFetchMyCommentedChannels(claimId);
    }
  }, [claimId, myCommentedChannelIds, myChannelClaimIds]);

  React.useEffect(() => {
    if (textInjection) {
      setCommentValue(
        commentValue === ''
          ? commentValue + textInjection + ' '
          : commentValue.substring(commentValue.length - 1) === ' '
          ? commentValue + textInjection + ' '
          : commentValue + ' ' + textInjection + ' '
      );
      // $FlowFixMe
      return formFieldRef?.current?.input?.current?.focus();
    }
  }, [textInjection]);

  // **************************************************************************
  // Render
  // **************************************************************************

  if (!isFetchingChannels && !hasChannels) {
    return (
      <div
        role="button"
        className="comment-create__auth"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();

          if (embed) {
            window.open(`https://odysee.com/$/${PAGES.AUTH}?redirect=/$/${PAGES.LIVESTREAM}`);
            return;
          }

          const pathPlusRedirect = `/$/${PAGES.CHANNEL_NEW}?redirect=${pathname}`;
          if (isLivestream) {
            window.open(pathPlusRedirect);
          } else {
            push(pathPlusRedirect);
          }
        }}
      >
        <FormField
          type="textarea"
          name="comment__signup-prompt"
          placeholder={__('Say something about this...')}
          disabled={isMobile}
        />

        {!isMobile && (
          <div className="section__actions--no-margin">
            <Button disabled button="primary" label={__('Send --[button to submit something]--')} requiresAuth />
          </div>
        )}
      </div>
    );
  }

  return (
    <Form
      onSubmit={() => {}}
      className={classnames('commentCreate', {
        'commentCreate--reply': isReply,
        'commentCreate--nestedReply': isNested,
        'commentCreate--bottom': bottom,
      })}
    >
      {isReviewingSupportComment ? (
        activeChannelUrl &&
        activeTab && (
          <TipReviewBox
            activeChannelUrl={activeChannelUrl}
            tipAmount={tipAmount}
            activeTab={activeTab}
            message={commentValue}
            isReviewingStickerComment={isReviewingStickerComment}
            stickerPreviewComponent={selectedSticker && <StickerReviewBox {...stickerReviewProps} />}
          />
        )
      ) : selectedSticker ? (
        activeChannelUrl && <StickerReviewBox {...stickerReviewProps} />
      ) : (
        <>
          <FormField
            autoFocus={isReply}
            charCount={charCount}
            className={isReply ? 'create__reply' : 'create__comment'}
            disabled={isFetchingChannels || disableInput}
            isLivestream={isLivestream}
            label={<FormChannelSelector isReply={Boolean(isReply)} isLivestream={Boolean(isLivestream)} />}
            noticeLabel={
              isMobile && (
                <HelpText deletedComment={deletedComment} minAmount={minAmount} minSuper={minSuper} minTip={minTip} />
              )
            }
            name={isReply ? 'create__reply' : 'create__comment'}
            onChange={(e) => setCommentValue(SIMPLE_SITE || !advancedEditor || isReply ? e.target.value : e)}
            handleTip={(isLBC) => handleSelectTipComment(isLBC ? TAB_LBC : TAB_FIAT)}
            handleSubmit={handleCreateComment}
            slimInput={isMobile && uri} // "uri": make sure it's on a file page
            slimInputButtonRef={slimInputButtonRef}
            onSlimInputClose={onSlimInputClose}
            commentSelectorsProps={commentSelectorsProps}
            submitButtonRef={buttonRef}
            setShowSelectors={setShowSelectors}
            showSelectors={showSelectors}
            tipModalOpen={tipModalOpen}
            placeholder={__('Say something about this...')}
            quickActionHandler={!SIMPLE_SITE ? () => setAdvancedEditor(!advancedEditor) : undefined}
            quickActionLabel={
              !SIMPLE_SITE && (isReply ? undefined : advancedEditor ? __('Simple Editor') : __('Advanced Editor'))
            }
            ref={formFieldRef}
            textAreaMaxLength={isLivestream ? FF_MAX_CHARS_IN_LIVESTREAM_COMMENT : FF_MAX_CHARS_IN_COMMENT}
            type={!SIMPLE_SITE && advancedEditor && !isReply ? 'markdown' : 'textarea'}
            value={commentValue}
            uri={uri}
          />
          {!isMobile && commentSelectorElem}
        </>
      )}

      {(!isMobile || isReviewingStickerComment) && (tipSelectorOpen || (isReviewingStickerComment && stickerPrice)) && (
        <WalletTipAmountSelector
          activeTab={activeTab}
          amount={tipAmount}
          uri={uri}
          convertedAmount={convertedAmount}
          customTipAmount={stickerPrice}
          exchangeRate={exchangeRate}
          fiatConversion={selectedSticker && !!selectedSticker.price}
          onChange={(amount) => setTipAmount(amount)}
          setConvertedAmount={setConvertedAmount}
          setDisableSubmitButton={setDisableReviewButton}
          setTipError={setTipError}
          tipError={tipError}
        />
      )}

      {(!isMobile || isReviewingStickerComment || isReviewingSupportComment) && (
        <div className="section__actions">
          {/* Submit Button */}
          {isReviewingSupportComment ? (
            <Button
              {...submitButtonProps}
              autoFocus
              disabled={disabled || !minAmountMet}
              label={
                isSubmitting
                  ? __('Sending...')
                  : commentFailure && tipAmount === successTip.tipAmount
                  ? __('Re-submit')
                  : __('Send')
              }
              onClick={handleSupportComment}
            />
          ) : tipSelectorOpen ? (
            <Button
              {...submitButtonProps}
              disabled={disabled || tipSelectorError || !minAmountMet}
              icon={activeTab === TAB_LBC ? ICONS.LBC : fiatIcon}
              label={__('Review')}
              onClick={() => {
                setReviewingSupportComment(true);
                if (onSlimInputClose) onSlimInputClose();
              }}
            />
          ) : (
            (!isMobile || selectedSticker) &&
            (!minTip || claimIsMine) && (
              <Button
                {...submitButtonProps}
                ref={buttonRef}
                disabled={disabled}
                label={
                  isLivestream
                    ? isSubmitting
                      ? __('Sending...')
                      : __('Send --[button to send chat message]--')
                    : isReply
                    ? isSubmitting
                      ? __('Replying...')
                      : __('Reply')
                    : isSubmitting
                    ? __('Commenting...')
                    : __('Comment --[button to submit something]--')
                }
                onClick={() => (selectedSticker ? handleSubmitSticker() : handleCreateComment())}
              />
            )
          )}

          {(!isMobile || isReviewingStickerComment) && (
            <>
              <StickerActionButton
                {...actionButtonProps}
                isReviewingStickerComment={isReviewingStickerComment}
                icon={ICONS.STICKER}
                onClick={handleStickerComment}
                onChange={() => {}}
              />

              {!supportDisabled && !claimIsMine && (
                <>
                  <TipActionButton {...tipButtonProps} name={__('Credits')} icon={ICONS.LBC} tab={TAB_LBC} />

                  {stripeEnvironment && (
                    <TipActionButton {...tipButtonProps} name={__('Cash')} icon={fiatIcon} tab={TAB_FIAT} />
                  )}
                </>
              )}
            </>
          )}

          {tipSelectorOpen || isReviewingSupportComment ? (
            <Button {...cancelButtonProps} disabled={isSubmitting} onClick={handleCancelSupport} />
          ) : isReviewingStickerComment ? (
            <Button {...cancelButtonProps} onClick={handleCancelSticker} />
          ) : (
            onCancelReplying && <Button {...cancelButtonProps} onClick={onCancelReplying} />
          )}

          <HelpText deletedComment={deletedComment} minAmount={minAmount} minSuper={minSuper} minTip={minTip} />
        </div>
      )}
      <div className="chat-resize">
        <div />
        <div />
        <div />
      </div>
    </Form>
  );
}

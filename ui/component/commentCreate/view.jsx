// @flow
import React from 'react';
import type { ElementRef } from 'react';
import { buildValidSticker } from 'util/comments';
import { FF_MAX_CHARS_IN_COMMENT, FF_MAX_CHARS_IN_LIVESTREAM_COMMENT } from 'constants/form-field';
import { FormField, Form } from 'component/common/form';
import { Lbryio } from 'lbryinc';
import { SIMPLE_SITE, ENABLE_STRIPE, ENABLE_ARCONNECT } from 'config';
import { useHistory } from 'react-router';
import * as ICONS from 'constants/icons';
import * as KEYCODES from 'constants/keycodes';
import * as PAGES from 'constants/pages';
import * as MODALS from 'constants/modal_types';
import * as STRIPE from 'constants/stripe';
import Button from 'component/button';
import classnames from 'classnames';
import CommentSelectors, { SELECTOR_TABS } from './internal/comment-selectors';
import usePersistedState from 'effects/use-persisted-state';
import WalletTipAmountSelector from 'component/walletTipAmountSelector';
import { useIsMobile } from 'effects/use-screensize';
import { StickerReviewBox, StickerActionButton } from './internal/sticker-contents';
import { TipReviewBox, TipActionButton } from './internal/tip-contents';
import { FormChannelSelector, HelpText } from './internal/extra-contents';
import ErrorBubble from 'component/common/error-bubble';
import { AppContext } from 'component/app/view';
import withCreditCard from 'hocs/withCreditCard';
import { getStripeEnvironment } from 'util/stripe';
import { TAB_LBC, TAB_USDC, TAB_FIAT, TAB_USD, TAB_BOOST } from 'constants/tip_tabs';
import './style.lazy.scss';

const stripeEnvironment = getStripeEnvironment();

type TipParams = { tipAmount: number, tipChannelName: string, channelClaimId: string };
type ArTipParams = {
  tipAmountTwoPlaces: number,
  tipChannelName: string,
  channelClaimId: string,
  recipientAddress: string,
  currency: string,
};

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
  isFetchingCreatorSettings: boolean,
  isNested: boolean,
  isReply: boolean,
  isLivestream?: boolean,
  parentId: string,
  channelSettings: ?PerChannelSettings,
  shouldFetchComment: boolean,
  supportDisabled: boolean,
  uri: string,
  disableInput?: boolean,
  recipientArweaveTipInfo: any,
  arweaveStatus: any,
  experimentalUi: boolean,
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
  doArTip: (
    ArTipParams,
    anonymous: boolean,
    UserParams,
    claimId: string,
    stripe: ?string,
    preferredCurrency: string,
    (any) => void
  ) => void,
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
  chatCommentsRestrictedToChannelMembers: boolean,
  isAChannelMember: boolean,
  commentSettingDisabled: ?boolean,
  userHasMembersOnlyChatPerk: boolean,
  isLivestreamChatMembersOnly: boolean,
  areCommentsMembersOnly: boolean,
  hasPremiumPlus: boolean,
};

export function CommentCreate(props: Props) {
  const {
    // chatCommentsRestrictedToChannelMembers,
    activeChannelClaimId,
    activeChannelName,
    activeChannelUrl,
    bottom,
    recipientArweaveTipInfo,
    arweaveStatus,
    experimentalUi,
    channelClaimId,
    claimId,
    claimIsMine,
    disableInput,
    doCommentById,
    doCommentCreate,
    doFetchCreatorSettings,
    doFetchMyCommentedChannels,
    doOpenModal,
    doSendCashTip,
    doSendTip,
    doArTip,
    doTipAccountCheckForUri,
    doToast,
    embed,
    hasChannels,
    isFetchingChannels,
    isFetchingCreatorSettings,
    isLivestream,
    isNested,
    isReply,
    myChannelClaimIds,
    myCommentedChannelIds,
    onCancelReplying,
    onDoneReplying,
    onSlimInputClose,
    parentId,
    preferredCurrency,
    setQuickReply,
    channelSettings,
    shouldFetchComment,
    supportDisabled,
    textInjection,
    tipChannelName,
    uri,
    commentSettingDisabled,
    userHasMembersOnlyChatPerk,
    isLivestreamChatMembersOnly,
    areCommentsMembersOnly,
    hasPremiumPlus,
  } = props;

  const showArweave = ENABLE_ARCONNECT && experimentalUi;
  const fileUri = React.useContext(AppContext)?.uri;

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

  const arweaveTipEnabled = recipientArweaveTipInfo && recipientArweaveTipInfo.status === 'active';

  const charCount = commentValue ? commentValue.length : 0;
  const hasNothingToSumbit = !commentValue.length && !selectedSticker;
  const disabled =
    commentSettingDisabled ||
    deletedComment ||
    isSubmitting ||
    isFetchingChannels ||
    isFetchingCreatorSettings ||
    hasNothingToSumbit ||
    (activeTab === TAB_USDC && !arweaveTipEnabled) ||
    disableInput;
  const minSuper = (channelSettings && channelSettings.min_tip_amount_super_chat) || 0;
  const minTip = (channelSettings && channelSettings.min_tip_amount_comment) || 0;
  const minUSDCSuper = (channelSettings && channelSettings.min_usdc_tip_amount_super_chat) || 0;
  const minUSDCTip = (channelSettings && channelSettings.min_usdc_tip_amount_comment) || 0;
  const minAmount = minTip || minSuper || 0;
  const minUSDCAmount = minUSDCTip || minUSDCSuper || 0;
  const minAmountMet =
    (activeTab !== TAB_LBC && activeTab !== TAB_FIAT && !minTip && !minUSDCTip) ||
    (activeTab === TAB_LBC && tipAmount >= minAmount) ||
    (activeTab === TAB_FIAT && tipAmount >= minUSDCAmount) ||
    (activeTab === TAB_USD && tipAmount >= minUSDCAmount);
  const stickerPrice = selectedSticker && selectedSticker.price;
  const tipSelectorError = tipError || disableReviewButton;
  const fiatIcon = STRIPE.CURRENCY[preferredCurrency].icon;

  const minAmountRef = React.useRef(minAmount);
  minAmountRef.current = minAmount;
  const minUSDCAmountRef = React.useRef(minUSDCAmount);
  minUSDCAmountRef.current = minUSDCAmount;

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
        setActiveTab(recipientArweaveTipInfo ? TAB_FIAT : TAB_LBC);
        setTipSelector(true);
      }
    },
    [recipientArweaveTipInfo, onSlimInputClose]
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

  function isRestrictedToMembersOnly() {
    const isAnonymous = claimId && !channelClaimId;
    if (isAnonymous) {
      return false;
    }

    return (
      channelClaimId &&
      doFetchCreatorSettings(channelClaimId)
        .then((cs: SettingsResponse) => (isLivestream ? cs.livestream_chat_members_only : cs.comments_members_only))
        .catch(() => undefined)
    );
  }

  function handleJoinMembersOnlyChat() {
    return doOpenModal(MODALS.JOIN_MEMBERSHIP, { uri, fileUri });
  }

  function handleSelectTipComment(tab: string) {
    setActiveTab(tab);

    if (isMobile) {
      setTipModalOpen(true);
      doOpenModal(MODALS.SEND_TIP, {
        uri,
        isTipOnly: true,
        hasSelectedTab: tab,
        customText: __('Preview Comment Tip'),
        setAmount: (amount, activeTab) => {
          setActiveTab(activeTab);
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

  function handleImageUpload() {
    doOpenModal(MODALS.IMAGE_UPLOAD, {
      onUpdate: (imageUrl, imageTitle) => updateComment(imageUrl, imageTitle),
      assetName: __('Image'),
    });
  }

  function updateComment(imageUrl, imageTitle) {
    if (!imageTitle) imageTitle = '';
    let markdown = `![${imageTitle}](${imageUrl})`;
    setCommentValue((prev) => prev + (prev && prev.charAt(prev.length - 1) !== ' ' ? ` ${markdown} ` : `${markdown} `));
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

  async function handleSupportComment() {
    if (!activeChannelClaimId) return;

    if (!channelClaimId) {
      doToast({
        message: __('Unable to verify channel settings. Try refreshing the page.'),
        isError: true,
      });
      return;
    }

    // do another creator settings fetch here to make sure that on submit, the setting did not change
    const commentsAreMembersOnly = await isRestrictedToMembersOnly();
    if (commentsAreMembersOnly === undefined) {
      doToast({
        message: __('Unable to send the comment.'),
        subMessage: __('Try again later, or refresh the page.'),
        isError: true,
      });
      return;
    }

    if (notAuthedToLiveChat && commentsAreMembersOnly) return handleJoinMembersOnlyChat();

    // if comment post didn't work, but tip was already made, try again to create comment
    if (commentFailure && tipAmount === successTip.tipAmount) {
      handleCreateComment(successTip.txid);
      return;
    } else {
      setSuccessTip({ txid: undefined, tipAmount: undefined });
    }

    // !! Beware of stale closure when editing the then-block, including doSubmitTip().
    doFetchCreatorSettings(channelClaimId)
      .then(() => {
        const lockedMinAmount = minAmount; // value during closure.
        const currentMinAmount = minAmountRef.current; // value from latest doFetchCreatorSettings().

        const lockedMinUSDCAmount = minUSDCAmount; // value during closure.
        const currentMinUSDCAmount = minUSDCAmountRef.current; // value from latest doFetchCreatorSettings().

        if (
          (activeTab === TAB_LBC && lockedMinAmount !== currentMinAmount) ||
          (activeTab === TAB_FIAT && lockedMinUSDCAmount !== currentMinUSDCAmount)
        ) {
          doToast({
            message: __('The creator just updated the minimum setting. Please revise or double-check your tip amount.'),
            isError: true,
          });
          setReviewingSupportComment(false);
          return;
        }

        // look, this is crazy complex. I just put the dry run inside doSendTip() for USDC instead of here.
        if (activeTab === TAB_USDC || activeTab === TAB_USD) {
          doSubmitTip();
          return;
        }
        // DryRun comment creation before submitting the tip
        handleCreateComment(undefined, undefined, undefined, undefined, true).then((res) => {
          if (res !== 'success') {
            setSubmitting(false);
            return;
          }
          doSubmitTip();
        });
      })
      .catch(() => {
        doToast({
          message: __('Unable to send the comment.'),
          subMessage: __('Try again later, or refresh the page.'),
          isError: true,
        });
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
    } else if (activeTab === TAB_USDC || activeTab === TAB_USD) {
      const arweaveTipAddress = recipientArweaveTipInfo && recipientArweaveTipInfo.address;
      const transactionCurrency = activeTab === TAB_USD ? 'AR' : 'USD';
      const tipParams: ArTipParams = {
        tipAmountTwoPlaces: Math.round(tipAmount * 100) / 100,
        tipChannelName,
        channelClaimId,
        recipientAddress: arweaveTipAddress,
        currency: transactionCurrency,
      };
      const userParams: UserParams = { activeChannelName, activeChannelId: activeChannelClaimId };

      const anonymous = false;
      // dryrun comment
      const dryRunCommentParams = {
        comment: commentValue,
        claim_id: claimId,
        parent_id: parentId,
        txid: 'dummy_txid',
        payment_tx_id: 'dummy_txid',
        environment: stripeEnvironment,
        is_protected: Boolean(isLivestreamChatMembersOnly || areCommentsMembersOnly),
        amount: 1, // dummy amount
        currency: transactionCurrency, // AR
        dry_run: true,
      };
      doCommentCreate(uri, isLivestream, dryRunCommentParams)
        .then((res: { }) => {
          if (res && res.signature) {
            // tell apis about a tip, get a token and amount
            // make transaction
            // notify transaction id
            doArTip(tipParams, anonymous, userParams, claimId, stripeEnvironment)
              .then((arTipResponse: { transferTxid: string, currency: string, referenceToken: string, error?: string }) => {
                if (arTipResponse.error) {
                  throw new Error(arTipResponse.error);
                }
                const { transferTxid } = arTipResponse;
                const params = Object.assign({}, dryRunCommentParams);
                params.payment_tx_id = transferTxid;
                params.dryrun = undefined;
                params.amount = tipAmount; // dollars

                // ...
                handleCreateComment(null, null, transferTxid, stripeEnvironment);
                setCommentValue('');
                setReviewingSupportComment(false);
                setTipSelector(false);
                setCommentFailure(false);
                setSubmitting(false);
              })
              .catch((e) => {
                // do the error handling
                doToast({
                  message: __('Tip failed to send.'),
                  subMessage: e?.message || e,
                  isError: true,
                });
                console.log('doartip e', e);
              });
          }
        })
        .catch((e) => {
          doToast({
            message: __('Comment failed to send.'),
            subMessage: e?.message || e,
            isError: true,
          });
          console.log('do commentcreate e', e);
        });
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
          handleCreateComment(null, payment_intent_id, null, stripeEnvironment);
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
   * @param {string} [payment_tx_id] Optional payment_tx_id from Arweave payment
   * @param {string} [environment] Optional environment for Stripe (test|live)
   * @param {boolean} [dryRun] Optional flag to simulate the comment creation
   */
  async function handleCreateComment(txid, payment_intent_id, payment_tx_id, environment, dryRun = false) {
    if (isSubmitting || disableInput || !claimId) return;

    // do another creator settings fetch here to make sure that on submit, the setting did not change
    const commentsAreMembersOnly = await isRestrictedToMembersOnly();
    if (commentsAreMembersOnly === undefined) {
      doToast({
        message: __('Unable to send the comment.'),
        subMessage: __('Try again later, or refresh the page.'),
        isError: true,
      });
      return;
    }

    if (notAuthedToLiveChat && commentsAreMembersOnly) return handleJoinMembersOnlyChat();

    setSubmitting(true);

    const stickerValue = selectedSticker && buildValidSticker(selectedSticker.name);

    if (dryRun) {
      if (activeTab === TAB_LBC) {
        txid = 'dummy_txid';
      } else if (activeTab === TAB_FIAT) {
        payment_intent_id = 'dummy_payment_intent_id';
      }
    }

    return doCommentCreate(uri, isLivestream, {
      comment: stickerValue || commentValue,
      claim_id: claimId,
      parent_id: parentId,
      txid,
      payment_intent_id,
      payment_tx_id,
      environment,
      sticker: !!stickerValue,
      is_protected: Boolean(isLivestreamChatMembersOnly || areCommentsMembersOnly),
      amount: !!txid || !!payment_intent_id || !!payment_tx_id ? tipAmount : undefined,
      currency: activeTab === TAB_LBC ? 'LBC' : activeTab === TAB_FIAT ? 'USDC' : activeTab === TAB_USD ? 'AR' : undefined,
      dry_run: dryRun,
    })
      .then((res) => {
        setSubmitting(false);
        if (dryRun) {
          return res.comment_id ? 'success' : 'fail';
        }
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
        if (dryRun) {
          return;
        }
        setCommentFailure(true);

        if (channelClaimId) {
          // It could be that the creator added a minimum tip setting.
          // Manually update for now until a websocket msg is available.
          doFetchCreatorSettings(channelClaimId).catch(() => {});
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
      doFetchCreatorSettings(channelClaimId).catch(() => {});
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
    if (recipientArweaveTipInfo === undefined) {
      doTipAccountCheckForUri(uri);
    }
  }, [recipientArweaveTipInfo, doTipAccountCheckForUri, uri]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [textInjection]);

  const notAuthedToLiveChat = Boolean(
    (isLivestream ? isLivestreamChatMembersOnly : areCommentsMembersOnly) && !userHasMembersOnlyChatPerk && !claimIsMine
  );

  let commentLabelText = 'Say something about this...';
  if (notAuthedToLiveChat) {
    commentLabelText = 'The creator has made this chat members-only';
  }

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
          placeholder={__(commentLabelText)}
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
    <>
      {notAuthedToLiveChat && (
        <ErrorBubble
          title={
            isLivestream ? __('This chat is in members-only mode') : __('This comment section is in members-only mode')
          }
          className="comment-restriction"
          subtitle={__(
            'To participate, consider buying a membership with the members-only chat perk from this creator!'
          )}
          action={<Button button="primary" label={__('Join')} onClick={handleJoinMembersOnlyChat} />}
        />
      )}

      <Form
        onSubmit={() => {}}
        className={classnames('comment-create', {
          'comment-create--reply': isReply,
          'comment-create--nestedReply': isNested,
          'comment-create--bottom': bottom,
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
              className={classnames('', {
                create__reply: isReply,
                create__comment: !isReply,
                disabled_chat_comments: notAuthedToLiveChat,
              })}
              disabled={isFetchingChannels || disableInput}
              isLivestream={isLivestream}
              label={<FormChannelSelector isReply={Boolean(isReply)} isLivestream={Boolean(isLivestream)} />}
              noticeLabel={
                (isMobile || isLivestream) && (
                  <HelpText
                    deletedComment={deletedComment}
                    minAmount={minAmount}
                    minSuper={minSuper}
                    minTip={minTip}
                    minUSDCAmount={minUSDCAmount}
                    minUSDCSuper={minUSDCSuper}
                    minUSDCTip={minUSDCTip}
                  />
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
              placeholder={__(commentLabelText)}
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

        {(!isMobile || isReviewingStickerComment) &&
          (tipSelectorOpen || (isReviewingStickerComment && stickerPrice)) && (
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
              isComment
            />
          )}

        {(!isMobile || isReviewingStickerComment || isReviewingSupportComment) && (
          <div className="section__actions">
            {/* Submit Button */}
            {isReviewingSupportComment && (
              <>
                {activeTab === TAB_LBC && (
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
                )}
                {(activeTab === TAB_USDC || activeTab === TAB_USD) && (
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
                )}
                {activeTab === TAB_FIAT && (
                  <SubmitCashTipButton
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
                )}
              </>
            )}
            {!isReviewingSupportComment && (
              <>
                {tipSelectorOpen ? (
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
                  <>
                    {(!isMobile || selectedSticker) && ((!minTip && !minUSDCTip) || claimIsMine) && (
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
                        onClick={() =>
                          selectedSticker
                            ? handleSubmitSticker()
                            : handleCreateComment(undefined, undefined, undefined, undefined)
                        }
                      />
                    )}
                  </>
                )}
              </>
            )}

            {(!isMobile || isReviewingStickerComment) && (
              <>
                <StickerActionButton
                  {...actionButtonProps}
                  isReviewingStickerComment={isReviewingStickerComment}
                  icon={ICONS.STICKER}
                  onClick={handleStickerComment}
                  onChange={() => {}}
                  disabled={notAuthedToLiveChat}
                />

                {hasPremiumPlus && !isLivestream && (
                  <Button
                    button="alt"
                    icon={ICONS.IMAGE}
                    title={__('Upload Image')}
                    onClick={handleImageUpload}
                    onChange={() => {}}
                  />
                )}

                {!supportDisabled && !claimIsMine && (
                  <>
                    {showArweave && (
                      // <TipActionButton {...tipButtonProps} name={__('USDC')} icon={ICONS.USDC} tab={TAB_USDC} />
                      <TipActionButton {...tipButtonProps} name={__('AR')} icon={ICONS.USD} tab={TAB_USD} />
                    )}
                    <TipActionButton {...tipButtonProps} name={__('LBC')} icon={ICONS.LBC} tab={TAB_LBC} />
                    {false && stripeEnvironment && (
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
            {!isLivestream && (
              <HelpText
                deletedComment={deletedComment}
                minAmount={minAmount}
                minSuper={minSuper}
                minTip={minTip}
                minUSDCAmount={minUSDCAmount}
                minUSDCSuper={minUSDCSuper}
                minUSDCTip={minUSDCTip}
              />
            )}
          </div>
        )}
        <div className="chat-resize">
          <div />
          <div />
          <div />
        </div>
      </Form>
    </>
  );
}

const SubmitCashTipButton = withCreditCard((props: any) => <Button {...props} />);

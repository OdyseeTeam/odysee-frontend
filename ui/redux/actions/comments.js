// @flow
import * as ACTIONS from 'constants/action_types';
import * as REACTION_TYPES from 'constants/reactions';
import * as PAGES from 'constants/pages';
import { LocalStorage } from 'util/storage';
import { SORT_BY, BLOCK_LEVEL } from 'constants/comment';
import Lbry from 'lbry';
import { resolveApiMessage } from 'util/api-message';
import { parseURI, buildURI, isURIEqual } from 'util/lbryURI';
import { devToast, dispatchToast, doFailedSignatureToast } from 'util/toast-wrappers';
import {
  selectClaimForUri,
  selectClaimsById,
  selectClaimsByUri,
  selectMyChannelClaims,
  selectClaimForClaimId,
  selectProtectedContentTagForUri,
} from 'redux/selectors/claims';
import { doResolveUris, doClaimSearch, doResolveClaimIds } from 'redux/actions/claims';
import { doToast, doSeeNotifications } from 'redux/actions/notifications';
import {
  selectMyReactsForComment,
  selectOthersReactsForComment,
  selectPendingCommentReacts,
  selectModerationBlockList,
  selectModerationDelegatorsById,
  selectMyCommentedChannelIdsForId,
  selectLivestreamChatMembersOnlyForChannelId,
  selectMembersOnlyCommentsForChannelId,
  selectSettingsForChannelId,
} from 'redux/selectors/comments';
import { makeSelectNotificationForCommentId } from 'redux/selectors/notifications';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { toHex } from 'util/hex';
import { getChannelFromClaim } from 'util/claim';
import Comments from 'comments';
import { selectPrefsReady } from 'redux/selectors/sync';
import { doAlertWaitingForSync } from 'redux/actions/app';

import { getStripeEnvironment } from 'util/stripe';
const stripeEnvironment = getStripeEnvironment();

const FETCH_API_FAILED_TO_FETCH = 'Failed to fetch';
const PROMISE_FULFILLED = 'fulfilled';

const MENTION_REGEX = /(?:^| |\n)@[^\s=&#$@%?:;/"<>%{}|^~[]*(?::[\w]+)?/gm;

export function doCommentList(
  uri: string,
  parentId: ?string,
  page: number = 1,
  pageSize: number = 99999,
  sortBy: ?number = SORT_BY.NEWEST,
  isLivestream?: boolean
) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const claim = selectClaimForUri(state, uri);
    const myChannelClaims = selectMyChannelClaims(state);
    const { claim_id: claimId } = claim || {};

    if (!claimId) {
      return dispatch({ type: ACTIONS.COMMENT_LIST_FAILED, data: 'unable to find claim for uri' });
    }

    dispatch({ type: ACTIONS.COMMENT_LIST_STARTED, data: { parentId } });

    const activeChannelClaim = selectActiveChannelClaim(state);
    const activeChannelId = activeChannelClaim?.claim_id;
    const isProtected = Boolean(selectProtectedContentTagForUri(state, uri));

    // Adding 'channel_id' and 'channel_name' enables "CreatorSettings > commentsEnabled".
    const creatorChannelClaim = getChannelFromClaim(claim);
    const { claim_id: creatorClaimId, name: channelName } = creatorChannelClaim || {};

    let channelSignature = {};
    let myChannelClaim;
    if (isProtected) {
      if (!myChannelClaims) {
        return dispatch({ type: ACTIONS.COMMENT_LIST_FAILED, data: __('Failed to fetch channel list.') });
      }

      myChannelClaim = myChannelClaims.find((x) => x.claim_id === activeChannelId);
      if (!myChannelClaim) {
        return dispatch({ type: ACTIONS.COMMENT_LIST_FAILED, data: __('You do not own this channel.') });
      }

      channelSignature = await ChannelSign.sign(myChannelClaim.claim_id, myChannelClaim.name, true);
      if (!channelSignature) {
        console.error('Failed to sign channel name.'); // eslint-disable-line
        return;
      }
    }

    return Comments.comment_list({
      page,
      claim_id: claimId,
      page_size: pageSize,
      parent_id: parentId,
      top_level: !parentId,
      channel_id: creatorClaimId,
      channel_name: channelName,
      sort_by: sortBy,
      ...(isProtected
        ? {
            is_protected: true, // in case undefined is passed
            requestor_channel_id: activeChannelId, // typo (requestor vs requester) is on backend atm
            requestor_channel_name: myChannelClaim?.name,
            signature: channelSignature.signature,
            signing_ts: channelSignature.signing_ts,
            environment: stripeEnvironment,
          }
        : {}),
    })
      .then((result: CommentListResponse) => {
        const { items: comments, total_items, total_filtered_items, total_pages } = result;

        const returnResult = () => {
          dispatch({
            type: ACTIONS.COMMENT_LIST_COMPLETED,
            data: {
              comments,
              parentId,
              totalItems: total_items,
              totalFilteredItems: total_filtered_items,
              totalPages: total_pages,
              claimId,
              uri,
            },
          });
          return result;
        };

        // Batch resolve comment authors
        const commentChannelIds = comments && comments.map((comment) => comment.channel_id || '');
        if (commentChannelIds && !isLivestream) {
          return dispatch(doResolveClaimIds(commentChannelIds)).finally(() => returnResult());
        }

        return returnResult();
      })
      .catch((error) => {
        const { message } = error;

        switch (message) {
          case 'comments are disabled by the creator':
            return dispatch({ type: ACTIONS.COMMENT_LIST_COMPLETED, data: { disabled: true } });
          case 'channel does not have permissions to comment on this claim':
            return dispatch({ type: ACTIONS.COMMENT_LIST_COMPLETED, data: { disabled: true } });
          case FETCH_API_FAILED_TO_FETCH:
            dispatch(doToast({ isError: true, message: __('Failed to fetch comments.') }));
            return dispatch({ type: ACTIONS.COMMENT_LIST_FAILED, data: error });
          default:
            dispatch(doToast({ isError: true, message: `${message}` }));
            dispatch({ type: ACTIONS.COMMENT_LIST_FAILED, data: error });
        }
      });
  };
}

export function doCommentListOwn(
  channelId: string,
  page: number = 1,
  pageSize: number = 10,
  sortBy: number = SORT_BY.NEWEST_NO_PINS
) {
  assert(pageSize <= 50, `claim_search can't resolve > 50 (pageSize=${pageSize})`);

  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const myChannelClaims = selectMyChannelClaims(state);
    if (!myChannelClaims) {
      console.error('Failed to fetch channel list.'); // eslint-disable-line
      return;
    }

    const channelClaim = myChannelClaims.find((x) => x.claim_id === channelId);
    if (!channelClaim) {
      console.error('You do not own this channel.'); // eslint-disable-line
      return;
    }

    const channelSignature = await ChannelSign.sign(channelClaim.claim_id, channelClaim.name, true);
    if (!channelSignature) {
      console.error('Failed to sign channel name.'); // eslint-disable-line
      return;
    }

    dispatch({
      type: ACTIONS.COMMENT_LIST_STARTED,
      data: {},
    });

    return Comments.comment_list({
      page,
      page_size: pageSize,
      sort_by: sortBy,
      author_claim_id: channelId,
      requestor_channel_name: channelClaim.name,
      requestor_channel_id: channelClaim.claim_id,
      signature: channelSignature.signature,
      signing_ts: channelSignature.signing_ts,
    })
      .then((result: CommentListResponse) => {
        const { items: comments, total_items, total_filtered_items, total_pages } = result;

        if (!comments) {
          dispatch({ type: ACTIONS.COMMENT_LIST_FAILED, data: 'No more comments.' });
          return;
        }

        dispatch(
          doClaimSearch({
            page: 1,
            page_size: pageSize,
            no_totals: true,
            claim_ids: comments.map((c) => c.claim_id),
          })
        )
          .then((result) => {
            dispatch({
              type: ACTIONS.COMMENT_LIST_COMPLETED,
              data: {
                comments,
                totalItems: total_items,
                totalFilteredItems: total_filtered_items,
                totalPages: total_pages,
                uri: channelClaim.canonical_url, // hijack Discussion Page ¹
                claimId: channelClaim.claim_id, // hijack Discussion Page ¹
              },
              // ¹ Comments are currently stored in an object with the key being
              // the content claim_id; so as a quick solution, we are using the
              // channel's claim_id to store Own Comments, which is the same way
              // as Discussion Page. This idea works based on the assumption
              // that both Own Comments and Discussion will never appear
              // simultaneously.
            });
          })
          .catch((err) => {
            dispatch({ type: ACTIONS.COMMENT_LIST_FAILED, data: err });
          });
      })
      .catch((error) => {
        switch (error.message) {
          case FETCH_API_FAILED_TO_FETCH:
            dispatch(
              doToast({
                isError: true,
                message: __('Failed to fetch comments.'),
              })
            );
            dispatch(doToast({ isError: true, message: `${error.message}` }));
            dispatch({ type: ACTIONS.COMMENT_LIST_FAILED, data: error });
            break;

          default:
            dispatch(doToast({ isError: true, message: `${error.message}` }));
            dispatch({ type: ACTIONS.COMMENT_LIST_FAILED, data: error });
        }
      });
  };
}

export function doCommentById(commentId: string, toastIfNotFound: boolean = true) {
  return (dispatch: Dispatch, getState: GetState) => {
    dispatch({
      type: ACTIONS.COMMENT_BY_ID_STARTED,
    });

    return Comments.comment_by_id({ comment_id: commentId, with_ancestors: true })
      .then((result: CommentByIdResponse) => {
        const { item, items, ancestors } = result;

        dispatch({
          type: ACTIONS.COMMENT_BY_ID_COMPLETED,
          data: {
            comment: item || items, // Requested a change to rename it to 'item'. This covers both.
            ancestors: ancestors,
          },
        });

        return result;
      })
      .catch((error) => {
        const ID_NOT_FOUND_REGEX = /^comment for id (.*) could not be found$/;
        if (ID_NOT_FOUND_REGEX.test(error.message) && toastIfNotFound) {
          dispatch(
            doToast({
              isError: true,
              message: __('The requested comment is no longer available.'),
            })
          );
        } else {
          devToast(dispatch, error.message);
        }

        return error;
      });
  };
}

export function doFetchMyCommentedChannels(claimId: ?string) {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const myChannelClaims = selectMyChannelClaims(state);
    const contentClaimId = claimId;

    if (!contentClaimId || !myChannelClaims) {
      return;
    }

    return Promise.all(myChannelClaims.map((x) => ChannelSign.sign(x.claim_id, x.name, true))).then((signatures) => {
      const params = [];
      const commentedChannelIds = [];

      signatures.forEach((signature, i) => {
        if (signature !== undefined && signature !== null) {
          params.push({
            page: 1,
            page_size: 1,
            claim_id: contentClaimId,
            author_claim_id: myChannelClaims[i].claim_id,
            requestor_channel_name: myChannelClaims[i].name,
            requestor_channel_id: myChannelClaims[i].claim_id,
            signature: signature.signature,
            signing_ts: signature.signing_ts,
          });
        }
      });

      // $FlowFixMe
      return Promise.allSettled(params.map((p) => Comments.comment_list(p)))
        .then((response) => {
          for (let i = 0; i < response.length; ++i) {
            if (response[i].status !== 'fulfilled') {
              // Meaningless if it couldn't confirm history for all own channels.
              return;
            }

            if (response[i].value.total_items > 0) {
              commentedChannelIds.push(params[i].author_claim_id);
            }
          }

          dispatch({
            type: ACTIONS.COMMENT_FETCH_MY_COMMENTED_CHANNELS_COMPLETE,
            data: { contentClaimId, commentedChannelIds },
          });
        })
        .catch((err) => {
          assert(false, 'doFetchMyCommentedChannels failed', err);
        });
    });
  };
}

export function doCommentReset(claimId: string) {
  return (dispatch: Dispatch) => {
    if (!claimId) {
      console.error(`Failed to reset comments`); //eslint-disable-line
      return;
    }

    dispatch({
      type: ACTIONS.COMMENT_LIST_RESET,
      data: {
        claimId,
      },
    });
  };
}

export function doHyperChatList(uri: string) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const claim = selectClaimsByUri(state)[uri];
    const claimId = claim ? claim.claim_id : null;

    if (!claimId) {
      console.error('No claimId found for uri: ', uri); //eslint-disable-line
      return;
    }

    const myChannelClaims = selectMyChannelClaims(state);
    const activeChannelClaim = selectActiveChannelClaim(state);
    const activeChannelId = activeChannelClaim?.claim_id;
    const isProtected = Boolean(selectProtectedContentTagForUri(state, uri));

    let channelSignature = {};
    let myChannelClaim;
    if (isProtected) {
      if (!myChannelClaims) {
        return dispatch({ type: ACTIONS.COMMENT_LIST_FAILED, data: __('Failed to fetch channel list.') });
      }

      myChannelClaim = myChannelClaims.find((x) => x.claim_id === activeChannelId);
      if (!myChannelClaim) {
        return dispatch({ type: ACTIONS.COMMENT_LIST_FAILED, data: __('You do not own this channel.') });
      }

      channelSignature = await ChannelSign.sign(myChannelClaim.claim_id, myChannelClaim.name, true);
      if (!channelSignature) {
        console.error('Failed to sign channel name.'); // eslint-disable-line
        return;
      }
    }

    dispatch({
      type: ACTIONS.COMMENT_SUPER_CHAT_LIST_STARTED,
    });

    return Comments.super_list({
      claim_id: claimId,
      is_protected: isProtected || undefined,
      ...(isProtected
        ? {
            is_protected: true, // in case undefined is passed
            requestor_channel_id: activeChannelId, // typo (requestor vs requester) is on backend atm
            requestor_channel_name: myChannelClaim?.name,
            signature: channelSignature.signature,
            signing_ts: channelSignature.signing_ts,
            environment: stripeEnvironment,
          }
        : {}),
    })
      .then((result: SuperListResponse) => {
        const { items: comments, total_amount: totalAmount } = result;
        dispatch({
          type: ACTIONS.COMMENT_SUPER_CHAT_LIST_COMPLETED,
          data: {
            comments,
            totalAmount,
            uri: uri,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: ACTIONS.COMMENT_SUPER_CHAT_LIST_FAILED,
          data: error,
        });
      });
  };
}

export function doCommentReactList(commentIds: Array<string>) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const activeChannelClaim = selectActiveChannelClaim(state);

    dispatch({
      type: ACTIONS.COMMENT_REACTION_LIST_STARTED,
    });

    const params: ReactionListParams = {
      comment_ids: commentIds.join(','),
    };

    if (activeChannelClaim) {
      const signatureData = await ChannelSign.sign(activeChannelClaim.claim_id, activeChannelClaim.name, true);
      if (!signatureData) {
        return dispatch(doToast({ isError: true, message: __('Unable to verify your channel. Please try again.') }));
      }

      params.channel_name = activeChannelClaim.name;
      params.channel_id = activeChannelClaim.claim_id;
      params.signature = signatureData.signature;
      params.signing_ts = signatureData.signing_ts;
    }

    return Comments.reaction_list(params)
      .then((result: ReactionListResponse) => {
        const { my_reactions: myReactions, others_reactions: othersReactions } = result;
        dispatch({
          type: ACTIONS.COMMENT_REACTION_LIST_COMPLETED,
          data: {
            myReactions,
            othersReactions,
            channelId: activeChannelClaim ? activeChannelClaim.claim_id : undefined,
            commentIds,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: ACTIONS.COMMENT_REACTION_LIST_FAILED,
          data: error,
        });
      });
  };
}

function doFetchAllReactionsForId(commentIds: Array<string>, channelClaims: ?Array<Claim>) {
  const commentIdsCsv = commentIds.join(',');

  if (!channelClaims || channelClaims.length === 0) {
    return Promise.reject(null);
  }

  return Promise.all(channelClaims.map((x) => ChannelSign.sign(x.claim_id, x.name, true)))
    .then((channelSignatures) => {
      const params = [];
      channelSignatures.forEach((sigData, i) => {
        if (sigData !== undefined && sigData !== null) {
          params.push({
            comment_ids: commentIdsCsv,
            // $FlowFixMe: null 'channelClaims' already handled at the top
            channel_name: channelClaims[i].name,
            // $FlowFixMe: null 'channelClaims' already handled at the top
            channel_id: channelClaims[i].claim_id,
            signature: sigData.signature,
            signing_ts: sigData.signing_ts,
          });
        }
      });

      // $FlowFixMe
      return Promise.allSettled(params.map((p) => Comments.reaction_list(p))).then((response) => {
        const results = [];

        response.forEach((res, i) => {
          if (res.status === 'fulfilled') {
            results.push({
              myReactions: res.value.my_reactions,
              // othersReactions: res.value.others_reactions,
              // commentIds,
              channelId: params[i].channel_id,
              channelName: params[i].channel_name,
            });
          }
        });

        return results;
      });
    })
    .catch((error) => {
      return null;
    });
}

async function getReactedChannelNames(commentId: string, myChannelClaims: ?Array<Claim>) {
  // 1. Fetch reactions for all channels:
  const reactions = await doFetchAllReactionsForId([commentId], myChannelClaims);
  if (reactions) {
    const reactedChannelNames = [];

    // 2. Collect all the channel names that have reacted
    for (let i = 0; i < reactions.length; ++i) {
      const r = reactions[i];
      const myReactions = r.myReactions[commentId];
      const { creator_like, creators_like, ...basicReactions } = myReactions;
      const myReactionValues = Object.values(basicReactions);

      if (myReactionValues.includes(1)) {
        reactedChannelNames.push(r.channelName);
      }
    }

    return reactedChannelNames;
  } else {
    return null;
  }
}

export function doCommentReact(commentId: string, type: string) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const activeChannelClaim = selectActiveChannelClaim(state);
    const pendingReacts = selectPendingCommentReacts(state);
    const notification = makeSelectNotificationForCommentId(commentId)(state);

    if (!activeChannelClaim) {
      console.error('Unable to react to comment. No activeChannel is set.'); // eslint-disable-line
      return;
    }

    if (notification && !notification.is_seen) {
      dispatch(doSeeNotifications([notification.id]));
    }

    const exclusiveTypes = {
      [REACTION_TYPES.LIKE]: REACTION_TYPES.DISLIKE,
      [REACTION_TYPES.DISLIKE]: REACTION_TYPES.LIKE,
    };

    if (pendingReacts.includes(commentId + exclusiveTypes[type]) || pendingReacts.includes(commentId + type)) {
      // ignore dislikes during likes, for example
      return;
    }

    const reactKey = `${commentId}:${activeChannelClaim.claim_id}`;
    const myReacts = (selectMyReactsForComment(state, reactKey) || []).slice();
    const othersReacts = selectOthersReactsForComment(state, reactKey) || {};
    let checkIfAlreadyReacted = false;
    let rejectReaction = false;

    const signatureData = await ChannelSign.sign(activeChannelClaim.claim_id, activeChannelClaim.name, true);
    if (!signatureData) {
      return dispatch(doToast({ isError: true, message: __('Unable to verify your channel. Please try again.') }));
    }

    const params: ReactionReactParams = {
      comment_ids: commentId,
      channel_name: activeChannelClaim.name,
      channel_id: activeChannelClaim.claim_id,
      signature: signatureData.signature,
      signing_ts: signatureData.signing_ts,
      type: type,
    };

    if (myReacts.includes(type)) {
      params['remove'] = true;
      myReacts.splice(myReacts.indexOf(type), 1);
    } else {
      myReacts.push(type);
      if (Object.keys(exclusiveTypes).includes(type)) {
        params['clear_types'] = exclusiveTypes[type];
        if (myReacts.indexOf(exclusiveTypes[type]) !== -1) {
          // Mutually-exclusive toggle:
          myReacts.splice(myReacts.indexOf(exclusiveTypes[type]), 1);
        } else {
          // It's not a mutually-exclusive toggle, so check if we've already
          // reacted from another channel. But the verification could take some
          // time if we have lots of channels, so update the GUI first.
          checkIfAlreadyReacted = true;
        }
      }
    }

    // --- Update the GUI for immediate feedback ---
    dispatch({
      type: ACTIONS.COMMENT_REACT_STARTED,
      data: commentId + type,
    });

    // simulate api return shape: ['like'] -> { 'like': 1 }
    const myReactsObj = myReacts.reduce((acc, el) => {
      acc[el] = 1;
      return acc;
    }, {});

    dispatch({
      type: ACTIONS.COMMENT_REACTION_LIST_COMPLETED,
      data: {
        myReactions: { [reactKey]: myReactsObj },
        othersReactions: { [reactKey]: othersReacts },
      },
    });

    // --- Check if already commented from another channel ---
    if (checkIfAlreadyReacted) {
      const reactedChannelNames = await getReactedChannelNames(commentId, selectMyChannelClaims(state));

      if (!reactedChannelNames) {
        // Couldn't determine. Probably best to just stop the operation.
        dispatch(doToast({ message: __('Unable to react. Please try again later.'), isError: true }));
        rejectReaction = true;
      } else if (reactedChannelNames.length) {
        dispatch(
          doToast({
            message: __('Already reacted to this comment from another channel.'),
            subMessage: reactedChannelNames.join(' • '),
            duration: 'long',
            isError: true,
          })
        );
        rejectReaction = true;
      }
    }

    new Promise((res, rej) => (rejectReaction ? rej('') : res(true)))
      .then(() => {
        return Comments.reaction_react(params);
      })
      .then((result: ReactionReactResponse) => {
        dispatch({
          type: ACTIONS.COMMENT_REACT_COMPLETED,
          data: commentId + type,
        });
      })
      .catch((error) => {
        dispatch({
          type: ACTIONS.COMMENT_REACT_FAILED,
          data: commentId + type,
        });

        const myRevertedReactsObj = myReacts
          .filter((el) => el !== type)
          .reduce((acc, el) => {
            acc[el] = 1;
            return acc;
          }, {});

        dispatch({
          type: ACTIONS.COMMENT_REACTION_LIST_COMPLETED,
          data: {
            myReactions: { [reactKey]: myRevertedReactsObj },
            othersReactions: { [reactKey]: othersReacts },
          },
        });
      });
  };
}

export function doCommentCreate(uri: string, livestream: boolean, params: CommentSubmitParams) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      comment,
      claim_id,
      parent_id,
      txid,
      payment_intent_id,
      payment_tx_id,
      sticker,
      is_protected,
      amount,
      dry_run,
    } = params;

    const state = getState();
    const activeChannelClaim = selectActiveChannelClaim(state);
    const myCommentedChannelIds = selectMyCommentedChannelIdsForId(state, claim_id);
    const mentionedChannels: Array<MentionedChannel> = [];

    const claim = selectClaimForClaimId(state, claim_id);
    const targetClaimId = claim.signing_channel ? claim.signing_channel.claim_id : claim_id; // claim_id is for anonymous content and on channel page comments

    if (!activeChannelClaim) {
      console.error('Unable to create comment. No activeChannel is set.'); // eslint-disable-line
      return;
    }

    if (myCommentedChannelIds === undefined) {
      dispatchToast(
        dispatch,
        __('Failed to perform action.'),
        __('Please wait a while before re-submitting, or try refreshing the page.'),
        'long'
      );
      return;
    }

    const commentChannelChangeCooldown = 1000 * 60 * 30; // 30min
    const channelSwitchCutoffTimestamp = Date.now() - commentChannelChangeCooldown;

    let previousCommenterChannel = LocalStorage.getItem(`commenter_${targetClaimId}`);
    previousCommenterChannel = previousCommenterChannel ? JSON.parse(previousCommenterChannel) : null;
    if (
      previousCommenterChannel &&
      previousCommenterChannel.claim_id !== activeChannelClaim.claim_id &&
      previousCommenterChannel.last_comment_timestamp >= channelSwitchCutoffTimestamp &&
      myCommentedChannelIds &&
      !myCommentedChannelIds.includes(activeChannelClaim.claim_id)
    ) {
      dispatchToast(
        dispatch,
        __('Commenting from multiple channels is not allowed.'),
        previousCommenterChannel.name,
        'long'
      );
      return;
    }

    if (myCommentedChannelIds && myCommentedChannelIds.length) {
      if (!myCommentedChannelIds.includes(activeChannelClaim.claim_id)) {
        const claimById = selectClaimsById(state);
        const commentedChannelNames = myCommentedChannelIds.map((id) => claimById[id]?.name);

        dispatchToast(
          dispatch,
          __('Commenting from multiple channels is not allowed.'),
          commentedChannelNames.join(' • '),
          'long'
        );
        return;
      }
    }

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/matchAll
    // $FlowFixMe
    const mentionMatches = [...comment.matchAll(MENTION_REGEX)];

    if (mentionMatches.length > 0) {
      const mentionUrls = [];

      mentionMatches.forEach((match) => {
        const matchTerm = match[0];
        const mention = matchTerm.substring(matchTerm.indexOf('@'));
        const mentionUri = `lbry://${mention}`;

        if (mention.length === 1) return;

        const claim = selectClaimForUri(state, mentionUri);

        if (claim) {
          mentionedChannels.push({ channel_name: claim.name, channel_id: claim.claim_id });
        } else {
          mentionUrls.push(mentionUri);
        }
      });

      if (mentionUrls.length > 0) {
        await dispatch(doResolveUris(mentionUrls, true))
          .then((response) => {
            Object.values(response).map((claim) => {
              if (claim) {
                // $FlowFixMe
                mentionedChannels.push({ channel_name: claim.name, channel_id: claim.claim_id });
              }
            });
          })
          .catch((e) => {});
      }
    }

    const signatureData = await ChannelSign.sign(activeChannelClaim.claim_id, comment, false);
    if (!signatureData) {
      dispatch(doToast({ isError: true, message: __('Unable to verify your channel. Please try again.') }));
      return;
    }

    if (!dry_run) {
      dispatch({ type: ACTIONS.COMMENT_CREATE_STARTED });
    }

    const notification = parent_id && makeSelectNotificationForCommentId(parent_id)(state);
    if (notification && !notification.is_seen) {
      dispatch(doSeeNotifications([notification.id]));
    }

    return Comments.comment_create({
      comment: comment,
      claim_id: claim_id,
      channel_id: activeChannelClaim.claim_id,
      channel_name: activeChannelClaim.name,
      parent_id: parent_id,
      signature: signatureData.signature,
      signing_ts: signatureData.signing_ts,
      sticker: sticker,
      mentioned_channels: mentionedChannels,
      environment: stripeEnvironment,
      is_protected: is_protected || undefined,
      amount: amount,
      dry_run: dry_run,
      ...(txid ? { support_tx_id: txid } : {}),
      ...(payment_intent_id ? { payment_intent_id } : {}),
      ...(payment_tx_id ? { payment_tx_id } : {}),
    })
      .then((result: CommentCreateResponse) => {
        if (dry_run) {
          return result;
        }
        const previousCommenterChannel = {
          claim_id: activeChannelClaim.claim_id,
          name: activeChannelClaim.name,
          last_comment_timestamp: Date.now(),
        };
        LocalStorage.setItem(`commenter_${targetClaimId}`, JSON.stringify(previousCommenterChannel));

        let lastCommentedClaims = LocalStorage.getItem('lastCommentedClaims');
        lastCommentedClaims = lastCommentedClaims ? JSON.parse(lastCommentedClaims) : [];
        if (!lastCommentedClaims.includes(claim_id)) {
          lastCommentedClaims.push(claim_id);
          if (lastCommentedClaims.length > 100) {
            const droppedItemClaimId = lastCommentedClaims.shift();
            LocalStorage.removeItem(`commenter_${droppedItemClaimId}`);
          }
          LocalStorage.setItem('lastCommentedClaims', JSON.stringify(lastCommentedClaims));
        }

        dispatch({
          type: ACTIONS.COMMENT_CREATE_COMPLETED,
          data: {
            uri,
            livestream,
            comment: result,
            claimId: claim_id,
          },
        });
        return result;
      })
      .catch((error) => {
        if (!dry_run) {
          dispatch({ type: ACTIONS.COMMENT_CREATE_FAILED, data: error });
        }
        dispatchToast(dispatch, resolveApiMessage(error.message));
        return Promise.reject(error);
      });
  };
}

export function doCommentPin(commentId: string, claimId: string, remove: boolean) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const activeChannel = selectActiveChannelClaim(state);

    if (!activeChannel) {
      console.error('Unable to pin comment. No activeChannel is set.'); // eslint-disable-line
      return;
    }

    const signedCommentId = await ChannelSign.sign(activeChannel.claim_id, commentId, false);
    if (!signedCommentId) {
      return dispatch(doToast({ isError: true, message: __('Unable to verify your channel. Please try again.') }));
    }

    dispatch({
      type: ACTIONS.COMMENT_PIN_STARTED,
    });

    const params: CommentPinParams = {
      comment_id: commentId,
      channel_id: activeChannel.claim_id,
      channel_name: activeChannel.name,
      remove: remove,
      signature: signedCommentId.signature,
      signing_ts: signedCommentId.signing_ts,
    };

    return Comments.comment_pin(params)
      .then((result: CommentPinResponse) => {
        dispatch({
          type: ACTIONS.COMMENT_PIN_COMPLETED,
          data: {
            pinnedComment: result.items,
            claimId,
            unpin: remove,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: ACTIONS.COMMENT_PIN_FAILED,
          data: error,
        });
        dispatchToast(dispatch, __('Unable to pin this comment, please try again later.'));
      });
  };
}

/**
 * Deletes a comment in Commentron.
 *
 * @param commentId The comment ID to delete.
 * @param deleterClaim The channel-claim of the person doing the deletion.
 *   Defaults to the active channel if not provided.
 * @param deleterIsModOrAdmin Is the deleter a mod or admin for the content?
 * @param creatorClaim The channel-claim for the content where the comment
 *   resides. Not required if the deleter owns the comment (i.e. deleting own
 *   comment).
 * @returns {function(Dispatch): *}
 */
export function doCommentAbandon(
  commentId: string,
  deleterClaim?: Claim,
  deleterIsModOrAdmin?: boolean,
  creatorClaim?: Claim
) {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (!deleterClaim) {
      const state = getState();
      deleterClaim = selectActiveChannelClaim(state);
    }

    dispatch({
      type: ACTIONS.COMMENT_ABANDON_STARTED,
    });

    const commentIdSignature = await ChannelSign.sign(deleterClaim.claim_id, commentId, false);

    return Comments.comment_abandon({
      comment_id: commentId,
      creator_channel_id: creatorClaim ? creatorClaim.claim_id : undefined,
      creator_channel_name: creatorClaim ? creatorClaim.name : undefined,
      ...(commentIdSignature || {}),
      mod_channel_id: deleterClaim && deleterIsModOrAdmin ? deleterClaim.claim_id : undefined,
      mod_channel_name: deleterClaim && deleterIsModOrAdmin ? deleterClaim.name : undefined,
    })
      .then((result: CommentAbandonResponse) => {
        // Comment may not be deleted if the signing channel can't be signed.
        // This will happen if the channel was recently created or abandoned.
        if (result.abandoned) {
          dispatch({
            type: ACTIONS.COMMENT_ABANDON_COMPLETED,
            data: {
              comment_id: commentId,
            },
          });

          // Update the commented-channels list.
          dispatch(doFetchMyCommentedChannels(result.claim_id));
        } else {
          dispatch({
            type: ACTIONS.COMMENT_ABANDON_FAILED,
          });
          dispatch(
            doToast({
              message: 'Your channel is still being setup, try again in a few moments.',
              isError: true,
            })
          );
        }
      })
      .catch((error) => {
        dispatch({
          type: ACTIONS.COMMENT_ABANDON_FAILED,
          data: error,
        });

        dispatch(
          doToast({
            message: 'Unable to delete this comment, please try again later.',
            isError: true,
          })
        );
      });
  };
}

export function doCommentUpdate(comment_id: string, comment: string) {
  // if they provided an empty string, they must have wanted to abandon
  if (comment === '') {
    return doCommentAbandon(comment_id);
  } else {
    return async (dispatch: Dispatch, getState: GetState) => {
      const state = getState();

      const activeChannelClaim = selectActiveChannelClaim(state);
      if (!activeChannelClaim) {
        return dispatch(doToast({ isError: true, message: __('No active channel selected.') }));
      }

      const signedComment = await ChannelSign.sign(activeChannelClaim.claim_id, comment, false);
      if (!signedComment) {
        return dispatch(doToast({ isError: true, message: __('Unable to verify your channel. Please try again.') }));
      }

      dispatch({
        type: ACTIONS.COMMENT_UPDATE_STARTED,
      });

      return Comments.comment_edit({
        comment_id: comment_id,
        comment: comment,
        signature: signedComment.signature,
        signing_ts: signedComment.signing_ts,
      })
        .then((result: CommentEditResponse) => {
          if (result != null) {
            dispatch({
              type: ACTIONS.COMMENT_UPDATE_COMPLETED,
              data: {
                comment: result,
              },
            });
          } else {
            // the result will return null
            dispatch({
              type: ACTIONS.COMMENT_UPDATE_FAILED,
            });
            dispatch(
              doToast({
                message: 'Your channel is still being setup, try again in a few moments.',
                isError: true,
              })
            );
          }
        })
        .catch((error) => {
          dispatch({
            type: ACTIONS.COMMENT_UPDATE_FAILED,
            data: error,
          });
          dispatch(
            doToast({
              message: 'Unable to edit this comment, please try again later.',
              isError: true,
            })
          );
        });
    };
  }
}

// ****************************************************************************
// ChannelSign
// ****************************************************************************

type ChannelSignCache = {
  [ChannelId]: {|
    [data: string]: {|
      signedObject: ChannelSignResponse,
      timestamp: number,
    |},
  |},
};

class ChannelSign {
  static _CACHE_DURATION_MINUTES = 30;
  static _cache: ChannelSignCache = {};

  static _isCacheValid(channelId: ChannelId, data: string) {
    const cached = ChannelSign._cache[channelId] && ChannelSign._cache[channelId][data];
    return cached && Date.now() - cached.timestamp < ChannelSign._CACHE_DURATION_MINUTES * 60 * 1000;
  }

  static async _sign(channelClaimId: ChannelId, data: string) {
    return await Lbry.channel_sign({
      channel_id: channelClaimId,
      hexdata: toHex(data),
    });
  }

  static async sign(channelClaimId: ChannelId, data: string, useCache: boolean) {
    let signedObject: ?ChannelSignResponse;

    try {
      if (useCache) {
        if (ChannelSign._isCacheValid(channelClaimId, data)) {
          // Retrieve
          return ChannelSign._cache[channelClaimId][data].signedObject;
        } else {
          // Sign
          signedObject = await ChannelSign._sign(channelClaimId, data);
          // Store
          ChannelSign._cache[channelClaimId] = {
            ...ChannelSign._cache[channelClaimId],
            [data]: {
              signedObject: signedObject,
              timestamp: Date.now(),
            },
          };
        }
      } else {
        // Sign
        signedObject = await ChannelSign._sign(channelClaimId, data);
      }
    } catch (err) {}

    return signedObject;
  }
}

// ****************************************************************************
// ****************************************************************************

/**
 * channel_sign convenience wrapper that includes `claim_id` and `name` in the
 * output, primarily to relay them to the `Promise.all` handler.
 */
async function channelSignName(channelClaimId: string, channelName: string, useCache: boolean = false) {
  const signedObject = await ChannelSign.sign(channelClaimId, channelName, useCache);

  if (signedObject) {
    return { ...signedObject, claim_id: channelClaimId, name: channelName };
  } else {
    return signedObject;
  }
}

// ****************************************************************************
// ****************************************************************************

function safeParseURI(uri) {
  try {
    return parseURI(uri);
  } catch {
    return {};
  }
}

// Hides a users comments from all creator's claims and prevent them from commenting in the future
function doCommentModToggleBlock(
  unblock: boolean,
  commenterUri: string,
  creatorUri: string,
  blockerIds: Array<string>, // [] = use all my channels
  blockLevel: string,
  timeoutSec: ?number,
  showLink: boolean = false,
  offendingCommentId: ?string = undefined
) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const ready = selectPrefsReady(state);
    let blockerChannelClaims = selectMyChannelClaims(state);

    if (!ready) {
      return dispatch(doAlertWaitingForSync());
    }

    if (!blockerChannelClaims) {
      return dispatch(
        doToast({
          message: __('Create a channel to change this setting.'),
          isError: false,
        })
      );
    }

    const { channelName, channelClaimId } = parseURI(commenterUri);
    const { channelName: creatorName, channelClaimId: creatorId } = safeParseURI(creatorUri);

    if (blockerIds.length === 0) {
      // Specific blockers not provided, so find one based on block-level.
      switch (blockLevel) {
        case BLOCK_LEVEL.MODERATOR:
          {
            // Find the first channel that is a moderator for 'creatorId'.
            const delegatorsById = selectModerationDelegatorsById(state);
            blockerChannelClaims = [
              blockerChannelClaims.find((x) => {
                const delegatorDataForId = delegatorsById[x.claim_id];
                return delegatorDataForId && Object.values(delegatorDataForId.delegators).includes(creatorId);
              }),
            ];
          }
          break;

        case BLOCK_LEVEL.ADMIN:
          {
            // Find the first admin channel and use that.
            const delegatorsById = selectModerationDelegatorsById(state);
            blockerChannelClaims = [
              blockerChannelClaims.find((x) => delegatorsById[x.claim_id] && delegatorsById[x.claim_id].global),
            ];
          }
          break;
      }
    } else {
      // Client wants to block for specific channels only. Ensure we own those channels.
      blockerChannelClaims = blockerChannelClaims.filter((x) => blockerIds.includes(x.claim_id));
    }

    dispatch({
      type: unblock ? ACTIONS.COMMENT_MODERATION_UN_BLOCK_STARTED : ACTIONS.COMMENT_MODERATION_BLOCK_STARTED,
      data: {
        blockedUri: commenterUri,
        creatorUri: creatorUri || undefined,
        blockLevel: blockLevel,
      },
    });

    const commenterIdForAction = channelClaimId;
    const commenterNameForAction = channelName;

    let channelSignatures = [];

    const sharedModBlockParams = unblock
      ? {
          un_blocked_channel_id: commenterIdForAction,
          un_blocked_channel_name: commenterNameForAction,
        }
      : {
          blocked_channel_id: commenterIdForAction,
          blocked_channel_name: commenterNameForAction,
        };

    const commentAction = unblock ? Comments.moderation_unblock : Comments.moderation_block;

    return Promise.all(blockerChannelClaims.map((x) => channelSignName(x.claim_id, x.name, true)))
      .then((response) => {
        channelSignatures = response;
        // $FlowFixMe
        return Promise.allSettled(
          channelSignatures
            .filter((x) => x !== undefined && x !== null)
            .map((signatureData) =>
              commentAction({
                // $FlowFixMe
                mod_channel_id: signatureData.claim_id,
                // $FlowFixMe
                mod_channel_name: signatureData.name,
                // $FlowFixMe
                signature: signatureData.signature,
                // $FlowFixMe
                signing_ts: signatureData.signing_ts,
                creator_channel_id: creatorUri ? creatorId : undefined,
                creator_channel_name: creatorUri ? creatorName : undefined,
                offending_comment_id: offendingCommentId && !unblock ? offendingCommentId : undefined,
                block_all: unblock ? undefined : blockLevel === BLOCK_LEVEL.ADMIN,
                global_un_block: unblock ? blockLevel === BLOCK_LEVEL.ADMIN : undefined,
                ...sharedModBlockParams,
                time_out: unblock ? undefined : timeoutSec,
              })
            )
        )
          .then((response) => {
            const failures = [];

            response.forEach((res, index) => {
              if (res.status === 'rejected') {
                // TODO: This should be error codes
                if (res.reason.message !== 'validation is disallowed for non controlling channels') {
                  // $FlowFixMe
                  failures.push(channelSignatures[index].name + ': ' + res.reason.message);
                }
              }
            });

            if (failures.length !== 0) {
              dispatch(doToast({ message: failures.join(), isError: true }));
              dispatch({
                type: unblock ? ACTIONS.COMMENT_MODERATION_UN_BLOCK_FAILED : ACTIONS.COMMENT_MODERATION_BLOCK_FAILED,
                data: {
                  blockedUri: commenterUri,
                  creatorUri: creatorUri || undefined,
                  blockLevel: blockLevel,
                },
              });
              return;
            }

            dispatch({
              type: unblock ? ACTIONS.COMMENT_MODERATION_UN_BLOCK_COMPLETE : ACTIONS.COMMENT_MODERATION_BLOCK_COMPLETE,
              data: {
                blockedUri: commenterUri,
                creatorUri: creatorUri || undefined,
                blockLevel: blockLevel,
              },
            });

            dispatch(
              doToast({
                message: unblock
                  ? __('Channel unblocked!')
                  : __('Channel "%channel%" blocked.', { channel: commenterNameForAction }),
                linkText: __(showLink ? 'See All' : ''),
                linkTarget: '/settings/block_and_mute',
              })
            );
          })
          .catch(() => {
            dispatch({
              type: unblock ? ACTIONS.COMMENT_MODERATION_UN_BLOCK_FAILED : ACTIONS.COMMENT_MODERATION_BLOCK_FAILED,
              data: {
                blockedUri: commenterUri,
                creatorUri: creatorUri || undefined,
                blockLevel: blockLevel,
              },
            });
          });
      })
      .catch(() => {
        dispatch({
          type: unblock ? ACTIONS.COMMENT_MODERATION_UN_BLOCK_FAILED : ACTIONS.COMMENT_MODERATION_BLOCK_FAILED,
          data: {
            blockedUri: commenterUri,
            creatorUri: creatorUri || undefined,
            blockLevel: blockLevel,
          },
        });
      });
  };
}

/**
 * Blocks the commenter for all channels that I own.
 *
 * Update: the above it not entirely true now. A blocked channel's comment won't
 * appear for you anywhere since we now filter the comments at the app-side
 * before showing it.
 *
 * @param commenterUri
 * @param offendingCommentId
 * @param timeoutSec
 * @param showLink
 * @returns {function(Dispatch): *}
 */
export function doCommentModBlock(
  commenterUri: string,
  offendingCommentId: ?string,
  timeoutSec: ?number,
  showLink: boolean = true
) {
  return (dispatch: Dispatch) => {
    return dispatch(
      doCommentModToggleBlock(false, commenterUri, '', [], BLOCK_LEVEL.SELF, timeoutSec, showLink, offendingCommentId)
    );
  };
}

/**
 * Blocks the commenter using the given channel that has Global privileges.
 *
 * @param commenterUri
 * @param offendingCommentId
 * @param blockerId Your specific channel ID to block with, or pass 'undefined'
 *   to block it for all of your channels.
 * @param timeoutSec
 * @returns {function(Dispatch): *}
 */
export function doCommentModBlockAsAdmin(
  commenterUri: string,
  offendingCommentId: ?string,
  blockerId: ?string,
  timeoutSec: ?number
) {
  return (dispatch: Dispatch) => {
    return dispatch(
      doCommentModToggleBlock(
        false,
        commenterUri,
        '',
        blockerId ? [blockerId] : [],
        BLOCK_LEVEL.ADMIN,
        timeoutSec,
        false,
        offendingCommentId
      )
    );
  };
}

/**
 * Blocks the commenter using the given channel that has been granted
 * moderation rights by the creator.
 *
 * @param commenterUri
 * @param offendingCommentId
 * @param creatorUri
 * @param blockerId Your specific channel ID to block with, or pass 'undefined'
 *   to block it for all of your channels.
 * @param timeoutSec
 * @returns {function(Dispatch): *}
 */
export function doCommentModBlockAsModerator(
  commenterUri: string,
  offendingCommentId: ?string,
  creatorUri: string,
  blockerId: ?string,
  timeoutSec: ?number
) {
  return (dispatch: Dispatch) => {
    return dispatch(
      doCommentModToggleBlock(
        false,
        commenterUri,
        creatorUri,
        blockerId ? [blockerId] : [],
        BLOCK_LEVEL.MODERATOR,
        timeoutSec,
        false,
        offendingCommentId
      )
    );
  };
}

/**
 * Unblocks the commenter for all channels that I own.
 *
 * @param commenterUri
 * @param showLink
 * @returns {function(Dispatch): *}
 */
export function doCommentModUnBlock(commenterUri: string, showLink: boolean = true) {
  return (dispatch: Dispatch) => {
    return dispatch(doCommentModToggleBlock(true, commenterUri, '', [], BLOCK_LEVEL.SELF, undefined, showLink));
  };
}

/**
 * Unblocks the commenter using the given channel that has Global privileges.
 *
 * @param commenterUri
 * @param blockerId
 * @returns {function(Dispatch): *}
 */
export function doCommentModUnBlockAsAdmin(commenterUri: string, blockerId: string) {
  return (dispatch: Dispatch) => {
    return dispatch(doCommentModToggleBlock(true, commenterUri, '', blockerId ? [blockerId] : [], BLOCK_LEVEL.ADMIN));
  };
}

/**
 * Unblocks the commenter using the given channel that has been granted
 * moderation rights by the creator.
 *
 * @param commenterUri
 * @param creatorUri
 * @param blockerId
 * @returns {function(Dispatch): *}
 */
export function doCommentModUnBlockAsModerator(commenterUri: string, creatorUri: string, blockerId: string) {
  return (dispatch: Dispatch) => {
    return dispatch(
      doCommentModToggleBlock(true, commenterUri, creatorUri, blockerId ? [blockerId] : [], BLOCK_LEVEL.MODERATOR)
    );
  };
}

export function doFetchModBlockedList() {
  return async (dispatch: Dispatch, getState: GetState) => {
    const LOOP_CHUNK_SIZE = 1;
    const yieldThread = () => new Promise((resolve) => setTimeout(resolve));

    const state = getState();
    const myChannels = selectMyChannelClaims(state);
    if (!myChannels) {
      dispatch({ type: ACTIONS.COMMENT_MODERATION_BLOCK_LIST_FAILED });
      return;
    }

    dispatch({
      type: ACTIONS.COMMENT_MODERATION_BLOCK_LIST_STARTED,
    });

    let channelSignatures = [];

    return Promise.all(myChannels.map((channel) => channelSignName(channel.claim_id, channel.name, true)))
      .then((response) => {
        channelSignatures = response;
        // $FlowFixMe
        return Promise.allSettled(
          channelSignatures
            .filter((x) => x !== undefined && x !== null)
            .map((signatureData) =>
              Comments.moderation_block_list({
                mod_channel_id: signatureData.claim_id,
                mod_channel_name: signatureData.name,
                signature: signatureData.signature,
                signing_ts: signatureData.signing_ts,
              })
            )
        )
          .then(async (res) => {
            let personalBlockList = [];
            let adminBlockList = [];
            let moderatorBlockList = [];
            let moderatorBlockListDelegatorsMap = {};

            // These should just be part of the block list above, but it is
            // separated for now because there are too many clients that we need
            // to update.
            const personalTimeoutMap = {};
            const adminTimeoutMap = {};
            const moderatorTimeoutMap = {};

            const blockListsPerChannel = [];
            for (let i = 0; i < res.length; ++i) {
              blockListsPerChannel.push(res[i].value);
              if (i > 0 && i % 2 === 0) {
                await yieldThread();
              }
            }

            for (let i = 0; i < blockListsPerChannel.length; ++i) {
              const storeList = async (fetchedList, blockedList, timeoutMap, blockedByMap) => {
                if (fetchedList) {
                  for (let j = 0; j < fetchedList.length; ++j) {
                    const blockedChannel = fetchedList[j];
                    if (j > 0 && j % LOOP_CHUNK_SIZE === 0) {
                      await yieldThread();
                    }

                    if (blockedChannel.blocked_channel_name) {
                      const channelUri = buildURI({
                        channelName: blockedChannel.blocked_channel_name,
                        claimId: blockedChannel.blocked_channel_id,
                      });

                      if (!blockedList.find((blockedChannel) => isURIEqual(blockedChannel.channelUri, channelUri))) {
                        blockedList.push({ channelUri, blockedAt: blockedChannel.blocked_at });

                        if (blockedChannel.banned_for) {
                          timeoutMap[channelUri] = {
                            blockedAt: blockedChannel.blocked_at,
                            bannedFor: blockedChannel.banned_for,
                            banRemaining: blockedChannel.ban_remaining,
                          };
                        }
                      }

                      if (blockedByMap !== undefined) {
                        const blockedByChannelUri = buildURI({
                          channelName: blockedChannel.blocked_by_channel_name,
                          claimId: blockedChannel.blocked_by_channel_id,
                        });

                        if (blockedByMap[channelUri]) {
                          if (!blockedByMap[channelUri].includes(blockedByChannelUri)) {
                            blockedByMap[channelUri].push(blockedByChannelUri);
                          }
                        } else {
                          blockedByMap[channelUri] = [blockedByChannelUri];
                        }
                      }
                    }
                  }
                }
              };

              const channelBlockLists = blockListsPerChannel[i];
              const blocked_channels = channelBlockLists && channelBlockLists.blocked_channels;
              const globally_blocked_channels = channelBlockLists && channelBlockLists.globally_blocked_channels;
              const delegated_blocked_channels = channelBlockLists && channelBlockLists.delegated_blocked_channels;

              if (i > 0 && i % LOOP_CHUNK_SIZE === 0) {
                await yieldThread();
              }

              await storeList(blocked_channels, personalBlockList, personalTimeoutMap);
              await storeList(globally_blocked_channels, adminBlockList, adminTimeoutMap);
              await storeList(
                delegated_blocked_channels,
                moderatorBlockList,
                moderatorTimeoutMap,
                moderatorBlockListDelegatorsMap
              );
            }

            dispatch({
              type: ACTIONS.COMMENT_MODERATION_BLOCK_LIST_COMPLETED,
              data: {
                personalBlockList:
                  personalBlockList.length > 0
                    ? personalBlockList
                        .sort((a, b) => new Date(a.blockedAt) - new Date(b.blockedAt))
                        .map((blockedChannel) => blockedChannel.channelUri)
                    : null,
                adminBlockList:
                  adminBlockList.length > 0
                    ? adminBlockList
                        .sort((a, b) => new Date(a.blockedAt) - new Date(b.blockedAt))
                        .map((blockedChannel) => blockedChannel.channelUri)
                    : null,
                moderatorBlockList:
                  moderatorBlockList.length > 0
                    ? moderatorBlockList
                        .sort((a, b) => new Date(a.blockedAt) - new Date(b.blockedAt))
                        .map((blockedChannel) => blockedChannel.channelUri)
                    : null,
                moderatorBlockListDelegatorsMap: moderatorBlockListDelegatorsMap,
                personalTimeoutMap,
                adminTimeoutMap,
                moderatorTimeoutMap,
              },
            });
          })
          .catch(() => {
            dispatch({
              type: ACTIONS.COMMENT_MODERATION_BLOCK_LIST_FAILED,
            });
          });
      })
      .catch(() => {
        dispatch({
          type: ACTIONS.COMMENT_MODERATION_BLOCK_LIST_FAILED,
        });
      });
  };
}

export const doUpdateBlockListForPublishedChannel = (channelClaim: ChannelClaim) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const blockedUris = selectModerationBlockList(state);

    let channelSignature: ?{
      signature: string,
      signing_ts: string,
    };
    try {
      channelSignature = await Lbry.channel_sign({
        channel_id: channelClaim.claim_id,
        hexdata: toHex(channelClaim.name),
      });
    } catch (e) {}

    if (!channelSignature) {
      return;
    }

    return Promise.all(
      blockedUris.map((uri) => {
        const { channelName, channelClaimId } = parseURI(uri);
        if (channelName && channelClaimId) {
          return Comments.moderation_block({
            mod_channel_id: channelClaim.claim_id,
            mod_channel_name: channelClaim.name,
            // $FlowFixMe
            signature: channelSignature.signature,
            // $FlowFixMe
            signing_ts: channelSignature.signing_ts,
            blocked_channel_id: channelClaimId,
            blocked_channel_name: channelName,
          });
        }
      })
    );
  };
};

export function doCommentModAddDelegate(
  modChannelId: string,
  modChannelName: string,
  creatorChannelClaim: ChannelClaim,
  showToast: boolean = false
) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const signature = await ChannelSign.sign(creatorChannelClaim.claim_id, creatorChannelClaim.name, false);
    if (!signature) {
      doFailedSignatureToast(dispatch, creatorChannelClaim.name);
      return;
    }

    return Comments.moderation_add_delegate({
      mod_channel_id: modChannelId,
      mod_channel_name: modChannelName,
      channel_id: creatorChannelClaim.claim_id,
      channel_name: creatorChannelClaim.name,
      ...signature,
    })
      .then(() => {
        if (showToast) {
          dispatch(
            doToast({
              message: __('Added %user% as moderator for %myChannel%', {
                user: modChannelName,
                myChannel: creatorChannelClaim.name,
              }),
              linkText: __('Manage'),
              linkTarget: `/${PAGES.SETTINGS_CREATOR}`,
            })
          );
        }
      })
      .catch((err) => {
        dispatch(doToast({ message: err.message, isError: true }));
      });
  };
}

export function doCommentModRemoveDelegate(
  modChannelId: string,
  modChannelName: string,
  creatorChannelClaim: ChannelClaim
) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const signature = await ChannelSign.sign(creatorChannelClaim.claim_id, creatorChannelClaim.name, false);
    if (!signature) {
      doFailedSignatureToast(dispatch, creatorChannelClaim.name);
      return;
    }

    return Comments.moderation_remove_delegate({
      mod_channel_id: modChannelId,
      mod_channel_name: modChannelName,
      channel_id: creatorChannelClaim.claim_id,
      channel_name: creatorChannelClaim.name,
      ...signature,
    }).catch((err) => {
      dispatch(doToast({ message: err.message, isError: true }));
    });
  };
}

export function doCommentModListDelegates(channelClaim: ChannelClaim) {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: ACTIONS.COMMENT_FETCH_MODERATION_DELEGATES_STARTED });

    const signature = await ChannelSign.sign(channelClaim.claim_id, channelClaim.name, false);
    if (!signature) {
      doFailedSignatureToast(dispatch, channelClaim.name);
      dispatch({ type: ACTIONS.COMMENT_FETCH_MODERATION_DELEGATES_FAILED });
      return;
    }

    return Comments.moderation_list_delegates({
      channel_id: channelClaim.claim_id,
      channel_name: channelClaim.name,
      ...signature,
    })
      .then((response) => {
        dispatch({
          type: ACTIONS.COMMENT_FETCH_MODERATION_DELEGATES_COMPLETED,
          data: {
            id: channelClaim.claim_id,
            delegates: response.Delegates,
          },
        });
      })
      .catch((err) => {
        dispatch(doToast({ message: err.message, isError: true }));
        dispatch({ type: ACTIONS.COMMENT_FETCH_MODERATION_DELEGATES_FAILED });
      });
  };
}

export function doFetchCommentModAmIList(channelClaim: ChannelClaim) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const myChannels = selectMyChannelClaims(state);
    if (!myChannels) {
      dispatch({ type: ACTIONS.COMMENT_MODERATION_AM_I_LIST_FAILED });
      return;
    }

    dispatch({ type: ACTIONS.COMMENT_MODERATION_AM_I_LIST_STARTED });

    let channelSignatures = [];

    return Promise.all(myChannels.map((channel) => channelSignName(channel.claim_id, channel.name, true)))
      .then((response) => {
        channelSignatures = response;
        // $FlowFixMe
        return Promise.allSettled(
          channelSignatures
            .filter((x) => x !== undefined && x !== null)
            .map((signatureData) =>
              Comments.moderation_am_i({
                channel_name: signatureData.name,
                channel_id: signatureData.claim_id,
                signature: signatureData.signature,
                signing_ts: signatureData.signing_ts,
              })
            )
        )
          .then((results) => {
            const delegatorsById = {};

            results.forEach((result, index) => {
              if (result.status === PROMISE_FULFILLED) {
                const value = result.value;
                delegatorsById[value.channel_id] = {
                  global: value ? value.type === 'Global' : false,
                  delegators: value && value.authorized_channels ? value.authorized_channels : {},
                };
              }
            });

            dispatch({
              type: ACTIONS.COMMENT_MODERATION_AM_I_LIST_COMPLETED,
              data: delegatorsById,
            });
          })
          .catch((err) => {
            devToast(dispatch, `AmI: ${err}`);
            dispatch({ type: ACTIONS.COMMENT_MODERATION_AM_I_LIST_FAILED });
          });
      })
      .catch(() => {
        dispatch({ type: ACTIONS.COMMENT_MODERATION_AM_I_LIST_FAILED });
      });
  };
}

export const doFetchCreatorSettings = (channelId: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const myChannels = selectMyChannelClaims(state);
    const creatorChannel = selectClaimForClaimId(state, channelId);

    dispatch({
      type: ACTIONS.COMMENT_FETCH_SETTINGS_STARTED,
    });

    let signedName;

    if (myChannels) {
      const index = myChannels.findIndex((myChannel) => myChannel.claim_id === channelId);
      if (index > -1) {
        signedName = await channelSignName(channelId, myChannels[index].name, true);
      }
    }

    const cmd = signedName ? Comments.setting_list : Comments.setting_get;

    return cmd({
      channel_id: channelId,
      channel_name: (signedName && signedName.name) || creatorChannel?.name,
      signature: (signedName && signedName.signature) || undefined,
      signing_ts: (signedName && signedName.signing_ts) || undefined,
    })
      .then((response: SettingsResponse) => {
        dispatch({
          type: ACTIONS.COMMENT_FETCH_SETTINGS_COMPLETED,
          data: {
            channelId: channelId,
            settings: response,
            partialUpdate: !signedName,
          },
        });

        return response;
      })
      .catch((err) => {
        if (err.message === 'validation is disallowed for non controlling channels') {
          dispatch({
            type: ACTIONS.COMMENT_FETCH_SETTINGS_COMPLETED,
            data: {
              channelId: channelId,
              settings: null,
              partialUpdate: !signedName,
            },
          });
        } else {
          devToast(dispatch, `Creator: ${err}`);
          dispatch({
            type: ACTIONS.COMMENT_FETCH_SETTINGS_FAILED,
          });
        }

        throw new Error(err);
      });
  };
};

/**
 * Updates creator settings, except for 'Words', which will be handled by
 * 'doCommentWords, doCommentBlockWords, etc.'
 *
 * @param channelClaim
 * @param settings
 * @returns {function(Dispatch, GetState): any}
 */
export const doUpdateCreatorSettings = (channelClaim: ChannelClaim, settings: PerChannelSettings) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const channelSignature = await ChannelSign.sign(channelClaim.claim_id, channelClaim.name, true);
    if (!channelSignature) {
      devToast(dispatch, 'doUpdateCreatorSettings: failed to sign channel name');
      return;
    }

    return Comments.setting_update({
      channel_name: channelClaim.name,
      channel_id: channelClaim.claim_id,
      signature: channelSignature.signature,
      signing_ts: channelSignature.signing_ts,
      ...settings,
    })
      .then((res) => {
        // 'res' actually contains the new settings already, but I'm lazy to
        // replicate partial code, so just do a full fetch to update our store.
        dispatch(doFetchCreatorSettings(channelClaim.claim_id));
      })
      .catch((err) => {
        dispatch(
          doToast({
            message: __('Failed to update settings.'),
            subMessage: err?.message,
            isError: true,
          })
        );
      });
  };
};

export const doDeleteChannelSection = (channelId: string, sectionId: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const channelClaim = selectClaimForClaimId(state, channelId);
    const channelSettings = selectSettingsForChannelId(state, channelId);
    const sections: ?Sections = channelSettings && channelSettings.channel_sections;
    const entries = (sections && sections.entries.slice()) || [];

    const index = entries.findIndex((x) => x.id === sectionId);
    if (index > -1 && channelClaim) {
      entries.splice(index, 1);
      dispatch(doUpdateCreatorSettings(channelClaim, { channel_sections: { ...sections, entries } }));
    }

    // TODO: errors?
  };
};

export const doToggleMembersOnlyCommentsSettingForClaimId =
  (claimId: ClaimId) => async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();

    const claim = selectClaimForClaimId(state, claimId);
    const { name: channelName, claim_id: channelId } = getChannelFromClaim(claim) || {};
    const channelSignature = await ChannelSign.sign(channelId, channelName, true);

    if (!channelSignature) {
      devToast(dispatch, 'doUpdateCreatorSettings: failed to sign channel name');
      return;
    }

    const areCommentsMembersOnly = selectMembersOnlyCommentsForChannelId(state, channelId);
    const value = !areCommentsMembersOnly;

    return Comments.setting_update({
      channel_name: channelName,
      channel_id: channelId,
      signature: channelSignature.signature,
      signing_ts: channelSignature.signing_ts,
      comments_members_only: value,
      active_claim_id: claimId,
    })
      .then(() =>
        dispatch({
          type: ACTIONS.WEBSOCKET_MEMBERS_ONLY_TOGGLE_COMPLETE,
          data: { responseData: { CommentsMembersOnly: value }, creatorId: channelId },
        })
      )
      .catch((err) => {
        dispatch(doToast({ message: err.message, isError: true }));
        throw new Error(err);
      });
  };

export const doToggleLiveChatMembersOnlySettingForClaimId =
  (claimId: ClaimId) => async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();

    const claim = selectClaimForClaimId(state, claimId);
    const { name: channelName, claim_id: channelId } = getChannelFromClaim(claim) || {};
    const channelSignature = await ChannelSign.sign(channelId, channelName, true);

    if (!channelSignature) {
      devToast(dispatch, 'doUpdateCreatorSettings: failed to sign channel name');
      return;
    }

    const isLivestreamChatMembersOnly = selectLivestreamChatMembersOnlyForChannelId(state, channelId);
    const value = !isLivestreamChatMembersOnly;

    return Comments.setting_update({
      channel_name: channelName,
      channel_id: channelId,
      signature: channelSignature.signature,
      signing_ts: channelSignature.signing_ts,
      livestream_chat_members_only: value,
      active_claim_id: claimId,
    })
      .then(() =>
        dispatch({
          type: ACTIONS.WEBSOCKET_MEMBERS_ONLY_TOGGLE_COMPLETE,
          data: { responseData: { LivestreamChatMembersOnly: value }, creatorId: channelId },
        })
      )
      .catch((err) => {
        dispatch(doToast({ message: err.message, isError: true }));
        throw new Error(err);
      });
  };

export const doCommentWords = (channelClaim: ChannelClaim, words: Array<string>, isUnblock: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    let channelSignature: ?{
      signature: string,
      signing_ts: string,
    };
    try {
      channelSignature = await Lbry.channel_sign({
        channel_id: channelClaim.claim_id,
        hexdata: toHex(channelClaim.name),
      });
    } catch (e) {}

    if (!channelSignature) {
      return;
    }

    const cmd = isUnblock ? Comments.setting_unblock_word : Comments.setting_block_word;

    return cmd({
      channel_name: channelClaim.name,
      channel_id: channelClaim.claim_id,
      words: words.join(','),
      signature: channelSignature.signature,
      signing_ts: channelSignature.signing_ts,
    }).catch((err) => {
      dispatch(
        doToast({
          message: err.message,
          isError: true,
        })
      );
    });
  };
};

export const doCommentBlockWords = (channelClaim: ChannelClaim, words: Array<string>) => {
  return (dispatch: Dispatch) => {
    return dispatch(doCommentWords(channelClaim, words, false));
  };
};

export const doCommentUnblockWords = (channelClaim: ChannelClaim, words: Array<string>) => {
  return (dispatch: Dispatch) => {
    return dispatch(doCommentWords(channelClaim, words, true));
  };
};

export const doFetchBlockedWords = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const myChannels = selectMyChannelClaims(state);

    dispatch({
      type: ACTIONS.COMMENT_FETCH_BLOCKED_WORDS_STARTED,
    });

    let channelSignatures = [];
    if (myChannels) {
      for (const channelClaim of myChannels) {
        try {
          const channelSignature = await Lbry.channel_sign({
            channel_id: channelClaim.claim_id,
            hexdata: toHex(channelClaim.name),
          });

          channelSignatures.push({ ...channelSignature, claim_id: channelClaim.claim_id, name: channelClaim.name });
        } catch (e) {}
      }
    }

    return Promise.all(
      channelSignatures.map((signatureData) =>
        Comments.setting_list_blocked_words({
          channel_name: signatureData.name,
          channel_id: signatureData.claim_id,
          signature: signatureData.signature,
          signing_ts: signatureData.signing_ts,
        })
      )
    )
      .then((blockedWords) => {
        const blockedWordsByChannelId = {};

        for (let i = 0; i < channelSignatures.length; ++i) {
          const claim_id = channelSignatures[i].claim_id;
          blockedWordsByChannelId[claim_id] = blockedWords[i].word_list;
        }

        dispatch({
          type: ACTIONS.COMMENT_FETCH_BLOCKED_WORDS_COMPLETED,
          data: blockedWordsByChannelId,
        });
      })
      .catch(() => {
        dispatch({
          type: ACTIONS.COMMENT_FETCH_BLOCKED_WORDS_FAILED,
        });
      });
  };
};

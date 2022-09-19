// @flow
import * as ACTIONS from 'constants/action_types';
import * as ABANDON_STATES from 'constants/abandon_states';
import Lbry from 'lbry';
import { normalizeURI } from 'util/lbryURI';
import { doToast } from 'redux/actions/notifications';
import {
  selectMyClaimsRaw,
  selectResolvingUris,
  selectClaimForUri,
  selectClaimsById,
  selectMyChannelClaims,
  selectPendingClaimsById,
  selectClaimIsMine,
  selectIsMyChannelCountOverLimit,
  selectResolvingIds,
  selectMyChannelClaimIds,
  selectFetchingMyChannels,
} from 'redux/selectors/claims';

import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { doFetchTxoPage } from 'redux/actions/wallet';
import { selectSupportsByOutpoint } from 'redux/selectors/wallet';
import { creditsToString } from 'util/format-credits';
import { createNormalizedClaimSearchKey } from 'util/claim';
import { PAGE_SIZE } from 'constants/claim';

let onChannelConfirmCallback;
let checkPendingInterval;

export function doResolveUris(
  uris: Array<string>,
  returnCachedClaims: boolean = false,
  resolveReposts: boolean = true,
  additionalOptions: any = {}
) {
  return (dispatch: Dispatch, getState: GetState) => {
    const normalizedUris = uris.map(normalizeURI);
    const state = getState();

    const resolvingUris = new Set(selectResolvingUris(state));
    const resolvedClaims = {};
    const urisToResolve = normalizedUris.filter((uri) => {
      if (resolvingUris.has(uri)) {
        return false;
      }

      if (returnCachedClaims) {
        const claim = selectClaimForUri(state, uri);

        if (claim) {
          resolvedClaims[claim.permanent_url] = claim;
          return false;
        }
      }

      return true;
    });

    if (urisToResolve.length === 0) {
      return Promise.resolve(resolvedClaims);
    }

    dispatch({
      type: ACTIONS.RESOLVE_URIS_STARTED,
      data: { uris: normalizedUris },
    });

    const resolveInfo: {
      [string]: {
        stream: ?StreamClaim,
        channel: ?ChannelClaim,
        claimsInChannel: ?number,
        collection: ?CollectionClaim,
      },
    } = {};

    return Lbry.resolve({ urls: urisToResolve, ...additionalOptions }).then(async (response: ResolveResponse) => {
      const result = { ...response, ...resolvedClaims };
      let repostedResults = {};
      const repostsToResolve = [];
      processResolveResult(result, resolveInfo, resolveReposts, resolvingUris, repostsToResolve);

      if (repostsToResolve.length) {
        dispatch({
          type: ACTIONS.RESOLVE_URIS_STARTED,
          data: { uris: repostsToResolve, debug: 'reposts' },
        });
        repostedResults = await Lbry.resolve({ urls: repostsToResolve, ...additionalOptions });
      }
      processResolveResult(repostedResults, resolveInfo);

      dispatch({ type: ACTIONS.RESOLVE_URIS_COMPLETED, data: { resolveInfo } });

      return result;
    });
  };
}

export function processResolveResult(
  result: any,
  resolveInfo: any = {},
  checkReposts: boolean = false,
  resolvingUris: any,
  repostsToResolve: any
) {
  const fallbackResolveInfo = {
    stream: null,
    claimsInChannel: null,
    channel: null,
  };

  Object.entries(result).forEach(([uri, uriResolveInfo]) => {
    // Flow has terrible Object.entries support
    // https://github.com/facebook/flow/issues/2221
    if (uriResolveInfo) {
      if (uriResolveInfo.error) {
        // $FlowFixMe
        resolveInfo[uri] = { ...fallbackResolveInfo };
      } else {
        if (checkReposts && repostsToResolve && resolvingUris) {
          if (uriResolveInfo.reposted_claim) {
            // $FlowFixMe
            const repostUrl = uriResolveInfo.reposted_claim.permanent_url;
            if (!resolvingUris.has(repostUrl)) {
              repostsToResolve.push(repostUrl);
            }
          }
        }
        let result = {};
        if (uriResolveInfo.value_type === 'channel') {
          result.channel = uriResolveInfo;
          // $FlowFixMe
          result.claimsInChannel = uriResolveInfo.meta.claims_in_channel;
        } else if (uriResolveInfo.value_type === 'collection') {
          result.collection = uriResolveInfo;
        } else {
          result.stream = uriResolveInfo;
          if (uriResolveInfo.signing_channel) {
            result.channel = uriResolveInfo.signing_channel;
            result.claimsInChannel =
              (uriResolveInfo.signing_channel.meta && uriResolveInfo.signing_channel.meta.claims_in_channel) || 0;
          }
        }
        // $FlowFixMe
        resolveInfo[uri] = result;
      }
    }
  });
}

/**
 * Temporary alternative to doResolveUris() due to a batching bug with
 * Lbry.resolve().
 *
 * Note that is a simpler version that DOES NOT handle Collections and Reposts.
 *
 * @param claimIds
 */
export function doResolveClaimIds(claimIds: Array<string>, returnCachedClaims?: boolean = true) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState();

    const resolvingIds = new Set(selectResolvingIds(state));
    const claimsById = selectClaimsById(state);
    const resolvedClaims = {};

    const idsToResolve = claimIds.filter((id) => {
      if (resolvingIds.has(id)) {
        return false;
      }

      if (returnCachedClaims) {
        const claim = claimsById[id];

        if (claim) {
          resolvedClaims[claim.permanent_url] = claim;
          return false;
        }
      }

      return true;
    });

    if (idsToResolve.length === 0) {
      return Promise.resolve(resolvedClaims);
    }

    const isAuthenticated = selectUserVerifiedEmail(state);

    const response = await dispatch(
      doClaimSearch(
        {
          claim_ids: idsToResolve,
          page: 1,
          page_size: Math.min(idsToResolve.length, 50),
          include_is_my_output: isAuthenticated,
          no_totals: true,
        },
        {
          useAutoPagination: idsToResolve.length > 50,
        }
      )
    );

    return { ...response, ...resolvedClaims };
  };
}
export const doResolveClaimId = (claimId: ClaimId) => doResolveClaimIds([claimId]);

export function doResolveUri(
  uri: string,
  returnCachedClaims: boolean = false,
  resolveReposts: boolean = true,
  additionalOptions: any = {}
) {
  return doResolveUris([uri], returnCachedClaims, resolveReposts, additionalOptions);
}

export function doGetClaimFromUriResolve(uri: string) {
  return async (dispatch: Dispatch) => {
    let claim;
    await dispatch(doResolveUri(uri, true))
      .then((response) =>
        Object.values(response).forEach((resposne) => {
          claim = resposne;
        })
      )
      .catch((e) => {});

    return claim;
  };
}

export function doFetchClaimListMine(
  page: number = 1,
  pageSize: number = 99999,
  resolve: boolean = true,
  filterBy: Array<string> = []
) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.FETCH_CLAIM_LIST_MINE_STARTED,
    });

    let claimTypes = ['stream', 'repost'];
    if (filterBy && filterBy.length !== 0) {
      claimTypes = claimTypes.filter((t) => filterBy.includes(t));
    }

    // $FlowFixMe
    Lbry.claim_list({
      page: page,
      page_size: pageSize,
      claim_type: claimTypes,
      resolve,
    }).then((result: StreamListResponse) => {
      dispatch({
        type: ACTIONS.FETCH_CLAIM_LIST_MINE_COMPLETED,
        data: {
          result,
          resolve,
        },
      });
    });
  };
}

export function doAbandonTxo(txo: Txo, cb: (string) => void) {
  return (dispatch: Dispatch) => {
    if (cb) cb(ABANDON_STATES.PENDING);
    const isClaim = txo.type === 'claim';
    const isSupport = txo.type === 'support' && txo.is_my_input === true;
    const isTip = txo.type === 'support' && txo.is_my_input === false;

    const data = isClaim ? { claimId: txo.claim_id } : { outpoint: `${txo.txid}:${txo.nout}` };

    const startedActionType = isClaim ? ACTIONS.ABANDON_CLAIM_STARTED : ACTIONS.ABANDON_SUPPORT_STARTED;
    const completedActionType = isClaim ? ACTIONS.ABANDON_CLAIM_SUCCEEDED : ACTIONS.ABANDON_SUPPORT_COMPLETED;

    dispatch({
      type: startedActionType,
      data,
    });

    const errorCallback = () => {
      if (cb) cb(ABANDON_STATES.ERROR);
      dispatch(
        doToast({
          message: isClaim ? 'Error abandoning your claim/support' : 'Error unlocking your tip',
          isError: true,
        })
      );
    };

    const successCallback = () => {
      dispatch({
        type: completedActionType,
        data,
      });

      let abandonMessage;
      if (isClaim) {
        abandonMessage = __('Successfully abandoned your claim.');
      } else if (isSupport) {
        abandonMessage = __('Successfully abandoned your support.');
      } else {
        abandonMessage = __('Successfully unlocked your tip!');
      }
      if (cb) cb(ABANDON_STATES.DONE);

      dispatch(
        doToast({
          message: abandonMessage,
        })
      );
    };

    const abandonParams: {
      claim_id?: string,
      txid?: string,
      nout?: number,
    } = {
      blocking: true,
    };
    if (isClaim) {
      abandonParams['claim_id'] = txo.claim_id;
    } else {
      abandonParams['txid'] = txo.txid;
      abandonParams['nout'] = txo.nout;
    }

    let method;
    if (isSupport || isTip) {
      method = 'support_abandon';
    } else if (isClaim) {
      const { normalized_name: claimName } = txo;
      method = claimName.startsWith('@') ? 'channel_abandon' : 'stream_abandon';
    }

    if (!method) {
      console.error('No "method" chosen for claim or support abandon');
      return;
    }

    Lbry[method](abandonParams).then(successCallback, errorCallback);
  };
}

export function doAbandonClaim(claim: Claim, cb?: (string) => any) {
  const { txid, nout } = claim;
  const outpoint = `${txid}:${nout}`;

  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const myClaims: Array<Claim> = selectMyClaimsRaw(state);
    const mySupports: { [string]: Support } = selectSupportsByOutpoint(state);

    // A user could be trying to abandon a support or one of their claims
    const claimIsMine = selectClaimIsMine(state, claim);
    const claimToAbandon = claimIsMine ? claim : myClaims.find((claim) => claim.txid === txid && claim.nout === nout);
    const supportToAbandon = mySupports[outpoint];

    if (!claimToAbandon && !supportToAbandon) {
      console.error('No associated support or claim with txid: ', txid);
      return;
    }

    const data = claimToAbandon
      ? { claimId: claimToAbandon.claim_id }
      : { outpoint: `${supportToAbandon.txid}:${supportToAbandon.nout}` };

    const isClaim = !!claimToAbandon;
    const startedActionType = isClaim ? ACTIONS.ABANDON_CLAIM_STARTED : ACTIONS.ABANDON_SUPPORT_STARTED;
    const completedActionType = isClaim ? ACTIONS.ABANDON_CLAIM_SUCCEEDED : ACTIONS.ABANDON_SUPPORT_COMPLETED;

    dispatch({
      type: startedActionType,
      data,
    });

    const errorCallback = () => {
      dispatch(
        doToast({
          message: isClaim ? 'Error abandoning your claim/support' : 'Error unlocking your tip',
          isError: true,
        })
      );
      if (cb) cb(ABANDON_STATES.ERROR);
    };

    const successCallback = () => {
      dispatch({
        type: completedActionType,
        data,
      });
      if (cb) cb(ABANDON_STATES.DONE);

      let abandonMessage;
      if (isClaim) {
        abandonMessage = __('Successfully abandoned your claim.');
      } else if (supportToAbandon) {
        abandonMessage = __('Successfully abandoned your support.');
      } else {
        abandonMessage = __('Successfully unlocked your tip!');
      }

      dispatch(
        doToast({
          message: abandonMessage,
        })
      );
      dispatch(doFetchTxoPage());
    };

    const abandonParams = {
      txid,
      nout,
      blocking: true,
    };

    let method;
    if (supportToAbandon) {
      method = 'support_abandon';
    } else if (claimToAbandon) {
      const { name: claimName } = claimToAbandon;
      method = claimName.startsWith('@') ? 'channel_abandon' : 'stream_abandon';
    }

    if (!method) {
      console.error('No "method" chosen for claim or support abandon');
      return;
    }

    Lbry[method](abandonParams).then(successCallback, errorCallback);
  };
}

export function doFetchClaimsByChannel(uri: string, page: number = 1) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.FETCH_CHANNEL_CLAIMS_STARTED,
      data: { uri, page },
    });

    Lbry.claim_search({
      channel: uri,
      valid_channel_signature: true,
      page: page || 1,
      order_by: ['release_time'],
      include_is_my_output: true,
      include_purchase_receipt: true,
    }).then((result: ClaimSearchResponse) => {
      const { items: claims, total_items: claimsInChannel, page: returnedPage } = result;

      dispatch({
        type: ACTIONS.FETCH_CHANNEL_CLAIMS_COMPLETED,
        data: {
          uri,
          claimsInChannel,
          claims: claims || [],
          page: returnedPage || undefined,
        },
      });
    });
  };
}

export function doClearChannelErrors() {
  return {
    type: ACTIONS.CLEAR_CHANNEL_ERRORS,
  };
}

export function doCreateChannel(name: string, amount: number, optionalParams: any, onConfirm: any) {
  return (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const channelCountOverLimit = selectIsMyChannelCountOverLimit(state);

    dispatch({
      type: ACTIONS.CREATE_CHANNEL_STARTED,
    });

    if (channelCountOverLimit) {
      dispatch({
        type: ACTIONS.CREATE_CHANNEL_FAILED,
        data: 'Channel limit exceeded',
      });
      return;
    }

    const createParams: ChannelCreateParam = {
      name,
      bid: creditsToString(amount),
      blocking: true,
    };

    if (optionalParams) {
      if (optionalParams.title) {
        createParams.title = optionalParams.title;
      }
      if (optionalParams.coverUrl) {
        createParams.cover_url = optionalParams.coverUrl;
      }
      if (optionalParams.thumbnailUrl) {
        createParams.thumbnail_url = optionalParams.thumbnailUrl;
      }
      if (optionalParams.description) {
        createParams.description = optionalParams.description;
      }
      if (optionalParams.website) {
        createParams.website_url = optionalParams.website;
      }
      if (optionalParams.email) {
        createParams.email = optionalParams.email;
      }
      if (optionalParams.tags) {
        createParams.tags = optionalParams.tags.map((tag) => tag.name);
      }
      if (optionalParams.languages) {
        createParams.languages = optionalParams.languages;
      }
    }

    return (
      Lbry.channel_create(createParams)
        // outputs[0] is the certificate
        // outputs[1] is the change from the tx, not in the app currently
        .then((result: ChannelCreateResponse) => {
          const channelClaim = result.outputs[0];
          dispatch({
            type: ACTIONS.CREATE_CHANNEL_COMPLETED,
            data: { channelClaim },
          });
          dispatch({
            type: ACTIONS.UPDATE_PENDING_CLAIMS,
            data: {
              claims: [channelClaim],
            },
          });
          dispatch(doCheckPendingClaims(onConfirm));
          return channelClaim;
        })
        .catch((error) => {
          dispatch({
            type: ACTIONS.CREATE_CHANNEL_FAILED,
            data: error.message,
          });
        })
    );
  };
}

export function doUpdateChannel(params: any, cb: any) {
  return (dispatch: Dispatch, getState: GetState) => {
    dispatch({
      type: ACTIONS.UPDATE_CHANNEL_STARTED,
    });
    const state = getState();
    const myChannels = selectMyChannelClaims(state);
    const channelClaim = myChannels.find((myChannel) => myChannel.claim_id === params.claim_id);

    const updateParams = {
      claim_id: params.claim_id,
      bid: creditsToString(params.amount),
      title: params.title,
      cover_url: params.coverUrl,
      thumbnail_url: params.thumbnailUrl,
      description: params.description,
      website_url: params.website,
      email: params.email,
      tags: [],
      replace: true,
      languages: params.languages || [],
      locations: [],
      blocking: true,
    };

    if (params.tags) {
      updateParams.tags = params.tags.map((tag) => tag.name);
    }

    // we'll need to remove these once we add locations/channels to channel page edit/create options
    if (channelClaim && channelClaim.value && channelClaim.value.locations) {
      updateParams.locations = channelClaim.value.locations;
    }

    return Lbry.channel_update(updateParams)
      .then((result: ChannelUpdateResponse) => {
        const channelClaim = result.outputs[0];
        dispatch({
          type: ACTIONS.UPDATE_CHANNEL_COMPLETED,
          data: { channelClaim },
        });
        dispatch({
          type: ACTIONS.UPDATE_PENDING_CLAIMS,
          data: {
            claims: [channelClaim],
          },
        });
        dispatch(doCheckPendingClaims(cb));
        return Boolean(result.outputs[0]);
      })
      .then()
      .catch((error) => {
        dispatch({
          type: ACTIONS.UPDATE_CHANNEL_FAILED,
          data: error,
        });
      });
  };
}

export function doImportChannel(certificate: string) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.IMPORT_CHANNEL_STARTED,
    });

    return Lbry.channel_import({ channel_data: certificate })
      .then(() => {
        dispatch({
          type: ACTIONS.IMPORT_CHANNEL_COMPLETED,
        });
      })
      .catch((error) => {
        dispatch({
          type: ACTIONS.IMPORT_CHANNEL_FAILED,
          data: error,
        });
      });
  };
}

export const doFetchChannelListMine = (page: number = 1, pageSize: number = 99999, resolve: boolean = true) => (
  dispatch: Dispatch,
  getState: GetState
) => {
  const state = getState();
  const isFetching = selectFetchingMyChannels(state);

  if (isFetching) return;

  dispatch({ type: ACTIONS.FETCH_CHANNEL_LIST_STARTED });

  const callback = (response: ChannelListResponse) => {
    dispatch({ type: ACTIONS.FETCH_CHANNEL_LIST_COMPLETED, data: { claims: response.items } });
  };

  const failure = (error) => {
    dispatch({ type: ACTIONS.FETCH_CHANNEL_LIST_FAILED, data: error });
  };

  Lbry.channel_list({ page, page_size: pageSize, resolve }).then(callback, failure);
};

export function doClearClaimSearch() {
  return (dispatch: Dispatch) => {
    dispatch({ type: ACTIONS.CLEAR_CLAIM_SEARCH_HISTORY });
  };
}

export function doClaimSearch(
  options: {
    page_size?: number,
    page: number,
    no_totals?: boolean,
    any_tags?: Array<string>,
    claim_ids?: Array<string>,
    channel_ids?: Array<string>,
    not_channel_ids?: Array<string>,
    not_tags?: Array<string>,
    order_by?: Array<string>,
    release_time?: string,
    has_source?: boolean,
    has_no_source?: boolean,
  } = {
    no_totals: true,
    page_size: 10,
    page: 1,
  },
  settings: {
    useAutoPagination?: boolean,
  } = {
    useAutoPagination: false,
  }
) {
  const query = createNormalizedClaimSearchKey(options);
  return async (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.CLAIM_SEARCH_STARTED,
      data: { query: query },
    });

    const success = (data: ClaimSearchResponse) => {
      const resolveInfo = {};
      const urls = [];
      data.items.forEach((stream: Claim) => {
        resolveInfo[stream.canonical_url] = { stream };
        urls.push(stream.canonical_url);
      });

      dispatch({
        type: ACTIONS.CLAIM_SEARCH_COMPLETED,
        data: {
          query,
          resolveInfo,
          urls,
          append: options.page && options.page !== 1,
          pageSize: options.page_size,
        },
      });
      return resolveInfo;
    };

    const failure = (err) => {
      dispatch({
        type: ACTIONS.CLAIM_SEARCH_FAILED,
        data: { query },
        error: err,
      });
      return false;
    };

    const autoPaginate = () => {
      let allClaims = [];

      const next = async (data: ClaimSearchResponse) => {
        allClaims = allClaims.concat(data.items);

        const moreData = data.items.length === options.page_size;

        options.page++;

        if (options.page > 3 || !moreData) {
          // Flow doesn't understand that page_size is an optional property with a guaranteed default value.
          // $FlowFixMe
          return success({
            items: allClaims,
            page: options.page,
            page_size: options.page_size,
          });
        }

        try {
          const data = await Lbry.claim_search(options);
          return next(data);
        } catch (err) {
          failure(err);
        }
      };

      return next;
    };

    const successCallback = settings.useAutoPagination ? autoPaginate() : success;
    return await Lbry.claim_search(options).then(successCallback, failure);
  };
}

export function doRepost(options: StreamRepostOptions) {
  return (dispatch: Dispatch): Promise<any> => {
    return new Promise((resolve) => {
      dispatch({
        type: ACTIONS.CLAIM_REPOST_STARTED,
      });

      function success(response) {
        const repostClaim = response.outputs[0];
        dispatch({
          type: ACTIONS.CLAIM_REPOST_COMPLETED,
          data: {
            originalClaimId: options.claim_id,
            repostClaim,
          },
        });
        dispatch({
          type: ACTIONS.UPDATE_PENDING_CLAIMS,
          data: {
            claims: [repostClaim],
          },
        });

        dispatch(doFetchClaimListMine(1, 10));
        resolve(repostClaim);
      }

      function failure(error) {
        dispatch({
          type: ACTIONS.CLAIM_REPOST_FAILED,
          data: {
            error: error.message,
          },
        });
      }

      Lbry.stream_repost(options).then(success, failure);
    });
  };
}

export function doCheckPublishNameAvailability(name: string) {
  return (dispatch: Dispatch, getState: GetState) => {
    dispatch({
      type: ACTIONS.CHECK_PUBLISH_NAME_STARTED,
    });

    const state = getState();
    const myChannelClaimIds = selectMyChannelClaimIds(state);

    return dispatch(
      doClaimSearch(
        {
          name,
          channel_ids: myChannelClaimIds,
          page: 1,
          page_size: 50,
          no_totals: true,
          include_is_my_output: true,
        },
        {
          useAutoPagination: true,
        }
      )
    ).then((result) => {
      dispatch({
        type: ACTIONS.CHECK_PUBLISH_NAME_COMPLETED,
      });

      return Object.keys(result).length === 0;
    });
  };
}

export function doClearRepostError() {
  return {
    type: ACTIONS.CLEAR_REPOST_ERROR,
  };
}

export function doPurchaseList(page: number = 1, pageSize: number = PAGE_SIZE) {
  return (dispatch: Dispatch) => {
    dispatch({
      type: ACTIONS.PURCHASE_LIST_STARTED,
    });

    const success = (result: PurchaseListResponse) => {
      return dispatch({
        type: ACTIONS.PURCHASE_LIST_COMPLETED,
        data: {
          result,
        },
      });
    };

    const failure = (error) => {
      dispatch({
        type: ACTIONS.PURCHASE_LIST_FAILED,
        data: {
          error: error.message,
        },
      });
    };

    Lbry.purchase_list({
      page: page,
      page_size: pageSize,
      resolve: true,
    }).then(success, failure);
  };
}

export const doCheckPendingClaims = (onChannelConfirmed: Function) => (dispatch: Dispatch, getState: GetState) => {
  if (onChannelConfirmed) {
    onChannelConfirmCallback = onChannelConfirmed;
  }
  clearInterval(checkPendingInterval);
  const checkTxoList = () => {
    const state = getState();
    const pendingById = Object.assign({}, selectPendingClaimsById(state));
    const pendingTxos = (Object.values(pendingById): any).map((p) => p.txid);

    if (pendingTxos.length) {
      Lbry.txo_list({ txid: pendingTxos })
        .then((result) => {
          const txos = result.items;
          const idsToConfirm = [];
          txos.forEach((txo) => {
            if (txo.claim_id && txo.confirmations > 0) {
              idsToConfirm.push(txo.claim_id);
              delete pendingById[txo.claim_id];
            }
          });
          return { idsToConfirm, pendingById };
        })
        .then((results) => {
          const { idsToConfirm, pendingById } = results;
          if (idsToConfirm.length) {
            return Lbry.claim_list({ claim_id: idsToConfirm, resolve: true }).then((results) => {
              const claims = results.items;

              dispatch({
                type: ACTIONS.UPDATE_CONFIRMED_CLAIMS,
                data: {
                  claims: claims,
                  pending: pendingById,
                },
              });

              const channelClaims = claims.filter((claim) => claim.value_type === 'channel');
              if (channelClaims.length && onChannelConfirmCallback) {
                channelClaims.forEach((claim) => onChannelConfirmCallback(claim));
              }
              if (Object.keys(pendingById).length === 0) {
                clearInterval(checkPendingInterval);
              }
            });
          }
        });
    } else {
      clearInterval(checkPendingInterval);
    }
  };
  // do something with onConfirmed (typically get blocklist for channel)
  checkPendingInterval = setInterval(() => {
    checkTxoList();
  }, 30000);
};

export const doFetchLatestClaimForChannel = (uri: string, isEmbed?: boolean) => (
  dispatch: Dispatch,
  getState: GetState
) => {
  const searchOptions = {
    limit_claims_per_channel: 1,
    channel: uri,
    no_totals: true,
    order_by: ['release_time'],
    page: 1,
    has_source: true,
    stream_types: isEmbed ? ['audio', 'video'] : undefined,
  };

  return dispatch(doClaimSearch(searchOptions))
    .then((results) =>
      dispatch({
        type: ACTIONS.FETCH_LATEST_FOR_CHANNEL_DONE,
        data: { uri, results },
      })
    )
    .catch(() => dispatch({ type: ACTIONS.FETCH_LATEST_FOR_CHANNEL_FAIL }));
};

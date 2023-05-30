// @flow
import moment from 'moment';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import * as SETTINGS from 'constants/settings';
import { objSelectorEqualityCheck } from 'util/redux-utils';
import type { Props } from './view';
import UpcomingClaims from './view';

import { doClaimSearch } from 'redux/actions/claims';
import { doSetClientSetting } from 'redux/actions/settings';
// import { doToast } from 'redux/actions/notifications';
import { selectMutedAndBlockedChannelIds } from 'redux/selectors/blocked';
import { selectClaimSearchByQuery } from 'redux/selectors/claims';
import { selectClientSetting } from 'redux/selectors/settings';

import { LIVESTREAM_UPCOMING_BUFFER } from 'constants/livestream';
import { SCHEDULED_TAGS } from 'constants/tags';
import { createNormalizedClaimSearchKey } from 'util/claim';
import { CsOptHelper } from 'util/claim-search';
import { Container } from 'util/container';

const selectOptions = createSelector(
  (state) => state.comments.moderationBlockList,
  (state) => selectMutedAndBlockedChannelIds(state),
  (state, name, channelIds) => channelIds,
  (state, name, channelIds, isLivestream) => isLivestream,
  (state, name, channelIds, isLivestream, limitPerChannel) => limitPerChannel,
  (blocked, mutedAndBlockedIds, channelIds, isLivestream, limitPerChannel) => {
    return {
      page: 1,
      page_size: 50,
      no_totals: true,
      claim_type: ['stream'],
      remove_duplicates: true,
      any_tags: isLivestream ? [SCHEDULED_TAGS.LIVE] : [SCHEDULED_TAGS.SHOW],
      channel_ids: channelIds || [],
      not_channel_ids: mutedAndBlockedIds,
      not_tags: CsOptHelper.not_tags(),
      order_by: ['^release_time'],
      release_time: [
        `>${moment().subtract(LIVESTREAM_UPCOMING_BUFFER, 'minutes').startOf('minute').unix()}`,
        `>${Math.floor(moment().startOf('minute').unix())}`,
      ],
      ...(isLivestream ? { has_no_source: true } : { has_source: true }),
      ...(isLivestream && limitPerChannel ? { limit_claims_per_channel: limitPerChannel } : {}),
    };
  },
  {
    memoizeOptions: { maxSize: 10, resultEqualityCheck: objSelectorEqualityCheck },
  }
);

// *****************************************************************************
// UpcomingClaims
// *****************************************************************************

const select = (state, props) => {
  const csByQuery = selectClaimSearchByQuery(state) || {};
  const livestreamOptions = selectOptions(state, props.name, props.channelIds, true);
  const scheduledOptions = selectOptions(state, props.name, props.channelIds, false);

  const loKey = livestreamOptions ? createNormalizedClaimSearchKey(livestreamOptions) : '';
  const soKey = scheduledOptions ? createNormalizedClaimSearchKey(scheduledOptions) : '';

  return {
    livestreamOptions,
    scheduledOptions,
    livestreamUris: csByQuery[loKey],
    scheduledUris: csByQuery[soKey],
    hideUpcoming: selectClientSetting(state, SETTINGS.HIDE_SCHEDULED_LIVESTREAMS),
  };
};

const perform = (dispatch) => ({
  doClaimSearch: (csOptions: ClaimSearchOptions) => dispatch(doClaimSearch(csOptions)),
  setClientSetting: (key, value, pushPrefs) => dispatch(doSetClientSetting(key, value, pushPrefs)),
  // doShowSnackBar: (message) => dispatch(doToast({ isError: false, message })),
});

export default connect<_, Props, _, _, _, _>(select, perform, null, {
  areStatePropsEqual: (next: any, prev: any) => {
    if (
      (prev.livestreamUris !== undefined && next.livestreamUris === undefined) ||
      (prev.scheduledUris !== undefined && next.scheduledUris === undefined)
    ) {
      // When transitioning to a new query, freeze the update to avoid things
      // from jumping around. Eventually, the query would result in either a
      // [..] or null, which then sparks another render. This assumes we don't
      // want to show any loading indicator.
      return true;
    } else {
      return Container.Obj.shallowCompare(next, prev);
    }
  },
})(UpcomingClaims);

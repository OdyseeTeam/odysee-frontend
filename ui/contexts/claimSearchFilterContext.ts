import React from 'react';
import * as CS from 'constants/claim_search';

type ClaimSearchFilterContextType = {
  contentTypes: string[];
  liftUpTagSearch: boolean;
  isChannelSearch: boolean;
  repost?: {
    hideReposts: boolean;
    setHideReposts: (val: boolean) => void;
  };
  membersOnly?: {
    hideMembersOnly: boolean;
    setHideMembersOnly: (val: boolean) => void;
  };
};

export const ClaimSearchFilterContext = React.createContext<ClaimSearchFilterContextType>({
  contentTypes: CS.CONTENT_TYPES,
  liftUpTagSearch: false,
  isChannelSearch: false, // --Future expansion:
  // durationTypes: CS.DURATION_TYPES,
  // ...
});

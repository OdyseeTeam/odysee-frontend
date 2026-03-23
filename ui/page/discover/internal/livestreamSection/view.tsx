import React from 'react';
import Button from 'component/button';
import { ENABLE_NO_SOURCE_CLAIMS } from 'config';
import * as SETTINGS from 'constants/settings';
import * as ICONS from 'constants/icons';
import ClaimListDiscover from 'component/claimListDiscover';
import { useIsMobile, useIsLargeScreen } from 'effects/use-screensize';
import usePersistedState from 'effects/use-persisted-state';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { resolveLangForClaimSearch } from 'util/default-languages';
import { selectFilteredActiveLivestreamUris } from 'redux/selectors/livestream';
import { selectClientSetting, selectLanguage } from 'redux/selectors/settings';
import { doFetchAllActiveLivestreamsForQuery } from 'redux/actions/livestream';
const DEFAULT_LIVESTREAM_TILE_LIMIT = 8;
const SECTION = Object.freeze({
  COLLAPSED: 1,
  EXPANDED: 2,
});

function getTileLimit(isLargeScreen, originalSize) {
  return isLargeScreen ? originalSize * (3 / 2) : originalSize;
}

// ****************************************************************************
// ****************************************************************************
type Props = {
  tileLayout: boolean;
  hideMembersOnlyContent?: boolean;
  searchLanguages?: Array<string>;
  langParam?: string;
  channelIds?: Array<string>;
  excludedChannelIds?: Array<string>;
};
export default function LivestreamSection(props: Props) {
  const { tileLayout, hideMembersOnlyContent, searchLanguages, langParam, channelIds, excludedChannelIds } = props;
  const dispatch = useAppDispatch();
  const languageSetting = useAppSelector(selectLanguage);
  const searchInLanguage = useAppSelector((state) => selectClientSetting(state, SETTINGS.SEARCH_IN_LANGUAGE));
  const langCsv = resolveLangForClaimSearch(languageSetting, searchInLanguage, searchLanguages, langParam);
  const lang = langCsv ? langCsv.split(',') : null;
  const livestreamSectionQuery = { any_languages: lang };
  const livestreamSectionQueryStr = JSON.stringify(livestreamSectionQuery);
  const activeLivestreamUris = useAppSelector((state) =>
    selectFilteredActiveLivestreamUris(state, channelIds, excludedChannelIds, livestreamSectionQueryStr)
  );
  const [liveSectionStore, setLiveSectionStore] = usePersistedState('discover:lsSection', SECTION.COLLAPSED);
  const [expandedYPos, setExpandedYPos] = React.useState(null);
  const isMobile = useIsMobile();
  const isLargeScreen = useIsLargeScreen();
  const initialLiveTileLimit = isMobile ? 6 : getTileLimit(isLargeScreen, DEFAULT_LIVESTREAM_TILE_LIMIT);
  const [liveSection, setLiveSection] = React.useState(liveSectionStore || SECTION.COLLAPSED);
  const liveTilesOverLimit = activeLivestreamUris && activeLivestreamUris.length > initialLiveTileLimit;

  function collapseSection() {
    window.scrollTo(0, 0);
    setLiveSection(SECTION.COLLAPSED);
  }

  React.useEffect(() => {
    // Sync liveSection --> liveSectionStore
    if (liveSection !== liveSectionStore) {
      setLiveSectionStore(liveSection);
    }
  }, [liveSection, setLiveSectionStore, liveSectionStore]);
  React.useEffect(() => {
    dispatch(doFetchAllActiveLivestreamsForQuery(JSON.parse(livestreamSectionQueryStr)));
  }, [dispatch, livestreamSectionQueryStr]);
  React.useEffect(() => {
    // Maintain y-position when expanding livestreams section:
    if (liveSection === SECTION.EXPANDED && expandedYPos !== null) {
      window.scrollTo(0, expandedYPos);
      setExpandedYPos(null);
    }
  }, [liveSection, expandedYPos]);

  if (!activeLivestreamUris || activeLivestreamUris.length === 0) {
    return null;
  }

  if (isMobile) {
    return (
      <div className="livestream-list">
        <ClaimListDiscover
          uris={
            liveSection === SECTION.COLLAPSED
              ? activeLivestreamUris.slice(0, initialLiveTileLimit)
              : activeLivestreamUris
          }
          tileLayout={tileLayout}
          headerLabel={<h1 className="page__title">{__('Livestreams')}</h1>}
          useSkeletonScreen={false}
          showHeader={false}
          hideFilters
          hideMembersOnlyContent={hideMembersOnlyContent}
          infiniteScroll={false}
          loading={false}
          showNoSourceClaims={ENABLE_NO_SOURCE_CLAIMS}
        />

        {liveTilesOverLimit && liveSection === SECTION.COLLAPSED && (
          <div className="upcoming-list__view-more">
            <Button
              label={__('Show more livestreams')}
              button="link"
              iconRight={ICONS.DOWN}
              className="claim-grid__title--secondary"
              onClick={() => {
                dispatch(doFetchAllActiveLivestreamsForQuery());
                setExpandedYPos(window.scrollY);
                setLiveSection(SECTION.EXPANDED);
              }}
            />
          </div>
        )}

        {liveTilesOverLimit && liveSection === SECTION.EXPANDED && (
          <div className="upcoming-list__view-more">
            <Button
              label={__('Show fewer livestreams')}
              button="link"
              iconRight={ICONS.UP}
              className="claim-grid__title--secondary"
              onClick={collapseSection}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="livestream-list">
      <ClaimListDiscover
        uris={
          liveSection === SECTION.COLLAPSED ? activeLivestreamUris.slice(0, initialLiveTileLimit) : activeLivestreamUris
        }
        tileLayout={tileLayout}
        showHeader={false}
        hideFilters
        infiniteScroll={false}
        loading={false}
        showNoSourceClaims={ENABLE_NO_SOURCE_CLAIMS}
        hideMembersOnlyContent={hideMembersOnlyContent}
      />

      {liveTilesOverLimit && liveSection === SECTION.COLLAPSED && (
        <div className="upcoming-list__view-more">
          <Button
            label={__('Show more livestreams')}
            button="link"
            iconRight={ICONS.DOWN}
            className="claim-grid__title--secondary"
            onClick={() => {
              dispatch(doFetchAllActiveLivestreamsForQuery());
              setExpandedYPos(window.scrollY);
              setLiveSection(SECTION.EXPANDED);
            }}
          />
        </div>
      )}

      {liveTilesOverLimit && liveSection === SECTION.EXPANDED && (
        <div className="upcoming-list__view-more">
          <Button
            label={__('Show fewer livestreams')}
            button="link"
            iconRight={ICONS.UP}
            className="claim-grid__title--secondary"
            onClick={collapseSection}
          />
        </div>
      )}
    </div>
  );
}

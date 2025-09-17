// @flow
import * as React from 'react';
import { lazyImport } from 'util/lazyImport';
import * as ICONS from 'constants/icons';
import FileTitleSection from 'component/fileTitleSection';
import VideoClaimInitiator from 'component/videoClaimInitiator';
import ClaimCoverRender from 'component/claimCoverRender';
import Empty from 'component/common/empty';
import MobilePanel from './mobilePanel';
import { useIsMobile } from 'effects/use-screensize';
import Button from 'component/button';
import RecSys from 'recsys';
import { v4 as Uuidv4 } from 'uuid';
import './style.scss';
import { PRIMARY_PLAYER_WRAPPER_CLASS } from '../videoPlayers/view';

const CommentsList = lazyImport(() => import('component/commentsList'));

export const SHORTS_PLAYER_WRAPPER_CLASS = 'shorts-page__video-container';

type Props = {
  uri: string,
  accessStatus: ?string,
  shortsRecommendedUris?: Array<string>,
  allRecommendedUris?: Array<string>,
  isSearchingRecommendations?: boolean,
  audioVideoDuration: ?number,
  commentsListTitle: string,
  fileInfo: FileListItem,
  isMature: boolean,
  linkedCommentId?: string,
  threadCommentId?: string,
  position: number,
  commentsDisabled: ?boolean,
  contentUnlocked: boolean,
  isAutoplayCountdownForUri: ?boolean,
  sidePanelOpen: boolean,
  clearPosition: (uri: string) => void,
  doNavigateToNextShort: (nextUri: string) => void,
  doNavigateToPreviousShort: (previousUri: string) => void,
  doToggleShortsSidePanel: () => void,
  doSetShortsSidePanel: (isOpen: boolean) => void,
  doFetchRecommendedContent: (uri: string, fypParam?: ?FypParam, isShorts?: boolean) => void,
};

export default function ShortsPage(props: Props) {
  const {
    uri,
    accessStatus,
    shortsRecommendedUris,
    allRecommendedUris,
    isSearchingRecommendations,
    fileInfo,
    isMature,
    linkedCommentId,
    threadCommentId,
    commentsDisabled,
    audioVideoDuration,
    commentsListTitle,
    position,
    contentUnlocked,
    isAutoplayCountdownForUri,
    clearPosition,
    doNavigateToNextShort,
    doNavigateToPreviousShort,
    doSetShortsSidePanel,
    doToggleShortsSidePanel,
    doFetchRecommendedContent,
    sidePanelOpen,
  } = props;

  const isMobile = useIsMobile();
  const shortsContainerRef = React.useRef();
  const [viewedUris, setViewedUris] = React.useState([uri]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [uuid] = React.useState(Uuidv4());
  const [mobileModalOpen, setMobileModalOpen] = React.useState(false);
  const scrollLockRef = React.useRef(false);

  const { onRecsLoaded: onRecommendationsLoaded, onClickedRecommended: onRecommendationClicked } = RecSys;

  React.useEffect(() => {
    if (!viewedUris.includes(uri)) {
      setViewedUris((prev) => [...prev, uri]);
      setCurrentIndex((prev) => prev + 1);
    } else {
      const index = viewedUris.indexOf(uri);
      setCurrentIndex(index);
    }
  }, [uri]);

  React.useEffect(() => {
    if (doFetchRecommendedContent && uri) {
      const fypParam = uuid ? { uuid } : null;
      doFetchRecommendedContent(uri, fypParam, true);
    }
  }, [uri, doFetchRecommendedContent, uuid]);

  React.useEffect(() => {
    const claim = fileInfo?.claim;
    const claimId = claim?.claim_id;

    if (claimId && shortsRecommendedUris && shortsRecommendedUris.length > 0) {
      onRecommendationsLoaded(claimId, shortsRecommendedUris, uuid);
    }
  }, [shortsRecommendedUris, fileInfo, onRecommendationsLoaded, uuid]);

  const effectiveRecommendations = React.useMemo(() => {
    if (shortsRecommendedUris && shortsRecommendedUris.length > 0) {
      return shortsRecommendedUris;
    }
    if (allRecommendedUris && allRecommendedUris.length > 0) {
      return allRecommendedUris;
    }
    return [];
  }, [shortsRecommendedUris, allRecommendedUris]);

  const handleNavigateToNext = React.useCallback(() => {
    if (!effectiveRecommendations || effectiveRecommendations.length === 0) return;

    const claim = fileInfo?.claim;
    const currentClaimId = claim?.claim_id;

    let nextUri = null;
    for (let i = 0; i < effectiveRecommendations.length; i++) {
      if (!viewedUris.includes(effectiveRecommendations[i])) {
        nextUri = effectiveRecommendations[i];
        break;
      }
    }

    if (!nextUri && effectiveRecommendations.length > 0) {
      nextUri = effectiveRecommendations[0];
      setViewedUris([uri]);
      setCurrentIndex(0);
    }

    if (nextUri && nextUri !== uri) {
      if (currentClaimId && nextUri) {
        const nextClaimId = nextUri.split('#')[1] || nextUri.split('/').pop();
        onRecommendationClicked(currentClaimId, nextClaimId);
      }

      if (!viewedUris.includes(nextUri)) {
        setViewedUris((prev) => [...prev, nextUri]);
        setCurrentIndex((prev) => prev + 1);
      }

      doNavigateToNextShort(nextUri);
    }
  }, [effectiveRecommendations, viewedUris, fileInfo, onRecommendationClicked, doNavigateToNextShort, uri]);

  const handleNavigateToPrevious = React.useCallback(() => {
    if (currentIndex > 0) {
      const previousUri = viewedUris[currentIndex - 1];
      setCurrentIndex((prev) => prev - 1);
      doNavigateToPreviousShort(previousUri);
    }
  }, [currentIndex, viewedUris, doNavigateToPreviousShort]);

  const handleInfoButtonClick = React.useCallback(() => {
    if (isMobile) {
      setMobileModalOpen(true);
    } else {
      doToggleShortsSidePanel();
    }
  }, [isMobile, doToggleShortsSidePanel]);

  const hasNext = effectiveRecommendations && effectiveRecommendations.length > 0;
  const hasPrevious = currentIndex > 0;

  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleNavigateToPrevious();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNavigateToNext();
      } else if (e.key === 'Escape') {
        if (mobileModalOpen) {
          setMobileModalOpen(false);
        } else if (sidePanelOpen) {
          doSetShortsSidePanel(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNavigateToNext, handleNavigateToPrevious, sidePanelOpen, mobileModalOpen, doSetShortsSidePanel]);

  const handleScroll = React.useCallback(
    (e) => {
      if (mobileModalOpen || (sidePanelOpen && !isMobile)) return;
      if (scrollLockRef.current) return;

      e.preventDefault();
      scrollLockRef.current = true;

      if (e.deltaY > 0) {
        handleNavigateToNext();
      } else if (e.deltaY < 0) {
        handleNavigateToPrevious();
      }

      setTimeout(() => {
        scrollLockRef.current = false;
      }, 500);
    },
    [mobileModalOpen, sidePanelOpen, isMobile, handleNavigateToNext, handleNavigateToPrevious]
  );

  React.useEffect(() => {
    const container = shortsContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleScroll, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleScroll);
    };
  }, [handleScroll]);

  if (isMature) {
    return (
      <div className="shorts-page shorts-page--blocked">
        <div className={SHORTS_PLAYER_WRAPPER_CLASS}>
          {isAutoplayCountdownForUri && <ClaimCoverRender uri={uri} />}
          <FileTitleSection uri={uri} accessStatus={accessStatus} isNsfwBlocked />
        </div>
        <ShortsNavigation
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onNext={handleNavigateToNext}
          onPrevious={handleNavigateToPrevious}
          isLoading={isSearchingRecommendations}
        />
      </div>
    );
  }

  return (
    <div className="shorts-page" ref={shortsContainerRef}>
      <div className={`shorts-page__container ${sidePanelOpen ? 'shorts-page__container--panel-open' : ''}`}>
        <div className="shorts-page__main-content">
          <div className="shorts-page__video-section">
            <div className={`${SHORTS_PLAYER_WRAPPER_CLASS} ${PRIMARY_PLAYER_WRAPPER_CLASS}`}>
              <VideoClaimInitiator uri={uri} />
            </div>

            {!isMobile && (
              <Button
                className="shorts-page__info-button"
                onClick={handleInfoButtonClick}
                icon={ICONS.INFO}
                iconSize={20}
                title={sidePanelOpen ? __('Hide Details') : __('Show Details')}
              />
            )}

            {!isMobile && (
              <ShortsNavigation
                hasNext={hasNext}
                hasPrevious={hasPrevious}
                onNext={handleNavigateToNext}
                onPrevious={handleNavigateToPrevious}
                isLoading={isSearchingRecommendations}
              />
            )}
          </div>
        </div>

        {!isMobile && (
          <div className={`shorts-page__side-panel ${sidePanelOpen ? 'shorts-page__side-panel--open' : ''}`}>
            <div className="shorts-page__side-panel-content">
              <FileTitleSection uri={uri} accessStatus={accessStatus} />

              {contentUnlocked &&
                (commentsDisabled ? (
                  <Empty padded text={__('The creator of this content has disabled comments.')} />
                ) : (
                  <React.Suspense fallback={null}>
                    <CommentsList
                      uri={uri}
                      linkedCommentId={linkedCommentId}
                      threadCommentId={threadCommentId}
                      notInDrawer
                    />
                  </React.Suspense>
                ))}
            </div>
          </div>
        )}
        {isMobile && (
          <MobilePanel
            isOpen={mobileModalOpen}
            onClose={() => setMobileModalOpen(false)}
            onInfoClick={handleInfoButtonClick}
            uri={uri}
            accessStatus={accessStatus}
            contentUnlocked={contentUnlocked}
            commentsDisabled={commentsDisabled}
            commentsListTitle={commentsListTitle}
            linkedCommentId={linkedCommentId}
            threadCommentId={threadCommentId}
          />
        )}
      </div>
    </div>
  );
}

type NavigationProps = {
  hasNext: boolean,
  hasPrevious: boolean,
  onNext: () => void,
  onPrevious: () => void,
  isLoading?: boolean,
};

const ShortsNavigation = ({ hasNext, hasPrevious, onNext, onPrevious, isLoading }: NavigationProps) => {
  return (
    <div className="shorts-page__navigation">
      {hasPrevious && (
        <Button
          className="shorts-page__nav-button shorts-page__nav-button--previous"
          onClick={onPrevious}
          icon={ICONS.UP}
          iconSize={24}
          title={__('Previous Short')}
          disabled={isLoading}
        />
      )}
      {hasNext && (
        <Button
          className="shorts-page__nav-button shorts-page__nav-button--next"
          onClick={onNext}
          icon={ICONS.DOWN}
          iconSize={24}
          title={__('Next Short')}
          disabled={isLoading}
        />
      )}
    </div>
  );
};

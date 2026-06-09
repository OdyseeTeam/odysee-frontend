// This component is entirely for triggering the start of a video claim view
// A video/audio claim will actually be rendered by VideoRenderFloating, which
// will use this component to properly position itself based on the ClaimCoverRender
import React from 'react';
import ClaimCoverRender from 'component/claimCoverRender';
import withStreamClaimRender from 'hocs/withStreamClaimRender';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { doSetMainPlayerDimension as doSetMainPlayerDimensionAction } from 'redux/actions/app';
import { selectMainPlayerDimensions } from 'redux/selectors/app';

export const HYPERBEAM_STARTUP_BEGIN_EVENT = 'odysee-hyperbeam-startup-begin';
const HYPERBEAM_STARTUP_CLICK_EVENT = 'odysee-hyperbeam-startup-click';
const HYPERBEAM_STARTUP_READY_EVENT = 'odysee-hyperbeam-startup-ready';
const HYPERBEAM_PENDING_STARTUP_URI_KEY = '__odyseeHyperbeamPendingStartupUri';

type Props = {
  // -- withStreamClaimRender --
  uri: string;
  children?: any;
  streamClaim: () => void;
  hyperbeamStartupActive?: boolean;
  startHyperbeamStartup?: () => void;
};

const VideoClaimInitiator = (props: Props) => {
  const { uri, children, streamClaim, hyperbeamStartupActive, startHyperbeamStartup } = props;
  const [localStartupActive, setLocalStartupActive] = React.useState(
    () =>
      (window as any)[HYPERBEAM_PENDING_STARTUP_URI_KEY] === uri ||
      document.body.classList.contains('hyperbeam-startup-active')
  );
  const effectiveStartupActive = hyperbeamStartupActive || localStartupActive;
  const startupTriggeredRef = React.useRef(false);
  const dispatch = useAppDispatch();
  const mainPlayerDimensions = useAppSelector(selectMainPlayerDimensions);
  const playerRef = React.useCallback(
    (node) => {
      if (node) {
        const rect = node.getBoundingClientRect();

        if (
          !mainPlayerDimensions ||
          mainPlayerDimensions.width !== rect.width ||
          mainPlayerDimensions.height !== rect.height
        ) {
          dispatch(doSetMainPlayerDimensionAction(rect));
        }
      }
    },
    [dispatch, mainPlayerDimensions]
  );
  const lockStartup = React.useCallback(() => {
    setLocalStartupActive(true);
    startHyperbeamStartup?.();
  }, [startHyperbeamStartup]);
  const beginStartup = React.useCallback(() => {
    (window as any)[HYPERBEAM_PENDING_STARTUP_URI_KEY] = uri;
    window.dispatchEvent(new CustomEvent(HYPERBEAM_STARTUP_BEGIN_EVENT, { detail: { uri } }));
    lockStartup();
    if (!startupTriggeredRef.current) {
      startupTriggeredRef.current = true;
      streamClaim();
    }
  }, [lockStartup, streamClaim, uri]);

  React.useEffect(() => {
    const handleStartupClick = (event: Event) => {
      const detail = (event as CustomEvent<{ uri?: string }>).detail;
      if (detail?.uri && detail.uri !== uri) return;
      beginStartup();
    };
    window.addEventListener(HYPERBEAM_STARTUP_CLICK_EVENT, handleStartupClick);

    return () => window.removeEventListener(HYPERBEAM_STARTUP_CLICK_EVENT, handleStartupClick);
  }, [beginStartup, uri]);

  React.useEffect(() => {
    if ((window as any)[HYPERBEAM_PENDING_STARTUP_URI_KEY] === uri) {
      setLocalStartupActive(true);
    }

    const handleStartupBegin = (event: Event) => {
      const detail = (event as CustomEvent<{ uri?: string }>).detail;
      if (detail?.uri && detail.uri !== uri) return;
      setLocalStartupActive(true);
    };
    const handleStartupReady = (event: Event) => {
      const detail = (event as CustomEvent<{ uri?: string }>).detail;
      if (detail?.uri && detail.uri !== uri) return;
    };
    window.addEventListener(HYPERBEAM_STARTUP_BEGIN_EVENT, handleStartupBegin);
    window.addEventListener(HYPERBEAM_STARTUP_READY_EVENT, handleStartupReady);

    return () => {
      window.removeEventListener(HYPERBEAM_STARTUP_BEGIN_EVENT, handleStartupBegin);
      window.removeEventListener(HYPERBEAM_STARTUP_READY_EVENT, handleStartupReady);
    };
  }, [uri]);

  const handleStartupPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLElement> | React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
      event.stopPropagation();
      if (event.currentTarget instanceof HTMLElement) {
        const cover = event.currentTarget;
        cover?.classList.add('content__cover--preview-hidden', 'content__cover--hyperbeam-startup-active');
      }
      beginStartup();
    },
    [beginStartup]
  );
  const handleCoverClick = React.useCallback(() => {
    beginStartup();
  }, [beginStartup]);

  return (
    <ClaimCoverRender
      uri={uri}
      onClick={handleCoverClick}
      onPointerDownCapture={handleStartupPointerDown}
      onMouseDownCapture={handleStartupPointerDown}
      onTouchStartCapture={handleStartupPointerDown}
      hidePreview={effectiveStartupActive}
      passedRef={playerRef}
    >
      {children}
    </ClaimCoverRender>
  );
};

(VideoClaimInitiator as any).rendersHyperbeamStartupLayer = true;

export default withStreamClaimRender(VideoClaimInitiator);

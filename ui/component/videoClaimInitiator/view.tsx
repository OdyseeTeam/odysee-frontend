// This component is entirely for triggering the start of a video claim view
// A video/audio claim will actually be rendered by VideoRenderFloating, which
// will use this component to properly position itself based on the ClaimCoverRender
import React from 'react';
import Button from 'component/button';
import ClaimCoverRender from 'component/claimCoverRender';
import withStreamClaimRender from 'hocs/withStreamClaimRender';
import { useAppDispatch, useAppSelector } from 'redux/hooks';
import { doSetMainPlayerDimension as doSetMainPlayerDimensionAction } from 'redux/actions/app';
import { selectMainPlayerDimensions } from 'redux/selectors/app';
type Props = {
  // -- withStreamClaimRender --
  uri: string;
  children?: any;
  streamClaim: () => void;
};

const VideoClaimInitiator = (props: Props) => {
  const { uri, children, streamClaim } = props;
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
  return (
    <ClaimCoverRender uri={uri} onClick={streamClaim} passedRef={playerRef}>
      <Button className="button--icon button--play" onClick={streamClaim} iconSize={30} title={__('Play')} />
      {children}
    </ClaimCoverRender>
  );
};

export default withStreamClaimRender(VideoClaimInitiator);

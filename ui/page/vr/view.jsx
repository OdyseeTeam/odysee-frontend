// @flow
import * as React from 'react';
import Page from 'component/page';
import VRViewer from 'component/viewers/vrViewer';
import Button from 'component/button';
import * as ICONS from 'constants/icons';
import Card from 'component/common/card';

type Props = {
  claim: ?StreamClaim,
  streamingUrl: ?string,
};

function VRPage(props: Props) {
  const { claim, streamingUrl } = props;

  const videoSource = streamingUrl || (claim && claim.value && claim.value.source && claim.value.source.sd_hash);
  const isVideo = claim && claim.value && claim.value.stream_type === 'video';

  return (
    <Page className="vr-page">
      <div className="vr-page__header">
        <h1>VR Experience</h1>
        <div className="vr-page__info">
          <Card
            title="Welcome to Odysee VR"
            body={
              <div>
                <p>Experience Odysee content in Virtual Reality. This prototype demonstrates:</p>
                <ul>
                  <li>WebXR-powered VR environment</li>
                  <li>Spatial video playback</li>
                  <li>VR controller support</li>
                  <li>Immersive 3D space</li>
                </ul>
                <p>
                  <strong>Requirements:</strong>
                </p>
                <ul>
                  <li>VR headset (Oculus Quest, HTC Vive, etc.)</li>
                  <li>WebXR-compatible browser (Chrome, Edge, Firefox Reality)</li>
                  <li>HTTPS connection</li>
                </ul>
                <p>
                  <strong>Controls:</strong>
                </p>
                <ul>
                  <li>Trigger button: Play/Pause video</li>
                  <li>Look around: Move your head</li>
                  <li>Press "Enter VR" button to start</li>
                </ul>
              </div>
            }
          />
        </div>
      </div>

      <VRViewer
        source={{
          fileType: 'video',
          downloadPath: videoSource || '',
        }}
        videoSource={videoSource}
        isVideo={isVideo}
      />
    </Page>
  );
}

export default VRPage;

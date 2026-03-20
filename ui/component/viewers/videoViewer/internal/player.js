import { createPlayer } from '@videojs/react';
import { videoFeatures } from '@videojs/react/video';

const Player = createPlayer({ features: videoFeatures, displayName: 'OdyseePlayer' });

export default Player;

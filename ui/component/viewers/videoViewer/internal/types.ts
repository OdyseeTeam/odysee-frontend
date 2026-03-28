import type Hls from 'hls.js';
import type { HlsConfig } from 'hls.js';

export type P2PEngine = {
  addEventListener: (type: string, listener: (...args: any[]) => void) => void;
  core?: {
    manifestResponseUrl?: string | null;
    streams?: Map<any, any>;
  };
};

export type HlsWithP2P = Hls & {
  p2pEngine?: P2PEngine;
};

export type MediaWithHls = HTMLMediaElement & {
  _hls?: HlsWithP2P;
};

export type P2PHlsConfig = Partial<HlsConfig> & {
  p2p?: {
    core?: {
      announceTrackers?: string[];
      highDemandTimeWindow?: number;
      simultaneousHttpDownloads?: number;
      simultaneousP2PDownloads?: number;
      p2pNotReadyTimeoutMs?: number;
      httpNotReadyTimeoutMs?: number;
      swarmId?: string;
      rtcConfig?: {
        iceServers?: RTCIceServer[];
      };
    };
  };
};

export const HLS_EVENT_ERROR = 'hlsError';
export const HLS_EVENT_LEVEL_LOADED = 'hlsLevelLoaded';
export const HLS_EVENT_MANIFEST_PARSED = 'hlsManifestParsed';

export const HLS_ERROR_TYPE_MEDIA = 'mediaError';
export const HLS_ERROR_TYPE_NETWORK = 'networkError';

let hlsConstructorPromise: Promise<any> | undefined;

export function loadHlsConstructor(): Promise<any> {
  if (!hlsConstructorPromise) {
    hlsConstructorPromise = import('hls.js').then((module) => module.default || module);
  }

  return hlsConstructorPromise;
}

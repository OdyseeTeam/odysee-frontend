// @flow

declare type HlsQualitySelectorOptions = {|
  defaultQuality?: string,
  displayCurrentQuality: boolean,
  originalHeight?: number,
  placementIndex?: number, // controlBar placement index
  vjsIconClass?: string,
  // These two are from React.useState(), so it tightly couples the plugin to the view.
  initialQualityChange?: boolean, // "used to notify about default quality setting"
  setInitialQualityChange?: (any) => void,
  doToast: (params: ToastParams) => void,
|};

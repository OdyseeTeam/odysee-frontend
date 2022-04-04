// @flow
import { ALERT } from 'constants/icons';
import { SETTINGS_GRP } from 'constants/settings';
import React from 'react';
import Button from 'component/button';
import Card from 'component/common/card';
import SettingsRow from 'component/settingsRow';

type Price = {
  currency: string,
  amount: number,
};

type SetDaemonSettingArg = boolean | string | number | Price;

type DaemonSettings = {
  download_dir: string,
  share_usage_data: boolean,
  max_key_fee?: Price,
  max_connections_per_download?: number,
  save_files: boolean,
  save_blobs: boolean,
  ffmpeg_path: string,
};

type Props = {
  // --- select ---
  daemonSettings: DaemonSettings,
  ffmpegStatus: { available: boolean, which: string },
  findingFFmpeg: boolean,
  walletEncrypted: boolean,
  isAuthenticated: boolean,
  allowAnalytics: boolean,
  // --- perform ---
  setDaemonSetting: (string, ?SetDaemonSettingArg) => void,
  clearDaemonSetting: (string) => void,
  clearCache: () => Promise<any>,
  findFFmpeg: () => void,
  encryptWallet: () => void,
  decryptWallet: () => void,
  updateWalletStatus: () => void,
  confirmForgetPassword: ({}) => void,
  toggle3PAnalytics: (boolean) => void,
};

export default function SettingSystem(props: Props) {
  const { clearCache } = props;

  const [clearingCache, setClearingCache] = React.useState(false);

  return (
    <>
      <div className="card__title-section">
        <h2 className="card__title">{__('System')}</h2>
      </div>
      <Card
        id={SETTINGS_GRP.SYSTEM}
        isBodyList
        body={
          <>
            <SettingsRow
              title={__('Clear application cache')}
              subtitle={__('This might fix issues that you are having. Your wallet will not be affected.')}
            >
              <Button
                button="secondary"
                icon={ALERT}
                label={clearingCache ? __('Clearing') : __('Clear Cache')}
                onClick={() => {
                  setClearingCache(true);
                  clearCache();
                }}
                disabled={clearingCache}
              />
            </SettingsRow>
          </>
        }
      />
    </>
  );
}

import * as React from 'react';
import Card from 'component/common/card';

// Wallet backup is only available in the desktop app.
// On web, wallet data is managed by the sync service.
export default function WalletBackup() {
  return (
    <Card
      title={__('Wallet Backup')}
      subtitle={__(
        'Wallet backup is only available in the Odysee desktop app. Your wallet is automatically synced when Sync is enabled.'
      )}
    />
  );
}

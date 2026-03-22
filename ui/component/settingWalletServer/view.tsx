import React, { useState, useEffect, useRef } from 'react';
import { FormField } from 'component/common/form';
import Button from 'component/button';
import I18nMessage from 'component/i18nMessage';
import * as ICONS from 'constants/icons';
import ServerInputRow from './internal/inputRow';
import { stringifyServerParam } from 'util/sync-settings';
import { useAppSelector, useAppDispatch } from 'redux/hooks';
import { selectIsWalletReconnecting } from 'redux/selectors/wallet';
import * as DAEMON_SETTINGS from 'constants/daemon_settings';
import {
  doSetDaemonSetting,
  doClearDaemonSetting,
  doGetDaemonStatus,
  doSaveCustomWalletServers,
} from 'redux/actions/settings';
import { selectSavedWalletServers, selectDaemonStatus, selectHasWalletServerPrefs } from 'redux/selectors/settings';

type StatusOfServer = {
  host: string;
  port: string;
  availability: boolean;
  latency: number;
};
type ServerTuple = [string, string]; // ['host', 'port']

type ServerStatus = Array<StatusOfServer>;
type ServerConfig = Array<ServerTuple>;

function SettingWalletServer() {
  const dispatch = useAppDispatch();

  const daemonStatus = useAppSelector(selectDaemonStatus);
  const customWalletServers: ServerConfig = useAppSelector(selectSavedWalletServers);
  const hasWalletServerPrefs = useAppSelector(selectHasWalletServerPrefs);
  const walletReconnecting = useAppSelector(selectIsWalletReconnecting);

  const setCustomWalletServers = (value: any) => dispatch(doSetDaemonSetting(DAEMON_SETTINGS.LBRYUM_SERVERS, value));
  const clearWalletServers = () => dispatch(doClearDaemonSetting(DAEMON_SETTINGS.LBRYUM_SERVERS));
  const getDaemonStatus = () => dispatch(doGetDaemonStatus());
  const saveServerConfig = (servers: Array<ServerTuple>) => dispatch(doSaveCustomWalletServers(servers));

  const [advancedMode, setAdvancedMode] = useState(false);
  const walletStatus = daemonStatus && daemonStatus.wallet;
  const activeWalletServers: ServerStatus = (walletStatus && walletStatus.servers) || [];
  const availableServers = walletStatus && walletStatus.available_servers;
  const serverConfig: ServerConfig = customWalletServers;
  const STATUS_INTERVAL = 5000;
  // onUnmount, if there are no available servers, doClear()
  // in order to replicate componentWillUnmount, the effect needs to get the value from a ref
  const hasAvailableRef = useRef();
  useEffect(
    () => () => {
      hasAvailableRef.current = availableServers;
    },
    [availableServers]
  );
  useEffect(
    () => () => {
      if (!hasAvailableRef.current) {
        doClear();
      }
    }, // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
    []
  );
  useEffect(() => {
    if (hasWalletServerPrefs) {
      setAdvancedMode(true);
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      getDaemonStatus();
    }, STATUS_INTERVAL);
    return () => clearInterval(interval); // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only
  }, []);

  function doClear() {
    setAdvancedMode(false);
    clearWalletServers();
  }

  function onAdd(serverTuple: ServerTuple) {
    let newServerConfig = serverConfig.concat();
    newServerConfig.push(serverTuple);
    updateServers(newServerConfig);
  }

  function onDelete(i: number) {
    const newServerConfig = serverConfig.concat();
    newServerConfig.splice(i, 1);
    updateServers(newServerConfig);
  }

  function updateServers(newConfig) {
    saveServerConfig(newConfig);
    setCustomWalletServers(stringifyServerParam(newConfig));
  }

  return (
    <React.Fragment>
      <fieldset-section>
        <FormField
          type="radio"
          name="default_wallet_servers"
          checked={!advancedMode}
          label={__('Use official lbry.tv wallet servers')}
          onChange={(e) => {
            if (e.target.checked) {
              doClear();
            }
          }}
        />
        <FormField
          type="radio"
          name="custom_wallet_servers"
          checked={advancedMode}
          onChange={(e) => {
            setAdvancedMode(e.target.checked);

            if (e.target.checked && customWalletServers.length) {
              setCustomWalletServers(stringifyServerParam(customWalletServers));
            }
          }}
          label={__('Use custom wallet servers')}
        />
        <p className="help">
          <I18nMessage
            tokens={{
              learn_more: <Button button="link" href="http://lbry.com/faq/wallet-servers" label={__('Learn More')} />,
            }}
          >
            Wallet servers are used to relay data to and from the LBRY blockchain. They also determine what content
            shows in trending or is blocked. %learn_more%
          </I18nMessage>
        </p>

        {advancedMode && (
          <div>
            {serverConfig &&
              serverConfig.map((entry, index) => {
                const [host, port] = entry;
                const available = activeWalletServers.some(
                  (s) => s.host === entry[0] && String(s.port) === entry[1] && s.availability
                );
                return (
                  <div
                    key={`${host}:${port}`}
                    className="section section--padded card--inline form-field__internal-option"
                  >
                    <h3>
                      {host}:{port}
                    </h3>
                    <span className="help">
                      {available ? __('Connected') : walletReconnecting ? __('Connecting...') : __('Not connected')}
                    </span>
                    <Button
                      button="close"
                      title={__('Remove custom wallet server')}
                      icon={ICONS.REMOVE}
                      onClick={() => onDelete(index)}
                    />
                  </div>
                );
              })}
            <div className="form-field__internal-option">
              <ServerInputRow update={onAdd} />
            </div>
          </div>
        )}
      </fieldset-section>
    </React.Fragment>
  );
}

export default SettingWalletServer;

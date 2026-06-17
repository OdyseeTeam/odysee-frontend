import { ODYSEE_HYPERBEAM_NODE_API } from 'config';
import { HYPERBEAM_DEVICE, hyperbeamDeviceUrl } from '../../ui/util/hyperbeamDevices';
import { isHyperbeamDeviceEnabled, isHyperbeamFullMode } from '../../ui/util/hyperbeamMode';
import { useEffect } from 'react';
import { getAuthToken } from 'util/saved-passwords';
import { X_LBRY_AUTH_TOKEN } from 'constants/token';
import fetchWithTimeout from 'util/fetch';
import Lbry from 'lbry';
const STATUS_GENERAL_STATE = {
  // internal/status/status.go#L44
  OK: 'ok',
  NOT_READY: 'not_ready',
  OFFLINE: 'offline',
  FAILING: 'failing',
};
const STATUS_TIMEOUT_LIMIT = 10000;
export const STATUS_OK = 'ok';
export const STATUS_DEGRADED = 'degraded';
export const STATUS_FAILING = 'failing';
export const STATUS_DOWN = 'down';

const getGeneralState = (status) => {
  const nodeStatus = status?.result || status;

  if (status?.general_state) {
    return status.general_state;
  }

  if (nodeStatus?.general_state) {
    return nodeStatus.general_state;
  }

  if (nodeStatus?.is_running && nodeStatus?.connection_status?.code === 'connected') {
    return STATUS_GENERAL_STATE.OK;
  }

  return STATUS_GENERAL_STATE.FAILING;
};

const getParams = (user) => {
  const headers = {};
  const token = getAuthToken();

  if (token && user && user.has_verified_email) {
    headers[X_LBRY_AUTH_TOKEN] = token;
  }

  const params = {
    headers,
  };
  return params;
};

export function useDegradedPerformance(onDegradedPerformanceCallback, user, doSetAssignedLbrynetServer) {
  const hasUser = user !== undefined && user !== null;
  useEffect(() => {
    if (isHyperbeamFullMode()) {
      return;
    }

    if (hasUser) {
      const statusPromise = isHyperbeamDeviceEnabled(HYPERBEAM_DEVICE.internalApis)
        ? fetchWithTimeout(
            STATUS_TIMEOUT_LIMIT,
            fetch(hyperbeamDeviceUrl(HYPERBEAM_DEVICE.internalApis, 'status', { params64: 'e30' }), getParams(user))
          ).then((response: any) => response.json())
        : fetchWithTimeout(STATUS_TIMEOUT_LIMIT, Lbry.status());

      statusPromise
        .then((status) => {
          const nodeStatus = status?.result || status;
          const generalState = getGeneralState(status);

          doSetAssignedLbrynetServer(nodeStatus?.user?.assigned_lbrynet_server);

          if (generalState === STATUS_GENERAL_STATE.OFFLINE) {
            onDegradedPerformanceCallback(STATUS_DOWN);
          } else if (generalState !== STATUS_GENERAL_STATE.OK) {
            onDegradedPerformanceCallback(STATUS_FAILING);
          }
        })
        .catch(() => {
          onDegradedPerformanceCallback(STATUS_FAILING);
        });
    } // eslint-disable-next-line react-hooks/exhaustive-deps -- @see TODO_NEED_VERIFICATION
  }, [hasUser]);
}

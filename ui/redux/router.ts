const CALL_HISTORY_METHOD = '@@router/CALL_HISTORY_METHOD';
const LOCATION_CHANGE = '@@router/LOCATION_CHANGE';

type HistoryMethod = 'push' | 'replace' | 'go' | 'back' | 'forward';
type HistoryAction = {
  type: typeof CALL_HISTORY_METHOD;
  payload: {
    method: HistoryMethod;
    args: Array<any>;
  };
};
type LocationChangeAction = {
  type: typeof LOCATION_CHANGE;
  payload: {
    action: string;
    location: any;
  };
};
type HistoryListener = (location: any, action: string) => void;
type RouterNavigate = (to: any, options?: { replace?: boolean; state?: any }) => void;

const listeners = new Set<HistoryListener>();
const pendingActions: Array<HistoryAction['payload']> = [];
let navigateRef: RouterNavigate | null = null;
let currentAction = 'POP';
let currentLocation = getWindowLocation();

function getWindowLocation() {
  if (typeof window === 'undefined') {
    return {
      pathname: '/',
      search: '',
      hash: '',
      state: undefined,
      key: 'default',
    };
  }

  const rawState = window.history.state;
  const state =
    rawState && typeof rawState === 'object' && Object.prototype.hasOwnProperty.call(rawState, 'usr')
      ? rawState.usr
      : rawState;
  const key =
    rawState && typeof rawState === 'object' && Object.prototype.hasOwnProperty.call(rawState, 'key')
      ? rawState.key
      : 'default';

  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    state,
    key,
  };
}

function normalizeTo(to: any) {
  if (!to || typeof to === 'string') return to;

  const { state: _state, ...nextTo } = to;
  return nextTo;
}

function getState(to: any, state?: any) {
  if (to && typeof to === 'object' && Object.prototype.hasOwnProperty.call(to, 'state')) {
    return to.state;
  }

  return state;
}

function createHref(to: any) {
  if (!to || typeof to === 'string') return to || '/';

  const pathname = to.pathname || currentLocation.pathname || '/';
  const search = to.search ? (String(to.search).startsWith('?') ? to.search : `?${to.search}`) : '';
  const hash = to.hash ? (String(to.hash).startsWith('#') ? to.hash : `#${to.hash}`) : '';

  return `${pathname}${search}${hash}`;
}

function notifyListeners(location: any, action: string) {
  for (const listener of listeners) {
    listener(location, action);
  }
}

function updateCurrentLocation(location: any, action: string) {
  currentLocation = location;
  currentAction = action;
  notifyListeners(location, action);
}

export function setRouterSnapshot(location: any, action: string) {
  currentLocation = location;
  currentAction = action;
}

function applyHistoryMethod(method: HistoryMethod, args: Array<any>) {
  switch (method) {
    case 'push': {
      if (!navigateRef) {
        pendingActions.push({ method, args });
        return;
      }

      const [to, state] = args;
      navigateRef(normalizeTo(to), { state: getState(to, state) });
      break;
    }

    case 'replace': {
      if (!navigateRef) {
        pendingActions.push({ method, args });
        return;
      }

      const [to, state] = args;
      navigateRef(normalizeTo(to), { replace: true, state: getState(to, state) });
      break;
    }

    case 'go':
      window.history.go(args[0]);
      break;

    case 'back':
      window.history.back();
      break;

    case 'forward':
      window.history.forward();
      break;

    default:
      break;
  }
}

function flushPendingActions() {
  if (!navigateRef || pendingActions.length === 0) {
    return;
  }

  const actions = pendingActions.splice(0, pendingActions.length);
  actions.forEach(({ method, args }) => applyHistoryMethod(method, args));
}

export function setRouterNavigator(navigate: RouterNavigate) {
  navigateRef = navigate;
  flushPendingActions();
}

export function clearRouterNavigator() {
  navigateRef = null;
}

const createHistoryAction = (method: HistoryMethod, ...args: Array<any>): HistoryAction => ({
  type: CALL_HISTORY_METHOD,
  payload: {
    method,
    args,
  },
});

export const push = (to: any) => createHistoryAction('push', to);
export const replace = (to: any) => createHistoryAction('replace', to);
export const go = (delta: number) => createHistoryAction('go', delta);
export const goBack = () => createHistoryAction('back');
export const goForward = () => createHistoryAction('forward');

export const navigateTo = (to: any, state?: any) => applyHistoryMethod('push', [to, state]);
export const replaceTo = (to: any, state?: any) => applyHistoryMethod('replace', [to, state]);
export const navigateByDelta = (delta: number) => applyHistoryMethod('go', [delta]);
export const navigateBack = () => applyHistoryMethod('back', []);
export const navigateForward = () => applyHistoryMethod('forward', []);

const createLocationChange = (location: any, action: string): LocationChangeAction => ({
  type: LOCATION_CHANGE,
  payload: {
    action,
    location,
  },
});

export const syncRouterLocation = (location: any, action: string): LocationChangeAction => {
  updateCurrentLocation(location, action);
  return createLocationChange(location, action);
};

export const history = {
  get action() {
    return currentAction;
  },
  get location() {
    return currentLocation;
  },
  push(to: any, state?: any) {
    applyHistoryMethod('push', [to, state]);
  },
  replace(to: any, state?: any) {
    applyHistoryMethod('replace', [to, state]);
  },
  go(delta: number) {
    applyHistoryMethod('go', [delta]);
  },
  goBack() {
    applyHistoryMethod('back', []);
  },
  goForward() {
    applyHistoryMethod('forward', []);
  },
  createHref(to: any) {
    return createHref(normalizeTo(to));
  },
  listen(listener: HistoryListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  block() {
    return () => {};
  },
};

export function routerReducer(
  state = {
    action: history.action,
    location: history.location,
  },
  action: LocationChangeAction
) {
  if (action.type === LOCATION_CHANGE) {
    return action.payload;
  }

  return state;
}

export const routerMiddleware = () => () => (next: (action: any) => any) => (action: HistoryAction) => {
  if (action.type === CALL_HISTORY_METHOD) {
    const { method, args } = action.payload;
    applyHistoryMethod(method, args);
  }

  return next(action);
};

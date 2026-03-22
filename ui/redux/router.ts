import { createBrowserHistory } from 'history';

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

export const browserHistory = createBrowserHistory();

type HistoryListener = (location: any, action: string) => void;

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

export const history = {
  get action() {
    return browserHistory.action;
  },
  get location() {
    return browserHistory.location;
  },
  push(to: any, state?: any) {
    browserHistory.push(normalizeTo(to), getState(to, state));
  },
  replace(to: any, state?: any) {
    browserHistory.replace(normalizeTo(to), getState(to, state));
  },
  go(delta: number) {
    browserHistory.go(delta);
  },
  goBack() {
    browserHistory.back();
  },
  goForward() {
    browserHistory.forward();
  },
  createHref(to: any) {
    return browserHistory.createHref(normalizeTo(to));
  },
  listen(listener: HistoryListener) {
    return browserHistory.listen(({ location, action }) => listener(location, action));
  },
  block(blocker: any) {
    return browserHistory.block(blocker);
  },
};

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

const createLocationChange = (location: any, action: string): LocationChangeAction => ({
  type: LOCATION_CHANGE,
  payload: {
    action,
    location,
  },
});

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

    switch (method) {
      case 'push':
        history.push(...args);
        break;

      case 'replace':
        history.replace(...args);
        break;

      case 'go':
        history.go(...args);
        break;

      case 'back':
        history.goBack();
        break;

      case 'forward':
        history.goForward();
        break;

      default:
        break;
    }
  }

  return next(action);
};

export const initRouterSync = (store: { dispatch: (action: LocationChangeAction) => void }) =>
  history.listen((location, action) => {
    store.dispatch(createLocationChange(location, action));
  });

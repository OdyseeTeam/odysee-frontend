import { store } from 'store';

const env = process.env.NODE_ENV || 'production';
const logs = [];
let pause_asserts = false;

const app = {
  env,
  store,
  logs,
  log(message) {
    logs.push(message);
  },
  pause_asserts,
};

global.app = app;

// Lbryinc needs access to the redux store for dispatching auth-releated actions
global.store = app.store;
window.store = app.store; // added to fix missing redux tools. remove if problems.

export default app;

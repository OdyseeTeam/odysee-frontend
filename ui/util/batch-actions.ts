// https://github.com/reactjs/redux/issues/911
interface Action {
  type: string;
  [key: string]: unknown;
}

interface BatchAction {
  type: 'BATCH_ACTIONS';
  actions: Action[];
}

export function batchActions(...actions: Action[]): BatchAction {
  return {
    type: 'BATCH_ACTIONS',
    actions,
  };
}

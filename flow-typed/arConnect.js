declare type ArConnectState = {
  status: 'loading' | 'connected' | 'disconnected',
  address?: string,
  balance: number,
};
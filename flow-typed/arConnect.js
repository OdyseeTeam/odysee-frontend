declare type ArConnectState = {
  status: 'loading' | 'connected' | 'disconnected',
  address?: string,
  balance: number,
};

declare type ArweaveTipDataForId = {
  address: string,
  default: boolean,
  currency: string,
  status: 'active' | 'inactive',
};

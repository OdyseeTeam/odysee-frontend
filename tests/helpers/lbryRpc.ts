import type { Page, Request } from '@playwright/test';

export type LbryRpcCall = {
  id: unknown;
  method: string;
  params: unknown;
  request: Request;
};

export type LbryRpcHandler = (call: LbryRpcCall) => unknown | Promise<unknown>;

export type LbryRpcMock = {
  calls: Array<LbryRpcCall>;
  callsFor: (method: string) => Array<LbryRpcCall>;
};

type MockOptions = {
  failOnUnhandled?: boolean;
  unexpectedMethods?: Array<string>;
};

type HandlerMap = Record<string, unknown | LbryRpcHandler>;

const daemonUrlPattern = /^https?:\/\/[^/?#]+\/?\?m=[^&]+/;

export function lbryioCallRoute(resource: string, action: string) {
  const expectedPath = `/${resource}/${action}`;

  return (url: URL) => {
    const pathname = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
    return pathname === expectedPath;
  };
}

export async function mockLbryRpc(page: Page, handlers: HandlerMap, options: MockOptions = {}): Promise<LbryRpcMock> {
  const calls: Array<LbryRpcCall> = [];
  const unexpectedMethods = new Set(options.unexpectedMethods || []);

  await page.route(daemonUrlPattern, async (route, request) => {
    const payload = request.postDataJSON();
    const url = new URL(request.url());
    const method = String(payload?.method || url.searchParams.get('m') || '');
    const params = payload?.params;
    const call = {
      id: payload?.id,
      method,
      params,
      request,
    };

    if (unexpectedMethods.has(method)) {
      calls.push(call);
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: `Unexpected LBRY RPC call: ${method}`,
          },
          id: call.id,
        }),
      });
      return;
    }

    const handler = handlers[method];

    if (handler === undefined) {
      if (options.failOnUnhandled) {
        calls.push(call);
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: `Unhandled LBRY RPC call: ${method}`,
            },
            id: call.id,
          }),
        });
        return;
      }

      await route.fallback();
      return;
    }

    calls.push(call);

    const result = typeof handler === 'function' ? await (handler as LbryRpcHandler)(call) : handler;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jsonrpc: '2.0',
        result,
        id: call.id,
      }),
    });
  });

  return {
    calls,
    callsFor: (method: string) => calls.filter((call) => call.method === method),
  };
}

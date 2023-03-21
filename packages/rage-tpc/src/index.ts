/// <reference types="ragemp-s" />
/// <reference types="ragemp-c" />

function uuid() {
  let uuid = '',
    random;

  for (let i = 0; i < 32; i++) {
    random = (Math.random() * 16) | 0;

    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += '-';
    }

    uuid += (i === 12 ? 4 : i === 16 ? (random & 3) | 8 : random).toString(16);
  }

  return uuid;
}

// server (player.call) -> client
// client (mp.events.callRemote) -> server

// client (browser.call) -> cef
// cef (mp.trigger) -> client

// cef (mp.trigger) -> client (mp.events.callRemote) -> server
// server (player.call) -> client (browser.call) -> cef

declare const Metadata: unique symbol;

enum RTPCEvents {
  Response = '__rtpc_response',
}

type WithMetadata<T> = { [Metadata]?: T };

type EventsRoute<
  TEvents extends Record<
    string,
    ServerProcedure | ClientProcedure | BrowserProcedure | EventsRoute
  > = Record<string, ServerProcedure | ClientProcedure | BrowserProcedure | EventsRoute<any>>
> = {
  build(keyPrefix?: string): void;
  events: TEvents;
};

type EventsRouteCaller<TEvents extends EventsRoute> = {
  [K in keyof TEvents['events']]: TEvents['events'][K] extends WithMetadata<{ publicType: infer K }>
    ? K
    : TEvents['events'][K] extends EventsRoute<any>
    ? EventsRouteCaller<TEvents['events'][K]>
    : never;
};

type RTPCRequest<TData extends any[] = unknown[]> = {
  id: string;
  clientId: string;
  data: TData;
};

type RTPCResponse<TData = unknown> = {
  id: string;
  clientId: string;
} & (
  | {
      status: 'ok';
      data: TData;
    }
  | {
      status: 'error';
      error: unknown;
    }
);

type BaseProcedure<TArgs extends any[] = any[], TReturn = any> = {
  [Metadata]?: {
    publicType: (...args: TArgs) => Promise<Awaited<TReturn>>;
  };
};

type ServerProcedure<TArgs extends any[] = any[], TReturn = any> = BaseProcedure<TArgs, TReturn> & {
  fn(player: PlayerMp, request: string): Promise<void>;
};

type ServerRTPC = {
  events<TEvents extends Record<string, ServerProcedure | EventsRoute>>(
    events: TEvents
  ): EventsRoute<TEvents>;

  procedure<TArgs extends any[], TReturn>(
    cb: (player: PlayerMp, ...args: TArgs) => TReturn
  ): ServerProcedure<TArgs, TReturn>;

  createClientCaller<TClient extends EventsRoute>(): {
    to(player: PlayerMp): EventsRouteCaller<TClient>;
  };
  // createBrowserCaller<TClient>(): TClient;
};

// TODO: Remove code duplication
export function createServerRTPC(): ServerRTPC {
  return {
    events: eventMap => {
      return {
        events: eventMap,
        build: keyPrefix => {
          for (const [key, handlerOrEventMap] of Object.entries(eventMap)) {
            const eventName = keyPrefix ? `${keyPrefix}:${key}` : key;
            if ('build' in handlerOrEventMap) {
              handlerOrEventMap.build(eventName);
            } else {
              mp.events.add(eventName, handlerOrEventMap.fn);
            }
          }
        },
      };
    },
    procedure: cb => ({
      async fn(player, requestString) {
        const request = JSON.parse(requestString) as RTPCRequest<any>;

        try {
          const result = await cb(player, ...request.data);
          const response: RTPCResponse = {
            status: 'ok',
            id: request.id,
            clientId: request.clientId,
            data: result,
          };

          player.call(`${RTPCEvents.Response}:${request.clientId}`, [JSON.stringify(response)]);
        } catch (error) {
          const response: RTPCResponse = {
            status: 'error',
            id: request.id,
            clientId: request.clientId,
            error,
          };

          player.call(`${RTPCEvents.Response}:${request.clientId}`, [JSON.stringify(response)]);
        }
      },
    }),
    createClientCaller: () => {
      const clientId = uuid();
      const responseCallbackMap = new Map<string, Defer>();

      mp.events.add(
        `${RTPCEvents.Response}:${clientId}`,
        (player: PlayerMp, responseString: string) => {
          const response = JSON.parse(responseString) as RTPCResponse;
          const responseCallback = responseCallbackMap.get(response.id);

          if (!responseCallback) return;
          if (response.status === 'ok') responseCallback.resolve(response.data);
          else
            responseCallback.reject(
              new RTPCError('Client returned error', { cause: response.error })
            );
        }
      );

      return {
        to: player =>
          createRecursiveFnProxy((keys, args) => {
            if (keys.length === 0) return;
            const requestId = uuid();
            const eventName = keys.join(':');
            const deferred = defer();
            const request: RTPCRequest = {
              clientId,
              id: requestId,
              data: args,
            };

            responseCallbackMap.set(requestId, deferred);
            player.call(eventName, [JSON.stringify(request)]);

            return deferred.promise;
          }) as any,
      };
    },
  };
}

type ClientProcedure<TArgs extends any[] = any[], TReturn = any> = BaseProcedure<TArgs, TReturn> & {
  fn(request: string): Promise<void>;
};

type ClientRTPC = {
  events<TEvents extends Record<string, ClientProcedure | EventsRoute>>(
    events: TEvents
  ): EventsRoute<TEvents>;

  procedure<TArgs extends any[], TReturn>(
    cb: (...args: TArgs) => TReturn
  ): ClientProcedure<TArgs, TReturn>;

  createServerCaller<TClient extends EventsRoute>(): EventsRouteCaller<TClient>;
  createBrowserCaller<TClient extends EventsRoute>(): {
    to(browser: BrowserMp): EventsRouteCaller<TClient>;
  };
};

export function createClientRTPC(): ClientRTPC {
  return {
    events: eventMap => {
      return {
        events: eventMap,
        build: keyPrefix => {
          for (const [key, handlerOrEventMap] of Object.entries(eventMap)) {
            const eventName = keyPrefix ? `${keyPrefix}:${key}` : key;
            if ('build' in handlerOrEventMap) {
              handlerOrEventMap.build(eventName);
            } else {
              mp.events.add(eventName, handlerOrEventMap.fn);
            }
          }
        },
      };
    },
    procedure: cb => ({
      async fn(requestString) {
        const request = JSON.parse(requestString) as RTPCRequest<any>;

        try {
          const result = await cb(...request.data);
          const response: RTPCResponse = {
            status: 'ok',
            id: request.id,
            clientId: request.clientId,
            data: result,
          };

          mp.events.callRemote(
            `${RTPCEvents.Response}:${request.clientId}`,
            JSON.stringify(response)
          );
        } catch (error) {
          const response: RTPCResponse = {
            status: 'error',
            id: request.id,
            clientId: request.clientId,
            error,
          };

          mp.events.callRemote(
            `${RTPCEvents.Response}:${request.clientId}`,
            JSON.stringify(response)
          );
        }
      },
    }),
    createServerCaller: () => {
      const clientId = uuid();
      const responseCallbackMap = new Map<string, Defer>();

      mp.events.add(`${RTPCEvents.Response}:${clientId}`, (responseString: string) => {
        const response = JSON.parse(responseString) as RTPCResponse;
        const responseCallback = responseCallbackMap.get(response.id);

        if (!responseCallback) return;
        if (response.status === 'ok') responseCallback.resolve(response.data);
        else
          responseCallback.reject(
            new RTPCError('Server returned error', { cause: response.error })
          );
      });

      return createRecursiveFnProxy((keys, args) => {
        if (keys.length === 0) return;
        const requestId = uuid();
        const eventName = keys.join(':');
        const deferred = defer();
        const request: RTPCRequest = {
          clientId,
          id: requestId,
          data: args,
        };

        responseCallbackMap.set(requestId, deferred);
        mp.events.callRemote(eventName, JSON.stringify(request));

        // return timeout(deferred.promise, 100_000); // TODO
        return deferred.promise;
      }) as any;
    },
    createBrowserCaller: () => {
      const clientId = uuid();
      const responseCallbackMap = new Map<string, Defer>();

      mp.events.add(`${RTPCEvents.Response}:${clientId}`, (responseString: string) => {
        const response = JSON.parse(responseString) as RTPCResponse;
        const responseCallback = responseCallbackMap.get(response.id);

        if (!responseCallback) return;
        if (response.status === 'ok') responseCallback.resolve(response.data);
        else
          responseCallback.reject(
            new RTPCError('Browser returned error', { cause: response.error })
          );
      });

      return {
        to: browser =>
          createRecursiveFnProxy((keys, args) => {
            if (keys.length === 0) return;
            const requestId = uuid();
            const eventName = keys.join(':');
            const deferred = defer();
            const request: RTPCRequest = {
              clientId,
              id: requestId,
              data: args,
            };

            responseCallbackMap.set(requestId, deferred);
            browser.call(eventName, JSON.stringify(request));

            // return timeout(deferred.promise, 100_000); // TODO
            return deferred.promise;
          }) as any,
      };
    },
  };
}

type BrowserProcedure<TArgs extends any[] = any[], TReturn = any> = BaseProcedure<
  TArgs,
  TReturn
> & {
  fn(request: string): Promise<void>;
};

type BrowserRTPC = {
  events<TEvents extends Record<string, BrowserProcedure | EventsRoute>>(
    events: TEvents
  ): EventsRoute<TEvents>;

  procedure<TArgs extends any[], TReturn>(
    cb: (...args: TArgs) => TReturn
  ): BrowserProcedure<TArgs, TReturn>;

  createClientCaller<TClient extends EventsRoute>(): EventsRouteCaller<TClient>;
};

export function createBrowserRTPC(): BrowserRTPC {
  return {
    events: eventMap => {
      return {
        events: eventMap,
        build: keyPrefix => {
          for (const [key, handlerOrEventMap] of Object.entries(eventMap)) {
            const eventName = keyPrefix ? `${keyPrefix}:${key}` : key;
            if ('build' in handlerOrEventMap) {
              handlerOrEventMap.build(eventName);
            } else {
              mp.events.add(eventName, handlerOrEventMap.fn);
            }
          }
        },
      };
    },
    procedure: cb => ({
      async fn(requestString) {
        const request = JSON.parse(requestString) as RTPCRequest<any>;

        try {
          const result = await cb(...request.data);
          const response: RTPCResponse = {
            status: 'ok',
            id: request.id,
            clientId: request.clientId,
            data: result,
          };

          mp.events.call(`${RTPCEvents.Response}:${request.clientId}`, JSON.stringify(response));
        } catch (error) {
          const response: RTPCResponse = {
            status: 'error',
            id: request.id,
            clientId: request.clientId,
            error,
          };

          mp.events.call(`${RTPCEvents.Response}:${request.clientId}`, JSON.stringify(response));
        }
      },
    }),
    createClientCaller: () => {
      const clientId = uuid();
      const responseCallbackMap = new Map<string, Defer>();

      mp.events.add(`${RTPCEvents.Response}:${clientId}`, (responseString: string) => {
        const response = JSON.parse(responseString) as RTPCResponse;
        const responseCallback = responseCallbackMap.get(response.id);

        if (!responseCallback) return;
        if (response.status === 'ok') responseCallback.resolve(response.data);
        else
          responseCallback.reject(
            new RTPCError('Client returned error', { cause: response.error })
          );
      });

      return createRecursiveFnProxy((keys, args) => {
        if (keys.length === 0) return;
        const requestId = uuid();
        const eventName = keys.join(':');
        const deferred = defer();
        const request: RTPCRequest = {
          clientId,
          id: requestId,
          data: args,
        };

        responseCallbackMap.set(requestId, deferred);
        mp.events.call(eventName, JSON.stringify(request));

        // return timeout(deferred.promise, 100_000); // TODO
        return deferred.promise;
      }) as any;
    },
  };
}

function createRecursiveFnProxy(
  fn: (keys: string[], args: any[]) => any,
  keys: string[] = []
): (keys: string[], args: any[]) => any {
  return new Proxy(((...args: any[]) => fn(keys, args)) as any, {
    get(_, key) {
      const typedKey = key as string;
      return createRecursiveFnProxy(fn, [...keys, typedKey]);
    },
  });
}

type Defer<T = unknown> = {
  promise: Promise<T>;
  resolve(value: T | PromiseLike<T>): void;
  reject(reason?: any): void;
};

function defer<T = unknown>() {
  const deferred = {} as Defer<T>;

  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
}

function timeout<T>(promise: Promise<T>, ms: number, exception?: Error) {
  let timer: number;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(reject, ms, exception ?? new RTPCError('Timed out'));
    }),
  ]).finally(() => clearTimeout(timer));
}

class RTPCError extends Error {
  name = 'RTPCError';
}

/**
 * createLocalClient - why tho?
 * server (mp.events.call) -> server
 * client (mp.events.call) -> client
 *
 * Ar4ys: We definitely should not support this use case, as it will bring circular dependency in
 * createClientRTPC/createServerRTPC, which completely breaks TS type inference.
 *
 */

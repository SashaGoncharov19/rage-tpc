/// <reference types="ragemp-s" />
/// <reference types="ragemp-c" />

// server (player.call) -> client
// client (mp.events.callRemote) -> server

// client (browser.call) -> cef
// cef (mp.trigger) -> client

// cef (mp.trigger) -> client (mp.events.callRemote) -> server
// server (player.call) -> client (browser.call) -> cef
declare const Metadata: unique symbol;

type WithMetadata<T> = { [Metadata]?: T };

type EventsRoute<
  TEvents extends Record<
    string,
    ServerProcedure<any[]> | ClientProcedure<any[]> | EventsRoute
  > = Record<string, ServerProcedure<any[]> | ClientProcedure<any[]> | EventsRoute<any>>
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

type ServerProcedure<TArgs extends any[]> = {
  [Metadata]?: {
    publicType: (...args: TArgs) => Promise<void>;
  };
  (player: PlayerMp, ...args: TArgs): void;
};

type ClientProcedure<TArgs extends any[]> = {
  [Metadata]?: {
    publicType: (...args: TArgs) => Promise<void>;
  };
  (...args: TArgs): void;
};

type ServerRTPC = {
  events<TEvents extends Record<string, ServerProcedure<any[]> | EventsRoute>>(
    events: TEvents
  ): EventsRoute<TEvents>;

  procedure<TArgs extends any[]>(
    cb: (player: PlayerMp, ...args: TArgs) => void
  ): ServerProcedure<TArgs>;

  createClientCaller<TClient extends EventsRoute>(): {
    to(player: PlayerMp): EventsRouteCaller<TClient>;
  };
  // createCEFCaller<TClient>(): TClient;
};

type ClientRTPC = {
  events<TEvents extends Record<string, ClientProcedure<any[]> | EventsRoute>>(
    events: TEvents
  ): EventsRoute<TEvents>;

  procedure<TArgs extends any[]>(cb: (...args: TArgs) => void): ClientProcedure<TArgs>;

  createServerCaller<TClient extends EventsRoute>(): EventsRouteCaller<TClient>;
  // createCEFCaller<TClient>(): TClient;
};

export function createServerRTPC(): ServerRTPC {
  return {
    events: eventMap => {
      return {
        events: eventMap,
        build: keyPrefix => {
          for (const [key, handlerOrEvent] of Object.entries(eventMap)) {
            const eventName = keyPrefix ? `${keyPrefix}:${key}` : key;
            if ('build' in handlerOrEvent) {
              handlerOrEvent.build(eventName);
            } else {
              mp.events.add(eventName, handlerOrEvent);
            }
          }
        },
      };
    },
    procedure: cb => cb,
    createClientCaller: () => ({
      to: player =>
        createRecursiveFnProxy((keys, args) => {
          if (keys.length === 0) return;
          const eventName = keys.join(':');
          player.call(eventName, args);
        }) as any,
    }),
  };
}

export function createClientRTPC(): ClientRTPC {
  return {
    events: eventMap => {
      return {
        events: eventMap,
        build: keyPrefix => {
          for (const [key, handlerOrEvent] of Object.entries(eventMap)) {
            const eventName = keyPrefix ? `${keyPrefix}:${key}` : key;
            if ('build' in handlerOrEvent) {
              handlerOrEvent.build(eventName);
            } else {
              mp.events.add(eventName, handlerOrEvent);
            }
          }
        },
      };
    },
    procedure: cb => cb,
    createServerCaller: () =>
      createRecursiveFnProxy((keys, args) => {
        if (keys.length === 0) return;
        const eventName = keys.join(':');
        mp.events.callRemote(eventName, ...args);
      }) as any,
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

// createLocalClient - why tho?
// server (mp.events.call) -> server
// client (mp.events.call) -> client

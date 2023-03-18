// server (player.call) -> client
// client (mp.events.callRemote) -> server

// client (browser.call) -> cef
// cef (mp.trigger) -> client

// cef (mp.trigger) -> client (mp.events.callRemote) -> server
// server (player.call) -> client (browser.call) -> cef
declare const Metadata: unique symbol;

type GetMetadata<T> = T extends { [Metadata]: infer K } ? K : never;

type EventsRoute<
  TEvents extends Record<
    string,
    ServerProcedure<any[]> | ClientProcedure<any[]> | EventsRoute
  > = Record<string, any>
> = {
  build(keyPrefix?: string): void;
  events: TEvents;
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

  createClientCaller<TClient>(): {
    broadcast: TClient;
    to(player: PlayerMp): TClient;
  };
  // createCEFCaller<TClient>(): TClient;
};

type ClientRTPC = {
  events<TEvents extends Record<string, ClientProcedure<any[]> | EventsRoute>>(
    events: TEvents
  ): EventsRoute<TEvents>;

  procedure<TArgs extends any[]>(cb: (...args: TArgs) => void): ClientProcedure<TArgs>;

  createServerCaller<TClient>(): TClient;
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
    createClientCaller: (() => {}) as any,
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
    createServerCaller: (() => {}) as any,
  };
}

// createLocalClient - why tho?
// server (mp.events.call) -> server
// client (mp.events.call) -> client

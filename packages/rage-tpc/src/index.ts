// server (player.call) -> client
// client (mp.events.callRemote) -> server

// client (browser.call) -> cef
// cef (mp.trigger) -> client

// cef (mp.trigger) -> client (mp.events.callRemote) -> server
// server (player.call) -> client (browser.call) -> cef

export {};

type PlayerMp = {
  health: number;
  call(): any;
};

export declare function createServerRTPC(): {
  route<TRoutes extends Record<string, any>>(routes: TRoutes): TRoutes;

  procedure<TArgs extends any[]>(
    cb: (player: PlayerMp, ...args: TArgs) => void
  ): (...args: TArgs) => Promise<void>;

  createClientCaller<TClient>(): {
    broadcast: TClient;
    to(player: PlayerMp): TClient;
  };
  // createCEFCaller<TClient>(): TClient;
};

export declare function createClientRTPC(): {
  route<TRoutes extends Record<string, any>>(routes: TRoutes): TRoutes;

  procedure<TArgs extends any[]>(cb: (...args: TArgs) => void): (...args: TArgs) => Promise<void>;

  createServerCaller<TClient>(): TClient;
  // createCEFCaller<TClient>(): TClient;
};

// createLocalClient - why tho?
// server (mp.events.call) -> server
// client (mp.events.call) -> client

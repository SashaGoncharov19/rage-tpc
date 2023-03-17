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

declare function createServerRTPC(): {
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

declare function createClientRTPC(): {
  route<TRoutes extends Record<string, any>>(routes: TRoutes): TRoutes;

  procedure<TArgs extends any[]>(cb: (...args: TArgs) => void): (...args: TArgs) => Promise<void>;

  createServerCaller<TClient>(): TClient;
  // createCEFCaller<TClient>(): TClient;
};

namespace ClientCode {
  const rtpc = createClientRTPC();
  const server = rtpc.createServerCaller<ServerCode.ServerRoutes>();
  server.login('as', 'sd');

  const appRoutes = rtpc.route({
    showHud: rtpc.procedure((shown: boolean) => {
      // do something cool
    }),
  });

  export type ClientRoutes = typeof appRoutes;
}

namespace ServerCode {
  const rtpc = createServerRTPC();
  const client = rtpc.createClientCaller<ClientCode.ClientRoutes>();

  const appRoutes = rtpc.route({
    login: rtpc.procedure(async (player, login: string, password: string) => {
      if (login === password) {
        client.to(player).showHud(true);
      }
    }),
  });

  export type ServerRoutes = typeof appRoutes;
}

// createLocalClient - why tho?
// server (mp.events.call) -> server
// client (mp.events.call) -> client

/// <reference types="@types/ragemp-c"/>

import { createBrowserRTPC, createClientRTPC } from 'rage-tpc';
import type { ServerRoutes } from '@rtpc/server';

// TODO: Move to `ui` package
{
  const rtpc = createBrowserRTPC();
  const clientRTPC = rtpc.createClientCaller<ClientRoutes>();

  const appRoutes = rtpc.events({
    hello: rtpc.procedure(async () => {
      console.log('Hello');
      await clientRTPC.world();
    }),
  });

  export type BrowserRoutes = typeof appRoutes;
}

const rtpc = createClientRTPC();
const serverRTPC = rtpc.createServerCaller<ServerRoutes>();
const browserRTPC = rtpc.createBrowserCaller<BrowserRoutes>();

const browser = mp.browsers.new('');
browserRTPC.to(browser).hello();

const appRoutes = rtpc.events({
  showHud: rtpc.procedure((shown: boolean) => {
    mp.gui.chat.show(shown);
    mp.console.logInfo(`${shown}`, true, true);
  }),
  world: rtpc.procedure(() => {
    mp.console.logInfo('World!', true, true);
  }),
});

mp.keys.bind(0x36, true, async () => {
  const data = await serverRTPC.login('hi', 'from client');
  mp.console.logInfo(data, true, true);
});

appRoutes.build();

export type ClientRoutes = typeof appRoutes;

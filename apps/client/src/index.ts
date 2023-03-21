/// <reference types="@types/ragemp-c"/>

import { createClientRTPC } from 'rage-tpc';
import type { ServerRoutes } from '@rtpc/server';
import type { BrowserRoutes } from '@rtpc/browser';

const rtpc = createClientRTPC();
const serverRTPC = rtpc.createServerCaller<ServerRoutes>();
const browserRTPC = rtpc.createBrowserCaller<BrowserRoutes>();

const browser = mp.browsers.new('package://browser/index.html');

browserRTPC.to(browser);

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

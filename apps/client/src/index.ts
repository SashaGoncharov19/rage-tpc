/// <reference types="@types/ragemp-c"/>

import { createClientRTPC } from 'rage-tpc';
import type { ServerRoutes } from '@rtpc/server';

const rtpc = createClientRTPC();
const server = rtpc.createServerCaller<ServerRoutes>();

const appRoutes = rtpc.events({
  showHud: rtpc.procedure((shown: boolean) => {
    mp.gui.chat.show(shown);
    mp.console.logInfo(`${shown}`, true, true);
  }),
});

mp.keys.bind(0x36, true, () => {
  server.login('hi', 'from client');
});

appRoutes.build();

export type ClientRoutes = typeof appRoutes;

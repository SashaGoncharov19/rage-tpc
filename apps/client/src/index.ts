/// <reference types="@types/ragemp-c"/>

import { createClientRTPC } from 'rage-tpc';
import type { ServerRoutes } from '@rtpc/server';

const rtpc = createClientRTPC();
const server = rtpc.createServerCaller<ServerRoutes>();

const appRoutes = rtpc.events({
  showHud: rtpc.procedure((shown: boolean) => {
    mp.gui.chat.show(shown);
  }),
});

appRoutes.build();

export type ClientRoutes = typeof appRoutes;

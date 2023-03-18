/// <reference types="@types/ragemp-s" />

import { createServerRTPC } from 'rage-tpc';
import type { ClientRoutes } from '@rtpc/client';

const rtpc = createServerRTPC();
const client = rtpc.createClientCaller<ClientRoutes>();

const appRoutes = rtpc.events({
  login: rtpc.procedure(async (player, login: string, password: string) => {
    // if (login === password) {
    //   await client.to(player).showHud(false);
    // }
  }),
});

appRoutes.build();

export type ServerRoutes = typeof appRoutes;

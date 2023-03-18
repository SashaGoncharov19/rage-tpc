/// <reference types="@types/ragemp-s" />

import { createServerRTPC } from 'rage-tpc';
import type { ClientRoutes } from '@rtpc/client';

const rtpc = createServerRTPC();
const client = rtpc.createClientCaller<ClientRoutes>();

const appRoutes = rtpc.events({
  login: rtpc.procedure(async (player, login: string, password: string) => {
    console.log(`${login} ${password} ${player.socialClub}`);
    client.to(player).showHud(false);
  }),
});

appRoutes.build();

export type ServerRoutes = typeof appRoutes;

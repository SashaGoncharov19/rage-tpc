/// <reference types="@ragempcommunity/types-server" />

import './events'
import './commands'

import { createServerRTPC } from 'rage-tpc';
import type { ClientRoutes } from '@rtpc/client';

const rtpc = createServerRTPC();
const clientRTPC = rtpc.createClientCaller<ClientRoutes>();

const appRoutes = rtpc.events({
  login: rtpc.procedure(async (player, login: string, password: string) => {
    console.log(`${login} ${password} ${player.socialClub}`);
    await clientRTPC.to(player).showHud(false);
    return 'successfully logged in';
  }),
});

appRoutes.build();

export type ServerRoutes = typeof appRoutes;

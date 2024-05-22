/// <reference types="@ragempcommunity/types-server" />

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

mp.events.addCommand('veh', (player, fullText, name, plate) => {
  const { position, dimension } = player;
  const vehicle = mp.vehicles.new(mp.joaat(name ?? 'neon'), position, {
    dimension,
    numberPlate: plate ?? 'ADMIN',
  });
  player.putIntoVehicle(vehicle, 0);
});

appRoutes.build();

export type ServerRoutes = typeof appRoutes;

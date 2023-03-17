import { createServerRTPC } from '../src'
import type { ClientRoutes } from '../client';

const rtpc = createServerRTPC();
const client = rtpc.createClientCaller<ClientRoutes>();

const appRoutes = rtpc.route({
    login: rtpc.procedure(async (player, login: string, password: string) => {
        if (login === password) {
            await client.to(player).showHud(false)
        }
    }),
});

export type ServerRoutes = typeof appRoutes;
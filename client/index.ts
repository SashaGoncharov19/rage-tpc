/// <reference types="@types/ragemp-c"/>

import { createClientRTPC } from '../src';
import type { ServerRoutes } from '../packages';

const rtpc = createClientRTPC();
const server = rtpc.createServerCaller<ServerRoutes>();
server.login('as', 'as');

const appRoutes = rtpc.route({
    showHud: rtpc.procedure((shown: boolean) => {
        mp.gui.chat.show(shown);
    }),
});

export type ClientRoutes = typeof appRoutes;
import { createBrowserRTPC } from 'rage-tpc';
import { ClientRoutes } from '@rtpc/client';

export const rtpc = createBrowserRTPC();
export const clientRTPC = rtpc.createClientCaller<ClientRoutes>();

clientRTPC.world();

const appRoutes = rtpc.events({
  hello: rtpc.procedure(async () => {
    console.log('Hello');
    await clientRTPC.world();
  }),
});

appRoutes.build();

export type BrowserRoutes = typeof appRoutes;

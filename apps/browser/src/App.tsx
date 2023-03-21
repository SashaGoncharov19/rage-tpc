import React from 'react';
import { createBrowserRTPC } from 'rage-tpc';
import { ClientRoutes } from '@rtpc/client';

const rtpc = createBrowserRTPC();
const clientRTPC = rtpc.createClientCaller<ClientRoutes>();

const appRoutes = rtpc.events({
    hello: rtpc.procedure(async () => {
        console.log('Hello');
        await clientRTPC.world();
    })
});

appRoutes.build();

const App = () => {
    return (
        <div>
          Hui
        </div>
    );
};

export default App;
export type BrowserRoutes = typeof appRoutes;
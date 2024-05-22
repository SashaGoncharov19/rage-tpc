import { SpawnPoints } from './data/playerDeath.json';

//Тут мы создали евент когда игрок умирает
mp.events.add('playerDeath', (player) => {
    player.spawn(new mp.Vector3(SpawnPoints[Math.floor(Math.random() * SpawnPoints.length)]));
    player.health = 100;
});


//Этот евент отвечает что выполнится когда игрок подключится к серверу
mp.events.add('playerJoin', (player) => {
    player.outputChatBox(`Приветствуем тебя, ${player.name}!`);
    player.position = new mp.Vector3(-1039.4312, -2740.8552, 13.8812);
});

console.log('[SERVER] Евенты загружены!');

export {}
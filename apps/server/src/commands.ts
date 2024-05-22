//КОМАНДА ДЛЯ ИЗМЕНЕНИЕ ВРЕМЕНИ НА СЕРВЕРЕ
mp.events.addCommand('time', (player, time) => {
    if (!time) return player.outputChatBox("Правильное использование: /time [0-24]");
    const parsedTime = parseInt(time)

    if(parsedTime < 0 || parsedTime > 24) return player.outputChatBox("<SERVER> Временной диапазон 0-24!");

    mp.world.time.hour = parsedTime;

    player.notify('~g~Вы изменили время!');
    mp.players.broadcast(`${player.name} изменил время игры!`);
    console.log(`<LOG> ${player.name} изменил время игры!`);
});

//КОМАНДА ДЛЯ ИЗМЕНЕНИЕ ПОГОДЫ
mp.events.addCommand('setw', (player, _, weather) => {
    if (!weather) return player.outputChatBox('/setw [weather]');

    mp.world.weather = weather;

    mp.players.broadcast(`${player.name} изменил погоду в игре!`);
    console.log(`<LOG> ${player.name} изменил погоду в игре!`);
})

//Команда /pos
mp.events.addCommand('pos', (player) => {
    player.outputChatBox(`${player.position}`);
    console.log(player.position)
});

//Команда суицида
mp.events.addCommand('kill', (player) => {
    player.health = 0;
});

//Команда восстановления здоровья
mp.events.addCommand('hp', (player) => {
    player.health = 100;
});

//Команда выдачи бронежилета
mp.events.addCommand('armor', (player) => {
    player.armour = 100;
});

//Команда спавна автомобиля /veh carname (/veh neon)
mp.events.addCommand('veh', (player, _, id, veh, color1, color2) => {
    if (!id || !veh) return player.outputChatBox('/veh [id] [model] [color1] [color2]');

    let target = mp.players.at(parseInt(id));
    if (target == null) return player.notify('~r~ID игрока не найден!');

    const adminVeh = mp.vehicles.new(
        mp.joaat(veh),
        new mp.Vector3(target.position.x + 2, target.position.y, target.position.z)
    );

    adminVeh.setColor(parseInt(color1), parseInt(color2));
    adminVeh.setMod(parseInt('53'), parseInt('2'));

    adminVeh.numberPlate = `${player.name} ${player.id}`;

    setTimeout(() => {
        target.putIntoVehicle(adminVeh, 0) // Спавн за водительское место
    }, 150)

    player.notify('~g~ Заспавенно!');
})

//Команда для вывода информации всем игрокам (Не протестировано)
mp.events.addCommand('gl', (player, fullText, args) => {
    mp.players.broadcast(`[A] ${player.name}: ${args}`);
});

console.log('[SERVER] Команды загружены!');

export {}
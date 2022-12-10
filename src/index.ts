import { Telegraf } from 'telegraf'
import { groups, Schedule } from "./schedule";
import { getTecDay, weeksBetween } from "./util/date";

process.env.BOT_TOKEN = '';

const sm_start = new Date(2022, 7, 26, 17);
const days = {
    'Среда': 'Среду',
    'Пятница': 'Пятницу',
    'Суббота': 'Субботу',
}

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Привет, спасибо за использование '));

bot.command('schedule', async ctx => {
    console.log('request!')

    const c = new Schedule('22ИТ-2');
    await c.updateData();

    const args = ctx.update.message.text.split(' ');
    if (args[1]) {
        const num: number = +args[1];
        if (!num || num < 1) {
            return await ctx.replyWithHTML(
                '<b>Введено неверное число!</b>'
            );
        }

        for (let i = 0; i < c.schedules.length; i++) {
            const schedule = c.schedules[i];

            await ctx.replyWithHTML(
                '<b>Расписание занятий на ' + (days[schedule.getName()] || schedule.getName()) + ' (' + num + ' неделя)</b>\n\n' +
                schedule.toStringWeek(num) +
                (
                    i == (c.schedules.length-1)
                        ? '<i>Последнее обновление: ' + c.getLastPolessuUpdate() + '</i>' + '\n' +
                          '<i>Последняя проверка обновлений: ' + c.getLastUpdate() + '</i>'

                        : ''
                )
            );
        }

        return;
    }

    const schedule = c.schedules[getTecDay()];
    const num = weeksBetween(sm_start, new Date()) + 1;

    await ctx.replyWithHTML(
        '<b>Расписание занятий на ' + (days[schedule.getName()] || schedule.getName()) + ' (' + num + ' неделя)</b>\n\n' +
        schedule.toStringWeek(num) +
        '<i>Последнее обновление: ' + c.getLastPolessuUpdate() + '</i>' + '\n' +
        '<i>Последняя проверка обновлений: ' + c.getLastUpdate() + '</i>'
    );
});

bot.command('debug', async ctx => {
    await ctx.replyWithHTML(
        '<i>ID канала: ' + ctx.chat.id + '</i>\n' +
        '<i>ID сообщения: ' + ctx.message.message_id + '</i>\n' +
        '<i>ID автора: ' + ctx.message.from.id + '</i>'
    );
});

bot.command('groups', async ctx => {
    return await ctx.reply(
        groups.join(' ')
    );
});

bot.launch().then(() => console.log('Bot started successful'));

setInterval(() => {
    // Update schedule
}, 1000 * 60 * 10);

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

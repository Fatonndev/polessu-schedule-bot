export function weeksBetween(d1: Date, d2) {
    return Math.floor((d2.getTime() - d1.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

export const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

export function getTecDay() {
    const tec = new Date();
    let day = tec.getDay() - 1;

    if (day == -1) {
        return 0;
    }

    if (tec.getHours() > 17) {
        day++;
    }

    if (day > 4) {
        return 0;
    }

    return day;
}

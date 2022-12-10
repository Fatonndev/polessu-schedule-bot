import html_parser, { HTMLElement, TextNode } from 'node-html-parser';
import axios from "axios";

export const groups = [
    '18АПК-1з', '18БТ-1', '18БТ-2', '18ЛМК-1', '18НПД-1з', '18ФК-1з',
    '19АПК-1з', '19АЭ-1', '19БД-1', '19БД-1з', '19БД-2', '19БТ-1', '19БТ-2', '19БУ-1', '19БУ-1з', '19ИТ-1', '19ИТ-2', '19ЛМК-1', '19ММТ-1', '19МПП-1', '19МСП-1', '19НПД-1', '19НПД-1з', '19ОАФК-1', '19ПД-1', '19ПР-1', '19С-1', '19СПД-1', '19СПС-1', '19Ф-1', '19ФК-1', '19ФК-1з', '19ФРиЭ-1з', '19ФРЭ-1', '19ЭУП-1', '19ЭУП-1з',
    '20АПК-1з', '20БД-1', '20БД-1з', '20БД-2', '20БТ-1', '20БТ-2', '20БТ-3', '20БУ-1', '20БУ-1з', '20ИТ-1', '20ИТ-2', '20ИТ-3', '20ЛМК-1', '20ЛМК-2', '20ММТ-1 ', '20МПП-1  ', '20МСП-1', '20НПД-1', '20НПД-1з', '20ОАФК-1', '20ОАФК-2', '20ПД-1', '20ПР-1', '20С-1', '20СПД-1', '20СПС-1', '20Ф-1', '20ФБЭ-1 ', '20ФК-1', '20ФК-1з', '20ФРиЭ-1з', '20ФРЭ-1', '20ЭУП-1', '20ЭУП-1з',
    '21АЭ-1', '21БД-1з', '21БТ-1', '21БТ-2', '21БУ-1', '21БУ-1з', '21БХ-1', '21ИТ-1', '21ИТ-2', '21ИТ-3', '21ЛМК-1', '21ЛМК-2', '21М(ин)-М', '21М(ин)-М2', '21М(ин)-МБ ', '21ММТ-1', '21МПП-1', '21НПД-1', '21НПД-1з', '21ОАФК-1', '21ОАФК-2', '21ПД-1', '21ПР-1', '21СПД-1', '21СПС-1', '21УИП-1', '21ФИК-1', '21ФИК-2', '21ФИК-3', '21ФИК-4', '21ФК-1', '21ФК-1з', '21ФРЭ-1', '21ФРЭ-1з', '21ЭУП-1', '21ЭУП-1з', '21ЭУП-2', '21ЭУП-2з',
    '22БА-1', '22БТ-1', '22БТ-2', '22БУ-1', '22БУ-1з', '22БХ-1', '22ИТ-1', '22ИТ-2', '22ИТ-3', '22ЛМК-1', '22ЛМК-2', '22М-МБ', '22ММТ-1', '22М-ПиХРП', '22МПП-1', '22М-УП', '22М-ФКиС', '22М-ФНК-1', '22М-ФНК-2', '22М-ЭИР', '22М-ЭМ', '22НПД-1', '22НПД-1з', '22ОАФК-1', '22ОАФК-2', '22ПР-1', '22СПД-1', '22СПС-1', '22УИП-1', '22ФБЭ-1', '22ФиК-1з', '22ФИК-1', '22ФИК-2', '22ФИК-3', '22ФК-1', '22ФК-1з', '22ФРЭ-1', '22ФРЭ-1з', '22ЭУП-1', '22ЭУП-2', '22ЭУП-2з',
];

export class Schedule {
    public last_update: Date;
    public last_polessu_update: string;
    private readonly group_name;
    public schedules: ScheduleDay[];

    constructor(group_name: string) {
        this.group_name = group_name;
    }

    getLastUpdate() {
        const d = this.last_update;

        return ("0" + d.getDate()).slice(-2) + "." + ("0"+(d.getMonth()+1)).slice(-2) + "." +
            d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
    }

    getLastPolessuUpdate() {
        return this.last_polessu_update.split(': ')[1];
    }

    async updateData() {
        const request = await axios.get('https://www.polessu.by/ruz/term2/?f=1&q=' + encodeURIComponent(this.group_name));

        const root = html_parser.parse(request.data);

        // Ищем единственный элемент с footer
        this.last_polessu_update = root.getElementsByTagName('footer')[0]
            .childNodes[1] // Заходим в <div class="container">
            .childNodes[1] // Заходим в <p class="small">
            .childNodes[0] // Выбираем элемент с временем
            .rawText;

        // Ищем таблицу, которая имеет уникальный ID 'weeks-filter'
        const table = root.getElementById('weeks-filter');

        const schedules = [];
        let current_schedule = new ScheduleDay('Не указано');

        // Перебираем ВСЕ строки таблицы, заголовки в т.ч.
        for (const node of table.childNodes) {
            const html_node = node as HTMLElement;

            if (node.childNodes.length < 3 || !html_node.classList) {
                // Убираем мусор по типу бессмысленных сток для отступов
                continue;
            }

            if (html_node.classList.contains('wa')) {
                // Если это заголовок, то добавляем в массив предыдущий и создаем новый

                const day_node = html_node.childNodes[0].childNodes[0] as TextNode;
                const day = day_node.rawText;

                // Проверяем пропущеный заголовок на сервере (на всякий случай)
                if (current_schedule.getName() !== 'Не указано' || current_schedule.getData().length > 0) {
                    schedules.push(current_schedule);
                }

                // Сначала записываем все данные, и только по готовности добавляем в массив
                current_schedule = new ScheduleDay(day);

                continue;
            }

            const row = new ScheduleRow()
                .fromHTML(html_node);

            current_schedule.getData().push(row);
        }

        schedules.push(current_schedule);

        this.schedules = schedules;
        this.last_update = new Date();
    }
}

export class ScheduleDay {
    private readonly name: string;
    private data: ScheduleRow[] = [];

    constructor(day_name: string) {
        this.name = day_name;
    }

    getName() {
        return this.name;
    }

    getData() {
        return this.data;
    }

    toString() {
        return this.data.map(v => v.toString()).join('\n\n')
    }

    toStringWeek(week: string | number) {
        let result = '';

        for (const v of this.data) {
            if (v.containsWeek(week)) {
                result += v.toString() + '\n\n';
            }
        }

        return result;
    }
}

export class ScheduleRow {
    private name;
    private time;
    private teacher;
    private room;
    private group;
    private weeks: string;

    setName(name: string) {
        this.weeks = name.split(')')[0] + ')';

        this.name = name;
        return this;
    }

    setTime(time: string) {
        this.time = time;
        return this;
    }

    setTeacher(teacher: string) {
        this.teacher = teacher;
        return this;
    }

    setRoom(room: string | number) {
        this.room = room;
        return this;
    }

    setGroup(group: string | number) {
        this.group = group;
        return this;
    }

    fromHTML(node: HTMLElement) {
        this.setTime(this._fromNode(node, 0))
            .setName(this._fromNode(node, 1))
            .setRoom(this._fromNode(node, 2))
            .setTeacher(this._fromNode(node, 3))
            .setGroup(this._fromNode(node, 4))

        return this;
    }

    containsWeek(week: string | number): boolean {
        return this.weeks.includes(' ' + week + ',')
            || this.weeks.includes(' ' + week + ')')
            || this.weeks.includes('(' + week + ')')
            || this.weeks.includes('(' + week + ',')
            || this.weeks.includes('(' + week + '-')
            || this.weeks.includes(' ' + week + '-')
            || this.weeks.includes('-' + week + ')')
            || this.weeks.includes('-' + week + ',');
    }

    toString() {
        return '<b>' + this.time + '</b>  -  [ <b>' + this.room + '</b> ] ' + this.group + '\n'
            + '   - '+ this.name + '\n'
            + '   - '+ this.teacher
    }

    private _fromNode(node: HTMLElement, id: number): string {
        return node.childNodes[id].childNodes[0].rawText.trim();
    }
}

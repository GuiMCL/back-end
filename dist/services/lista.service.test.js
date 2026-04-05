"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const lista_service_1 = require("./lista.service");
const prisma_1 = require("../lib/prisma");
let eventId;
const SLUG = 'cha-lista-test';
(0, vitest_1.beforeEach)(async () => {
    await prisma_1.prisma.reservation.deleteMany();
    await prisma_1.prisma.guest.deleteMany();
    await prisma_1.prisma.item.deleteMany();
    await prisma_1.prisma.event.deleteMany();
    await prisma_1.prisma.host.deleteMany();
    const host = await prisma_1.prisma.host.create({
        data: { name: 'Ana', username: 'ana', password: 'hashed' },
    });
    const event = await prisma_1.prisma.event.create({
        data: { name: 'Chá da Ana', slug: SLUG, date: new Date('2026-06-01'), hostId: host.id },
    });
    eventId = event.id;
});
(0, vitest_1.afterEach)(async () => {
    await prisma_1.prisma.reservation.deleteMany();
    await prisma_1.prisma.guest.deleteMany();
    await prisma_1.prisma.item.deleteMany();
    await prisma_1.prisma.event.deleteMany();
    await prisma_1.prisma.host.deleteMany();
});
(0, vitest_1.describe)('isValidBrazilianPhone', () => {
    (0, vitest_1.it)('accepts valid mobile (11 digits)', () => {
        (0, vitest_1.expect)((0, lista_service_1.isValidBrazilianPhone)('11999999999')).toBe(true);
    });
    (0, vitest_1.it)('accepts valid landline (10 digits)', () => {
        (0, vitest_1.expect)((0, lista_service_1.isValidBrazilianPhone)('1133334444')).toBe(true);
    });
    (0, vitest_1.it)('rejects too short', () => {
        (0, vitest_1.expect)((0, lista_service_1.isValidBrazilianPhone)('119999')).toBe(false);
    });
    (0, vitest_1.it)('rejects too long', () => {
        (0, vitest_1.expect)((0, lista_service_1.isValidBrazilianPhone)('119999999999')).toBe(false);
    });
    (0, vitest_1.it)('rejects mobile without leading 9', () => {
        (0, vitest_1.expect)((0, lista_service_1.isValidBrazilianPhone)('11899999999')).toBe(false);
    });
});
(0, vitest_1.describe)('getPublicList', () => {
    (0, vitest_1.it)('returns event info and items', async () => {
        await prisma_1.prisma.item.create({ data: { name: 'Panela', eventId } });
        const list = await (0, lista_service_1.getPublicList)(SLUG);
        (0, vitest_1.expect)(list.event.slug).toBe(SLUG);
        (0, vitest_1.expect)(list.items).toHaveLength(1);
        (0, vitest_1.expect)(list.items[0].reserved).toBe(false);
        (0, vitest_1.expect)(list.guestCount).toBe(0);
    });
    (0, vitest_1.it)('throws 404 for unknown slug', async () => {
        await (0, vitest_1.expect)((0, lista_service_1.getPublicList)('nao-existe')).rejects.toThrow(lista_service_1.ListaError);
    });
});
(0, vitest_1.describe)('reserveItem', () => {
    (0, vitest_1.it)('reserves an available item', async () => {
        const item = await prisma_1.prisma.item.create({ data: { name: 'Panela', eventId } });
        const result = await (0, lista_service_1.reserveItem)(SLUG, item.id, 'João', '11999999999');
        (0, vitest_1.expect)(result.guestName).toBe('João');
        (0, vitest_1.expect)(result.itemId).toBe(item.id);
    });
    (0, vitest_1.it)('marks item as reserved in public list', async () => {
        const item = await prisma_1.prisma.item.create({ data: { name: 'Panela', eventId } });
        await (0, lista_service_1.reserveItem)(SLUG, item.id, 'João', '11999999999');
        const list = await (0, lista_service_1.getPublicList)(SLUG);
        (0, vitest_1.expect)(list.items[0].reserved).toBe(true);
        (0, vitest_1.expect)(list.items[0].reservedBy).toBe('João');
    });
    (0, vitest_1.it)('throws 409 when item already reserved', async () => {
        const item = await prisma_1.prisma.item.create({ data: { name: 'Panela', eventId } });
        await (0, lista_service_1.reserveItem)(SLUG, item.id, 'João', '11999999999');
        await (0, vitest_1.expect)((0, lista_service_1.reserveItem)(SLUG, item.id, 'Maria', '21988888888')).rejects.toThrow(lista_service_1.ListaError);
    });
    (0, vitest_1.it)('throws on invalid phone', async () => {
        const item = await prisma_1.prisma.item.create({ data: { name: 'Panela', eventId } });
        await (0, vitest_1.expect)((0, lista_service_1.reserveItem)(SLUG, item.id, 'João', '123')).rejects.toThrow(lista_service_1.ListaError);
    });
    (0, vitest_1.it)('throws on short name', async () => {
        const item = await prisma_1.prisma.item.create({ data: { name: 'Panela', eventId } });
        await (0, vitest_1.expect)((0, lista_service_1.reserveItem)(SLUG, item.id, 'J', '11999999999')).rejects.toThrow(lista_service_1.ListaError);
    });
});
(0, vitest_1.describe)('confirmPresence', () => {
    (0, vitest_1.it)('registers a guest presence', async () => {
        const result = await (0, lista_service_1.confirmPresence)(SLUG, 'Maria', '21988888888');
        (0, vitest_1.expect)(result.guestName).toBe('Maria');
    });
    (0, vitest_1.it)('upserts on same phone (idempotent)', async () => {
        await (0, lista_service_1.confirmPresence)(SLUG, 'Maria', '21988888888');
        await (0, lista_service_1.confirmPresence)(SLUG, 'Maria Silva', '21988888888');
        const guests = await prisma_1.prisma.guest.findMany({ where: { eventId } });
        (0, vitest_1.expect)(guests).toHaveLength(1);
        (0, vitest_1.expect)(guests[0].name).toBe('Maria Silva');
    });
    (0, vitest_1.it)('allows presence without reserving an item', async () => {
        await (0, lista_service_1.confirmPresence)(SLUG, 'Carlos', '31977777777');
        const list = await (0, lista_service_1.getPublicList)(SLUG);
        (0, vitest_1.expect)(list.guestCount).toBe(1);
    });
});
//# sourceMappingURL=lista.service.test.js.map
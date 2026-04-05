"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const item_service_1 = require("./item.service");
const prisma_1 = require("../lib/prisma");
let hostId;
let eventId;
(0, vitest_1.beforeEach)(async () => {
    await prisma_1.prisma.reservation.deleteMany();
    await prisma_1.prisma.item.deleteMany();
    await prisma_1.prisma.event.deleteMany();
    await prisma_1.prisma.host.deleteMany();
    const host = await prisma_1.prisma.host.create({
        data: { name: 'Ana', username: 'ana', password: 'hashed' },
    });
    hostId = host.id;
    const event = await prisma_1.prisma.event.create({
        data: { name: 'Chá', slug: 'cha-test', date: new Date(), hostId },
    });
    eventId = event.id;
});
(0, vitest_1.afterEach)(async () => {
    await prisma_1.prisma.reservation.deleteMany();
    await prisma_1.prisma.item.deleteMany();
    await prisma_1.prisma.event.deleteMany();
    await prisma_1.prisma.host.deleteMany();
});
(0, vitest_1.describe)('addItem', () => {
    (0, vitest_1.it)('adds item with no reservation (available)', async () => {
        const item = await (0, item_service_1.addItem)(eventId, hostId, 'Panela', 'Antiaderente');
        (0, vitest_1.expect)(item.name).toBe('Panela');
        (0, vitest_1.expect)(item.description).toBe('Antiaderente');
        (0, vitest_1.expect)(item.reservation).toBeNull();
    });
    (0, vitest_1.it)('throws on empty name', async () => {
        await (0, vitest_1.expect)((0, item_service_1.addItem)(eventId, hostId, '')).rejects.toThrow(item_service_1.ItemError);
    });
    (0, vitest_1.it)('throws 403 for wrong host', async () => {
        await (0, vitest_1.expect)((0, item_service_1.addItem)(eventId, 'other-host', 'Panela')).rejects.toThrow(item_service_1.ItemError);
    });
});
(0, vitest_1.describe)('updateItem', () => {
    (0, vitest_1.it)('updates name and preserves reservation status', async () => {
        const item = await (0, item_service_1.addItem)(eventId, hostId, 'Panela');
        // Reserve it
        await prisma_1.prisma.reservation.create({
            data: { itemId: item.id, guestName: 'João', guestPhone: '11999999999' },
        });
        const updated = await (0, item_service_1.updateItem)(item.id, eventId, hostId, { name: 'Frigideira' });
        (0, vitest_1.expect)(updated.name).toBe('Frigideira');
        (0, vitest_1.expect)(updated.reservation).not.toBeNull();
        (0, vitest_1.expect)(updated.reservation.guestName).toBe('João');
    });
});
(0, vitest_1.describe)('deleteItem', () => {
    (0, vitest_1.it)('deletes an unreserved item', async () => {
        const item = await (0, item_service_1.addItem)(eventId, hostId, 'Panela');
        const result = await (0, item_service_1.deleteItem)(item.id, eventId, hostId);
        (0, vitest_1.expect)(result.deleted).toBe(true);
        (0, vitest_1.expect)(result.reserved).toBe(false);
    });
    (0, vitest_1.it)('returns reserved=true without deleting when not forced', async () => {
        const item = await (0, item_service_1.addItem)(eventId, hostId, 'Panela');
        await prisma_1.prisma.reservation.create({
            data: { itemId: item.id, guestName: 'João', guestPhone: '11999999999' },
        });
        const result = await (0, item_service_1.deleteItem)(item.id, eventId, hostId, false);
        (0, vitest_1.expect)(result.deleted).toBe(false);
        (0, vitest_1.expect)(result.reserved).toBe(true);
    });
    (0, vitest_1.it)('force-deletes a reserved item', async () => {
        const item = await (0, item_service_1.addItem)(eventId, hostId, 'Panela');
        await prisma_1.prisma.reservation.create({
            data: { itemId: item.id, guestName: 'João', guestPhone: '11999999999' },
        });
        const result = await (0, item_service_1.deleteItem)(item.id, eventId, hostId, true);
        (0, vitest_1.expect)(result.deleted).toBe(true);
    });
});
//# sourceMappingURL=item.service.test.js.map
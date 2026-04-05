"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const event_service_1 = require("./event.service");
const prisma_1 = require("../lib/prisma");
let hostId;
(0, vitest_1.beforeEach)(async () => {
    await prisma_1.prisma.reservation.deleteMany();
    await prisma_1.prisma.guest.deleteMany();
    await prisma_1.prisma.item.deleteMany();
    await prisma_1.prisma.event.deleteMany();
    await prisma_1.prisma.host.deleteMany();
    const host = await prisma_1.prisma.host.create({
        data: { name: 'Ana', username: 'ana', password: 'hashed' },
    });
    hostId = host.id;
});
(0, vitest_1.afterEach)(async () => {
    await prisma_1.prisma.reservation.deleteMany();
    await prisma_1.prisma.guest.deleteMany();
    await prisma_1.prisma.item.deleteMany();
    await prisma_1.prisma.event.deleteMany();
    await prisma_1.prisma.host.deleteMany();
});
(0, vitest_1.describe)('generateSlug', () => {
    (0, vitest_1.it)('produces a lowercase slug with no accents', () => {
        const slug = (0, event_service_1.generateSlug)('Chá de Panela');
        (0, vitest_1.expect)(slug).toMatch(/^cha-de-panela-/);
        (0, vitest_1.expect)(slug).not.toMatch(/[A-Z]/);
    });
    (0, vitest_1.it)('appends a random suffix for uniqueness', () => {
        const s1 = (0, event_service_1.generateSlug)('Evento');
        const s2 = (0, event_service_1.generateSlug)('Evento');
        (0, vitest_1.expect)(s1).not.toBe(s2);
    });
});
(0, vitest_1.describe)('createEvent', () => {
    (0, vitest_1.it)('creates an event with a unique slug', async () => {
        const event = await (0, event_service_1.createEvent)(hostId, 'Meu Chá', new Date('2026-06-01'));
        (0, vitest_1.expect)(event.name).toBe('Meu Chá');
        (0, vitest_1.expect)(event.slug).toBeTruthy();
        (0, vitest_1.expect)(event.hostId).toBe(hostId);
    });
    (0, vitest_1.it)('throws on empty name', async () => {
        await (0, vitest_1.expect)((0, event_service_1.createEvent)(hostId, '', new Date())).rejects.toThrow(event_service_1.EventError);
    });
    (0, vitest_1.it)('throws on invalid date', async () => {
        await (0, vitest_1.expect)((0, event_service_1.createEvent)(hostId, 'Evento', 'not-a-date')).rejects.toThrow(event_service_1.EventError);
    });
});
(0, vitest_1.describe)('listEvents', () => {
    (0, vitest_1.it)('returns only events for the given host', async () => {
        await (0, event_service_1.createEvent)(hostId, 'Evento 1', new Date());
        await (0, event_service_1.createEvent)(hostId, 'Evento 2', new Date());
        const events = await (0, event_service_1.listEvents)(hostId);
        (0, vitest_1.expect)(events).toHaveLength(2);
        (0, vitest_1.expect)(events.every(e => e.hostId === hostId)).toBe(true);
    });
});
(0, vitest_1.describe)('getEvent', () => {
    (0, vitest_1.it)('returns the event for the correct host', async () => {
        const created = await (0, event_service_1.createEvent)(hostId, 'Evento', new Date());
        const found = await (0, event_service_1.getEvent)(created.id, hostId);
        (0, vitest_1.expect)(found.id).toBe(created.id);
    });
    (0, vitest_1.it)('throws 404 for unknown id', async () => {
        await (0, vitest_1.expect)((0, event_service_1.getEvent)('nonexistent', hostId)).rejects.toThrow(event_service_1.EventError);
    });
    (0, vitest_1.it)('throws 403 for wrong host', async () => {
        const created = await (0, event_service_1.createEvent)(hostId, 'Evento', new Date());
        await (0, vitest_1.expect)((0, event_service_1.getEvent)(created.id, 'other-host')).rejects.toThrow(event_service_1.EventError);
    });
});
(0, vitest_1.describe)('updateEvent', () => {
    (0, vitest_1.it)('updates name while keeping the same slug', async () => {
        const created = await (0, event_service_1.createEvent)(hostId, 'Evento', new Date());
        const updated = await (0, event_service_1.updateEvent)(created.id, hostId, { name: 'Novo Nome' });
        (0, vitest_1.expect)(updated.name).toBe('Novo Nome');
        (0, vitest_1.expect)(updated.slug).toBe(created.slug);
    });
});
(0, vitest_1.describe)('deleteEvent', () => {
    (0, vitest_1.it)('deletes the event', async () => {
        const created = await (0, event_service_1.createEvent)(hostId, 'Evento', new Date());
        await (0, event_service_1.deleteEvent)(created.id, hostId);
        const events = await (0, event_service_1.listEvents)(hostId);
        (0, vitest_1.expect)(events).toHaveLength(0);
    });
});
//# sourceMappingURL=event.service.test.js.map
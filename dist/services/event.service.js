"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventError = void 0;
exports.generateSlug = generateSlug;
exports.createEvent = createEvent;
exports.listEvents = listEvents;
exports.getEvent = getEvent;
exports.updateEvent = updateEvent;
exports.deleteEvent = deleteEvent;
const prisma_1 = require("../lib/prisma");
class EventError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'EventError';
    }
}
exports.EventError = EventError;
/**
 * Generates a URL-friendly slug from a name + timestamp to ensure uniqueness.
 * Requirements: 3.1, 5.1
 */
function generateSlug(name) {
    const base = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    const suffix = Math.random().toString(36).slice(2, 8);
    return `${base}-${suffix}`;
}
/**
 * Creates a new event for a host, generating a unique slug.
 * Requirements: 3.1
 */
async function createEvent(hostId, name, date) {
    if (!name || name.trim().length === 0) {
        throw new EventError('Nome do evento é obrigatório', 400);
    }
    const eventDate = date instanceof Date ? date : new Date(date);
    if (isNaN(eventDate.getTime())) {
        throw new EventError('Data inválida', 400);
    }
    // Retry slug generation on collision (extremely rare)
    let slug = generateSlug(name);
    let attempts = 0;
    while (attempts < 5) {
        const existing = await prisma_1.prisma.event.findUnique({ where: { slug } });
        if (!existing)
            break;
        slug = generateSlug(name);
        attempts++;
    }
    const event = await prisma_1.prisma.event.create({
        data: { name: name.trim(), date: eventDate, hostId, slug },
    });
    return event;
}
/**
 * Lists all events belonging to a host.
 * Requirements: 3.2
 */
async function listEvents(hostId) {
    return prisma_1.prisma.event.findMany({
        where: { hostId },
        orderBy: { createdAt: 'desc' },
    });
}
/**
 * Gets a single event by id, ensuring it belongs to the host.
 * Includes items (with reservations) and confirmed guests for the dashboard panel.
 * Requirements: 3.2, 3.3, 4.5, 9.1, 9.2, 9.3
 */
async function getEvent(id, hostId) {
    const event = await prisma_1.prisma.event.findUnique({
        where: { id },
        include: {
            items: {
                include: { reservation: true },
                orderBy: { createdAt: 'asc' },
            },
            guests: {
                orderBy: { createdAt: 'asc' },
            },
        },
    });
    if (!event) {
        throw new EventError('Evento não encontrado', 404);
    }
    if (event.hostId !== hostId) {
        throw new EventError('Acesso negado', 403);
    }
    return event;
}
/**
 * Updates an event's name and/or date, keeping the same slug.
 * Requirements: 3.3
 */
async function updateEvent(id, hostId, data) {
    await getEvent(id, hostId); // validates ownership
    const updateData = {};
    if (data.name !== undefined) {
        if (data.name.trim().length === 0) {
            throw new EventError('Nome do evento não pode ser vazio', 400);
        }
        updateData.name = data.name.trim();
    }
    if (data.date !== undefined) {
        const d = data.date instanceof Date ? data.date : new Date(data.date);
        if (isNaN(d.getTime())) {
            throw new EventError('Data inválida', 400);
        }
        updateData.date = d;
    }
    return prisma_1.prisma.event.update({ where: { id }, data: updateData });
}
/**
 * Deletes an event, ensuring it belongs to the host.
 * Requirements: 3.4 (hosts can have multiple events, so delete is scoped)
 */
async function deleteEvent(id, hostId) {
    await getEvent(id, hostId); // validates ownership
    await prisma_1.prisma.event.delete({ where: { id } });
}
//# sourceMappingURL=event.service.js.map
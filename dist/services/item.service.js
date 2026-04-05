"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemError = void 0;
exports.addItem = addItem;
exports.updateItem = updateItem;
exports.deleteItem = deleteItem;
const prisma_1 = require("../lib/prisma");
class ItemError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ItemError';
    }
}
exports.ItemError = ItemError;
/**
 * Verifies that the event exists and belongs to the given host.
 * Throws ItemError if not found or unauthorized.
 */
async function requireEventOwnership(eventId, hostId) {
    const event = await prisma_1.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
        throw new ItemError('Evento não encontrado', 404);
    }
    if (event.hostId !== hostId) {
        throw new ItemError('Acesso negado', 403);
    }
}
/**
 * Adds a new item to an event's list with status "available" (no reservation).
 * Requirements: 4.1
 */
async function addItem(eventId, hostId, name, description) {
    if (!name || name.trim().length === 0) {
        throw new ItemError('Nome do item é obrigatório', 400);
    }
    await requireEventOwnership(eventId, hostId);
    const item = await prisma_1.prisma.item.create({
        data: {
            name: name.trim(),
            description: description?.trim() ?? null,
            eventId,
        },
        include: { reservation: true },
    });
    return item;
}
/**
 * Updates an item's name and/or description, preserving its reservation status.
 * Requirements: 4.4
 */
async function updateItem(itemId, eventId, hostId, data) {
    await requireEventOwnership(eventId, hostId);
    const item = await prisma_1.prisma.item.findUnique({ where: { id: itemId } });
    if (!item || item.eventId !== eventId) {
        throw new ItemError('Item não encontrado', 404);
    }
    const updateData = {};
    if (data.name !== undefined) {
        if (data.name.trim().length === 0) {
            throw new ItemError('Nome do item não pode ser vazio', 400);
        }
        updateData.name = data.name.trim();
    }
    if (data.description !== undefined) {
        updateData.description = data.description?.trim() ?? null;
    }
    return prisma_1.prisma.item.update({
        where: { id: itemId },
        data: updateData,
        include: { reservation: true },
    });
}
/**
 * Deletes an item. If the item is already reserved, returns a flag so the
 * caller (route) can ask for confirmation before proceeding.
 * Requirements: 4.2, 4.3
 */
async function deleteItem(itemId, eventId, hostId, force = false) {
    await requireEventOwnership(eventId, hostId);
    const item = await prisma_1.prisma.item.findUnique({
        where: { id: itemId },
        include: { reservation: true },
    });
    if (!item || item.eventId !== eventId) {
        throw new ItemError('Item não encontrado', 404);
    }
    const isReserved = item.reservation !== null;
    // If reserved and not forced, signal that confirmation is needed
    if (isReserved && !force) {
        return { deleted: false, reserved: true };
    }
    await prisma_1.prisma.item.delete({ where: { id: itemId } });
    return { deleted: true, reserved: isReserved };
}
//# sourceMappingURL=item.service.js.map
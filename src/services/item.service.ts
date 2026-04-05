import { prisma } from '../lib/prisma'

export class ItemError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
  ) {
    super(message)
    this.name = 'ItemError'
  }
}

export interface ItemResult {
  id: string
  name: string
  description: string | null
  eventId: string
  createdAt: Date
  reservation: {
    id: string
    guestName: string
    guestPhone: string
  } | null
}

/**
 * Verifies that the event exists and belongs to the given host.
 * Throws ItemError if not found or unauthorized.
 */
async function requireEventOwnership(eventId: string, hostId: string): Promise<void> {
  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event) {
    throw new ItemError('Evento não encontrado', 404)
  }
  if (event.hostId !== hostId) {
    throw new ItemError('Acesso negado', 403)
  }
}

/**
 * Adds a new item to an event's list with status "available" (no reservation).
 * Requirements: 4.1
 */
export async function addItem(
  eventId: string,
  hostId: string,
  name: string,
  description?: string,
): Promise<ItemResult> {
  if (!name || name.trim().length === 0) {
    throw new ItemError('Nome do item é obrigatório', 400)
  }

  await requireEventOwnership(eventId, hostId)

  const item = await prisma.item.create({
    data: {
      name: name.trim(),
      description: description?.trim() ?? null,
      eventId,
    },
    include: { reservation: true },
  })

  return item
}

/**
 * Updates an item's name and/or description, preserving its reservation status.
 * Requirements: 4.4
 */
export async function updateItem(
  itemId: string,
  eventId: string,
  hostId: string,
  data: { name?: string; description?: string | null },
): Promise<ItemResult> {
  await requireEventOwnership(eventId, hostId)

  const item = await prisma.item.findUnique({ where: { id: itemId } })
  if (!item || item.eventId !== eventId) {
    throw new ItemError('Item não encontrado', 404)
  }

  const updateData: { name?: string; description?: string | null } = {}

  if (data.name !== undefined) {
    if (data.name.trim().length === 0) {
      throw new ItemError('Nome do item não pode ser vazio', 400)
    }
    updateData.name = data.name.trim()
  }

  if (data.description !== undefined) {
    updateData.description = data.description?.trim() ?? null
  }

  return prisma.item.update({
    where: { id: itemId },
    data: updateData,
    include: { reservation: true },
  })
}

/**
 * Deletes an item. If the item is already reserved, returns a flag so the
 * caller (route) can ask for confirmation before proceeding.
 * Requirements: 4.2, 4.3
 */
export async function deleteItem(
  itemId: string,
  eventId: string,
  hostId: string,
  force: boolean = false,
): Promise<{ deleted: boolean; reserved: boolean }> {
  await requireEventOwnership(eventId, hostId)

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { reservation: true },
  })

  if (!item || item.eventId !== eventId) {
    throw new ItemError('Item não encontrado', 404)
  }

  const isReserved = item.reservation !== null

  // If reserved and not forced, signal that confirmation is needed
  if (isReserved && !force) {
    return { deleted: false, reserved: true }
  }

  await prisma.item.delete({ where: { id: itemId } })
  return { deleted: true, reserved: isReserved }
}

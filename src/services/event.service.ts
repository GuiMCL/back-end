import { prisma } from '../lib/prisma'

export class EventError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
  ) {
    super(message)
    this.name = 'EventError'
  }
}

export interface EventResult {
  id: string
  slug: string
  name: string
  date: Date
  hostId: string
  createdAt: Date
  items?: {
    id: string
    name: string
    description: string | null
    eventId: string
    createdAt: Date
    reservation: { id: string; guestName: string; guestPhone: string } | null
  }[]
  guests?: { id: string; name: string; phone: string; eventId: string; createdAt: Date }[]
}

/**
 * Generates a URL-friendly slug from a name + timestamp to ensure uniqueness.
 * Requirements: 3.1, 5.1
 */
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')

  const suffix = Math.random().toString(36).slice(2, 8)
  return `${base}-${suffix}`
}

/**
 * Creates a new event for a host, generating a unique slug.
 * Requirements: 3.1
 */
export async function createEvent(
  hostId: string,
  name: string,
  date: Date | string,
): Promise<EventResult> {
  if (!name || name.trim().length === 0) {
    throw new EventError('Nome do evento é obrigatório', 400)
  }

  const eventDate = date instanceof Date ? date : new Date(date)
  if (isNaN(eventDate.getTime())) {
    throw new EventError('Data inválida', 400)
  }

  // Retry slug generation on collision (extremely rare)
  let slug = generateSlug(name)
  let attempts = 0
  while (attempts < 5) {
    const existing = await prisma.event.findUnique({ where: { slug } })
    if (!existing) break
    slug = generateSlug(name)
    attempts++
  }

  const event = await prisma.event.create({
    data: { name: name.trim(), date: eventDate, hostId, slug },
  })

  return event
}

/**
 * Lists all events belonging to a host.
 * Requirements: 3.2
 */
export async function listEvents(hostId: string): Promise<EventResult[]> {
  return prisma.event.findMany({
    where: { hostId },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Gets a single event by id, ensuring it belongs to the host.
 * Includes items (with reservations) and confirmed guests for the dashboard panel.
 * Requirements: 3.2, 3.3, 4.5, 9.1, 9.2, 9.3
 */
export async function getEvent(id: string, hostId: string): Promise<EventResult> {
  const event = await prisma.event.findUnique({
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
  })

  if (!event) {
    throw new EventError('Evento não encontrado', 404)
  }

  if (event.hostId !== hostId) {
    throw new EventError('Acesso negado', 403)
  }

  return event
}

/**
 * Updates an event's name and/or date, keeping the same slug.
 * Requirements: 3.3
 */
export async function updateEvent(
  id: string,
  hostId: string,
  data: { name?: string; date?: Date | string },
): Promise<EventResult> {
  await getEvent(id, hostId) // validates ownership

  const updateData: { name?: string; date?: Date } = {}

  if (data.name !== undefined) {
    if (data.name.trim().length === 0) {
      throw new EventError('Nome do evento não pode ser vazio', 400)
    }
    updateData.name = data.name.trim()
  }

  if (data.date !== undefined) {
    const d = data.date instanceof Date ? data.date : new Date(data.date)
    if (isNaN(d.getTime())) {
      throw new EventError('Data inválida', 400)
    }
    updateData.date = d
  }

  return prisma.event.update({ where: { id }, data: updateData })
}

/**
 * Deletes an event, ensuring it belongs to the host.
 * Requirements: 3.4 (hosts can have multiple events, so delete is scoped)
 */
export async function deleteEvent(id: string, hostId: string): Promise<void> {
  await getEvent(id, hostId) // validates ownership
  await prisma.event.delete({ where: { id } })
}

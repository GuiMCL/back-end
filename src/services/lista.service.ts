import { prisma } from '../lib/prisma'

interface ItemWithReservation {
  id: string
  name: string
  description: string | null
  eventId: string
  createdAt: Date
  reservation: { id: string; guestName: string; guestPhone: string; itemId: string; createdAt: Date } | null
}

export class ListaError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
  ) {
    super(message)
    this.name = 'ListaError'
  }
}

/**
 * Validates a Brazilian phone number (with DDD, 10 or 11 digits, digits only).
 * Accepts formats: 11999999999, 1199999999 (with or without 9th digit)
 * Requirements: 7.5
 */
export function isValidBrazilianPhone(phone: string): boolean {
  // Strip non-digit characters
  const digits = phone.replace(/\D/g, '')
  // Must be 10 (landline) or 11 (mobile with 9th digit) digits
  if (digits.length !== 10 && digits.length !== 11) return false
  // DDD must be between 11 and 99
  const ddd = parseInt(digits.slice(0, 2), 10)
  if (ddd < 11 || ddd > 99) return false
  // Mobile numbers (11 digits) must start with 9 after DDD
  if (digits.length === 11 && digits[2] !== '9') return false
  return true
}

export interface PublicItem {
  id: string
  name: string
  description: string | null
  reserved: boolean
  reservedBy: string | null
}

export interface PublicListResponse {
  event: {
    name: string
    date: string
    slug: string
  }
  items: PublicItem[]
  guestCount: number
}

/**
 * Returns the public view of an event by slug.
 * Requirements: 5.4, 6.1, 6.2, 6.3
 */
export async function getPublicList(slug: string): Promise<PublicListResponse> {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      items: {
        include: { reservation: true },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { guests: true } },
    },
  })

  if (!event) {
    throw new ListaError('Lista não encontrada', 404)
  }

  const items: PublicItem[] = event.items.map((item: ItemWithReservation) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    reserved: item.reservation !== null,
    reservedBy: item.reservation?.guestName ?? null,
  }))

  return {
    event: {
      name: event.name,
      date: event.date.toISOString(),
      slug: event.slug,
    },
    items,
    guestCount: event._count.guests,
  }
}

/**
 * Reserves an item for a guest. Validates phone format and item availability.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
export async function reserveItem(
  slug: string,
  itemId: string,
  guestName: string,
  guestPhone: string,
): Promise<{ itemId: string; guestName: string }> {
  if (!guestName || guestName.trim().length < 2) {
    throw new ListaError('Nome deve ter no mínimo 2 caracteres', 400)
  }

  if (!isValidBrazilianPhone(guestPhone)) {
    throw new ListaError('Telefone inválido. Use formato brasileiro com DDD (ex: 11999999999)', 400)
  }

  const event = await prisma.event.findUnique({ where: { slug } })
  if (!event) {
    throw new ListaError('Lista não encontrada', 404)
  }

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { reservation: true },
  })

  if (!item || item.eventId !== event.id) {
    throw new ListaError('Item não encontrado', 404)
  }

  if (item.reservation !== null) {
    throw new ListaError('Este item já foi reservado', 409)
  }

  const reservation = await prisma.reservation.create({
    data: {
      itemId,
      guestName: guestName.trim(),
      guestPhone: guestPhone.replace(/\D/g, ''),
    },
  })

  return { itemId: reservation.itemId, guestName: reservation.guestName }
}

/**
 * Confirms a guest's presence for an event. Upserts by phone+eventId.
 * Requirements: 8.1, 8.2, 8.3
 */
export async function confirmPresence(
  slug: string,
  guestName: string,
  guestPhone: string,
): Promise<{ guestName: string; guestPhone: string }> {
  if (!guestName || guestName.trim().length < 2) {
    throw new ListaError('Nome deve ter no mínimo 2 caracteres', 400)
  }

  if (!isValidBrazilianPhone(guestPhone)) {
    throw new ListaError('Telefone inválido. Use formato brasileiro com DDD (ex: 11999999999)', 400)
  }

  const event = await prisma.event.findUnique({ where: { slug } })
  if (!event) {
    throw new ListaError('Lista não encontrada', 404)
  }

  const normalizedPhone = guestPhone.replace(/\D/g, '')

  // Upsert: update name if phone already confirmed, otherwise create new record
  const guest = await prisma.guest.upsert({
    where: { phone_eventId: { phone: normalizedPhone, eventId: event.id } },
    update: { name: guestName.trim() },
    create: {
      name: guestName.trim(),
      phone: normalizedPhone,
      eventId: event.id,
    },
  })

  return { guestName: guest.name, guestPhone: guest.phone }
}

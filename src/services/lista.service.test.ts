import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getPublicList, reserveItem, confirmPresence, isValidBrazilianPhone, ListaError } from './lista.service'
import { prisma } from '../lib/prisma'

let eventId: string
const SLUG = 'cha-lista-test'

beforeEach(async () => {
  await prisma.reservation.deleteMany()
  await prisma.guest.deleteMany()
  await prisma.item.deleteMany()
  await prisma.event.deleteMany()
  await prisma.host.deleteMany()

  const host = await prisma.host.create({
    data: { name: 'Ana', username: 'ana', password: 'hashed' },
  })

  const event = await prisma.event.create({
    data: { name: 'Chá da Ana', slug: SLUG, date: new Date('2026-06-01'), hostId: host.id },
  })
  eventId = event.id
})

afterEach(async () => {
  await prisma.reservation.deleteMany()
  await prisma.guest.deleteMany()
  await prisma.item.deleteMany()
  await prisma.event.deleteMany()
  await prisma.host.deleteMany()
})

describe('isValidBrazilianPhone', () => {
  it('accepts valid mobile (11 digits)', () => {
    expect(isValidBrazilianPhone('11999999999')).toBe(true)
  })

  it('accepts valid landline (10 digits)', () => {
    expect(isValidBrazilianPhone('1133334444')).toBe(true)
  })

  it('rejects too short', () => {
    expect(isValidBrazilianPhone('119999')).toBe(false)
  })

  it('rejects too long', () => {
    expect(isValidBrazilianPhone('119999999999')).toBe(false)
  })

  it('rejects mobile without leading 9', () => {
    expect(isValidBrazilianPhone('11899999999')).toBe(false)
  })
})

describe('getPublicList', () => {
  it('returns event info and items', async () => {
    await prisma.item.create({ data: { name: 'Panela', eventId } })
    const list = await getPublicList(SLUG)
    expect(list.event.slug).toBe(SLUG)
    expect(list.items).toHaveLength(1)
    expect(list.items[0].reserved).toBe(false)
    expect(list.guestCount).toBe(0)
  })

  it('throws 404 for unknown slug', async () => {
    await expect(getPublicList('nao-existe')).rejects.toThrow(ListaError)
  })
})

describe('reserveItem', () => {
  it('reserves an available item', async () => {
    const item = await prisma.item.create({ data: { name: 'Panela', eventId } })
    const result = await reserveItem(SLUG, item.id, 'João', '11999999999')
    expect(result.guestName).toBe('João')
    expect(result.itemId).toBe(item.id)
  })

  it('marks item as reserved in public list', async () => {
    const item = await prisma.item.create({ data: { name: 'Panela', eventId } })
    await reserveItem(SLUG, item.id, 'João', '11999999999')
    const list = await getPublicList(SLUG)
    expect(list.items[0].reserved).toBe(true)
    expect(list.items[0].reservedBy).toBe('João')
  })

  it('throws 409 when item already reserved', async () => {
    const item = await prisma.item.create({ data: { name: 'Panela', eventId } })
    await reserveItem(SLUG, item.id, 'João', '11999999999')
    await expect(reserveItem(SLUG, item.id, 'Maria', '21988888888')).rejects.toThrow(ListaError)
  })

  it('throws on invalid phone', async () => {
    const item = await prisma.item.create({ data: { name: 'Panela', eventId } })
    await expect(reserveItem(SLUG, item.id, 'João', '123')).rejects.toThrow(ListaError)
  })

  it('throws on short name', async () => {
    const item = await prisma.item.create({ data: { name: 'Panela', eventId } })
    await expect(reserveItem(SLUG, item.id, 'J', '11999999999')).rejects.toThrow(ListaError)
  })
})

describe('confirmPresence', () => {
  it('registers a guest presence', async () => {
    const result = await confirmPresence(SLUG, 'Maria', '21988888888')
    expect(result.guestName).toBe('Maria')
  })

  it('upserts on same phone (idempotent)', async () => {
    await confirmPresence(SLUG, 'Maria', '21988888888')
    await confirmPresence(SLUG, 'Maria Silva', '21988888888')
    const guests = await prisma.guest.findMany({ where: { eventId } })
    expect(guests).toHaveLength(1)
    expect(guests[0].name).toBe('Maria Silva')
  })

  it('allows presence without reserving an item', async () => {
    await confirmPresence(SLUG, 'Carlos', '31977777777')
    const list = await getPublicList(SLUG)
    expect(list.guestCount).toBe(1)
  })
})

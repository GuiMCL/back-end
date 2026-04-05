import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { addItem, updateItem, deleteItem, ItemError } from './item.service'
import { prisma } from '../lib/prisma'

let hostId: string
let eventId: string

beforeEach(async () => {
  await prisma.reservation.deleteMany()
  await prisma.item.deleteMany()
  await prisma.event.deleteMany()
  await prisma.host.deleteMany()

  const host = await prisma.host.create({
    data: { name: 'Ana', username: 'ana', password: 'hashed' },
  })
  hostId = host.id

  const event = await prisma.event.create({
    data: { name: 'Chá', slug: 'cha-test', date: new Date(), hostId },
  })
  eventId = event.id
})

afterEach(async () => {
  await prisma.reservation.deleteMany()
  await prisma.item.deleteMany()
  await prisma.event.deleteMany()
  await prisma.host.deleteMany()
})

describe('addItem', () => {
  it('adds item with no reservation (available)', async () => {
    const item = await addItem(eventId, hostId, 'Panela', 'Antiaderente')
    expect(item.name).toBe('Panela')
    expect(item.description).toBe('Antiaderente')
    expect(item.reservation).toBeNull()
  })

  it('throws on empty name', async () => {
    await expect(addItem(eventId, hostId, '')).rejects.toThrow(ItemError)
  })

  it('throws 403 for wrong host', async () => {
    await expect(addItem(eventId, 'other-host', 'Panela')).rejects.toThrow(ItemError)
  })
})

describe('updateItem', () => {
  it('updates name and preserves reservation status', async () => {
    const item = await addItem(eventId, hostId, 'Panela')
    // Reserve it
    await prisma.reservation.create({
      data: { itemId: item.id, guestName: 'João', guestPhone: '11999999999' },
    })
    const updated = await updateItem(item.id, eventId, hostId, { name: 'Frigideira' })
    expect(updated.name).toBe('Frigideira')
    expect(updated.reservation).not.toBeNull()
    expect(updated.reservation!.guestName).toBe('João')
  })
})

describe('deleteItem', () => {
  it('deletes an unreserved item', async () => {
    const item = await addItem(eventId, hostId, 'Panela')
    const result = await deleteItem(item.id, eventId, hostId)
    expect(result.deleted).toBe(true)
    expect(result.reserved).toBe(false)
  })

  it('returns reserved=true without deleting when not forced', async () => {
    const item = await addItem(eventId, hostId, 'Panela')
    await prisma.reservation.create({
      data: { itemId: item.id, guestName: 'João', guestPhone: '11999999999' },
    })
    const result = await deleteItem(item.id, eventId, hostId, false)
    expect(result.deleted).toBe(false)
    expect(result.reserved).toBe(true)
  })

  it('force-deletes a reserved item', async () => {
    const item = await addItem(eventId, hostId, 'Panela')
    await prisma.reservation.create({
      data: { itemId: item.id, guestName: 'João', guestPhone: '11999999999' },
    })
    const result = await deleteItem(item.id, eventId, hostId, true)
    expect(result.deleted).toBe(true)
  })
})

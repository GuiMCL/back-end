import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createEvent, listEvents, getEvent, updateEvent, deleteEvent, generateSlug, EventError } from './event.service'
import { prisma } from '../lib/prisma'

let hostId: string

beforeEach(async () => {
  await prisma.reservation.deleteMany()
  await prisma.guest.deleteMany()
  await prisma.item.deleteMany()
  await prisma.event.deleteMany()
  await prisma.host.deleteMany()
  const host = await prisma.host.create({
    data: { name: 'Ana', username: 'ana', password: 'hashed' },
  })
  hostId = host.id
})

afterEach(async () => {
  await prisma.reservation.deleteMany()
  await prisma.guest.deleteMany()
  await prisma.item.deleteMany()
  await prisma.event.deleteMany()
  await prisma.host.deleteMany()
})

describe('generateSlug', () => {
  it('produces a lowercase slug with no accents', () => {
    const slug = generateSlug('Chá de Panela')
    expect(slug).toMatch(/^cha-de-panela-/)
    expect(slug).not.toMatch(/[A-Z]/)
  })

  it('appends a random suffix for uniqueness', () => {
    const s1 = generateSlug('Evento')
    const s2 = generateSlug('Evento')
    expect(s1).not.toBe(s2)
  })
})

describe('createEvent', () => {
  it('creates an event with a unique slug', async () => {
    const event = await createEvent(hostId, 'Meu Chá', new Date('2026-06-01'))
    expect(event.name).toBe('Meu Chá')
    expect(event.slug).toBeTruthy()
    expect(event.hostId).toBe(hostId)
  })

  it('throws on empty name', async () => {
    await expect(createEvent(hostId, '', new Date())).rejects.toThrow(EventError)
  })

  it('throws on invalid date', async () => {
    await expect(createEvent(hostId, 'Evento', 'not-a-date')).rejects.toThrow(EventError)
  })
})

describe('listEvents', () => {
  it('returns only events for the given host', async () => {
    await createEvent(hostId, 'Evento 1', new Date())
    await createEvent(hostId, 'Evento 2', new Date())
    const events = await listEvents(hostId)
    expect(events).toHaveLength(2)
    expect(events.every(e => e.hostId === hostId)).toBe(true)
  })
})

describe('getEvent', () => {
  it('returns the event for the correct host', async () => {
    const created = await createEvent(hostId, 'Evento', new Date())
    const found = await getEvent(created.id, hostId)
    expect(found.id).toBe(created.id)
  })

  it('throws 404 for unknown id', async () => {
    await expect(getEvent('nonexistent', hostId)).rejects.toThrow(EventError)
  })

  it('throws 403 for wrong host', async () => {
    const created = await createEvent(hostId, 'Evento', new Date())
    await expect(getEvent(created.id, 'other-host')).rejects.toThrow(EventError)
  })
})

describe('updateEvent', () => {
  it('updates name while keeping the same slug', async () => {
    const created = await createEvent(hostId, 'Evento', new Date())
    const updated = await updateEvent(created.id, hostId, { name: 'Novo Nome' })
    expect(updated.name).toBe('Novo Nome')
    expect(updated.slug).toBe(created.slug)
  })
})

describe('deleteEvent', () => {
  it('deletes the event', async () => {
    const created = await createEvent(hostId, 'Evento', new Date())
    await deleteEvent(created.id, hostId)
    const events = await listEvents(hostId)
    expect(events).toHaveLength(0)
  })
})

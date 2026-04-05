import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { register, login, generateToken, verifyToken, AuthError } from './auth.service'
import { prisma } from '../lib/prisma'

beforeEach(async () => {
  await prisma.reservation.deleteMany()
  await prisma.guest.deleteMany()
  await prisma.item.deleteMany()
  await prisma.event.deleteMany()
  await prisma.host.deleteMany()
})

afterEach(async () => {
  await prisma.reservation.deleteMany()
  await prisma.guest.deleteMany()
  await prisma.item.deleteMany()
  await prisma.event.deleteMany()
  await prisma.host.deleteMany()
})

describe('register', () => {
  it('creates a host and returns a token', async () => {
    const result = await register('Ana', 'ana', 'senha123')
    expect(result.host.username).toBe('ana')
    expect(result.host.name).toBe('Ana')
    expect(result.token).toBeTruthy()
  })

  it('throws on duplicate username', async () => {
    await register('Ana', 'ana', 'senha123')
    await expect(register('Ana2', 'ana', 'senha456')).rejects.toThrow(AuthError)
  })

  it('throws when password is shorter than 6 chars', async () => {
    await expect(register('Ana', 'ana', '123')).rejects.toThrow(AuthError)
  })

  it('stores a hashed password (not plaintext)', async () => {
    await register('Ana', 'ana', 'senha123')
    const host = await prisma.host.findUnique({ where: { username: 'ana' } })
    expect(host!.password).not.toBe('senha123')
    expect(host!.password).toMatch(/^\$2/)
  })
})

describe('login', () => {
  it('returns token for valid credentials', async () => {
    await register('Ana', 'ana', 'senha123')
    const result = await login('ana', 'senha123')
    expect(result.host.username).toBe('ana')
    expect(result.token).toBeTruthy()
  })

  it('throws AuthError for wrong password', async () => {
    await register('Ana', 'ana', 'senha123')
    await expect(login('ana', 'errada')).rejects.toThrow(AuthError)
  })

  it('throws AuthError for unknown username', async () => {
    await expect(login('naoexiste', 'senha123')).rejects.toThrow(AuthError)
  })
})

describe('generateToken / verifyToken', () => {
  it('round-trips payload correctly', () => {
    const payload = { hostId: 'abc', username: 'ana' }
    const token = generateToken(payload)
    const decoded = verifyToken(token)
    expect(decoded.hostId).toBe(payload.hostId)
    expect(decoded.username).toBe(payload.username)
  })
})

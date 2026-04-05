import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production'
const JWT_EXPIRES_IN = '7d'
const BCRYPT_ROUNDS = 10
const MIN_PASSWORD_LENGTH = 6

export interface JwtPayload {
  hostId: string
  username: string
}

export interface AuthResult {
  host: { id: string; name: string; username: string }
  token: string
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function register(
  name: string,
  username: string,
  password: string,
): Promise<AuthResult> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(
      `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres`,
      400,
    )
  }

  const existing = await prisma.host.findUnique({ where: { username } })
  if (existing) {
    throw new AuthError('Nome de usuário já está em uso', 409)
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)

  const host = await prisma.host.create({
    data: { name, username, password: hashedPassword },
    select: { id: true, name: true, username: true },
  })

  const token = generateToken({ hostId: host.id, username: host.username })

  return { host, token }
}

export async function login(
  username: string,
  password: string,
): Promise<AuthResult> {
  const host = await prisma.host.findUnique({ where: { username } })

  // Use constant-time comparison to avoid timing attacks; don't reveal which field is wrong
  const dummyHash = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345'
  const passwordToCheck = host ? host.password : dummyHash
  const isValid = await bcrypt.compare(password, passwordToCheck)

  if (!host || !isValid) {
    throw new AuthError('Credenciais inválidas', 401)
  }

  const token = generateToken({ hostId: host.id, username: host.username })

  return {
    host: { id: host.id, name: host.name, username: host.username },
    token,
  }
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from '../services/auth.service'

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<string | null> {
  const authHeader = request.headers['authorization']
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    reply.status(401).send({ error: 'Não autenticado' })
    return null
  }
  try {
    const payload = verifyToken(token)
    return payload.hostId
  } catch {
    reply.status(401).send({ error: 'Token inválido ou expirado' })
    return null
  }
}

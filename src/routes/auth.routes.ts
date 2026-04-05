import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { register, login, verifyToken, AuthError } from '../services/auth.service'

const COOKIE_NAME = 'token'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

interface RegisterBody {
  name: string
  username: string
  password: string
  confirmPassword: string
}

interface LoginBody {
  username: string
  password: string
}

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/register
  app.post<{ Body: RegisterBody }>(
    '/api/auth/register',
    async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
      const { name, username, password, confirmPassword } = request.body

      if (!name || !username || !password) {
        return reply.status(400).send({ error: 'Nome, usuário e senha são obrigatórios' })
      }

      if (confirmPassword !== undefined && password !== confirmPassword) {
        return reply.status(400).send({ error: 'A senha e a confirmação de senha não coincidem' })
      }

      try {
        const result = await register(name, username, password)
        reply.setCookie(COOKIE_NAME, result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: COOKIE_MAX_AGE,
          path: '/',
        })
        return reply.status(201).send({ host: result.host })
      } catch (err) {
        if (err instanceof AuthError) {
          return reply.status(err.statusCode).send({ error: err.message })
        }
        throw err
      }
    },
  )

  // POST /api/auth/login
  app.post<{ Body: LoginBody }>(
    '/api/auth/login',
    async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
      const { username, password } = request.body

      if (!username || !password) {
        return reply.status(400).send({ error: 'Usuário e senha são obrigatórios' })
      }

      try {
        const result = await login(username, password)
        reply.setCookie(COOKIE_NAME, result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: COOKIE_MAX_AGE,
          path: '/',
        })
        return reply.send({ host: result.host })
      } catch (err) {
        if (err instanceof AuthError) {
          return reply.status(err.statusCode).send({ error: err.message })
        }
        throw err
      }
    },
  )

  // POST /api/auth/logout
  app.post('/api/auth/logout', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie(COOKIE_NAME, { path: '/' })
    return reply.send({ message: 'Logout realizado com sucesso' })
  })

  // GET /api/auth/me
  app.get('/api/auth/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies[COOKIE_NAME]

    if (!token) {
      return reply.status(401).send({ error: 'Não autenticado' })
    }

    try {
      const payload = verifyToken(token)
      return reply.send({ hostId: payload.hostId, username: payload.username })
    } catch {
      return reply.status(401).send({ error: 'Token inválido ou expirado' })
    }
  })
}

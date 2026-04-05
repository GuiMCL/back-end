import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import {
  getPublicList,
  reserveItem,
  confirmPresence,
  ListaError,
} from '../services/lista.service'

interface SlugParams {
  slug: string
}

interface ReserveBody {
  itemId: string
  guestName: string
  guestPhone: string
}

interface PresenceBody {
  guestName: string
  guestPhone: string
}

export async function listaRoutes(app: FastifyInstance) {
  // GET /api/lista/:slug — public event list
  app.get<{ Params: SlugParams }>(
    '/api/lista/:slug',
    async (request: FastifyRequest<{ Params: SlugParams }>, reply: FastifyReply) => {
      try {
        const data = await getPublicList(request.params.slug)
        return reply.send(data)
      } catch (err) {
        if (err instanceof ListaError) {
          return reply.status(err.statusCode).send({ error: err.message })
        }
        throw err
      }
    },
  )

  // POST /api/lista/:slug/reservar — guest reserves an item
  app.post<{ Params: SlugParams; Body: ReserveBody }>(
    '/api/lista/:slug/reservar',
    async (
      request: FastifyRequest<{ Params: SlugParams; Body: ReserveBody }>,
      reply: FastifyReply,
    ) => {
      const { itemId, guestName, guestPhone } = request.body

      if (!itemId || !guestName || !guestPhone) {
        return reply.status(400).send({ error: 'itemId, guestName e guestPhone são obrigatórios' })
      }

      try {
        const result = await reserveItem(request.params.slug, itemId, guestName, guestPhone)
        return reply.status(201).send(result)
      } catch (err) {
        if (err instanceof ListaError) {
          return reply.status(err.statusCode).send({ error: err.message })
        }
        throw err
      }
    },
  )

  // POST /api/lista/:slug/presenca — guest confirms presence
  app.post<{ Params: SlugParams; Body: PresenceBody }>(
    '/api/lista/:slug/presenca',
    async (
      request: FastifyRequest<{ Params: SlugParams; Body: PresenceBody }>,
      reply: FastifyReply,
    ) => {
      const { guestName, guestPhone } = request.body

      if (!guestName || !guestPhone) {
        return reply.status(400).send({ error: 'guestName e guestPhone são obrigatórios' })
      }

      try {
        const result = await confirmPresence(request.params.slug, guestName, guestPhone)
        return reply.status(201).send(result)
      } catch (err) {
        if (err instanceof ListaError) {
          return reply.status(err.statusCode).send({ error: err.message })
        }
        throw err
      }
    },
  )
}

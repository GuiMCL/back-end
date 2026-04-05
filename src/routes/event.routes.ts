import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { requireAuth } from '../lib/requireAuth'
import {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  EventError,
} from '../services/event.service'


interface CreateEventBody {
  name: string
  date: string
}

interface UpdateEventBody {
  name?: string
  date?: string
}

interface EventParams {
  id: string
}

export async function eventRoutes(app: FastifyInstance) {
  // GET /api/events — list host's events
  app.get('/api/events', async (request: FastifyRequest, reply: FastifyReply) => {
    const hostId = await requireAuth(request, reply)
    if (!hostId) return

    const events = await listEvents(hostId)
    return reply.send({ events })
  })

  // POST /api/events — create event
  app.post<{ Body: CreateEventBody }>(
    '/api/events',
    async (request: FastifyRequest<{ Body: CreateEventBody }>, reply: FastifyReply) => {
      const hostId = await requireAuth(request, reply)
      if (!hostId) return

      const { name, date } = request.body

      if (!name || !date) {
        return reply.status(400).send({ error: 'Nome e data são obrigatórios' })
      }

      try {
        const event = await createEvent(hostId, name, date)
        return reply.status(201).send({ event })
      } catch (err) {
        if (err instanceof EventError) {
          return reply.status(err.statusCode).send({ error: err.message })
        }
        throw err
      }
    },
  )

  // GET /api/events/:id — get single event
  app.get<{ Params: EventParams }>(
    '/api/events/:id',
    async (request: FastifyRequest<{ Params: EventParams }>, reply: FastifyReply) => {
      const hostId = await requireAuth(request, reply)
      if (!hostId) return

      try {
        const event = await getEvent(request.params.id, hostId)
        return reply.send({ event })
      } catch (err) {
        if (err instanceof EventError) {
          return reply.status(err.statusCode).send({ error: err.message })
        }
        throw err
      }
    },
  )

  // PUT /api/events/:id — update event
  app.put<{ Params: EventParams; Body: UpdateEventBody }>(
    '/api/events/:id',
    async (
      request: FastifyRequest<{ Params: EventParams; Body: UpdateEventBody }>,
      reply: FastifyReply,
    ) => {
      const hostId = await requireAuth(request, reply)
      if (!hostId) return

      try {
        const event = await updateEvent(request.params.id, hostId, request.body)
        return reply.send({ event })
      } catch (err) {
        if (err instanceof EventError) {
          return reply.status(err.statusCode).send({ error: err.message })
        }
        throw err
      }
    },
  )

  // DELETE /api/events/:id — delete event
  app.delete<{ Params: EventParams }>(
    '/api/events/:id',
    async (request: FastifyRequest<{ Params: EventParams }>, reply: FastifyReply) => {
      const hostId = await requireAuth(request, reply)
      if (!hostId) return

      try {
        await deleteEvent(request.params.id, hostId)
        return reply.status(204).send()
      } catch (err) {
        if (err instanceof EventError) {
          return reply.status(err.statusCode).send({ error: err.message })
        }
        throw err
      }
    },
  )
}

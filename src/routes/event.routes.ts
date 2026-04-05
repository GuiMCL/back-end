import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'
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

async function getHostId(): Promise<string> {
  const host = await prisma.host.findFirst()
  if (!host) throw new Error('Nenhum host cadastrado')
  return host.id
}

export async function eventRoutes(app: FastifyInstance) {
  app.get('/api/events', async (_request: FastifyRequest, reply: FastifyReply) => {
    const hostId = await getHostId()
    const events = await listEvents(hostId)
    return reply.send({ events })
  })

  app.post<{ Body: CreateEventBody }>(
    '/api/events',
    async (request: FastifyRequest<{ Body: CreateEventBody }>, reply: FastifyReply) => {
      const hostId = await getHostId()
      const { name, date } = request.body
      if (!name || !date) return reply.status(400).send({ error: 'Nome e data são obrigatórios' })
      try {
        const event = await createEvent(hostId, name, date)
        return reply.status(201).send({ event })
      } catch (err) {
        if (err instanceof EventError) return reply.status(err.statusCode).send({ error: err.message })
        throw err
      }
    },
  )

  app.get<{ Params: EventParams }>(
    '/api/events/:id',
    async (request: FastifyRequest<{ Params: EventParams }>, reply: FastifyReply) => {
      const hostId = await getHostId()
      try {
        const event = await getEvent(request.params.id, hostId)
        return reply.send({ event })
      } catch (err) {
        if (err instanceof EventError) return reply.status(err.statusCode).send({ error: err.message })
        throw err
      }
    },
  )

  app.put<{ Params: EventParams; Body: UpdateEventBody }>(
    '/api/events/:id',
    async (request: FastifyRequest<{ Params: EventParams; Body: UpdateEventBody }>, reply: FastifyReply) => {
      const hostId = await getHostId()
      try {
        const event = await updateEvent(request.params.id, hostId, request.body)
        return reply.send({ event })
      } catch (err) {
        if (err instanceof EventError) return reply.status(err.statusCode).send({ error: err.message })
        throw err
      }
    },
  )

  app.delete<{ Params: EventParams }>(
    '/api/events/:id',
    async (request: FastifyRequest<{ Params: EventParams }>, reply: FastifyReply) => {
      const hostId = await getHostId()
      try {
        await deleteEvent(request.params.id, hostId)
        return reply.status(204).send()
      } catch (err) {
        if (err instanceof EventError) return reply.status(err.statusCode).send({ error: err.message })
        throw err
      }
    },
  )
}

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { requireAuth } from '../lib/requireAuth'
import { addItem, updateItem, deleteItem, ItemError } from '../services/item.service'


interface EventParams {
  id: string
}

interface ItemParams {
  id: string
  itemId: string
}

interface AddItemBody {
  name: string
  description?: string
}

interface UpdateItemBody {
  name?: string
  description?: string | null
}

interface DeleteItemQuery {
  force?: string
}

export async function itemRoutes(app: FastifyInstance) {
  // POST /api/events/:id/items — add item to event
  app.post<{ Params: EventParams; Body: AddItemBody }>(
    '/api/events/:id/items',
    async (
      request: FastifyRequest<{ Params: EventParams; Body: AddItemBody }>,
      reply: FastifyReply,
    ) => {
      const hostId = await requireAuth(request, reply)
      if (!hostId) return

      const { name, description } = request.body

      if (!name) {
        return reply.status(400).send({ error: 'Nome do item é obrigatório' })
      }

      try {
        const item = await addItem(request.params.id, hostId, name, description)
        return reply.status(201).send({ item })
      } catch (err) {
        if (err instanceof ItemError) {
          return reply.status(err.statusCode).send({ error: err.message })
        }
        throw err
      }
    },
  )

  // PUT /api/events/:id/items/:itemId — update item
  app.put<{ Params: ItemParams; Body: UpdateItemBody }>(
    '/api/events/:id/items/:itemId',
    async (
      request: FastifyRequest<{ Params: ItemParams; Body: UpdateItemBody }>,
      reply: FastifyReply,
    ) => {
      const hostId = await requireAuth(request, reply)
      if (!hostId) return

      try {
        const item = await updateItem(
          request.params.itemId,
          request.params.id,
          hostId,
          request.body,
        )
        return reply.send({ item })
      } catch (err) {
        if (err instanceof ItemError) {
          return reply.status(err.statusCode).send({ error: err.message })
        }
        throw err
      }
    },
  )

  // DELETE /api/events/:id/items/:itemId — delete item
  // Query param ?force=true bypasses the reserved-item confirmation
  app.delete<{ Params: ItemParams; Querystring: DeleteItemQuery }>(
    '/api/events/:id/items/:itemId',
    async (
      request: FastifyRequest<{ Params: ItemParams; Querystring: DeleteItemQuery }>,
      reply: FastifyReply,
    ) => {
      const hostId = await requireAuth(request, reply)
      if (!hostId) return

      const force = request.query.force === 'true'

      try {
        const result = await deleteItem(
          request.params.itemId,
          request.params.id,
          hostId,
          force,
        )

        if (!result.deleted && result.reserved) {
          // Requirement 4.3: inform the host that the item is reserved before deleting
          return reply.status(409).send({
            error: 'Este item já foi reservado. Envie ?force=true para confirmar a exclusão.',
            reserved: true,
          })
        }

        return reply.status(204).send()
      } catch (err) {
        if (err instanceof ItemError) {
          return reply.status(err.statusCode).send({ error: err.message })
        }
        throw err
      }
    },
  )
}

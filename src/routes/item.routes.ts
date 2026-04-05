import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'
import { addItem, updateItem, deleteItem, ItemError } from '../services/item.service'

interface EventParams { id: string }
interface ItemParams { id: string; itemId: string }
interface AddItemBody { name: string; description?: string }
interface UpdateItemBody { name?: string; description?: string | null }
interface DeleteItemQuery { force?: string }

async function getHostId(): Promise<string> {
  const host = await prisma.host.findFirst()
  if (!host) throw new Error('Nenhum host cadastrado')
  return host.id
}

export async function itemRoutes(app: FastifyInstance) {
  app.post<{ Params: EventParams; Body: AddItemBody }>(
    '/api/events/:id/items',
    async (request: FastifyRequest<{ Params: EventParams; Body: AddItemBody }>, reply: FastifyReply) => {
      const hostId = await getHostId()
      const { name, description } = request.body
      if (!name) return reply.status(400).send({ error: 'Nome do item é obrigatório' })
      try {
        const item = await addItem(request.params.id, hostId, name, description)
        return reply.status(201).send({ item })
      } catch (err) {
        if (err instanceof ItemError) return reply.status(err.statusCode).send({ error: err.message })
        throw err
      }
    },
  )

  app.put<{ Params: ItemParams; Body: UpdateItemBody }>(
    '/api/events/:id/items/:itemId',
    async (request: FastifyRequest<{ Params: ItemParams; Body: UpdateItemBody }>, reply: FastifyReply) => {
      const hostId = await getHostId()
      try {
        const item = await updateItem(request.params.itemId, request.params.id, hostId, request.body)
        return reply.send({ item })
      } catch (err) {
        if (err instanceof ItemError) return reply.status(err.statusCode).send({ error: err.message })
        throw err
      }
    },
  )

  app.delete<{ Params: ItemParams; Querystring: DeleteItemQuery }>(
    '/api/events/:id/items/:itemId',
    async (request: FastifyRequest<{ Params: ItemParams; Querystring: DeleteItemQuery }>, reply: FastifyReply) => {
      const hostId = await getHostId()
      const force = request.query.force === 'true'
      try {
        const result = await deleteItem(request.params.itemId, request.params.id, hostId, force)
        if (!result.deleted && result.reserved) {
          return reply.status(409).send({
            error: 'Este item já foi reservado. Envie ?force=true para confirmar a exclusão.',
            reserved: true,
          })
        }
        return reply.status(204).send()
      } catch (err) {
        if (err instanceof ItemError) return reply.status(err.statusCode).send({ error: err.message })
        throw err
      }
    },
  )
}

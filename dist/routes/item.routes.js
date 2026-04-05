"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemRoutes = itemRoutes;
const prisma_1 = require("../lib/prisma");
const item_service_1 = require("../services/item.service");
async function getHostId() {
    const host = await prisma_1.prisma.host.findFirst();
    if (!host)
        throw new Error('Nenhum host cadastrado');
    return host.id;
}
async function itemRoutes(app) {
    app.post('/api/events/:id/items', async (request, reply) => {
        const hostId = await getHostId();
        const { name, description } = request.body;
        if (!name)
            return reply.status(400).send({ error: 'Nome do item é obrigatório' });
        try {
            const item = await (0, item_service_1.addItem)(request.params.id, hostId, name, description);
            return reply.status(201).send({ item });
        }
        catch (err) {
            if (err instanceof item_service_1.ItemError)
                return reply.status(err.statusCode).send({ error: err.message });
            throw err;
        }
    });
    app.put('/api/events/:id/items/:itemId', async (request, reply) => {
        const hostId = await getHostId();
        try {
            const item = await (0, item_service_1.updateItem)(request.params.itemId, request.params.id, hostId, request.body);
            return reply.send({ item });
        }
        catch (err) {
            if (err instanceof item_service_1.ItemError)
                return reply.status(err.statusCode).send({ error: err.message });
            throw err;
        }
    });
    app.delete('/api/events/:id/items/:itemId', async (request, reply) => {
        const hostId = await getHostId();
        const force = request.query.force === 'true';
        try {
            const result = await (0, item_service_1.deleteItem)(request.params.itemId, request.params.id, hostId, force);
            if (!result.deleted && result.reserved) {
                return reply.status(409).send({
                    error: 'Este item já foi reservado. Envie ?force=true para confirmar a exclusão.',
                    reserved: true,
                });
            }
            return reply.status(204).send();
        }
        catch (err) {
            if (err instanceof item_service_1.ItemError)
                return reply.status(err.statusCode).send({ error: err.message });
            throw err;
        }
    });
}
//# sourceMappingURL=item.routes.js.map
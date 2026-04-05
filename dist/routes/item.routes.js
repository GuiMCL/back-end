"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemRoutes = itemRoutes;
const auth_service_1 = require("../services/auth.service");
const item_service_1 = require("../services/item.service");
const COOKIE_NAME = 'token';
async function requireAuth(request, reply) {
    const token = request.cookies[COOKIE_NAME];
    if (!token) {
        reply.status(401).send({ error: 'Não autenticado' });
        return null;
    }
    try {
        const payload = (0, auth_service_1.verifyToken)(token);
        return payload.hostId;
    }
    catch {
        reply.status(401).send({ error: 'Token inválido ou expirado' });
        return null;
    }
}
async function itemRoutes(app) {
    // POST /api/events/:id/items — add item to event
    app.post('/api/events/:id/items', async (request, reply) => {
        const hostId = await requireAuth(request, reply);
        if (!hostId)
            return;
        const { name, description } = request.body;
        if (!name) {
            return reply.status(400).send({ error: 'Nome do item é obrigatório' });
        }
        try {
            const item = await (0, item_service_1.addItem)(request.params.id, hostId, name, description);
            return reply.status(201).send({ item });
        }
        catch (err) {
            if (err instanceof item_service_1.ItemError) {
                return reply.status(err.statusCode).send({ error: err.message });
            }
            throw err;
        }
    });
    // PUT /api/events/:id/items/:itemId — update item
    app.put('/api/events/:id/items/:itemId', async (request, reply) => {
        const hostId = await requireAuth(request, reply);
        if (!hostId)
            return;
        try {
            const item = await (0, item_service_1.updateItem)(request.params.itemId, request.params.id, hostId, request.body);
            return reply.send({ item });
        }
        catch (err) {
            if (err instanceof item_service_1.ItemError) {
                return reply.status(err.statusCode).send({ error: err.message });
            }
            throw err;
        }
    });
    // DELETE /api/events/:id/items/:itemId — delete item
    // Query param ?force=true bypasses the reserved-item confirmation
    app.delete('/api/events/:id/items/:itemId', async (request, reply) => {
        const hostId = await requireAuth(request, reply);
        if (!hostId)
            return;
        const force = request.query.force === 'true';
        try {
            const result = await (0, item_service_1.deleteItem)(request.params.itemId, request.params.id, hostId, force);
            if (!result.deleted && result.reserved) {
                // Requirement 4.3: inform the host that the item is reserved before deleting
                return reply.status(409).send({
                    error: 'Este item já foi reservado. Envie ?force=true para confirmar a exclusão.',
                    reserved: true,
                });
            }
            return reply.status(204).send();
        }
        catch (err) {
            if (err instanceof item_service_1.ItemError) {
                return reply.status(err.statusCode).send({ error: err.message });
            }
            throw err;
        }
    });
}
//# sourceMappingURL=item.routes.js.map
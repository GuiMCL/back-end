"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listaRoutes = listaRoutes;
const lista_service_1 = require("../services/lista.service");
async function listaRoutes(app) {
    // GET /api/lista/:slug — public event list
    app.get('/api/lista/:slug', async (request, reply) => {
        try {
            const data = await (0, lista_service_1.getPublicList)(request.params.slug);
            return reply.send(data);
        }
        catch (err) {
            if (err instanceof lista_service_1.ListaError) {
                return reply.status(err.statusCode).send({ error: err.message });
            }
            throw err;
        }
    });
    // POST /api/lista/:slug/reservar — guest reserves an item
    app.post('/api/lista/:slug/reservar', async (request, reply) => {
        const { itemId, guestName, guestPhone } = request.body;
        if (!itemId || !guestName || !guestPhone) {
            return reply.status(400).send({ error: 'itemId, guestName e guestPhone são obrigatórios' });
        }
        try {
            const result = await (0, lista_service_1.reserveItem)(request.params.slug, itemId, guestName, guestPhone);
            return reply.status(201).send(result);
        }
        catch (err) {
            if (err instanceof lista_service_1.ListaError) {
                return reply.status(err.statusCode).send({ error: err.message });
            }
            throw err;
        }
    });
    // POST /api/lista/:slug/presenca — guest confirms presence
    app.post('/api/lista/:slug/presenca', async (request, reply) => {
        const { guestName, guestPhone } = request.body;
        if (!guestName || !guestPhone) {
            return reply.status(400).send({ error: 'guestName e guestPhone são obrigatórios' });
        }
        try {
            const result = await (0, lista_service_1.confirmPresence)(request.params.slug, guestName, guestPhone);
            return reply.status(201).send(result);
        }
        catch (err) {
            if (err instanceof lista_service_1.ListaError) {
                return reply.status(err.statusCode).send({ error: err.message });
            }
            throw err;
        }
    });
}
//# sourceMappingURL=lista.routes.js.map
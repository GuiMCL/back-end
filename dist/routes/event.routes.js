"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventRoutes = eventRoutes;
const prisma_1 = require("../lib/prisma");
const event_service_1 = require("../services/event.service");
async function getHostId() {
    const host = await prisma_1.prisma.host.findFirst();
    if (!host)
        throw new Error('Nenhum host cadastrado');
    return host.id;
}
async function eventRoutes(app) {
    app.get('/api/events', async (_request, reply) => {
        const hostId = await getHostId();
        const events = await (0, event_service_1.listEvents)(hostId);
        return reply.send({ events });
    });
    app.post('/api/events', async (request, reply) => {
        const hostId = await getHostId();
        const { name, date } = request.body;
        if (!name || !date)
            return reply.status(400).send({ error: 'Nome e data são obrigatórios' });
        try {
            const event = await (0, event_service_1.createEvent)(hostId, name, date);
            return reply.status(201).send({ event });
        }
        catch (err) {
            if (err instanceof event_service_1.EventError)
                return reply.status(err.statusCode).send({ error: err.message });
            throw err;
        }
    });
    app.get('/api/events/:id', async (request, reply) => {
        const hostId = await getHostId();
        try {
            const event = await (0, event_service_1.getEvent)(request.params.id, hostId);
            return reply.send({ event });
        }
        catch (err) {
            if (err instanceof event_service_1.EventError)
                return reply.status(err.statusCode).send({ error: err.message });
            throw err;
        }
    });
    app.put('/api/events/:id', async (request, reply) => {
        const hostId = await getHostId();
        try {
            const event = await (0, event_service_1.updateEvent)(request.params.id, hostId, request.body);
            return reply.send({ event });
        }
        catch (err) {
            if (err instanceof event_service_1.EventError)
                return reply.status(err.statusCode).send({ error: err.message });
            throw err;
        }
    });
    app.delete('/api/events/:id', async (request, reply) => {
        const hostId = await getHostId();
        try {
            await (0, event_service_1.deleteEvent)(request.params.id, hostId);
            return reply.status(204).send();
        }
        catch (err) {
            if (err instanceof event_service_1.EventError)
                return reply.status(err.statusCode).send({ error: err.message });
            throw err;
        }
    });
}
//# sourceMappingURL=event.routes.js.map
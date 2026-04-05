"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventRoutes = eventRoutes;
const auth_service_1 = require("../services/auth.service");
const event_service_1 = require("../services/event.service");
const COOKIE_NAME = 'token';
/** Extracts and verifies the JWT from the cookie, returning the hostId. */
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
async function eventRoutes(app) {
    // GET /api/events — list host's events
    app.get('/api/events', async (request, reply) => {
        const hostId = await requireAuth(request, reply);
        if (!hostId)
            return;
        const events = await (0, event_service_1.listEvents)(hostId);
        return reply.send({ events });
    });
    // POST /api/events — create event
    app.post('/api/events', async (request, reply) => {
        const hostId = await requireAuth(request, reply);
        if (!hostId)
            return;
        const { name, date } = request.body;
        if (!name || !date) {
            return reply.status(400).send({ error: 'Nome e data são obrigatórios' });
        }
        try {
            const event = await (0, event_service_1.createEvent)(hostId, name, date);
            return reply.status(201).send({ event });
        }
        catch (err) {
            if (err instanceof event_service_1.EventError) {
                return reply.status(err.statusCode).send({ error: err.message });
            }
            throw err;
        }
    });
    // GET /api/events/:id — get single event
    app.get('/api/events/:id', async (request, reply) => {
        const hostId = await requireAuth(request, reply);
        if (!hostId)
            return;
        try {
            const event = await (0, event_service_1.getEvent)(request.params.id, hostId);
            return reply.send({ event });
        }
        catch (err) {
            if (err instanceof event_service_1.EventError) {
                return reply.status(err.statusCode).send({ error: err.message });
            }
            throw err;
        }
    });
    // PUT /api/events/:id — update event
    app.put('/api/events/:id', async (request, reply) => {
        const hostId = await requireAuth(request, reply);
        if (!hostId)
            return;
        try {
            const event = await (0, event_service_1.updateEvent)(request.params.id, hostId, request.body);
            return reply.send({ event });
        }
        catch (err) {
            if (err instanceof event_service_1.EventError) {
                return reply.status(err.statusCode).send({ error: err.message });
            }
            throw err;
        }
    });
    // DELETE /api/events/:id — delete event
    app.delete('/api/events/:id', async (request, reply) => {
        const hostId = await requireAuth(request, reply);
        if (!hostId)
            return;
        try {
            await (0, event_service_1.deleteEvent)(request.params.id, hostId);
            return reply.status(204).send();
        }
        catch (err) {
            if (err instanceof event_service_1.EventError) {
                return reply.status(err.statusCode).send({ error: err.message });
            }
            throw err;
        }
    });
}
//# sourceMappingURL=event.routes.js.map
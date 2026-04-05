"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const auth_service_1 = require("../services/auth.service");
async function authRoutes(app) {
    // POST /api/auth/register
    app.post('/api/auth/register', async (request, reply) => {
        const { name, username, password, confirmPassword } = request.body;
        if (!name || !username || !password) {
            return reply.status(400).send({ error: 'Nome, usuário e senha são obrigatórios' });
        }
        if (confirmPassword !== undefined && password !== confirmPassword) {
            return reply.status(400).send({ error: 'A senha e a confirmação de senha não coincidem' });
        }
        try {
            const result = await (0, auth_service_1.register)(name, username, password);
            return reply.status(201).send({ host: result.host, token: result.token });
        }
        catch (err) {
            if (err instanceof auth_service_1.AuthError) {
                return reply.status(err.statusCode).send({ error: err.message });
            }
            throw err;
        }
    });
    // POST /api/auth/login
    app.post('/api/auth/login', async (request, reply) => {
        const { username, password } = request.body;
        if (!username || !password) {
            return reply.status(400).send({ error: 'Usuário e senha são obrigatórios' });
        }
        try {
            const result = await (0, auth_service_1.login)(username, password);
            return reply.send({ host: result.host, token: result.token });
        }
        catch (err) {
            if (err instanceof auth_service_1.AuthError) {
                return reply.status(err.statusCode).send({ error: err.message });
            }
            throw err;
        }
    });
    // POST /api/auth/logout
    app.post('/api/auth/logout', async (_request, reply) => {
        return reply.send({ message: 'Logout realizado com sucesso' });
    });
    // GET /api/auth/me
    app.get('/api/auth/me', async (request, reply) => {
        const authHeader = request.headers['authorization'];
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!token) {
            return reply.status(401).send({ error: 'Não autenticado' });
        }
        try {
            const payload = (0, auth_service_1.verifyToken)(token);
            return reply.send({ hostId: payload.hostId, username: payload.username });
        }
        catch {
            return reply.status(401).send({ error: 'Token inválido ou expirado' });
        }
    });
}
//# sourceMappingURL=auth.routes.js.map
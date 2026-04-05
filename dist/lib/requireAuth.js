"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const auth_service_1 = require("../services/auth.service");
async function requireAuth(request, reply) {
    const authHeader = request.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
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
//# sourceMappingURL=requireAuth.js.map
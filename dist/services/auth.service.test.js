"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const auth_service_1 = require("./auth.service");
const prisma_1 = require("../lib/prisma");
(0, vitest_1.beforeEach)(async () => {
    await prisma_1.prisma.reservation.deleteMany();
    await prisma_1.prisma.guest.deleteMany();
    await prisma_1.prisma.item.deleteMany();
    await prisma_1.prisma.event.deleteMany();
    await prisma_1.prisma.host.deleteMany();
});
(0, vitest_1.afterEach)(async () => {
    await prisma_1.prisma.reservation.deleteMany();
    await prisma_1.prisma.guest.deleteMany();
    await prisma_1.prisma.item.deleteMany();
    await prisma_1.prisma.event.deleteMany();
    await prisma_1.prisma.host.deleteMany();
});
(0, vitest_1.describe)('register', () => {
    (0, vitest_1.it)('creates a host and returns a token', async () => {
        const result = await (0, auth_service_1.register)('Ana', 'ana', 'senha123');
        (0, vitest_1.expect)(result.host.username).toBe('ana');
        (0, vitest_1.expect)(result.host.name).toBe('Ana');
        (0, vitest_1.expect)(result.token).toBeTruthy();
    });
    (0, vitest_1.it)('throws on duplicate username', async () => {
        await (0, auth_service_1.register)('Ana', 'ana', 'senha123');
        await (0, vitest_1.expect)((0, auth_service_1.register)('Ana2', 'ana', 'senha456')).rejects.toThrow(auth_service_1.AuthError);
    });
    (0, vitest_1.it)('throws when password is shorter than 6 chars', async () => {
        await (0, vitest_1.expect)((0, auth_service_1.register)('Ana', 'ana', '123')).rejects.toThrow(auth_service_1.AuthError);
    });
    (0, vitest_1.it)('stores a hashed password (not plaintext)', async () => {
        await (0, auth_service_1.register)('Ana', 'ana', 'senha123');
        const host = await prisma_1.prisma.host.findUnique({ where: { username: 'ana' } });
        (0, vitest_1.expect)(host.password).not.toBe('senha123');
        (0, vitest_1.expect)(host.password).toMatch(/^\$2/);
    });
});
(0, vitest_1.describe)('login', () => {
    (0, vitest_1.it)('returns token for valid credentials', async () => {
        await (0, auth_service_1.register)('Ana', 'ana', 'senha123');
        const result = await (0, auth_service_1.login)('ana', 'senha123');
        (0, vitest_1.expect)(result.host.username).toBe('ana');
        (0, vitest_1.expect)(result.token).toBeTruthy();
    });
    (0, vitest_1.it)('throws AuthError for wrong password', async () => {
        await (0, auth_service_1.register)('Ana', 'ana', 'senha123');
        await (0, vitest_1.expect)((0, auth_service_1.login)('ana', 'errada')).rejects.toThrow(auth_service_1.AuthError);
    });
    (0, vitest_1.it)('throws AuthError for unknown username', async () => {
        await (0, vitest_1.expect)((0, auth_service_1.login)('naoexiste', 'senha123')).rejects.toThrow(auth_service_1.AuthError);
    });
});
(0, vitest_1.describe)('generateToken / verifyToken', () => {
    (0, vitest_1.it)('round-trips payload correctly', () => {
        const payload = { hostId: 'abc', username: 'ana' };
        const token = (0, auth_service_1.generateToken)(payload);
        const decoded = (0, auth_service_1.verifyToken)(token);
        (0, vitest_1.expect)(decoded.hostId).toBe(payload.hostId);
        (0, vitest_1.expect)(decoded.username).toBe(payload.username);
    });
});
//# sourceMappingURL=auth.service.test.js.map
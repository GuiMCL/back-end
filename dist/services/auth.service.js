"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthError = void 0;
exports.register = register;
exports.login = login;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production';
const JWT_EXPIRES_IN = '7d';
const BCRYPT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;
class AuthError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AuthError';
    }
}
exports.AuthError = AuthError;
async function register(name, username, password) {
    if (password.length < MIN_PASSWORD_LENGTH) {
        throw new AuthError(`A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres`, 400);
    }
    const existing = await prisma_1.prisma.host.findUnique({ where: { username } });
    if (existing) {
        throw new AuthError('Nome de usuário já está em uso', 409);
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, BCRYPT_ROUNDS);
    const host = await prisma_1.prisma.host.create({
        data: { name, username, password: hashedPassword },
        select: { id: true, name: true, username: true },
    });
    const token = generateToken({ hostId: host.id, username: host.username });
    return { host, token };
}
async function login(username, password) {
    const host = await prisma_1.prisma.host.findUnique({ where: { username } });
    // Use constant-time comparison to avoid timing attacks; don't reveal which field is wrong
    const dummyHash = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
    const passwordToCheck = host ? host.password : dummyHash;
    const isValid = await bcryptjs_1.default.compare(password, passwordToCheck);
    if (!host || !isValid) {
        throw new AuthError('Credenciais inválidas', 401);
    }
    const token = generateToken({ hostId: host.id, username: host.username });
    return {
        host: { id: host.id, name: host.name, username: host.username },
        token,
    };
}
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
//# sourceMappingURL=auth.service.js.map
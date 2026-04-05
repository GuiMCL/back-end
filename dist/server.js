"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const auth_routes_1 = require("./routes/auth.routes");
const event_routes_1 = require("./routes/event.routes");
const item_routes_1 = require("./routes/item.routes");
const lista_routes_1 = require("./routes/lista.routes");
const app = (0, fastify_1.default)({ logger: true });
app.register(cors_1.default, {
    origin: true,
    credentials: true,
});
// Routes
app.register(auth_routes_1.authRoutes);
app.register(event_routes_1.eventRoutes);
app.register(item_routes_1.itemRoutes);
app.register(lista_routes_1.listaRoutes);
app.get('/health', async () => ({ status: 'ok' }));
const start = async () => {
    try {
        await app.listen({ port: 5900, host: '0.0.0.0' });
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=server.js.map
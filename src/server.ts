import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import { authRoutes } from './routes/auth.routes'
import { eventRoutes } from './routes/event.routes'
import { itemRoutes } from './routes/item.routes'
import { listaRoutes } from './routes/lista.routes'

const app = Fastify({ logger: true })

// Plugins
app.register(cors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
})

app.register(cookie)

// Routes
app.register(authRoutes)
app.register(eventRoutes)
app.register(itemRoutes)
app.register(listaRoutes)

app.get('/health', async () => ({ status: 'ok' }))

const start = async () => {
  try {
    await app.listen({ port: 5900, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

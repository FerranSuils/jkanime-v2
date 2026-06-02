import express from 'express'
import type { Request, Response } from 'express'
import jkanime from './index'

const app = express()
const PORT = Number(process.env.PORT) || 3000

// Simple request logger middleware
app.use((req: Request, _res: Response, next: () => void) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`)
  next()
})

/**
 * Wraps an async scraping handler with consistent error/null handling:
 * - throws        -> 500 { error: message }
 * - returns null  -> 404 { error: 'not found or upstream returned null' }
 * - returns value -> 200 { ...value }
 */
function handle<T>(fn: (req: Request) => Promise<T>) {
  return async (req: Request, res: Response) => {
    try {
      const result = await fn(req)
      if (result === null || result === undefined) {
        res.status(404).json({ error: 'not found or upstream returned null' })
        return
      }
      res.status(200).json(result)
    }
    catch (error: any) {
      const message = error?.message ?? String(error)
      console.error(`[ERROR] ${req.method} ${req.url}:`, message)
      res.status(500).json({ error: message })
    }
  }
}

// Healthcheck — must NOT depend on scraping
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() })
})

// Root — mini documentation of available endpoints
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'jkanime-v2 API',
    description: 'HTTP API wrapping the jkanime-v2 scraping library',
    endpoints: {
      'GET /health': 'Service healthcheck { status, uptime }',
      'GET /latest': 'Latest anime added',
      'GET /filter': 'Filter directory. Query params: genre, demography, category, type, state, year, season, orderBy',
      'GET /alphabet/:letter': 'Anime list by starting letter',
      'GET /anime/:slug': 'Extra info for an anime slug',
      'GET /top': 'Top anime. Query params: season (e.g. Invierno|Primavera|Verano|Otoño|Temporada Actual), year (e.g. 2020-2024)',
      'GET /search': 'Search anime. Query param: q',
      'GET /servers/:slug/:chapter': 'Streaming servers for an anime chapter (slow, ~2-3s)',
      'GET /schedule': 'Weekly emission schedule',
      'GET /directory': 'Anime directory. Query param: page (optional)',
    },
  })
})

// Scraping endpoints
app.get('/latest', handle(() => jkanime.latestAnimeAdded()))

app.get('/filter', handle(req => jkanime.filter({ query: req.query as any })))

app.get('/alphabet/:letter', handle(req => jkanime.byAlphabet(req.params.letter)))

app.get('/anime/:slug', handle(req => jkanime.getExtraInfo(req.params.slug)))

app.get('/top', handle(req => jkanime.top(req.query.season as any, req.query.year as any)))

app.get('/search', handle(req => jkanime.search(String(req.query.q))))

app.get('/servers/:slug/:chapter', handle(req => jkanime.getAnimeServers(req.params.slug, Number(req.params.chapter))))

app.get('/schedule', handle(() => jkanime.schedule()))

app.get('/directory', handle(req => jkanime.getAnimeDirectory(req.query.page as any)))

// 404 for unknown routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `route not found: ${req.method} ${req.url}` })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`jkanime-v2 API listening on http://0.0.0.0:${PORT}`)
})

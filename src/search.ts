import ky from 'ky'

import { config } from './config'
import type { StringOrNull } from './const/types'

interface Anime {
  id: StringOrNull
  slug: StringOrNull
  title: StringOrNull
  type: StringOrNull
  status: StringOrNull
  image: StringOrNull
  thumbnail: StringOrNull
}

interface SearchResults {
  animes: Anime[]
}

type SearchReturnType = Promise<SearchResults | null>

const IMAGE_BASE = 'https://cdn.jkdesa.com/assets/images/animes/image/'

// jkanime's /ajax_search is a Laravel POST endpoint protected by CSRF: it
// requires a session cookie plus the matching csrf-token from the page <meta>.
async function getSession(): Promise<{ cookie: string, token: string } | null> {
  const response = await ky(config.baseURL, { method: 'get' })
  const html = await response.text()

  const headers = response.headers as any
  const setCookies: string[] = typeof headers.getSetCookie === 'function'
    ? headers.getSetCookie()
    : [response.headers.get('set-cookie') ?? '']
  const cookie = setCookies
    .filter(Boolean)
    .map(entry => entry.split(';')[0])
    .join('; ')

  const token = html.match(/<meta name="csrf-token" content="([^"]+)"/)?.[1]
  if (!cookie || !token)
    return null

  return { cookie, token }
}

export async function search(q: string): SearchReturnType {
  const session = await getSession()
  if (!session)
    return null

  const response = await ky.post(`${config.baseURL}ajax_search`, {
    headers: {
      'X-CSRF-TOKEN': session.token,
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': session.cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ q }).toString(),
  })

  const data = await response.json<any[]>()
  if (!Array.isArray(data))
    return null

  const animes: Anime[] = data.map(item => ({
    id: item.id != null ? String(item.id) : null,
    slug: item.slug ?? null,
    title: item.title ?? null,
    type: item.type ?? null,
    status: item.status ?? null,
    image: item.image ? `${IMAGE_BASE}${item.image}` : null,
    thumbnail: item.thumbnail ?? null,
  }))

  return { animes }
}

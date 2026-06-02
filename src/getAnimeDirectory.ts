import { makeRequest } from './MakeRequest'
import { config } from './config'
import { ToolKit } from './utils'
import type { StringOrNull } from './const/types'

interface Anime {
  title: StringOrNull
  slug: StringOrNull
  amountEpisodes: StringOrNull
  startedEmision: StringOrNull
  statusEmision: StringOrNull
  type: StringOrNull
  synopsis: StringOrNull
  image: StringOrNull
}

type ReturnType = Promise<Anime[] | null>

async function getAnimeDirectory(paginationNumber?: number | string | null): ReturnType {
  const page = paginationNumber ?? 1
  const url = `${config.baseURL}directorio?p=${page}`

  const response = await makeRequest(url, 'text', { method: 'get' })
  if (!response)
    return null

  // The directorio grid is client-rendered from an embedded Laravel paginator
  // (`var animes = { ...data... }`), so we read the dataset instead of the DOM.
  const animes = ToolKit.extractEmbeddedJson(response, 'animes')
  if (!animes || !Array.isArray(animes.data))
    return null

  const animeData: Anime[] = animes.data.map((item: Record<string, any>) => ({
    title: item.title ?? null,
    slug: item.slug ?? null,
    amountEpisodes: null,
    startedEmision: null,
    statusEmision: item.estado ?? null,
    type: item.tipo ?? item.type ?? null,
    synopsis: item.synopsis ?? null,
    image: item.image ?? null,
  }))

  return animeData.filter(anime => anime.slug !== null)
}

export default getAnimeDirectory

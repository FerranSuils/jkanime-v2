import _ from 'lodash'

import { makeRequest } from './MakeRequest'
import { config } from './config'
import { ToolKit } from './utils'
import type { StringOrNull } from './const/types'
import { CATEGORY_MAP, DEMOGRAPHY_MAP, GENRE_MAP, ORDERBY_MAP, SEASON_MAP, STATE_MAP, TYPES_MAP, YEAR_MAP } from './const/filterOptions'

interface AnimeInfo {
  slug: StringOrNull
  title: StringOrNull
  synopsis: StringOrNull
  episodes: StringOrNull
  image: StringOrNull
  type: StringOrNull
}

type Genre = typeof GENRE_MAP[number]
type Demography = typeof DEMOGRAPHY_MAP[number]
type Category = typeof CATEGORY_MAP[number]
type Type = typeof TYPES_MAP[number]
type State = typeof STATE_MAP[number]
type Year = typeof YEAR_MAP[number]
type Season = typeof SEASON_MAP[number]
type OrderBy = typeof ORDERBY_MAP[number]

interface Filter {
  genre?: Genre
  demography?: Demography
  category?: Category
  type?: Type
  state?: State
  year?: Year
  season?: Season
  orderBy?: OrderBy
}

interface FilterProps {
  query?: Filter
}

type ReturnType = Promise<AnimeInfo[] | null>

// The full directorio is ~157 pages; real filtered queries return far fewer.
// This caps unbounded crawling when little/no filter is provided.
const MAX_PAGES = 50

// Maps the public filter keys to jkanime's `/directorio` query params, keeping
// only values that are valid according to each option map.
function buildFilterQuery(filter: Filter | undefined): Record<string, string> {
  const definitions: { key: keyof Filter, param: string, allowed: readonly string[] }[] = [
    { key: 'genre', param: 'genero', allowed: GENRE_MAP },
    { key: 'demography', param: 'demografia', allowed: DEMOGRAPHY_MAP },
    { key: 'category', param: 'categoria', allowed: CATEGORY_MAP },
    { key: 'type', param: 'tipo', allowed: TYPES_MAP },
    { key: 'state', param: 'estado', allowed: STATE_MAP },
    { key: 'year', param: 'fecha', allowed: YEAR_MAP },
    { key: 'season', param: 'temporada', allowed: SEASON_MAP },
    { key: 'orderBy', param: 'orden', allowed: ORDERBY_MAP },
  ]

  const query: Record<string, string> = {}
  for (const { key, param, allowed } of definitions) {
    const value = filter?.[key]
    if (value && allowed.includes(value as never))
      query[param] = value as string
  }
  return query
}

function mapAnime(item: Record<string, any>): AnimeInfo {
  return {
    slug: item.slug ?? null,
    title: item.title ?? null,
    synopsis: item.synopsis ?? null,
    episodes: null,
    image: item.image ?? null,
    type: item.tipo ?? item.type ?? null,
  }
}

async function requestFilter({ query }: FilterProps): ReturnType {
  const baseQuery = ToolKit.buildQuery(buildFilterQuery(query))
  const separator = baseQuery ? '&' : ''
  const allAnimeInfo: AnimeInfo[] = []

  let page = 1
  let lastPage = 1

  while (page <= lastPage && page <= MAX_PAGES) {
    try {
      const url = `${config.baseURL}directorio?${baseQuery}${separator}p=${page}`
      const response = await makeRequest(url, 'text', { method: 'get' })
      if (!response)
        break

      // The directorio grid is client-rendered from an embedded Laravel paginator.
      const animes = ToolKit.extractEmbeddedJson(response, 'animes')
      if (!animes || !Array.isArray(animes.data))
        break

      allAnimeInfo.push(...animes.data.map(mapAnime))

      lastPage = _.toNumber(animes.last_page) || 1
      if (!animes.next_page_url)
        break
      page++
    }
    catch (error) {
      console.error('[RequestFilter] Error fetching data:', error)
      break
    }
  }

  return allAnimeInfo
}

export async function filter({ query }: FilterProps): ReturnType {
  return await requestFilter({ query })
}

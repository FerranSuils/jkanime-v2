import cheerio from 'cheerio'

import { makeRequest } from './MakeRequest'
import { config } from './config'
import { ToolKit } from './utils'
import type { NumberOrNull, StringOrNull } from './const/types'

interface Anime {
  id: StringOrNull
  rank: NumberOrNull
  slug: StringOrNull
  title: StringOrNull
  synopsis: StringOrNull
  episodes: NumberOrNull
  image: StringOrNull
  type: StringOrNull
}

type SeasonType = 'Primavera' | 'Verano' | 'Otoño' | 'Invierno' | 'Temporada Actual'

type YearType = '2020' | '2021' | '2022' | '2023' | '2024'

type ReturnType = Promise<Anime[] | null>

const DEFAULT_ACTUAL_SEASON: SeasonType = 'Temporada Actual'

async function top(season: SeasonType, year: YearType): ReturnType {
  const path = season === DEFAULT_ACTUAL_SEASON
    ? `${config.baseURL}top`
    : `${config.baseURL}top?${ToolKit.buildQuery({ temporada: season, fecha: year })}`

  const response = await makeRequest(path, 'text', { method: 'get' })
  if (!response)
    return null

  const $ = cheerio.load(response)

  const elements = $('.col.toplist').toArray()

  const animeData: Anime[] = elements.map((element) => {
    const $el = $(element)

    const link = $el.find('a').attr('href')
    const slug = ToolKit.slugFromUrl(link)
    const title = $el.find('.card-title').text().trim() || $el.find('img').attr('alt') || null
    const image = $el.find('img').attr('src') ?? null
    const synopsis = $el.find('.card-synopsis').text().trim() || null
    const rank = ToolKit.extractNumberFromString($el.find('.ranking').attr('data-rank') ?? $el.find('.ranking').text())

    return {
      id: null,
      rank,
      slug,
      title,
      synopsis,
      episodes: null,
      image,
      type: null,
    }
  }).filter(anime => anime.slug !== null)

  return animeData
}

export default top

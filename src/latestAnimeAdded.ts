import cheerio from 'cheerio'

import { makeRequest } from './MakeRequest'
import { config } from './config'
import { ToolKit } from './utils'
import type { NumberOrNull, StringOrNull } from './const/types'

interface Anime {
  slug: StringOrNull
  title: StringOrNull
  synopsis: StringOrNull
  episodes: NumberOrNull
  image: StringOrNull
  type: StringOrNull
  status: StringOrNull
}

type ReturnType = Promise<Anime[] | null>

async function latestAnimeAdded(): ReturnType {
  const response = await makeRequest(config.baseURL, 'text', { method: 'get' })
  if (!response)
    return null

  const $ = cheerio.load(response)

  // "Animes recientes" lives in the single `.row.mode3` block on the home page.
  const elements = $('.row.mode3 .p-3.d-flex').toArray()

  const animeData: Anime[] = elements.map((element) => {
    const $el = $(element)

    const link = $el.find('.custom_thumb_home a').attr('href') ?? $el.find('.card-title a').attr('href')
    const slug = ToolKit.slugFromUrl(link)
    const title = $el.find('.card-body-home .card-title a').text().trim() || null
    const image = $el.find('.custom_thumb_home img').attr('src') ?? null

    // `.card-info` holds two badges: status first (En emision/Concluido), type second (ONA/OVA/...).
    const badges = $el.find('.card-info .badge')
    const status = badges.eq(0).text().trim() || null
    const type = badges.eq(1).text().trim() || null

    return {
      slug,
      title,
      synopsis: null,
      episodes: null,
      image,
      type,
      status,
    }
  }).filter(anime => anime.slug !== null)

  return animeData
}

export default latestAnimeAdded

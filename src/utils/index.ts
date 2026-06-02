import _ from 'lodash'
import qs from 'qs'
import type { NumberOrNull } from '../const/types'

export class ToolKit {
  static buildQuery = (obj: Record<string, any>) => {
    const query: Record<string, any> = {}
    for (const key in obj) {
      if (
        Object.prototype.hasOwnProperty.call(obj, key)
        && obj[key] !== undefined
        && obj[key] !== null
        && obj[key] !== ''
      )
        query[key] = obj[key]
    }

    return qs.stringify(query, { encode: false })
  }

  static extractNumberFromString = (inputString: any): NumberOrNull => {
    const digits = String(inputString ?? '').match(/\d+/)?.[0]
    const match = digits ? _.parseInt(digits) : Number.NaN
    return _.isFinite(match) ? match : null
  }

  // Extracts the last non-empty path segment of a URL (the anime slug).
  static slugFromUrl = (url?: string | null): string | null => {
    if (!url)
      return null
    const segments = _.split(url, '/').filter(Boolean)
    return _.last(segments) ?? null
  }

  // jkanime renders some pages (directorio) on the client: the dataset is
  // embedded in the HTML as `var <name> = { ...Laravel paginator... };`.
  // This extracts that object via string-aware brace balancing and JSON.parse.
  static extractEmbeddedJson = (html: string, varName: string): any | null => {
    const marker = `var ${varName}`
    const markerIndex = html.indexOf(marker)
    if (markerIndex === -1)
      return null

    const start = html.indexOf('{', markerIndex)
    if (start === -1)
      return null

    let depth = 0
    let inString = false
    let escaped = false

    for (let i = start; i < html.length; i++) {
      const char = html[i]

      if (inString) {
        if (escaped)
          escaped = false
        else if (char === '\\')
          escaped = true
        else if (char === '"')
          inString = false
        continue
      }

      if (char === '"')
        inString = true
      else if (char === '{')
        depth++
      else if (char === '}') {
        depth--
        if (depth === 0) {
          try {
            return JSON.parse(html.slice(start, i + 1))
          }
          catch {
            return null
          }
        }
      }
    }

    return null
  }
}

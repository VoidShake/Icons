import Fuse, { type Expression, type FuseResult } from 'fuse.js'
import type { Icon } from '../types/Icon'

export const MIN_QUERY_LENGTH = 1
export const MAX_ITEMS = 100

export function transformExpression(query: string): string | Expression {
   const namespaceQueries =
      query
         .match(/@(["\^\$!\w]*)/g)
         ?.map(it => it.slice(1))
         ?.filter(it => it.length) ?? []

   const idQueries = query
      .replace(/@["\^\$!\w]*/g, '')
      .split(/\s+/)
      .filter(it => it.trim().length)

   return {
      $and: [...idQueries.map(search => ({ id: search })), ...namespaceQueries.map(search => ({ namespace: search }))],
   }
}

export function createFuse(icons: Icon[]) {
   return new Fuse(icons, {
      keys: [
         {
            name: 'id',
            weight: 10,
         },
         {
            name: 'namespace',
            weight: 1,
         },
      ],
      includeMatches: true,
      minMatchCharLength: MIN_QUERY_LENGTH,
      threshold: 0.25,
      useExtendedSearch: true,
   })
}

type Searcher = <B extends boolean>(
   query: string | undefined,
   includeMatches: B,
) => ReadonlyArray<B extends true ? FuseResult<Icon> : Icon>

export function createSearcher(icons: Icon[]) {
   const fuse = createFuse(icons)

   const UNFILTERED = icons.map<FuseResult<Icon>>((item, refIndex) => ({
      item,
      refIndex,
   }))

   const searcher = <B extends boolean>(query: string | undefined, includeMatches: B) => {
      if (!query?.trim().length) {
         if (includeMatches) return UNFILTERED
         return icons
      }

      const expression = transformExpression(query)
      const matches = fuse.search(expression)
      if (includeMatches) return matches
      return matches.map(it => it.item)
   }

   return searcher as Searcher
}

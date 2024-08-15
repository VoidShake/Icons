import type { Page } from '../types/Page'

export function pageOf<T>(matches: ReadonlyArray<T>, pageSize: number, page = 0): Page<T> {
   const total = matches.length
   const items = matches.slice(page * pageSize, (page + 1) * pageSize)
   const count = items.length

   const previousPage = page > 0 ? page - 1 : undefined
   const pageCount = Math.ceil(total / pageSize)

   const nextPage = page < pageCount - 1 ? page + 1 : undefined

   return { items, count, nextPage, previousPage, pageCount, pageSize, total }
}

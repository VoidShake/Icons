import type { APIRoute } from 'astro'
import { URL } from 'url'
import getIcons from '../lib/getIcons'
import { createSearcher, MAX_ITEMS } from '../lib/search'

export const prerender = false

const icons = getIcons()
const search = createSearcher(icons)

export const GET: APIRoute = ({ request }) => {
   const url = new URL(request.url)
   const params = Object.fromEntries(url.searchParams)

   const limit = Math.min(MAX_ITEMS, parseInt(params.limit ?? '9999'))

   const matches = search(params.query, params.includeMatches === 'true')

   const total = matches.length
   const items = matches.slice(0, limit)
   const count = items.length

   return new Response(JSON.stringify({ items, count, total }), {
      headers: {
         'Content-Type': 'application/json',
      },
   })
}

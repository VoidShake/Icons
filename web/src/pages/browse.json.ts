import type { APIRoute } from 'astro'
import type { Expression } from 'fuse.js'
import { URL } from 'url'
import getIcons from '../lib/getIcons'
import { createSearcher, MAX_ITEMS } from '../lib/search'

export const prerender = false

const icons = getIcons()
const search = createSearcher(icons)

type RequestParams = {
   limit?: string | number
   includeMatches?: string | boolean
   query?: Expression | string
}

function handleRequest(params: RequestParams) {
   const unboundLimit = typeof params.limit === 'number' ? params.limit : parseInt(params.limit ?? '9999')
   const limit = Math.min(MAX_ITEMS, unboundLimit)

   const matches = search(params.query, params.includeMatches?.toString() === 'true')

   const total = matches.length
   const items = matches.slice(0, limit)
   const count = items.length

   return new Response(JSON.stringify({ items, count, total }), {
      headers: {
         'Content-Type': 'application/json',
      },
   })
}

export const GET: APIRoute = ({ request }) => {
   const url = new URL(request.url)
   const params = Object.fromEntries(url.searchParams)

   return handleRequest(params)
}

export const POST: APIRoute = async ({ request }) => {
   const body = await request.json()

   return handleRequest(body)
}

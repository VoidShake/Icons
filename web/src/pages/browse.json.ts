import type { APIRoute } from 'astro'
import type { Expression } from 'fuse.js'
import { URL } from 'url'
import getIcons from '../lib/getIcons'
import { pageOf } from '../lib/page'
import { createSearcher, MAX_ITEMS } from '../lib/search'

export const prerender = false

const icons = getIcons()
const search = createSearcher(icons)

type RequestParams = {
   limit?: string | number
   page?: string | number
   includeMatches?: string | boolean
   query?: Expression | string
}

function optionalInt(value: number | string | null | undefined): number | undefined {
   if (value === undefined || value === null) return undefined
   return typeof value === 'number' ? value : parseInt(value)
}

function handleRequest(params: RequestParams) {
   const pageSize = Math.min(MAX_ITEMS, optionalInt(params.limit) ?? MAX_ITEMS)
   const page = Math.max(0, optionalInt(params.page) ?? 0)

   const matches = search(params.query, params.includeMatches?.toString() === 'true')

   const result = pageOf(matches, pageSize, page)

   return new Response(JSON.stringify(result), {
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

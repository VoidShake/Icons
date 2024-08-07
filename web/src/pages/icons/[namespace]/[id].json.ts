import type { APIRoute } from 'astro'
import getIcons from '../../../lib/getIcons'

const icons = getIcons()

export const GET: APIRoute = ({ params }) => {
   const { id, namespace } = params

   const icon = icons.find(it => it.id === id && it.namespace === namespace)

   return new Response(JSON.stringify(icon))
}

export const HEAD: APIRoute = () => {
   return new Response()
}

export function getStaticPaths() {
   return icons.map(it => ({ params: it }))
}

import Fuse, { type Expression, type FuseResult } from 'fuse.js'
import { useEffect, useMemo, useReducer } from 'preact/hooks'
import type { Icon } from '../types/Icon.ts'
import IconPanel from './IconPanel.tsx'

import './IconList.module.css'

type Props = {
   icons: Icon[]
}

const MAX_ENTRIES = 250
const MIN_QUERY_LENGTH = 1

type Encodeable = { toString(): string }

function useQueryState<T extends Encodeable>(key: string, decode: (from: string) => T | null, defaultValue: T) {
   const state = useReducer((_: T, value: T) => {
      const url = new URL(window.location.href)
      url.searchParams.set(key, value.toString())
      window.history.replaceState(value, value.toString(), url)
      return value
   }, defaultValue)

   // Load query params on client
   useEffect(() => {
      const query = new URLSearchParams(window.location.search)
      if (query.has(key)) {
         const decoded = decode(query.get(key)!)
         if (decoded !== null) state[1](decoded)
      }
   }, [])

   return state
}

function toExpression(query: string): string | Expression {
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

export default function IconList({ icons }: Props) {
   const [query, setQuery] = useQueryState('q', it => it, '')
   const [size] = useQueryState('s', parseInt, MAX_ENTRIES)

   const unfiltered = useMemo(
      () =>
         icons.map<FuseResult<Icon>>((item, refIndex) => ({
            item,
            refIndex,
         })),
      [icons]
   )

   const fuse = useMemo(
      () =>
         new Fuse(icons, {
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
         }),
      [icons]
   )

   const filtered = useMemo(() => {
      if (query.trim().length < MIN_QUERY_LENGTH) return unfiltered
      return fuse.search(toExpression(query))
   }, [query, icons])

   const sliced = useMemo(() => filtered.slice(0, size), [filtered, size])

   return (
      <div>
         <input
            type='text'
            name='search'
            placeholder='Search...'
            value={query}
            onInput={e => setQuery(e.currentTarget.value)}
         />
         <ul>
            {sliced.map(icon => (
               <IconPanel {...icon} key={icon.item.url} />
            ))}
         </ul>
      </div>
   )
}

import { type FuseResult } from 'fuse.js'
import { useQuery } from 'preact-fetching'
import { useCallback, useEffect, useMemo, useReducer, useState } from 'preact/hooks'
import type { Icon } from '../types/Icon.ts'
import IconPanel from './IconPanel.tsx'

import debounce from 'debounce'
import './IconList.module.css'

type Props = {
   items: FuseResult<Icon>[]
   query: string
   limit: number
}

type Encodeable = { toString(): string }

function useQueryState<T extends Encodeable>(key: string, defaultValue: T) {
   const state = useReducer((_: T, value: T) => {
      const url = new URL(window.location.href)
      url.searchParams.set(key, value.toString())
      window.history.replaceState(value, value.toString(), url)
      return value
   }, defaultValue)

   return state
}

type Page<T> = {
   items: T[]
   count: number
   total: number
}

async function fetchItems(query: string, limit: number): Promise<Page<FuseResult<Icon>>> {
   const response = await fetch(`/browse.json?includeMatches=true&query=${query}&limit=${limit}`)
   if (!response.ok) throw new Error(response.statusText)
   return await response.json()
}

export function useLazyQuery<T>(data: T | undefined | null, initialData?: T) {
   const [value, setValue] = useState(initialData)
   useEffect(() => {
      if (data) setValue(data)
   }, [data])
   return value
}

export default function IconList(initial: Props) {
   const [query, setQuery] = useQueryState('q', initial.query)
   const [size] = useQueryState('s', initial.limit)
   const setQueryDebounced = useMemo(() => debounce(setQuery, 250), [setQuery])

   const fetch = useCallback(() => fetchItems(query, size), [query, size])
   const { data } = useQuery(`browse/${query}/${size}´`, fetch)
   const items = useLazyQuery(data?.items, initial.items)

   return (
      <div>
         <input
            type="text"
            name="search"
            placeholder="Search..."
            value={query}
            onInput={e => setQueryDebounced(e.currentTarget.value)}
         />
         <ul>{items?.map(icon => <IconPanel {...icon} key={icon.item.url} />)}</ul>
      </div>
   )
}

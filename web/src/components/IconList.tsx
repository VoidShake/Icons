import { type FuseResult } from 'fuse.js'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'preact/hooks'
import type { Icon } from '../types/Icon.ts'
import IconPanel from './IconPanel.tsx'

import type { TargetedEvent } from 'preact/compat'
import { debounce } from 'throttle-debounce'
import type { Page, PageData } from '../types/Page.ts'
import styles from './IconList.module.css'

type Props = {
   page: Page<FuseResult<Icon>>
   query: string
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

async function fetchItems(
   query: string,
   page: number,
   signal: AbortSignal | null = null,
): Promise<Page<FuseResult<Icon>>> {
   const response = await fetch(`/browse.json?includeMatches=true&query=${query}&page=${page}`, {
      signal,
   })
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
   const [search, setSearch] = useQueryState('q', initial.query)
   const [query, setQuery] = useState(initial.query)
   const setQueryDebounced = useMemo(() => debounce(250, setQuery), [setQuery])

   const [pageData, setPageData] = useState<PageData>(initial.page)

   const [items, setItems] = useState<FuseResult<Icon>[]>(initial.page.items)

   const [loading, setLoading] = useState(false)

   const onInput = useCallback(
      (event: TargetedEvent<HTMLInputElement>) => {
         const { value } = event.currentTarget
         setSearch(value)
         setQueryDebounced(value)
      },
      [setQueryDebounced, setSearch],
   )

   const [abortController, setAbortController] = useReducer(
      (previous: AbortController | null, next: AbortController | null) => {
         previous?.abort()
         return next
      },
      null,
   )

   const fetch = useCallback(
      async (page: number) => {
         setLoading(true)
         setAbortController(new AbortController())
         try {
            return await fetchItems(query, page, abortController?.signal)
         } finally {
            setLoading(false)
            setAbortController(null)
         }
      },
      [query, abortController, setAbortController],
   )

   useEffect(() => {
      fetch(0).then(({ items, ...pageData }) => {
         setPageData(pageData)
         setItems(items)
      })

      return () => setAbortController(null)
   }, [query, setAbortController])

   const fetchMore = useCallback(() => {
      const { nextPage } = pageData
      if (typeof nextPage !== 'number') return

      fetch(nextPage).then(({ items, ...pageData }) => {
         setPageData(pageData)
         setItems(previous => [...previous, ...items])
      })
   }, [query, pageData, setPageData, setItems])

   const observedRef = useRef<HTMLButtonElement>(null)

   useEffect(() => {
      const { current } = observedRef

      const observer = new IntersectionObserver(
         ([entry]) => {
            if (entry?.isIntersecting) fetchMore()
         },
         { root: null, rootMargin: `500px`, threshold: 1 },
      )
      if (current) observer.observe(current)
      return () => {
         if (current) observer.disconnect()
      }
   }, [observedRef, fetchMore])

   return (
      <div class={styles.container}>
         <input type="text" name="search" placeholder="Search..." value={search} onInput={onInput} />
         <ul>{items?.map(icon => <IconPanel {...icon} key={icon.item.url} />)}</ul>
         {typeof pageData.nextPage === 'number' && (
            <button class={styles.more} disabled={loading} onClick={fetchMore} ref={observedRef}>
               Load More
            </button>
         )}
      </div>
   )
}

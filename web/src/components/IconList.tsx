import Fuse from 'fuse.js'
import { useMemo, useState } from 'react'
import type Icon from '../types/Icon.ts'
import IconPanel from './IconPanel.tsx'

import './IconList.module.css'

type Props = {
   icons: Icon[]
}

const MAX_ENTRIES = 250
const MIN_QUERY_LENGTH = 2

export default function IconList({ icons }: Props) {
   const [query, setQuery] = useState('')

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
            threshold: 0.5,
         }),
      [icons]
   )

   const filtered = useMemo(() => {
      if (query.trim().length < MIN_QUERY_LENGTH) return icons
      return fuse.search(query).map(result => result.item)
   }, [query, icons])

   const sliced = useMemo(() => filtered.slice(0, MAX_ENTRIES), [filtered])

   return (
      <div>
         <input
            type='text'
            name='search'
            placeholder='Search...'
            value={query}
            onChange={e => setQuery(e.target.value)}
         />
         <ul>
            {sliced.map(icon => (
               <IconPanel {...icon} key={icon.url} />
            ))}
         </ul>
      </div>
   )
}

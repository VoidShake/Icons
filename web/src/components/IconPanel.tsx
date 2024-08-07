import { useCallback, useMemo } from 'react'
import type { Icon } from '../types/Icon.ts'

import './IconPanel.module.css'

export default function IconPanel({ id, namespace, url }: Icon) {
   const copy = useCallback(() => {
      const origin = window.location.origin
      navigator.clipboard.writeText(origin + url)
   }, [url])

   const fullId = useMemo(() => `${namespace}:${id}`, [namespace, id])

   return (
      <li>
         <img src={url} alt={fullId} />
         <div onClick={copy} tabIndex={-1} title={fullId}>
            <p>
               <small>{namespace}/</small>
            </p>
            <p>{id}</p>
         </div>
      </li>
   )
}

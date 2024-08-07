import type { FuseResult, FuseResultMatch } from 'fuse.js'
import { useCallback, useMemo } from 'preact/hooks'
import type { Icon } from '../types/Icon.ts'

import styles from './IconPanel.module.css'

function Highlighted({ children, match }: { match?: FuseResultMatch | undefined; children: string }) {
   const slices = useMemo(() => {
      const indices = match?.indices ?? []
      const firstMatch = indices[0]?.[0] ?? children.length

      return [
         <span key="start">{children.slice(0, firstMatch)}</span>,
         ...indices.flatMap(([from, to], i, a) => {
            const nextMatch = a[i + 1]?.[0] ?? children.length
            return [
               <span key={`match-${i}`} className={styles.highlighted}>
                  {children.slice(from, to + 1)}
               </span>,
               <span key={`no-match-${i}`}>{children.slice(to + 1, nextMatch)}</span>,
            ]
         }),
      ]
   }, [match, children])

   return <>{slices}</>
}

export default function IconPanel({ item, matches }: FuseResult<Icon>) {
   const { id, namespace, url } = item

   const copy = useCallback(() => {
      const origin = window.location.origin
      navigator.clipboard.writeText(origin + url)
   }, [url])

   const fullId = useMemo(() => `${namespace}:${id}`, [namespace, id])

   const idMatch = useMemo(() => matches?.find(it => it.key === 'id'), [matches])
   const namespaceMatch = useMemo(() => matches?.find(it => it.key === 'namespace'), [matches])

   return (
      <li>
         <img src={url} alt={fullId} />
         <div className={styles.copyArea} onClick={copy} tabIndex={-1} title={fullId}>
            <p>
               <small>
                  <Highlighted match={namespaceMatch}>{namespace}</Highlighted>/
               </small>
            </p>
            <p>
               <Highlighted match={idMatch}>{id}</Highlighted>
            </p>
         </div>
      </li>
   )
}

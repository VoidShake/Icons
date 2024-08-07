import type { FuseResult, FuseResultMatch, RangeTuple } from 'fuse.js'
import { useCallback, useMemo } from 'react'
import type { Icon } from '../types/Icon.ts'

import styles from './IconPanel.module.css'

function getIndices(match?: FuseResultMatch): RangeTuple[] {
   const indices: RangeTuple[] = []

   if (match) {
      match.indices
         .toSorted((a, b) => b[1] - b[0] - (a[1] - a[0]))
         .forEach(([from, to]) => {
            if (
               !indices.some(([from2, to2]) => {
                  return from2 <= from && to2 >= to
               })
            ) {
               indices.push([from, to])
            }
         })
   }

   return indices
}

function Highlighted({ children, match }: { match?: FuseResultMatch | undefined; children: string }) {
   const slices = useMemo(() => {
      const indices = getIndices(match)
      const firstMatch = indices[0]?.[0] ?? children.length

      return [
         <span key='start'>{children.slice(0, firstMatch)}</span>,
         ...indices.flatMap(([from, to], i, a) => {
            const nextMatch = a[i + 1]?.[1] ?? children.length + 1
            return [
               <span key={`match-${i}`} className={styles.highlighted}>
                  {children.slice(from, to + 1)}
               </span>,
               <span key={`no-match-${i}`}>{children.slice(to + 1, nextMatch - 1)}</span>,
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

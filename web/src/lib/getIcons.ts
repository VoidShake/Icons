import { readdirSync, statSync } from 'fs'
import { join, parse, resolve } from 'path'
import type { Icon } from '../types/Icon.ts'

const baseDir = resolve('public/icons')

export function getNamespaces() {
   return readdirSync(baseDir)
      .filter(it => statSync(join(baseDir, it)).isDirectory())
      .toSorted(it => {
         if (it === 'minecraft') return -1
         return 0
      })
}

export default function getIcons() {
   const namespaces = getNamespaces()

   return namespaces.flatMap(namespace => {
      const files = readdirSync(join(baseDir, namespace))
      return files.map<Icon>(file => {
         const id = parse(file).name
         const url = `/icons/${namespace}/${file}`
         return { namespace, id, url }
      })
   })
}

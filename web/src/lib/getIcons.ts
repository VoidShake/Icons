import { readdirSync, statSync } from 'fs'
import { join, parse, resolve } from 'path'
import type { Icon } from '../types/Icon.ts'

export default function getIcons() {
   const baseDir = resolve('public/icons')

   const namespaces = readdirSync(baseDir)
      .filter(it => statSync(join(baseDir, it)).isDirectory())
      .toSorted(it => {
         if (it === 'minecraft') return -1
         return 0
      })

   return namespaces.flatMap(namespace => {
      const files = readdirSync(join(baseDir, namespace))
      return files.map<Icon>(file => {
         const id = parse(file).name
         const url = `/icons/${namespace}/${file}`
         return { namespace, id, url }
      })
   })
}

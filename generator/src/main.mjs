import { renderFrom } from '@pssbletrngle/assets-renderer'
import parseArgs from 'arg'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'

function parseDumps(from) {
   if (!existsSync(from)) throw new Error('registry dump directory missing')

   const registries = readdirSync(from)

   return registries.flatMap(registry => {
      const namespaces = readdirSync(join(from, registry))

      return namespaces.flatMap(namespace => {
         const content = readFileSync(join(from, registry, namespace))
         return JSON.parse(content.toString())
      })
   })
}

async function run(overwrite) {
   const include = parseDumps('../dump')

   await renderFrom(
      ['../resources', '../install/mods'],
      { output: '../web/public/icons', keep: true },
      { include, overwrite }
   )
}

const args = parseArgs({
   '--overwrite': Boolean,
})

run(args['--overwrite']).catch(e => {
   console.error(e)
   process.exit(1)
})

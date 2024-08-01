import { createWriteStream, existsSync, mkdirSync, readFileSync, statSync } from 'fs'
import { dirname, join } from 'path'
import { Readable } from 'stream'
import { parse } from 'toml'

function readToml(path) {
   return parse(readFileSync(path).toString())
}

async function installPack(from, to) {
   if (!existsSync(from)) throw new Error(`Path at ${from} does not exist`)

   const packFile = statSync(from).isDirectory() ? join(from, 'pack.toml') : from

   if (!existsSync(packFile)) throw new Error(`Unable to locate pack.toml at ${from}`)

   console.log(`Installing pack from ${packFile}`)
   const pack = readToml(packFile)

   const packDir = dirname(packFile)

   const indexFile = join(packDir, pack.index.file)
   if (!existsSync(indexFile)) throw new Error(`Unable to locate ${indexFile}`)

   const index = readToml(indexFile)

   await Promise.all(
      index.files.map(async ({ file }) => {
         const resolvedFile = join(packDir, file)
         if (!existsSync(resolvedFile)) throw new Error(`Unable to locate ${resolvedFile}`)
         const definition = readToml(resolvedFile)

         console.log(`   downloading ${definition.filename}...`)

         const outPath = join(to, dirname(file), definition.filename)

         if (!existsSync(dirname(outPath))) mkdirSync(dirname(outPath), { recursive: true })

         const out = createWriteStream(outPath)
         const response = await fetch(definition.download.url)

         return new Promise((res, rej) => {
            const readable = Readable.fromWeb(response.body)
            readable.pipe(out)
            readable.on('error', rej)
            readable.on('finish', res)
         })
      })
   )
}

const [, , from, to] = process.argv

installPack(from, to).catch(e => {
   console.error(e)
   process.exit(1)
})

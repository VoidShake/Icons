import { createHash } from 'crypto'
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'fs'
import { dirname, join } from 'path'
import { Readable } from 'stream'
import { parse } from 'toml'

function readToml(path, missingMessage = `Unable to locate ${path}`) {
   if (!existsSync(path)) throw new Error(missingMessage)
   const content = readFileSync(path).toString()
   return parse(content)
}
function verifyFileSha(file, checksum) {
   const content = readFileSync(file)
   return verifySha(file, content, checksum)
}

function verifySha(name, content, checksum) {
   const shasum = createHash('sha1')
   shasum.update(content)
   if (shasum.digest('hex') !== checksum) {
      throw new Error(`checksum does not match for ${name}`)
   }
}

async function installPack(from, to, options) {
   if (!from) throw new Error('input argument missing')
   if (!to) throw new Error('output argument missing')

   if (!existsSync(from)) throw new Error(`Path at ${from} does not exist`)

   if (options.includes('--clean')) rmSync(to, { recursive: true, force: true })

   const packFile = statSync(from).isDirectory() ? join(from, 'pack.toml') : from

   if (!existsSync(packFile)) throw new Error(`Unable to locate pack.toml at ${from}`)

   console.log(`Installing pack from ${packFile}`)
   const pack = readToml(packFile)

   const packDir = dirname(packFile)

   const index = readToml(join(packDir, pack.index.file))

   await Promise.all(
      index.files.map(async ({ file }) => {
         const definition = readToml(join(packDir, file))

         console.log(`   downloading ${definition.filename}...`)

         const outPath = join(to, dirname(file), definition.filename)

         if (!existsSync(outPath) || options.includes('--overwrite')) {
            if (!existsSync(dirname(outPath))) mkdirSync(dirname(outPath), { recursive: true })

            const out = createWriteStream(outPath)
            const response = await fetch(definition.download.url)

            await new Promise((res, rej) => {
               const readable = Readable.fromWeb(response.body)
               readable.pipe(out)
               readable.on('error', rej)
               readable.on('end', res)
            })
         } else {
            console.log(`   using cached file for ${outPath}`)
         }

         verifyFileSha(outPath, definition.download.hash)
      })
   )
}

const args = process.argv.slice(2)
const options = args.filter(it => it.startsWith('-'))
const [from, to] = args.filter(it => !it.startsWith('-'))

installPack(from, to, options).catch(e => {
   console.error(e)
   process.exit(1)
})

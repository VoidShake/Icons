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
      console.warn(`checksum does not match for ${name}`)
   }
}

async function fetchFromCurseforge(endpoint) {
   const token = process.env.CURSEFORGE_TOKEN

   if (!token) throw new Error(`Unable to download from curseforge without passing a token`)

   const response = await fetch(`https://api.curseforge.com/${endpoint}`, {
      headers: {
         'x-api-key': token,
      },
   })
   if (!response.ok) throw new Error(response.statusText)

   return response
}

async function getUrlFrom({ download, name, update }) {
   if (download.url) return download.url
   if (download.mode === 'metadata:curseforge' && update.curseforge) {
      const response = await fetchFromCurseforge(
         `v1/mods/${update.curseforge['project-id']}/files/${update.curseforge['file-id']}/download-url`
      )
      const { data } = await response.json()
      return data
   }

   throw new Error(`unable to find url for ${name}`)
}

async function downloadFile(definition, outPath) {
   if (!existsSync(dirname(outPath))) mkdirSync(dirname(outPath), { recursive: true })

   const url = await getUrlFrom(definition)
   const response = await fetch(url)
   if (!response.ok) throw new Error(response.statusText)

   const out = createWriteStream(outPath)

   await new Promise((res, rej) => {
      const readable = Readable.fromWeb(response.body)
      readable.pipe(out)
      readable.on('error', rej)
      readable.on('end', res)
   })
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

   const results = await Promise.allSettled(
      index.files.map(async ({ file }) => {
         const definition = readToml(join(packDir, file))

         console.log(`   downloading ${definition.filename}...`)

         const outPath = join(to, dirname(file), definition.filename)

         if (!existsSync(outPath) || options.includes('--overwrite')) {
            await downloadFile(definition, outPath)
         } else {
            console.log(`   using cached file for ${outPath}`)
         }

         verifyFileSha(outPath, definition.download.hash)
      })
   )

   const errors = results.filter(it => it.status === 'rejected')

   if (errors.length > 0) {
      errors.forEach(it => console.error(it.reason))
      throw new Error(`${errors.length} files failed to download`)
   }
}

const args = process.argv.slice(2)
const options = args.filter(it => it.startsWith('-'))
const [from, to] = args.filter(it => !it.startsWith('-'))

installPack(from, to, options).catch(e => {
   console.error(e)
   process.exit(1)
})

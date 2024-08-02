import { renderFrom } from '@pssbletrngle/assets-renderer'

async function run() {
   await renderFrom(['../resources', '../install/mods'], { output: '../web/public/icons', keep: true }, {})
}

run().catch(e => {
   console.error(e)
   process.exit(1)
})

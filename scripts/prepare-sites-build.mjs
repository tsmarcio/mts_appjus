import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'

await mkdir('dist/server', { recursive: true })
await mkdir('dist/.openai', { recursive: true })

await copyFile('.openai/hosting.json', 'dist/.openai/hosting.json')

const assets = await readdir('dist/assets')
const cssFile = assets.find((file) => file.endsWith('.css'))
const jsFile = assets.find((file) => file.endsWith('.js'))
const html = await readFile('dist/index.html', 'utf8')
const css = cssFile ? await readFile(`dist/assets/${cssFile}`, 'utf8') : ''
const js = jsFile ? await readFile(`dist/assets/${jsFile}`, 'utf8') : ''
const logo = await readFile('dist/brand/mts-appjus-logo.png')
const scriptTagPattern = new RegExp('<script type="module"[^>]+src="/assets/[^"]+"></script>')
const styleTagPattern = new RegExp('<link rel="stylesheet"[^>]+href="/assets/[^"]+">')

const safeJs = js.replaceAll('</script', '<\\/script')
const safeCss = css.replaceAll('</style', '<\\/style')

const inlinedHtml = html
  .replace(scriptTagPattern, `<script type="module">${safeJs}</script>`)
  .replace(styleTagPattern, `<style>${safeCss}</style>`)

const server = `const html = ${JSON.stringify(inlinedHtml)}
const logoBase64 = ${JSON.stringify(logo.toString('base64'))}

function base64ToBytes(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/brand/mts-appjus-logo.png') {
      return new Response(base64ToBytes(logoBase64), {
        headers: {
          'content-type': 'image/png',
          'cache-control': 'public, max-age=31536000, immutable',
        },
      })
    }

    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  },
}
`

await writeFile('dist/server/index.js', server)
await writeFile('dist/index.js', server)

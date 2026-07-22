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
const favicon = await readFile('dist/favicon.svg', 'utf8')
const icons = await readFile('dist/icons.svg', 'utf8')
const scriptTagPattern = new RegExp('<script type="module"[^>]+src="/assets/[^"]+"></script>')
const styleTagPattern = new RegExp('<link rel="stylesheet"[^>]+href="/assets/[^"]+">')

const safeJs = js.replaceAll('</script', '<\\/script')
const safeCss = css.replaceAll('</style', '<\\/style')
const textAssets = {
  '/favicon.svg': {
    content: favicon,
    contentType: 'image/svg+xml; charset=utf-8',
  },
  '/icons.svg': {
    content: icons,
    contentType: 'image/svg+xml; charset=utf-8',
  },
}

if (jsFile) {
  textAssets[`/assets/${jsFile}`] = {
    content: js,
    contentType: 'application/javascript; charset=utf-8',
  }
}

if (cssFile) {
  textAssets[`/assets/${cssFile}`] = {
    content: css,
    contentType: 'text/css; charset=utf-8',
  }
}

const inlinedHtml = html
  .replace(scriptTagPattern, () => `<script type="module">${safeJs}</script>`)
  .replace(styleTagPattern, () => `<style>${safeCss}</style>`)

const server = `const html = ${JSON.stringify(inlinedHtml)}
const textAssets = ${JSON.stringify(textAssets)}
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
    const textAsset = textAssets[url.pathname]

    if (textAsset) {
      return new Response(textAsset.content, {
        headers: {
          'content-type': textAsset.contentType,
          'cache-control': 'public, max-age=31536000, immutable',
        },
      })
    }

    if (url.pathname === '/brand/mts-appjus-logo.png') {
      return new Response(base64ToBytes(logoBase64), {
        headers: {
          'content-type': 'image/png',
          'cache-control': 'public, max-age=31536000, immutable',
        },
      })
    }

    const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || ''
    const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || ''
    const runtimeConfigScript = '<script>window.__MTS_APPJUS_CONFIG__=' + JSON.stringify({
      supabaseUrl,
      supabaseAnonKey,
    }) + '</script>'
    const responseHtml = html.replace('</head>', runtimeConfigScript + '</head>')

    return new Response(responseHtml, {
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

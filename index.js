const fastify = require('fastify')({
  logger: true,
  pluginTimeout: 100000 // 100 seconds
})
const rili2 = require('rili2')
const NodeCache = require('node-cache')
const releaseCache = new NodeCache( { stdTTL: process.env.TTL || 120, checkperiod: 5 } )
const token = process.env.GH_TOKEN

// TODO: repo daraff/rili loads the config from a config store and therefore we set it here again
//       this is not understandable and needs to be changed.
const Configstore = require('configstore')
const riliJson = require('./rili.json')
new Configstore('rili2', riliJson)

async function loadRelease() {
  fastify.log.info({msg: 'fetch release info', date: new Date().toISOString().slice(0, 19)})
  let result
  try {
    result = await rili2.getVersionFromConfig({token})
  } catch (e) {
    releaseCache.set('expire', 'expire')
    fastify.log.error(e)
    if (e.response?.status === 401) {
      const hint = 'maybe the github token is not set correctly'
      fastify.log.error({fn: 'rili2.getVersionFromConfig', err: e.message, errData: JSON.stringify(e.response?.data), hint})
      return page
    } else {
      fastify.log.error({fn: 'rili2.getVersionFromConfig', err: e.message, errData: JSON.stringify(e.response?.data)})
      return page
    }

  }
  const lines = result.map((line) => {
    if (line.type === 'header') return `<dt>${line.value}</dt>`
    if (line.type === 'data') return `
      <dd>${line.value.owner}/${line.value.repo} -> ${line.value.version}</dd>
    `
  })

  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <h2>Livingdocs Release Versions</h2>
      <dl>
        ${lines.join('\n')}
      </dl>
    </body>
    </html>
  `
  fastify.log.info('cache expired')
  releaseCache.set('expire', 'expire')
  return html
}

fastify.addHook('onReady', async function () {
  if (!token) fastify.log.error('please set environment variable GH_TOKEN (Github token)')
  page = await loadRelease()
  releaseCache.on('expired', async function(key, value) {
    page = await loadRelease()
  })
})

fastify.get('/', async function (req, reply) {
  reply.type('text/html').send(page)
})

fastify.listen(8080, '0.0.0.0', err => {
  if (err) throw err
})
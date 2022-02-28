const fastify = require('fastify')()
const rili2 = require('rili2')
const NodeCache = require('node-cache')
const releaseCache = new NodeCache( { stdTTL: 120, checkperiod: 5 } )
const token = process.env.GH_TOKEN

// TODO: repo daraff/rili loads the config from a config store and therefore we set it here again
//       this is not understandable and needs to be changed.
const Configstore = require('configstore')
const riliJson = require('./rili.json')
new Configstore('rili2', riliJson)

async function loadRelease() {
  console.log('load release info', new Date().toISOString().slice(0, 19))
  let result
  try {
    result = await rili2.getVersionFromConfig({token})
  } catch (e) {
    if (e.response.status === 401) {
      const info = 'maybe the github token is not set correctly'
      const message = `rili2.getVersionFromConfig: ${e.message} | ${JSON.stringify(e.response.data)} | ${info}`
      console.log(message)
      return message
    } else {
      const message = `rili2.getVersionFromConfig: ${e.message} | ${JSON.stringify(e.response.data)}`
      console.log(message)
      return message
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
  releaseCache.set('expire', 'Im expired')
  return html
}

fastify.addHook('onReady', async function () {
  if (!token) throw new Error('please set environment variable GH_TOKEN (Github token)')
  page = await loadRelease()
  releaseCache.on('expired', async function(key, value) {
    page = await loadRelease()
  })
})

fastify.register(require('fastify-multipart'))

fastify.get('/', async function (req, reply) {
  reply.type('text/html').send(page)
})

fastify.listen(8080, '0.0.0.0', err => {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
  console.log(`local development http://localhost:${fastify.server.address().port}`)
})
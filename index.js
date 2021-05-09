const fastify = require('fastify')()

fastify.register(require('fastify-multipart'))

fastify.get('/', async function (req, reply) {
  const response = {hello: 'world'}
  reply.send(response)
})

fastify.listen(8080, err => {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
  console.log(`local development http://localhost:${fastify.server.address().port}`)
})
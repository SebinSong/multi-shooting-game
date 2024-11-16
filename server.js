const http = require('http')

const app = require('./app')
const server = http.createServer(app)
const PORT = 5050

server.listen(PORT, () => {
  console.log(`server is listening on port ${PORT}...`)
})

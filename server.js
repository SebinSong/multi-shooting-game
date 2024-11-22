const http = require('http')

const app = require('./app')
const server = http.createServer(app)
const { setupSocketIO } = require('./socket.js')
const PORT = 5050

// attach socket.io to http server
setupSocketIO(server)

server.listen(PORT, () => {
  console.log(`server is listening on port ${PORT}...`)
})

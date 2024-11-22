const { Server } = require('socket.io')
const backendPlayers = {}
const playerColorset = ['#618C03', '#F2B705', '#D97904', '#D92B04', '#F27983']
const getColor = () => {
  const pArr = Object.values(backendPlayers)
  return playerColorset.find(color => pArr.every(p => p.color !== color))
}

// events
const UPDATE_PLAYERS = 'update-players'
const PLAYER_DISCONNECTED = 'player-disconnected'
const KEYDOWN = 'keydown'
const PLAYER_SPEED = 3

function setupSocketIO (server) {
  const io = new Server(server, {
    pingInterval: 2500,
    pingTimeout: 5000
  })

  io.on('connection', socket => {
    backendPlayers[socket.id] = {
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 400,
      color: getColor(),
      sequenceNumber: 0
    }
    console.log('New player connected - ', socket.id)

    socket.on('disconnect', () => {
      socket.broadcast.emit(PLAYER_DISCONNECTED, socket.id)
      
      delete backendPlayers[socket.id]
    })

    socket.on(KEYDOWN, (data) => {
      const { x = 0, y = 0, sequenceNumber } = data
      const player = backendPlayers[socket.id]

      if (player) {
        player.x += x * PLAYER_SPEED
        player.y += y * PLAYER_SPEED
        player.sequenceNumber = sequenceNumber
      }
    })
  })

  setInterval(() => {
    io.emit(UPDATE_PLAYERS, backendPlayers)
  }, 15)
}

module.exports = {
  setupSocketIO
}
